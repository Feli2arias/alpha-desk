import { useState } from 'react'
import { History, SquarePen, Sparkles } from 'lucide-react'
import { useAgentChat } from '@/context/AgentChatContext'
import { useAnalysis } from '@/context/AnalysisContext'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'
import { ChatStream } from '@/components/chat/ChatStream'
import { ChatComposer } from '@/components/chat/ChatComposer'
import { ChatOptionsBar } from '@/components/chat/ChatOptionsBar'
import { ConversationList } from '@/components/chat/ConversationList'

/**
 * El agente como vista completa: ocupa toda el área de contenido, con la
 * lista de conversaciones a la izquierda y el hilo al centro.
 */
export function AgentPage() {
  const { active, typing, suggestions, send, newConversation } = useAgentChat()
  const { activeCount } = useAnalysis()
  const [historyOpen, setHistoryOpen] = useState(false)

  const showSuggestions = active.messages.length <= 1 && !typing

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <aside
        aria-label="Conversaciones"
        className="hidden w-64 shrink-0 flex-col border-r border-border bg-base-950 lg:flex"
      >
        <div className="p-3">
          <button
            type="button"
            onClick={() => newConversation()}
            className="flex w-full items-center gap-2 rounded-md border border-ai-600/40 bg-ai-600/12 px-3 py-2 text-sm font-medium text-ai-300 transition-colors duration-fast hover:bg-ai-600/20 hover:text-fg"
          >
            <SquarePen size={15} strokeWidth={2.3} aria-hidden />
            Conversación nueva
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ConversationList />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-6">
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 truncate text-h2 font-semibold">
              <Sparkles size={18} strokeWidth={2.3} className="shrink-0 text-ai-400" aria-hidden />
              {active.title}
            </h1>
            <p className="mt-0.5 truncate text-sm text-fg-subtle">
              {activeCount > 0
                ? `${activeCount} análisis corriendo ahora`
                : active.focusTicker
                  ? `Contexto acotado a ${active.focusTicker}`
                  : 'Pipeline de hoy en contexto — 500 acciones, 47 filtradas, 10 elegidas'}
            </p>
          </div>

          {activeCount > 0 ? (
            <Badge tone="ai" className="animate-live">
              live
            </Badge>
          ) : null}

          <button
            type="button"
            onClick={() => setHistoryOpen((previous) => !previous)}
            aria-expanded={historyOpen}
            aria-label="Historial de conversaciones"
            className={cn(
              'shrink-0 rounded-sm p-2 transition-colors duration-fast hover:bg-base-850 hover:text-fg lg:hidden',
              historyOpen ? 'bg-base-850 text-fg' : 'text-fg-subtle',
            )}
          >
            <History size={16} strokeWidth={2.3} />
          </button>
          <button
            type="button"
            onClick={() => newConversation()}
            aria-label="Conversación nueva"
            className="shrink-0 rounded-sm p-2 text-fg-subtle transition-colors duration-fast hover:bg-base-850 hover:text-fg lg:hidden"
          >
            <SquarePen size={16} strokeWidth={2.3} />
          </button>
        </header>

        {historyOpen ? (
          <div className="lg:hidden">
            <ConversationList onSelect={() => setHistoryOpen(false)} />
          </div>
        ) : null}

        <div className="border-b border-border">
          <div className="mx-auto max-w-3xl px-1 md:px-3">
            <ChatOptionsBar />
          </div>
        </div>

        <ChatStream />

        {showSuggestions ? (
          <div className="mx-auto flex w-full max-w-3xl flex-wrap gap-1.5 px-4 pb-2.5 md:px-6">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                className="rounded-sm border border-border bg-base-950 px-2.5 py-1.5 text-caption text-fg-muted transition-colors duration-fast hover:border-ai-600/50 hover:text-fg"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        <div className="border-t border-border">
          <div className="mx-auto w-full max-w-3xl px-1 md:px-3">
              <ChatComposer
              onSend={send}
              disabled={typing}
              autoFocus
              placeholder={
                active.focusTicker
                  ? `Preguntá sobre ${active.focusTicker} o pedí "revisá ${active.focusTicker}"…`
                  : 'Pedile un análisis: "revisá NVDA"…'
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
