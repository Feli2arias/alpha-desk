import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import type { Company, Quote } from '@/types'
import { useWatchlist } from '@/context/WatchlistContext'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Delta } from '@/components/ui/Delta'
import { TickerAvatar } from '@/components/ui/TickerAvatar'

// Contract: Watchlist
// Props: quotes (Quote[], req), companies (Company[], req), selected (string, req), onSelect ((t)=>void, req)
// Variants: fila seleccionada | no seleccionada
// States: default | hover | focus-visible | seleccionada | error de alta (ticker inexistente)
// Accessibility: cada fila es un <button>; el botón de quitar tiene aria-label propio;
//                el error del formulario se anuncia con role="alert"
// Responsive: columna fija en ≥lg; en <lg se muestra debajo del gráfico

interface WatchlistProps {
  quotes: readonly Quote[]
  companies: readonly Company[]
  selected: string
  onSelect: (ticker: string) => void
}

export function Watchlist({ quotes, companies, selected, onSelect }: WatchlistProps) {
  const { tickers, add, remove } = useWatchlist()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const companyByTicker = new Map(companies.map((company) => [company.ticker, company]))
  const quoteByTicker = new Map(quotes.map((quote) => [quote.ticker, quote]))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const upper = draft.trim().toUpperCase()
    if (!upper) return

    if (!companyByTicker.has(upper)) {
      setError(`${upper} no está en el universo del mockup`)
      return
    }
    if (tickers.includes(upper)) {
      setError(`${upper} ya está en la watchlist`)
      return
    }

    add(upper)
    setDraft('')
    setError(null)
  }

  return (
    <div className="flex flex-col">
      <form onSubmit={submit} className="mb-3">
        <label htmlFor="watchlist-input" className="sr-only">
          Agregar ticker a la watchlist
        </label>
        <div className="flex items-center gap-2 rounded-md border border-border bg-base-950 px-3 py-2 transition-colors duration-fast focus-within:border-ai-600/60">
          <input
            id="watchlist-input"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value)
              setError(null)
            }}
            placeholder="Agregar ticker (ej. AVGO)"
            autoComplete="off"
            className="num min-w-0 flex-1 bg-transparent text-sm uppercase text-fg outline-none placeholder:normal-case placeholder:text-fg-subtle"
          />
          <button
            type="submit"
            aria-label="Agregar a la watchlist"
            className="shrink-0 rounded-sm p-0.5 text-fg-subtle transition-colors duration-fast hover:text-ai-400"
          >
            <Plus size={16} strokeWidth={2.4} />
          </button>
        </div>
        {error ? (
          <p role="alert" className="mt-1.5 text-caption text-loss-500">
            {error}
          </p>
        ) : null}
      </form>

      <ul className="flex flex-col gap-1">
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
                  'flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors duration-fast',
                  isSelected
                    ? 'border-ai-600/45 bg-ai-600/10'
                    : 'border-transparent hover:border-border hover:bg-base-850/60',
                )}
              >
                <TickerAvatar
                  ticker={ticker}
                  brandColor={company?.brandColor ?? '#8e9aa6'}
                  size={28}
                />
                <span className="min-w-0 flex-1">
                  <span className="num block text-sm font-semibold text-fg">{ticker}</span>
                  <span className="block truncate text-caption text-fg-subtle">
                    {company?.name ?? 'Sin datos'}
                  </span>
                </span>
                <span className="text-right">
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
                className="absolute top-1/2 right-1 -translate-y-1/2 rounded-sm bg-base-900 p-1 text-fg-subtle opacity-0 transition-opacity duration-fast group-hover:opacity-100 focus-visible:opacity-100 hover:text-loss-500"
              >
                <X size={13} strokeWidth={2.6} />
              </button>
            </li>
          )
        })}
      </ul>

      {tickers.length === 0 ? (
        <p className="py-6 text-center text-sm text-fg-subtle">
          Watchlist vacía. Agregá un ticker arriba.
        </p>
      ) : null}
    </div>
  )
}
