import { useEffect, useId, useRef, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import type { SymbolMatch } from '@/services/marketDataService'
import { marketDataService } from '@/services/marketDataService'
import { cn } from '@/lib/cn'

// Contract: SymbolSearch
// Props: onSelect ((symbol)=>void, req), placeholder (string, opt), autoFocus (bool, opt), className (opt)
// Variants: única
// States: vacío | escribiendo | cargando | con resultados | sin resultados | error de red
// Accessibility: combobox del patrón APG — aria-expanded/controls/activedescendant,
//                navegación con ↑ ↓, alta con Enter, cierre con Escape.
//                El estado de carga se anuncia por aria-live
// Responsive: ancho fluido; el desplegable nunca supera la altura de la ventana

interface SymbolSearchProps {
  onSelect: (symbol: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

const DEBOUNCE_MS = 220

export function SymbolSearch({
  onSelect,
  placeholder = 'Buscar por ticker o nombre…',
  autoFocus = false,
  className,
}: SymbolSearchProps) {
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<SymbolMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const trimmed = query.trim()

  // Se espera a que el usuario deje de tipear: sin esto cada tecla sería un request.
  useEffect(() => {
    if (trimmed.length < 1) {
      setMatches([])
      setError(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    const handle = setTimeout(() => {
      marketDataService
        .searchSymbols(trimmed)
        .then((results) => {
          if (!active) return
          setMatches(results)
          setError(results.length ? null : 'Sin resultados')
          setHighlighted(0)
        })
        .catch(() => {
          if (active) setError('No se pudo buscar en este momento')
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      active = false
      clearTimeout(handle)
    }
  }, [trimmed])

  // Cierre al hacer clic afuera.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open])

  const commit = (symbol: string) => {
    onSelect(symbol)
    setQuery('')
    setMatches([])
    setOpen(false)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setHighlighted((index) => Math.min(index + 1, matches.length - 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted((index) => Math.max(index - 1, 0))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const match = matches[highlighted]
      // Sin resultados, se acepta lo tipeado como ticker directo.
      if (match) commit(match.symbol)
      else if (trimmed) commit(trimmed.toUpperCase())
    }
  }

  const expanded = open && trimmed.length > 0

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface-inset px-3 py-2 transition-colors duration-fast focus-within:border-ai-600/60">
        <Search size={15} strokeWidth={2.2} className="shrink-0 text-fg-subtle" aria-hidden />
        <input
          type="text"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            expanded && matches[highlighted] ? `${listId}-${highlighted}` : undefined
          }
          aria-label="Buscar una acción"
          autoComplete="off"
          autoFocus={autoFocus}
          value={query}
          placeholder={placeholder}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
        />
        {loading ? (
          <Loader2 size={14} className="shrink-0 animate-spin text-fg-subtle" aria-hidden />
        ) : null}
      </div>

      <span className="sr-only" aria-live="polite">
        {loading ? 'Buscando' : matches.length ? `${matches.length} resultados` : ''}
      </span>

      {expanded ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Resultados de la búsqueda"
          className="animate-rise absolute inset-x-0 top-full z-30 mt-1.5 max-h-72 overflow-y-auto rounded-md border border-border-strong bg-base-900 py-1 shadow-lg"
        >
          {matches.map((match, index) => (
            <li key={match.symbol} id={`${listId}-${index}`} role="option" aria-selected={index === highlighted}>
              <button
                type="button"
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => commit(match.symbol)}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-instant',
                  index === highlighted ? 'bg-base-850' : 'hover:bg-base-850/60',
                )}
              >
                <span className="num w-16 shrink-0 text-sm font-semibold text-fg">
                  {match.symbol}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-fg-muted">{match.name}</span>
                  {match.sector ? (
                    <span className="block truncate text-caption text-fg-subtle">
                      {match.sector}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}

          {!matches.length ? (
            <li className="px-3 py-2.5 text-sm text-fg-subtle">
              {loading ? 'Buscando…' : (error ?? 'Sin resultados')}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}
