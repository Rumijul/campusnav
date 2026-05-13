/**
 * Guidance state machine — pure computation, no React dependencies.
 *
 * Core types and helper functions for confidence-gated turn-by-turn navigation.
 * Drives the live guidance UI overlay and reroute logic.
 */

import { DirectionStep, NormalizedNodeRecord } from '../domain/navGraph';
import { PathResult } from '../domain/navGraph';
import { RouteSessionReadyState } from './routeSessionState';
import { NormalizedPoint } from '../../src/shared/gps';

// ============================================================
// Core types
// ============================================================

/**
 * GPS and heading confidence classification.
 *
 * Used by `deriveConfidence` to determine how aggressively
 * the guidance engine trusts the current position fix.
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none';
export const ConfidenceLevel = undefined as unknown as ConfidenceLevel;

/**
 * Phase of the guidance state machine.
 *
 * State transitions are governed by `deriveNextPhase`:
 * - `idle`          → Initial state; no route loaded
 * - `low-confidence` → Route loaded, but GPS/heading signal is weak
 * - `guiding`       → Route active with confident position; advancing steps
 * - `rerouting`     → Off-route detected, computing new path
 * - `arrived`        → User has reached the destination
 */
export type GuidancePhase =
  | 'idle'
  | 'low-confidence'
  | 'guiding'
  | 'rerouting'
  | 'arrived';
export const GuidancePhase = undefined as unknown as GuidancePhase;

/**
 * Core guidance state for live navigation.
 *
 * Carries the route, current position, and confidence signals needed
 * to drive step advancement and reroute decisions.
 */
export interface GuidanceState {
  phase: GuidancePhase;
  /** The route being followed — must be in 'ready' phase. */
  route: RouteSessionReadyState;
  /** Index of the active DirectionStep (0-based). */
  currentStepIndex: number;
  /** User's current position in normalized [0,1] map space. */
  snappedPosition: NormalizedPoint;
  /** Nearest walkable node ID to the snapped position. */
  snappedNodeId: string;
  /** Device compass heading in degrees (0–360), null if unavailable. */
  heading: number | null;
  /** Heading accuracy in degrees, null if unavailable. */
  headingConfidence: number | null;
  /** Classification of current position fix quality. */
  positionConfidence: ConfidenceLevel;
  /** Unix timestamp (ms) of the last position fix. */
  lastFixTimestamp: number;
  /** Unix timestamp (ms) when off-route was first detected, null if on-route. */
  offRouteDetectedAt: number | null;
  /** Consecutive fixes where off-route was detected. */
  offRouteFixCount: number;
  /** Result of the last reroute computation, null if no reroute has been attempted. */
  rerouteResult: PathResult | null;
  /** Floor ID of the current snapped node, null if not on any floor. */
  currentFloorId: number | null;
}

// ============================================================
// Helper function input types
// ============================================================

export interface PositionFix {
  readonly isConfident: boolean;
  readonly accuracyMeters: number | null;
}

export interface HeadingFix {
  readonly headingDegrees: number | null;
  readonly accuracyDegrees: number | null;
}

// ============================================================
// Pure helper functions
// ============================================================

/**
 * Derive the GPS/heading confidence level from position and heading fixes.
 *
 * Confidence levels:
 * - `high`:   GPS fix is confident AND heading accuracy ≤ 15°
 * - `medium`: GPS fix is confident but heading is missing or unreliable (> 15°)
 * - `low`:    GPS fix not confident but finite (accuracy exists)
 * - `none`:   No GPS fix or infinite accuracy
 */
export function deriveConfidence(
  positionFix: PositionFix,
  headingFix: HeadingFix,
): ConfidenceLevel {
  // none: no GPS fix (null) or infinite accuracy
  if (positionFix.accuracyMeters == null || !Number.isFinite(positionFix.accuracyMeters)) {
    return 'none';
  }

  // low: GPS fix not confident but finite (accuracy exists but > threshold)
  if (!positionFix.isConfident) {
    return 'low';
  }

  // medium: GPS confident but heading missing or unreliable
  if (
    headingFix.headingDegrees == null
    || headingFix.accuracyDegrees == null
    || !Number.isFinite(headingFix.accuracyDegrees)
    || headingFix.accuracyDegrees > 15
  ) {
    return 'medium';
  }

  // high: GPS confident AND heading reliable (≤ 15°)
  return 'high';
}

