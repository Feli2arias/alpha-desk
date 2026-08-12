import { useEffect, useState } from 'react'
import type { MarketIndex, Quote } from '@/types'
import { marketDataService } from '@/services/marketDataService'

/** Intervalo entre ticks simulados. Con datos reales, esto lo reemplaza un WebSocket. */
const TICK_MS = 3000

let tickerHandle: ReturnType<typeof setInterval> | null = null
let subscriberCount = 0

/** Un solo intervalo global para toda la app, sin importar cuántos componentes escuchen. */
function useMarketTicker(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return

    subscriberCount += 1
    if (!tickerHandle) {
      tickerHandle = setInterval(() => marketDataService.tick(), TICK_MS)
    }

    return () => {
      subscriberCount -= 1
      if (subscriberCount === 0 && tickerHandle) {
        clearInterval(tickerHandle)
        tickerHandle = null
      }
    }
  }, [enabled])
}

/** Cotizaciones que se refrescan con cada tick del mercado. */
export function useLiveQuotes(tickers: readonly string[], enabled = true): Quote[] {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const key = tickers.join(',')

  useMarketTicker(enabled && tickers.length > 0)

  useEffect(() => {
    if (tickers.length === 0) {
      setQuotes([])
      return
    }

    let active = true
    const load = () => {
      marketDataService.getQuotes(tickers).then((next) => {
        if (active) setQuotes(next)
      })
    }

    load()
    const unsubscribe = enabled ? marketDataService.subscribe(load) : () => {}

    return () => {
      active = false
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])

  return quotes
}

export function useLiveIndices(enabled = true): MarketIndex[] {
  const [indices, setIndices] = useState<MarketIndex[]>([])

  useMarketTicker(enabled)

  useEffect(() => {
    let active = true
    const load = () => {
      marketDataService.getIndices().then((next) => {
        if (active) setIndices(next)
      })
    }

    load()
    const unsubscribe = enabled ? marketDataService.subscribe(load) : () => {}

    return () => {
      active = false
      unsubscribe()
    }
  }, [enabled])

  return indices
}
