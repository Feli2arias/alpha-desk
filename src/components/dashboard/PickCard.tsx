import { Link } from 'react-router-dom'
import type { Pick, Quote } from '@/types'
import { formatPrice } from '@/lib/format'
import { SIGNAL_LABEL, SIGNAL_TONE } from '@/lib/signals'
import { Badge } from '@/components/ui/Badge'
import { Delta } from '@/components/ui/Delta'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { Sparkline } from '@/components/ui/Sparkline'
import { TickerAvatar } from '@/components/ui/TickerAvatar'

// Contract: PickCard
// Props: pick (Pick, req), quote (Quote | undefined, req), index (number, req — solo para el stagger)
// Variants: señal strong_buy | buy | hold (cambia el tono del badge)
// States: default | hover (borde acentuado + leve elevación) | focus-visible | sin quote (precio en guiones)
// Accessibility: toda la card es un <Link>; el rank y el score se leen en texto
// Responsive: 1 col <sm, 2 cols sm, 3 cols xl, 4 cols 2xl

interface PickCardProps {
  pick: Pick
  quote: Quote | undefined
  index: number
}

export function PickCard({ pick, quote, index }: PickCardProps) {
  const positive = (quote?.changePercent ?? 0) >= 0

  return (
    <Link
      to={`/stock/${pick.company.ticker}`}
      className="animate-rise group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface p-4 transition-[transform,border-color] duration-base ease-out-soft hover:-translate-y-0.5 hover:border-ai-600/45"
      style={{ animationDelay: `${Math.min(index, 9) * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <TickerAvatar ticker={pick.company.ticker} brandColor={pick.company.brandColor} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="num text-h3 font-semibold text-fg">{pick.company.ticker}</span>
              <span className="num text-caption text-fg-subtle">#{pick.rank}</span>
            </div>
            <p className="truncate text-sm text-fg-subtle">{pick.company.name}</p>
          </div>
        </div>
        <ScoreRing score={pick.score} size={44} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="num text-h2 font-semibold text-fg">
            {quote ? formatPrice(quote.price) : '—'}
          </p>
          {quote ? (
            <Delta percent={quote.changePercent} absolute={quote.change} size="sm" className="mt-0.5" />
          ) : (
            <span className="num text-sm text-fg-subtle">cargando…</span>
          )}
        </div>
        <Badge tone={SIGNAL_TONE[pick.signal]}>{SIGNAL_LABEL[pick.signal]}</Badge>
      </div>

      <div className="mt-3 -mx-1">
        <Sparkline values={pick.sparkline} positive={positive} height={44} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-caption uppercase tracking-[0.08em] text-fg-subtle">
          Asignación <span className="num text-fg-muted">{pick.allocationPercent}%</span>
        </span>
        <span className="text-caption text-ai-400 opacity-0 transition-opacity duration-fast group-hover:opacity-100">
          Ver el porqué →
        </span>
      </div>
    </Link>
  )
}
