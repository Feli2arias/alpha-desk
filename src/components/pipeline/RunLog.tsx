import type { RunLogEntry } from '@/types'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/cn'

// Contract: RunLog
// Props: entries (RunLogEntry[], req)
// Variants: nivel info | success | warn — cambia el color del prefijo, no del texto
// States: con entradas | vacío
// Accessibility: <ol> monoespaciada; el nivel se escribe como etiqueta textual (INFO/OK/WARN)
// Responsive: scroll horizontal si una línea es muy larga; nunca desborda el layout

const LEVEL_LABEL = { info: 'INFO', success: ' OK ', warn: 'WARN' } as const
const LEVEL_COLOR = {
  info: 'text-fg-subtle',
  success: 'text-gain-500',
  warn: 'text-warn-500',
} as const

const ROLE_COLOR = {
  research: 'text-base-300',
  decision: 'text-ai-300',
  system: 'text-fg-subtle',
} as const

const ROLE_LABEL = {
  research: 'research',
  decision: 'decision',
  system: 'system  ',
} as const

export function RunLog({ entries }: { entries: readonly RunLogEntry[] }) {
  if (!entries.length) {
    return <p className="text-sm text-fg-subtle">Sin logs para este run.</p>
  }

  return (
    <ol className="num max-h-[26rem] overflow-auto rounded-md border border-border bg-base-950 p-3 text-caption leading-relaxed">
      {entries.map((entry, index) => (
        <li key={`${entry.at}-${index}`} className="flex gap-2.5 whitespace-nowrap py-0.5">
          <span className="shrink-0 text-fg-subtle">{formatTime(entry.at)}</span>
          <span className={cn('shrink-0', LEVEL_COLOR[entry.level])}>
            [{LEVEL_LABEL[entry.level]}]
          </span>
          <span className={cn('shrink-0', ROLE_COLOR[entry.role])}>{ROLE_LABEL[entry.role]}</span>
          <span className="text-fg-muted">{entry.message}</span>
        </li>
      ))}
    </ol>
  )
}
