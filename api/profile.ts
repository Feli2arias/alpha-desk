import type { Fundamentals } from '../src/types'
import { ApiError, firstParam, route } from './_lib/handler'
import { cached } from './_lib/cache'
import { normalizeSymbol, toNumber } from './_lib/parse'
import { fetchSummary } from './_lib/providers/nasdaq'
import { fetchMetrics } from './_lib/providers/finnhub'
import { assetClassCandidates } from './_lib/symbols'

/**
 * GET /api/profile?symbol=NVDA
 * Fundamentales de una acción: rangos, volumen, capitalización y dividendo.
 * P/E y EPS sólo aparecen si hay FINNHUB_API_KEY; si no, quedan en null.
 */

const TTL_MS = 300_000

/** "$227.23/$224.135" -> [227.23, 224.135] */
function splitRange(raw: string | undefined): [number | null, number | null] {
  if (!raw) return [null, null]
  const [high, low] = raw.split('/')
  return [toNumber(high), toNumber(low)]
}

export default route<Fundamentals>({
  cacheSeconds: 300,
  load: async (req) => {
    const symbol = normalizeSymbol(firstParam(req.query, 'symbol'))
    if (!symbol) throw new ApiError(400, 'Falta el parámetro symbol o no es un símbolo válido')

    return cached(`profile:${symbol}`, TTL_MS, async () => {
      const [summary, metrics] = await Promise.all([
        fetchSummary(symbol, assetClassCandidates(symbol)),
        fetchMetrics(symbol),
      ])

      const [dayHigh, dayLow] = splitRange(summary.TodayHighLow)
      const [yearHigh, yearLow] = splitRange(summary.FiftTwoWeekHighLow)

      return {
        ticker: symbol,
        dayHigh,
        dayLow,
        yearHigh: yearHigh ?? metrics?.yearHigh ?? null,
        yearLow: yearLow ?? metrics?.yearLow ?? null,
        volume: toNumber(summary.ShareVolume),
        averageVolume: toNumber(summary.AverageVolume),
        marketCap: toNumber(summary.MarketCap),
        peRatio: metrics?.peRatio ?? null,
        earningsPerShare: metrics?.earningsPerShare ?? null,
        dividendYield: toNumber(summary.Yield),
        annualizedDividend: toNumber(summary.AnnualizedDividend),
        oneYearTarget: toNumber(summary.OneYrTarget),
        sector: summary.Sector ?? null,
        industry: summary.Industry ?? null,
        exchange: summary.Exchange ?? null,
        source: 'live',
      } satisfies Fundamentals
    })
  },
})
