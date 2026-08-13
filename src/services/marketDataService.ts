import type {
  Candle,
  Company,
  Fundamentals,
  MarketIndex,
  Quote,
  Timeframe,
} from '@/types'
import { COMPANY_BY_TICKER, COMPANY_SEEDS } from '@/data/companies'
import { INDEX_SEEDS } from '@/data/indices'
import { generateSeries, generateSparkline } from '@/data/seriesGenerator'
import { brandColor } from '@/lib/brandColors'
import { apiGet, ApiRequestError } from './apiClient'

/**
 * ÚNICA fuente de datos de mercado para la UI.
 *
 * Los datos son reales: salen de `/api/*`, que a su vez consulta al proveedor
 * desde el servidor. Si el proveedor no responde, cada función cae al generador
 * determinista local y marca el resultado con `source: 'simulated'` — la UI
 * muestra ese estado en pantalla, nunca hace pasar un dato simulado por real.
 */

export interface SeriesResult {
  candles: Candle[]
  /** Cierre previo: es la línea de referencia del gráfico intradía. */
  previousClose: number | null
  /** False en intradía: el proveedor no publica volumen por minuto. */
  hasVolume: boolean
  interval: string
  source: 'live' | 'simulated'
}

export interface SymbolMatch {
  symbol: string
  name: string
  sector: string | null
}

interface SeriesPayload {
  ticker: string
  range: Timeframe
  interval: string
  candles: Candle[]
  previousClose: number | null
  hasVolume: boolean
}

/* --- Respaldo simulado ---------------------------------------------------- */

/** Variación de apertura fija por ticker, para que el % del día no salte. */
function simulatedChangePercent(ticker: string): number {
  const seed = COMPANY_BY_TICKER[ticker]
  if (!seed) return 0
  let hash = 0
  for (let index = 0; index < ticker.length; index += 1) {
    hash = (hash * 31 + ticker.charCodeAt(index)) >>> 0
  }
  const normalized = (hash % 1000) / 1000
  return round2((normalized - 0.42) * seed.volatility * 100 * 2.8)
}

function simulatedQuote(ticker: string): Quote | null {
  const seed = COMPANY_BY_TICKER[ticker]
  if (!seed) return null

  const changePercent = simulatedChangePercent(ticker)
  const previousClose = round2(seed.basePrice / (1 + changePercent / 100))

  return {
    ticker,
    name: seed.name,
    exchange: seed.exchange ?? '',
    price: round2(seed.basePrice),
    change: round2(seed.basePrice - previousClose),
    changePercent,
    previousClose,
    extendedPrice: null,
    extendedChangePercent: null,
    realtime: false,
    updatedAt: new Date().toISOString(),
    source: 'simulated',
  }
}

function simulatedSeries(ticker: string, range: Timeframe): SeriesResult {
  const candles = generateSeries(ticker, range, Date.now())
  return {
    candles,
    previousClose: candles.length ? candles[0].open : null,
    hasVolume: candles.some((candle) => candle.volume > 0),
    interval: range === '1D' ? '5m' : '1d',
    source: 'simulated',
  }
}

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

/* --- Servicio ------------------------------------------------------------- */

