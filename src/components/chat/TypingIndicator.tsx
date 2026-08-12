// Contract: TypingIndicator
// Props: ninguna
// Variants: única
// States: siempre animado; con prefers-reduced-motion los puntos quedan estáticos
// Accessibility: role="status" + aria-live="polite" con texto para lectores de pantalla
// Responsive: tamaño fijo, no depende del breakpoint

export function TypingIndicator() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-1.5 rounded-lg rounded-bl-sm border border-border bg-surface-raised px-3.5 py-3"
    >
      <span className="sr-only">El agente está escribiendo</span>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="size-1.5 rounded-full bg-ai-400"
          style={{
            animation: `shipui-blink 1.1s ${index * 0.16}s var(--ease-out-soft) infinite`,
          }}
          aria-hidden
        />
      ))}
    </div>
  )
}
