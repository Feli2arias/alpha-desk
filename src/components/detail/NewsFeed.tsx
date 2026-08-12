import type { NewsItem } from '@/types'
import { formatRelative } from '@/lib/format'
import { SENTIMENT_LABEL, SENTIMENT_TONE } from '@/lib/signals'
import { Badge } from '@/components/ui/Badge'

// Contract: NewsFeed
// Props: items (NewsItem[], req)
// Variants: sentimiento positivo | neutral | negativo (badge)
// States: con noticias | vacío
// Accessibility: lista de <article> con <h3>; la relevancia se expone en texto
// Responsive: una columna en todos los tamaños; el badge baja de línea en <sm

export function NewsFeed({ items }: { items: readonly NewsItem[] }) {
  if (!items.length) {
    return (
      <p className="text-sm text-fg-subtle">
        El Research Agent no encontró noticias relevantes en las últimas 48 horas.
      </p>
    )
  }

  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li key={item.id} className="border-b border-border/60 py-3.5 first:pt-0 last:border-0 last:pb-0">
          <article>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={SENTIMENT_TONE[item.sentiment]}>{SENTIMENT_LABEL[item.sentiment]}</Badge>
              <span className="text-caption text-fg-subtle">
                {item.source} · {formatRelative(item.publishedAt)} · relevancia{' '}
                <span className="num">{item.relevance}</span>/100
              </span>
            </div>
            <h3 className="mt-1.5 text-body font-medium leading-snug text-fg">{item.headline}</h3>
            <p className="mt-1 text-sm text-fg-subtle">{item.summary}</p>
          </article>
        </li>
      ))}
    </ul>
  )
}
