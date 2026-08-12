import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { ChatContext } from '@/types'

interface ChatDockValue {
  open: boolean
  context: ChatContext
  openGlobal: () => void
  openForStock: (ticker: string) => void
  close: () => void
  toggle: () => void
}

const ChatDockContext = createContext<ChatDockValue | null>(null)

/** Controla el panel de chat deslizable: si está abierto y con qué contexto. */
export function ChatDockProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [context, setContext] = useState<ChatContext>({ scope: 'global' })

  const openGlobal = useCallback(() => {
    setContext({ scope: 'global' })
    setOpen(true)
  }, [])

  const openForStock = useCallback((ticker: string) => {
    setContext({ scope: 'stock', ticker })
    setOpen(true)
  }, [])

  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((previous) => !previous), [])

  const value = useMemo<ChatDockValue>(
    () => ({ open, context, openGlobal, openForStock, close, toggle }),
    [open, context, openGlobal, openForStock, close, toggle],
  )

  return <ChatDockContext.Provider value={value}>{children}</ChatDockContext.Provider>
}

export function useChatDock(): ChatDockValue {
  const context = useContext(ChatDockContext)
  if (!context) throw new Error('useChatDock debe usarse dentro de ChatDockProvider')
  return context
}
