import type { Thesis } from '@/types'
import { formatPercent, formatPrice } from '@/lib/format'

// Contract: TargetBar
// Props: thesis (Thesis, req), currentPrice (number, req)
// Variants: única
// States: precio dentro del rango stop–objetivo | fuera del rango (se clampea a los extremos)
// Accessibility: role="meter" con aria-valuenow/min/max; todos los valores también en texto
// Responsive: barra a ancho completo; las etiquetas se apilan en <sm

interface TargetBarProps {
  thesis: Thesis
  currentPrice: number
}

export function TargetBar({ thesis, currentPrice }: TargetBarProps) {
  const span = thesis.targetPrice - thesis.stopLoss || 1
  const rawPosition = ((currentPrice - thesis.stopLoss) / span) * 100
  const position = Math.min(Math.max(rawPosition, 2), 98)

  const upside = ((thesis.targetPrice - currentPrice) / currentPrice) * 100
  const downside = ((currentPrice - thesis.stopLoss) / currentPrice) * 100

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-caption uppercase tracking-[0.1em] text-fg-subtle">Stop</p>
          <p className="num text-body font-semibold text-loss-500">{formatPrice(thesis.stopLoss)}</p>
          <p className="num text-caption text-fg-subtle">{formatPercent(-downside)}</p>
        </div>
        <div className="text-center">
          <p className="text-caption uppercase tracking-[0.1em] text-fg-subtle">Actual</p>
          <p className="num text-body font-semibold text-fg">{formatPrice(currentPrice)}</p>
        </div>
        <div className="text-right">
          <p className="text-caption uppercase tracking-[0.1em] text-fg-subtle">Objetivo</p>
          <p className="num text-body font-semibold text-gain-500">{formatPrice(thesis.targetPrice)}</p>
          <p className="num text-caption text-fg-subtle">{formatPercent(upside)}</p>
        </div>
      </div>

      <div
        className="relative mt-3 h-1.5 rounded-full bg-gradient-to-r from-loss-600/40 via-base-800 to-gain-600/40"
        role="meter"
        aria-valuemin={thesis.stopLoss}
        aria-valuemax={thesis.targetPrice}
        aria-valuenow={currentPrice}
        aria-label="Posición del precio actual entre el stop y el precio objetivo"
      >
        <span
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-base-950 bg-fg transition-[left] duration-slow ease-out-soft"
          style={{ left: `${position}%` }}
          aria-hidden
        />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-caption uppercase tracking-[0.1em] text-fg-subtle">Horizonte</dt>
          <dd className="mt-0.5 text-fg-muted">{thesis.horizon}</dd>
        </div>
        <div>
          <dt className="text-caption uppercase tracking-[0.1em] text-fg-subtle">Riesgo / Beneficio</dt>
          <dd className="num mt-0.5 text-fg-muted">{(upside / downside).toFixed(2)} : 1</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-caption uppercase tracking-[0.1em] text-fg-subtle">Convicción</dt>
          <dd className="mt-0.5 leading-relaxed text-fg-muted">{thesis.conviction}</dd>
        </div>
      </dl>
    </div>
  )
}
