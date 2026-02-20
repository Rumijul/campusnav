import type { NavGraph } from '@shared/types'
import { useEffect, useState } from 'react'

type GraphState =
  | { status: 'loading' }
  | { status: 'loaded'; data: NavGraph }
  | { status: 'error'; message: string }

const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 1000

async function fetchWithRetry(signal: AbortSignal): Promise<NavGraph> {
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch('/api/map', { signal })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return (await response.json()) as NavGraph
    } catch (err) {
      if (signal.aborted) throw err // Don't retry on cancellation
      lastError = err
      if (attempt < MAX_ATTEMPTS) {
        // Wait before retrying — simple fixed delay
        await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
      }
    }
  }
  throw lastError
}

export function useGraphData(): GraphState {
  const [state, setState] = useState<GraphState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    fetchWithRetry(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: 'loaded', data })
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted)
          setState({ status: 'error', message: String(err) })
      })

    return () => {
      controller.abort()
    }
  }, [])

  return state
}
