import type { AnalysisRun } from '@/types'
import { formatNumber } from '@/lib/format'

// Contract: WatchlistSummary
// Props: total (number, req), runs (AnalysisRun[], req)
// Variants: única
// States: sin análisis (muestra guiones) | con análisis
// Accessibility: <dl> con término y valor; los números también se leen como texto
// Responsive: 2 columnas en móvil, 4 desde sm

interface WatchlistSummaryProps {
  total: number
  runs: readonly AnalysisRun[]
}

export function WatchlistSummary({ total, runs }: WatchlistSummaryProps) {
  const withVerdict = runs.filter((run) => run.verdict !== null)
  const buys = withVerdict.filter(
    (run) => run.verdict!.signal === 'buy' || run.verdict!.signal === 'strong_buy',
  ).length
  const averageScore =
    withVerdict.length > 0
      ? withVerdict.reduce((sum, run) => sum + run.verdict!.score, 0) / withVerdict.length
      : null

  const tiles: { label: string; value: string; hint: string }[] = [
    { label: 'En seguimiento', value: String(total), hint: 'acciones en la lista' },
    {
      label: 'Analizadas',
      value: `${withVerdict.length}/${total}`,
      hint: 'con veredicto de esta sesión',
    },
    { label: 'Señales de compra', value: String(buys), hint: 'comprar o comprar fuerte' },
    {
      label: 'Convicción media',
      value: averageScore === null ? '—' : `${formatNumber(averageScore)}`,
      hint: 'sobre 100',
    },
  ]

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-lg border border-border bg-surface px-4 py-3">
          <dt className="text-caption uppercase tracking-[0.08em] text-fg-subtle">{tile.label}</dt>
          <dd className="num mt-1 text-h2 font-semibold text-fg">{tile.value}</dd>
          <p className="mt-0.5 text-caption text-fg-subtle">{tile.hint}</p>
        </div>
      ))}
    </dl>
  )
}
