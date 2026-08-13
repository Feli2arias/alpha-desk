import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import type { Timeframe } from '@/types'
import { marketDataService } from '@/services/marketDataService'
import { useAsync } from '@/hooks/useAsync'
import { useLiveIndices, useLiveQuotes, useMarketStatus } from '@/hooks/useLiveQuotes'
import { useWatchlist } from '@/context/WatchlistContext'
import { brandColor } from '@/lib/brandColors'
import { formatCompact, formatNumber, formatPercent, formatPrice } from '@/lib/format'
import { Card, CardHeader } from '@/components/ui/Card'
import { Delta } from '@/components/ui/Delta'
import { PageHeader } from '@/components/ui/PageHeader'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Skeleton } from '@/components/ui/Skeleton'
import { Stat } from '@/components/ui/Stat'
import { TickerAvatar } from '@/components/ui/TickerAvatar'
import { PriceChart } from '@/components/charts/PriceChart'
import { IndexStrip } from '@/components/markets/IndexStrip'
import { MarketStatusPill } from '@/components/markets/MarketStatusPill'
import { SymbolSearch } from '@/components/markets/SymbolSearch'
import { Watchlist } from '@/components/markets/Watchlist'

const RANGES: { value: Timeframe; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1S' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1A' },
  { value: '5Y', label: '5A' },
]

const CHART_MODES = [
  { value: 'area', label: 'Línea' },
  { value: 'candlestick', label: 'Velas' },
]

export function Markets() {
  const { tickers, add } = useWatchlist()
  const [selected, setSelected] = useState('NVDA')
  const [range, setRange] = useState<Timeframe>('1M')
  const [mode, setMode] = useState<'area' | 'candlestick'>('area')

  const loadCompanies = useCallback(() => marketDataService.listCompanies(), [])
  const loadSeries = useCallback(
    () => marketDataService.getSeriesDetail(selected, range),
    [selected, range],
  )
  const loadFundamentals = useCallback(
    () => marketDataService.getFundamentals(selected),
    [selected],
  )

  const companiesState = useAsync(loadCompanies, [])
  const seriesState = useAsync(loadSeries, [selected, range])
  const fundamentalsState = useAsync(loadFundamentals, [selected])

  const indices = useLiveIndices()
  const status = useMarketStatus()

  const watchTickers = useMemo(
    () => (tickers.includes(selected) ? tickers : [...tickers, selected]),
    [tickers, selected],
  )
  const quotes = useLiveQuotes(watchTickers)

  const companies = companiesState.data ?? []
  const company = companies.find((item) => item.ticker === selected)
  const quote = quotes.find((item) => item.ticker === selected)
  const series = seriesState.data
  const fundamentals = fundamentalsState.data

  const color = company?.brandColor ?? brandColor(selected)
  const dataSource = quote?.source ?? 'live'

  /** Al elegir del buscador se selecciona la acción y se suma a la watchlist. */
  const handleSearchSelect = (symbol: string) => {
    setSelected(symbol)
    if (!tickers.includes(symbol)) add(symbol)
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title="Markets"
        description="Precios, series históricas y fundamentales en vivo del mercado estadounidense."
        actions={<MarketStatusPill status={status} source={dataSource} />}
        className="mb-5"
      />

      <IndexStrip indices={indices} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <Card padded={false}>
          {/* Encabezado del instrumento */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-subtle p-5">
            <div className="flex min-w-0 items-center gap-3">
              <TickerAvatar ticker={selected} brandColor={color} size={42} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <h2 className="num text-h2 font-semibold">{selected}</h2>
                  {quote?.exchange ? (
                    <span className="text-caption uppercase tracking-[0.08em] text-fg-subtle">
                      {quote.exchange}
                    </span>
                  ) : null}
                  <Link
                    to={`/stock/${selected}`}
                    className="inline-flex items-center gap-1 text-caption text-ai-400 transition-colors duration-fast hover:text-ai-300"
                  >
                    ver tesis
                    <ExternalLink size={11} strokeWidth={2.4} aria-hidden />
                  </Link>
                </div>
                <p className="truncate text-sm text-fg-subtle">
                  {quote?.name ?? company?.name ?? 'Cargando…'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="num text-h1 font-semibold">
                {quote ? formatPrice(quote.price) : '—'}
              </p>
              {quote ? (
                <Delta
                  percent={quote.changePercent}
                  absolute={quote.change}
                  className="mt-0.5"
                />
              ) : null}
              {quote?.extendedPrice && quote.extendedChangePercent !== null ? (
                <p className="num mt-1 text-caption text-fg-subtle">
                  Fuera de rueda {formatPrice(quote.extendedPrice)}{' '}
                  <span
                    className={
                      quote.extendedChangePercent >= 0 ? 'text-gain-500' : 'text-loss-500'
                    }
                  >
                    {formatPercent(quote.extendedChangePercent)}
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          {/* Controles del gráfico */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
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

          <div className="px-2 pb-2">
            {seriesState.loading ? (
              <Skeleton className="mx-3 h-[380px]" />
            ) : (
              <PriceChart
                candles={series?.candles ?? []}
                mode={mode}
                range={range}
                color={color}
                height={380}
                previousClose={range === '1D' ? series?.previousClose : null}
                showVolume={series?.hasVolume ?? false}
              />
            )}
          </div>

          {/* Fundamentales */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 border-t border-border-subtle p-5 sm:grid-cols-3 lg:grid-cols-6">
            <Stat
              label="Máx. día"
              value={fundamentals?.dayHigh ? formatPrice(fundamentals.dayHigh) : '—'}
            />
            <Stat
              label="Mín. día"
              value={fundamentals?.dayLow ? formatPrice(fundamentals.dayLow) : '—'}
            />
            <Stat
              label="Rango 52 sem."
              value={
                fundamentals?.yearLow && fundamentals.yearHigh
                  ? `${formatNumber(fundamentals.yearLow)} – ${formatNumber(fundamentals.yearHigh)}`
                  : '—'
              }
            />
            <Stat
              label="Volumen"
              value={fundamentals?.volume ? formatCompact(fundamentals.volume) : '—'}
              hint={
                fundamentals?.averageVolume
                  ? `medio ${formatCompact(fundamentals.averageVolume)}`
                  : undefined
              }
            />
            <Stat
              label="Capitalización"
              value={fundamentals?.marketCap ? `USD ${formatCompact(fundamentals.marketCap)}` : '—'}
            />
            <Stat
              label="Objetivo 1 año"
              value={
                fundamentals?.oneYearTarget ? formatPrice(fundamentals.oneYearTarget) : '—'
              }
              hint={
                fundamentals?.oneYearTarget && quote
                  ? formatPercent(
                      ((fundamentals.oneYearTarget - quote.price) / quote.price) * 100,
                    )
                  : undefined
              }
            />
          </dl>
        </Card>

        <Card>
          <CardHeader
            title="Watchlist"
            hint="Se guarda durante la sesión"
            divided
          />
          <SymbolSearch onSelect={handleSearchSelect} className="mb-3" />
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
