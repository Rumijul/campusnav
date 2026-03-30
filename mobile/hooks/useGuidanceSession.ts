/**
 * Guidance session orchestrator — wires useRouteSession, useCurrentPosition,
 * and the guidance state machine into a live guidance loop.
 *
 * Responsibilities:
 * - Subscribes to GPS + heading via useCurrentPosition
 * - Projects lat/lng → normalized map coords → nearest walkable node
 * - Drives phase transitions (idle → guiding → rerouting → arrived)
 * - Advances currentStepIndex as the user progresses
 * - Triggers reroute via MobilePathfindingEngine when off-route
 * - Exposes manual confirmPosition() for user-asserted location
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  projectLatLngToNormalizedPoint,
  snapLatLngToNearestWalkableNode,
} from '../../src/shared/gps';
import type {
  DirectionsResult,
  NormalizedNavGraph,
  PathResult,
} from '../domain/navGraph';
import {
  deriveConfidence,
  isOffRoute,
  shouldAdvanceStep,
} from '../routing/guidanceState';
import type {
  ConfidenceLevel,
  GuidancePhase,
  GuidanceState,
  HeadingFix,
  PositionFix,
} from '../routing/guidanceState';
import { MobilePathfindingEngine } from '../routing/pathfindingEngine';
import type { RouteSessionReadyState } from '../routing/routeSessionState';
import { useCurrentPosition } from './useCurrentPosition';
import type {
  HeadingData,
  PositionFix as HookPositionFix,
} from './useCurrentPosition';

// ============================================================
// Props
// ============================================================

export interface UseGuidanceSessionProps {
  /** Normalized navigation graph (from useRouteSelection). */
  graph: NormalizedNavGraph;
  /** Ready route from useRouteSession (S02). Must have phase === 'ready'. */
  route: RouteSessionReadyState;
  /** Minimum ms between position updates. Default: 2000. */
  updateIntervalMs?: number;
  /** Off-route threshold in normalized map units. Default: 0.05. */
  offRouteThreshold?: number;
  /** Consecutive off-route fixes needed before reroute. Default: 2. */
  rerouteConfirmFixes?: number;
  /** Minimum ms between reroute triggers. Default: 5000. */
  rerouteCooldownMs?: number;
  /** Max accuracy (m) for confident GPS fix. Default: 50. */
  maxAccuracyMeters?: number;
}

// ============================================================
// Result
// ============================================================

export interface UseGuidanceSessionResult {
  /** Live guidance state snapshot (use for React rendering). */
  guidanceState: GuidanceState;
  /**
   * Begin live guidance from the current GPS position.
   * Snaps to the nearest walkable node and transitions phase.
   */
  startGuidance: () => void;
  /** Halt live guidance and return to idle. */
  stopGuidance: () => void;
  /**
   * User asserts their location by tapping a node on the map.
   * Resets offRouteFixCount and re-derives confidence.
   */
  confirmPosition: (nodeId: string) => void;
}

// ============================================================
// Pure helpers (extracted for testability)
// ============================================================

/** Convert useCurrentPosition fix → guidance state PositionFix */
export function hookFixToStateFix(fix: HookPositionFix | null): PositionFix {
  if (!fix) {
    return { isConfident: false, accuracyMeters: null };
  }
  return {
    isConfident: fix.accuracyMeters != null && isFinite(fix.accuracyMeters),
    accuracyMeters: fix.accuracyMeters,
  };
}

/** Convert useCurrentPosition heading → guidance state HeadingFix */
export function hookHeadingToStateHeading(
  heading: HeadingData | null,
): HeadingFix {
  if (!heading) {
    return { headingDegrees: null, accuracyDegrees: null };
  }
  return {
    headingDegrees: heading.headingDegrees,
    accuracyDegrees: heading.accuracyDegrees,
  };
}

// ============================================================
// Hook implementation
// ============================================================

/**
 * Guidance session hook.
 *
 * Subscribes to GPS + heading, drives phase transitions, and exposes
 * startGuidance / stopGuidance / confirmPosition for UI control.
 */
