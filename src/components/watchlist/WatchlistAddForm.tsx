import { useId, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { useWatchlist } from '@/context/WatchlistContext'
import { COMPANY_SEEDS } from '@/data/companies'
import { resolveTicker } from '@/lib/tickers'

// Contract: WatchlistAddForm
// Props: onAdded ((ticker)=>void, opt)
// Variants: única
// States: vacío | con texto | error (fuera del universo o ya seguida)
// Accessibility: <label> oculto, <datalist> para sugerencias, error con role="alert"
// Responsive: el input crece; el botón mantiene su ancho

export function WatchlistAddForm({ onAdded }: { onAdded?: (ticker: string) => void }) {
  const { tickers, add } = useWatchlist()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const listId = useId()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const raw = draft.trim()
    if (!raw) return

    // Acepta ticker o nombre: "AVGO" y "broadcom" resuelven a lo mismo.
    const ticker = resolveTicker(raw)
    if (!ticker) {
      setError(`No encontré "${raw}" en el universo del mockup`)
      return
    }
    if (tickers.includes(ticker)) {
      setError(`${ticker} ya está en la watchlist`)
      return
    }

    add(ticker)
    setDraft('')
    setError(null)
    onAdded?.(ticker)
  }

  return (
    <form onSubmit={submit} className="w-full sm:w-80">
      <label htmlFor="watchlist-add" className="sr-only">
        Agregar una acción a la watchlist
      </label>
      <div className="flex items-center gap-2 rounded-md border border-border bg-base-950 px-3 py-2 transition-colors duration-fast focus-within:border-ai-600/60">
        <input
          id="watchlist-add"
          list={listId}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            setError(null)
          }}
          placeholder="Agregar por ticker o nombre (ej. broadcom)"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
        />
        <datalist id={listId}>
          {COMPANY_SEEDS.map((seed) => (
            <option key={seed.ticker} value={seed.ticker}>
              {seed.name}
            </option>
          ))}
        </datalist>
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
  )
}
