import type { FloorPlanGeometry } from '@shared/types'
import { useCallback, useRef } from 'react'

/**
 * In-memory cache for per-floor vector geometry.
 * Geometry is fetched lazily on first view of each floor, then held for the
 * session lifetime to avoid repeat network requests.
 */
export function useFloorGeometryCache() {
  const cache = useRef<Map<number, FloorPlanGeometry>>(new Map())
  const pending = useRef<Map<number, Promise<FloorPlanGeometry>>>(new Map())

  /** Fetch geometry for a floor, using cache if available. */
  const fetchGeometry = useCallback(async (floorId: number): Promise<FloorPlanGeometry | null> => {
    // Return cached geometry immediately
    if (cache.current.has(floorId)) {
      return cache.current.get(floorId)!
    }

    // Deduplicate concurrent requests for the same floor
    if (pending.current.has(floorId)) {
      return pending.current.get(floorId)!
    }

    const promise = (async () => {
      try {
        const res = await fetch(`/api/floors/${floorId}/geometry`, { credentials: 'include' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const geometry = (await res.json()) as FloorPlanGeometry
        cache.current.set(floorId, geometry)
        return geometry
      } finally {
        pending.current.delete(floorId)
      }
    })()

    pending.current.set(floorId, promise)
    return promise
  }, [])

  /** Pre-warm the cache for a list of floor IDs (e.g. adjacent floors). */
  const prewarm = useCallback(async (floorIds: number[]): Promise<void> => {
    await Promise.all(floorIds.map((id) => fetchGeometry(id).catch(() => null)))
  }, [fetchGeometry])

  /** Check if a floor's geometry is already cached. */
  const hasGeometry = useCallback((floorId: number): boolean => {
    return cache.current.has(floorId)
  }, [])

  return { fetchGeometry, prewarm, hasGeometry }
}