import { Loader2 } from 'lucide-react'
import type { AnalysisRun } from '@/types'
import { SIGNAL_LABEL, SIGNAL_TONE } from '@/lib/signals'
import { formatPercent, formatRelative } from '@/lib/format'
import { Badge } from '@/components/ui/Badge'

// Contract: AgentStatusCell
// Props: run (AnalysisRun | undefined, opt)
// Variants: sin analizar | en curso | research listo | veredicto | error
// States: la barra de progreso refleja pasos completados sobre el total
// Accessibility: role="status" mientras corre; el progreso se enuncia en texto, no solo en la barra
// Responsive: ancho fluido con mínimo de 12rem; nunca trunca la señal

export function AgentStatusCell({ run }: { run?: AnalysisRun }) {
  if (!run) {
    return <p className="text-sm text-fg-subtle">Sin analizar</p>
  }

  if (run.status === 'error') {
    return <Badge tone="loss">Error</Badge>
  }

  const running = run.status !== 'done'

  if (running) {
    const done = run.steps.filter((step) => step.status === 'done').length
    const total = run.steps.length || 1
    const current = run.steps.find((step) => step.status === 'running')

    return (
      <div role="status" aria-live="polite" className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm text-fg-muted">
          <Loader2 size={13} strokeWidth={2.6} className="animate-spin shrink-0 text-ai-400" aria-hidden />
          <span className="truncate">{current?.label ?? 'Preparando el run'}</span>
        </p>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-sm bg-base-800">
          <div
            className="h-full rounded-sm bg-ai-500 transition-[width] duration-base ease-out-soft"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
        <p className="num mt-1 text-caption text-fg-subtle">
          Paso {Math.min(done + 1, total)} de {total}
        </p>
      </div>
    )
  }

  if (!run.verdict) {
    return (
      <div>
        <Badge tone="outline">Research listo</Badge>
        <p className="mt-1 text-caption text-fg-subtle">Falta el veredicto</p>
      </div>
    )
  }

  const upside =
    ((run.verdict.targetPrice - run.verdict.spotPrice) / run.verdict.spotPrice) * 100

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={SIGNAL_TONE[run.verdict.signal]}>{SIGNAL_LABEL[run.verdict.signal]}</Badge>
        <span className="num text-sm font-semibold text-fg">{run.verdict.score}/100</span>
      </div>
      <p className="num mt-1 text-caption text-fg-subtle">
        Objetivo {formatPercent(upside)} · {run.finishedAt ? formatRelative(run.finishedAt) : ''}
      </p>
    </div>
  )
}
