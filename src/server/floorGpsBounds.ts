import type { NavFloorGpsBounds } from '@shared/types'

export interface FloorGpsBoundsColumns {
  gpsMinLat: number | null
  gpsMaxLat: number | null
  gpsMinLng: number | null
  gpsMaxLng: number | null
}

function isFiniteNumber(value: number | null): value is number {
  return value !== null && Number.isFinite(value)
}

/**
 * Converts nullable DB floor GPS columns into a complete GPS bounds object.
 * Returns null when any value is missing (or non-finite), ensuring callers never
 * serialize partial coordinate tuples.
 */
export function toNavFloorGpsBounds(row: FloorGpsBoundsColumns): NavFloorGpsBounds | null {
  if (
    !isFiniteNumber(row.gpsMinLat)
    || !isFiniteNumber(row.gpsMaxLat)
    || !isFiniteNumber(row.gpsMinLng)
    || !isFiniteNumber(row.gpsMaxLng)
  ) {
    return null
  }

  return {
    minLat: row.gpsMinLat,
    maxLat: row.gpsMaxLat,
    minLng: row.gpsMinLng,
    maxLng: row.gpsMaxLng,
  }
}

export function serializeFloorGpsBounds(row: FloorGpsBoundsColumns): { gpsBounds?: NavFloorGpsBounds } {
  const gpsBounds = toNavFloorGpsBounds(row)
  return gpsBounds ? { gpsBounds } : {}
}
