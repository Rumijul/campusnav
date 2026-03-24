import { calculateWeight } from '@shared/pathfinding/graph-builder'
import type { NavEdge, NavFloorGpsBounds, NavNode } from '@shared/types'

/** Default confidence threshold for student-facing GPS rendering. */
export const DEFAULT_MAX_GPS_ACCURACY_METERS = 50

/**
 * Tiny tolerance used to make nearest-node tie handling deterministic.
 * Distances within this epsilon are treated as equivalent and resolved by node ID.
 */
const DISTANCE_TIE_EPSILON = 1e-9

/** Mean Earth radius in meters (IUGG). */
const EARTH_RADIUS_METERS = 6371008.8

export interface NormalizedPoint {
  /** Normalized X coordinate (0 = left edge, 1 = right edge). */
  x: number
  /** Normalized Y coordinate (0 = top edge, 1 = bottom edge). */
  y: number
}

export interface NearestWalkableNodeMatch {
  /** Selected nearest walkable node. */
  node: NavNode
  /** Euclidean distance in normalized map units. */
  distance: number
}

export interface SnapGpsToNodeResult extends NearestWalkableNodeMatch {
  /** Projected normalized point derived from the GPS fix. */
  projectedPoint: NormalizedPoint
}

/**
 * Returns true when floor bounds represent a valid rectangle in GPS space.
 */
export function isGpsBoundsCalibrated(
  bounds: NavFloorGpsBounds | null | undefined,
): bounds is NavFloorGpsBounds {
  if (bounds == null) return false

  return (
    isFiniteNumber(bounds.minLat)
    && isFiniteNumber(bounds.maxLat)
    && isFiniteNumber(bounds.minLng)
    && isFiniteNumber(bounds.maxLng)
    && bounds.minLat < bounds.maxLat
    && bounds.minLng < bounds.maxLng
  )
}

/**
 * Checks whether a latitude/longitude pair is inside configured floor GPS bounds.
 * Bounds are inclusive on every edge.
 */
export function isLatLngWithinBounds(
  latitude: number,
  longitude: number,
  bounds: NavFloorGpsBounds | null | undefined,
): boolean {
  if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) return false
  if (!isGpsBoundsCalibrated(bounds)) return false

  return (
    latitude >= bounds.minLat
    && latitude <= bounds.maxLat
    && longitude >= bounds.minLng
    && longitude <= bounds.maxLng
  )
}

/**
 * Projects a GPS coordinate to normalized floor-map coordinates.
 *
 * Projection details:
 * - X grows left → right as longitude grows minLng → maxLng.
 * - Y grows top → bottom, so latitude is inverted (maxLat maps to y=0).
 *
 * Returns null when bounds are missing/invalid or the coordinate is out of bounds.
 */
export function projectLatLngToNormalizedPoint(
  latitude: number,
  longitude: number,
  bounds: NavFloorGpsBounds | null | undefined,
): NormalizedPoint | null {
  if (!isLatLngWithinBounds(latitude, longitude, bounds)) return null

  const lngSpan = bounds.maxLng - bounds.minLng
  const latSpan = bounds.maxLat - bounds.minLat

  if (lngSpan <= 0 || latSpan <= 0) return null

  const x = (longitude - bounds.minLng) / lngSpan
  const y = (bounds.maxLat - latitude) / latSpan

  const projected = { x, y }
  return isNormalizedPointInBounds(projected) ? projected : null
}

/**
 * Confidence gate for GPS fixes.
 *
 * Returns true only when the reported accuracy is finite, non-negative, and no
 * worse than `maxAccuracyMeters` (default: 50m).
 */
export function isGpsFixConfident(
  accuracyMeters: number,
  maxAccuracyMeters = DEFAULT_MAX_GPS_ACCURACY_METERS,
): boolean {
  return (
    isFiniteNumber(accuracyMeters)
    && isFiniteNumber(maxAccuracyMeters)
    && accuracyMeters >= 0
    && maxAccuracyMeters >= 0
    && accuracyMeters <= maxAccuracyMeters
  )
}

/**
 * Converts geolocation accuracy in meters to a marker ring radius in map pixels.
 *
 * Uses calibrated floor GPS bounds to estimate horizontal/vertical meter scales,
 * converts both to pixels, and returns their mean so ring size remains stable
 * across non-square maps.
 */
