import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import type { Timeframe } from '@/types'
import { agentService } from '@/services/agentService'
import { marketDataService } from '@/services/marketDataService'
import { useAsync } from '@/hooks/useAsync'
import { useLiveQuotes } from '@/hooks/useLiveQuotes'
import { useChatDock } from '@/context/ChatDockContext'
import { formatCompact, formatPrice } from '@/lib/format'
import { SIGNAL_LABEL, SIGNAL_TONE } from '@/lib/signals'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { Delta } from '@/components/ui/Delta'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { Skeleton } from '@/components/ui/Skeleton'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { TickerAvatar } from '@/components/ui/TickerAvatar'
import { PriceChart } from '@/components/charts/PriceChart'
import { MetricsTable } from '@/components/detail/MetricsTable'
import { NewsFeed } from '@/components/detail/NewsFeed'
import { TargetBar } from '@/components/detail/TargetBar'
import { ThesisPanel } from '@/components/detail/ThesisPanel'

const RANGES: { value: Timeframe; label: Timeframe }[] = [
  { value: '1M', label: '1M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
]

export function StockDetail() {
  const { ticker = '' } = useParams()
  const upper = ticker.toUpperCase()
  const { openForStock } = useChatDock()
  const [range, setRange] = useState<Timeframe>('6M')

  const loadPick = useCallback(() => agentService.getPick(upper), [upper])
  const loadNews = useCallback(() => agentService.getNews(upper), [upper])
  const loadSeries = useCallback(() => marketDataService.getSeries(upper, range), [upper, range])

  const pickState = useAsync(loadPick, [upper])
  const newsState = useAsync(loadNews, [upper])
  const seriesState = useAsync(loadSeries, [upper, range])

  const [quote] = useLiveQuotes([upper])
  const pick = pickState.data

  if (!pickState.loading && !pick) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-h1 font-semibold">Sin tesis para {upper}</h1>
        <p className="mt-2 text-fg-muted">
          Esta acción no está entre las 10 seleccionadas por el Decision Agent en el run de hoy.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-fg-muted transition-colors duration-fast hover:border-ai-600/50 hover:text-fg"
        >
          <ArrowLeft size={15} aria-hidden />
          Volver al Top 10
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-fg-subtle transition-colors duration-fast hover:text-fg"
      >
        <ArrowLeft size={15} aria-hidden />
        Top 10 del día
      </Link>

      {pickState.loading || !pick ? (
        <div className="mt-5 flex flex-col gap-4" aria-busy>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <>
          <header className="mt-5 flex flex-wrap items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-3.5">
              <TickerAvatar
                ticker={pick.company.ticker}
                brandColor={pick.company.brandColor}
                size={52}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="num text-h1 font-semibold">{pick.company.ticker}</h1>
                  <Badge tone={SIGNAL_TONE[pick.signal]}>{SIGNAL_LABEL[pick.signal]}</Badge>
                  <Badge tone="outline">#{pick.rank} del ranking</Badge>
                </div>
                <p className="truncate text-body text-fg-muted">
                  {pick.company.name} · {pick.company.sector}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="num text-h1 font-semibold">
                  {quote ? formatPrice(quote.price) : '—'}
                </p>
                {quote ? <Delta percent={quote.changePercent} absolute={quote.change} /> : null}
              </div>
              <div className="flex flex-col items-center">
                <ScoreRing score={pick.score} size={58} />
                <span className="mt-1 text-caption uppercase tracking-[0.08em] text-fg-subtle">
                  Confianza
                </span>
              </div>
            </div>
          </header>

          <button
            type="button"
            onClick={() => openForStock(pick.company.ticker)}
            className="mt-5 inline-flex items-center gap-2 rounded-md border border-ai-600/40 bg-ai-600/12 px-4 py-2.5 text-sm font-medium text-ai-300 transition-colors duration-fast hover:bg-ai-600/20 hover:text-fg"
          >
            <MessageSquare size={15} strokeWidth={2.3} aria-hidden />
            Hablar sobre esta acción
          </button>

          <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="flex flex-col gap-5">
              <Card>
                <ThesisPanel thesis={pick.thesis} />
              </Card>

              <Card>
                <CardHeader
                  title="Precio"
                  hint={`Histórico simulado · línea punteada = objetivo del agente`}
                  action={
                    <SegmentedControl
                      options={RANGES}
                      value={range}
                      onChange={(value) => setRange(value as Timeframe)}
                      ariaLabel="Rango del gráfico"
                      size="sm"
                    />
                  }
                />
                {seriesState.loading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <PriceChart
                    candles={seriesState.data ?? []}
                    mode="area"
                    range={range}
                    color={pick.company.brandColor}
                    height={300}
                    referencePrice={pick.thesis.targetPrice}
                    referenceLabel="Objetivo del agente"
                  />
                )}
              </Card>

              <Card>
                <CardHeader
                  title="Métricas que evaluó el Research Agent"
                  hint={`${pick.metrics.length} métricas · ${pick.metrics.filter((metric) => metric.verdict === 'bullish').length} a favor, ${pick.metrics.filter((metric) => metric.verdict === 'bearish').length} en contra`}
                />
                <MetricsTable metrics={pick.metrics} />
              </Card>
            </div>

            <aside className="flex flex-col gap-5">
              <Card>
                <CardHeader title="Objetivo y riesgo" />
                <TargetBar
                  thesis={pick.thesis}
                  currentPrice={quote?.price ?? pick.thesis.targetPrice}
                />
              </Card>

              <Card>
                <CardHeader title="Datos de mercado" />
                <dl className="flex flex-col gap-2.5 text-sm">
                  {[
                    ['Máximo del día', quote ? formatPrice(quote.dayHigh) : '—'],
                    ['Mínimo del día', quote ? formatPrice(quote.dayLow) : '—'],
                    ['Volumen medio', quote ? formatCompact(quote.volume) : '—'],
                    ['Capitalización', quote ? `USD ${formatCompact(quote.marketCap)}` : '—'],
                    ['Asignación sugerida', `${pick.allocationPercent}%`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <dt className="text-fg-subtle">{label}</dt>
                      <dd className="num font-medium text-fg-muted">{value}</dd>
                    </div>
                  ))}
                </dl>
              </Card>

              <Card>
                <CardHeader
                  title="Noticias del Research Agent"
                  hint={
                    newsState.data
                      ? `${newsState.data.length} titulares de las últimas 48 h`
                      : undefined
                  }
                />
                {newsState.loading ? (
                  <div className="flex flex-col gap-3" aria-busy>
                    {Array.from({ length: 3 }, (_, index) => (
                      <Skeleton key={index} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <NewsFeed items={newsState.data ?? []} />
                )}
              </Card>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
