import { useMemo } from 'react'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Candle, Timeframe } from '@/types'
import { formatDateShort, formatNumber, formatPrice, formatTime } from '@/lib/format'

// Contract: PriceChart
// Props: candles (Candle[], req), mode (area|candlestick, req), range (Timeframe, req),
//        color (hex, req), height (px, opt), referencePrice (number, opt)
// Variants: mode area (línea + degradado) | candlestick (velas OHLC)
// States: con datos | vacío (mensaje) — el loading lo maneja el llamador con Skeleton
// Accessibility: role="img" con aria-label descriptivo; el tooltip es refuerzo, no la única vía
// Responsive: ResponsiveContainer; en <sm se reduce la densidad de ticks del eje X

interface PriceChartProps {
  candles: readonly Candle[]
  mode: 'area' | 'candlestick'
  range: Timeframe
  color: string
  height?: number
  /** Línea horizontal punteada — se usa para el precio objetivo del agente. */
  referencePrice?: number
  referenceLabel?: string
}

interface CandleShapeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: Candle
}

/** Vela OHLC dibujada sobre el rango [low, high] que Recharts ya posicionó. */
function CandleShape(props: CandleShapeProps) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props
  if (!payload) return null

  const { open, close, high, low } = payload
  const span = high - low || 1
  const toY = (price: number) => y + ((high - price) / span) * height

  const up = close >= open
  const stroke = up ? 'var(--color-gain-500)' : 'var(--color-loss-500)'
  const bodyTop = toY(Math.max(open, close))
  const bodyHeight = Math.max(Math.abs(toY(open) - toY(close)), 1)
  const bodyWidth = Math.max(width * 0.62, 1)
  const centerX = x + width / 2

  return (
    <g>
      <line x1={centerX} x2={centerX} y1={y} y2={y + height} stroke={stroke} strokeWidth={1} />
      <rect
        x={centerX - bodyWidth / 2}
        y={bodyTop}
        width={bodyWidth}
        height={bodyHeight}
        fill={up ? 'var(--color-gain-500)' : 'var(--color-loss-500)'}
        opacity={up ? 0.85 : 0.9}
      />
    </g>
  )
}

interface TooltipPayloadItem {
  payload: Candle
}

function ChartTooltip({
  active,
  payload,
  intraday,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  intraday: boolean
}) {
  if (!active || !payload?.length) return null
  const candle = payload[0].payload

  return (
    <div className="rounded-md border border-border bg-base-950/95 px-3 py-2 shadow-md">
      <p className="num text-caption text-fg-subtle">
        {intraday
          ? formatTime(new Date(candle.time).toISOString())
          : formatDateShort(new Date(candle.time).toISOString())}
      </p>
      <p className="num mt-1 text-body font-semibold text-fg">{formatPrice(candle.close)}</p>
      <dl className="num mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-caption text-fg-subtle">
        <dt>Apertura</dt>
        <dd className="text-right text-fg-muted">{formatNumber(candle.open)}</dd>
        <dt>Máximo</dt>
        <dd className="text-right text-fg-muted">{formatNumber(candle.high)}</dd>
        <dt>Mínimo</dt>
        <dd className="text-right text-fg-muted">{formatNumber(candle.low)}</dd>
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
  referencePrice,
  referenceLabel,
}: PriceChartProps) {
  const intraday = range === '1D' || range === '1W'

  const data = useMemo(
    () => candles.map((candle) => ({ ...candle, range: [candle.low, candle.high] as [number, number] })),
    [candles],
  )

  const domain = useMemo<[number, number]>(() => {
    if (!candles.length) return [0, 1]
    const lows = candles.map((candle) => candle.low)
    const highs = candles.map((candle) => candle.high)
    const min = Math.min(...lows, referencePrice ?? Infinity)
    const max = Math.max(...highs, referencePrice ?? -Infinity)
    const pad = (max - min) * 0.08 || max * 0.02
    return [min - pad, max + pad]
  }, [candles, referencePrice])

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
  const positive = last >= first

  return (
    <div
      style={{ height }}
      role="img"
      aria-label={`Gráfico de precio, rango ${range}. Desde ${formatPrice(first)} hasta ${formatPrice(last)}.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 24 }}>
          <defs>
            <linearGradient id={`fill-${range}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--color-base-850)" strokeDasharray="2 4" vertical={false} />

          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            minTickGap={48}
            tick={{ fill: 'var(--color-base-500)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickFormatter={(value: number) =>
              intraday
                ? formatTime(new Date(value).toISOString())
                : formatDateShort(new Date(value).toISOString())
            }
          />
          <YAxis
            domain={domain}
            orientation="right"
            width={64}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-base-500)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickFormatter={(value: number) => formatNumber(value)}
          />

          <Tooltip
            cursor={{ stroke: 'var(--color-base-700)', strokeDasharray: '3 3' }}
            content={<ChartTooltip intraday={intraday} />}
          />

          {referencePrice ? (
            <ReferenceLine
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
              type="monotone"
              dataKey="close"
              stroke={positive ? 'var(--color-gain-500)' : 'var(--color-loss-500)'}
              strokeWidth={1.75}
              fill={`url(#fill-${range})`}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          ) : (
            <Bar dataKey="range" shape={<CandleShape />} isAnimationActive={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
