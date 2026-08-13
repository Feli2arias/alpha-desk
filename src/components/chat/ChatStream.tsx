import { useEffect, useRef } from 'react'
import { useAgentChat } from '@/context/AgentChatContext'
import { Bubble } from './Bubble'
import { TypingIndicator } from './TypingIndicator'
import { AnalysisMessage } from './AnalysisMessage'

// Contract: ChatStream
// Props: ninguna — lee la conversación activa de AgentChatContext
// Variants: mensaje de texto | mensaje de análisis (render en vivo del run)
// States: con historial | agente escribiendo
// Accessibility: role="log" aria-live="polite" sobre el contenedor scrolleable
// Responsive: columna centrada de 48rem como máximo; en móvil ocupa todo el ancho

export function ChatStream() {
  const { active, typing } = useAgentChat()
  const scrollRef = useRef<HTMLDivElement>(null)

  const lastMessageId = active.messages[active.messages.length - 1]?.id

  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
  }, [lastMessageId, typing, active.id])

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      aria-label="Conversación con el agente"
      className="min-h-0 flex-1 overflow-y-auto"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 md:px-6">
        {active.messages.map((message) =>
          message.kind === 'analysis' && message.analysisId ? (
            <AnalysisMessage key={message.id} analysisId={message.analysisId} />
          ) : (
            <Bubble key={message.id} message={message} />
          ),
        )}
        {typing ? <TypingIndicator /> : null}
      </div>
    </div>
  )
}
