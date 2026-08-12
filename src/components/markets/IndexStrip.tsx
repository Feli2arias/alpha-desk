import type { MarketIndex } from '@/types'
import { formatNumber } from '@/lib/format'
import { Delta } from '@/components/ui/Delta'
import { Skeleton } from '@/components/ui/Skeleton'

// Contract: IndexStrip
// Props: indices (MarketIndex[], req)
// Variants: única
// States: cargando (skeletons) | con datos
// Accessibility: <ul> de índices; cada valor se lee con su nombre
// Responsive: scroll horizontal en <md, grilla de 4 desde md

export function IndexStrip({ indices }: { indices: readonly MarketIndex[] }) {
  if (!indices.length) {
    return (
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4" aria-busy>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[4.5rem]" />
        ))}
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {indices.map((index) => (
        <li key={index.symbol} className="rounded-md border border-border bg-surface px-3.5 py-3">
          <p className="text-caption uppercase tracking-[0.1em] text-fg-subtle">{index.name}</p>
          <p className="num mt-1 text-h3 font-semibold text-fg">{formatNumber(index.value)}</p>
          <Delta percent={index.changePercent} size="sm" className="mt-0.5" />
        </li>
      ))}
    </ul>
  )
}
