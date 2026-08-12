import { useId } from 'react'
import { cn } from '@/lib/cn'

// Contract: Sparkline
// Props: values (number[], req), positive (bool, req), height (px, opt), className (string, opt)
// Variants: positive true → verde | false → rojo
// States: con datos | sin datos (renderiza una línea base tenue)
// Accessibility: decorativo — aria-hidden; el dato numérico siempre está al lado
// Responsive: SVG con viewBox y preserveAspectRatio="none", ocupa el ancho disponible

interface SparklineProps {
  values: readonly number[]
  positive: boolean
  height?: number
  className?: string
}

export function Sparkline({ values, positive, height = 40, className }: SparklineProps) {
  const gradientId = useId()

  if (values.length < 2) {
    return (
      <div
        className={cn('w-full border-b border-dashed border-border', className)}
        style={{ height }}
        aria-hidden
      />
    )
  }

  const width = 100
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width
    const y = height - ((value - min) / span) * (height * 0.86) - height * 0.07
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  const line = `M ${points.join(' L ')}`
  const area = `${line} L ${width},${height} L 0,${height} Z`
  const stroke = positive ? 'var(--color-gain-500)' : 'var(--color-loss-500)'

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('w-full', className)}
      style={{ height }}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
