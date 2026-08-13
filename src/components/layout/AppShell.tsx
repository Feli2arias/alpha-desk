import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Sparkles, X } from 'lucide-react'
import { Sidebar } from './Sidebar'

// Contract: AppShell
// Props: children (ReactNode, req)
// Variants: única
// States: drawer de navegación abierto/cerrado (<lg)
// Accessibility: skip link al contenido, drawer con aria-modal, atajo ⌘K a la vista del agente
// Responsive: <lg barra superior + drawer; ≥lg sidebar fija y contenido con scroll propio

export function AppShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)
  const navigate = useNavigate()

  // ⌘K / Ctrl+K lleva al agente desde cualquier vista.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        navigate('/agente')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate])

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-ai-600 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Saltar al contenido
      </a>

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {navOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-base-950/70 lg:hidden"
            onClick={() => setNavOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navegación"
            className="animate-slide-in fixed inset-y-0 left-0 z-50 lg:hidden"
          >
            <Sidebar onNavigate={() => setNavOpen(false)} />
          </div>
        </>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setNavOpen((previous) => !previous)}
            aria-label={navOpen ? 'Cerrar navegación' : 'Abrir navegación'}
            className="rounded-sm p-1.5 text-fg-muted transition-colors duration-fast hover:bg-base-850"
          >
            {navOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <p className="flex-1 text-h3 font-semibold">Alpha Desk</p>
          <button
            type="button"
            onClick={() => navigate('/agente')}
            aria-label="Ir al agente"
            className="rounded-sm p-1.5 text-ai-400 transition-colors duration-fast hover:bg-base-850"
          >
            <Sparkles size={18} strokeWidth={2.3} />
          </button>
        </header>

        <main id="contenido" className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
