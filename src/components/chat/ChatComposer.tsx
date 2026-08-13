import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { CornerDownLeft, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'

// Contract: ChatComposer
// Props: onSend ((string)=>void, req), disabled (bool, opt), placeholder (string, opt), autoFocus (bool, opt)
// Variants: habilitado | deshabilitado mientras el agente responde
// States: vacío (enviar inactivo) | con texto | multilínea (crece hasta 6 líneas)
// Accessibility: <label> oculto, atajo explicado en texto, botón con aria-label
// Responsive: ocupa el ancho del panel; el textarea nunca desborda

const MAX_ROWS = 6
const LINE_HEIGHT_PX = 21

interface ChatComposerProps {
  onSend: (content: string) => void
  disabled?: boolean
  placeholder?: string
  autoFocus?: boolean
}

export function ChatComposer({ onSend, disabled = false, placeholder, autoFocus }: ChatComposerProps) {
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus()
  }, [autoFocus])

  // Alto automático: se reinicia antes de medir para poder achicar también.
  useEffect(() => {
    const node = textareaRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, MAX_ROWS * LINE_HEIGHT_PX + 16)}px`
  }, [draft])

  const submit = () => {
    const trimmed = draft.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setDraft('')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="p-3"
    >
      <label htmlFor="agent-chat-input" className="sr-only">
        Escribí tu pedido para el agente
      </label>
      <div
        className={cn(
          'flex items-end gap-2 rounded-md border border-border bg-base-950 px-3 py-2 transition-colors duration-fast',
          'focus-within:border-ai-600/60',
        )}
      >
        <Sparkles size={15} className="mb-1 shrink-0 text-ai-400" aria-hidden />
        <textarea
          id="agent-chat-input"
          ref={textareaRef}
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={placeholder ?? 'Pedile un análisis: "revisá NVDA"…'}
          className="min-w-0 flex-1 resize-none bg-transparent py-0.5 text-sm leading-[21px] text-fg outline-none placeholder:text-fg-subtle disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || draft.trim() === ''}
          aria-label="Enviar mensaje"
          className="mb-0.5 shrink-0 rounded-sm p-1 text-fg-subtle transition-colors duration-fast hover:text-ai-400 disabled:pointer-events-none disabled:opacity-30"
        >
          <CornerDownLeft size={15} strokeWidth={2.4} />
        </button>
      </div>
      <p className="mt-1.5 px-1 text-caption text-fg-subtle">
        Enter envía · Shift + Enter agrega una línea
      </p>
    </form>
  )
}
