import { useEffect, useMemo, useState } from 'react'
import type { MarketIndex, MarketStatus, Quote } from '@/types'
import { marketDataService } from '@/services/marketDataService'
import { currentMarketStatus, peekQuotes, subscribeQuotes } from '@/services/quoteStream'
import { getMarketStatus, pollIntervalMs } from '@/lib/marketStatus'

/**
 * Cotizaciones en vivo de un conjunto de tickers.
 * El polling y la cadencia los maneja `quoteStream`; acá sólo se declara
 * interés y se re-renderiza cuando llegan precios nuevos.
 */
export function useLiveQuotes(tickers: readonly string[], enabled = true): Quote[] {
  const key = tickers.join(',')
  // El stream guarda la referencia del array, así que tiene que ser estable.
  const stable = useMemo(() => (key ? key.split(',') : []), [key])
  const [quotes, setQuotes] = useState<Quote[]>(() => peekQuotes(stable))

  useEffect(() => {
    if (!enabled || stable.length === 0) {
      setQuotes([])
      return
    }

    setQuotes(peekQuotes(stable))
    return subscribeQuotes(stable, () => {
      setQuotes(peekQuotes(stable))
    })
  }, [stable, enabled])

  return quotes
}

/** Estado de la sesión del mercado, refrescado en cada cambio de minuto relevante. */
export function useMarketStatus(): MarketStatus {
  const [status, setStatus] = useState<MarketStatus>(() => currentMarketStatus())

  useEffect(() => {
    const update = () => {
      setStatus(getMarketStatus())
    }
    update()
    // Un minuto alcanza: lo único que se busca es cruzar la apertura o el cierre.
    const handle = setInterval(update, 60_000)
    return () => {
      clearInterval(handle)
    }
  }, [])

  return status
}

/** Índices de referencia, con la misma cadencia que las cotizaciones. */
export function useLiveIndices(enabled = true): MarketIndex[] {
  const [indices, setIndices] = useState<MarketIndex[]>([])

  useEffect(() => {
    if (!enabled) return

    let active = true
    const load = () => {
      marketDataService.getIndices().then((next) => {
        if (active) setIndices(next)
      })
    }

    load()
    const handle = setInterval(load, pollIntervalMs(getMarketStatus().session))

    return () => {
      active = false
      clearInterval(handle)
    }
  }, [enabled])

  return indices
}
