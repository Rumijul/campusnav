/**
 * Unit tests for guidanceState.ts — pure guidance state machine helpers.
 *
 * Tests:
 * - deriveConfidence: all four confidence levels
 * - isOffRoute: off-route detection, edge cases at path start/end
 * - shouldAdvanceStep: step advancement near waypoints
 * - deriveNextPhase: all phase transitions
 * - getActiveStep: returns correct step from state
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  ConfidenceLevel,
  GuidancePhase,
  GuidanceState,
  HeadingFix,
  PositionFix,
} from './guidanceState';
import {
  deriveConfidence,
  isOffRoute,
  shouldAdvanceStep,
  deriveNextPhase,
  getActiveStep,
} from './guidanceState';

// ============================================================
// Mock builders
// ============================================================

/** Minimal mock NavNode for test coordinate data */
function makeNode(id: string, x: number, y: number): import('../../src/shared/types').NavNode {
  return {
    id,
    x,
    y,
    label: id,
    type: 'room',
    searchable: true,
    floorId: 1,
  };
}

/** Build a NormalizedNodeRecord from a NavNode */
function makeNodeRecord(
  node: import('../../src/shared/types').NavNode,
  overrides?: Partial<import('../domain/navGraph').NormalizedNodeRecord>,
): import('../domain/navGraph').NormalizedNodeRecord {
  return {
    buildingId: 1,
    buildingName: 'Test Building',
    floorId: 1,
    floorNumber: 1,
    node,
    ...overrides,
  };
}

/** Minimal PathResult for testing */
function makePath(nodeIds: string[]): import('../domain/navGraph').PathResult {
  return {
    found: true,
    nodeIds,
    totalDistance: 0,
    segments: [],
  };
}

/** Minimal DirectionStep */
function makeStep(instruction: string, icon = 'straight' as const) {
  return {
    instruction,
    icon,
    distanceM: 0,
    durationSec: 0,
    isAccessibleSegment: false,
    floorId: 1,
    floorNumber: 1,
  };
}

/** Minimal RouteSessionReadyState */
function makeRoute(
  path: import('../domain/navGraph').PathResult,
  steps: import('../domain/navGraph').DirectionStep[],
): import('./routeSessionState').RouteSessionReadyState {
  return {
    phase: 'ready',
    start: null,
    destination: null,
    routeMode: 'standard',
    path: path as unknown as import('./routeSessionState').RouteSessionReadyState['path'],
    directions: { steps, totalDistanceNorm: 0, totalDurationSec: 0 },
    errorMessage: null,
  } as import('./routeSessionState').RouteSessionReadyState;
}

/** Mock PathResult that carries nodeById for coordinate lookup */
interface PathWithNodeById extends import('../domain/navGraph').PathResult {
  nodeById: Map<string, import('../domain/navGraph').NormalizedNodeRecord>;
}

/** Build a RouteSessionReadyState path with embedded nodeById map */
function buildRouteWithNodes(
  nodeIds: string[],
  nodeCoords: Array<{ x: number; y: number }>,
  steps: import('../domain/navGraph').DirectionStep[],
): import('./routeSessionState').RouteSessionReadyState {
  const nodes = nodeIds.map((id, i) => makeNode(id, nodeCoords[i]?.x ?? 0, nodeCoords[i]?.y ?? 0));
  const nodeById = new Map<string, import('../domain/navGraph').NormalizedNodeRecord>();
  for (const node of nodes) {
    nodeById.set(node.id, makeNodeRecord(node));
  }

  const path: PathWithNodeById = {
    found: true,
    nodeIds,
    totalDistance: 0,
    segments: [],
    nodeById,
  };

  return {
    phase: 'ready',
    start: null,
    destination: null,
    routeMode: 'standard',
    path: path as unknown as import('./routeSessionState').RouteSessionReadyState['path'],
    directions: { steps, totalDistanceNorm: 0, totalDurationSec: 0 },
    errorMessage: null,
  };
}

