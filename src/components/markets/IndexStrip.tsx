import type { MarketIndex } from '@/types'
import { formatNumber } from '@/lib/format'
import { Delta } from '@/components/ui/Delta'
import { Skeleton } from '@/components/ui/Skeleton'

// Contract: IndexStrip
// Props: indices (MarketIndex[], req)
// Variants: índice directo | valor tomado de un ETF que lo replica (lleva marca "vía SPY")
// States: cargando (skeletons) | con datos
// Accessibility: <ul> de índices; el nombre, el valor y la variación se leen juntos.
//                La marca de proxy es texto, no sólo un ícono
// Responsive: dos columnas en <md, cuatro desde md

export function IndexStrip({ indices }: { indices: readonly MarketIndex[] }) {
  if (!indices.length) {
    return (
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4" aria-busy>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[4.75rem]" />
        ))}
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {indices.map((index) => (
        <li
          key={index.symbol}
          className="rounded-md border border-border bg-surface px-3.5 py-3 shadow-panel"
        >
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-caption uppercase tracking-[0.1em] text-fg-subtle">
              {index.name}
            </p>
            {index.proxy && index.proxySymbol ? (
              <span
                className="num shrink-0 text-caption text-fg-subtle/70"
                title={`Valor tomado del ETF ${index.proxySymbol}, que replica el índice`}
              >
                vía {index.proxySymbol}
              </span>
            ) : null}
          </div>
          <p className="num mt-1 text-h3 font-semibold text-fg">{formatNumber(index.value)}</p>
          <Delta percent={index.changePercent} size="sm" className="mt-0.5" />
        </li>
      ))}
    </ul>
  )
}
