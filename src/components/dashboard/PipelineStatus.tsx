import { Link } from 'react-router-dom'
import { ArrowRight, Check, Cpu } from 'lucide-react'
import type { AgentRun } from '@/types'
import { formatTime } from '@/lib/format'
import { Skeleton } from '@/components/ui/Skeleton'

// Contract: PipelineStatus
// Props: run (AgentRun | null, req), loading (bool, req)
// Variants: cargando | con datos
// States: cada etapa done (✓) | running (punto pulsante) | idle | error
// Accessibility: <ol> ordenada porque las etapas son secuenciales; estado en texto, no solo color
// Responsive: <md apilado en columna; ≥md fila con la flecha entre etapas

interface PipelineStatusProps {
  run: AgentRun | null
  loading: boolean
}

export function PipelineStatus({ run, loading }: PipelineStatusProps) {
  if (loading || !run) {
    return <Skeleton className="h-9 w-full max-w-md" />
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <ol className="flex flex-wrap items-center gap-2">
        {run.stages.map((stage, index) => (
          <li key={stage.role} className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5">
              {stage.status === 'done' ? (
                <Check size={13} strokeWidth={3} className="text-gain-500" aria-hidden />
              ) : (
                <span className="animate-live size-2 rounded-full bg-ai-400" aria-hidden />
              )}
              <span className="text-sm font-medium text-fg-muted">{stage.label}</span>
              <span className="sr-only">
                {stage.status === 'done' ? 'completado' : 'en ejecución'}
              </span>
            </span>
            {index < run.stages.length - 1 ? (
              <ArrowRight size={13} className="text-fg-subtle" aria-hidden />
            ) : null}
          </li>
        ))}
      </ol>

      <span className="flex items-center gap-1.5 rounded-md border border-ai-600/35 bg-ai-600/10 px-2.5 py-1.5 text-sm text-ai-300">
        <Cpu size={13} strokeWidth={2.4} aria-hidden />
        <span className="num">10</span> seleccionadas
      </span>

      <Link
        to="/pipeline"
        className="text-sm text-fg-subtle underline decoration-border-strong underline-offset-4 transition-colors duration-fast hover:text-fg"
      >
        Ver el run de las {formatTime(run.startedAt)}
      </Link>
    </div>
  )
}