/** Minimal GuidanceState factory (phase + route only, other fields defaulted) */
function makeGuidanceState(
  phase: GuidancePhase,
  route: import('./routeSessionState').RouteSessionReadyState,
  overrides?: Partial<GuidanceState>,
): GuidanceState {
  return {
    phase,
    route,
    currentStepIndex: 0,
    snappedPosition: { x: 0.5, y: 0.5 },
    snappedNodeId: 'node-0',
    heading: null,
    headingConfidence: null,
    positionConfidence: 'none' as ConfidenceLevel,
    lastFixTimestamp: Date.now(),
    offRouteDetectedAt: null,
    offRouteFixCount: 0,
    rerouteResult: null,
    ...overrides,
  };
}

// ============================================================
// Tests: deriveConfidence
// ============================================================

describe('deriveConfidence', () => {
  it('returns "none" when accuracyMeters is null', () => {
    const pos: PositionFix = { isConfident: false, accuracyMeters: null };
    const heading: HeadingFix = { headingDegrees: 45, accuracyDegrees: 5 };
    expect(deriveConfidence(pos, heading)).toBe('none');
  });

  it('returns "none" when accuracyMeters is infinite', () => {
    const pos: PositionFix = { isConfident: false, accuracyMeters: Infinity };
    const heading: HeadingFix = { headingDegrees: 45, accuracyDegrees: 5 };
    expect(deriveConfidence(pos, heading)).toBe('none');
  });

  it('returns "low" when isConfident is false (accuracy exists but GPS not reliable)', () => {
    const pos: PositionFix = { isConfident: false, accuracyMeters: 10 };
    const heading: HeadingFix = { headingDegrees: 45, accuracyDegrees: 5 };
    expect(deriveConfidence(pos, heading)).toBe('low');
  });

  it('returns "medium" when GPS confident but heading is null', () => {
    const pos: PositionFix = { isConfident: true, accuracyMeters: 20 };
    const heading: HeadingFix = { headingDegrees: null, accuracyDegrees: null };
    expect(deriveConfidence(pos, heading)).toBe('medium');
  });

  it('returns "medium" when GPS confident but headingAccuracy is infinite', () => {
    const pos: PositionFix = { isConfident: true, accuracyMeters: 20 };
    const heading: HeadingFix = { headingDegrees: 90, accuracyDegrees: Infinity };
    expect(deriveConfidence(pos, heading)).toBe('medium');
  });

  it('returns "medium" when GPS confident but headingAccuracy > 15°', () => {
    const pos: PositionFix = { isConfident: true, accuracyMeters: 20 };
    const heading: HeadingFix = { headingDegrees: 90, accuracyDegrees: 25 };
    expect(deriveConfidence(pos, heading)).toBe('medium');
  });

  it('returns "high" when GPS confident AND headingAccuracy ≤ 15°', () => {
    const pos: PositionFix = { isConfident: true, accuracyMeters: 20 };
    const heading: HeadingFix = { headingDegrees: 45, accuracyDegrees: 5 };
    expect(deriveConfidence(pos, heading)).toBe('high');
  });

  it('returns "high" when headingAccuracy exactly 15° (boundary)', () => {
    const pos: PositionFix = { isConfident: true, accuracyMeters: 15 };
    const heading: HeadingFix = { headingDegrees: 90, accuracyDegrees: 15 };
    expect(deriveConfidence(pos, heading)).toBe('high');
  });
});

// ============================================================
// Tests: isOffRoute
// ============================================================

