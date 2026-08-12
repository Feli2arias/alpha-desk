import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Contract: Badge
// Props: children (ReactNode, req), tone (variante, opt), className (string, opt)
// Variants: tone = neutral | ai | gain | loss | warn | outline
// States: default (no interactivo)
// Accessibility: solo texto; el color nunca es el único portador de significado
// Responsive: inline, no cambia por breakpoint

type BadgeTone = 'neutral' | 'ai' | 'gain' | 'loss' | 'warn' | 'outline'

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-base-800 text-base-300 border-transparent',
  ai: 'bg-ai-600/15 text-ai-300 border-ai-600/40',
  gain: 'bg-gain-600/15 text-gain-500 border-gain-600/35',
  loss: 'bg-loss-600/15 text-loss-500 border-loss-600/35',
  warn: 'bg-warn-500/12 text-warn-500 border-warn-500/30',
  outline: 'bg-transparent text-fg-muted border-border-strong',
}

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 text-caption font-medium tracking-[0.06em] uppercase',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
