import { useMemo } from 'react'
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Candle, Timeframe } from '@/types'
import {
  formatCompact,
  formatDateShort,
  formatNumber,
  formatPercent,
  formatPrice,
  formatTime,
} from '@/lib/format'

// Contract: PriceChart
// Props: candles (Candle[], req), mode (area|candlestick, req), range (Timeframe, req),
//        color (hex, req), height (px, opt), previousClose (number, opt),
//        showVolume (bool, opt), referencePrice/referenceLabel (opt)
// Variants: mode area (línea + degradado) | candlestick (velas OHLC), con o sin panel de volumen
// States: con datos | vacío (mensaje). El loading lo maneja el llamador con Skeleton
// Accessibility: role="img" con aria-label que resume rango, apertura y cierre;
//                el tooltip es refuerzo visual, no la única vía al dato
// Responsive: ResponsiveContainer; los ticks del eje X se calculan según el ancho disponible

interface PriceChartProps {
  candles: readonly Candle[]
  mode: 'area' | 'candlestick'
  range: Timeframe
  color: string
  height?: number
  /** Cierre de la rueda anterior — línea de referencia del intradía. */
  previousClose?: number | null
  /** El volumen sólo existe en rangos diarios; en intradía el proveedor no lo publica. */
  showVolume?: boolean
  /** Línea horizontal punteada extra — se usa para el precio objetivo del agente. */
  referencePrice?: number
  referenceLabel?: string
}

interface ChartDatum extends Candle {
  /** Posición en la serie. El eje X usa el índice, no el tiempo — ver abajo. */
  index: number
}

const INTRADAY_RANGES = new Set<Timeframe>(['1D'])

/**
 * El eje X es el índice de la vela, no su timestamp.
 *
 * Con un eje temporal real, las noches y los fines de semana abren huecos
 * enormes que aplastan las velas contra el borde. Numerando las velas, el
 * gráfico sólo dibuja tiempo negociado —igual que cualquier terminal— y el
 * formateador traduce el índice de vuelta a fecha para las etiquetas.
 */
function useTicks(count: number, desired: number): number[] {
  return useMemo(() => {
    if (count <= 1) return [0]
    const step = Math.max(1, Math.floor(count / desired))
    const ticks: number[] = []
    for (let index = 0; index < count; index += step) ticks.push(index)
    // Sin esto la última etiqueta puede caer muy lejos del borde derecho.
    if (ticks[ticks.length - 1] !== count - 1) ticks.push(count - 1)
    return ticks
  }, [count, desired])
}

interface CandleShapeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: ChartDatum
}

/** Vela OHLC dibujada dentro del rango [low, high] que Recharts ya posicionó. */
function CandleShape({ x = 0, y = 0, width = 0, height = 0, payload }: CandleShapeProps) {
  if (!payload) return null

  const { open, close, high, low } = payload
  const span = high - low || 1
  const toY = (price: number) => y + ((high - price) / span) * height

  const up = close >= open
  const tone = up ? 'var(--color-gain-500)' : 'var(--color-loss-500)'
  const bodyTop = toY(Math.max(open, close))
  const bodyHeight = Math.max(Math.abs(toY(open) - toY(close)), 1)
  const bodyWidth = Math.max(width * 0.6, 1)
  const centerX = x + width / 2

  return (
    <g>
      <line x1={centerX} x2={centerX} y1={y} y2={y + height} stroke={tone} strokeWidth={1} />
      <rect
        x={centerX - bodyWidth / 2}
        y={bodyTop}
        width={bodyWidth}
        height={bodyHeight}
        fill={tone}
        opacity={0.9}
      />
    </g>
  )
}

interface TooltipProps {
  active?: boolean
  payload?: { payload: ChartDatum }[]
  intraday: boolean
  previousClose?: number | null
  showVolume: boolean
}

function ChartTooltip({ active, payload, intraday, previousClose, showVolume }: TooltipProps) {
  if (!active || !payload?.length) return null

  const candle = payload[0].payload
  const iso = new Date(candle.time).toISOString()
  const baseline = previousClose ?? candle.open
  const delta = candle.close - baseline
  const deltaPercent = baseline ? (delta / baseline) * 100 : 0
  const positive = delta >= 0

  return (
    <div className="min-w-44 rounded-md border border-border-strong bg-base-950/97 px-3 py-2 shadow-lg">
      <p className="num text-caption tracking-[0.06em] text-fg-subtle">
        {intraday ? formatTime(iso) : formatDateShort(iso)}
      </p>

      <div className="mt-1 flex items-baseline gap-2">
        <p className="num text-h3 font-semibold text-fg">{formatPrice(candle.close)}</p>
        <p
          className={`num text-caption font-medium ${positive ? 'text-gain-500' : 'text-loss-500'}`}
        >
          {formatPercent(deltaPercent)}
        </p>
      </div>

      <dl className="num mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 border-t border-border/70 pt-1.5 text-caption text-fg-subtle">
        <dt>Apertura</dt>
        <dd className="text-right text-fg-muted">{formatNumber(candle.open)}</dd>
        <dt>Máximo</dt>
        <dd className="text-right text-fg-muted">{formatNumber(candle.high)}</dd>
        <dt>Mínimo</dt>
        <dd className="text-right text-fg-muted">{formatNumber(candle.low)}</dd>
        {showVolume && candle.volume > 0 ? (
          <>
            <dt>Volumen</dt>
            <dd className="text-right text-fg-muted">{formatCompact(candle.volume)}</dd>
          </>
        ) : null}
      </dl>
    </div>
  )
}

