import { cn } from '@/lib/cn'

// Contract: ScoreRing
// Props: score (0–100, req), size (px, opt), label (string, opt)
// Variants: size numérico libre; el trazo escala con el tamaño
// States: estático — el arco se dibuja según score
// Accessibility: role="img" + aria-label con el valor en texto; el número también se ve
// Responsive: tamaño fijo por instancia; el llamador ajusta por breakpoint

interface ScoreRingProps {
  score: number
  size?: number
  className?: string
}

export function ScoreRing({ score, size = 48, className }: ScoreRingProps) {
  const stroke = Math.max(2.5, size * 0.075)
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(Math.max(score, 0), 100)
  const offset = circumference * (1 - clamped / 100)

  return (
    <div
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score de confianza del agente: ${clamped} sobre 100`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-base-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-ai-500 transition-[stroke-dashoffset] duration-slow ease-out-soft"
        />
      </svg>
      <span
        className="num absolute font-semibold text-fg"
        style={{ fontSize: size * 0.3 }}
      >
        {clamped}
      </span>
    </div>
  )
}
