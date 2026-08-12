import type { MarketIndex } from '@/types'

/** Índices de referencia mostrados en Markets. Los ticks en vivo los aplica el servicio. */
export const INDEX_SEEDS: readonly MarketIndex[] = [
  { symbol: 'SPX', name: 'S&P 500', value: 6842.31, change: 28.44, changePercent: 0.42 },
  { symbol: 'NDX', name: 'Nasdaq 100', value: 25_318.77, change: 186.92, changePercent: 0.74 },
  { symbol: 'DJI', name: 'Dow Jones', value: 47_204.16, change: -92.38, changePercent: -0.2 },
  { symbol: 'VIX', name: 'VIX', value: 14.82, change: -0.61, changePercent: -3.95 },
]

/** Watchlist con la que arranca la sesión. */
export const DEFAULT_WATCHLIST: readonly string[] = ['NVDA', 'MSFT', 'META', 'AMD', 'PLTR', 'AVGO']
