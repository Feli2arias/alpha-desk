import type { Candle, Timeframe } from '@/types'
import { createRng, gaussian, seedFromString } from '@/lib/random'
import { COMPANY_BY_TICKER } from './companies'

interface RangeSpec {
  /** Cantidad de velas a generar. */
  points: number
  /** Milisegundos entre velas. */
  stepMs: number
  /** Escala de volatilidad respecto a la diaria del seed. */
  volScale: number
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const RANGE_SPECS: Record<Timeframe, RangeSpec> = {
  '1D': { points: 78, stepMs: 5 * MINUTE, volScale: 0.16 },
  '1W': { points: 70, stepMs: HOUR, volScale: 0.35 },
  '1M': { points: 22, stepMs: DAY, volScale: 1 },
  '6M': { points: 130, stepMs: DAY, volScale: 1 },
  '1Y': { points: 252, stepMs: DAY, volScale: 1 },
}

/**
 * Random walk con deriva. Determinista por (ticker, rango): la misma acción
 * devuelve siempre la misma serie, así los gráficos no bailan entre navegaciones.
 * El último cierre se fuerza al `basePrice` para que el histórico "termine"
 * exactamente en el precio actual.
 */
export function generateSeries(ticker: string, range: Timeframe, endTime: number): Candle[] {
  const seed = COMPANY_BY_TICKER[ticker]
  if (!seed) return []

  const spec = RANGE_SPECS[range]
  const rng = createRng(seedFromString(`${ticker}:${range}`))

  const stepVol = seed.volatility * spec.volScale
  // Deriva anual prorrateada al tamaño del paso.
  const stepDrift = (seed.drift * spec.stepMs) / (365 * DAY)

  // Se camina hacia atrás desde el precio actual y después se invierte, para
  // que la serie aterrice exactamente en basePrice.
  const closes: number[] = [seed.basePrice]
  for (let i = 1; i < spec.points; i += 1) {
    const prev = closes[i - 1]
    const shock = gaussian(rng) * stepVol
    const next = prev / Math.exp(stepDrift + shock)
    closes.push(Math.max(next, prev * 0.75))
  }
  closes.reverse()

  return closes.map((close, index) => {
    const time = endTime - (spec.points - 1 - index) * spec.stepMs
    const open = index === 0 ? close * (1 - stepVol * 0.3) : closes[index - 1]
    const spread = Math.abs(close - open) + close * stepVol * (0.35 + rng() * 0.6)
    const high = Math.max(open, close) + spread * rng() * 0.7
    const low = Math.min(open, close) - spread * rng() * 0.7
    const volume = Math.round(seed.avgVolume * (0.55 + rng() * 0.9) * (spec.stepMs / DAY))

    return {
      time,
      open: round2(open),
      high: round2(high),
      low: round2(Math.max(low, 0.01)),
      close: round2(close),
      volume,
    }
  })
}

/** Serie corta de cierres para los sparklines de las cards. */
export function generateSparkline(ticker: string, points = 30): number[] {
  const series = generateSeries(ticker, '1M', Date.now())
  if (series.length >= points) {
    return series.slice(-points).map((candle) => candle.close)
  }
  return series.map((candle) => candle.close)
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