describe('isOffRoute', () => {
  it('returns false when position is on the current segment', () => {
    // Segment from (0.1, 0.1) to (0.9, 0.9), position at midpoint (0.5, 0.5)
    const path = makePath(['a', 'b']);
    const route = buildRouteWithNodes(['a', 'b'], [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }], []);
    const position = { x: 0.5, y: 0.5 };
    expect(isOffRoute(position, 0, path, route)).toBe(false);
  });

  it('returns true when position is far from the current segment', () => {
    const path = makePath(['a', 'b']);
    const route = buildRouteWithNodes(['a', 'b'], [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }], []);
    // Position (0.9, 0.1) is far above the diagonal segment
    const position = { x: 0.9, y: 0.1 };
    expect(isOffRoute(position, 0, path, route, 0.05)).toBe(true);
  });

  it('returns false near the segment endpoint (within threshold)', () => {
    const path = makePath(['a', 'b']);
    const route = buildRouteWithNodes(['a', 'b'], [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }], []);
    // Slightly beyond the end — but close enough to last node
    const position = { x: 0.92, y: 0.88 };
    expect(isOffRoute(position, 0, path, route, 0.05)).toBe(false);
  });

  it('returns false when position is exactly on the path start', () => {
    const path = makePath(['a', 'b']);
    const route = buildRouteWithNodes(['a', 'b'], [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }], []);
    const position = { x: 0.1, y: 0.1 };
    expect(isOffRoute(position, 0, path, route, 0.05)).toBe(false);
  });

  it('returns true when position is beyond the last segment and far from last node', () => {
    const path = makePath(['a', 'b']);
    const route = buildRouteWithNodes(['a', 'b'], [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }], []);
    // At last segment index — uses distance to last node
    const position = { x: 0.0, y: 0.0 };
    expect(isOffRoute(position, 1, path, route, 0.05)).toBe(true);
  });

  it('returns false when path is not found', () => {
    const path: import('../domain/navGraph').PathResult = { found: false, nodeIds: [], totalDistance: 0, segments: [] };
    const route = buildRouteWithNodes([], [], []);
    const position = { x: 0.5, y: 0.5 };
    expect(isOffRoute(position, 0, path, route)).toBe(false);
  });

  it('returns false for single-node path', () => {
    const path = makePath(['a']);
    const route = buildRouteWithNodes(['a'], [{ x: 0.5, y: 0.5 }], []);
    const position = { x: 0.6, y: 0.6 };
    expect(isOffRoute(position, 0, path, route, 0.05)).toBe(false);
  });

  it('uses custom threshold correctly', () => {
    const path = makePath(['a', 'b']);
    const route = buildRouteWithNodes(['a', 'b'], [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }], []);
    // Distance from (0.5, 0.2) to diagonal segment is ~0.18
    const position = { x: 0.5, y: 0.2 };
    expect(isOffRoute(position, 0, path, route, 0.05)).toBe(true);  // > 0.05
    expect(isOffRoute(position, 0, path, route, 0.5)).toBe(false); // < 0.5
  });

  it('returns true for degenerate segment when close to the point', () => {
    const path = makePath(['a', 'a']); // same node
    const route = buildRouteWithNodes(['a', 'a'], [{ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }], []);
    // Distance from (0.55, 0.55) to (0.5, 0.5) ≈ 0.071 > 0.05 → off route
    const position = { x: 0.55, y: 0.55 };
    expect(isOffRoute(position, 0, path, route, 0.05)).toBe(true);
    // With a larger threshold (0.1), the point is within range → on route
    expect(isOffRoute(position, 0, path, route, 0.1)).toBe(false);
  });
});

// ============================================================
// Tests: shouldAdvanceStep
// ============================================================

