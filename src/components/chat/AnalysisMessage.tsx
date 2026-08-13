import { AlertTriangle, Check, Loader2, Search, Scale } from 'lucide-react'
import type { AgentRole, AnalysisRun } from '@/types'
import { useAnalysis } from '@/context/AnalysisContext'
import { useAgentChat } from '@/context/AgentChatContext'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'
import { TickerAvatar } from '@/components/ui/TickerAvatar'
import { VerdictCard } from './VerdictCard'

// Contract: AnalysisMessage
// Props: analysisId (string, req)
// Variants: modo auto (research + decisión) | research (termina en hallazgos) | decisión
// States: queued | researching | deciding | done | error
// Accessibility: role="status" aria-live="polite" mientras corre; cada paso dice su estado en texto
// Responsive: ocupa el ancho del panel; los pasos nunca truncan el texto de resultado

const ROLE_META: Record<AgentRole, { title: string; icon: typeof Search }> = {
  research: { title: 'Research Agent', icon: Search },
  decision: { title: 'Decision Agent', icon: Scale },
}

function StepRow({
  label,
  status,
  result,
}: {
  label: string
  status: 'pending' | 'running' | 'done'
  result?: string
}) {
  return (
    <li className="flex gap-2.5">
      <span className="relative flex w-4 shrink-0 justify-center pt-0.5">
        {status === 'done' ? (
          <Check size={13} strokeWidth={3} className="text-gain-500" aria-hidden />
        ) : status === 'running' ? (
          <Loader2 size={13} strokeWidth={2.6} className="animate-spin text-ai-400" aria-hidden />
        ) : (
          <span className="mt-1 size-1.5 rounded-full bg-base-700" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1 pb-2">
        <span
          className={cn(
            'block text-sm leading-snug',
            status === 'pending' ? 'text-fg-subtle' : 'text-fg-muted',
            status === 'running' && 'text-fg',
          )}
        >
          {label}
          <span className="sr-only">
            {status === 'done' ? ' — completado' : status === 'running' ? ' — en curso' : ' — pendiente'}
          </span>
        </span>
        {result ? <span className="mt-0.5 block text-caption text-fg-subtle">{result}</span> : null}
      </span>
    </li>
  )
}

function StageBlock({ run, role }: { run: AnalysisRun; role: AgentRole }) {
  const steps = run.steps.filter((step) => step.role === role)
  if (steps.length === 0) return null

  const meta = ROLE_META[role]
  const Icon = meta.icon
  const model = role === 'research' ? run.researchModel : run.decisionModel
  const allDone = steps.every((step) => step.status === 'done')

  return (
    <div className="mt-3 first:mt-0">
      <div className="mb-2 flex items-center gap-2">
        <Icon
          size={13}
          strokeWidth={2.5}
          className={role === 'research' ? 'text-fg-muted' : 'text-ai-400'}
          aria-hidden
        />
        <span className="text-caption font-medium uppercase tracking-[0.08em] text-fg-muted">
          {meta.title}
        </span>
        <span className="truncate text-caption text-fg-subtle">
          {model.split('·')[1]?.trim() ?? ''}
        </span>
        {allDone ? <Check size={12} strokeWidth={3} className="ml-auto text-gain-500" aria-hidden /> : null}
      </div>
      <ul className="border-l border-border pl-1">
        {steps.map((step) => (
          <StepRow key={step.id} label={step.label} status={step.status} result={step.result} />
        ))}
      </ul>
    </div>
  )
}

export function AnalysisMessage({ analysisId }: { analysisId: string }) {
  const { getRun } = useAnalysis()
  const { analyze } = useAgentChat()
  const run = getRun(analysisId)

  if (!run) {
    return (
      <p className="text-sm text-fg-subtle">El análisis ya no está disponible en esta sesión.</p>
    )
  }

  const running = run.status !== 'done' && run.status !== 'error'

  if (run.status === 'error') {
    return (
      <div className="animate-rise flex gap-2.5 rounded-lg border border-loss-600/35 bg-loss-600/10 px-3.5 py-3">
        <AlertTriangle size={15} strokeWidth={2.4} className="mt-0.5 shrink-0 text-loss-500" aria-hidden />
        <p className="text-sm leading-relaxed text-fg-muted">{run.error}</p>
      </div>
    )
  }

  return (
    <div className="animate-rise flex flex-col gap-3">
      <div
        role={running ? 'status' : undefined}
        aria-live={running ? 'polite' : undefined}
        className="rounded-lg border border-border bg-surface-raised px-3.5 py-3"
      >
        <div className="flex items-center gap-2.5">
          <TickerAvatar ticker={run.ticker} brandColor={run.brandColor} size={30} />
          <div className="min-w-0 flex-1">
            <p className="num text-sm font-semibold text-fg">{run.ticker}</p>
            <p className="truncate text-caption text-fg-subtle">{run.companyName}</p>
          </div>
          <Badge tone={running ? 'ai' : 'gain'}>
            {run.status === 'queued'
              ? 'En cola'
              : run.status === 'researching'
                ? 'Investigando'
                : run.status === 'deciding'
                  ? 'Decidiendo'
                  : 'Listo'}
          </Badge>
        </div>

        <div className="mt-3 border-t border-border pt-3">
          <StageBlock run={run} role="research" />
          <StageBlock run={run} role="decision" />
        </div>
      </div>

      {run.researchSummary ? (
        <div className="rounded-lg border border-border bg-surface-raised px-3.5 py-3">
          <p className="text-sm leading-relaxed whitespace-pre-line text-fg-muted">
            {run.researchSummary.replace(/\*\*/g, '')}
          </p>
          <button
            type="button"
            onClick={() => analyze(run.ticker, 'decision')}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-ai-600/40 bg-ai-600/12 px-3 py-1.5 text-sm font-medium text-ai-300 transition-colors duration-fast hover:bg-ai-600/20 hover:text-fg"
          >
            <Scale size={13} strokeWidth={2.4} aria-hidden />
            Pedir veredicto al Decision Agent
          </button>
        </div>
      ) : null}

      {run.verdict ? <VerdictCard verdict={run.verdict} /> : null}
    </div>
  )
}
