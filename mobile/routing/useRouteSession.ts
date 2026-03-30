/**
 * useRouteSession — React hook for reactive route session state.
 *
 * Wires together:
 * - start/destination selection (from useRouteSelection)
 * - pathfinding engine (T01 MobilePathfindingEngine)
 * - direction generation (T01 generateDirections)
 *
 * Exposes a discriminated union `sessionState` that the UI
 * can switch on without knowing implementation details.
 */

import { useCallback, useMemo, useState } from 'react';
import { NavNode } from '../../src/shared/types';
import { NormalizedNavGraph, RouteMode } from '../domain/navGraph';
import {
  type RouteSessionState,
  type RouteSessionIdleState,
  type RouteSessionReadyState, RouteSessionNoRouteState, RouteSessionErrorState,
  computeRouteSession,
} from './routeSessionState';

// ============================================================
// RouteSelection (from mobile/hooks/useRouteSelection)
// ============================================================

export interface RouteSelection {
  readonly start: NavNode | null;
  readonly destination: NavNode | null;
}

// ============================================================
// Props
// ============================================================

export interface UseRouteSessionProps {
  readonly graph: NormalizedNavGraph;
  readonly selection: RouteSelection;
}

// ============================================================
// Hook
// ============================================================

/**
 * Reactive route session.
 *
 * `sessionState` is a discriminated union keyed on `phase`:
 *   - 'idle'       → RouteSessionIdleState     (no selection yet)
 *   - 'ready'      → RouteSessionReadyState    (route found, directions ready)
 *   - 'no-route'   → RouteSessionNoRouteState  (selection complete, unreachable)
 *   - 'error'      → RouteSessionErrorState    (invalid node / graph error)
 *
 * `routeMode` tracks 'standard' | 'accessible' independently of selection.
 */
export function useRouteSession({ graph, selection }: UseRouteSessionProps): {
  sessionState: RouteSessionState;
  routeMode: RouteMode;
  setRouteMode: (mode: RouteMode) => void;
} {
  const [routeMode, setRouteModeState] = useState<RouteMode>('standard');

  const setRouteMode = useCallback((mode: RouteMode) => {
    setRouteModeState(mode);
  }, []);

  const sessionState = useMemo<RouteSessionState>(() => {
    return computeRouteSession({
      graph,
      mode: routeMode,
      start: selection.start,
      destination: selection.destination,
    });
    // Re-compute whenever any input changes
  }, [graph, routeMode, selection.start, selection.destination]);

  return { sessionState, routeMode, setRouteMode };
}

// ============================================================
// Type exports for consumers
// ============================================================

export { RouteSessionState, RouteSessionIdleState, RouteSessionReadyState, RouteSessionNoRouteState, RouteSessionErrorState };
