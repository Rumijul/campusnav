/**
 * Routing module entry point.
 *
 * Re-exports all public API from S02 (pathfinding + route session) and
 * S03 (guidance state machine) so callers can import from a single path.
 */

export { MobilePathfindingEngine } from './pathfindingEngine';
export { computeRouteSession } from './routeSessionState';
export { RouteSessionState, RouteSessionReadyState } from './routeSessionState';
export {
  deriveConfidence,
  isOffRoute,
  shouldAdvanceStep,
  deriveNextPhase,
  getActiveStep,
} from './guidanceState';
export { GuidanceState, GuidancePhase, ConfidenceLevel } from './guidanceState';
export { bearing, normalizeDelta } from '../domain/navGraph';