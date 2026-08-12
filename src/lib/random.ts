/**
 * PRNG determinista (mulberry32). Sembrado con el ticker, garantiza que la
 * misma acción genere siempre la misma serie histórica entre recargas —
 * los mocks se ven estables, no aleatorios en cada render.
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seedFromString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Ruido gaussiano aproximado (Box-Muller) para que el random walk no se vea uniforme. */
export function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-9)
  const v = Math.max(rng(), 1e-9)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}
