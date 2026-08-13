/**
 * Contrato mínimo de las funciones serverless de Vercel.
 *
 * Se define acá en vez de importar `@vercel/node` para que `api/` no arrastre
 * dependencias: el runtime de Node de Vercel pasa objetos compatibles con
 * `IncomingMessage`/`ServerResponse` más `query`, `status()` y `json()`.
 * El plugin de dev de Vite implementa exactamente esta misma forma.
 */

export interface ApiRequest {
  method?: string
  url?: string
  query: Record<string, string | string[] | undefined>
}

export interface ApiResponse {
  status(code: number): ApiResponse
  setHeader(name: string, value: string): void
  json(body: unknown): void
}

export type ApiHandler = (req: ApiRequest, res: ApiResponse) => Promise<void> | void

/** Envolvente única para todas las respuestas. La UI nunca ve otra forma. */
export interface ApiEnvelope<T> {
  ok: boolean
  data: T | null
  error: string | null
  /** 'live' = proveedor real. 'unavailable' = el cliente debe usar su fallback. */
  source: 'live' | 'unavailable'
  fetchedAt: string
}

/** Error con status HTTP propio, para distinguir 400 de 502 en los handlers. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RouteOptions<T> {
  /**
   * Segundos que el CDN puede servir la respuesta cacheada. Puede depender del
   * pedido: una serie de 5 años se cachea mucho más que una cotización.
   */
  cacheSeconds: number | ((req: ApiRequest) => number)
  /** Ventana extra en la que el CDN sirve la copia vieja mientras revalida. */
  staleSeconds?: number
  load: (req: ApiRequest) => Promise<T>
}

/**
 * Normaliza método, cabeceras de caché y forma del error.
 * Los mensajes que salen al cliente son genéricos: nunca se filtra la URL
 * del proveedor ni el detalle interno de la excepción.
 */
export function route<T>({ cacheSeconds, staleSeconds = 60, load }: RouteOptions<T>): ApiHandler {
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')

    if (req.method && req.method !== 'GET') {
      send(res, 405, {
        ok: false,
        data: null,
        error: 'Método no permitido',
        source: 'unavailable',
        fetchedAt: new Date().toISOString(),
      })
      return
    }

    try {
      const data = await load(req)
      const maxAge = typeof cacheSeconds === 'function' ? cacheSeconds(req) : cacheSeconds
      res.setHeader(
        'Cache-Control',
        `public, s-maxage=${maxAge}, stale-while-revalidate=${staleSeconds}`,
      )
      send(res, 200, {
        ok: true,
        data,
        error: null,
        source: 'live',
        fetchedAt: new Date().toISOString(),
      })
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 502
      const message =
        error instanceof ApiError
          ? error.message
          : 'El proveedor de datos de mercado no respondió'

      // El detalle completo queda en los logs del servidor, no en la respuesta.
      console.error('[api] fallo en %s: %s', req.url ?? 'desconocido', String(error))

      res.setHeader('Cache-Control', 'no-store')
      send(res, status, {
        ok: false,
        data: null,
        error: message,
        source: 'unavailable',
        fetchedAt: new Date().toISOString(),
      })
    }
  }
}

function send<T>(res: ApiResponse, status: number, body: ApiEnvelope<T>): void {
  res.status(status).json(body)
}

/** Primer valor de un query param, ignorando repeticiones. */
export function firstParam(
  query: ApiRequest['query'],
  key: string,
): string | undefined {
  const value = query[key]
  if (Array.isArray(value)) return value[0]
  return value
}
