'use client'
import { useState, useCallback } from 'react'

interface UseApiState<T> {
  data: T | null
  error: string | null
  loading: boolean
}

interface UseApiReturn<T, A extends unknown[]> extends UseApiState<T> {
  execute: (...args: A) => Promise<T | null>
}

export function useApi<T, A extends unknown[]>(
  fn: (...args: A) => Promise<T>
): UseApiReturn<T, A> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    loading: false,
  })

  const execute = useCallback(
    async (...args: A): Promise<T | null> => {
      setState({ data: null, error: null, loading: true })
      try {
        const data = await fn(...args)
        setState({ data, error: null, loading: false })
        return data
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Error inesperado'
        setState({ data: null, error: msg, loading: false })
        return null
      }
    },
    [fn]
  )

  return { ...state, execute }
}
