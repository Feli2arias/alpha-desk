/**
 * Los proveedores devuelven números ya formateados para humanos
 * ("$225.06", "36,865,673", "+0.43%", "N/A"). Acá se convierten a number
 * una sola vez, en el borde, para que el resto del sistema nunca vea strings.
 */

/** "$1,234.56" | "+0.43%" | "N/A" -> number | null */
export function toNumber(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null
  if (typeof raw !== 'string') return null

  const cleaned = raw.replace(/[$,%\s,]/g, '').replace(/,/g, '')
  if (!cleaned || cleaned === 'N/A' || cleaned === '--') return null

  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

/** Igual que `toNumber` pero con valor por defecto, para campos no críticos. */
export function toNumberOr(raw: unknown, fallback: number): number {
  return toNumber(raw) ?? fallback
}

/** Redondeo a 2 decimales sin arrastrar error binario en la UI. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** "08/12/2026" (formato de Nasdaq) -> epoch ms en UTC. */
export function parseUsDate(raw: string): number | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw.trim())
  if (!match) return null
  const [, month, day, year] = match
  return Date.UTC(Number(year), Number(month) - 1, Number(day))
}

/**
 * Símbolos válidos: 1–8 caracteres, mayúsculas, punto o guion.
 * Se valida ANTES de interpolar en la URL del proveedor — sin esto un símbolo
 * arbitrario podría redirigir el pedido a otra ruta del upstream.
 */
const SYMBOL_PATTERN = /^[A-Z][A-Z.-]{0,7}$/

export function normalizeSymbol(raw: string | undefined): string | null {
  if (!raw) return null
  const upper = raw.trim().toUpperCase()
  return SYMBOL_PATTERN.test(upper) ? upper : null
}

/** Lista separada por comas, deduplicada y con tope de longitud. */
export function normalizeSymbolList(raw: string | undefined, max = 25): string[] {
  if (!raw) return []
  const seen = new Set<string>()
  for (const part of raw.split(',')) {
    const symbol = normalizeSymbol(part)
    if (symbol) seen.add(symbol)
    if (seen.size >= max) break
  }
  return [...seen]
}
