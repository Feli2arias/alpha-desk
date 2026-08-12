import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import type { Metric } from '@/types'
import { VERDICT_LABEL } from '@/lib/signals'
import { cn } from '@/lib/cn'

// Contract: MetricsTable
// Props: metrics (Metric[], req)
// Variants: veredicto bullish | neutral | bearish por fila
// States: estático; sin datos renderiza un mensaje
// Accessibility: <table> real con <th scope="col">; el icono + el texto "A favor/En contra"
//                acompañan al color, que nunca es el único portador de significado
// Responsive: <md se convierte en lista de tarjetas; ≥md tabla de 4 columnas

const VERDICT_ICON = {
  bullish: TrendingUp,
  neutral: Minus,
  bearish: TrendingDown,
} as const

const VERDICT_COLOR = {
  bullish: 'text-gain-500',
  neutral: 'text-fg-subtle',
  bearish: 'text-loss-500',
} as const

export function MetricsTable({ metrics }: { metrics: readonly Metric[] }) {
  if (!metrics.length) {
    return <p className="text-sm text-fg-subtle">El Research Agent no reportó métricas.</p>
  }

  return (
    <>
      {/* Móvil: lista */}
      <ul className="flex flex-col gap-2 md:hidden">
        {metrics.map((metric) => {
          const Icon = VERDICT_ICON[metric.verdict]
          return (
            <li key={metric.key} className="rounded-md border border-border bg-base-950 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-fg-muted">{metric.label}</span>
                <span className={cn('num flex items-center gap-1.5 text-body font-semibold', VERDICT_COLOR[metric.verdict])}>
                  <Icon size={14} strokeWidth={2.4} aria-hidden />
                  {metric.value}
                </span>
              </div>
              <p className="mt-1 text-caption text-fg-subtle">
                {metric.benchmark} · {VERDICT_LABEL[metric.verdict]}
              </p>
              <p className="mt-1.5 text-sm text-fg-subtle">{metric.note}</p>
            </li>
          )
        })}
      </ul>

      {/* Desktop: tabla */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Métricas evaluadas por el Research Agent, con su veredicto
          </caption>
          <thead>
            <tr className="border-b border-border">
              {['Métrica', 'Valor', 'Referencia', 'Lectura del agente'].map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="pb-2 text-caption font-medium uppercase tracking-[0.08em] text-fg-subtle"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => {
              const Icon = VERDICT_ICON[metric.verdict]
              return (
                <tr
                  key={metric.key}
                  className="border-b border-border/60 transition-colors duration-fast last:border-0 hover:bg-base-850/40"
                >
                  <th scope="row" className="py-2.5 pr-4 text-sm font-medium text-fg-muted">
                    {metric.label}
                  </th>
                  <td className="py-2.5 pr-4">
                    <span className={cn('num flex items-center gap-1.5 text-sm font-semibold', VERDICT_COLOR[metric.verdict])}>
                      <Icon size={13} strokeWidth={2.6} aria-hidden />
                      {metric.value}
                      <span className="sr-only"> — {VERDICT_LABEL[metric.verdict]}</span>
                    </span>
                  </td>
                  <td className="num py-2.5 pr-4 text-sm text-fg-subtle">{metric.benchmark}</td>
                  <td className="py-2.5 text-sm text-fg-subtle">{metric.note}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
