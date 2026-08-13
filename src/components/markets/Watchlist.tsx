import { X } from 'lucide-react'
import type { Company, Quote } from '@/types'
import { useWatchlist } from '@/context/WatchlistContext'
import { brandColor } from '@/lib/brandColors'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Delta } from '@/components/ui/Delta'
import { TickerAvatar } from '@/components/ui/TickerAvatar'

// Contract: Watchlist
// Props: quotes (Quote[], req), companies (Company[], req), selected (string, req), onSelect ((t)=>void, req)
// Variants: fila seleccionada | no seleccionada
// States: default | hover | focus-visible | seleccionada | sin cotización todavía | lista vacía
// Accessibility: cada fila es un <button> con aria-current; el botón de quitar tiene
//                aria-label propio y es alcanzable por teclado (no depende del hover)
// Responsive: columna fija en ≥lg; en <lg se muestra debajo del gráfico
//
// El alta de tickers vive en SymbolSearch: acá sólo se listan y se quitan.

interface WatchlistProps {
  quotes: readonly Quote[]
  companies: readonly Company[]
  selected: string
  onSelect: (ticker: string) => void
}

export function Watchlist({ quotes, companies, selected, onSelect }: WatchlistProps) {
  const { tickers, remove } = useWatchlist()

  const companyByTicker = new Map(companies.map((company) => [company.ticker, company]))
  const quoteByTicker = new Map(quotes.map((quote) => [quote.ticker, quote]))

  if (tickers.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-fg-subtle">
        Watchlist vacía. Buscá una acción arriba para agregarla.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {tickers.map((ticker) => {
        const company = companyByTicker.get(ticker)
        const quote = quoteByTicker.get(ticker)
        const isSelected = ticker === selected

        return (
          <li key={ticker} className="group relative">
            <button
              type="button"
              onClick={() => onSelect(ticker)}
              aria-current={isSelected ? 'true' : undefined}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md border py-2 pr-8 pl-2.5 text-left transition-colors duration-fast',
                isSelected
                  ? 'border-ai-600/45 bg-ai-600/10'
                  : 'border-transparent hover:border-border hover:bg-base-850/60',
              )}
            >
              <TickerAvatar
                ticker={ticker}
                brandColor={company?.brandColor ?? brandColor(ticker)}
                size={28}
              />
              <span className="min-w-0 flex-1">
                <span className="num block text-sm font-semibold text-fg">{ticker}</span>
                <span className="block truncate text-caption text-fg-subtle">
                  {company?.name ?? quote?.name ?? '—'}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="num block text-sm text-fg-muted">
                  {quote ? formatPrice(quote.price) : '—'}
                </span>
                {quote ? (
                  <Delta percent={quote.changePercent} size="sm" showIcon={false} />
                ) : null}
              </span>
            </button>

            <button
              type="button"
              onClick={() => remove(ticker)}
              aria-label={`Quitar ${ticker} de la watchlist`}
              className="absolute top-1/2 right-1 -translate-y-1/2 rounded-sm p-1 text-fg-subtle opacity-0 transition-opacity duration-fast group-hover:opacity-100 hover:text-loss-500 focus-visible:opacity-100"
            >
              <X size={13} strokeWidth={2.6} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