// ============================================================
// Private helpers
// ============================================================

/**
 * Build an ordered coordinate lookup from a path and its route state.
 * Looks for a nodeById map on the path (production) or falls back to
 * extracting coordinates directly from the node IDs using route.path.nodeById.
 *
 * The path may carry nodeById as an extended property (production path),
 * or the coordinates are resolved via route.path.nodeById (test path).
 */
function buildCoordLookup(
  path: PathResult,
  route: RouteSessionReadyState,
): Map<number, { x: number; y: number }> {
  const coords = new Map<number, { x: number; y: number }>();

  // Try path.nodeById first (production extension pattern)
  const pathAsExtended = path as PathResult & { nodeById?: Map<string, NormalizedNodeRecord> };
  if (pathAsExtended.nodeById && typeof pathAsExtended.nodeById.get === 'function') {
    const nodeById = pathAsExtended.nodeById;
    for (let i = 0; i < path.nodeIds.length; i++) {
      const record = nodeById.get(path.nodeIds[i]);
      if (record) {
        coords.set(i, { x: record.node.x, y: record.node.y });
      }
    }
    return coords;
  }

  // Fallback: resolve via route.path.nodeById (test / production NormalizedNavGraph pattern)
  const routePathAsGraph = route.path as PathResult & { nodeById?: Map<string, NormalizedNodeRecord> };
  const nodeById = routePathAsGraph.nodeById;
  if (nodeById && typeof nodeById.get === 'function') {
    for (let i = 0; i < path.nodeIds.length; i++) {
      const record = nodeById.get(path.nodeIds[i]);
      if (record) {
        coords.set(i, { x: record.node.x, y: record.node.y });
      }
    }
  }

  return coords;
}

/**
 * Compute perpendicular (orthogonal) distance from a point to a line segment.
 *
 * Returns the minimum distance from `point` to any point on the segment
 * between `segStart` and `segEnd`.
 *
 * Uses the standard point-to-segment formula:
 * Let t = dot(P - segStart, segEnd - segStart) / |segEnd - segStart|²
 * Clamp t to [0, 1] (to stay on the segment)
 * Closest point = segStart + t * (segEnd - segStart)
 * Distance = |P - closest_point|
 */
function pointToSegmentDistance(
  point: NormalizedPoint,
  segStart: { x: number; y: number },
  segEnd: { x: number; y: number },
): number {
  const dx = segEnd.x - segStart.x;
  const dy = segEnd.y - segStart.y;
  const lenSq = dx * dx + dy * dy;

  // Degenerate segment (start === end): return distance to the point
  if (lenSq === 0) {
    return Math.sqrt((point.x - segStart.x) ** 2 + (point.y - segStart.y) ** 2);
  }

  // Parameter t for the projection of P onto the segment line
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lenSq,
    ),
  );

  const closestX = segStart.x + t * dx;
  const closestY = segStart.y + t * dy;

  return Math.sqrt((point.x - closestX) ** 2 + (point.y - closestY) ** 2);
}

// ============================================================
// Public route-geometry helpers
// ============================================================

/**
 * Returns true when the user's position is off the active route segment.
 *
 * Detects deviation by measuring perpendicular distance from the current
 * position to the current path segment (from path.nodeIds[currentStepIndex]
 * to path.nodeIds[currentStepIndex + 1]).
 *
 * @param position     User's current snapped position
 * @param currentStepIndex  Which step in the route is active
 * @param path         The current route path
 * @param route        The route session state (provides normalized graph nodeById)
 * @param threshold    Deviation threshold in normalized units (default: 0.05)
 */
export function isOffRoute(
  position: NormalizedPoint,
  currentStepIndex: number,
  path: PathResult,
  route: RouteSessionReadyState,
  threshold = 0.05,
): boolean {
  if (!path.found || path.nodeIds.length < 2) return false;

  const coords = buildCoordLookup(path, route);

  // When at or beyond the last segment, use distance to the final node
  if (currentStepIndex >= path.nodeIds.length - 1) {
    const lastNode = coords.get(path.nodeIds.length - 1);
    if (!lastNode) return false;

    const dist = Math.sqrt(
      (position.x - lastNode.x) ** 2 + (position.y - lastNode.y) ** 2,
    );
    return dist > threshold;
  }

  const startNode = coords.get(currentStepIndex);
  const endNode = coords.get(currentStepIndex + 1);
  if (!startNode || !endNode) return false;

  const distance = pointToSegmentDistance(position, startNode, endNode);
  return distance > threshold;
}

