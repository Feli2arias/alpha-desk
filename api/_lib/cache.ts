/**
 * Caché en memoria del proceso. Sobrevive entre invocaciones mientras la
 * lambda sigue caliente, así que absorbe ráfagas de pedidos iguales y evita
 * que el proveedor nos limite. El CDN cachea por encima vía `s-maxage`.
 */

interface Entry<T> {
  value: T
  expiresAt: number
}

const store = new Map<string, Entry<unknown>>()
/** Techo defensivo: sin esto una lambda muy caliente crecería sin límite. */
const MAX_ENTRIES = 300

/** Devuelve el valor cacheado o ejecuta `load` y lo cachea por `ttlMs`. */
export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const hit = store.get(key)
  if (hit && hit.expiresAt > now) return hit.value as T

  const value = await load()

  if (store.size >= MAX_ENTRIES) {
    // Barrido simple: primero los vencidos, y si no alcanza, el más viejo.
    for (const [entryKey, entry] of store) {
      if (entry.expiresAt <= now) store.delete(entryKey)
    }
    if (store.size >= MAX_ENTRIES) {
      const oldest = store.keys().next().value
      if (oldest !== undefined) store.delete(oldest)
    }
  }

  store.set(key, { value, expiresAt: now + ttlMs })
  return value
}
