import { useState, type ReactNode } from 'react'
import { Menu, MessageSquare, X } from 'lucide-react'
import { useChatDock } from '@/context/ChatDockContext'
import { ChatDock } from '@/components/chat/ChatDock'
import { Sidebar } from './Sidebar'

// Contract: AppShell
// Props: children (ReactNode, req)
// Variants: única
// States: drawer de navegación abierto/cerrado (solo <lg); dock de chat abierto/cerrado
// Accessibility: skip link al contenido, drawer con aria-modal, botón flotante etiquetado
// Responsive: <lg barra superior + drawer; ≥lg sidebar fija y contenido con scroll propio

export function AppShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)
  const { openGlobal, open: chatOpen } = useChatDock()

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
          <p className="text-h3 font-semibold">Alpha Desk</p>
        </header>

        <main id="contenido" className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {!chatOpen ? (
        <button
          type="button"
          onClick={openGlobal}
          className="fixed right-5 bottom-5 z-30 flex items-center gap-2 rounded-lg border border-ai-600/40 bg-ai-600/15 px-4 py-3 text-sm font-medium text-ai-300 backdrop-blur-sm transition-transform duration-fast ease-out-soft hover:scale-[1.03] hover:text-fg"
          style={{ boxShadow: 'var(--shadow-glow-ai)' }}
        >
          <MessageSquare size={16} strokeWidth={2.3} aria-hidden />
          Hablar con el agente
        </button>
      ) : null}

      <ChatDock />
    </div>
  )
}
