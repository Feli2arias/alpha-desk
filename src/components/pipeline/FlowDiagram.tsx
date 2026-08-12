import { ArrowRight, Brain, Check, Search, Trophy } from 'lucide-react'
import type { AgentRun } from '@/types'
import { formatDuration } from '@/lib/format'
import { cn } from '@/lib/cn'

// Contract: FlowDiagram
// Props: run (AgentRun, req)
// Variants: etapa research (icono lupa) | decision (icono cerebro) + nodo final de resultado
// States: por etapa done | running | idle | error — el estado se escribe, no solo se colorea
// Accessibility: <ol> porque el flujo es secuencial; cada nodo es un <li> con encabezado
// Responsive: <lg columna con flechas hacia abajo; ≥lg fila con flechas horizontales

const STAGE_ICON = { research: Search, decision: Brain } as const

export function FlowDiagram({ run }: { run: AgentRun }) {
  return (
    <ol className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
      {run.stages.map((stage, index) => {
        const Icon = STAGE_ICON[stage.role]
        return (
          <li key={stage.role} className="contents">
            <div
              className={cn(
                'flex-1 rounded-lg border bg-surface p-4',
                stage.role === 'research'
                  ? 'border-border'
                  : 'border-ai-600/35 bg-ai-600/[0.06]',
              )}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-md',
                    stage.role === 'research'
                      ? 'bg-base-800 text-fg-muted'
                      : 'bg-ai-600/20 text-ai-300',
                  )}
                >
                  <Icon size={16} strokeWidth={2.3} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-h3 font-semibold text-fg">{stage.label}</h3>
                  <p className="text-caption text-fg-subtle">{stage.model}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-caption text-gain-500">
                  <Check size={12} strokeWidth={3} aria-hidden />
                  {stage.status === 'done' ? 'Completado' : 'En curso'}
                  <span className="num text-fg-subtle">· {formatDuration(stage.durationMs)}</span>
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-fg-muted">{stage.summary}</p>

              <dl className="mt-3.5 grid grid-cols-2 gap-2.5 border-t border-border pt-3.5">
                {stage.outputs.map((output) => (
                  <div key={output.label}>
                    <dt className="text-caption uppercase tracking-[0.08em] text-fg-subtle">
                      {output.label}
                    </dt>
                    <dd className="num mt-0.5 text-h3 font-semibold text-fg">{output.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <ArrowRight
              size={18}
              className="mx-auto shrink-0 rotate-90 text-fg-subtle lg:rotate-0"
              aria-hidden
            />
            {index === run.stages.length - 1 ? null : null}
          </li>
        )
      })}

      <li className="flex-1 rounded-lg border border-gain-600/35 bg-gain-600/[0.07] p-4 lg:max-w-[15rem]">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-gain-600/20 text-gain-500">
            <Trophy size={16} strokeWidth={2.3} aria-hidden />
          </span>
          <h3 className="text-h3 font-semibold text-fg">Top 10 del día</h3>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">
          Diez acciones con tesis completa, precio objetivo, stop y asignación sugerida.
        </p>
        <p className="num mt-3.5 border-t border-border pt-3.5 text-display font-semibold text-gain-500">
          10
        </p>
      </li>
    </ol>
  )
}
