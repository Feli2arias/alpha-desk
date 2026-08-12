import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatContext, ChatMessage } from '@/types'
import { chatService, createUserMessage } from '@/services/chatService'

export interface UseChatResult {
  messages: readonly ChatMessage[]
  typing: boolean
  suggestions: readonly string[]
  send: (content: string) => void
  reset: () => void
}

/**
 * Estado de una conversación. El historial vive en memoria del componente:
 * cuando exista backend, este hook pasa a leer/escribir la conversación
 * persistida sin cambiar su interfaz.
 */
export function useChat(context: ChatContext): UseChatResult {
  const [messages, setMessages] = useState<readonly ChatMessage[]>([])
  const [typing, setTyping] = useState(false)
  const contextRef = useRef(context)
  contextRef.current = context

  const key = `${context.scope}:${context.ticker ?? ''}`

  useEffect(() => {
    setMessages([chatService.getGreeting(contextRef.current)])
    setTyping(false)
  }, [key])

  const send = useCallback(
    (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || typing) return

      const userMessage = createUserMessage(trimmed, contextRef.current.ticker)
      setMessages((previous) => [...previous, userMessage])
      setTyping(true)

      chatService
        .sendMessage(contextRef.current, trimmed, [...messages, userMessage])
        .then((reply) => {
          setMessages((previous) => [...previous, reply])
        })
        .catch(() => {
          setMessages((previous) => [
            ...previous,
            {
              id: `err-${Date.now()}`,
              role: 'agent',
              createdAt: new Date().toISOString(),
              content: 'No pude generar una respuesta. Probá de nuevo en unos segundos.',
            },
          ])
        })
        .finally(() => setTyping(false))
    },
    [messages, typing],
  )

  const reset = useCallback(() => {
    setMessages([chatService.getGreeting(contextRef.current)])
  }, [])

  return {
    messages,
    typing,
    suggestions: chatService.getSuggestions(context),
    send,
    reset,
  }
}
