import { useCallback, useMemo } from 'react'
import type { Pick } from '@/types'
import { agentService } from '@/services/agentService'
import { useAsync } from '@/hooks/useAsync'
import { useLiveQuotes } from '@/hooks/useLiveQuotes'
import { formatDateLong, formatTime } from '@/lib/format'
import { PickCard } from '@/components/dashboard/PickCard'
import { PipelineStatus } from '@/components/dashboard/PipelineStatus'
import { Skeleton } from '@/components/ui/Skeleton'

export function Dashboard() {
  const loadPicks = useCallback(() => agentService.getTopPicks(), [])
  const loadRun = useCallback(() => agentService.getLatestRun(), [])

  const picksState = useAsync<Pick[]>(loadPicks, [])
  const runState = useAsync(loadRun, [])

  const picks = useMemo(() => picksState.data ?? [], [picksState.data])
  const tickers = useMemo(() => picks.map((pick) => pick.company.ticker), [picks])
  const quotes = useLiveQuotes(tickers)
  const quoteByTicker = useMemo(
    () => new Map(quotes.map((quote) => [quote.ticker, quote])),
    [quotes],
  )

  const averageScore = picks.length
    ? Math.round(picks.reduce((sum, pick) => sum + pick.score, 0) / picks.length)
    : 0

  return (
    <div className="bg-grid">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-10">
        <header className="mb-8">
          <p className="text-caption uppercase tracking-[0.14em] text-ai-400">
            Selección del Decision Agent
          </p>
          <h1 className="mt-2 text-display font-semibold text-fg">Top 10 del día</h1>
          <p className="mt-2 max-w-2xl text-body text-fg-muted">
            {formatDateLong(new Date().toISOString())}.{' '}
            {runState.data ? (
              <>
                Último análisis: hoy {formatTime(runState.data.startedAt)} ·{' '}
                <span className="num">{runState.data.universeSize}</span> acciones analizadas,{' '}
                <span className="num">{runState.data.survivorsAfterFilters}</span> pasaron filtros,
                convicción media <span className="num">{averageScore}</span>/100.
              </>
            ) : (
              'Cargando el último run del pipeline…'
            )}
          </p>

          <div className="mt-5">
            <PipelineStatus run={runState.data} loading={runState.loading} />
          </div>
        </header>

        {picksState.error ? (
          <p className="rounded-lg border border-loss-600/40 bg-loss-600/10 px-4 py-3 text-sm text-loss-500">
            {picksState.error}
          </p>
        ) : null}

        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          aria-busy={picksState.loading}
        >
          {picksState.loading
            ? Array.from({ length: 10 }, (_, index) => (
                <Skeleton key={index} className="h-[13.5rem]" />
              ))
            : picks.map((pick, index) => (
                <PickCard
                  key={pick.company.ticker}
                  pick={pick}
                  quote={quoteByTicker.get(pick.company.ticker)}
                  index={index}
                />
              ))}
        </div>

        <p className="mt-8 max-w-3xl text-sm text-fg-subtle">
          Los precios y los gráficos son reales y se actualizan en vivo. La selección, los
          puntajes de confianza y las tesis son producidos por agentes simulados: sirven para
          mostrar el producto, no constituyen asesoramiento financiero.
        </p>
      </div>
    </div>
  )
}
