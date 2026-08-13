import { ApiError } from '../handler.js'
import { fetchJson } from '../http.js'
import { parseUsDate, round2, toNumber, toNumberOr } from '../parse.js'

/**
 * Nasdaq Data API — endpoints públicos de nasdaq.com.
 * Cubre cotización casi en tiempo real, intradía por minuto, histórico diario
 * OHLCV y fundamentales resumidos. No requiere API key.
 */

const BASE = 'https://api.nasdaq.com/api/quote'

/** Nasdaq separa el universo por clase de activo y la ruta cambia según cuál sea. */
export type AssetClass = 'stocks' | 'etf' | 'index'

interface NasdaqEnvelope<T> {
  data: T | null
  status?: { rCode?: number; bCodeMessage?: { errorMessage?: string }[] | null }
}

interface InfoData {
  symbol: string
  companyName: string
  exchange: string
  primaryData: {
    lastSalePrice: string
    netChange: string
    percentageChange: string
    deltaIndicator: string
    lastTradeTimestamp: string
    isRealTime?: boolean
  }
  secondaryData?: {
    lastSalePrice: string
    netChange: string
    percentageChange: string
    lastTradeTimestamp: string
  } | null
}

interface ChartPoint {
  x: number
  y: number
  z?: { dateTime?: string; value?: string }
}

interface ChartData {
  symbol: string
  company: string
  previousClose: string
  volume: string
  lastSalePrice: string
  netChange: string
  percentageChange: string
  timeAsOf: string
  chart: ChartPoint[] | null
}

interface HistoricalRow {
  date: string
  close: string
  volume: string
  open: string
  high: string
  low: string
}

interface HistoricalData {
  tradesTable?: { rows?: HistoricalRow[] | null } | null
}

interface SummaryData {
  summaryData?: Record<string, { label?: string; value?: string }> | null
}

async function call<T>(path: string): Promise<T> {
  const payload = await fetchJson<NasdaqEnvelope<T>>(`${BASE}/${path}`, {
    headers: { Referer: 'https://www.nasdaq.com/' },
  })

  if (!payload.data) {
    const detail = payload.status?.bCodeMessage?.[0]?.errorMessage
    // "Symbol not exists" es culpa del pedido, no del proveedor.
    if (detail && /not exist/i.test(detail)) {
      throw new ApiError(404, 'El símbolo no existe en el proveedor de datos')
    }
    throw new ApiError(502, 'El proveedor devolvió una respuesta vacía')
  }

  return payload.data
}

/**
 * Prueba las clases de activo en orden hasta que una responda.
 * Nasdaq exige la clase correcta y no hay endpoint para descubrirla, así que
 * se intenta `stocks` y se cae a `etf` para los ETFs del universo.
 */
async function callWithAssetClass<T>(
  symbol: string,
  endpoint: string,
  candidates: readonly AssetClass[],
  extraQuery = '',
): Promise<{ data: T; assetClass: AssetClass }> {
  let lastError: unknown

  for (const assetClass of candidates) {
    try {
      const data = await call<T>(
        `${symbol}/${endpoint}?assetclass=${assetClass}${extraQuery}`,
      )
      return { data, assetClass }
    } catch (error) {
      lastError = error
      // Sólo se prueba la siguiente clase si el símbolo no existía en esta.
      if (error instanceof ApiError && error.status === 404) continue
      throw error
    }
  }

  throw lastError instanceof ApiError
    ? lastError
    : new ApiError(404, 'El símbolo no existe en el proveedor de datos')
}

export interface NasdaqQuote {
  symbol: string
  name: string
  exchange: string
  price: number
  change: number
  changePercent: number
  previousClose: number | null
  /** Hora del último trade tal como la informa el proveedor. */
  asOf: string
  /** True cuando el precio es en tiempo real y no diferido. */
  realtime: boolean
  /** Precio de after-hours / pre-market cuando el mercado está cerrado. */
  extendedPrice: number | null
  extendedChangePercent: number | null
  assetClass: AssetClass
}

