import type { AgentRole } from '@/types'

/**
 * Guion del análisis on-demand: qué pasos ejecuta cada agente y cuánto tarda.
 *
 * Cuando el pipeline sea real, este archivo se reemplaza por los eventos que
 * emita el orquestador (SSE / WebSocket). La forma de cada paso no cambia.
 */
export interface PlanStep {
  id: string
  role: AgentRole
  label: string
  /** Duración simulada del paso, en ms. */
  durationMs: number
}

export const RESEARCH_MODEL = 'Research Agent · modelo rápido'
export const DECISION_MODEL = 'Decision Agent · razonamiento profundo'

export const ANALYSIS_PLAN: readonly PlanStep[] = [
  { id: 'identify', role: 'research', label: 'Ubicando la acción en el universo', durationMs: 700 },
  { id: 'prices', role: 'research', label: 'Descargando precios y midiendo momentum', durationMs: 1100 },
  { id: 'fundamentals', role: 'research', label: 'Leyendo fundamentals de los últimos 8 trimestres', durationMs: 1400 },
  { id: 'news', role: 'research', label: 'Barriendo noticias de las últimas 48 horas', durationMs: 1500 },
  { id: 'peers', role: 'research', label: 'Comparando contra los comparables del sector', durationMs: 1100 },
  { id: 'handoff', role: 'research', label: 'Entregando el paquete al Decision Agent', durationMs: 650 },
  { id: 'mandate', role: 'decision', label: 'Contrastando contra el mandato del portafolio', durationMs: 1200 },
  { id: 'scenarios', role: 'decision', label: 'Construyendo escenarios alcista, base y bajista', durationMs: 1600 },
  { id: 'invalidation', role: 'decision', label: 'Buscando el punto donde la tesis se invalida', durationMs: 1300 },
  { id: 'verdict', role: 'decision', label: 'Redactando el veredicto', durationMs: 1800 },
]

/** Etiquetas de los sectores para el texto de comparables. */
export const PEER_COUNT_BY_SECTOR: Readonly<Record<string, number>> = {
  Semiconductores: 8,
  Software: 11,
  'Publicidad digital': 6,
  'E-commerce / Cloud': 7,
  'Publicidad digital / Cloud': 6,
  'Software / Defensa': 9,
  'Hardware de consumo': 5,
  Streaming: 4,
  'Automotriz / Energía': 7,
  'Fintech / Cripto': 6,
  Banca: 12,
  Movilidad: 5,
}
