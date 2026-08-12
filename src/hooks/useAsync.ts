import { useEffect, useState } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Envuelve una llamada a la capa de servicios y expone loading/error.
 * Ignora respuestas de peticiones obsoletas cuando cambian las dependencias.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })

  useEffect(() => {
    let active = true
    setState((previous) => ({ ...previous, loading: true, error: null }))

    loader()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (!active) return
        const message = error instanceof Error ? error.message : 'No se pudo cargar la información'
        setState({ data: null, loading: false, error: message })
      })

    return () => {
      active = false
    }
    // El loader se recrea en cada render; las deps explícitas son el contrato.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