describe('shouldAdvanceStep', () => {
  it('returns true when position is close to the next waypoint', () => {
    // Segment from (0.1, 0.1) to (0.9, 0.9), position near end (0.88, 0.92)
    const path = makePath(['a', 'b']);
    const route = buildRouteWithNodes(['a', 'b'], [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }], []);
    const position = { x: 0.88, y: 0.92 };
    expect(shouldAdvanceStep(position, 0, path, route, 0.03)).toBe(true);
  });

  it('returns false when position is far from the next waypoint', () => {
    const path = makePath(['a', 'b']);
    const route = buildRouteWithNodes(['a', 'b'], [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }], []);
    const position = { x: 0.5, y: 0.5 }; // midpoint — perpendicular projection is on segment
    // At midpoint, perp distance to diagonal (0.1,0.1)-(0.9,0.9) is 0
    // So advance = true at midpoint (on segment)
    // Use position clearly off-segment
    const offPos = { x: 0.3, y: 0.7 }; // perpendicular distance ~0.28
    expect(shouldAdvanceStep(offPos, 0, path, route, 0.03)).toBe(false);
  });

  it('advanceThreshold is smaller than offRoute threshold — prevents false reroutes', () => {
    const path = makePath(['a', 'b']);
    const route = buildRouteWithNodes(['a', 'b'], [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }], []);
    // Position mid-segment but clearly away from both endpoints (perpendicular distance ~0.28)
    const midOffPos = { x: 0.3, y: 0.7 };
    expect(shouldAdvanceStep(midOffPos, 0, path, route, 0.03)).toBe(false); // not close to waypoint
    expect(isOffRoute(midOffPos, 0, path, route, 0.05)).toBe(true); // far from path → reroute
  });

  it('returns true at last segment when close to final node', () => {
    const path = makePath(['a', 'b', 'c']);
    const route = buildRouteWithNodes(['a', 'b', 'c'], [
      { x: 0.1, y: 0.1 },
      { x: 0.5, y: 0.5 },
      { x: 0.9, y: 0.9 },
    ], []);
    // At step 2 (last segment), position near final node (0.9, 0.9)
    const position = { x: 0.89, y: 0.91 };
    expect(shouldAdvanceStep(position, 2, path, route, 0.03)).toBe(true);
  });

  it('returns false when path is not found', () => {
    const path: import('../domain/navGraph').PathResult = { found: false, nodeIds: [], totalDistance: 0, segments: [] };
    const route = buildRouteWithNodes([], [], []);
    const position = { x: 0.5, y: 0.5 };
    expect(shouldAdvanceStep(position, 0, path, route)).toBe(false);
  });

  it('returns false when currentStepIndex is at or beyond last node (no next step)', () => {
    const path = makePath(['a', 'b']);
    const route = buildRouteWithNodes(['a', 'b'], [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }], []);
    // Step index at last node (1) — next step (2) is beyond path length
    // Falls back to distance to last node
    const nearLast = { x: 0.89, y: 0.91 };
    const farFromLast = { x: 0.1, y: 0.1 };
    expect(shouldAdvanceStep(nearLast, 1, path, route, 0.03)).toBe(true);
    expect(shouldAdvanceStep(farFromLast, 1, path, route, 0.03)).toBe(false);
  });

  it('returns false for single-node path (cannot advance, need 2+ nodes)', () => {
    const path = makePath(['a']);
    const route = buildRouteWithNodes(['a'], [{ x: 0.5, y: 0.5 }], []);
    const position = { x: 0.52, y: 0.52 };
    expect(shouldAdvanceStep(position, 0, path, route, 0.03)).toBe(false);
  });
});

// ============================================================
// Tests: deriveNextPhase
// ============================================================

describe('deriveNextPhase', () => {
  const dummyRoute = buildRouteWithNodes(['a', 'b'], [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }], []);

  function makeState(phase: GuidancePhase, overrides?: Partial<GuidanceState>): GuidanceState {
    return {
      phase,
      route: dummyRoute as import('./routeSessionState').RouteSessionReadyState,
      currentStepIndex: 0,
      snappedPosition: { x: 0.5, y: 0.5 },
      snappedNodeId: 'a',
      heading: null,
      headingConfidence: null,
      positionConfidence: 'high' as ConfidenceLevel,
      lastFixTimestamp: Date.now(),
      offRouteDetectedAt: null,
      offRouteFixCount: 0,
      rerouteResult: null,
      ...overrides,
    };
  }

  // --- idle ---

  it('idle → guiding when isConfident=true', () => {
    const state = makeState('idle');
    expect(deriveNextPhase(state, true, false, 0)).toBe('guiding');
  });

  it('idle → low-confidence when isConfident=false', () => {
    const state = makeState('idle');
    expect(deriveNextPhase(state, false, false, 0)).toBe('low-confidence');
  });

  // --- low-confidence ---

  it('low-confidence → guiding when isConfident=true', () => {
    const state = makeState('low-confidence');
    expect(deriveNextPhase(state, true, false, 0)).toBe('guiding');
  });

  it('low-confidence → stays low-confidence when isConfident=false', () => {
    const state = makeState('low-confidence');
    expect(deriveNextPhase(state, false, false, 0)).toBe('low-confidence');
  });

  // --- guiding ---

  it('guiding → arrived when hasArrived=true', () => {
    const state = makeState('guiding');
    expect(deriveNextPhase(state, true, true, 0)).toBe('arrived');
  });

  it('guiding → rerouting when offRouteFixCount >= rerouteConfirmFixes', () => {
    const state = makeState('guiding');
    expect(deriveNextPhase(state, true, false, 3, 3)).toBe('rerouting');
    expect(deriveNextPhase(state, true, false, 4, 3)).toBe('rerouting');
  });

  it('guiding → stays guiding when offRouteFixCount < rerouteConfirmFixes', () => {
    const state = makeState('guiding');
    expect(deriveNextPhase(state, true, false, 2, 3)).toBe('guiding');
  });

  it('guiding → stays guiding when confident and not arrived and not off-route', () => {
    const state = makeState('guiding');
    expect(deriveNextPhase(state, true, false, 0, 3)).toBe('guiding');
  });

  // --- rerouting ---

  it('rerouting → guiding (assumes reroute succeeded)', () => {
    const state = makeState('rerouting');
    expect(deriveNextPhase(state, true, false, 0)).toBe('guiding');
  });

  // --- arrived ---

  it('arrived → stays arrived regardless of signals', () => {
    const state = makeState('arrived');
    expect(deriveNextPhase(state, false, false, 0)).toBe('arrived');
    expect(deriveNextPhase(state, true, false, 0)).toBe('arrived');
    expect(deriveNextPhase(state, true, true, 5)).toBe('arrived');
  });

  // --- custom rerouteConfirmFixes threshold ---

  it('respects custom rerouteConfirmFixes parameter', () => {
    const state = makeState('guiding');
    expect(deriveNextPhase(state, true, false, 2, 5)).toBe('guiding'); // 2 < 5
    expect(deriveNextPhase(state, true, false, 5, 5)).toBe('rerouting'); // 5 >= 5
  });
});