export function accuracyMetersToMapPixelRadius(
  accuracyMeters: number,
  bounds: NavFloorGpsBounds | null | undefined,
  mapWidthPx: number,
  mapHeightPx: number,
): number {
  if (!isFiniteNumber(accuracyMeters) || accuracyMeters <= 0) return 0
  if (!isFiniteNumber(mapWidthPx) || mapWidthPx <= 0) return 0
  if (!isFiniteNumber(mapHeightPx) || mapHeightPx <= 0) return 0

  const floorScale = deriveFloorScaleMeters(bounds)
  if (floorScale == null) return 0

  const xPixels = (accuracyMeters / floorScale.widthMeters) * mapWidthPx
  const yPixels = (accuracyMeters / floorScale.heightMeters) * mapHeightPx

  if (!isFiniteNumber(xPixels) || !isFiniteNumber(yPixels)) return 0

  return (xPixels + yPixels) / 2
}

/**
 * Finds the nearest walkable node to a normalized point.
 *
 * Candidate nodes are constrained to IDs that participate in at least one
 * floor-scoped edge with a finite standard weight, which keeps snapping aligned
 * with graph connectivity.
 */
export function findNearestWalkableNode(
  point: NormalizedPoint,
  nodes: readonly NavNode[],
  edges: readonly NavEdge[],
): NearestWalkableNodeMatch | null {
  if (!isNormalizedPointInBounds(point)) return null

  const walkableNodeIds = deriveWalkableNodeIds(nodes, edges)
  if (walkableNodeIds.size === 0) return null

  let bestMatch: NearestWalkableNodeMatch | null = null

  for (const node of nodes) {
    if (!walkableNodeIds.has(node.id)) continue

    const distance = calculateWeight(point.x, point.y, node.x, node.y)

    if (bestMatch == null) {
      bestMatch = { node, distance }
      continue
    }

    if (distance < bestMatch.distance - DISTANCE_TIE_EPSILON) {
      bestMatch = { node, distance }
      continue
    }

    if (
      Math.abs(distance - bestMatch.distance) <= DISTANCE_TIE_EPSILON
      && node.id.localeCompare(bestMatch.node.id) < 0
    ) {
      bestMatch = { node, distance }
    }
  }

  return bestMatch
}

/**
 * Convenience helper: projects GPS to normalized map space and snaps it to the
 * nearest walkable node on the floor.
 */
export function snapLatLngToNearestWalkableNode(
  latitude: number,
  longitude: number,
  bounds: NavFloorGpsBounds | null | undefined,
  nodes: readonly NavNode[],
  edges: readonly NavEdge[],
): SnapGpsToNodeResult | null {
  const projectedPoint = projectLatLngToNormalizedPoint(latitude, longitude, bounds)
  if (projectedPoint == null) return null

  const nearest = findNearestWalkableNode(projectedPoint, nodes, edges)
  if (nearest == null) return null

  return {
    ...nearest,
    projectedPoint,
  }
}

/**
 * Determines whether a normalized point is inside map bounds [0,1] x [0,1].
 */
export function isNormalizedPointInBounds(point: NormalizedPoint): boolean {
  return (
    isFiniteNumber(point.x)
    && isFiniteNumber(point.y)
    && point.x >= 0
    && point.x <= 1
    && point.y >= 0
    && point.y <= 1
  )
}

function deriveWalkableNodeIds(nodes: readonly NavNode[], edges: readonly NavEdge[]): Set<string> {
  const knownNodeIds = new Set(nodes.map((node) => node.id))
  const walkable = new Set<string>()

  for (const edge of edges) {
    if (!isFiniteNumber(edge.standardWeight)) continue

    if (knownNodeIds.has(edge.sourceId)) walkable.add(edge.sourceId)
    if (knownNodeIds.has(edge.targetId)) walkable.add(edge.targetId)
  }

  return walkable
}

function deriveFloorScaleMeters(
  bounds: NavFloorGpsBounds | null | undefined,
): { widthMeters: number; heightMeters: number } | null {
  if (!isGpsBoundsCalibrated(bounds)) return null

  const midLat = (bounds.minLat + bounds.maxLat) / 2
  const midLng = (bounds.minLng + bounds.maxLng) / 2

  const widthMeters = haversineDistanceMeters(midLat, bounds.minLng, midLat, bounds.maxLng)
  const heightMeters = haversineDistanceMeters(bounds.minLat, midLng, bounds.maxLat, midLng)

  if (!isFiniteNumber(widthMeters) || widthMeters <= 0) return null
  if (!isFiniteNumber(heightMeters) || heightMeters <= 0) return null

  return { widthMeters, heightMeters }
}

function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const lat1Rad = degreesToRadians(lat1)
  const lat2Rad = degreesToRadians(lat2)
  const dLat = degreesToRadians(lat2 - lat1)
  const dLng = degreesToRadians(lng2 - lng1)

  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)

  const a =
    sinDLat * sinDLat
    + Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinDLng * sinDLng

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_METERS * c
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
