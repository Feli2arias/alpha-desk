import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Contract: Card
// Props: children (ReactNode, req), className (opt), padded (bool, opt), tone (panel|inset, opt)
// Variants: tone panel (elevada, por defecto) | inset (hundida, para pozos de datos); padded true|false
// States: default (estático, sin interacción propia)
// Accessibility: contenedor semántico neutro; el rol lo define quien lo usa
// Responsive: fluido, hereda el ancho del contenedor padre

interface CardProps {
  children: ReactNode
  className?: string
  padded?: boolean
  tone?: 'panel' | 'inset'
}

export function Card({ children, className, padded = true, tone = 'panel' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border',
        tone === 'panel'
          ? 'border-border bg-surface shadow-panel'
          : 'border-border-subtle bg-surface-inset',
        padded && 'p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  hint?: string
  action?: ReactNode
  /** Línea divisoria bajo el encabezado. Ayuda cuando el cuerpo es una lista densa. */
  divided?: boolean
  className?: string
}

export function CardHeader({ title, hint, action, divided = false, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4',
        divided ? 'mb-4 border-b border-border-subtle pb-3' : 'mb-4',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-h3 font-semibold text-fg">{title}</h2>
        {hint ? <p className="mt-0.5 text-sm text-fg-subtle">{hint}</p> : null}
      </div>
      {action}
    </div>
  )
}
