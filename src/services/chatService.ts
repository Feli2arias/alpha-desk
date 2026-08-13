import type { ChatContext, ChatMessage } from '@/types'
import { PICK_SEEDS, type PickSeed } from '@/data/picks'
import { COMPANY_BY_TICKER } from '@/data/companies'
import { NEWS_SEEDS } from '@/data/news'
import {
  GLOBAL_ANSWERS,
  GLOBAL_FALLBACKS,
  GLOBAL_INTENTS,
  STOCK_INTENTS,
  type Intent,
} from '@/data/chatResponses'
import { formatNumber, formatPercent, formatPrice } from '@/lib/format'
import { delay, randomDelay } from './latency'

/**
 * ÚNICA fuente de respuestas de chat para la UI.
 *
 * === PARA CONECTAR LA CLAUDE API ===
 * Reemplazar `sendMessage` por una llamada al backend que arme el system
 * prompt a partir de `context` (global vs. una acción puntual) y mande el
 * historial. La firma y el tipo `ChatMessage` no cambian.
 */

let messageCounter = 0

function nextId(): string {
  messageCounter += 1
  return `msg-${Date.now()}-${messageCounter}`
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function matchIntent(message: string, intents: readonly Intent[]): string | null {
  const normalized = normalize(message)
  let best: { id: string; score: number } | null = null

  for (const intent of intents) {
    const score = intent.keywords.reduce(
      (sum, keyword) => (normalized.includes(normalize(keyword)) ? sum + keyword.length : sum),
      0,
    )
    if (score > 0 && (!best || score > best.score)) best = { id: intent.id, score }
  }

  return best?.id ?? null
}

/** Respuestas del chat contextual, construidas desde la tesis real de la acción. */
function buildStockAnswer(intent: string | null, seed: PickSeed): string {
  const company = COMPANY_BY_TICKER[seed.ticker]
  const name = company?.name ?? seed.ticker
  const spot = company?.basePrice ?? seed.thesis.targetPrice
  const upside = ((seed.thesis.targetPrice - spot) / spot) * 100
  const downside = ((spot - seed.thesis.stopLoss) / spot) * 100
  const bullish = seed.metrics.filter((metric) => metric.verdict === 'bullish')
  const bearish = seed.metrics.filter((metric) => metric.verdict === 'bearish')
  const news = NEWS_SEEDS.filter((item) => item.ticker === seed.ticker)

  switch (intent) {
    case 'why':
      return `${seed.thesis.headline}\n\n${seed.thesis.paragraphs[0]}\n\nEn una línea: es el puesto ${seed.rank} del ranking con ${seed.score}/100 de convicción y ${seed.allocationPercent}% de asignación sugerida.`

    case 'risk':
      return `Los riesgos que identifiqué para ${seed.ticker}, en orden:\n\n${seed.thesis.risks
        .map((risk, index) => `**${index + 1}.** ${risk}`)
        .join(
          '\n\n',
        )}\n\nDel lado de las métricas, las que juegan en contra son: ${bearish.length ? bearish.map((metric) => `${metric.label} (${metric.value})`).join(', ') : 'ninguna, todas las métricas evaluadas dieron neutral o favorable'}.\n\nEl stop está en ${formatPrice(seed.thesis.stopLoss)}, un ${formatPercent(downside, false)} abajo del precio actual.`

    case 'target':
      return `El precio objetivo es ${formatPrice(seed.thesis.targetPrice)}, un ${formatPercent(upside, false)} arriba del spot de ${formatPrice(spot)}. El stop está en ${formatPrice(seed.thesis.stopLoss)} (${formatPercent(downside, false)} abajo), así que la relación riesgo/beneficio queda en ${formatNumber(upside / downside)} a 1.\n\n${seed.thesis.paragraphs[seed.thesis.paragraphs.length - 1]}\n\nHorizonte: ${seed.thesis.horizon}.`

    case 'metrics':
      return `De las ${seed.metrics.length} métricas que evaluó el Research Agent para ${seed.ticker}, ${bullish.length} jugaron a favor y ${bearish.length} en contra.\n\n**A favor:**\n${bullish
        .map((metric) => `· ${metric.label}: ${metric.value} — ${metric.note}`)
        .join(
          '\n',
        )}\n\n**En contra:**\n${bearish.length ? bearish.map((metric) => `· ${metric.label}: ${metric.value} — ${metric.note}`).join('\n') : '· Ninguna métrica dio señal negativa.'}`

    case 'news':
      return `Encontré ${news.length} noticias relevantes de ${seed.ticker} en las últimas 48 horas.\n\n${news
        .slice(0, 3)
        .map(
          (item) =>
            `**${item.headline}**\n${item.source} · sentimiento ${item.sentiment === 'positive' ? 'positivo' : item.sentiment === 'negative' ? 'negativo' : 'neutral'} · relevancia ${item.relevance}/100\n${item.summary}`,
        )
        .join('\n\n')}`

    case 'horizon':
      return `El horizonte de la tesis es de ${seed.thesis.horizon}. Convicción: ${seed.thesis.conviction}.\n\nLos catalizadores que podrían acelerar el recorrido son:\n\n${seed.thesis.catalysts
        .map((catalyst) => `· ${catalyst}`)
        .join('\n')}`

    case 'sell':
      return `Para ${seed.ticker} el stop está en ${formatPrice(seed.thesis.stopLoss)} — ${formatPercent(downside, false)} abajo del precio actual. No es un porcentaje redondo: está puesto donde la tesis quedaría invalidada.\n\nLo que invalidaría la tesis antes que el precio:\n\n${seed.thesis.risks
        .slice(0, 2)
        .map((risk) => `· ${risk}`)
        .join(
          '\n',
        )}\n\nSi cualquiera de esos dos se materializa, la salida es inmediata sin esperar al stop.`

    case 'buy_now':
      return `Sobre el timing: la señal es **${seed.signal === 'strong_buy' ? 'Comprar fuerte' : seed.signal === 'buy' ? 'Comprar' : 'Mantener'}** con ${seed.allocationPercent}% de asignación sugerida.\n\n${seed.thesis.paragraphs[seed.thesis.paragraphs.length - 1]}\n\nRecordá que esto es un mockup con datos falsos: no es asesoramiento financiero.`

    default:
      return `Tengo cargada toda la tesis de ${name} (${seed.ticker}): ${seed.metrics.length} métricas evaluadas, ${news.length} noticias procesadas, precio objetivo ${formatPrice(seed.thesis.targetPrice)} y horizonte de ${seed.thesis.horizon}.\n\nPodés preguntarme por qué la eligió el agente, cuáles son los riesgos, qué dicen las métricas, qué noticias encontró o dónde está el stop.`
  }
}

function buildGlobalAnswer(intent: string | null): string {
  if (intent && GLOBAL_ANSWERS[intent]) {
    const options = GLOBAL_ANSWERS[intent]
    return options[Math.floor(Math.random() * options.length)]
  }
  return GLOBAL_FALLBACKS[Math.floor(Math.random() * GLOBAL_FALLBACKS.length)]
}

export const chatService = {
  /** Mensaje de bienvenida según el contexto del chat. */
  getGreeting(context: ChatContext): ChatMessage {
    if (context.scope === 'stock' && context.ticker) {
      const seed = PICK_SEEDS.find((item) => item.ticker === context.ticker)
      const company = context.ticker ? COMPANY_BY_TICKER[context.ticker] : undefined
      return {
        id: nextId(),
        role: 'agent',
        ticker: context.ticker,
        createdAt: new Date().toISOString(),
        content: seed
          ? `Listo para hablar de **${company?.name ?? context.ticker}**. Tengo cargada la tesis completa, las ${seed.metrics.length} métricas del Research Agent y las noticias del run de hoy.\n\nProbá con "¿por qué la elegiste?", "¿cuáles son los riesgos?" o "¿dónde está el stop?".`
          : `No tengo tesis cargada para ${context.ticker} en el run de hoy, así que solo puedo hablarte de datos de mercado.`,
      }
    }

    return {
      id: nextId(),
      role: 'agent',
      createdAt: new Date().toISOString(),
      content:
        'Hola. Soy el agente del pipeline — tengo el run de hoy completo en contexto: 500 acciones analizadas, 47 que pasaron filtros y las 10 seleccionadas con su tesis.\n\nPodés pedirme un análisis nuevo de cualquier acción (probá con **"revisá NVDA"** o **"¿qué opinás de Broadcom?"**): el Research Agent hace el trabajo de campo y el Decision Agent te da el veredicto.\n\nTambién puedo hablarte del Top 10, de los riesgos del portafolio o del contexto de mercado.',
    }
  },

  /**
   * Devuelve la respuesta del agente. `history` no se usa en el mock, pero
   * está en la firma porque la API real lo va a necesitar.
   */
  async sendMessage(
    context: ChatContext,
    message: string,
    _history: readonly ChatMessage[] = [],
  ): Promise<ChatMessage> {
    void _history

    const content =
      context.scope === 'stock' && context.ticker
        ? buildStockAnswerFor(context.ticker, message)
        : buildGlobalAnswer(matchIntent(message, GLOBAL_INTENTS))

    // El "tiempo de escritura" escala con el largo de la respuesta.
    const typingMs = Math.min(900 + content.length * 4.5, 3400) + randomDelay(0, 500)

    return delay(
      {
        id: nextId(),
        role: 'agent' as const,
        content,
        createdAt: new Date().toISOString(),
        ticker: context.ticker,
      },
      typingMs,
    )
  },

  /** Sugerencias mostradas como chips debajo del input. */
  getSuggestions(context: ChatContext): string[] {
    if (context.scope === 'stock' && context.ticker) {
      return [
        `Revisá ${context.ticker}`,
        '¿Por qué la elegiste?',
        '¿Cuáles son los riesgos?',
        '¿Dónde está el stop?',
        '¿Qué dicen las métricas?',
      ]
    }
    return [
      'Revisá NVDA',
      '¿Qué opinás de Broadcom?',
      '¿Cómo armaste el Top 10 de hoy?',
      '¿Cuáles son los riesgos del portafolio?',
      '¿Cómo está el mercado?',
    ]
  },
}

function buildStockAnswerFor(ticker: string, message: string): string {
  const seed = PICK_SEEDS.find((item) => item.ticker === ticker)
  if (!seed) {
    return `No tengo tesis cargada para ${ticker} en el run de hoy — no pasó los filtros del Research Agent o está fuera del universo analizado.`
  }
  return buildStockAnswer(matchIntent(message, STOCK_INTENTS), seed)
}

export function createUserMessage(content: string, ticker?: string): ChatMessage {
  return {
    id: nextId(),
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
    ticker,
  }
}
