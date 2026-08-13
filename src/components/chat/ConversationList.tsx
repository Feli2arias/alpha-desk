import { MessageSquare, Trash2 } from 'lucide-react'
import { useAgentChat } from '@/context/AgentChatContext'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/cn'

// Contract: ConversationList
// Props: onSelect (()=>void, opt) — permite cerrar el historial al elegir
// Variants: única
// States: conversación activa | inactiva | hover | focus-visible
// Accessibility: <ul> con aria-current en la activa; borrar tiene aria-label propio
// Responsive: alto máximo con scroll propio para no empujar el chat

export function ConversationList({ onSelect }: { onSelect?: () => void }) {
  const { conversations, active, selectConversation, deleteConversation } = useAgentChat()

  return (
    <div className="border-b border-border bg-base-950/60 px-2 py-2">
      <p className="px-1.5 pb-1.5 text-caption uppercase tracking-[0.08em] text-fg-subtle">
        Conversaciones
      </p>
      <ul className="max-h-52 space-y-0.5 overflow-y-auto">
        {conversations.map((conversation) => {
          const isActive = conversation.id === active.id
          return (
            <li key={conversation.id} className="group flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  selectConversation(conversation.id)
                  onSelect?.()
                }}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors duration-fast',
                  isActive ? 'bg-base-850 text-fg' : 'text-fg-subtle hover:bg-base-900 hover:text-fg-muted',
                )}
              >
                <MessageSquare
                  size={13}
                  strokeWidth={2.3}
                  className={cn('shrink-0', isActive && 'text-ai-400')}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-sm">{conversation.title}</span>
                {conversation.focusTicker ? (
                  <span className="num shrink-0 text-caption text-fg-subtle">
                    {conversation.focusTicker}
                  </span>
                ) : null}
                <span className="num shrink-0 text-caption text-fg-subtle">
                  {formatTime(conversation.createdAt)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => deleteConversation(conversation.id)}
                aria-label={`Borrar conversación ${conversation.title}`}
                className="shrink-0 rounded-sm p-1.5 text-fg-subtle opacity-0 transition-opacity duration-fast group-hover:opacity-100 focus-visible:opacity-100 hover:text-loss-500"
              >
                <Trash2 size={13} strokeWidth={2.3} />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
