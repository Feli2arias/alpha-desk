import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useChatDock } from '@/context/ChatDockContext'
import { ChatWindow } from './ChatWindow'
import { Badge } from '@/components/ui/Badge'

// Contract: ChatDock
// Props: ninguna — lee todo de ChatDockContext
// Variants: contexto global | contexto de una acción (muestra el ticker en el encabezado)
// States: cerrado (no renderiza panel) | abierto (overlay + panel)
// Accessibility: role="dialog" aria-modal, cierra con Escape, overlay clickeable
// Responsive: <md ocupa todo el ancho; ≥md panel de 26rem anclado a la derecha

export function ChatDock() {
  const { open, context, close } = useChatDock()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, close])

  if (!open) return null

  const isStock = context.scope === 'stock'

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-base-950/70 backdrop-blur-[2px]"
        onClick={close}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={isStock ? `Chat sobre ${context.ticker}` : 'Chat con el agente'}
        className="animate-slide-in fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-surface shadow-lg md:w-[26rem]"
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-h3 font-semibold">
                {isStock ? `Hablemos de ${context.ticker}` : 'Agente de IA'}
              </h2>
              <Badge tone="ai">{isStock ? 'Contexto acotado' : 'Contexto global'}</Badge>
            </div>
            <p className="mt-0.5 truncate text-sm text-fg-subtle">
              {isStock
                ? 'Solo con la tesis, métricas y noticias de esta acción'
                : 'Con el run completo del pipeline de hoy en contexto'}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar chat"
            className="shrink-0 rounded-sm p-1.5 text-fg-subtle transition-colors duration-fast hover:bg-base-850 hover:text-fg"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </header>

        <ChatWindow context={context} className="flex-1" autoFocus />
      </aside>
    </>
  )
}
