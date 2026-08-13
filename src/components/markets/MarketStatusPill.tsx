import { useEffect, useState } from 'react'
import type { DataSource, MarketSession, MarketStatus } from '@/types'
import { lastRefreshedAt } from '@/services/quoteStream'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/cn'

// Contract: MarketStatusPill
// Props: status (MarketStatus, req), source (DataSource, opt), className (opt)
// Variants: una por sesión (open|pre|after|closed) + variante degradada cuando la fuente es simulada
// States: con hora de refresco | sin refresco todavía (muestra "—")
// Accessibility: el punto es aria-hidden; el texto por sí solo dice la sesión y la hora.
//                Sólo late cuando el mercado opera, así no distrae de noche
// Responsive: la hora se oculta en <sm para que la píldora no rompa el encabezado

interface MarketStatusPillProps {
  status: MarketStatus
  source?: DataSource
  className?: string
}

const SESSION_STYLES: Record<MarketSession, { dot: string; text: string; ring: string }> = {
  open: {
    dot: 'bg-gain-500',
    text: 'text-gain-500',
    ring: 'border-gain-600/35 bg-gain-600/10',
  },
  pre: {
    dot: 'bg-warn-500',
    text: 'text-warn-500',
    ring: 'border-warn-500/30 bg-warn-500/10',
  },
  after: {
    dot: 'bg-warn-500',
    text: 'text-warn-500',
    ring: 'border-warn-500/30 bg-warn-500/10',
  },
  closed: {
    dot: 'bg-base-500',
    text: 'text-fg-muted',
    ring: 'border-border bg-base-900',
  },
}

export function MarketStatusPill({ status, source = 'live', className }: MarketStatusPillProps) {
  const simulated = source === 'simulated'
  const style = simulated ? SESSION_STYLES.closed : SESSION_STYLES[status.session]
  const refreshedAt = useRefreshClock()

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-caption uppercase tracking-[0.08em]',
        style.ring,
        style.text,
        className,
      )}
    >
      <span
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          style.dot,
          // Latir sólo cuando hay negociación real: de noche sería ruido.
          status.trading && !simulated && 'animate-live',
        )}
        aria-hidden
      />
      {simulated ? 'Datos simulados' : status.label}
      {refreshedAt ? (
        <span className="num hidden text-fg-subtle sm:inline">{formatTime(refreshedAt)}</span>
      ) : null}
    </span>
  )
}

/** Hora del último refresco. Se relee sola para no quedar congelada en pantalla. */
function useRefreshClock(): string | null {
  const [value, setValue] = useState<string | null>(() => lastRefreshedAt())

  useEffect(() => {
    const handle = setInterval(() => {
      setValue(lastRefreshedAt())
    }, 5_000)
    return () => {
      clearInterval(handle)
    }
  }, [])

  return value
}