// ============================================================
// Tests: getActiveStep
// ============================================================

describe('getActiveStep', () => {
  it('returns the correct step at index 0', () => {
    const step0 = makeStep('Turn left at the cafeteria');
    const step1 = makeStep('Continue straight');
    const route = buildRouteWithNodes(['a', 'b'], [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }], [step0, step1]);
    const state = makeGuidanceState('guiding', route as import('./routeSessionState').RouteSessionReadyState, {
      currentStepIndex: 0,
    });
    expect(getActiveStep(state)).toEqual(step0);
  });

  it('returns the correct step at index 1', () => {
    const step0 = makeStep('Turn left at the cafeteria');
    const step1 = makeStep('Continue straight');
    const route = buildRouteWithNodes(['a', 'b'], [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }], [step0, step1]);
    const state = makeGuidanceState('guiding', route as import('./routeSessionState').RouteSessionReadyState, {
      currentStepIndex: 1,
    });
    expect(getActiveStep(state)).toEqual(step1);
  });

  it('returns null when route phase is not "ready"', () => {
    const step0 = makeStep('Turn left at the cafeteria');
    const route = buildRouteWithNodes(['a', 'b'], [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }], [step0]);
    const nonReadyRoute = { ...route, phase: 'idle' } as import('./routeSessionState').RouteSessionState;
    const state = makeGuidanceState(
      'idle',
      nonReadyRoute as import('./routeSessionState').RouteSessionReadyState,
      { currentStepIndex: 0 },
    );
    expect(getActiveStep(state)).toBeNull();
  });

  it('returns null when currentStepIndex is out of bounds (negative)', () => {
    const step0 = makeStep('Turn left');
    const route = buildRouteWithNodes(['a', 'b'], [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }], [step0]);
    const state = makeGuidanceState('guiding', route as import('./routeSessionState').RouteSessionReadyState, {
      currentStepIndex: -1,
    });
    expect(getActiveStep(state)).toBeNull();
  });

  it('returns null when currentStepIndex exceeds steps length', () => {
    const step0 = makeStep('Turn left');
    const route = buildRouteWithNodes(['a', 'b'], [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }], [step0]);
    const state = makeGuidanceState('guiding', route as import('./routeSessionState').RouteSessionReadyState, {
      currentStepIndex: 5,
    });
    expect(getActiveStep(state)).toBeNull();
  });

  it('returns null when directions is null', () => {
    const route = buildRouteWithNodes(['a', 'b'], [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }], []);
    const routeWithNullDirections = {
      ...route,
      directions: null,
    } as unknown as import('./routeSessionState').RouteSessionReadyState;
    const state = makeGuidanceState('guiding', routeWithNullDirections, { currentStepIndex: 0 });
    expect(getActiveStep(state)).toBeNull();
  });
});