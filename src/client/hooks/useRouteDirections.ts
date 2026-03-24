import type { PathResult } from '@shared/pathfinding/types'
import type { NavFloor, NavNode } from '@shared/types'
import { useMemo } from 'react'

// ============================================================
// Types
// ============================================================

export type StepIcon =
  | 'straight'
  | 'turn-left'
  | 'turn-right'
  | 'sharp-left'
  | 'sharp-right'
  | 'arrive'
  | 'accessible'
  | 'stairs-up'
  | 'stairs-down'
  | 'elevator'
  | 'ramp'

export interface DirectionStep {
  /** Human-readable instruction, e.g. "Turn left at the cafeteria" */
  instruction: string
  icon: StepIcon
  /** Segment distance in normalized units (0–1 coordinate space) */
  distanceM: number
  /** Estimated seconds for this segment */
  durationSec: number
  /** True if this segment passes through a ramp or elevator node */
  isAccessibleSegment: boolean
  /** Floor ID where this instruction is presented */
  floorId: number
  /** Resolved floor number for display/grouping; falls back to floorId when metadata is missing */
  floorNumber: number
}

export interface DirectionsResult {
  steps: DirectionStep[]
  /** Sum of all segment distances in normalized units */
  totalDistanceNorm: number
  /** Sum of all step durations in seconds */
  totalDurationSec: number
}

// ============================================================
// Constants
// ============================================================

const WALKING_SPEED_STANDARD = 0.023 // normalized units/s
const WALKING_SPEED_ACCESSIBLE = 0.013 // normalized units/s

/** Node types that are visible/searchable destinations — eligible for landmark references */
const LANDMARK_TYPES = new Set(['room', 'landmark', 'entrance', 'elevator', 'restroom'])

// ============================================================
// Private helpers
// ============================================================

/**
 * Compute compass bearing in degrees (0–360) from point A to point B.
 * Uses screen-space convention: x increases right, y increases down.
 * atan2(dx, -dy) gives a bearing where 0°=north, 90°=east, 180°=south, 270°=west.
 */
function bearing(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  // atan2(x, -y) → clockwise from north in screen-space
  const rad = Math.atan2(dx, -dy)
  const deg = (rad * 180) / Math.PI
  return (deg + 360) % 360
}

/**
 * Normalize an angle difference to the range [-180, 180].
 */
function normalizeDelta(delta: number): number {
  let d = delta % 360
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return d
}

/**
 * Euclidean distance between two normalized coordinate points.
 */
