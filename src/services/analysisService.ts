import type { AnalysisRun, AnalysisStep, ChatMode, Metric, Signal, Verdict } from '@/types'
import { COMPANY_BY_TICKER, type CompanySeed } from '@/data/companies'
import { PICK_SEEDS } from '@/data/picks'
import { NEWS_SEEDS } from '@/data/news'
import {
  ANALYSIS_PLAN,
  DECISION_MODEL,
  PEER_COUNT_BY_SECTOR,
  RESEARCH_MODEL,
} from '@/data/analysisPlan'
import { createRng, seedFromString } from '@/lib/random'
import { formatCompact, formatNumber, formatPercent, formatPrice } from '@/lib/format'
import { resolveTicker } from '@/lib/tickers'
import { marketDataService } from './marketDataService'
import { delay } from './latency'

/**
 * ÚNICA fuente de análisis on-demand para la UI.
 *
 * El usuario pide "revisá NVDA" y esto ejecuta las dos etapas del pipeline
 * sobre una sola acción, emitiendo el estado tras cada paso para que la UI
 * lo muestre en vivo.
 *
 * === PARA CONECTAR EL PIPELINE REAL ===
 * `run()` pasa a abrir un stream (SSE o WebSocket) contra el orquestador y a
 * reenviar cada evento por `onUpdate`. El tipo `AnalysisRun` es el contrato
 * y no cambia, así que ningún componente necesita tocarse.
 */

let runCounter = 0

/* --- Datos derivados, deterministas por ticker --- */

interface Derived {
  rsi: number
  aboveSma: number
  newsCount: number
  positiveNews: number
  negativeNews: number
  sources: number
  peers: number
  peerDiscount: number
  quarters: number
  contextTokens: number
}

function derive(seed: CompanySeed): Derived {
  const rng = createRng(seedFromString(`analysis:${seed.ticker}`))
  const realNews = NEWS_SEEDS.filter((item) => item.ticker === seed.ticker).length

  const newsCount = realNews > 0 ? realNews + Math.round(rng() * 14) + 6 : Math.round(rng() * 18) + 5
  const positiveNews = Math.round(newsCount * (0.42 + rng() * 0.3))
  const negativeNews = Math.round((newsCount - positiveNews) * (0.25 + rng() * 0.35))

  return {
    rsi: Math.round(38 + rng() * 34),
    aboveSma: Math.round((rng() * 26 - 4) * 10) / 10,
    newsCount,
    positiveNews,
    negativeNews,
    sources: Math.round(6 + rng() * 12),
    peers: PEER_COUNT_BY_SECTOR[seed.sector] ?? 6,
    peerDiscount: Math.round((rng() * 34 - 12) * 10) / 10,
    quarters: 8,
    contextTokens: Math.round(3800 + rng() * 4200),
  }
}

/** Métricas sintéticas para acciones que no están en el Top 10 del día. */
function synthesizeMetrics(seed: CompanySeed, derived: Derived): Metric[] {
  const rng = createRng(seedFromString(`metrics:${seed.ticker}`))
  const pe = Math.round((14 + rng() * 44) * 10) / 10
  const sectorPe = Math.round((16 + rng() * 26) * 10) / 10
  const growth = Math.round((seed.drift * 100 * (0.6 + rng() * 0.9)) * 10) / 10
  const margin = Math.round((18 + rng() * 46) * 10) / 10
  const debt = Math.round((0.1 + rng() * 1.5) * 100) / 100
  const peg = Math.round((pe / Math.max(growth, 4)) * 100) / 100

  return [
    {
      key: 'pe',
      label: 'P/E (forward)',
      value: `${formatNumber(pe)}x`,
      benchmark: `Sector ${formatNumber(sectorPe)}x`,
      verdict: pe < sectorPe ? 'bullish' : pe > sectorPe * 1.35 ? 'bearish' : 'neutral',
      note:
        pe < sectorPe
          ? 'Cotiza por debajo de la media de su sector'
          : 'Paga un premium respecto a sus comparables',
    },
    {
      key: 'peg',
      label: 'PEG ratio',
      value: formatNumber(peg),
      benchmark: '< 1 es favorable',
      verdict: peg < 1 ? 'bullish' : peg > 2 ? 'bearish' : 'neutral',
      note: peg < 1 ? 'El crecimiento va más rápido que el múltiplo' : 'El múltiplo se adelantó al crecimiento',
    },
    {
      key: 'growth',
      label: 'Crecimiento de ingresos',
      value: formatPercent(growth),
      benchmark: 'Sector +9,4%',
      verdict: growth > 14 ? 'bullish' : growth < 5 ? 'bearish' : 'neutral',
      note: 'Interanual, últimos cuatro trimestres',
    },
    {
      key: 'margin',
      label: 'Margen operativo',
      value: formatPercent(margin, false),
      benchmark: 'Sector 21,8%',
      verdict: margin > 30 ? 'bullish' : margin < 14 ? 'bearish' : 'neutral',
      note: margin > 30 ? 'Estructura de costos con apalancamiento operativo' : 'Margen en línea con la industria',
    },
    {
      key: 'rsi',
      label: 'RSI (14)',
      value: formatNumber(derived.rsi),
      benchmark: '30–70 es zona neutral',
      verdict: derived.rsi > 72 ? 'bearish' : derived.rsi < 45 ? 'bullish' : 'neutral',
      note: derived.rsi > 72 ? 'Sobrecomprada en el corto plazo' : 'Sin extremos de sobrecompra',
    },
    {
      key: 'debt',
      label: 'Deuda / EBITDA',
      value: `${formatNumber(debt)}x`,
      benchmark: '< 2x es saludable',
      verdict: debt < 1 ? 'bullish' : debt > 2.2 ? 'bearish' : 'neutral',
      note: debt < 1 ? 'Balance sin presión de refinanciación' : 'Apalancamiento manejable pero a vigilar',
    },
  ]
}