export function PriceChart({
  candles,
  mode,
  range,
  color,
  height = 320,
  previousClose,
  showVolume = false,
  referencePrice,
  referenceLabel,
}: PriceChartProps) {
  const intraday = INTRADAY_RANGES.has(range)

  const data = useMemo<ChartDatum[]>(
    () =>
      candles.map((candle, index) => ({
        ...candle,
        index,
        // Recharts posiciona la vela a partir de este par [min, max].
        range: [candle.low, candle.high] as [number, number],
      })),
    [candles],
  )

  const ticks = useTicks(data.length, 6)

  const priceDomain = useMemo<[number, number]>(() => {
    if (!candles.length) return [0, 1]
    const candidates = [
      ...candles.map((candle) => candle.low),
      ...candles.map((candle) => candle.high),
    ]
    if (previousClose) candidates.push(previousClose)
    if (referencePrice) candidates.push(referencePrice)

    const min = Math.min(...candidates)
    const max = Math.max(...candidates)
    const pad = (max - min) * 0.08 || max * 0.02
    return [min - pad, max + pad]
  }, [candles, previousClose, referencePrice])

  /**
   * El volumen comparte el gráfico con el precio pero se dibuja contra su propio
   * eje, estirado 4x. Así las barras nunca ocupan más del cuarto inferior y no
   * compiten visualmente con la serie de precios.
   */
  const volumeDomain = useMemo<[number, number]>(() => {
    const max = Math.max(...candles.map((candle) => candle.volume), 0)
    return [0, max > 0 ? max * 4 : 1]
  }, [candles])

  const hasVolume = showVolume && volumeDomain[1] > 1

  if (!candles.length) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-dashed border-border text-sm text-fg-subtle"
        style={{ height }}
      >
        Sin datos para este rango
      </div>
    )
  }

  const first = candles[0].close
  const last = candles[candles.length - 1].close
  const positive = last >= (previousClose ?? first)
  const lineColor = positive ? 'var(--color-gain-500)' : 'var(--color-loss-500)'

  const formatTick = (index: number) => {
    const candle = candles[Math.round(index)]
    if (!candle) return ''
    const iso = new Date(candle.time).toISOString()
    return intraday ? formatTime(iso) : formatDateShort(iso)
  }

  return (
    <div
      style={{ height }}
      role="img"
      aria-label={`Gráfico de precio, rango ${range}. Abre en ${formatPrice(first)} y cierra en ${formatPrice(last)}.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id={`area-fill-${range}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--color-base-850)" strokeDasharray="2 5" vertical={false} />

          <XAxis
            dataKey="index"
            type="number"
            domain={[0, data.length - 1]}
            ticks={ticks}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: 'var(--color-base-500)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickFormatter={formatTick}
          />

          <YAxis
            yAxisId="price"
            domain={priceDomain}
            orientation="right"
            width={62}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-base-500)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickFormatter={(value: number) => formatNumber(value)}
          />
          <YAxis yAxisId="volume" domain={volumeDomain} hide />

          <Tooltip
            cursor={{ stroke: 'var(--color-base-600)', strokeDasharray: '3 3', strokeWidth: 1 }}
            content={
              <ChartTooltip
                intraday={intraday}
                previousClose={previousClose}
                showVolume={hasVolume}
              />
            }
          />

          {hasVolume ? (
            <Bar yAxisId="volume" dataKey="volume" isAnimationActive={false}>
              {data.map((candle) => (
                <Cell
                  key={candle.index}
                  fill={
                    candle.close >= candle.open
                      ? 'var(--color-gain-600)'
                      : 'var(--color-loss-600)'
                  }
                  opacity={0.28}
                />
              ))}
            </Bar>
          ) : null}

          {previousClose ? (
            <ReferenceLine
              yAxisId="price"
              y={previousClose}
              stroke="var(--color-base-600)"
              strokeDasharray="3 4"
              label={{
                value: 'Cierre previo',
                position: 'insideBottomLeft',
                fill: 'var(--color-base-500)',
                fontSize: 10,
              }}
            />
          ) : null}

          {referencePrice ? (
            <ReferenceLine
              yAxisId="price"
              y={referencePrice}
              stroke="var(--color-ai-400)"
              strokeDasharray="4 4"
              label={{
                value: referenceLabel ?? 'Objetivo',
                position: 'insideTopRight',
                fill: 'var(--color-ai-300)',
                fontSize: 11,
              }}
            />
          ) : null}

          {mode === 'area' ? (
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="close"
              stroke={lineColor}
              strokeWidth={1.75}
              fill={`url(#area-fill-${range})`}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: lineColor }}
              isAnimationActive={false}
            />
          ) : (
            <Bar yAxisId="price" dataKey="range" shape={<CandleShape />} isAnimationActive={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