/**
 * Returns true when the user has reached the waypoint at the start of the next step.
 *
 * Uses the same perpendicular-distance approach as `isOffRoute` but with a
 * smaller threshold so that near-passing doesn't trigger an advance mid-segment.
 *
 * @param position        User's current snapped position
 * @param currentStepIndex  Index of the current step (advance check goes to step + 1)
 * @param path            The current route path
 * @param route           The route session state (provides normalized graph nodeById)
 * @param advanceThreshold  Proximity threshold for triggering advance (default: 0.03)
 */
export function shouldAdvanceStep(
  position: NormalizedPoint,
  currentStepIndex: number,
  path: PathResult,
  route: RouteSessionReadyState,
  advanceThreshold = 0.03,
): boolean {
  if (!path.found || path.nodeIds.length < 2) return false;

  const coords = buildCoordLookup(path, route);

  // If the next step index is beyond the node list, use the last node
  const nextStepIdx = currentStepIndex + 1;
  if (nextStepIdx >= path.nodeIds.length) {
    const lastNode = coords.get(path.nodeIds.length - 1);
    if (!lastNode) return false;
    return (
      Math.sqrt(
        (position.x - lastNode.x) ** 2 + (position.y - lastNode.y) ** 2,
      ) <= advanceThreshold
    );
  }

  const startNode = coords.get(currentStepIndex);
  const endNode = coords.get(nextStepIdx);
  if (!startNode || !endNode) return false;

  const distance = pointToSegmentDistance(position, startNode, endNode);
  return distance <= advanceThreshold;
}

/**
 * Derive the next phase from current state and signals.
 *
 * Phase transition rules:
 * - `idle`          → `isConfident` ? 'guiding' : 'low-confidence'
 * - `low-confidence` → `isConfident` ? 'guiding' : stay 'low-confidence'
 * - `guiding`       → `hasArrived` ? 'arrived'
 *                    → `offRouteFixCount >= rerouteConfirmFixes` ? 'rerouting'
 *                    → stay 'guiding'
 * - `rerouting`     → always transitions to 'guiding' (assumes reroute succeeded)
 * - `arrived`       → stays 'arrived'
 *
 * @param state                  Current guidance state
 * @param isConfident            Whether current position is high or medium confidence
 * @param hasArrived             Whether the user has arrived at the destination
 * @param offRouteFixCount       Number of consecutive off-route position fixes
 * @param rerouteConfirmFixes    Fixes required before triggering reroute (default: 3)
 */
export function deriveNextPhase(
  state: GuidanceState,
  isConfident: boolean,
  hasArrived: boolean,
  offRouteFixCount: number,
  rerouteConfirmFixes = 3,
): GuidancePhase {
  switch (state.phase) {
    case 'idle':
      return isConfident ? 'guiding' : 'low-confidence';

    case 'low-confidence':
      return isConfident ? 'guiding' : 'low-confidence';

    case 'guiding':
      if (hasArrived) return 'arrived';
      if (offRouteFixCount >= rerouteConfirmFixes) return 'rerouting';
      return 'guiding';

    case 'rerouting':
      // Assumes the caller has set rerouteResult; transitions back to guiding
      return 'guiding';

    case 'arrived':
      return 'arrived';
  }
}

/**
 * Return the active DirectionStep for the current step index.
 *
 * Returns null when there is no active route, no directions have been generated,
 * or the current step index is out of bounds.
 */
export function getActiveStep(state: GuidanceState): DirectionStep | null {
  const { route, currentStepIndex } = state;
  if (route.phase !== 'ready') return null;
  if (!route.directions) return null;
  const { steps } = route.directions;
  if (currentStepIndex < 0 || currentStepIndex >= steps.length) return null;
  return steps[currentStepIndex] ?? null;
}

/**
 * Derive floor context from a GuidanceState snapshot.
 *
 * Returns the floorId of the current snapped node, or null when
 * the user is not on any floor (idle or no snapped node).
 */
export function deriveFloorContext(state: GuidanceState): number | null {
  return state.currentFloorId ?? null;
}