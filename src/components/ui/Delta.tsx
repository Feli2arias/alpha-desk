import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatPercent, formatSignedPrice } from '@/lib/format'

// Contract: Delta
// Props: percent (number, req), absolute (number, opt), size (sm|md|lg, opt),
//        showIcon (bool, opt), chip (bool, opt)
// Variants: size sm | md | lg; chip true la envuelve en una píldora tintada
// States: positivo | negativo | neutro (|valor| < 0,005)
// Accessibility: la flecha acompaña al color; el signo va en el texto, no solo en el color
// Responsive: inline; en móvil se puede omitir `absolute` desde el llamador

interface DeltaProps {
  percent: number
  absolute?: number
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  /** Píldora con fondo tintado. Se usa donde el dato tiene que saltar a la vista. */
  chip?: boolean
  className?: string
}

const SIZE_CLASSES = {
  sm: 'text-sm',
  md: 'text-body',
  lg: 'text-h2',
} as const

const CHIP_CLASSES = {
  flat: 'bg-base-800/70',
  up: 'bg-gain-600/12',
  down: 'bg-loss-600/12',
} as const

export function Delta({
  percent,
  absolute,
  size = 'md',
  showIcon = true,
  chip = false,
  className,
}: DeltaProps) {
  const isFlat = Math.abs(percent) < 0.005
  const isUp = percent > 0

  const tone = isFlat ? 'text-fg-muted' : isUp ? 'text-gain-500' : 'text-loss-500'
  const Icon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight
  const iconSize = size === 'lg' ? 18 : size === 'md' ? 15 : 13
  const chipTone = isFlat ? CHIP_CLASSES.flat : isUp ? CHIP_CLASSES.up : CHIP_CLASSES.down

  return (
    <span
      className={cn(
        'num inline-flex items-center gap-1 font-medium',
        SIZE_CLASSES[size],
        tone,
        chip && `rounded-sm px-1.5 py-0.5 ${chipTone}`,
        className,
      )}
    >
      {showIcon ? <Icon size={iconSize} strokeWidth={2.4} aria-hidden /> : null}
      {formatPercent(percent)}
      {absolute !== undefined ? (
        <span className="text-fg-subtle">({formatSignedPrice(absolute)})</span>
      ) : null}
    </span>
  )
}
