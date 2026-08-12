/**
 * Modelos de dominio compartidos por toda la app.
 * La capa de servicios devuelve SIEMPRE estos tipos, sin importar si detrás
 * hay mocks (hoy) o una API real (mañana). Los componentes solo conocen esto.
 */

export type Signal = 'strong_buy' | 'buy' | 'hold'
export type Sentiment = 'positive' | 'neutral' | 'negative'
export type MetricVerdict = 'bullish' | 'neutral' | 'bearish'
export type Timeframe = '1D' | '1W' | '1M' | '6M' | '1Y'
export type AgentRole = 'research' | 'decision'
export type PipelineStage = 'idle' | 'running' | 'done' | 'error'

/** Identidad de una empresa. No cambia con el mercado. */
export interface Company {
  ticker: string
  name: string
  sector: string
  /** Color de marca usado en el avatar y los charts. */
  brandColor: string
}

/** Precio en un instante. Es lo que muta cuando el mercado "se mueve". */
export interface Quote {
  ticker: string
  price: number
  change: number
  changePercent: number
  dayHigh: number
  dayLow: number
  volume: number
  marketCap: number
  updatedAt: string
}

/** Punto de una serie temporal. `open/high/low` son opcionales para líneas. */
export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketIndex {
  symbol: string
  name: string
  value: number
  change: number
  changePercent: number
}

/** Una métrica evaluada por el Research Agent. */
export interface Metric {
  key: string
  label: string
  value: string
  /** Referencia contra la que se compara (media del sector, histórico, etc.). */
  benchmark: string
  verdict: MetricVerdict
  note: string
}

export interface NewsItem {
  id: string
  ticker: string
  headline: string
  source: string
  publishedAt: string
  summary: string
  sentiment: Sentiment
  /** Relevancia asignada por el Research Agent, 0–100. */
  relevance: number
}

/** Tesis completa del Decision Agent para una acción. */
export interface Thesis {
  headline: string
  /** Párrafos de razonamiento, en orden de lectura. */
  paragraphs: string[]
  catalysts: string[]
  risks: string[]
  targetPrice: number
  stopLoss: number
  horizon: string
  conviction: string
}

/** Una de las 10 elecciones del día. */
export interface Pick {
  rank: number
  company: Company
  signal: Signal
  /** Score de confianza del Decision Agent, 0–100. */
  score: number
  thesis: Thesis
  metrics: Metric[]
  /** Serie corta para el sparkline de la card (30 cierres). */
  sparkline: number[]
  allocationPercent: number
}

export interface AgentRun {
  id: string
  startedAt: string
  finishedAt: string
  /** Etapas en orden de ejecución. */
  stages: AgentStage[]
  logs: RunLogEntry[]
  universeSize: number
  survivorsAfterFilters: number
  newsProcessed: number
  tokensUsed: number
  costUsd: number
}

export interface AgentStage {
  role: AgentRole
  label: string
  model: string
  status: PipelineStage
  durationMs: number
  summary: string
  outputs: { label: string; value: string }[]
}

export interface RunLogEntry {
  at: string
  role: AgentRole | 'system'
  message: string
  level: 'info' | 'success' | 'warn'
}

export type ChatRole = 'user' | 'agent'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  /** Ticker si el mensaje pertenece a un chat contextual de una acción. */
  ticker?: string
}

/** Contexto que se le pasa al chatService. Mañana se convierte en el system prompt. */
export interface ChatContext {
  scope: 'global' | 'stock'
  ticker?: string
}
