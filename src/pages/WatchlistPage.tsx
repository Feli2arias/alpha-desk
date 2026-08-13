import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Star } from 'lucide-react'
import { marketDataService } from '@/services/marketDataService'
import { useAsync } from '@/hooks/useAsync'
import { useLiveQuotes } from '@/hooks/useLiveQuotes'
import { useWatchlist } from '@/context/WatchlistContext'
import { useAnalysis } from '@/context/AnalysisContext'
import { useAgentChat } from '@/context/AgentChatContext'
import { WatchlistAddForm } from '@/components/watchlist/WatchlistAddForm'
import { WatchlistRow } from '@/components/watchlist/WatchlistRow'
import { WatchlistSummary } from '@/components/watchlist/WatchlistSummary'

/**
 * Watchlist: la lista propia del usuario, con el veredicto del agente al lado
 * de cada acción. Es el punto desde donde se dispara el pipeline a mano.
 */
export function WatchlistPage() {
  const { tickers, remove } = useWatchlist()
  const { latestByTicker, isRunning } = useAnalysis()
  const { analyze, analyzeMany, setFocusTicker } = useAgentChat()
  const navigate = useNavigate()

  /** Toda acción del agente termina en su vista: el veredicto se lee ahí. */
  const goToAgent = () => navigate('/agente')

  const key = tickers.join(',')
  const quotes = useLiveQuotes(tickers)

  const loadCompanies = useCallback(() => marketDataService.listCompanies(), [])
  const companiesState = useAsync(loadCompanies, [])

  const loadSparklines = useCallback(
    async () =>
      Object.fromEntries(
        await Promise.all(
          tickers.map(async (ticker) => [ticker, await marketDataService.getSparkline(ticker)] as const),
        ),
      ) as Record<string, number[]>,
    // La lista de tickers se pasa como dependencia serializada más abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )
  const sparklinesState = useAsync(loadSparklines, [key])

  const companyByTicker = useMemo(
    () => new Map((companiesState.data ?? []).map((company) => [company.ticker, company])),
    [companiesState.data],
  )
  const quoteByTicker = useMemo(
    () => new Map(quotes.map((quote) => [quote.ticker, quote])),
    [quotes],
  )

  const runs = useMemo(
    () => tickers.map((ticker) => latestByTicker[ticker]).filter((run) => run !== undefined),
    [tickers, latestByTicker],
  )

  const pending = tickers.filter((ticker) => !isRunning(ticker))

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-h1 font-semibold">
            <Star size={20} strokeWidth={2.3} className="text-ai-400" aria-hidden />
            Watchlist
          </h1>
          <p className="mt-1 max-w-xl text-sm text-fg-muted">
            Tus acciones en seguimiento. Pedile al agente que revise cualquiera de ellas y el
            veredicto aparece acá y en el chat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <WatchlistAddForm />
          <button
            type="button"
            onClick={() => {
              analyzeMany(pending)
              goToAgent()
            }}
            disabled={pending.length === 0}
            className="inline-flex items-center gap-2 rounded-md border border-ai-600/40 bg-ai-600/12 px-3.5 py-2 text-sm font-medium text-ai-300 transition-colors duration-fast hover:bg-ai-600/20 hover:text-fg disabled:pointer-events-none disabled:opacity-40"
          >
            <Sparkles size={15} strokeWidth={2.3} aria-hidden />
            Analizar todas
          </button>
        </div>
      </header>

      <WatchlistSummary total={tickers.length} runs={runs} />

      {tickers.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
          <p className="text-h3 font-semibold text-fg">Todavía no seguís ninguna acción</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-fg-muted">
            Agregá una arriba por ticker o por nombre. Después pedile al agente que la revise y vas
            a ver el research completo y el veredicto.
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-2.5" aria-busy={companiesState.loading}>
          {tickers.map((ticker) => (
            <WatchlistRow
              key={ticker}
              ticker={ticker}
              company={companyByTicker.get(ticker)}
              quote={quoteByTicker.get(ticker)}
              sparkline={sparklinesState.data?.[ticker]}
              run={latestByTicker[ticker]}
              onAnalyze={() => {
                analyze(ticker)
                goToAgent()
              }}
              onChat={() => {
                setFocusTicker(ticker)
                goToAgent()
              }}
              onRemove={() => remove(ticker)}
            />
          ))}
        </ul>
      )}

      <p className="mt-6 text-caption text-fg-subtle">
        Datos simulados. Los veredictos son de un mockup y no son asesoramiento financiero.
      </p>
    </div>
  )
}
