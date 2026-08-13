import { Link } from 'react-router-dom'
import { ArrowRight, Star, Target, TrendingDown } from 'lucide-react'
import type { Verdict } from '@/types'
import { useWatchlist } from '@/context/WatchlistContext'
import { SIGNAL_LABEL, SIGNAL_TONE, VERDICT_TONE } from '@/lib/signals'
import { formatPercent, formatPrice } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'
import { ScoreRing } from '@/components/ui/ScoreRing'

// Contract: VerdictCard
// Props: verdict (Verdict, req)
// Variants: acción del Top 10 (link a la ficha) | fuera del ranking (sin ficha)
// States: en watchlist | fuera de la watchlist (cambia el botón de seguimiento)
// Accessibility: <section> con encabezado propio; el score se lee en texto además del anillo
// Responsive: pensado para el ancho del panel (≥20rem); las cifras se apilan en 2 columnas

const DOT_CLASS: Record<'gain' | 'neutral' | 'loss', string> = {
  gain: 'bg-gain-500',
  neutral: 'bg-base-600',
  loss: 'bg-loss-500',
}

export function VerdictCard({ verdict }: { verdict: Verdict }) {
  const { has, add } = useWatchlist()

  const upside = ((verdict.targetPrice - verdict.spotPrice) / verdict.spotPrice) * 100
  const downside = ((verdict.spotPrice - verdict.stopLoss) / verdict.spotPrice) * 100
  const ratio = downside > 0 ? upside / downside : 0
  const inWatchlist = has(verdict.ticker)

  return (
    <section
      aria-label={`Veredicto del Decision Agent para ${verdict.ticker}`}
      className="animate-rise overflow-hidden rounded-lg border border-ai-600/35 bg-surface-raised"
      style={{ boxShadow: 'var(--shadow-glow-ai)' }}
    >
      <header className="flex items-start gap-3 border-b border-border/70 bg-ai-600/8 px-3.5 py-3">
        <ScoreRing score={verdict.score} size={46} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={SIGNAL_TONE[verdict.signal]}>{SIGNAL_LABEL[verdict.signal]}</Badge>
            {verdict.inTopPicks && verdict.rank ? (
              <Badge tone="outline">
                <Star size={10} strokeWidth={2.6} aria-hidden />
                Top 10 · #{verdict.rank}
              </Badge>
            ) : (
              <Badge tone="outline">Fuera del ranking</Badge>
            )}
          </div>
          <p className="mt-1.5 text-caption uppercase tracking-[0.08em] text-fg-subtle">
            Veredicto del Decision Agent
          </p>
        </div>
      </header>

      <div className="px-3.5 py-3.5">
        <h3 className="text-sm leading-snug font-semibold text-fg">{verdict.headline}</h3>

        <div className="mt-3 space-y-2 text-sm leading-relaxed text-fg-muted">
          {verdict.rationale.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <dl className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-border pt-3.5">
          <div>
            <dt className="flex items-center gap-1 text-caption uppercase tracking-[0.08em] text-fg-subtle">
              <Target size={11} strokeWidth={2.5} aria-hidden />
              Objetivo
            </dt>
            <dd className="num mt-0.5 text-sm font-semibold text-fg">
              {formatPrice(verdict.targetPrice)}{' '}
              <span className="text-gain-500">{formatPercent(upside)}</span>
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-caption uppercase tracking-[0.08em] text-fg-subtle">
              <TrendingDown size={11} strokeWidth={2.5} aria-hidden />
              Invalidación
            </dt>
            <dd className="num mt-0.5 text-sm font-semibold text-fg">
              {formatPrice(verdict.stopLoss)}{' '}
              <span className="text-loss-500">−{formatPercent(downside, false)}</span>
            </dd>
          </div>
          <div>
            <dt className="text-caption uppercase tracking-[0.08em] text-fg-subtle">
              Riesgo / beneficio
            </dt>
            <dd className="num mt-0.5 text-sm font-semibold text-fg">
              {ratio.toFixed(2).replace('.', ',')} a 1
            </dd>
          </div>
          <div>
            <dt className="text-caption uppercase tracking-[0.08em] text-fg-subtle">Horizonte</dt>
            <dd className="mt-0.5 text-sm font-medium text-fg-muted">{verdict.horizon}</dd>
          </div>
        </dl>

        <div className="mt-3.5 border-t border-border pt-3.5">
          <p className="text-caption uppercase tracking-[0.08em] text-fg-subtle">
            Métricas evaluadas
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {verdict.metrics.slice(0, 6).map((metric) => (
              <li key={metric.key} className="flex items-baseline gap-2 text-sm">
                <span
                  className={cn(
                    'mt-1.5 size-1.5 shrink-0 rounded-full',
                    DOT_CLASS[VERDICT_TONE[metric.verdict]],
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-fg-subtle">{metric.label}</span>
                <span className="num shrink-0 font-medium text-fg-muted">{metric.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3.5 grid grid-cols-1 gap-3 border-t border-border pt-3.5 sm:grid-cols-2">
          <div>
            <p className="text-caption uppercase tracking-[0.08em] text-fg-subtle">Catalizadores</p>
            <ul className="mt-1.5 space-y-1.5 text-sm text-fg-muted">
              {verdict.catalysts.slice(0, 3).map((catalyst) => (
                <li key={catalyst} className="flex gap-1.5">
                  <span className="text-gain-500" aria-hidden>
                    +
                  </span>
                  <span>{catalyst}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-caption uppercase tracking-[0.08em] text-fg-subtle">Riesgos</p>
            <ul className="mt-1.5 space-y-1.5 text-sm text-fg-muted">
              {verdict.risks.slice(0, 3).map((risk) => (
                <li key={risk} className="flex gap-1.5">
                  <span className="text-loss-500" aria-hidden>
                    −
                  </span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-3.5 border-t border-border pt-3 text-sm text-fg-subtle">
          <span className="text-fg-muted">Convicción:</span> {verdict.conviction}
          {verdict.allocationPercent > 0
            ? ` · Asignación sugerida ${verdict.allocationPercent}%`
            : ' · Sin asignación sugerida'}
        </p>

        <div className="mt-3.5 flex flex-wrap gap-2">
          {verdict.inTopPicks ? (
            <Link
              to={`/stock/${verdict.ticker}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-ai-600/40 bg-ai-600/12 px-3 py-1.5 text-sm font-medium text-ai-300 transition-colors duration-fast hover:bg-ai-600/20 hover:text-fg"
            >
              Ver ficha completa
              <ArrowRight size={13} strokeWidth={2.4} aria-hidden />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => add(verdict.ticker)}
            disabled={inWatchlist}
            className="rounded-md border border-border bg-base-950 px-3 py-1.5 text-sm font-medium text-fg-muted transition-colors duration-fast hover:border-border-strong hover:text-fg disabled:pointer-events-none disabled:opacity-45"
          >
            {inWatchlist ? 'Ya está en la watchlist' : 'Seguir en la watchlist'}
          </button>
        </div>
      </div>
    </section>
  )
}
