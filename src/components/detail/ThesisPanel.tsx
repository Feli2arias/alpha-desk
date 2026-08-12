import { AlertTriangle, Sparkles, Zap } from 'lucide-react'
import type { Thesis } from '@/types'

// Contract: ThesisPanel
// Props: thesis (Thesis, req)
// Variants: única
// States: estático
// Accessibility: <section> con encabezados jerárquicos; los iconos son decorativos
// Responsive: catalizadores y riesgos en 1 col <lg, 2 cols ≥lg

export function ThesisPanel({ thesis }: { thesis: Thesis }) {
  return (
    <section aria-labelledby="tesis-titulo">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-ai-400" strokeWidth={2.4} aria-hidden />
        <span className="text-caption uppercase tracking-[0.12em] text-ai-400">
          Tesis del Decision Agent
        </span>
      </div>

      <h2 id="tesis-titulo" className="mt-3 text-h1 font-semibold leading-tight text-fg text-balance">
        {thesis.headline}
      </h2>

      <div className="mt-5 flex flex-col gap-4 border-l-2 border-ai-600/30 pl-5">
        {thesis.paragraphs.map((paragraph, index) => (
          <p key={index} className="text-body leading-relaxed text-fg-muted text-pretty">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-base-950 p-4">
          <h3 className="flex items-center gap-2 text-caption uppercase tracking-[0.1em] text-gain-500">
            <Zap size={13} strokeWidth={2.6} aria-hidden />
            Catalizadores
          </h3>
          <ul className="mt-3 flex flex-col gap-2.5">
            {thesis.catalysts.map((catalyst) => (
              <li key={catalyst} className="flex gap-2.5 text-sm leading-relaxed text-fg-muted">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-gain-500" aria-hidden />
                {catalyst}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border border-border bg-base-950 p-4">
          <h3 className="flex items-center gap-2 text-caption uppercase tracking-[0.1em] text-loss-500">
            <AlertTriangle size={13} strokeWidth={2.6} aria-hidden />
            Riesgos
          </h3>
          <ul className="mt-3 flex flex-col gap-2.5">
            {thesis.risks.map((risk) => (
              <li key={risk} className="flex gap-2.5 text-sm leading-relaxed text-fg-muted">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-loss-500" aria-hidden />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
