import { ApiError } from '../handler'
import { fetchJson } from '../http'

/**
 * Contenido editorial y buscador de Nasdaq.
 *
 * Vive aparte de `nasdaq.ts` porque son otros hosts y otra forma de respuesta:
 * las noticias salen de www.nasdaq.com y el buscador del screener.
 */

const NEWS_URL = 'https://www.nasdaq.com/api/news/topic/articlebysymbol'
const SCREENER_URL = 'https://api.nasdaq.com/api/screener/stocks'
const SITE = 'https://www.nasdaq.com'

interface NewsRow {
  id?: number
  title?: string
  publisher?: string
  url?: string
  created?: string
  ago?: string
  description?: string
  related_symbols?: string[]
}

interface NewsResponse {
  data?: { rows?: NewsRow[] | null } | null
}

interface ScreenerRow {
  symbol?: string
  name?: string
  marketCap?: string
  sector?: string
  industry?: string
  country?: string
}

interface ScreenerResponse {
  data?: { rows?: ScreenerRow[] | null; table?: { rows?: ScreenerRow[] | null } | null } | null
}

export interface ArticleItem {
  id: string
  headline: string
  source: string
  url: string
  publishedAt: string
  summary: string
  relatedSymbols: string[]
}

/**
 * "34 minutes ago" | "2 hours ago" | "3 days ago" -> fecha absoluta.
 * El campo `created` sólo trae el día, así que para lo publicado hoy este
 * cálculo es lo único que da una hora utilizable.
 */
function resolvePublishedAt(ago: string | undefined, created: string | undefined): string {
  const now = Date.now()

  if (ago) {
    const match = /^(?:about\s+)?(\d+)\s+(minute|hour|day|week|month)s?\s+ago$/i.exec(ago.trim())
    if (match) {
      const amount = Number(match[1])
      const unitMs: Record<string, number> = {
        minute: 60_000,
        hour: 3_600_000,
        day: 86_400_000,
        week: 604_800_000,
        month: 2_592_000_000,
      }
      const step = unitMs[match[2].toLowerCase()]
      if (step) return new Date(now - amount * step).toISOString()
    }
  }

  if (created) {
    const parsed = Date.parse(created)
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString()
  }

  return new Date(now).toISOString()
}

/** `['nvda|stocks', 'qqq|etf']` -> `['NVDA', 'QQQ']` */
function parseRelatedSymbols(raw: string[] | undefined): string[] {
  if (!raw) return []
  return raw
    .map((entry) => entry.split('|')[0]?.trim().toUpperCase())
    .filter((symbol): symbol is string => Boolean(symbol))
}

export async function fetchNews(symbol: string, limit = 10): Promise<ArticleItem[]> {
  const query = encodeURIComponent(`${symbol.toLowerCase()}|stocks`)
  const payload = await fetchJson<NewsResponse>(
    `${NEWS_URL}?q=${query}&offset=0&limit=${limit}&fallback=true`,
    { headers: { Referer: `${SITE}/market-activity/stocks/${symbol.toLowerCase()}` } },
  )

  const rows = payload.data?.rows ?? []

  return rows
    .filter((row): row is NewsRow & { title: string } => Boolean(row.title))
    .map((row, index) => ({
      id: row.id ? String(row.id) : `${symbol}-news-${index}`,
      headline: row.title.trim(),
      source: row.publisher?.trim() || 'Nasdaq',
      // El proveedor devuelve rutas relativas al sitio.
      url: row.url ? (row.url.startsWith('http') ? row.url : `${SITE}${row.url}`) : '',
      publishedAt: resolvePublishedAt(row.ago, row.created),
      summary: row.description?.trim() ?? '',
      relatedSymbols: parseRelatedSymbols(row.related_symbols),
    }))
}

export interface UniverseEntry {
  symbol: string
  name: string
  sector: string | null
  industry: string | null
  marketCap: number
}

/**
 * Universo completo listado en Estados Unidos (~7000 papeles).
 *
 * El screener de Nasdaq ignora su propio parámetro de búsqueda, así que en vez
 * de pedirle que filtre se baja la tabla entera y se busca en memoria. Son unos
 * 3–4 segundos una vez cada 12 horas; después todas las búsquedas son locales.
 */
export async function fetchUniverse(): Promise<UniverseEntry[]> {
  const payload = await fetchJson<ScreenerResponse>(
    `${SCREENER_URL}?tableonly=true&limit=25&offset=0&download=true`,
    {
      timeoutMs: 20_000,
      headers: { Referer: `${SITE}/market-activity/stocks/screener` },
    },
  )

  const rows = payload.data?.rows ?? payload.data?.table?.rows
  if (!rows?.length) throw new ApiError(502, 'El proveedor no devolvió el universo de símbolos')

  return rows
    .filter((row): row is ScreenerRow & { symbol: string } => Boolean(row.symbol))
    .map((row) => ({
      symbol: row.symbol.trim().toUpperCase(),
      name: row.name?.trim() ?? row.symbol,
      sector: row.sector?.trim() || null,
      industry: row.industry?.trim() || null,
      marketCap: Number(row.marketCap) || 0,
    }))
}
