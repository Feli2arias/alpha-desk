import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Globe, Plus, X, Zap } from 'lucide-react'
import type { ChatMode } from '@/types'
import { useAgentChat } from '@/context/AgentChatContext'
import { useWatchlist } from '@/context/WatchlistContext'
import { COMPANY_BY_TICKER } from '@/data/companies'
import { UNIVERSE_TICKERS } from '@/lib/tickers'
import { cn } from '@/lib/cn'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { TickerAvatar } from '@/components/ui/TickerAvatar'

// Contract: ChatOptionsBar
// Props: ninguna — lee AgentChatContext y WatchlistContext
// Variants: contexto global | contexto de una acción
// States: selector de acción cerrado | abierto; modo auto | research | decisión
// Accessibility: popover con aria-expanded/aria-controls, cierra con Escape y clic afuera
// Responsive: los controles se envuelven; nada se sale del ancho del panel

const MODE_OPTIONS: { value: ChatMode; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'research', label: 'Research' },
  { value: 'decision', label: 'Decisión' },
]

const MODE_HINT: Record<ChatMode, string> = {
  auto: 'Research Agent releva y el Decision Agent falla el veredicto.',
  research: 'Solo trabajo de campo: datos, noticias y comparables. Sin veredicto.',
  decision: 'Va directo al veredicto del modelo de razonamiento profundo.',
}

export function ChatOptionsBar() {
  const { mode, setMode, focusTicker, setFocusTicker, analyze } = useAgentChat()
  const { tickers } = useWatchlist()
  const [pickerOpen, setPickerOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pickerOpen) return

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setPickerOpen(false)
    }
    const onPointerDown = (event: globalThis.MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setPickerOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousedown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mousedown', onPointerDown)
    }
  }, [pickerOpen])

  // La watchlist primero: es lo que el usuario mira todos los días.
  const ordered = [...tickers, ...UNIVERSE_TICKERS.filter((ticker) => !tickers.includes(ticker))]

  return (
    <div className="px-3 py-2.5">
      <SegmentedControl
        options={MODE_OPTIONS}
        value={mode}
        onChange={(value) => setMode(value as ChatMode)}
        ariaLabel="Modo del agente"
        size="sm"
        className="w-full [&>button]:flex-1"
      />
      <p className="mt-1.5 px-0.5 text-caption leading-snug text-fg-subtle">{MODE_HINT[mode]}</p>

      <div ref={containerRef} className="relative mt-2.5 flex flex-wrap items-center gap-1.5">
        {focusTicker ? (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-ai-600/40 bg-ai-600/12 py-1 pr-1 pl-2 text-caption font-medium text-ai-300">
            <TickerAvatar
              ticker={focusTicker}
              brandColor={COMPANY_BY_TICKER[focusTicker]?.brandColor ?? '#8e9aa6'}
              size={16}
            />
            <span className="num">{focusTicker}</span>
            <button
              type="button"
              onClick={() => setFocusTicker(undefined)}
              aria-label={`Quitar ${focusTicker} del contexto`}
              className="rounded-sm p-0.5 text-ai-300/70 transition-colors duration-fast hover:text-fg"
            >
              <X size={11} strokeWidth={3} />
            </button>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-base-950 px-2 py-1 text-caption text-fg-subtle">
            <Globe size={11} strokeWidth={2.5} aria-hidden />
            Contexto global · run de hoy
          </span>
        )}

        <button
          type="button"
          onClick={() => setPickerOpen((previous) => !previous)}
          aria-expanded={pickerOpen}
          aria-controls="chat-ticker-picker"
          className="inline-flex items-center gap-1 rounded-sm border border-border bg-base-950 px-2 py-1 text-caption text-fg-muted transition-colors duration-fast hover:border-border-strong hover:text-fg"
        >
          <Plus size={11} strokeWidth={3} aria-hidden />
          Acción
          <ChevronDown
            size={11}
            strokeWidth={2.6}
            aria-hidden
            className={cn('transition-transform duration-fast', pickerOpen && 'rotate-180')}
          />
        </button>

        {pickerOpen ? (
          <div
            id="chat-ticker-picker"
            className="animate-rise absolute top-full left-0 z-20 mt-1.5 max-h-72 w-full overflow-y-auto rounded-md border border-border bg-surface-raised p-1 shadow-md"
          >
            {ordered.map((ticker) => {
              const company = COMPANY_BY_TICKER[ticker]
              return (
                <div key={ticker} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFocusTicker(ticker)
                      setPickerOpen(false)
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors duration-fast hover:bg-base-800"
                  >
                    <TickerAvatar
                      ticker={ticker}
                      brandColor={company?.brandColor ?? '#8e9aa6'}
                      size={20}
                    />
                    <span className="num shrink-0 text-sm font-medium text-fg">{ticker}</span>
                    <span className="min-w-0 flex-1 truncate text-caption text-fg-subtle">
                      {company?.name ?? ''}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      analyze(ticker)
                      setPickerOpen(false)
                    }}
                    aria-label={`Analizar ${ticker} ahora`}
                    title={`Analizar ${ticker} ahora`}
                    className="shrink-0 rounded-sm p-1.5 text-fg-subtle transition-colors duration-fast hover:bg-ai-600/15 hover:text-ai-300"
                  >
                    <Zap size={13} strokeWidth={2.4} />
                  </button>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
