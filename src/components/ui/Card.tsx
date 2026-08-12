import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Contract: Card
// Props: children (ReactNode, req), className (string, opt), padded (bool, opt), as (elemento, opt)
// Variants: padded true|false
// States: default (estático, sin interacción propia)
// Accessibility: contenedor semántico neutro; el rol lo define quien lo usa
// Responsive: fluido, hereda el ancho del contenedor padre

interface CardProps {
  children: ReactNode
  className?: string
  padded?: boolean
}

export function Card({ children, className, padded = true }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface',
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
  className?: string
}

export function CardHeader({ title, hint, action, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-4', className)}>
      <div>
        <h2 className="text-h3 font-semibold text-fg">{title}</h2>
        {hint ? <p className="mt-0.5 text-sm text-fg-subtle">{hint}</p> : null}
      </div>
      {action}
    </div>
  )
}
