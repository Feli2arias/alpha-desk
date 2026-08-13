/**
 * Modelos de dominio compartidos por toda la app.
 * La capa de servicios devuelve SIEMPRE estos tipos, sin importar si detrás
 * hay mocks (hoy) o una API real (mañana). Los componentes solo conocen esto.
 */

export type Signal = 'strong_buy' | 'buy' | 'hold'
export type Sentiment = 'positive' | 'neutral' | 'negative'
export type MetricVerdict = 'bullish' | 'neutral' | 'bearish'
export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y'
export type AgentRole = 'research' | 'decision'
export type PipelineStage = 'idle' | 'running' | 'done' | 'error'

/** Identidad de una empresa. No cambia con el mercado. */
export interface Company {
  ticker: string
  name: string
  sector: string
  /** Color de marca usado en el avatar y los charts. */
  brandColor: string
  exchange?: string
}

/** De dónde salió un dato: proveedor real o generador local de respaldo. */
export type DataSource = 'live' | 'simulated'

/**
 * Precio en un instante. Sólo cotización: los fundamentales viven en
 * `Fundamentals` porque llegan de un endpoint distinto y mucho más lento.
 */
export interface Quote {
  ticker: string
  name: string
  exchange: string
  price: number
  change: number
  changePercent: number
  /** Cierre de la rueda anterior. Es la base del % del día. */
  previousClose: number | null
  /** Precio fuera de rueda (pre-market o after-hours), si el proveedor lo informa. */
  extendedPrice: number | null
  extendedChangePercent: number | null
  /** True si el proveedor marcó el precio como tiempo real y no diferido. */
  realtime: boolean
  updatedAt: string
  source: DataSource
}

/** Fundamentales y rangos. Se piden sólo para la acción que se está mirando. */
export interface Fundamentals {
  ticker: string
  dayHigh: number | null
  dayLow: number | null
  yearHigh: number | null
  yearLow: number | null
  volume: number | null
  averageVolume: number | null
  marketCap: number | null
  peRatio: number | null
  earningsPerShare: number | null
  dividendYield: number | null
  annualizedDividend: number | null
  /** Precio objetivo a un año segun el consenso de analistas. */
  oneYearTarget: number | null
  sector: string | null
  industry: string | null
  exchange: string | null
  source: DataSource
}

/** Sesión del mercado estadounidense en este momento. */
export type MarketSession = 'pre' | 'open' | 'after' | 'closed'

export interface MarketStatus {
  session: MarketSession
  label: string
  /** True mientras haya negociación, aunque sea fuera de la rueda principal. */
  trading: boolean
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
  /** Símbolo canónico del índice, para mostrar. */
  symbol: string
  name: string
  value: number
  change: number
  changePercent: number
  /** True si el valor viene de un ETF que replica el índice, no del índice. */
  proxy: boolean
  /** Símbolo realmente consultado cuando `proxy` es true. */
  proxySymbol?: string
  source: DataSource
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
  /** Link a la nota original. Vacío en las noticias de respaldo. */
  url?: string
  /** Resumen y evaluación los agrega el Research Agent, no el proveedor. */
  summary?: string
  sentiment?: Sentiment
  /** Relevancia asignada por el Research Agent, 0–100. */
  relevance?: number
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
  /** 'analysis' hace que la burbuja se reemplace por el run en vivo. */
  kind?: ChatMessageKind
  /** Id del AnalysisRun cuando kind === 'analysis'. */
  analysisId?: string
}

/** Contexto que se le pasa al chatService. Mañana se convierte en el system prompt. */
export interface ChatContext {
  scope: 'global' | 'stock'
  ticker?: string
  mode?: ChatMode
}

/* ---------------------------------------------------------------------------
   Análisis on-demand — el usuario pide "revisá NVDA" y el pipeline corre
   para una sola acción, en vivo, delante suyo.
   --------------------------------------------------------------------------- */

export type AnalysisStatus = 'queued' | 'researching' | 'deciding' | 'done' | 'error'
export type StepStatus = 'pending' | 'running' | 'done'

/** Un paso visible del run. El usuario ve cómo se van completando. */
export interface AnalysisStep {
  id: string
  role: AgentRole
  label: string
  status: StepStatus
  /** Lo que dejó el paso al terminar. Vacío mientras está pendiente. */
  result?: string
}

/** Salida final del Decision Agent para un análisis puntual. */
export interface Verdict {
  ticker: string
  signal: Signal
  /** Convicción 0–100. */
  score: number
  headline: string
  /** Razonamiento en párrafos, en orden de lectura. */
  rationale: string[]
  catalysts: string[]
  risks: string[]
  spotPrice: number
  targetPrice: number
  stopLoss: number
  horizon: string
  conviction: string
  allocationPercent: number
  metrics: Metric[]
  newsCount: number
  /** True si la acción ya venía en el Top 10 del run diario. */
  inTopPicks: boolean
  rank?: number
}

export interface AnalysisRun {
  id: string
  ticker: string
  /** Qué etapas corrió: 'research' se detiene antes del veredicto. */
  mode: ChatMode
  companyName: string
  brandColor: string
  sector: string
  status: AnalysisStatus
  startedAt: string
  finishedAt?: string
  steps: AnalysisStep[]
  verdict: Verdict | null
  error?: string
  /** Resumen del Research Agent cuando el run se detiene antes del veredicto. */
  researchSummary?: string
  /** Modelos usados por cada etapa — se muestran en la UI del run. */
  researchModel: string
  decisionModel: string
}

/* --- Chat --- */

/** Modo del chat: quién responde. */
export type ChatMode = 'auto' | 'research' | 'decision'

/** Un mensaje puede ser texto o el render en vivo de un análisis. */
export type ChatMessageKind = 'text' | 'analysis'

export interface Conversation {
  id: string
  title: string
  createdAt: string
  messages: ChatMessage[]
  /** Acción sobre la que está enfocada la conversación, si hay alguna. */
  focusTicker?: string
}
