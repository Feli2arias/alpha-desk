import type { MarketIndex } from '../src/types/index.js'
import { ApiError, route } from './_lib/handler.js'
import { cached } from './_lib/cache.js'
import { fetchQuote } from './_lib/providers/nasdaq.js'
import { INDEX_DEFINITIONS } from './_lib/symbols.js'

/**
 * GET /api/indices
 * Índices de referencia. S&P 500, Dow y Russell se leen del ETF que los
 * replica —Nasdaq sólo publica COMP y NDX como índice— y quedan marcados
 * con `proxy: true` para que la UI no los presente como el índice mismo.
 */

const TTL_MS = 20_000

export default route<MarketIndex[]>({
  cacheSeconds: 20,
  load: async () => {
    const settled = await Promise.allSettled(
      INDEX_DEFINITIONS.map((definition) =>
        cached<MarketIndex>(`index:${definition.symbol}`, TTL_MS, async () => {
          const raw = await fetchQuote(definition.symbol, [definition.assetClass])
          return {
            symbol: definition.displaySymbol,
            name: definition.name,
            value: raw.price,
            change: raw.change,
            changePercent: raw.changePercent,
            proxy: definition.proxy,
            proxySymbol: definition.proxy ? definition.symbol : undefined,
            source: 'live',
          }
        }),
      ),
    )

    const indices = settled
      .filter(
        (result): result is PromiseFulfilledResult<MarketIndex> => result.status === 'fulfilled',
      )
      .map((result) => result.value)

    if (!indices.length) throw new ApiError(502, 'No se pudo obtener ningún índice')
    return indices
  },
})
