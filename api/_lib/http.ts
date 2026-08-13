import { ApiError } from './handler'

/**
 * Cliente HTTP hacia proveedores externos.
 * Los endpoints públicos de mercado rechazan clientes sin cabeceras de browser,
 * así que se envía un User-Agent realista. Todo pedido tiene timeout duro para
 * que la función serverless nunca quede colgada.
 */

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const DEFAULT_TIMEOUT_MS = 6500
const MAX_ATTEMPTS = 2

interface FetchOptions {
  timeoutMs?: number
  headers?: Record<string, string>
}

/** GET + JSON con reintento único ante fallo de red o 5xx. */
export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers = {} } = options
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          'User-Agent': BROWSER_UA,
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          ...headers,
        },
      })

      if (response.status === 429) {
        throw new ApiError(429, 'El proveedor de datos está limitando los pedidos')
      }
      if (!response.ok) {
        throw new ApiError(502, `El proveedor respondió ${response.status}`)
      }

      return (await response.json()) as T
    } catch (error) {
      lastError = error
      // 4xx del proveedor no se reintenta: reintentar no lo va a arreglar.
      if (error instanceof ApiError && error.status < 500 && error.status !== 429) throw error
      if (attempt === MAX_ATTEMPTS) break
      await sleep(220 * attempt)
    }
  }

  if (lastError instanceof ApiError) throw lastError
  throw new ApiError(502, 'No se pudo contactar al proveedor de datos')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
