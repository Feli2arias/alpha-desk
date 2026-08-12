import type { ChatMessage } from '@/types'
import { cn } from '@/lib/cn'
import { formatTime } from '@/lib/format'

// Contract: Bubble
// Props: message (ChatMessage, req)
// Variants: role user (alineada a la derecha) | agent (izquierda, con marca de IA)
// States: estático — la burbuja no cambia después de renderizada
// Accessibility: <article> con etiqueta de autor; la hora se expone en <time>
// Responsive: ancho máximo 88% en móvil, 78% desde md

/** Render mínimo de **negrita** — alcanza para las respuestas del mock. */
function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-fg">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={index}>{part}</span>
  })
}

export function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <article
      className={cn('animate-rise flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}
      aria-label={isUser ? 'Tu mensaje' : 'Respuesta del agente'}
    >
      <div
        className={cn(
          'max-w-[88%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed md:max-w-[78%]',
          isUser
            ? 'rounded-br-sm bg-ai-600 text-white'
            : 'rounded-bl-sm border border-border bg-surface-raised text-fg-muted',
        )}
      >
        {message.content.split('\n').map((line, index) =>
          line.trim() === '' ? (
            <span key={index} className="block h-2" />
          ) : (
            <p key={index} className={cn(index > 0 && 'mt-0.5')}>
              {renderInline(line)}
            </p>
          ),
        )}
      </div>
      <time
        dateTime={message.createdAt}
        className="num px-1 text-caption text-fg-subtle"
      >
        {formatTime(message.createdAt)}
      </time>
    </article>
  )
}
