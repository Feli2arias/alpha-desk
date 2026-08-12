import { cn } from '@/lib/cn'

// Contract: SegmentedControl
// Props: options ({value,label}[], req), value (string, req), onChange ((v)=>void, req), size (sm|md, opt)
// Variants: size sm | md
// States: default | hover | focus-visible | selected
// Accessibility: role="tablist" + aria-selected; navegable con Tab y activable con Enter/Space
// Responsive: scroll horizontal si no entra; nunca rompe el layout

export interface SegmentOption {
  value: string
  label: string
}

interface SegmentedControlProps {
  options: readonly SegmentOption[]
  value: string
  onChange: (value: string) => void
  size?: 'sm' | 'md'
  ariaLabel: string
  className?: string
}

export function SegmentedControl({
  options,
  value,
  onChange,
  size = 'md',
  ariaLabel,
  className,
}: SegmentedControlProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex shrink-0 gap-0.5 overflow-x-auto rounded-md border border-border bg-base-950 p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'num rounded-sm font-medium transition-colors duration-fast',
              size === 'sm' ? 'px-2.5 py-1 text-caption' : 'px-3 py-1.5 text-sm',
              selected
                ? 'bg-base-800 text-fg'
                : 'text-fg-subtle hover:bg-base-900 hover:text-fg-muted',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
