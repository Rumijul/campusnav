/**
 * Route session state machine — pure computation, no React dependencies.
 *
 * Coordinates pathfinding (T01 engine) and direction generation (T01)
 * into a single discriminated union state that drives the UI.
 */

import { NavNode } from '../../src/shared/types';
import {
  DirectionsResult,
  NormalizedNavGraph,
  PathResult,
  RouteMode,
} from '../domain/navGraph';
import { MobilePathfindingEngine } from './pathfindingEngine';
import { generateDirections } from './generateDirections';

// ============================================================
// Phase types
// ============================================================

export RouteSessionPhase =
  | 'idle'
  | 'computing'
  | 'ready'
  | 'no-route'
  | 'error';

// ============================================================
// Discriminated union state types
// ============================================================

export interface RouteSessionIdleState {
  readonly phase: 'idle';
  readonly start: NavNode | null;
  readonly destination: NavNode | null;
  readonly routeMode: RouteMode;
  readonly path: null;
  readonly directions: null;
  readonly errorMessage: null;
}

export interface RouteSessionComputingState {
  readonly phase: 'computing';
  readonly start: NavNode | null;
  readonly destination: NavNode | null;
  readonly routeMode: RouteMode;
  readonly path: null;
  readonly directions: null;
  readonly errorMessage: null;
}

export interface RouteSessionReadyState {
  readonly phase: 'ready';
  readonly start: NavNode | null;
  readonly destination: NavNode | null;
  readonly routeMode: RouteMode;
  readonly path: PathResult;
  readonly directions: DirectionsResult;
  readonly errorMessage: null;
}

export interface RouteSessionNoRouteState {
  readonly phase: 'no-route';
  readonly start: NavNode | null;
  readonly destination: NavNode | null;
  readonly routeMode: RouteMode;
  readonly path: null;
  readonly directions: null;
  readonly errorMessage: null;
}

export interface RouteSessionErrorState {
  readonly phase: 'error';
  readonly start: NavNode | null;
  readonly destination: NavNode | null;
  readonly routeMode: RouteMode;
  readonly path: null;
  readonly directions: null;
  readonly errorMessage: string;
}

/**
 * Discriminated union of all route session states.
 *
 * Discriminant key: `phase`
 *
 * Phase meanings:
 * - `idle`:    No start/destination yet
 * - `computing`: Currently computing (sync, so only an intermediate phase)
 * - `ready`:  Route found — path and directions available
 * - `no-route`: Start & dest selected but no path exists
 * - `error`:  Node not present in graph or other error
 */
export RouteSessionState =
  | RouteSessionIdleState
  | RouteSessionComputingState
  | RouteSessionReadyState
  | RouteSessionNoRouteState
  | RouteSessionErrorState;

// ============================================================
// Options
// ============================================================

export interface RouteSessionOptions {
  readonly graph: NormalizedNavGraph;
  readonly mode: RouteMode;
  readonly start: NavNode | null;
  readonly destination: NavNode | null;
}

// ============================================================
// Private helpers
// ============================================================

/**
 * Compute directions from a found path result.
 * Uses nodeMap and floorMap from the normalized graph.
 */
function computeDirections(
  path: PathResult,
  mode: RouteMode,
  graph: NormalizedNavGraph,
): DirectionsResult {
  // Extract plain NavNode objects from normalized records
  const nodeMap = new Map<string, NavNode>();
  for (const [id, record] of graph.nodeById) {
    nodeMap.set(id, record.node);
  }

  // Extract plain NavFloor objects from normalized records
  const floorMap = new Map<number, import('../../src/shared/types').NavFloor>();
  for (const [id, record] of graph.floorById) {
    floorMap.set(id, record.floor);
  }

  return generateDirections(
    path.nodeIds,
    nodeMap,
    mode,
    floorMap,
  );
}

// ============================================================
// Main computation function
// ============================================================

/**
 * Compute a route session state synchronously.
 *
 * A* is fast enough that no async boundary is needed.
 * The 'computing' phase is included for UI tooling (DevTools)
 * and to make the phase model complete.
 *
 * Transitions:
 * - start === null || destination === null → 'idle'
 * - start/dest valid but not in graph         → 'error'
 * - start/dest in graph, no path found        → 'no-route'
 * - start/dest in graph, path found           → 'ready'
 */
export function computeRouteSession(options: RouteSessionOptions): RouteSessionState {
  const { graph, mode, start, destination } = options;

  // Guard: missing input
  if (start === null || destination === null) {
    return {
      phase: 'idle',
      start,
      destination,
      routeMode: mode,
      path: null,
      directions: null,
      errorMessage: null,
    };
  }

  // Guard: nodes not in graph
  if (!graph.nodeById.has(start.id) || !graph.nodeById.has(destination.id)) {
    return {
      phase: 'error',
      start,
      destination,
      routeMode: mode,
      path: null,
      directions: null,
      errorMessage: 'One or both selected nodes are not present in the navigation graph.',
    };
  }

  // Guard: start === destination
  if (start.id === destination.id) {
    return {
      phase: 'idle',
      start,
      destination,
      routeMode: mode,
      path: null,
      directions: null,
      errorMessage: null,
    };
  }

  // Compute path
  const engine = new MobilePathfindingEngine(graph);
  const path = engine.findRoute(start.id, destination.id, mode);

  if (!path.found) {
    return {
      phase: 'no-route',
      start,
      destination,
      routeMode: mode,
      path: null,
      directions: null,
      errorMessage: null,
    };
  }

  // Compute directions
  const directions = computeDirections(path, mode, graph);

  return {
    phase: 'ready',
    start,
    destination,
    routeMode: mode,
    path,
    directions,
    errorMessage: null,
  };
}
