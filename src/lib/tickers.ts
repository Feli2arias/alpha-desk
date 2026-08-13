import { COMPANY_SEEDS } from '@/data/companies'

/**
 * Resolución de "lenguaje natural → ticker".
 *
 * El usuario escribe "revisá nvidia", no "revisá NVDA". Este módulo traduce.
 * Cuando exista un backend, esto se reemplaza por una búsqueda contra el
 * catálogo real de instrumentos y la firma no cambia.
 */

/** Alias escritos a mano — nombres coloquiales que no salen del nombre legal. */
const MANUAL_ALIASES: Readonly<Record<string, string>> = {
  nvidia: 'NVDA',
  nvidea: 'NVDA',
  envidia: 'NVDA',
  microsoft: 'MSFT',
  meta: 'META',
  facebook: 'META',
  amazon: 'AMZN',
  google: 'GOOGL',
  alphabet: 'GOOGL',
  palantir: 'PLTR',
  apple: 'AAPL',
  manzana: 'AAPL',
  netflix: 'NFLX',
  tesla: 'TSLA',
  broadcom: 'AVGO',
  coinbase: 'COIN',
  jpmorgan: 'JPM',
  morgan: 'JPM',
  uber: 'UBER',
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Índice completo alias → ticker, construido una sola vez. */
const ALIAS_INDEX: ReadonlyMap<string, string> = (() => {
  const index = new Map<string, string>(Object.entries(MANUAL_ALIASES))

  for (const seed of COMPANY_SEEDS) {
    index.set(normalizeText(seed.ticker), seed.ticker)
    // Primera palabra del nombre legal: "Broadcom Inc." → "broadcom"
    const firstWord = normalizeText(seed.name).split(/[\s,.]+/)[0]
    if (firstWord.length >= 3 && !index.has(firstWord)) index.set(firstWord, seed.ticker)
  }

  return index
})()

/** Todos los tickers del universo, para autocompletado y validación. */
export const UNIVERSE_TICKERS: readonly string[] = COMPANY_SEEDS.map((seed) => seed.ticker)

export function isKnownTicker(value: string): boolean {
  return ALIAS_INDEX.get(normalizeText(value.trim())) !== undefined
}

/** Devuelve el ticker canónico de un texto suelto, o null. */
export function resolveTicker(value: string): string | null {
  return ALIAS_INDEX.get(normalizeText(value.trim())) ?? null
}

/**
 * Busca la primera acción mencionada en una frase.
 * Recorre palabra por palabra para no confundir "meta" dentro de "metálico".
 */
export function findTickerInText(text: string): string | null {
  const words = normalizeText(text).split(/[^a-z0-9]+/).filter(Boolean)

  for (const word of words) {
    const ticker = ALIAS_INDEX.get(word)
    if (ticker) return ticker
  }

  return null
}

/** Palabras que indican "corré el pipeline sobre esta acción". */
const ANALYZE_KEYWORDS: readonly string[] = [
  'revisa',
  'revisar',
  'revise',
  'analiza',
  'analizar',
  'analisis',
  'estudia',
  'estudiar',
  'evalua',
  'evaluar',
  'mira',
  'mirar',
  'chequea',
  'chequear',
  'fijate',
  'veredicto',
  'que opinas',
  'que pensas',
  'que te parece',
  'conviene',
  'vale la pena',
  'corre el pipeline',
]

/**
 * ¿El mensaje pide un análisis completo (y no una charla)?
 * Devuelve el ticker a analizar o null.
 */
export function detectAnalysisRequest(text: string): string | null {
  const normalized = normalizeText(text)
  const ticker = findTickerInText(text)
  if (!ticker) return null

  const asksForAnalysis = ANALYZE_KEYWORDS.some((keyword) => normalized.includes(keyword))
  if (asksForAnalysis) return ticker

  // "NVDA" o "nvidia" a secas también se interpreta como pedido de análisis.
  const words = normalized.split(/[^a-z0-9]+/).filter(Boolean)
  return words.length <= 2 ? ticker : null
}