function signalFromScore(score: number): Signal {
  if (score >= 82) return 'strong_buy'
  if (score >= 66) return 'buy'
  return 'hold'
}

/** Veredicto para una acción que ya viene con tesis del run diario. */
function verdictFromPick(seed: CompanySeed, spot: number, derived: Derived): Verdict {
  const pick = PICK_SEEDS.find((item) => item.ticker === seed.ticker)
  if (!pick) throw new Error(`Sin tesis para ${seed.ticker}`)

  return {
    ticker: seed.ticker,
    signal: pick.signal,
    score: pick.score,
    headline: pick.thesis.headline,
    rationale: pick.thesis.paragraphs.slice(0, 2),
    catalysts: pick.thesis.catalysts,
    risks: pick.thesis.risks,
    spotPrice: spot,
    targetPrice: pick.thesis.targetPrice,
    stopLoss: pick.thesis.stopLoss,
    horizon: pick.thesis.horizon,
    conviction: pick.thesis.conviction,
    allocationPercent: pick.allocationPercent,
    metrics: pick.metrics,
    newsCount: derived.newsCount,
    inTopPicks: true,
    rank: pick.rank,
  }
}

/** Veredicto sintetizado para el resto del universo. */
function synthesizeVerdict(seed: CompanySeed, spot: number, derived: Derived): Verdict {
  const rng = createRng(seedFromString(`verdict:${seed.ticker}`))
  const metrics = synthesizeMetrics(seed, derived)

  const bullish = metrics.filter((metric) => metric.verdict === 'bullish').length
  const bearish = metrics.filter((metric) => metric.verdict === 'bearish').length
  const newsBias = (derived.positiveNews - derived.negativeNews) / Math.max(derived.newsCount, 1)

  const raw = 52 + bullish * 6 - bearish * 7 + newsBias * 14 + seed.drift * 18 - seed.volatility * 180
  const score = Math.max(34, Math.min(88, Math.round(raw)))
  const signal = signalFromScore(score)

  const upside = 6 + (score - 34) * 0.42 + rng() * 5
  const downside = 7 + seed.volatility * 190
  const targetPrice = Math.round(spot * (1 + upside / 100) * 100) / 100
  const stopLoss = Math.round(spot * (1 - downside / 100) * 100) / 100

  const growthMetric = metrics.find((metric) => metric.key === 'growth')
  const peMetric = metrics.find((metric) => metric.key === 'pe')

  const rationale = [
    `${seed.name} no formó parte del Top 10 de hoy, así que corrí el análisis completo desde cero. De las ${metrics.length} métricas evaluadas, ${bullish} jugaron a favor y ${bearish} en contra. El punto que define la tesis es ${peMetric?.label.toLowerCase()} en ${peMetric?.value} contra ${peMetric?.benchmark.toLowerCase()}: ${peMetric?.verdict === 'bullish' ? 'el mercado está pagando menos por esta compañía que por sus pares, y no encontré un motivo operativo que lo justifique' : peMetric?.verdict === 'bearish' ? 'el premium respecto a los comparables deja poco margen para un traspié de ejecución' : 'la valuación está donde debería estar, así que el retorno tiene que venir de las ganancias, no de la expansión de múltiplo'}.`,
    `Del lado del negocio, el crecimiento de ingresos viene en ${growthMetric?.value} interanual con un margen operativo de ${metrics.find((metric) => metric.key === 'margin')?.value}. Técnicamente la acción cotiza ${derived.aboveSma >= 0 ? `${formatPercent(derived.aboveSma)} sobre` : `${formatPercent(Math.abs(derived.aboveSma), false)} debajo de`} su media de 200 ruedas con un RSI de ${derived.rsi}. De las ${derived.newsCount} noticias de las últimas 48 horas, ${derived.positiveNews} tuvieron sesgo positivo y ${derived.negativeNews} negativo. ${signal === 'hold' ? 'Con ese cuadro, la conclusión es esperar: la tesis no está rota, pero tampoco hay un catalizador que justifique entrar hoy.' : `Con ese cuadro, el objetivo queda en ${formatPrice(targetPrice)} — ${formatPercent(upside)} sobre el spot — con invalidación en ${formatPrice(stopLoss)}.`}`,
  ]

  return {
    ticker: seed.ticker,
    signal,
    score,
    headline:
      signal === 'strong_buy'
        ? `Convicción alta en ${seed.ticker}: la valuación no acompañó al crecimiento`
        : signal === 'buy'
          ? `${seed.ticker} entra con posición acotada — la tesis se sostiene, el margen de error no`
          : `${seed.ticker} queda en observación: sin catalizador claro en el horizonte del mandato`,
    rationale,
    catalysts: [
      `Próximo reporte de resultados — el consenso ya descuenta ${formatPercent(Math.round(seed.drift * 60 * 10) / 10)} de crecimiento`,
      `Rotación sectorial hacia ${seed.sector.toLowerCase()} si se sostiene el flujo de las últimas semanas`,
      `${derived.peers} comparables reportan antes que ${seed.ticker}: van a marcar la expectativa del mercado`,
    ],
    risks: [
      `Volatilidad diaria de ${formatPercent(Math.round(seed.volatility * 1000) / 10, false)} — el tamaño de posición tiene que reflejarlo`,
      derived.negativeNews > 0
        ? `${derived.negativeNews} de las ${derived.newsCount} noticias del período tuvieron sesgo negativo`
        : 'Cobertura de noticias escasa: menos señales independientes para validar la tesis',
      bearish > 0
        ? `Métricas en contra: ${metrics
            .filter((metric) => metric.verdict === 'bearish')
            .map((metric) => metric.label)
            .join(', ')}`
        : 'Ninguna métrica dio señal negativa, lo que suele indicar que el mercado ya lo sabe',
    ],
    spotPrice: spot,
    targetPrice,
    stopLoss,
    horizon: signal === 'hold' ? 'Revisar en 4 a 6 semanas' : '3 a 9 meses',
    conviction:
      signal === 'strong_buy'
        ? 'Alta — las métricas y las noticias apuntan en la misma dirección'
        : signal === 'buy'
          ? 'Media — la tesis depende de que se sostenga el crecimiento reportado'
          : 'Baja — falta un catalizador verificable',
    allocationPercent: signal === 'strong_buy' ? 9 : signal === 'buy' ? 6 : 0,
    metrics,
    newsCount: derived.newsCount,
    inTopPicks: false,
  }
}

