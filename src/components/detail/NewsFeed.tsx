import { ArrowUpRight } from 'lucide-react'
import type { NewsItem } from '@/types'
import { formatRelative } from '@/lib/format'
import { SENTIMENT_LABEL, SENTIMENT_TONE } from '@/lib/signals'
import { Badge } from '@/components/ui/Badge'

// Contract: NewsFeed
// Props: items (NewsItem[], req)
// Variants: nota con evaluación del agente (badge de sentimiento) | nota cruda del proveedor
// States: con noticias | vacío
// Accessibility: lista de <article> con <h3>; el titular es el enlace y abre en
//                pestaña nueva avisándolo en el aria-label
// Responsive: una columna en todos los tamaños; la meta baja de línea en <sm

export function NewsFeed({ items }: { items: readonly NewsItem[] }) {
  if (!items.length) {
    return (
      <p className="text-sm text-fg-subtle">
        No hay noticias recientes para esta acción.
      </p>
    )
  }

  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li
          key={item.id}
          className="group border-b border-border/60 py-3.5 first:pt-0 last:border-0 last:pb-0"
        >
          <article>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {item.sentiment ? (
                <Badge tone={SENTIMENT_TONE[item.sentiment]}>
                  {SENTIMENT_LABEL[item.sentiment]}
                </Badge>
              ) : null}
              <span className="text-caption text-fg-subtle">
                <span className="text-fg-muted">{item.source}</span>
                {' · '}
                {formatRelative(item.publishedAt)}
                {item.relevance !== undefined ? (
                  <>
                    {' · relevancia '}
                    <span className="num">{item.relevance}</span>/100
                  </>
                ) : null}
              </span>
            </div>

            <h3 className="mt-1.5 text-body font-medium leading-snug text-fg">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${item.headline} — abre en una pestaña nueva`}
                  className="inline-flex items-start gap-1 transition-colors duration-fast hover:text-ai-300"
                >
                  <span>{item.headline}</span>
                  <ArrowUpRight
                    size={14}
                    strokeWidth={2.2}
                    aria-hidden
                    className="mt-1 shrink-0 text-fg-subtle transition-colors duration-fast group-hover:text-ai-400"
                  />
                </a>
              ) : (
                item.headline
              )}
            </h3>

            {item.summary ? (
              <p className="mt-1 line-clamp-2 text-sm text-fg-subtle">{item.summary}</p>
            ) : null}
          </article>
        </li>
      ))}
    </ul>
  )
}
