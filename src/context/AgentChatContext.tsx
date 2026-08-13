import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { ChatMessage, ChatMode, Conversation } from '@/types'
import { chatService, createUserMessage } from '@/services/chatService'
import { detectAnalysisRequest } from '@/lib/tickers'
import { useAnalysis } from './AnalysisContext'

interface AgentChatValue {
  conversations: readonly Conversation[]
  active: Conversation
  newConversation: (focusTicker?: string) => void
  selectConversation: (id: string) => void
  deleteConversation: (id: string) => void

  mode: ChatMode
  setMode: (mode: ChatMode) => void
  focusTicker?: string
  setFocusTicker: (ticker?: string) => void

  typing: boolean
  suggestions: readonly string[]
  send: (content: string) => void
  /** Fuerza el pipeline sobre una acción, sin depender de cómo esté escrito el pedido. */
  analyze: (ticker: string, mode?: ChatMode) => void
  /** Corre el pipeline sobre varias acciones en paralelo, en una sola conversación. */
  analyzeMany: (tickers: readonly string[], mode?: ChatMode) => void
}

const AgentChatContext = createContext<AgentChatValue | null>(null)

let conversationCounter = 0

function newConversationId(): string {
  conversationCounter += 1
  return `conv-${Date.now()}-${conversationCounter}`
}

function createConversation(focusTicker?: string): Conversation {
  return {
    id: newConversationId(),
    title: focusTicker ? `Sobre ${focusTicker}` : 'Conversación nueva',
    createdAt: new Date().toISOString(),
    focusTicker,
    messages: [
      chatService.getGreeting({
        scope: focusTicker ? 'stock' : 'global',
        ticker: focusTicker,
      }),
    ],
  }
}

/** Título derivado del primer mensaje del usuario. */
function titleFrom(content: string): string {
  const clean = content.trim().replace(/\s+/g, ' ')
  return clean.length > 38 ? `${clean.slice(0, 38)}…` : clean
}

/**
 * Estado completo del chat: conversaciones, modo del agente, contexto de
 * acción y envío de mensajes. Vive en un contexto —y no dentro del panel—
 * para que la conversación sobreviva a la navegación entre páginas y para
 * que cualquier vista pueda pedirle un análisis al agente.
 */