export async function fetchQuote(
  symbol: string,
  candidates: readonly AssetClass[] = ['stocks', 'etf'],
): Promise<NasdaqQuote> {
  const { data, assetClass } = await callWithAssetClass<InfoData>(symbol, 'info', candidates)
  const primary = data.primaryData
  const secondary = data.secondaryData

  const price = toNumber(primary.lastSalePrice)
  if (price === null) throw new ApiError(502, 'El proveedor no devolvió precio')

  return {
    symbol: data.symbol ?? symbol,
    name: data.companyName ?? symbol,
    exchange: data.exchange ?? '',
    price: round2(price),
    change: round2(toNumberOr(primary.netChange, 0)),
    changePercent: round2(toNumberOr(primary.percentageChange, 0)),
    previousClose: null,
    asOf: primary.lastTradeTimestamp ?? '',
    realtime: primary.isRealTime === true,
    extendedPrice: secondary ? toNumber(secondary.lastSalePrice) : null,
    extendedChangePercent: secondary ? toNumber(secondary.percentageChange) : null,
    assetClass,
  }
}

export interface IntradayPoint {
  time: number
  price: number
}

export interface IntradayResult {
  symbol: string
  name: string
  previousClose: number | null
  volume: number | null
  points: IntradayPoint[]
}

/** Serie intradía del día en curso, un punto por minuto, incluye pre y after. */
export async function fetchIntraday(
  symbol: string,
  candidates: readonly AssetClass[] = ['stocks', 'etf'],
): Promise<IntradayResult> {
  const { data } = await callWithAssetClass<ChartData>(symbol, 'chart', candidates)

  const points: IntradayPoint[] = (data.chart ?? [])
    .map((point) => ({ time: Number(point.x), price: Number(point.y) }))
    .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.price))

  return {
    symbol: data.symbol ?? symbol,
    name: data.company ?? symbol,
    previousClose: toNumber(data.previousClose),
    volume: toNumber(data.volume),
    points,
  }
}

export interface DailyBar {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/** Histórico diario OHLCV entre dos fechas, devuelto del más viejo al más nuevo. */
export async function fetchHistorical(
  symbol: string,
  from: Date,
  to: Date,
  candidates: readonly AssetClass[] = ['stocks', 'etf'],
): Promise<DailyBar[]> {
  const query = `&fromdate=${isoDate(from)}&todate=${isoDate(to)}&limit=9999`
  const { data } = await callWithAssetClass<HistoricalData>(
    symbol,
    'historical',
    candidates,
    query,
  )

  const rows = data.tradesTable?.rows ?? []
  const bars: DailyBar[] = []

  for (const row of rows) {
    const time = parseUsDate(row.date)
    const close = toNumber(row.close)
    if (time === null || close === null) continue

    const open = toNumber(row.open) ?? close
    const high = toNumber(row.high) ?? Math.max(open, close)
    const low = toNumber(row.low) ?? Math.min(open, close)

    bars.push({
      time,
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
      volume: toNumberOr(row.volume, 0),
    })
  }

  // Nasdaq devuelve del más nuevo al más viejo; los charts esperan lo inverso.
  return bars.sort((a, b) => a.time - b.time)
}

export type SummaryFields = Record<string, string>

/** Fundamentales resumidos: P/E, market cap, rango de 52 semanas, dividendo. */
export async function fetchSummary(
  symbol: string,
  candidates: readonly AssetClass[] = ['stocks', 'etf'],
): Promise<SummaryFields> {
  const { data } = await callWithAssetClass<SummaryData>(symbol, 'summary', candidates)
  const fields: SummaryFields = {}

  for (const [key, entry] of Object.entries(data.summaryData ?? {})) {
    const value = entry?.value
    if (typeof value === 'string' && value && value !== 'N/A') fields[key] = value
  }

  return fields
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
