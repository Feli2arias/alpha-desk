import { Link } from 'react-router-dom'
import { MessageSquare, Trash2, Zap } from 'lucide-react'
import type { AnalysisRun, Company, Quote } from '@/types'
import { formatPrice } from '@/lib/format'
import { Delta } from '@/components/ui/Delta'
import { Sparkline } from '@/components/ui/Sparkline'
import { TickerAvatar } from '@/components/ui/TickerAvatar'
import { AgentStatusCell } from './AgentStatusCell'

// Contract: WatchlistRow
// Props: ticker (string, req), company/quote/sparkline (opt), run (AnalysisRun, opt),
//        onAnalyze/onChat/onRemove (()=>void, req)
// Variants: con veredicto | en curso | sin analizar
// States: default | hover (borde más marcado) | análisis corriendo (botón deshabilitado)
// Accessibility: <li> con acciones etiquetadas una por una; el ticker es texto, no solo avatar
// Responsive: <md se apila en bloques; ≥md queda en una sola línea

interface WatchlistRowProps {
  ticker: string
  company?: Company
  quote?: Quote
  sparkline?: readonly number[]
  run?: AnalysisRun
  onAnalyze: () => void
  onChat: () => void
  onRemove: () => void
}

export function WatchlistRow({
  ticker,
  company,
  quote,
  sparkline,
  run,
  onAnalyze,
  onChat,
  onRemove,
}: WatchlistRowProps) {
  const running = run !== undefined && run.status !== 'done' && run.status !== 'error'
  const hasThesis = run?.verdict?.inTopPicks ?? false

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-border bg-surface px-4 py-3.5 transition-colors duration-fast hover:border-border-strong">
      <div className="flex min-w-[11rem] flex-1 items-center gap-2.5">
        <TickerAvatar
          ticker={ticker}
          brandColor={company?.brandColor ?? '#8e9aa6'}
          size={34}
        />
        <div className="min-w-0">
          <p className="num text-sm font-semibold text-fg">{ticker}</p>
          <p className="truncate text-caption text-fg-subtle">
            {company?.name ?? 'Fuera del universo'}
          </p>
        </div>
      </div>

      <div className="hidden w-20 shrink-0 sm:block">
        <Sparkline
          values={sparkline ?? []}
          positive={(quote?.changePercent ?? 0) >= 0}
          height={30}
        />
      </div>

      <div className="w-28 shrink-0 text-right">
        <p className="num text-sm font-semibold text-fg">
          {quote ? formatPrice(quote.price) : '—'}
        </p>
        {quote ? <Delta percent={quote.changePercent} size="sm" showIcon={false} /> : null}
      </div>

      <div className="min-w-[12rem] flex-1">
        <AgentStatusCell run={run} />
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onAnalyze}
          disabled={running}
          className="inline-flex items-center gap-1.5 rounded-md border border-ai-600/40 bg-ai-600/12 px-2.5 py-1.5 text-caption font-medium text-ai-300 transition-colors duration-fast hover:bg-ai-600/20 hover:text-fg disabled:pointer-events-none disabled:opacity-40"
        >
          <Zap size={12} strokeWidth={2.5} aria-hidden />
          {run ? 'Reanalizar' : 'Analizar'}
        </button>

        {hasThesis ? (
          <Link
            to={`/stock/${ticker}`}
            className="rounded-md border border-border px-2.5 py-1.5 text-caption font-medium text-fg-muted transition-colors duration-fast hover:border-border-strong hover:text-fg"
          >
            Ficha
          </Link>
        ) : null}

        <button
          type="button"
          onClick={onChat}
          aria-label={`Hablar con el agente sobre ${ticker}`}
          title={`Hablar sobre ${ticker}`}
          className="rounded-sm p-1.5 text-fg-subtle transition-colors duration-fast hover:bg-base-850 hover:text-fg"
        >
          <MessageSquare size={14} strokeWidth={2.3} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${ticker} de la watchlist`}
          title={`Quitar ${ticker}`}
          className="rounded-sm p-1.5 text-fg-subtle transition-colors duration-fast hover:bg-base-850 hover:text-loss-500"
        >
          <Trash2 size={14} strokeWidth={2.3} />
        </button>
      </div>
    </li>
  )
}
