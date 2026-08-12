/**
 * Latencia simulada. Existe para que la UI tenga que manejar estados de carga
 * desde el día uno — cuando se conecten APIs reales, los skeletons ya están
 * probados y no hay que rehacer nada.
 */
export function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms)
  })
}

export function randomDelay(min: number, max: number): number {
  return min + Math.random() * (max - min)
}
