import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AnalysisRun, ChatMode } from '@/types'
import { analysisService } from '@/services/analysisService'

interface AnalysisValue {
  /** Todos los runs de la sesión, indexados por id. */
  runs: Readonly<Record<string, AnalysisRun>>
  /** Último run de cada ticker, indexado por ticker. */
  latestByTicker: Readonly<Record<string, AnalysisRun>>
  /** Cantidad de análisis corriendo ahora mismo. */
  activeCount: number
  /** Dispara el análisis y devuelve el id del run (o el del run en curso). */
  start: (ticker: string, mode?: ChatMode) => string
  getRun: (id: string) => AnalysisRun | undefined
  isRunning: (ticker: string) => boolean
}

const AnalysisContext = createContext<AnalysisValue | null>(null)

function isActive(run: AnalysisRun | undefined): boolean {
  return run !== undefined && run.status !== 'done' && run.status !== 'error'
}

/**
 * Estado compartido de los análisis on-demand. Vive acá arriba —y no dentro
 * del chat— porque la watchlist muestra los mismos veredictos y tiene que
 * poder disparar runs sin pasar por la conversación.
 */
export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [runs, setRuns] = useState<Readonly<Record<string, AnalysisRun>>>({})
  /** Ticker → id del run en curso. Evita disparar dos veces la misma acción. */
  const inFlight = useRef<Map<string, string>>(new Map())

  const start = useCallback((ticker: string, mode: ChatMode = 'auto'): string => {
    const upper = ticker.trim().toUpperCase()
    const existing = inFlight.current.get(upper)
    if (existing) return existing

    const id = analysisService.createRunId(upper)
    inFlight.current.set(upper, id)

    analysisService
      .run(upper, id, mode, (run) => {
        setRuns((previous) => ({ ...previous, [run.id]: run }))
        if (run.status === 'done' || run.status === 'error') {
          inFlight.current.delete(upper)
        }
      })
      .catch(() => {
        inFlight.current.delete(upper)
      })

    return id
  }, [])

  const latestByTicker = useMemo(() => {
    const byTicker: Record<string, AnalysisRun> = {}
    for (const run of Object.values(runs)) {
      const current = byTicker[run.ticker]
      if (!current || run.startedAt >= current.startedAt) byTicker[run.ticker] = run
    }
    return byTicker
  }, [runs])

  const activeCount = useMemo(
    () => Object.values(runs).filter((run) => isActive(run)).length,
    [runs],
  )

  const value = useMemo<AnalysisValue>(
    () => ({
      runs,
      latestByTicker,
      activeCount,
      start,
      getRun: (id: string) => runs[id],
      isRunning: (ticker: string) => isActive(latestByTicker[ticker.toUpperCase()]),
    }),
    [runs, latestByTicker, activeCount, start],
  )

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>
}

export function useAnalysis(): AnalysisValue {
  const context = useContext(AnalysisContext)
  if (!context) throw new Error('useAnalysis debe usarse dentro de AnalysisProvider')
  return context
}
