/**
 * Tests for useRouteSession hook.
 *
 * Covers:
 * - idle state when no selection
 * - computing→ready on valid route
 * - no-route when unreachable
 * - error state for invalid nodes
 * - accessible mode filtering
 */

import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { NavGraph } from '../../src/shared/types';
import { useRouteSession } from './useRouteSession';
import { normalizeNavGraph, NormalizedNavGraph } from '../domain/navGraph';

/** Extract normalized graph from result, throwing if normalization fails (test helper). */
function getTestGraph(navGraph: NavGraph): NormalizedNavGraph {
  const result = normalizeNavGraph(navGraph);
  if (!result.ok) {
    throw new Error(`Test graph normalization failed: ${result.error.code}`);
  }
  return result.data;
}

/** Build a minimal two-room graph on a single floor with one connecting edge. */
function createTestNavGraph(): NavGraph {
  return {
    buildings: [
      {
        id: 1,
        name: 'Test Building',
        floors: [
          {
            id: 1,
            floorNumber: 1,
            imagePath: '',
            updatedAt: '2024-01-01T00:00:00Z',
            nodes: [
              {
                id: 'room-a',
                x: 0.1,
                y: 0.5,
                floorId: 1,
                type: 'room',
                searchable: true,
                label: 'Room A',
                roomNumber: 'A101',
              },
              {
                id: 'room-b',
                x: 0.9,
                y: 0.5,
                floorId: 1,
                type: 'room',
                searchable: true,
                label: 'Room B',
                roomNumber: 'B101',
              },
            ],
            edges: [
              {
                id: 'edge-a-b',
                sourceId: 'room-a',
                targetId: 'room-b',
                standardWeight: 0.8,
                accessibleWeight: 0.8,
                accessible: true,
                bidirectional: true,
              },
            ],
          },
        ],
      },
    ],
  };
}

/** Build a graph with a disconnected component (no route between room-a and room-c). */
function createDisconnectedNavGraph(): NavGraph {
  return {
    buildings: [
      {
        id: 1,
        name: 'Test Building',
        floors: [
          {
            id: 1,
            floorNumber: 1,
            imagePath: '',
            updatedAt: '2024-01-01T00:00:00Z',
            nodes: [
              { id: 'room-a', x: 0.1, y: 0.5, floorId: 1, type: 'room', searchable: true, label: 'Room A', roomNumber: 'A101' },
              { id: 'room-b', x: 0.9, y: 0.5, floorId: 1, type: 'room', searchable: true, label: 'Room B', roomNumber: 'B101' },
            ],
            edges: [
              { id: 'edge-a-b', sourceId: 'room-a', targetId: 'room-b', standardWeight: 0.8, accessibleWeight: 0.8, accessible: true, bidirectional: true },
            ],
          },
          {
            id: 2,
            floorNumber: 2,
            imagePath: '',
            updatedAt: '2024-01-01T00:00:00Z',
            nodes: [
              { id: 'room-c', x: 0.5, y: 0.5, floorId: 2, type: 'room', searchable: true, label: 'Room C', roomNumber: 'C101' },
            ],
            edges: [],
          },
        ],
      },
    ],
  };
}

/** Build a graph with a stairs-only inter-floor connection (blocked in accessible mode). */
function createStairsOnlyNavGraph(): NavGraph {
  return {
    buildings: [
      {
        id: 1,
        name: 'Test Building',
        floors: [
          {
            id: 1,
            floorNumber: 1,
            imagePath: '',
            updatedAt: '2024-01-01T00:00:00Z',
            nodes: [
              { id: 'room-f1', x: 0.1, y: 0.5, floorId: 1, type: 'room', searchable: true, label: 'Room F1', roomNumber: 'F101' },
              {
                id: 'stairs-1',
                x: 0.9,
                y: 0.5,
                floorId: 1,
                type: 'stairs',
                searchable: false,
                label: 'Stairs',
                connectsToNodeAboveId: 'stairs-2',
                connectsToFloorAboveId: 2,
                connectsToNodeBelowId: undefined,
                connectsToFloorBelowId: undefined,
              },
            ],
            edges: [
              { id: 'edge-f1-stairs', sourceId: 'room-f1', targetId: 'stairs-1', standardWeight: 0.2, accessibleWeight: 0.2, accessible: true, bidirectional: true },
            ],
          },
          {
            id: 2,
            floorNumber: 2,
            imagePath: '',
            updatedAt: '2024-01-01T00:00:00Z',
            nodes: [
              { id: 'room-f2', x: 0.9, y: 0.5, floorId: 2, type: 'room', searchable: true, label: 'Room F2', roomNumber: 'F201' },
              {
                id: 'stairs-2',
                x: 0.9,
                y: 0.5,
                floorId: 2,
                type: 'stairs',
                searchable: false,
                label: 'Stairs',
                connectsToNodeBelowId: 'stairs-1',
                connectsToFloorBelowId: 1,
                connectsToNodeAboveId: undefined,
                connectsToFloorAboveId: undefined,
              },
            ],
            edges: [
              { id: 'edge-f2-stairs', sourceId: 'room-f2', targetId: 'stairs-2', standardWeight: 0.2, accessibleWeight: 0.2, accessible: true, bidirectional: true },
            ],
          },
        ],
      },
    ],
  };
}

function makeNavNode(id: string, label: string): import('../../src/shared/types').NavNode {
  return {
    id,
    x: 0.5,
    y: 0.5,
    floorId: 1,
    type: 'room',
    searchable: true,
    label,
  };
}

// ============================================================
// Tests
// ============================================================

