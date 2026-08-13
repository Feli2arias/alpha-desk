import type { MarketIndex } from '@/types'

/**
 * Respaldo de los índices para cuando el proveedor no responde.
 * Van marcados como simulados: la UI lo muestra y no los presenta como reales.
 */
export const INDEX_SEEDS: readonly MarketIndex[] = [
  { symbol: 'SPX', name: 'S&P 500', value: 6842.31, change: 28.44, changePercent: 0.42, proxy: false, source: 'simulated' },
  { symbol: 'NDX', name: 'Nasdaq 100', value: 25_318.77, change: 186.92, changePercent: 0.74, proxy: false, source: 'simulated' },
  { symbol: 'COMP', name: 'Nasdaq Composite', value: 22_104.16, change: 152.38, changePercent: 0.69, proxy: false, source: 'simulated' },
  { symbol: 'DJI', name: 'Dow Jones', value: 47_204.16, change: -92.38, changePercent: -0.2, proxy: false, source: 'simulated' },
]

/** Watchlist con la que arranca la sesión. */
export const DEFAULT_WATCHLIST: readonly string[] = ['NVDA', 'MSFT', 'META', 'AMD', 'PLTR', 'AVGO']
