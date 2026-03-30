/**
 * Tests for LiveGuidanceOverlay component.
 * Uses React.createElement directly to avoid Vitest's TSX transform issue
 * with Vite 7 (oxc can't parse TypeScript `import type`).
 */

import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LiveGuidanceOverlay } from './LiveGuidanceOverlay';
import { ConfidenceLevel, GuidancePhase, GuidanceState } from '../../routing/guidanceState';

const h = React.createElement;

// ─── Minimal fixture builders ──────────────────────────────────────────────

function makeNode(id: string, label: string) {
  return {
    id,
    label,
    x: 0.5,
    y: 0.5,
    type: 'room' as const,
    searchable: true,
    floorId: 1,
  };
}

function makeStep(instruction: string, distanceM = 10) {
  return {
    instruction,
    icon: 'straight' as const,
    distanceM,
    durationSec: 10,
    isAccessibleSegment: false,
    floorId: 1,
    floorNumber: 1,
  };
}

function makeRoute(overrides?: { destinationLabel?: string; steps?: { instruction: string; icon: string; distanceM: number; durationSec: number; isAccessibleSegment: boolean; floorId: number; floorNumber: number }[] }) {
  const dest = makeNode('dest', overrides?.destinationLabel ?? 'Engineering Lab');
  const steps = overrides?.steps ?? [
    makeStep('Walk straight to the elevators', 8),
    makeStep('Turn left at the lobby', 5),
  ];
  return {
    phase: 'ready' as const,
    start: makeNode('start', 'Library Entrance'),
    destination: dest,
    routeMode: 'standard' as const,
    path: {
      found: true,
      nodeIds: ['start', 'n1', 'n2', 'dest'],
      totalDistance: 0.1,
      segments: [],
    },
    directions: {
      steps,
      totalDistanceNorm: steps.reduce((s, st) => s + st.distanceM, 0),
      totalDurationSec: steps.reduce((s, st) => s + st.durationSec, 0),
    },
    errorMessage: null,
  };
}

function makeState(
  phase: GuidancePhase,
  overrides?: { positionConfidence?: ConfidenceLevel; currentStepIndex?: number },
): GuidanceState {
  const route = makeRoute() as GuidanceState['route'];
  return {
    phase,
    route,
    currentStepIndex: overrides?.currentStepIndex ?? 0,
    snappedPosition: { x: 0.5, y: 0.5 },
    snappedNodeId: 'start',
    heading: 90,
    headingConfidence: 10,
    positionConfidence: overrides?.positionConfidence ?? 'high',
    lastFixTimestamp: Date.now(),
    offRouteDetectedAt: null,
    offRouteFixCount: 0,
    rerouteResult: null,
    currentFloorId: 1,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('LiveGuidanceOverlay — phase rendering', () => {
  const onConfirmPosition = vi.fn();
  const onStopGuidance = vi.fn();

  it('renders null for idle phase', () => {
    const state = makeState('idle');
    const { toJSON } = render(
      h(LiveGuidanceOverlay, { guidanceState: state, onConfirmPosition, onStopGuidance }),
    );
    expect(toJSON()).toBeNull();
  });

  it('renders low-confidence banner with confirm button', () => {
    const state = makeState('low-confidence', { positionConfidence: 'low' });
    render(
      h(LiveGuidanceOverlay, { guidanceState: state, onConfirmPosition, onStopGuidance }),
    );
    expect(screen.getByTestId('low-confidence-banner')).toBeTruthy();
    expect(screen.getByTestId('confirm-position-btn')).toBeTruthy();
    expect(screen.getByText(/Can't confirm your location/)).toBeTruthy();
  });

  it('renders guidance card for guiding phase', () => {
    const state = makeState('guiding', { positionConfidence: 'high', currentStepIndex: 0 });
    render(
      h(LiveGuidanceOverlay, { guidanceState: state, onConfirmPosition, onStopGuidance }),
    );
    expect(screen.getByTestId('guiding-card')).toBeTruthy();
  });

  it('guiding card shows step instruction text', () => {
    const state = makeState('guiding', { currentStepIndex: 0 });
    render(
      h(LiveGuidanceOverlay, { guidanceState: state, onConfirmPosition, onStopGuidance }),
    );
    expect(screen.getByText('Walk straight to the elevators')).toBeTruthy();
  });

  it('guiding card shows progress indicator', () => {
    const state = makeState('guiding', { currentStepIndex: 0 });
    render(
      h(LiveGuidanceOverlay, { guidanceState: state, onConfirmPosition, onStopGuidance }),
    );
    // 2 steps total, currently on step 1
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
  });

  it('guiding card shows stop guidance button', () => {
    const state = makeState('guiding', { currentStepIndex: 0 });
    render(
      h(LiveGuidanceOverlay, { guidanceState: state, onConfirmPosition, onStopGuidance }),
    );
    expect(screen.getByTestId('stop-guidance-btn')).toBeTruthy();
    expect(screen.getByText('End guidance')).toBeTruthy();
  });

  it('renders rerouting banner with spinner text', () => {
    const state = makeState('rerouting');
    render(
      h(LiveGuidanceOverlay, { guidanceState: state, onConfirmPosition, onStopGuidance }),
    );
    expect(screen.getByTestId('rerouting-banner')).toBeTruthy();
    expect(screen.getByText('Recalculating your route...')).toBeTruthy();
  });

  it('renders arrived card with destination name', () => {
    const state = makeState('arrived');
    render(
      h(LiveGuidanceOverlay, { guidanceState: state, onConfirmPosition, onStopGuidance }),
    );
    expect(screen.getByTestId('arrived-card')).toBeTruthy();
    expect(screen.getByText("You've arrived!")).toBeTruthy();
    expect(screen.getByText('Engineering Lab')).toBeTruthy();
  });

  it('arrived card shows done button', () => {
    const state = makeState('arrived');
    render(
      h(LiveGuidanceOverlay, { guidanceState: state, onConfirmPosition, onStopGuidance }),
    );
    expect(screen.getByTestId('done-btn')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
  });
});
