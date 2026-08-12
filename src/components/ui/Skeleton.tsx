import { cn } from '@/lib/cn'

// Contract: Skeleton
// Props: className (string, opt)
// Variants: la forma la define el className del llamador
// States: único — placeholder de carga
// Accessibility: aria-hidden; el contenedor debe exponer aria-busy
// Responsive: hereda del contenedor

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-md bg-base-850', className)}
      aria-hidden
    >
      <div className="animate-sweep absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-base-800 to-transparent" />
    </div>
  )
}
