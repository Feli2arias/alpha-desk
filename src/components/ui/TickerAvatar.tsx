import { cn } from '@/lib/cn'

// Contract: TickerAvatar
// Props: ticker (string, req), brandColor (hex, req), size (px, opt)
// Variants: tamaño libre
// States: estático
// Accessibility: aria-hidden — el ticker siempre está escrito al lado en texto
// Responsive: tamaño fijo por instancia

interface TickerAvatarProps {
  ticker: string
  brandColor: string
  size?: number
  className?: string
}

export function TickerAvatar({ ticker, brandColor, size = 36, className }: TickerAvatarProps) {
  return (
    <span
      className={cn(
        'num inline-flex shrink-0 items-center justify-center rounded-md font-semibold',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        color: brandColor,
        backgroundColor: `${brandColor}1f`,
        boxShadow: `inset 0 0 0 1px ${brandColor}33`,
      }}
      aria-hidden
    >
      {ticker.slice(0, 2)}
    </span>
  )
}
