/**
 * Pathfinding result and route mode type definitions.
 *
 * Consumed by the pathfinding engine (Plan 02) and downstream phases
 * (Phase 6: route visualization, turn-by-turn directions).
 */

/**
 * Route computation mode — determines which edge weights and filtering to use.
 * - `standard`: Uses `standardWeight`, no edge blocking
 * - `accessible`: Uses `accessibleWeight`, blocks non-accessible edges
 */
export type RouteMode = 'standard' | 'accessible'

/**
 * A single edge in a computed path, representing one step in the route.
 * Used by Phase 6 for step-by-step direction generation.
 */
export interface PathSegment {
  /** Source node ID for this segment */
  fromId: string
  /** Target node ID for this segment */
  toId: string
  /** Edge weight (distance) for this segment */
  distance: number
}

/**
 * Complete result of a route computation.
 *
 * "No route found" is expressed as a result object, not an error:
 * `{ found: false, nodeIds: [], totalDistance: 0, segments: [] }`
 */
export interface PathResult {
  /** Whether a valid route was found between the two nodes */
  found: boolean
  /** Ordered node IDs from source to destination (empty if not found) */
  nodeIds: string[]
  /** Sum of edge weights along the path (0 if not found) */
  totalDistance: number
  /** Per-edge breakdown of the path (empty if not found) */
  segments: PathSegment[]
}
