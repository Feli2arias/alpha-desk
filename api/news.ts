import type { NewsItem } from '../src/types/index.js'
import { ApiError, firstParam, route } from './_lib/handler.js'
import { cached } from './_lib/cache.js'
import { normalizeSymbol } from './_lib/parse.js'
import { fetchNews } from './_lib/providers/nasdaqContent.js'

/**
 * GET /api/news?symbol=NVDA
 * Titulares reales con fuente, resumen, fecha y link.
 * El sentimiento y la relevancia NO vienen del proveedor: los asigna el
 * Research Agent, así que salen sin definir y la UI no los muestra.
 */

const TTL_MS = 300_000

export default route<NewsItem[]>({
  cacheSeconds: 300,
  load: async (req) => {
    const symbol = normalizeSymbol(firstParam(req.query, 'symbol'))
    if (!symbol) throw new ApiError(400, 'Falta el parámetro symbol o no es un símbolo válido')

    return cached(`news:${symbol}`, TTL_MS, async () => {
      const articles = await fetchNews(symbol, 12)

      // El feed por símbolo incluye notas de mercado general: las que nombran
      // explícitamente al símbolo van primero, el resto queda como relleno.
      const ranked = [...articles].sort((a, b) => {
        const aDirect = a.relatedSymbols.includes(symbol) ? 1 : 0
        const bDirect = b.relatedSymbols.includes(symbol) ? 1 : 0
        if (aDirect !== bDirect) return bDirect - aDirect
        return Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
      })

      return ranked.slice(0, 8).map(
        (article): NewsItem => ({
          id: article.id,
          ticker: symbol,
          headline: article.headline,
          source: article.source,
          publishedAt: article.publishedAt,
          url: article.url,
          summary: article.summary || undefined,
        }),
      )
    })
  },
})
