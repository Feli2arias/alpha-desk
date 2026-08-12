import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatPercent, formatSignedPrice } from '@/lib/format'

// Contract: Delta
// Props: percent (number, req), absolute (number, opt), size (sm|md|lg, opt), showIcon (bool, opt)
// Variants: size sm | md | lg
// States: positivo | negativo | neutro (|valor| < 0,005)
// Accessibility: la flecha acompaña al color; el signo va en el texto, no solo en el color
// Responsive: inline; en móvil se puede omitir `absolute` desde el llamador

interface DeltaProps {
  percent: number
  absolute?: number
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const SIZE_CLASSES = {
  sm: 'text-sm',
  md: 'text-body',
  lg: 'text-h2',
} as const

export function Delta({ percent, absolute, size = 'md', showIcon = true, className }: DeltaProps) {
  const isFlat = Math.abs(percent) < 0.005
  const isUp = percent > 0

  const tone = isFlat ? 'text-fg-muted' : isUp ? 'text-gain-500' : 'text-loss-500'
  const Icon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight
  const iconSize = size === 'lg' ? 18 : size === 'md' ? 15 : 13

  return (
    <span className={cn('num inline-flex items-center gap-1 font-medium', SIZE_CLASSES[size], tone, className)}>
      {showIcon ? <Icon size={iconSize} strokeWidth={2.4} aria-hidden /> : null}
      {formatPercent(percent)}
      {absolute !== undefined ? (
        <span className="text-fg-subtle">({formatSignedPrice(absolute)})</span>
      ) : null}
    </span>
  )
}
