import { ApiError, firstParam, route } from './_lib/handler'
import { cached } from './_lib/cache'
import { fetchUniverse, type UniverseEntry } from './_lib/providers/nasdaqContent'

/**
 * GET /api/search?q=nvidia
 * Busca por ticker o por nombre de empresa sobre el universo listado en EE.UU.
 * El filtrado es local: ver `fetchUniverse` para el porqué.
 */

const UNIVERSE_TTL_MS = 12 * 60 * 60 * 1000

export interface SearchMatch {
  symbol: string
  name: string
  sector: string | null
}

/**
 * Puntaje de coincidencia. Prioriza el ticker exacto sobre cualquier
 * coincidencia por nombre: quien escribe "PLTR" quiere PLTR, no una empresa
 * que casualmente tenga esas letras en su razón social.
 */
function score(entry: UniverseEntry, query: string): number {
  const symbol = entry.symbol.toLowerCase()
  const name = entry.name.toLowerCase()

  if (symbol === query) return 1000
  if (name === query) return 900
  if (symbol.startsWith(query)) return 800
  if (name.startsWith(query)) return 700
  // Coincidencia al principio de una palabra: "tech" matchea "Palantir Technologies".
  if (new RegExp(`\\b${escapeRegExp(query)}`).test(name)) return 600
  if (name.includes(query)) return 400
  return 0
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default route<SearchMatch[]>({
  cacheSeconds: 600,
  load: async (req) => {
    const query = (firstParam(req.query, 'q') ?? '').trim().toLowerCase()
    if (!query) throw new ApiError(400, 'Falta el parámetro q')
    if (query.length > 40) throw new ApiError(400, 'La búsqueda es demasiado larga')

    const universe = await cached('universe', UNIVERSE_TTL_MS, fetchUniverse)

    return universe
      .map((entry) => ({ entry, rank: score(entry, query) }))
      .filter((candidate) => candidate.rank > 0)
      // A igual calidad de coincidencia gana la empresa más grande.
      .sort((a, b) => b.rank - a.rank || b.entry.marketCap - a.entry.marketCap)
      .slice(0, 8)
      .map(
        ({ entry }): SearchMatch => ({
          symbol: entry.symbol,
          name: entry.name,
          sector: entry.sector,
        }),
      )
  },
})
