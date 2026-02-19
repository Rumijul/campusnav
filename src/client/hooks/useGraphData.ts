import type { NavGraph } from '@shared/types'
import { useEffect, useState } from 'react'

type GraphState =
  | { status: 'loading' }
  | { status: 'loaded'; data: NavGraph }
  | { status: 'error'; message: string }

export function useGraphData(): GraphState {
  const [state, setState] = useState<GraphState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetch('/api/map')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<NavGraph>
      })
      .then((data) => {
        if (!cancelled) setState({ status: 'loaded', data })
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ status: 'error', message: String(err) })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