/** Texto que deja cada paso al completarse. */
function stepResult(stepId: string, seed: CompanySeed, spot: number, derived: Derived): string {
  const marketCap = spot * seed.sharesOutstanding
  const inTop = PICK_SEEDS.some((item) => item.ticker === seed.ticker)

  switch (stepId) {
    case 'identify':
      return `${seed.name} · ${seed.sector} · cap. USD ${formatCompact(marketCap)}`
    case 'prices':
      return `RSI ${derived.rsi} · cotiza ${derived.aboveSma >= 0 ? formatPercent(derived.aboveSma) : formatPercent(derived.aboveSma)} respecto a la SMA200`
    case 'fundamentals':
      return `${derived.quarters} trimestres leídos · volumen medio ${formatCompact(seed.avgVolume)} acciones`
    case 'news':
      return `${derived.newsCount} artículos de ${derived.sources} fuentes · ${derived.positiveNews} positivos, ${derived.negativeNews} negativos`
    case 'peers':
      return `${derived.peers} comparables · múltiplo ${derived.peerDiscount >= 0 ? `${formatPercent(derived.peerDiscount, false)} sobre` : `${formatPercent(Math.abs(derived.peerDiscount), false)} bajo`} la media del sector`
    case 'handoff':
      return `Paquete de ${formatCompact(derived.contextTokens)} tokens entregado`
    case 'mandate':
      return inTop
        ? 'Ya estaba en el Top 10 de hoy — se revalida contra el precio actual'
        : 'No estaba en el Top 10: se evalúa como candidata fuera de ranking'
    case 'scenarios':
      return 'Tres escenarios construidos con probabilidad asignada a cada uno'
    case 'invalidation':
      return 'Punto de invalidación definido sobre la tesis, no sobre un porcentaje redondo'
    case 'verdict':
      return 'Veredicto listo'
    default:
      return ''
  }
}