describe('useRouteSession', () => {
  describe('idle state', () => {
    it('returns idle phase when no start is set', () => {
      const graph = getTestGraph(createTestNavGraph());
      const { result } = renderHook(() =>
        useRouteSession({
          graph,
          selection: { start: null, destination: makeNavNode('room-b', 'Room B') },
        }),
      );

      expect(result.current.sessionState.phase).toBe('idle');
    });

    it('returns idle phase when no destination is set', () => {
      const graph = getTestGraph(createTestNavGraph());
      const { result } = renderHook(() =>
        useRouteSession({
          graph,
          selection: { start: makeNavNode('room-a', 'Room A'), destination: null },
        }),
      );

      expect(result.current.sessionState.phase).toBe('idle');
    });

    it('returns idle phase when both are null', () => {
      const graph = getTestGraph(createTestNavGraph());
      const { result } = renderHook(() =>
        useRouteSession({
          graph,
          selection: { start: null, destination: null },
        }),
      );

      expect(result.current.sessionState.phase).toBe('idle');
    });
  });

  describe('ready state', () => {
    it('returns ready phase when both start and destination are valid and reachable', () => {
      const graph = getTestGraph(createTestNavGraph());
      const { result } = renderHook(() =>
        useRouteSession({
          graph,
          selection: { start: makeNavNode('room-a', 'Room A'), destination: makeNavNode('room-b', 'Room B') },
        }),
      );

      expect(result.current.sessionState.phase).toBe('ready');
      const state = result.current.sessionState;
      if (state.phase !== 'ready') throw new Error('Expected ready state');
      expect(state.path.found).toBe(true);
      expect(state.directions.steps.length).toBeGreaterThan(0);
    });

    it('path result contains correct node IDs', () => {
      const graph = getTestGraph(createTestNavGraph());
      const { result } = renderHook(() =>
        useRouteSession({
          graph,
          selection: { start: makeNavNode('room-a', 'Room A'), destination: makeNavNode('room-b', 'Room B') },
        }),
      );

      const state = result.current.sessionState;
      if (state.phase !== 'ready') throw new Error('Expected ready state');
      expect(state.path.nodeIds).toContain('room-a');
      expect(state.path.nodeIds).toContain('room-b');
    });

    it('directions result contains arrive step', () => {
      const graph = getTestGraph(createTestNavGraph());
      const { result } = renderHook(() =>
        useRouteSession({
          graph,
          selection: { start: makeNavNode('room-a', 'Room A'), destination: makeNavNode('room-b', 'Room B') },
        }),
      );

      const state = result.current.sessionState;
      if (state.phase !== 'ready') throw new Error('Expected ready state');
      const arriveSteps = state.directions.steps.filter(s => s.icon === 'arrive');
      expect(arriveSteps.length).toBe(1);
    });
  });

  describe('no-route state', () => {
    it('returns no-route when start and destination are in disconnected components', () => {
      const graph = getTestGraph(createDisconnectedNavGraph());
      const { result } = renderHook(() =>
        useRouteSession({
          graph,
          selection: { start: makeNavNode('room-a', 'Room A'), destination: makeNavNode('room-c', 'Room C') },
        }),
      );

      expect(result.current.sessionState.phase).toBe('no-route');
    });
  });

  describe('error state', () => {
    it('returns error when start node is not in the graph', () => {
      const graph = getTestGraph(createTestNavGraph());
      const { result } = renderHook(() =>
        useRouteSession({
          graph,
          selection: {
            start: makeNavNode('unknown-node', 'Unknown'),
            destination: makeNavNode('room-b', 'Room B'),
          },
        }),
      );

      expect(result.current.sessionState.phase).toBe('error');
      const state = result.current.sessionState;
      if (state.phase !== 'error') throw new Error('Expected error state');
      expect(state.errorMessage).toContain('not present');
    });

    it('returns error when destination node is not in the graph', () => {
      const graph = getTestGraph(createTestNavGraph());
      const { result } = renderHook(() =>
        useRouteSession({
          graph,
          selection: {
            start: makeNavNode('room-a', 'Room A'),
            destination: makeNavNode('unknown-dest', 'Unknown'),
          },
        }),
      );

      expect(result.current.sessionState.phase).toBe('error');
    });
  });

  describe('accessible mode', () => {
    it('returns ready with accessible mode when stairs-only path is blocked', () => {
      const graph = getTestGraph(createStairsOnlyNavGraph());

      // First verify standard mode works (should find route via stairs)
      const { result: standardResult } = renderHook(() =>
        useRouteSession({
          graph,
          selection: {
            start: makeNavNode('room-f1', 'Room F1'),
            destination: makeNavNode('room-f2', 'Room F2'),
          },
        }),
      );
      expect(standardResult.current.sessionState.phase).toBe('ready');

      // Accessible mode should block stairs and return no-route
      // Direct test via computeRouteSession
      const { computeRouteSession } = require('./routeSessionState');
      const standardSession = computeRouteSession({
        graph,
        mode: 'standard',
        start: makeNavNode('room-f1', 'Room F1'),
        destination: makeNavNode('room-f2', 'Room F2'),
      });
      expect(standardSession.phase).toBe('ready');

      const accessibleSession = computeRouteSession({
        graph,
        mode: 'accessible',
        start: makeNavNode('room-f1', 'Room F1'),
        destination: makeNavNode('room-f2', 'Room F2'),
      });
      expect(accessibleSession.phase).toBe('no-route');
    });
  });

  describe('routeMode state', () => {
    it('exposes routeMode and setRouteMode', () => {
      const graph = getTestGraph(createTestNavGraph());
      const { result } = renderHook(() =>
        useRouteSession({
          graph,
          selection: { start: null, destination: null },
        }),
      );

      expect(result.current.routeMode).toBe('standard');
      result.current.setRouteMode('accessible');
      expect(result.current.routeMode).toBe('accessible');
    });
  });
});