export function useGuidanceSession({
  graph,
  route,
  updateIntervalMs = 2000,
  offRouteThreshold = 0.05,
  rerouteConfirmFixes = 2,
  rerouteCooldownMs = 5000,
  maxAccuracyMeters = 50,
}: UseGuidanceSessionProps): UseGuidanceSessionResult {
  // ── Guidance state ───────────────────────────────────────────────────────
  //
  // guidanceStateRef: updated on every position fix without triggering
  // re-renders. Isolates high-frequency position updates from React's
  // render cycle.
  const guidanceStateRef = useRef<GuidanceState>({
    phase: 'idle',
    route,
    currentStepIndex: 0,
    snappedPosition: { x: 0, y: 0 },
    snappedNodeId: '',
    heading: null,
    headingConfidence: null,
    positionConfidence: 'none',
    lastFixTimestamp: 0,
    offRouteDetectedAt: null,
    offRouteFixCount: 0,
    rerouteResult: null,
    currentFloorId: null,
  });

  // guidanceState: React state snapshot — updated after each position
  // processing pass so components can subscribe and re-render.
  const [guidanceState, setGuidanceState] = useState<GuidanceState>(
    guidanceStateRef.current,
  );

  // ── Floor transition tracking ─────────────────────────────────────────────
  // Tracks the previous floor ID to detect crossings and emit observability log.
  const previousFloorIdRef = useRef<number | null>(null);

  // ── GPS + heading subscription ──────────────────────────────────────────
  const { position: hookPosition, heading: hookHeading } = useCurrentPosition({
    updateIntervalMs,
    maxAccuracyMeters,
  });

  // ── Callback ref for position processing ─────────────────────────────────
  //
  // Uses a ref callback so we can call the same processing logic
  // from multiple useEffect entry points without stale closures.
  const processPositionRef = useRef<((fix: HookPositionFix | null) => void) | null>(
    null,
  );

  // ── On position update ───────────────────────────────────────────────────
  useEffect(() => {
    const fix = hookPosition;
    processPositionRef.current?.(fix);
  }, [hookPosition]);

  // ── Build the mutable guidance state machine (runs on every fix) ─────────
  //
  // This function is assigned to processPositionRef.current inside a
  // useEffect with the correct closure. We declare it here for clarity.
  function processFix(fix: HookPositionFix | null): void {
    const state = guidanceStateRef.current;

    // Skip processing when guidance is not active.
    if (state.phase === 'idle') return;
    if (state.phase === 'arrived') return;

    // Cannot process without a snapped node.
    if (!state.snappedNodeId) {
      setGuidanceState({ ...state, positionConfidence: 'none' });
      return;
    }

    // ── Project + snap ────────────────────────────────────────────────────
    // Find floor bounds for the current snapped node.
    const snappedRecord = graph.nodeById.get(state.snappedNodeId);
    const floorBounds = snappedRecord
      ? graph.floorById.get(snappedRecord.floorId)?.floor.gpsBounds ?? null
      : null;
    const currentFloorId = snappedRecord ? snappedRecord.floorId : null;

    // ── Floor transition detection ────────────────────────────────────────
    if (currentFloorId !== previousFloorIdRef.current && currentFloorId !== null && previousFloorIdRef.current !== null) {
      console.log('[Guidance] floor-transition', { from: previousFloorIdRef.current, to: currentFloorId });
    }
    if (currentFloorId !== null) {
      previousFloorIdRef.current = currentFloorId;
    }

    let snappedPosition = state.snappedPosition;
    let snappedNodeId = state.snappedNodeId;

    if (fix && floorBounds) {
      const projected = projectLatLngToNormalizedPoint(
        fix.latitude,
        fix.longitude,
        floorBounds,
      );

      if (projected) {
        snappedPosition = projected;
        const snapResult = snapLatLngToNearestWalkableNode(
          fix.latitude,
          fix.longitude,
          floorBounds,
          Array.from(graph.nodeById.values()).map(r => r.node),
          Array.from(graph.edgeById.values()).map(r => r.edge),
        );

        if (snapResult) {
          snappedNodeId = snapResult.node.id;
        }
      }
    }

    // ── Derive confidence ─────────────────────────────────────────────────
    const positionFix: PositionFix = hookFixToStateFix(fix);
    const headingFix: HeadingFix = hookHeadingToStateHeading(hookHeading);
    const confidence: ConfidenceLevel = deriveConfidence(positionFix, headingFix);

    const isConfident = confidence === 'high' || confidence === 'medium';

    // ── Mutable state machine (runs synchronously) ─────────────────────────
    let currentPhase: GuidancePhase = state.phase;
    let currentStepIndex = state.currentStepIndex;
    let offRouteFixCount = state.offRouteFixCount;
    let offRouteDetectedAt = state.offRouteDetectedAt;
    let rerouteResult: PathResult | null = state.rerouteResult;

    if (!isConfident) {
      // Low-confidence: pause advancement, stay in low-confidence.
      currentPhase = 'low-confidence';
    } else {
      // Confident: check geometry.
      const offRoute = isOffRoute(
        snappedPosition,
        currentStepIndex,
        state.route.path,
        state.route,
        offRouteThreshold,
      );

      if (offRoute) {
        // Accumulate off-route fix count.
        if (offRouteFixCount === 0) {
          offRouteDetectedAt = Date.now();
        }
        offRouteFixCount += 1;

        // Trigger reroute only after enough consecutive fixes AND cooldown elapsed.
        const cooldownElapsed =
          offRouteDetectedAt === null ||
          Date.now() - offRouteDetectedAt >= rerouteCooldownMs;

        if (offRouteFixCount >= rerouteConfirmFixes && cooldownElapsed) {
          currentPhase = 'rerouting';
        }
      } else {
        // On route: reset counter.
        offRouteFixCount = 0;
        offRouteDetectedAt = null;

        // Check for step advancement.
        const advance = shouldAdvanceStep(
          snappedPosition,
          currentStepIndex,
          state.route.path,
          state.route,
        );

        if (advance) {
          currentStepIndex += 1;
        }

        // Check for arrival.
        if (currentStepIndex >= state.route.path.nodeIds.length) {
          currentPhase = 'arrived';
        } else {
          currentPhase = 'guiding';
        }
      }
    }

    // ── Commit state update ───────────────────────────────────────────────
    const newState: GuidanceState = {
      ...state,
      phase: currentPhase,
      currentStepIndex,
      snappedPosition,
      snappedNodeId,
      heading: hookHeading?.headingDegrees ?? null,
      headingConfidence: hookHeading?.accuracyDegrees ?? null,
      positionConfidence: confidence,
      lastFixTimestamp: fix?.timestamp ?? Date.now(),
      offRouteFixCount,
      offRouteDetectedAt,
      rerouteResult,
      currentFloorId,
    };

    guidanceStateRef.current = newState;
    setGuidanceState(newState);
  }

  // ── Mount processing callback ref ──────────────────────────────────────────
  //
  // Must be inside useEffect so all ref captures (graph, route, thresholds)
  // are stable across renders.
  useEffect(() => {
    processPositionRef.current = processFix;
  });

  // ── Reroute: called when phase transitions to 'rerouting' ───────────────
  useEffect(() => {
    if (guidanceStateRef.current.phase !== 'rerouting') return;

    const state = guidanceStateRef.current;
    const engine = new MobilePathfindingEngine(graph);

    const newPath = engine.findRoute(
      state.snappedNodeId,
      state.route.destination!.id,
      state.route.routeMode,
    );

    if (newPath.found) {
      const newDirections = recomputeDirections(newPath, state.route, graph);
      const newState: GuidanceState = {
        ...state,
        phase: 'guiding',
        route: {
          ...state.route,
          path: newPath,
          directions: newDirections,
        } as RouteSessionReadyState,
        offRouteFixCount: 0,
        offRouteDetectedAt: null,
        currentStepIndex: 0,
      };
      guidanceStateRef.current = newState;
      setGuidanceState(newState);
    } else {
      // No path from current position — user must manually pick a new destination.
      const newState: GuidanceState = {
        ...state,
        phase: 'low-confidence',
        offRouteFixCount: 0,
        offRouteDetectedAt: null,
      };
      guidanceStateRef.current = newState;
      setGuidanceState(newState);
    }
  }, [guidanceState.phase, graph]);

  // ── startGuidance ────────────────────────────────────────────────────────
  const startGuidance = useCallback(() => {
    // Find floor bounds for the snapped node's floor.
    const snappedRecord = graph.nodeById.get(guidanceStateRef.current.snappedNodeId);
    const floorBounds = snappedRecord
      ? graph.floorById.get(snappedRecord.floorId)?.floor.gpsBounds ?? null
      : null;
    const currentFloorId = snappedRecord ? snappedRecord.floorId : null;

    let snappedNodeId = guidanceStateRef.current.snappedNodeId;
    let snappedPosition = guidanceStateRef.current.snappedPosition;

    const fix = hookPosition;
    if (fix && floorBounds) {
      const projected = projectLatLngToNormalizedPoint(
        fix.latitude,
        fix.longitude,
        floorBounds,
      );
      if (projected) {
        snappedPosition = projected;
        const snapResult = snapLatLngToNearestWalkableNode(
          fix.latitude,
          fix.longitude,
          floorBounds,
          Array.from(graph.nodeById.values()).map(r => r.node),
          Array.from(graph.edgeById.values()).map(r => r.edge),
        );
        if (snapResult) {
          snappedNodeId = snapResult.node.id;
        }
      }
    }

    const positionFix: PositionFix = hookFixToStateFix(fix);
    const headingFix: HeadingFix = hookHeadingToStateHeading(hookHeading);
    const confidence = deriveConfidence(positionFix, headingFix);
    const isConfident = confidence === 'high' || confidence === 'medium';

    const phase: GuidancePhase = isConfident ? 'guiding' : 'low-confidence';

    // Update previousFloorIdRef when starting guidance so first transition fires correctly.
    if (currentFloorId !== null) {
      previousFloorIdRef.current = currentFloorId;
    }

    const newState: GuidanceState = {
      ...guidanceStateRef.current,
      phase,
      currentStepIndex: 0,
      snappedPosition,
      snappedNodeId,
      heading: hookHeading?.headingDegrees ?? null,
      headingConfidence: hookHeading?.accuracyDegrees ?? null,
      positionConfidence: confidence,
      lastFixTimestamp: fix?.timestamp ?? Date.now(),
      offRouteFixCount: 0,
      offRouteDetectedAt: null,
      rerouteResult: null,
      currentFloorId,
    };

    guidanceStateRef.current = newState;
    setGuidanceState(newState);
    console.log('[Guidance] guidance-started', { phase, snappedNodeId });
  }, [graph, hookPosition, hookHeading]);

  // ── stopGuidance ─────────────────────────────────────────────────────────
  const stopGuidance = useCallback(() => {
    const newState: GuidanceState = {
      ...guidanceStateRef.current,
      phase: 'idle',
      snappedPosition: { x: 0, y: 0 },
      snappedNodeId: '',
      heading: null,
      headingConfidence: null,
      positionConfidence: 'none',
      lastFixTimestamp: 0,
      offRouteDetectedAt: null,
      offRouteFixCount: 0,
      rerouteResult: null,
      currentFloorId: null,
    };

    guidanceStateRef.current = newState;
    setGuidanceState(newState);
    console.log('[Guidance] guidance-stopped');
  }, []);

  // ── confirmPosition ──────────────────────────────────────────────────────
  const confirmPosition = useCallback(
    (nodeId: string) => {
      const nodeRecord = graph.nodeById.get(nodeId);
      if (!nodeRecord || !route.destination) return;

      const floorBounds =
        graph.floorById.get(nodeRecord.floorId)?.floor.gpsBounds ?? null;
      const currentFloorId = nodeRecord.floorId;

      let snappedPosition = guidanceStateRef.current.snappedPosition;
      if (floorBounds) {
        snappedPosition = { x: nodeRecord.node.x, y: nodeRecord.node.y };
      }

      const positionFix: PositionFix = hookFixToStateFix(hookPosition);
      const headingFix: HeadingFix = hookHeadingToStateHeading(hookHeading);
      const confidence = deriveConfidence(positionFix, headingFix);
      const isConfident = confidence === 'high' || confidence === 'medium';

      const phase: GuidancePhase = isConfident ? 'guiding' : 'low-confidence';

      const newState: GuidanceState = {
        ...guidanceStateRef.current,
        phase,
        snappedPosition,
        snappedNodeId: nodeId,
        positionConfidence: confidence,
        offRouteFixCount: 0,
        offRouteDetectedAt: null,
        currentFloorId,
      };

      guidanceStateRef.current = newState;
      setGuidanceState(newState);
    },
    [graph, route.destination, hookPosition, hookHeading],
  );

  return {
    guidanceState,
    startGuidance,
    stopGuidance,
    confirmPosition,
  };
}

// ============================================================
// Private helpers
// ============================================================

/**
 * Recompute directions after a reroute.
 * Mirrors the logic in computeRouteSession but without re-running A*.
 */
function recomputeDirections(
  path: PathResult,
  route: RouteSessionReadyState,
  graph: NormalizedNavGraph,
): DirectionsResult {
  // Import here to avoid circular dependency at module level.
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const { generateDirections } = require('../routing/generateDirections') as {
    generateDirections: (nodeIds: string[], nodeMap: Map<string, import('../../src/shared/types').NavNode>, mode: import('../domain/navGraph').RouteMode, floorMap: Map<number, import('../../src/shared/types').NavFloor>) => DirectionsResult;
  };

  const nodeMap = new Map<string, import('../../src/shared/types').NavNode>();
  for (const [id, record] of graph.nodeById) {
    nodeMap.set(id, record.node);
  }

  const floorMap = new Map<number, import('../../src/shared/types').NavFloor>();
  for (const [id, record] of graph.floorById) {
    floorMap.set(id, record.floor);
  }

  return generateDirections(
    path.nodeIds,
    nodeMap,
    route.routeMode,
    floorMap,
  );
}
