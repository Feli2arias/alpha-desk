import { useCallback } from 'react'
import { agentService } from '@/services/agentService'
import { useAsync } from '@/hooks/useAsync'
import { formatCompact, formatTime } from '@/lib/format'
import { Card, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { FlowDiagram } from '@/components/pipeline/FlowDiagram'
import { RunLog } from '@/components/pipeline/RunLog'

export function Pipeline() {
  const loadRun = useCallback(() => agentService.getLatestRun(), [])
  const { data: run, loading, error } = useAsync(loadRun, [])

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <p className="text-caption uppercase tracking-[0.14em] text-ai-400">Cómo se arma el Top 10</p>
        <h1 className="mt-2 text-h1 font-semibold">Pipeline de agentes</h1>
        <p className="mt-2 max-w-2xl text-body text-fg-muted">
          Dos agentes en cadena: uno rastrea y filtra a gran escala, el otro razona sobre lo que
          sobrevive y decide. Este es el detalle del último run.
        </p>
      </header>

      {error ? (
        <p className="rounded-lg border border-loss-600/40 bg-loss-600/10 px-4 py-3 text-sm text-loss-500">
          {error}
        </p>
      ) : null}

      {loading || !run ? (
        <div className="flex flex-col gap-4" aria-busy>
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <>
          <FlowDiagram run={run} />

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              ['Universo analizado', String(run.universeSize)],
              ['Pasaron filtros', String(run.survivorsAfterFilters)],
              ['Noticias procesadas', String(run.newsProcessed)],
              ['Tokens consumidos', formatCompact(run.tokensUsed)],
              ['Costo del run', `USD ${run.costUsd.toFixed(2)}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-border bg-surface px-3.5 py-3">
                <p className="text-caption uppercase tracking-[0.08em] text-fg-subtle">{label}</p>
                <p className="num mt-1 text-h2 font-semibold text-fg">{value}</p>
              </div>
            ))}
          </div>

          <Card className="mt-5">
            <CardHeader
              title="Logs del último run"
              hint={`Iniciado a las ${formatTime(run.startedAt)} · finalizado a las ${formatTime(run.finishedAt)}`}
            />
            <RunLog entries={run.logs} />
          </Card>
        </>
      )}
    </div>
  )
}