/** Los pasos que corresponden al modo elegido. */
function planFor(mode: ChatMode) {
  if (mode === 'research') return ANALYSIS_PLAN.filter((step) => step.role === 'research')
  if (mode === 'decision') return ANALYSIS_PLAN.filter((step) => step.role === 'decision')
  return ANALYSIS_PLAN
}

function initialSteps(mode: ChatMode): AnalysisStep[] {
  return planFor(mode).map((step) => ({
    id: step.id,
    role: step.role,
    label: step.label,
    status: 'pending' as const,
  }))
}

/** Cierre del Research Agent cuando no sigue el Decision Agent. */
function researchSummary(seed: CompanySeed, derived: Derived): string {
  const inTop = PICK_SEEDS.some((item) => item.ticker === seed.ticker)
  return `Terminé el research de **${seed.ticker}**. Encontré ${derived.newsCount} noticias en ${derived.sources} fuentes (${derived.positiveNews} positivas, ${derived.negativeNews} negativas), leí ${derived.quarters} trimestres de fundamentals y comparé contra ${derived.peers} pares del sector. RSI en ${derived.rsi} y el múltiplo queda ${derived.peerDiscount >= 0 ? 'por encima' : 'por debajo'} de la media sectorial.\n\n${inTop ? 'La acción ya venía con tesis del run de hoy.' : 'No estaba en el Top 10, así que no hay tesis previa.'} No emito veredicto: eso lo decide el Decision Agent.`
}

export const analysisService = {
  /** Traduce lo que escribió el usuario a un ticker del universo. */
  resolve(input: string): string | null {
    return resolveTicker(input)
  },

  /**
   * Id del run. Lo pide el llamador ANTES de arrancar para poder referenciarlo
   * de inmediato (el mensaje del chat necesita el id en el mismo tick).
   */
  createRunId(ticker: string): string {
    runCounter += 1
    return `run-${ticker.toUpperCase()}-${Date.now()}-${runCounter}`
  },

  /**
   * Corre el análisis completo sobre una acción, bajo el `id` que le dio el
   * llamador. `onUpdate` recibe una copia nueva del run tras cada cambio de
   * estado: el llamador nunca muta el objeto que recibe.
   */
  async run(
    ticker: string,
    id: string,
    mode: ChatMode,
    onUpdate: (run: AnalysisRun) => void,
  ): Promise<AnalysisRun> {
    const upper = ticker.toUpperCase()
    const seed = COMPANY_BY_TICKER[upper]

    if (!seed) {
      const failed: AnalysisRun = {
        id,
        ticker: upper,
        mode,
        companyName: upper,
        brandColor: '#8e9aa6',
        sector: '—',
        status: 'error',
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        steps: [],
        verdict: null,
        error: `${upper} no está en el universo del mockup. Probá con NVDA, MSFT, META, AMD, PLTR, AVGO, COIN, JPM o UBER.`,
        researchModel: RESEARCH_MODEL,
        decisionModel: DECISION_MODEL,
      }
      onUpdate(failed)
      return failed
    }

    const derived = derive(seed)
    // El precio del veredicto sale del proveedor real; el seed sólo cubre el
    // caso de que la API no responda.
    const liveQuote = await marketDataService.getQuote(upper)
    const spot = liveQuote?.price ?? seed.basePrice

    let run: AnalysisRun = {
      id,
      ticker: upper,
      mode,
      companyName: seed.name,
      brandColor: seed.brandColor,
      sector: seed.sector,
      status: 'queued',
      startedAt: new Date().toISOString(),
      steps: initialSteps(mode),
      verdict: null,
      researchModel: RESEARCH_MODEL,
      decisionModel: DECISION_MODEL,
    }
    onUpdate(run)

    for (const planStep of planFor(mode)) {
      run = {
        ...run,
        status: planStep.role === 'research' ? 'researching' : 'deciding',
        steps: run.steps.map((step) =>
          step.id === planStep.id ? { ...step, status: 'running' } : step,
        ),
      }
      onUpdate(run)

      await delay(null, planStep.durationMs)

      run = {
        ...run,
        steps: run.steps.map((step) =>
          step.id === planStep.id
            ? { ...step, status: 'done', result: stepResult(planStep.id, seed, spot, derived) }
            : step,
        ),
      }
      onUpdate(run)
    }

    if (mode === 'research') {
      run = {
        ...run,
        status: 'done',
        finishedAt: new Date().toISOString(),
        researchSummary: researchSummary(seed, derived),
      }
      onUpdate(run)
      return run
    }

    const inTopPicks = PICK_SEEDS.some((item) => item.ticker === upper)
    const verdict = inTopPicks
      ? verdictFromPick(seed, spot, derived)
      : synthesizeVerdict(seed, spot, derived)

    run = {
      ...run,
      status: 'done',
      finishedAt: new Date().toISOString(),
      verdict,
    }
    onUpdate(run)

    return run
  },
}
