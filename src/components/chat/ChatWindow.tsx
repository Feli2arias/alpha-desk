import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CornerDownLeft, Sparkles } from 'lucide-react'
import type { ChatContext } from '@/types'
import { useChat } from '@/hooks/useChat'
import { cn } from '@/lib/cn'
import { Bubble } from './Bubble'
import { TypingIndicator } from './TypingIndicator'

// Contract: ChatWindow
// Props: context (ChatContext, req), className (string, opt), autoFocus (bool, opt)
// Variants: scope global | stock — cambia saludo, sugerencias y contexto del servicio
// States: idle | typing (indicador + input deshabilitado) | con historial
// Accessibility: log con aria-live="polite"; input con <label> oculto; chips son <button>
// Responsive: ocupa el alto del contenedor; el input queda fijo abajo en cualquier tamaño

interface ChatWindowProps {
  context: ChatContext
  className?: string
  autoFocus?: boolean
}

export function ChatWindow({ context, className, autoFocus = false }: ChatWindowProps) {
  const { messages, typing, suggestions, send } = useChat(context)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
  }, [messages.length, typing])

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    send(draft)
    setDraft('')
  }

  const showSuggestions = messages.length <= 1 && !typing

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Conversación con el agente"
        className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4"
      >
        {messages.map((message) => (
          <Bubble key={message.id} message={message} />
        ))}
        {typing ? <TypingIndicator /> : null}
      </div>

      {showSuggestions ? (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
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

      <form onSubmit={submit} className="border-t border-border p-3">
        <label htmlFor="chat-input" className="sr-only">
          Escribí tu pregunta para el agente
        </label>
        <div className="flex items-center gap-2 rounded-md border border-border bg-base-950 px-3 py-2 transition-colors duration-fast focus-within:border-ai-600/60">
          <Sparkles size={15} className="shrink-0 text-ai-400" aria-hidden />
          <input
            id="chat-input"
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={typing}
            autoComplete="off"
            placeholder={
              context.scope === 'stock'
                ? `Preguntá sobre ${context.ticker}…`
                : 'Preguntá sobre el mercado o los picks…'
            }
            className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={typing || draft.trim() === ''}
            aria-label="Enviar mensaje"
            className="shrink-0 rounded-sm p-1 text-fg-subtle transition-colors duration-fast hover:text-ai-400 disabled:pointer-events-none disabled:opacity-30"
          >
            <CornerDownLeft size={15} strokeWidth={2.4} />
          </button>
        </div>
      </form>
    </div>
  )
}
