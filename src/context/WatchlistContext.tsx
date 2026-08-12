import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_WATCHLIST } from '@/data/indices'

interface WatchlistValue {
  tickers: readonly string[]
  add: (ticker: string) => void
  remove: (ticker: string) => void
  has: (ticker: string) => boolean
}

const WatchlistContext = createContext<WatchlistValue | null>(null)

/** Persistencia en memoria durante la sesión — alcanza para el mockup. */
export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [tickers, setTickers] = useState<readonly string[]>(DEFAULT_WATCHLIST)

  const add = useCallback((ticker: string) => {
    const upper = ticker.trim().toUpperCase()
    if (!upper) return
    setTickers((previous) => (previous.includes(upper) ? previous : [...previous, upper]))
  }, [])

  const remove = useCallback((ticker: string) => {
    setTickers((previous) => previous.filter((item) => item !== ticker))
  }, [])

  const value = useMemo<WatchlistValue>(
    () => ({ tickers, add, remove, has: (ticker) => tickers.includes(ticker) }),
    [tickers, add, remove],
  )

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
}

export function useWatchlist(): WatchlistValue {
  const context = useContext(WatchlistContext)
  if (!context) throw new Error('useWatchlist debe usarse dentro de WatchlistProvider')
  return context
}