export function AgentChatProvider({ children }: { children: ReactNode }) {
  const analysis = useAnalysis()

  const [mode, setMode] = useState<ChatMode>('auto')
  const [conversations, setConversations] = useState<readonly Conversation[]>(() => [
    createConversation(),
  ])
  const [activeId, setActiveId] = useState<string>(() => conversations[0].id)
  const [typing, setTyping] = useState(false)

  const active = useMemo(
    () => conversations.find((item) => item.id === activeId) ?? conversations[0],
    [conversations, activeId],
  )

  // Refs para que `send` no dependa del historial y no se recree en cada tecla.
  const activeRef = useRef(active)
  activeRef.current = active
  const modeRef = useRef(mode)
  modeRef.current = mode

  const patchActive = useCallback(
    (updater: (conversation: Conversation) => Conversation) => {
      setConversations((previous) =>
        previous.map((item) => (item.id === activeRef.current.id ? updater(item) : item)),
      )
    },
    [],
  )

  const appendMessage = useCallback(
    (message: ChatMessage) => {
      patchActive((conversation) => ({
        ...conversation,
        title:
          conversation.messages.some((item) => item.role === 'user') || message.role !== 'user'
            ? conversation.title
            : titleFrom(message.content),
        messages: [...conversation.messages, message],
      }))
    },
    [patchActive],
  )

  const setFocusTicker = useCallback(
    (ticker?: string) => {
      patchActive((conversation) => ({ ...conversation, focusTicker: ticker }))
    },
    [patchActive],
  )

  const runAnalysis = useCallback(
    (ticker: string, runMode: ChatMode) => {
      const runId = analysis.start(ticker, runMode === 'auto' ? 'auto' : runMode)
      appendMessage({
        id: `analysis-${runId}`,
        role: 'agent',
        kind: 'analysis',
        analysisId: runId,
        ticker,
        content: `Analizando ${ticker}`,
        createdAt: new Date().toISOString(),
      })
      setFocusTicker(ticker)
    },
    [analysis, appendMessage, setFocusTicker],
  )

  const send = useCallback(
    (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || typing) return

      const conversation = activeRef.current
      const currentMode = modeRef.current
      appendMessage(createUserMessage(trimmed, conversation.focusTicker))

      // ¿Es un pedido de análisis? Entonces corre el pipeline en vez de charlar.
      const requested = detectAnalysisRequest(trimmed)
      if (requested) {
        runAnalysis(requested, currentMode)
        return
      }

      setTyping(true)
      chatService
        .sendMessage(
          {
            scope: conversation.focusTicker ? 'stock' : 'global',
            ticker: conversation.focusTicker,
            mode: currentMode,
          },
          trimmed,
          conversation.messages,
        )
        .then(appendMessage)
        .catch(() => {
          appendMessage({
            id: `err-${Date.now()}`,
            role: 'agent',
            createdAt: new Date().toISOString(),
            content: 'No pude generar una respuesta. Probá de nuevo en unos segundos.',
          })
        })
        .finally(() => setTyping(false))
    },
    [appendMessage, runAnalysis, typing],
  )

  const analyze = useCallback(
    (ticker: string, runMode?: ChatMode) => {
      const upper = ticker.trim().toUpperCase()
      appendMessage(createUserMessage(`Revisá ${upper}`, upper))
      runAnalysis(upper, runMode ?? modeRef.current)
    },
    [appendMessage, runAnalysis],
  )

  const analyzeMany = useCallback(
    (tickers: readonly string[], runMode?: ChatMode) => {
      const uppers = tickers.map((ticker) => ticker.trim().toUpperCase()).filter(Boolean)
      if (uppers.length === 0) return

      appendMessage(
        createUserMessage(
          uppers.length === 1
            ? `Revisá ${uppers[0]}`
            : `Revisá estas ${uppers.length} acciones: ${uppers.join(', ')}`,
        ),
      )

      const effective = runMode ?? modeRef.current
      for (const ticker of uppers) {
        const runId = analysis.start(ticker, effective)
        appendMessage({
          id: `analysis-${runId}`,
          role: 'agent',
          kind: 'analysis',
          analysisId: runId,
          ticker,
          content: `Analizando ${ticker}`,
          createdAt: new Date().toISOString(),
        })
      }
    },
    [analysis, appendMessage],
  )

  const newConversation = useCallback((focusTicker?: string) => {
    const conversation = createConversation(focusTicker)
    setConversations((previous) => [conversation, ...previous])
    setActiveId(conversation.id)
  }, [])

  const selectConversation = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const deleteConversation = useCallback((id: string) => {
    setConversations((previous) => {
      const next = previous.filter((item) => item.id !== id)
      if (next.length > 0) {
        setActiveId((current) => (current === id ? next[0].id : current))
        return next
      }
      const fresh = createConversation()
      setActiveId(fresh.id)
      return [fresh]
    })
  }, [])

  const value = useMemo<AgentChatValue>(
    () => ({
      conversations,
      active,
      newConversation,
      selectConversation,
      deleteConversation,
      mode,
      setMode,
      focusTicker: active.focusTicker,
      setFocusTicker,
      typing,
      suggestions: chatService.getSuggestions({
        scope: active.focusTicker ? 'stock' : 'global',
        ticker: active.focusTicker,
        mode,
      }),
      send,
      analyze,
      analyzeMany,
    }),
    [
      conversations,
      active,
      newConversation,
      selectConversation,
      deleteConversation,
      mode,
      setFocusTicker,
      typing,
      send,
      analyze,
      analyzeMany,
    ],
  )

  return <AgentChatContext.Provider value={value}>{children}</AgentChatContext.Provider>
}

export function useAgentChat(): AgentChatValue {
  const context = useContext(AgentChatContext)
  if (!context) throw new Error('useAgentChat debe usarse dentro de AgentChatProvider')
  return context
}
