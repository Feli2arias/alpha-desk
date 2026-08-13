import { NavLink } from 'react-router-dom'
import { Activity, CandlestickChart, LayoutGrid, Sparkles, Star, Workflow } from 'lucide-react'
import { useAnalysis } from '@/context/AnalysisContext'
import { useWatchlist } from '@/context/WatchlistContext'
import { cn } from '@/lib/cn'

// Contract: Sidebar
// Props: onNavigate (()=>void, opt) — usado para cerrar el drawer en móvil
// Variants: fija en ≥lg, drawer en <lg (lo controla AppShell)
// States: link default | hover | active (ruta actual) | focus-visible
// Accessibility: <nav aria-label>; NavLink expone aria-current="page"
// Responsive: <lg oculta, ≥lg columna fija de var(--spacing-sidebar)

const NAV_ITEMS = [
  { to: '/agente', label: 'Agente', icon: Sparkles, end: false },
  { to: '/', label: 'Top 10 del día', icon: LayoutGrid, end: true },
  { to: '/watchlist', label: 'Watchlist', icon: Star, end: false },
  { to: '/markets', label: 'Markets', icon: CandlestickChart, end: false },
  { to: '/pipeline', label: 'Pipeline', icon: Workflow, end: false },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { activeCount } = useAnalysis()
  const { tickers } = useWatchlist()

  return (
    <nav
      aria-label="Navegación principal"
      className="flex h-full w-(--spacing-sidebar) shrink-0 flex-col border-r border-border bg-base-950"
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="relative flex size-8 items-center justify-center rounded-md bg-ai-600/15 ring-1 ring-ai-600/40">
          <Activity size={16} className="text-ai-400" strokeWidth={2.5} />
        </span>
        <div className="leading-tight">
          <p className="text-h3 font-semibold tracking-tight">Alpha Desk</p>
          <p className="text-caption uppercase tracking-[0.12em] text-fg-subtle">Agentes de IA</p>
        </div>
      </div>

      <ul className="flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-fast',
                  isActive
                    ? 'bg-base-850 text-fg'
                    : 'text-fg-subtle hover:bg-base-900 hover:text-fg-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={16} strokeWidth={2.2} className={isActive ? 'text-ai-400' : ''} />
                  <span className="flex-1">{item.label}</span>
                  {item.to === '/watchlist' && tickers.length > 0 ? (
                    <span className="num text-caption text-fg-subtle">{tickers.length}</span>
                  ) : null}
                  {item.to === '/agente' && activeCount > 0 ? (
                    <span
                      className="animate-live size-1.5 rounded-full bg-ai-400"
                      aria-label={`${activeCount} análisis en curso`}
                    />
                  ) : null}
                  {item.to === '/agente' ? (
                    <kbd className="num rounded-sm border border-border px-1.5 py-0.5 text-caption text-fg-subtle">
                      ⌘K
                    </kbd>
                  ) : null}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>


      <div className="mt-auto px-5 py-5">
        <p className="text-caption uppercase tracking-[0.1em] text-fg-subtle">Mockup</p>
        <p className="mt-1.5 text-sm leading-snug text-fg-subtle">
          Datos simulados. No es asesoramiento financiero.
        </p>
      </div>
    </nav>
  )
}
