import { fetchJson } from '../http.js'

/**
 * Finnhub — OPCIONAL. Se activa solo si existe FINNHUB_API_KEY en el entorno.
 * Aporta lo que Nasdaq no publica: P/E, EPS, beta y noticias por empresa.
 * Sin la key, todo esto queda en null y la app funciona igual.
 */

const BASE = 'https://finnhub.io/api/v1'

/**
 * Lectura de variables de entorno vía `globalThis`.
 * Vercel typechequea `api/` sin los tipos de Node, así que referenciar `process`
 * directamente rompe su build aunque en runtime exista.
 */
function readEnv(name: string): string | undefined {
  const runtime = globalThis as { process?: { env?: Record<string, string | undefined> } }
  return runtime.process?.env?.[name]
}

/** La key nunca sale del servidor: se lee acá y sólo viaja al proveedor. */
export function hasApiKey(): boolean {
  return Boolean(readEnv('FINNHUB_API_KEY'))
}

function withToken(path: string): string {
  const token = readEnv('FINNHUB_API_KEY')
  if (!token) throw new Error('FINNHUB_API_KEY no configurada')
  const separator = path.includes('?') ? '&' : '?'
  return `${BASE}${path}${separator}token=${encodeURIComponent(token)}`
}

interface MetricResponse {
  metric?: Record<string, number | string | null>
}

export interface FinnhubMetrics {
  peRatio: number | null
  earningsPerShare: number | null
  beta: number | null
  yearHigh: number | null
  yearLow: number | null
}

export async function fetchMetrics(symbol: string): Promise<FinnhubMetrics | null> {
  if (!hasApiKey()) return null

  try {
    const payload = await fetchJson<MetricResponse>(
      withToken(`/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all`),
    )
    const metric = payload.metric ?? {}

    return {
      peRatio: num(metric.peTTM),
      earningsPerShare: num(metric.epsTTM),
      beta: num(metric.beta),
      yearHigh: num(metric['52WeekHigh']),
      yearLow: num(metric['52WeekLow']),
    }
  } catch (error) {
    // El enriquecimiento es opcional: si falla, el perfil se sirve sin él.
    console.error('[finnhub] métricas no disponibles para %s: %s', symbol, String(error))
    return null
  }
}

function num(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number(value) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null
}
