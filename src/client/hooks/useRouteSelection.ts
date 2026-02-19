import type { NavNode } from '@shared/types'
import { useCallback, useMemo, useState } from 'react'

/* ──────────────── Types ──────────────── */

export interface RouteSelection {
  start: NavNode | null
  destination: NavNode | null
  activeField: 'start' | 'destination'
  bothSelected: boolean
  setStart: (node: NavNode | null) => void
  setDestination: (node: NavNode | null) => void
  setFromTap: (node: NavNode) => void
  swap: () => void
  clearStart: () => void
  clearDestination: () => void
  clearAll: () => void
}

/* ──────────────── Hook ──────────────── */

/**
 * Manages route selection state — start (A) and destination (B) nodes.
 *
 * `setFromTap` assigns a tapped node to whichever field `activeField` points to,
 * auto-advancing to the other field afterward. If the tapped node is already the
 * OTHER field, it swaps them instead of duplicating.
 */
export function useRouteSelection(): RouteSelection {
  const [start, setStartState] = useState<NavNode | null>(null)
  const [destination, setDestinationState] = useState<NavNode | null>(null)
  const [activeField, setActiveField] = useState<'start' | 'destination'>('start')

  const setStart = useCallback((node: NavNode | null) => {
    setStartState(node)
    setActiveField('destination')
  }, [])

  const setDestination = useCallback((node: NavNode | null) => {
    setDestinationState(node)
    setActiveField('start')
  }, [])

  const setFromTap = useCallback(
    (node: NavNode) => {
      if (activeField === 'start') {
        // If tapped node is already the destination, swap
        if (destination?.id === node.id) {
          setDestinationState(start)
          setStartState(node)
          setActiveField('destination')
        } else {
          setStartState(node)
          setActiveField('destination')
        }
      } else {
        // activeField === 'destination'
        // If tapped node is already the start, swap
        if (start?.id === node.id) {
          setStartState(destination)
          setDestinationState(node)
          setActiveField('start')
        } else {
          setDestinationState(node)
          setActiveField('start')
        }
      }
    },
    [activeField, start, destination],
  )

  const swap = useCallback(() => {
    if (start === null && destination === null) return
    const prevStart = start
    const prevDest = destination
    setStartState(prevDest)
    setDestinationState(prevStart)
  }, [start, destination])

  const clearStart = useCallback(() => {
    setStartState(null)
    setActiveField('start')
  }, [])

  const clearDestination = useCallback(() => {
    setDestinationState(null)
    setActiveField('destination')
  }, [])

  const clearAll = useCallback(() => {
    setStartState(null)
    setDestinationState(null)
    setActiveField('start')
  }, [])

  const bothSelected = useMemo(() => start !== null && destination !== null, [start, destination])

  return {
    start,
    destination,
    activeField,
    bothSelected,
    setStart,
    setDestination,
    setFromTap,
    swap,
    clearStart,
    clearDestination,
    clearAll,
  }
}
