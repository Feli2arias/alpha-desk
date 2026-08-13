import type { MarketStatus, Quote } from '@/types'
import { getMarketStatus, pollIntervalMs } from '@/lib/marketStatus'
import { marketDataService } from './marketDataService'

/**
 * Cotizaciones en vivo por polling.
 *
 * Toda la app comparte un solo bucle: se junta la unión de los tickers que
 * cualquier componente esté mirando y se pide todo en una sola llamada. Eso
 * evita que cada card dispare su propio request y que el proveedor nos limite.
 *
 * La cadencia depende de la sesión: con el mercado cerrado el precio no se
 * mueve, así que insistir cada 12 segundos sólo gastaría cuota. Con la pestaña
 * en segundo plano el bucle se detiene y se retoma al volver.
 *
 * Cuando haya un WebSocket real, se reemplaza `poll()` por el push del socket
 * y ni los componentes ni los hooks cambian.
 */

type Listener = () => void

interface Subscription {
  tickers: readonly string[]
  listener: Listener
}

const subscriptions = new Set<Subscription>()
const quotes = new Map<string, Quote>()

let timer: ReturnType<typeof setTimeout> | null = null
let coalesceTimer: ReturnType<typeof setTimeout> | null = null
let polling = false
/** Se marca cuando entra un ticker nuevo mientras hay un poll en curso. */
let pollAgain = false
let status: MarketStatus = getMarketStatus()
let lastUpdatedAt: string | null = null

function activeTickers(): string[] {
  const union = new Set<string>()
  for (const subscription of subscriptions) {
    for (const ticker of subscription.tickers) union.add(ticker)
  }
  return [...union]
}

function notify(): void {
  for (const subscription of subscriptions) subscription.listener()
}

async function poll(): Promise<void> {
  // Un pedido a la vez. Si llega otro mientras tanto se anota para reintentar
  // al final: descartarlo dejaría sin precio a los tickers que se sumaron.
  if (polling) {
    pollAgain = true
    return
  }

  const tickers = activeTickers()
  if (!tickers.length) return

  polling = true
  try {
    const next = await marketDataService.getQuotes(tickers)
    if (next.length) {
      for (const quote of next) quotes.set(quote.ticker, quote)
      lastUpdatedAt = new Date().toISOString()
      notify()
    }
  } finally {
    polling = false
  }

  if (pollAgain) {
    pollAgain = false
    await poll()
  }
}

/**
 * Agrupa las suscripciones que ocurren en el mismo tick de render.
 * Una vista puede montar diez componentes a la vez; sin esto el primero
 * dispararía un pedido con su único ticker y los otros nueve tendrían que
 * esperar al ciclo siguiente para mostrar precio.
 */
function schedulePoll(): void {
  if (coalesceTimer !== null) return
  coalesceTimer = setTimeout(() => {
    coalesceTimer = null
    void poll()
  }, 30)
}

function isHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden'
}

function scheduleNext(): void {
  stopTimer()
  status = getMarketStatus()

  timer = setTimeout(() => {
    void (async () => {
      if (!isHidden()) await poll()
      if (subscriptions.size > 0) scheduleNext()
    })()
  }, pollIntervalMs(status.session))
}

function stopTimer(): void {
  if (timer === null) return
  clearTimeout(timer)
  timer = null
}

function handleVisibilityChange(): void {
  if (isHidden() || subscriptions.size === 0) return
  // Al volver a la pestaña el precio puede estar viejo: se refresca ya mismo.
  void poll()
  scheduleNext()
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', handleVisibilityChange)
}

/** Registra interés en unos tickers. Devuelve la función de baja. */
export function subscribeQuotes(tickers: readonly string[], listener: Listener): () => void {
  const subscription: Subscription = { tickers, listener }
  subscriptions.add(subscription)

  schedulePoll()
  scheduleNext()

  return () => {
    subscriptions.delete(subscription)
    if (subscriptions.size > 0) return
    stopTimer()
    if (coalesceTimer !== null) {
      clearTimeout(coalesceTimer)
      coalesceTimer = null
    }
  }
}

/** Último precio conocido, sin esperar al próximo ciclo. */
export function peekQuote(ticker: string): Quote | undefined {
  return quotes.get(ticker)
}

export function peekQuotes(tickers: readonly string[]): Quote[] {
  return tickers
    .map((ticker) => quotes.get(ticker))
    .filter((quote): quote is Quote => quote !== undefined)
}

/** Estado de la sesión usado por el último ciclo. */
export function currentMarketStatus(): MarketStatus {
  return status
}

/** Momento del último refresco exitoso, o null si todavía no hubo ninguno. */
export function lastRefreshedAt(): string | null {
  return lastUpdatedAt
}

/** Fuerza un refresco inmediato y reinicia el temporizador. */
export async function refreshQuotes(): Promise<void> {
  await poll()
  if (subscriptions.size > 0) scheduleNext()
}
