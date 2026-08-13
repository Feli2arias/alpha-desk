import type { MarketSession, MarketStatus } from '@/types'

/**
 * Sesión del mercado estadounidense, calculada en horario de Nueva York.
 *
 * Se usa `Intl` en vez de restar offsets a mano porque el cambio de horario de
 * verano mueve la apertura respecto a UTC dos veces al año.
 *
 * Limitación conocida: no contempla feriados bursátiles. Un feriado se muestra
 * como sesión abierta aunque no haya negociación; el precio, que viene del
 * proveedor, simplemente no se mueve.
 */

const OPEN_MINUTE = 9 * 60 + 30
const CLOSE_MINUTE = 16 * 60
const PRE_MINUTE = 4 * 60
const AFTER_END_MINUTE = 20 * 60

const SESSION_LABEL: Record<MarketSession, string> = {
  pre: 'Pre-market',
  open: 'Mercado abierto',
  after: 'After-hours',
  closed: 'Mercado cerrado',
}

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

interface EasternTime {
  weekday: string
  minutes: number
}

function toEastern(date: Date): EasternTime {
  const parts = formatter.formatToParts(date)
  const lookup = (type: string) => parts.find((part) => part.type === type)?.value ?? '0'

  // '24' aparece a medianoche con hour12:false en algunos entornos.
  const hour = Number(lookup('hour')) % 24
  const minute = Number(lookup('minute'))

  return { weekday: lookup('weekday'), minutes: hour * 60 + minute }
}

function resolveSession({ weekday, minutes }: EasternTime): MarketSession {
  if (weekday === 'Sat' || weekday === 'Sun') return 'closed'
  if (minutes >= OPEN_MINUTE && minutes < CLOSE_MINUTE) return 'open'
  if (minutes >= PRE_MINUTE && minutes < OPEN_MINUTE) return 'pre'
  if (minutes >= CLOSE_MINUTE && minutes < AFTER_END_MINUTE) return 'after'
  return 'closed'
}

export function getMarketStatus(now: Date = new Date()): MarketStatus {
  const session = resolveSession(toEastern(now))
  return {
    session,
    label: SESSION_LABEL[session],
    trading: session !== 'closed',
  }
}

/**
 * Cada cuánto conviene volver a pedir precios.
 * Con el mercado cerrado el precio no cambia, así que insistir sólo gasta
 * cuota del proveedor.
 */
export function pollIntervalMs(session: MarketSession): number {
  switch (session) {
    case 'open':
      return 12_000
    case 'pre':
    case 'after':
      return 30_000
    case 'closed':
      return 300_000
  }
}
