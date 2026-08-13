import type { Quote } from '../src/types/index.js'
import { ApiError, firstParam, route } from './_lib/handler.js'
import { cached } from './_lib/cache.js'
import { normalizeSymbolList, round2 } from './_lib/parse.js'
import { fetchQuote } from './_lib/providers/nasdaq.js'
import { assetClassCandidates } from './_lib/symbols.js'

/**
 * GET /api/quote?symbols=NVDA,MSFT
 * Cotización en vivo de hasta 25 símbolos. Un símbolo que falle no tumba al
 * resto: se omite del resultado y la UI lo muestra como sin dato.
 */

const TTL_MS = 15_000

async function loadQuote(symbol: string): Promise<Quote> {
  return cached(`quote:${symbol}`, TTL_MS, async () => {
    const raw = await fetchQuote(symbol, assetClassCandidates(symbol))
    // El proveedor da el cambio absoluto pero no el cierre previo: se despeja.
    const previousClose = raw.change !== 0 ? round2(raw.price - raw.change) : raw.price

    return {
      ticker: raw.symbol,
      name: raw.name,
      exchange: raw.exchange,
      price: raw.price,
      change: raw.change,
      changePercent: raw.changePercent,
      previousClose,
      extendedPrice: raw.extendedPrice,
      extendedChangePercent: raw.extendedChangePercent,
      realtime: raw.realtime,
      updatedAt: new Date().toISOString(),
      source: 'live',
    } satisfies Quote
  })
}

export default route<Quote[]>({
  cacheSeconds: 15,
  load: async (req) => {
    const symbols = normalizeSymbolList(firstParam(req.query, 'symbols'))
    if (!symbols.length) {
      throw new ApiError(400, 'Falta el parámetro symbols con al menos un símbolo válido')
    }

    const settled = await Promise.allSettled(symbols.map(loadQuote))
    const quotes = settled
      .filter((result): result is PromiseFulfilledResult<Quote> => result.status === 'fulfilled')
      .map((result) => result.value)

    if (quotes.length) return quotes

    // Ningún símbolo resolvió. Se distingue "no existe" de "el proveedor se
    // cayó": la UI reacciona distinto ante un ticker mal escrito que ante una
    // caída, y con un 502 genérico no podría.
    const allMissing = settled.every(
      (result) =>
        result.status === 'rejected' &&
        result.reason instanceof ApiError &&
        result.reason.status === 404,
    )

    throw allMissing
      ? new ApiError(404, `Sin datos para ${symbols.join(', ')}`)
      : new ApiError(502, 'No se pudo obtener ninguna cotización')
  },
})
