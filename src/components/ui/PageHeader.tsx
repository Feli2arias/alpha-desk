import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Contract: PageHeader
// Props: eyebrow (string, opt), title (string, req), description (ReactNode, opt),
//        actions (ReactNode, opt), size (md|lg, opt)
// Variants: size md (vistas de trabajo) | lg (portada del dashboard)
// States: único
// Accessibility: el título es el <h1> de la vista; el eyebrow es decorativo y no lo reemplaza
// Responsive: acciones debajo del título en <sm, alineadas a la derecha desde sm

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
  size?: 'md' | 'lg'
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  size = 'md',
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-caption uppercase tracking-[0.14em] text-ai-400">{eyebrow}</p>
        ) : null}
        <h1
          className={cn(
            'font-semibold text-fg',
            size === 'lg' ? 'mt-2 text-display' : 'text-h1',
            eyebrow && size === 'md' && 'mt-1.5',
          )}
        >
          {title}
        </h1>
        {description ? (
          <div className="mt-2 max-w-2xl text-sm text-fg-muted">{description}</div>
        ) : null}
      </div>

      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  )
}
