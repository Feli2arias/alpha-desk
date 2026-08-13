import type { Candle, Timeframe } from '../src/types'
import { ApiError, firstParam, route } from './_lib/handler'
import { cached } from './_lib/cache'
import { normalizeSymbol, round2 } from './_lib/parse'
import { fetchHistorical, fetchIntraday } from './_lib/providers/nasdaq'
import { assetClassCandidates } from './_lib/symbols'

/**
 * GET /api/series?symbol=NVDA&range=1M
 *
 * 1D sale del feed intradía por minuto y se agrupa en velas de 5 minutos.
 * El resto sale del histórico diario OHLCV, que ya viene con volumen real.
 */

interface RangeSpec {
  kind: 'intraday' | 'daily'
  /** Minutos por vela en intradía. */
  bucketMinutes?: number
  /** Días calendario hacia atrás en histórico (con colchón para fines de semana). */
  days?: number
  ttlMs: number
  cacheSeconds: number
  interval: string
}

const RANGES: Record<Timeframe, RangeSpec> = {
  '1D': { kind: 'intraday', bucketMinutes: 5, ttlMs: 60_000, cacheSeconds: 60, interval: '5m' },
  '1W': { kind: 'daily', days: 9, ttlMs: 300_000, cacheSeconds: 300, interval: '1d' },
  '1M': { kind: 'daily', days: 33, ttlMs: 600_000, cacheSeconds: 600, interval: '1d' },
  '3M': { kind: 'daily', days: 95, ttlMs: 600_000, cacheSeconds: 600, interval: '1d' },
  '6M': { kind: 'daily', days: 190, ttlMs: 900_000, cacheSeconds: 900, interval: '1d' },
  '1Y': { kind: 'daily', days: 370, ttlMs: 900_000, cacheSeconds: 900, interval: '1d' },
  '5Y': { kind: 'daily', days: 1830, ttlMs: 3_600_000, cacheSeconds: 3600, interval: '1w' },
}

export interface SeriesPayload {
  ticker: string
  range: Timeframe
  /** Granularidad real de las velas devueltas. */
  interval: string
  candles: Candle[]
  /** Cierre previo — la línea de referencia del gráfico intradía. */
  previousClose: number | null
  /** False en intradía: el proveedor no publica volumen por minuto. */
  hasVolume: boolean
}

function isTimeframe(value: string): value is Timeframe {
  return value in RANGES
}

/**
 * Agrupa precios por minuto en velas OHLC.
 * Sin esto el modo velas en 1D no tendría apertura/máximo/mínimo, sólo cierre.
 */
function bucketIntoCandles(
  points: readonly { time: number; price: number }[],
  bucketMinutes: number,
): Candle[] {
  const bucketMs = bucketMinutes * 60_000
  const candles: Candle[] = []
  let current: Candle | null = null
  let currentBucket = -1

  for (const point of points) {
    const bucket = Math.floor(point.time / bucketMs)

    if (bucket !== currentBucket) {
      if (current) candles.push(current)
      currentBucket = bucket
      current = {
        time: bucket * bucketMs,
        open: point.price,
        high: point.price,
        low: point.price,
        close: point.price,
        volume: 0,
      }
      continue
    }

    if (!current) continue
    current.high = Math.max(current.high, point.price)
    current.low = Math.min(current.low, point.price)
    current.close = point.price
  }

  if (current) candles.push(current)

  return candles.map((candle) => ({
    ...candle,
    open: round2(candle.open),
    high: round2(candle.high),
    low: round2(candle.low),
    close: round2(candle.close),
  }))
}

/** Comprime velas diarias a semanales para que 5Y no dibuje 1250 puntos. */
function toWeekly(bars: readonly Candle[]): Candle[] {
  const weeks: Candle[] = []
  let current: Candle | null = null
  let currentWeek = -1
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000

  for (const bar of bars) {
    const week = Math.floor(bar.time / WEEK_MS)
    if (week !== currentWeek) {
      if (current) weeks.push(current)
      currentWeek = week
      current = { ...bar }
      continue
    }
    if (!current) continue
    current.high = Math.max(current.high, bar.high)
    current.low = Math.min(current.low, bar.low)
    current.close = bar.close
    current.volume += bar.volume
  }

  if (current) weeks.push(current)
  return weeks
}

export default route<SeriesPayload>({
  cacheSeconds: (req) => {
    const range = firstParam(req.query, 'range') ?? '1M'
    return isTimeframe(range) ? RANGES[range].cacheSeconds : 60
  },
  load: async (req) => {
    const symbol = normalizeSymbol(firstParam(req.query, 'symbol'))
    if (!symbol) throw new ApiError(400, 'Falta el parámetro symbol o no es un símbolo válido')

    const rangeParam = firstParam(req.query, 'range') ?? '1M'
    if (!isTimeframe(rangeParam)) {
      throw new ApiError(400, `Rango no soportado. Válidos: ${Object.keys(RANGES).join(', ')}`)
    }

    const spec = RANGES[rangeParam]
    const candidates = assetClassCandidates(symbol)

    return cached(`series:${symbol}:${rangeParam}`, spec.ttlMs, async () => {
      if (spec.kind === 'intraday') {
        const intraday = await fetchIntraday(symbol, candidates)
        return {
          ticker: symbol,
          range: rangeParam,
          interval: spec.interval,
          candles: bucketIntoCandles(intraday.points, spec.bucketMinutes ?? 5),
          previousClose: intraday.previousClose,
          hasVolume: false,
        } satisfies SeriesPayload
      }

      const to = new Date()
      const from = new Date(to.getTime() - (spec.days ?? 33) * 24 * 60 * 60 * 1000)
      const bars = await fetchHistorical(symbol, from, to, candidates)

      const candles = rangeParam === '5Y' ? toWeekly(bars) : bars
      // La primera vela del rango hace de cierre previo para el cálculo del período.
      const previousClose = candles.length ? candles[0].open : null

      return {
        ticker: symbol,
        range: rangeParam,
        interval: spec.interval,
        candles,
        previousClose,
        hasVolume: candles.some((candle) => candle.volume > 0),
      } satisfies SeriesPayload
    })
  },
})
