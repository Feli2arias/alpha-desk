/**
 * Cliente de las funciones serverless de `/api`.
 *
 * Es el único lugar de la app que hace `fetch`. Se ocupa de tres cosas que si
 * no habría que repetir en cada servicio: desenvolver la respuesta, unificar
 * pedidos idénticos que salen a la vez, y cachear por un rato lo que no cambia.
 */

interface ApiEnvelope<T> {
  ok: boolean
  data: T | null
  error: string | null
  source: 'live' | 'unavailable'
  fetchedAt: string
}

/** Error de la API con el status HTTP, para distinguir "no existe" de "se cayó". */
export class ApiRequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

type QueryValue = string | number | undefined | null

interface CacheEntry {
  value: unknown
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()
const inFlight = new Map<string, Promise<unknown>>()

const DEFAULT_TIMEOUT_MS = 12_000

function buildUrl(path: string, query: Record<string, QueryValue>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  const search = params.toString()
  return search ? `/api/${path}?${search}` : `/api/${path}`
}

interface GetOptions {
  /** Milisegundos que el resultado se reutiliza sin volver a pedirlo. */
  ttlMs?: number
  timeoutMs?: number
}

export async function apiGet<T>(
  path: string,
  query: Record<string, QueryValue> = {},
  { ttlMs = 0, timeoutMs = DEFAULT_TIMEOUT_MS }: GetOptions = {},
): Promise<T> {
  const url = buildUrl(path, query)
  const now = Date.now()

  const hit = cache.get(url)
  if (hit && hit.expiresAt > now) return hit.value as T

  // Dos componentes que montan a la vez comparten el mismo pedido en curso.
  const pending = inFlight.get(url)
  if (pending) return pending as Promise<T>

  const request = (async (): Promise<T> => {
    let response: Response
    try {
      response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch {
      throw new ApiRequestError(0, 'No hay conexión con el servidor de datos')
    }

    let payload: ApiEnvelope<T>
    try {
      payload = (await response.json()) as ApiEnvelope<T>
    } catch {
      throw new ApiRequestError(response.status, 'El servidor devolvió una respuesta ilegible')
    }

    if (!response.ok || !payload.ok || payload.data === null) {
      throw new ApiRequestError(
        response.status,
        payload.error ?? 'El servidor de datos no respondió correctamente',
      )
    }

    if (ttlMs > 0) cache.set(url, { value: payload.data, expiresAt: Date.now() + ttlMs })
    return payload.data
  })()

  inFlight.set(url, request)
  try {
    return await request
  } finally {
    inFlight.delete(url)
  }
}

/** Invalida la caché del cliente. Se usa al forzar un refresco manual. */
export function clearApiCache(): void {
  cache.clear()
}
