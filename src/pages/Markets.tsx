import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Radio } from 'lucide-react'
import type { Timeframe } from '@/types'
import { marketDataService } from '@/services/marketDataService'
import { useAsync } from '@/hooks/useAsync'
import { useLiveIndices, useLiveQuotes } from '@/hooks/useLiveQuotes'
import { useWatchlist } from '@/context/WatchlistContext'
import { formatCompact, formatPrice, formatTime } from '@/lib/format'
import { Card, CardHeader } from '@/components/ui/Card'
import { Delta } from '@/components/ui/Delta'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Skeleton } from '@/components/ui/Skeleton'
import { TickerAvatar } from '@/components/ui/TickerAvatar'
import { PriceChart } from '@/components/charts/PriceChart'
import { IndexStrip } from '@/components/markets/IndexStrip'
import { Watchlist } from '@/components/markets/Watchlist'

const RANGES: { value: Timeframe; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
]

const CHART_MODES = [
  { value: 'area', label: 'Línea' },
  { value: 'candlestick', label: 'Velas' },
]

export function Markets() {
  const { tickers } = useWatchlist()
  const [selected, setSelected] = useState('NVDA')
  const [range, setRange] = useState<Timeframe>('1M')
  const [mode, setMode] = useState<'area' | 'candlestick'>('area')

  const loadCompanies = useCallback(() => marketDataService.listCompanies(), [])
  const loadSeries = useCallback(
    () => marketDataService.getSeries(selected, range),
    [selected, range],
  )

  const companiesState = useAsync(loadCompanies, [])
  const seriesState = useAsync(loadSeries, [selected, range])

  const indices = useLiveIndices()
  const watchTickers = useMemo(
    () => (tickers.includes(selected) ? tickers : [...tickers, selected]),
    [tickers, selected],
  )
  const quotes = useLiveQuotes(watchTickers)

  const companies = companiesState.data ?? []
  const company = companies.find((item) => item.ticker === selected)
  const quote = quotes.find((item) => item.ticker === selected)

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 font-semibold">Markets</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Datos simulados que se actualizan cada 3 segundos.
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-md border border-gain-600/35 bg-gain-600/10 px-2.5 py-1.5 text-caption uppercase tracking-[0.08em] text-gain-500">
          <Radio size={13} strokeWidth={2.6} className="animate-live" aria-hidden />
          En vivo · {quote ? formatTime(quote.updatedAt) : '—'}
        </span>
      </header>

      <IndexStrip indices={indices} />

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <TickerAvatar
                ticker={selected}
                brandColor={company?.brandColor ?? '#8e9aa6'}
                size={40}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="num text-h2 font-semibold">{selected}</h2>
                  <Link
                    to={`/stock/${selected}`}
                    className="text-caption text-ai-400 underline decoration-ai-600/40 underline-offset-4 transition-colors duration-fast hover:text-ai-300"
                  >
                    ver tesis
                  </Link>
                </div>
                <p className="text-sm text-fg-subtle">{company?.name ?? 'Cargando…'}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="num text-h1 font-semibold tabular-nums">
                {quote ? formatPrice(quote.price) : '—'}
              </p>
              {quote ? <Delta percent={quote.changePercent} absolute={quote.change} /> : null}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <SegmentedControl
              options={RANGES}
              value={range}
              onChange={(value) => setRange(value as Timeframe)}
              ariaLabel="Rango temporal del gráfico"
              size="sm"
            />
            <SegmentedControl
              options={CHART_MODES}
              value={mode}
              onChange={(value) => setMode(value as 'area' | 'candlestick')}
              ariaLabel="Tipo de gráfico"
              size="sm"
            />
          </div>

          {seriesState.loading ? (
            <Skeleton className="h-[380px] w-full" />
          ) : (
            <PriceChart
              candles={seriesState.data ?? []}
              mode={mode}
              range={range}
              color={company?.brandColor ?? '#8e9aa6'}
              height={380}
            />
          )}

          {quote ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
              {[
                ['Máximo', formatPrice(quote.dayHigh)],
                ['Mínimo', formatPrice(quote.dayLow)],
                ['Volumen', formatCompact(quote.volume)],
                ['Capitalización', `USD ${formatCompact(quote.marketCap)}`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-caption uppercase tracking-[0.08em] text-fg-subtle">
                    {label}
                  </dt>
                  <dd className="num mt-0.5 text-sm font-medium text-fg-muted">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </Card>

        <Card>
          <CardHeader title="Watchlist" hint="Se guarda durante la sesión" />
          <Watchlist
            quotes={quotes}
            companies={companies}
            selected={selected}
            onSelect={setSelected}
          />
        </Card>
      </div>
    </div>
  )
}
