import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Contract: Stat
// Props: label (string, req), value (ReactNode, req), hint (ReactNode, opt),
//        tone (default|gain|loss|muted, opt), className (opt)
// Variants: tone según el signo del dato; el valor va en cifras tabulares
// States: con valor | sin dato (se pasa "—" como value)
// Accessibility: par <dt>/<dd> — debe usarse dentro de un <dl>
// Responsive: la grilla la define el contenedor; el valor nunca corta palabra

interface StatProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'default' | 'gain' | 'loss' | 'muted'
  className?: string
}

const TONE_CLASSES = {
  default: 'text-fg',
  gain: 'text-gain-500',
  loss: 'text-loss-500',
  muted: 'text-fg-muted',
} as const

export function Stat({ label, value, hint, tone = 'default', className }: StatProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-caption uppercase tracking-[0.08em] text-fg-subtle">{label}</dt>
      <dd className={cn('num mt-1 truncate text-sm font-medium', TONE_CLASSES[tone])}>{value}</dd>
      {hint ? <p className="mt-0.5 truncate text-caption text-fg-subtle">{hint}</p> : null}
    </div>
  )
}
