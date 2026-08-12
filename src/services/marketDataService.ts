import type { Candle, Company, MarketIndex, Quote, Timeframe } from '@/types'
import { COMPANY_BY_TICKER, COMPANY_SEEDS } from '@/data/companies'
import { INDEX_SEEDS } from '@/data/indices'
import { generateSeries, generateSparkline } from '@/data/seriesGenerator'
import { delay, randomDelay } from './latency'

/**
 * ÚNICA fuente de datos de mercado para la UI.
 *
 * === PARA CONECTAR UNA API REAL ===
 * Reemplazar el cuerpo de cada función por el fetch correspondiente
 * (Polygon / Finnhub / IBKR). Las firmas y los tipos no cambian, así que
 * ningún componente necesita tocarse.
 */

/** Estado mutable de precios: acá viven los ticks simulados de la sesión. */
const livePrices = new Map<string, number>(
  COMPANY_SEEDS.map((seed) => [seed.ticker, seed.basePrice]),
)

const liveIndices = new Map<string, MarketIndex>(
  INDEX_SEEDS.map((index) => [index.symbol, { ...index }]),
)

function toCompany(ticker: string): Company | null {
  const seed = COMPANY_BY_TICKER[ticker]
  if (!seed) return null
  return {
    ticker: seed.ticker,
    name: seed.name,
    sector: seed.sector,
    brandColor: seed.brandColor,
  }
}

function buildQuote(ticker: string): Quote | null {
  const seed = COMPANY_BY_TICKER[ticker]
  if (!seed) return null

  const price = livePrices.get(ticker) ?? seed.basePrice
  // El cierre previo se deriva del seed para que el % del día sea estable.
  const previousClose = seed.basePrice / (1 + openingChangePercent(seed.ticker) / 100)
  const change = price - previousClose
  const dayRange = seed.basePrice * seed.volatility

  return {
    ticker,
    price: round2(price),
    change: round2(change),
    changePercent: round2((change / previousClose) * 100),
    dayHigh: round2(Math.max(price, seed.basePrice + dayRange * 0.6)),
    dayLow: round2(Math.min(price, seed.basePrice - dayRange * 0.7)),
    volume: seed.avgVolume,
    marketCap: Math.round(price * seed.sharesOutstanding),
    updatedAt: new Date().toISOString(),
  }
}

/** Cambio del día "de apertura", fijo por ticker para que no salte entre renders. */
function openingChangePercent(ticker: string): number {
  const seed = COMPANY_BY_TICKER[ticker]
  if (!seed) return 0
  // Derivado del hash del ticker: determinista, en un rango plausible.
  let hash = 0
  for (let i = 0; i < ticker.length; i += 1) hash = (hash * 31 + ticker.charCodeAt(i)) >>> 0
  const normalized = (hash % 1000) / 1000 // 0..1
  const spread = seed.volatility * 100 * 1.4
  return round2((normalized - 0.42) * spread * 2)
}

export const marketDataService = {
  /** Lista completa del universo disponible (para buscador y watchlist). */
  async listCompanies(): Promise<Company[]> {
    const companies = COMPANY_SEEDS.map((seed) => toCompany(seed.ticker)).filter(
      (company): company is Company => company !== null,
    )
    return delay(companies, randomDelay(120, 240))
  },

  async getCompany(ticker: string): Promise<Company | null> {
    return delay(toCompany(ticker), randomDelay(80, 160))
  },

  async getQuote(ticker: string): Promise<Quote | null> {
    return delay(buildQuote(ticker), randomDelay(120, 280))
  },

  async getQuotes(tickers: readonly string[]): Promise<Quote[]> {
    const quotes = tickers
      .map((ticker) => buildQuote(ticker))
      .filter((quote): quote is Quote => quote !== null)
    return delay(quotes, randomDelay(160, 340))
  },

  async getSeries(ticker: string, range: Timeframe): Promise<Candle[]> {
    return delay(generateSeries(ticker, range, Date.now()), randomDelay(220, 460))
  },

  async getSparkline(ticker: string): Promise<number[]> {
    return delay(generateSparkline(ticker), randomDelay(80, 180))
  },

  async getIndices(): Promise<MarketIndex[]> {
    return delay([...liveIndices.values()], randomDelay(120, 260))
  },

  /**
   * Aplica un tick de mercado: mueve precios e índices una fracción de su
   * volatilidad. Con una API real esto lo reemplaza un WebSocket y la firma
   * del suscriptor (`subscribe`) queda igual.
   */
  tick(): void {
    for (const seed of COMPANY_SEEDS) {
      const current = livePrices.get(seed.ticker) ?? seed.basePrice
      const shock = (Math.random() - 0.5) * seed.volatility * 0.55
      const next = current * (1 + shock)
      // Ancla suave al basePrice para que la sesión no derive indefinidamente.
      const anchored = next + (seed.basePrice - next) * 0.04
      livePrices.set(seed.ticker, anchored)
    }

    for (const [symbol, index] of liveIndices) {
      const seed = INDEX_SEEDS.find((item) => item.symbol === symbol)
      if (!seed) continue
      const shock = (Math.random() - 0.5) * 0.0009
      const value = index.value * (1 + shock)
      const anchored = value + (seed.value - value) * 0.05
      const change = anchored - (seed.value - seed.change)
      liveIndices.set(symbol, {
        ...index,
        value: round2(anchored),
        change: round2(change),
        changePercent: round2((change / (seed.value - seed.change)) * 100),
      })
    }

    for (const listener of listeners) listener()
  },

  /** Suscripción a ticks. Devuelve la función de baja. */
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  /** Lectura sincrónica del último precio conocido (para sparklines en vivo). */
  peekPrice(ticker: string): number | undefined {
    return livePrices.get(ticker)
  },
}

const listeners = new Set<() => void>()

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