function euclideanDist(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Resolve a floor number from floor metadata, falling back to floorId when metadata is missing.
 */
function resolveFloorNumber(floorId: number, floorMap: Map<number, NavFloor>): number {
  return floorMap.get(floorId)?.floorNumber ?? floorId
}

/**
 * Determine vertical movement direction between two floors.
 * Uses resolved floor numbers first; if tied, falls back to floorId to keep output deterministic.
 */
function getVerticalDirection(
  fromFloorId: number,
  toFloorId: number,
  floorMap: Map<number, NavFloor>,
): 'up' | 'down' {
  const fromFloorNumber = resolveFloorNumber(fromFloorId, floorMap)
  const toFloorNumber = resolveFloorNumber(toFloorId, floorMap)

  if (toFloorNumber > fromFloorNumber) return 'up'
  if (toFloorNumber < fromFloorNumber) return 'down'

  return toFloorId >= fromFloorId ? 'up' : 'down'
}

/**
 * Classify bearing delta into a step icon.
 */
function classifyTurn(
  delta: number,
): Exclude<StepIcon, 'arrive' | 'accessible' | 'stairs-up' | 'stairs-down' | 'elevator' | 'ramp'> {
  const abs = Math.abs(delta)
  if (abs < 30) return 'straight'
  if (abs < 120) return delta > 0 ? 'turn-right' : 'turn-left'
  return delta > 0 ? 'sharp-right' : 'sharp-left'
}

/**
 * Build the instruction text for a direction step at the current (middle) node.
 * Appends " at the {label}" when the node is a searchable landmark-type.
 */
function buildInstruction(
  icon: Exclude<StepIcon, 'accessible' | 'stairs-up' | 'stairs-down' | 'elevator' | 'ramp'>,
  node: NavNode,
): string {
  const base: Record<
    Exclude<StepIcon, 'accessible' | 'stairs-up' | 'stairs-down' | 'elevator' | 'ramp'>,
    string
  > = {
    straight: 'Continue straight',
    'turn-left': 'Turn left',
    'turn-right': 'Turn right',
    'sharp-left': 'Sharp left',
    'sharp-right': 'Sharp right',
    arrive: `Arrive at ${node.label}`,
  }

  const text = base[icon]

  // For non-arrive steps: append landmark reference if the node is a visible, searchable destination
  if (icon !== 'arrive' && LANDMARK_TYPES.has(node.type) && node.searchable) {
    return `${text} at the ${node.label}`
  }

  return text
}

// ============================================================
// Core function
// ============================================================

/**
 * Convert an ordered list of node IDs into turn-by-turn walking directions.
 *
 * Algorithm:
 * - 0 or 1 nodes → empty result
 * - 2 nodes → single "arrive" step (no turn to compute)
 * - N nodes → for each triple (prev, curr, next): classify bearing delta → build step
 *             then append final "arrive" step for the last node
 */
export function generateDirections(
  nodeIds: string[],
  nodeMap: Map<string, NavNode>,
  mode: 'standard' | 'accessible',
  floorMap: Map<number, NavFloor> = new Map(),
): DirectionsResult {
  if (nodeIds.length < 2) {
    return { steps: [], totalDistanceNorm: 0, totalDurationSec: 0 }
  }

  const speed = mode === 'accessible' ? WALKING_SPEED_ACCESSIBLE : WALKING_SPEED_STANDARD
  const steps: DirectionStep[] = []
  let totalDistanceNorm = 0

  // Process intermediate nodes (all except the first and last)
  for (let i = 1; i < nodeIds.length - 1; i++) {
    // noUncheckedIndexedAccess: bounds are guaranteed by the for-loop condition
    const prevId = nodeIds[i - 1] as string
    const currId = nodeIds[i] as string
    const nextId = nodeIds[i + 1] as string

    // Nodes are guaranteed to be in the map when the caller provides valid IDs
    const prev = nodeMap.get(prevId)
    const curr = nodeMap.get(currId)
    const next = nodeMap.get(nextId)
    if (prev === undefined || curr === undefined || next === undefined) continue

    const distanceM = euclideanDist(prev.x, prev.y, curr.x, curr.y)
    const durationSec = distanceM / speed
    const currFloorNumber = resolveFloorNumber(curr.floorId, floorMap)
    const nextFloorNumber = resolveFloorNumber(next.floorId, floorMap)

    // Floor-change detection: check if curr→next crosses a floor boundary
    if (curr.floorId !== next.floorId) {
      const verticalDirection = getVerticalDirection(curr.floorId, next.floorId, floorMap)

      // Determine direction icon based on connector type and vertical direction
      let icon: StepIcon
      if (curr.type === 'stairs') {
        icon = verticalDirection === 'up' ? 'stairs-up' : 'stairs-down'
      } else if (curr.type === 'elevator') {
        icon = 'elevator'
      } else if (curr.type === 'ramp') {
        icon = 'ramp'
      } else {
        // Fallback: should not occur in a well-formed graph
        icon = verticalDirection === 'up' ? 'stairs-up' : 'stairs-down'
      }

      // Determine connector type name for instruction text
      const connectorTypeName =
        curr.type === 'elevator' ? 'elevator' : curr.type === 'ramp' ? 'ramp' : 'stairs'

      const instruction = `Take the ${connectorTypeName} ${verticalDirection} to Floor ${nextFloorNumber}`
      const isAccessibleSegment = curr.type === 'elevator' || curr.type === 'ramp'

      steps.push({
        instruction,
        icon,
        distanceM,
        durationSec,
        isAccessibleSegment,
        floorId: curr.floorId,
        floorNumber: currFloorNumber,
      })
      totalDistanceNorm += distanceM
      continue
    }

    const inBearing = bearing(prev.x, prev.y, curr.x, curr.y)
    const outBearing = bearing(curr.x, curr.y, next.x, next.y)
    const delta = normalizeDelta(outBearing - inBearing)

    const icon = classifyTurn(delta)
    const instruction = buildInstruction(icon, curr)
    const isAccessibleSegment = curr.type === 'ramp' || curr.type === 'elevator'

    steps.push({
      instruction,
      icon,
      distanceM,
      durationSec,
      isAccessibleSegment,
      floorId: curr.floorId,
      floorNumber: currFloorNumber,
    })
    totalDistanceNorm += distanceM
  }

  // Final "arrive" step — distance from second-to-last to last node
  const lastPrevId = nodeIds[nodeIds.length - 2] as string
  const lastId = nodeIds[nodeIds.length - 1] as string
  const lastPrev = nodeMap.get(lastPrevId)
  const last = nodeMap.get(lastId)
  if (lastPrev === undefined || last === undefined) {
    return { steps: [], totalDistanceNorm: 0, totalDurationSec: 0 }
  }

  const arriveDistance = euclideanDist(lastPrev.x, lastPrev.y, last.x, last.y)
  const arriveDuration = arriveDistance / speed
  const arriveInstruction = buildInstruction('arrive', last)

  steps.push({
    instruction: arriveInstruction,
    icon: 'arrive',
    distanceM: arriveDistance,
    durationSec: arriveDuration,
    isAccessibleSegment: last.type === 'ramp' || last.type === 'elevator',
    floorId: last.floorId,
    floorNumber: resolveFloorNumber(last.floorId, floorMap),
  })

  totalDistanceNorm += arriveDistance
  const totalDurationSec = steps.reduce((sum, s) => sum + s.durationSec, 0)

  return { steps, totalDistanceNorm, totalDurationSec }
}

// ============================================================
// routesAreIdentical utility
// ============================================================

/**
 * Returns true only if both routes were found and share the exact same ordered node IDs.
 */
export function routesAreIdentical(a: PathResult, b: PathResult): boolean {
  if (!a.found || !b.found) return false
  if (a.nodeIds.length !== b.nodeIds.length) return false
  return a.nodeIds.every((id, i) => id === b.nodeIds[i])
}

// ============================================================
// Hook
// ============================================================

/**
 * Memoized hook that converts a PathResult into turn-by-turn walking directions.
 *
 * Returns an empty result when:
 * - pathResult is null
 * - pathResult.found is false
 * - pathResult has fewer than 2 nodeIds
 */
export function useRouteDirections(
  pathResult: PathResult | null,
  nodeMap: Map<string, NavNode>,
  mode: 'standard' | 'accessible',
  floorMap?: Map<number, NavFloor>,
): DirectionsResult {
  return useMemo(() => {
    if (pathResult === null || !pathResult.found) {
      return { steps: [], totalDistanceNorm: 0, totalDurationSec: 0 }
    }
    return generateDirections(pathResult.nodeIds, nodeMap, mode, floorMap)
  }, [pathResult, nodeMap, mode, floorMap])
}