export const marketDataService = {
  /** Universo curado con el que arranca la app (watchlist por defecto y buscador). */
  async listCompanies(): Promise<Company[]> {
    return COMPANY_SEEDS.map((seed) => ({
      ticker: seed.ticker,
      name: seed.name,
      sector: seed.sector,
      brandColor: seed.brandColor,
    }))
  },

  /**
   * Identidad de una empresa. Primero el universo curado —que tiene sector en
   * español y color de marca—, y si el ticker no está, se resuelve contra el
   * proveedor para que funcione cualquier símbolo listado en EE.UU.
   */
  async getCompany(ticker: string): Promise<Company | null> {
    const curated = toCompany(ticker)
    if (curated) return curated

    try {
      const fundamentals = await apiGet<Fundamentals>(
        'profile',
        { symbol: ticker },
        { ttlMs: 300_000 },
      )
      const quote = await this.getQuote(ticker)
      return {
        ticker,
        name: quote?.name ?? ticker,
        sector: fundamentals.sector ?? 'Sin clasificar',
        brandColor: brandColor(ticker),
        exchange: fundamentals.exchange ?? undefined,
      }
    } catch {
      return null
    }
  },

  async getQuote(ticker: string): Promise<Quote | null> {
    const quotes = await this.getQuotes([ticker])
    return quotes[0] ?? null
  },

  async getQuotes(tickers: readonly string[]): Promise<Quote[]> {
    if (!tickers.length) return []

    try {
      return await apiGet<Quote[]>('quote', { symbols: tickers.join(',') }, { ttlMs: 5000 })
    } catch (error) {
      logFallback('cotizaciones', error)
      return tickers
        .map((ticker) => simulatedQuote(ticker))
        .filter((quote): quote is Quote => quote !== null)
    }
  },

  /** Serie con su metadata. Es lo que consume el gráfico. */
  async getSeriesDetail(ticker: string, range: Timeframe): Promise<SeriesResult> {
    try {
      const payload = await apiGet<SeriesPayload>(
        'series',
        { symbol: ticker, range },
        { ttlMs: range === '1D' ? 30_000 : 300_000 },
      )
      return {
        candles: payload.candles,
        previousClose: payload.previousClose,
        hasVolume: payload.hasVolume,
        interval: payload.interval,
        source: 'live',
      }
    } catch (error) {
      logFallback(`serie ${ticker} ${range}`, error)
      return simulatedSeries(ticker, range)
    }
  },

  async getSeries(ticker: string, range: Timeframe): Promise<Candle[]> {
    const result = await this.getSeriesDetail(ticker, range)
    return result.candles
  },

  /** Cierres del último mes, para los sparklines de las cards. */
  async getSparkline(ticker: string): Promise<number[]> {
    try {
      const payload = await apiGet<SeriesPayload>(
        'series',
        { symbol: ticker, range: '1M' },
        { ttlMs: 600_000 },
      )
      const closes = payload.candles.map((candle) => candle.close)
      return closes.length >= 2 ? closes : generateSparkline(ticker)
    } catch (error) {
      logFallback(`sparkline ${ticker}`, error)
      return generateSparkline(ticker)
    }
  },

  async getFundamentals(ticker: string): Promise<Fundamentals | null> {
    try {
      return await apiGet<Fundamentals>('profile', { symbol: ticker }, { ttlMs: 300_000 })
    } catch (error) {
      logFallback(`fundamentales ${ticker}`, error)
      return null
    }
  },

  async getIndices(): Promise<MarketIndex[]> {
    try {
      return await apiGet<MarketIndex[]>('indices', {}, { ttlMs: 10_000 })
    } catch (error) {
      logFallback('índices', error)
      return INDEX_SEEDS.map((seed) => ({ ...seed }))
    }
  },

  /** Busca por ticker o por nombre sobre el universo listado en Estados Unidos. */
  async searchSymbols(query: string): Promise<SymbolMatch[]> {
    const trimmed = query.trim()
    if (!trimmed) return []

    try {
      return await apiGet<SymbolMatch[]>('search', { q: trimmed }, { ttlMs: 600_000 })
    } catch (error) {
      logFallback(`búsqueda "${trimmed}"`, error)
      const needle = trimmed.toLowerCase()
      return COMPANY_SEEDS.filter(
        (seed) =>
          seed.ticker.toLowerCase().includes(needle) || seed.name.toLowerCase().includes(needle),
      ).map((seed) => ({ symbol: seed.ticker, name: seed.name, sector: seed.sector }))
    }
  },
}

function logFallback(what: string, error: unknown): void {
  const detail = error instanceof ApiRequestError ? error.message : String(error)
  console.warn(`[market-data] ${what}: se usa el respaldo simulado (${detail})`)
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
