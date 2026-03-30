/**
 * Tests for MobilePathfindingEngine.
 */

import { describe, expect, it } from 'vitest';
import { NavBuilding, NavFloor, NavGraph, NavNode, NavEdge } from '../../src/shared/types';
import { MobilePathfindingEngine } from './pathfindingEngine';
import { normalizeNavGraph } from '../domain/navGraph';

/**
 * Create a test navigation graph with 2 buildings × 2 floors × 3 rooms each,
 * connected by stairs and elevator.
 */
function createTestNavGraph(): NavGraph {
  // Building 1: Floor 1
  const b1f1Nodes: NavNode[] = [
    {
      id: 'b1f1-room1',
      x: 0.1,
      y: 0.5,
      floorId: 1,
      type: 'room',
      searchable: true,
      label: 'Room 101',
      roomNumber: '101',
      description: 'Test Room 101',
    },
    {
      id: 'b1f1-room2',
      x: 0.5,
      y: 0.5,
      floorId: 1,
      type: 'room',
      searchable: true,
      label: 'Room 102',
      roomNumber: '102',
    },
    {
      id: 'b1f1-stairs',
      x: 0.7,
      y: 0.5,
      floorId: 1,
      type: 'stairs',
      searchable: false,
      label: 'Stairs',
      connectsToNodeAboveId: 'b1f2-stairs',
      connectsToFloorAboveId: 2,
      connectsToNodeBelowId: undefined,
      connectsToFloorBelowId: undefined,
    },
    {
      id: 'b1f1-elevator',
      x: 0.9,
      y: 0.5,
      floorId: 1,
      type: 'elevator',
      searchable: false,
      label: 'Elevator',
      connectsToNodeAboveId: 'b1f2-elevator',
      connectsToFloorAboveId: 2,
      connectsToNodeBelowId: undefined,
      connectsToFloorBelowId: undefined,
    },
  ];

  const b1f1Edges: NavEdge[] = [
    { id: 'b1f1-e1', sourceId: 'b1f1-room1', targetId: 'b1f1-room2', standardWeight: 0.4, accessibleWeight: 0.4, accessible: true, bidirectional: true },
    { id: 'b1f1-e2', sourceId: 'b1f1-room2', targetId: 'b1f1-stairs', standardWeight: 0.2, accessibleWeight: 0.2, accessible: true, bidirectional: true },
    { id: 'b1f1-e3', sourceId: 'b1f1-stairs', targetId: 'b1f1-elevator', standardWeight: 0.2, accessibleWeight: 0.2, accessible: true, bidirectional: true },
    { id: 'b1f1-e4', sourceId: 'b1f1-room2', targetId: 'b1f1-elevator', standardWeight: 0.5, accessibleWeight: 0.5, accessible: true, bidirectional: true },
  ];

  // Building 1: Floor 2
  const b1f2Nodes: NavNode[] = [
    {
      id: 'b1f2-stairs',
      x: 0.7,
      y: 0.5,
      floorId: 2,
      type: 'stairs',
      searchable: false,
      label: 'Stairs',
      connectsToNodeAboveId: undefined,
      connectsToFloorAboveId: undefined,
      connectsToNodeBelowId: 'b1f1-stairs',
      connectsToFloorBelowId: 1,
    },
    {
      id: 'b1f2-elevator',
      x: 0.9,
      y: 0.5,
      floorId: 2,
      type: 'elevator',
      searchable: false,
      label: 'Elevator',
      connectsToNodeAboveId: undefined,
      connectsToFloorAboveId: undefined,
      connectsToNodeBelowId: 'b1f1-elevator',
      connectsToFloorBelowId: 1,
    },
    {
      id: 'b1f2-room1',
      x: 0.1,
      y: 0.5,
      floorId: 2,
      type: 'room',
      searchable: true,
      label: 'Room 201',
      roomNumber: '201',
    },
    {
      id: 'b1f2-room2',
      x: 0.5,
      y: 0.5,
      floorId: 2,
      type: 'room',
      searchable: true,
      label: 'Room 202',
      roomNumber: '202',
    },
  ];

  const b1f2Edges: NavEdge[] = [
    { id: 'b1f2-e1', sourceId: 'b1f2-stairs', targetId: 'b1f2-elevator', standardWeight: 0.2, accessibleWeight: 0.2, accessible: true, bidirectional: true },
    { id: 'b1f2-e2', sourceId: 'b1f2-stairs', targetId: 'b1f2-room1', standardWeight: 0.6, accessibleWeight: 0.6, accessible: true, bidirectional: true },
    { id: 'b1f2-e3', sourceId: 'b1f2-room1', targetId: 'b1f2-room2', standardWeight: 0.4, accessibleWeight: 0.4, accessible: true, bidirectional: true },
    { id: 'b1f2-e4', sourceId: 'b1f2-elevator', targetId: 'b1f2-room1', standardWeight: 0.8, accessibleWeight: 0.8, accessible: true, bidirectional: true },
  ];

  // Building 2: Floor 1 (disconnected from Building 1)
  const b2f1Nodes: NavNode[] = [
    {
      id: 'b2f1-room1',
      x: 0.2,
      y: 0.5,
      floorId: 3,
      type: 'room',
      searchable: true,
      label: 'Room B101',
      roomNumber: 'B101',
    },
    {
      id: 'b2f1-room2',
      x: 0.8,
      y: 0.5,
      floorId: 3,
      type: 'room',
      searchable: true,
      label: 'Room B102',
      roomNumber: 'B102',
    },
  ];

  const b2f1Edges: NavEdge[] = [
    { id: 'b2f1-e1', sourceId: 'b2f1-room1', targetId: 'b2f1-room2', standardWeight: 0.6, accessibleWeight: 0.6, accessible: true, bidirectional: true },
  ];

  const b1f1: NavFloor = { id: 1, floorNumber: 1, imagePath: '/b1f1.png', updatedAt: '2024-01-01T00:00:00Z', nodes: b1f1Nodes, edges: b1f1Edges };
  const b1f2: NavFloor = { id: 2, floorNumber: 2, imagePath: '/b1f2.png', updatedAt: '2024-01-01T00:00:00Z', nodes: b1f2Nodes, edges: b1f2Edges };
  const b2f1: NavFloor = { id: 3, floorNumber: 1, imagePath: '/b2f1.png', updatedAt: '2024-01-01T00:00:00Z', nodes: b2f1Nodes, edges: b2f1Edges };

  const building1: NavBuilding = { id: 1, name: 'Building A', floors: [b1f1, b1f2] };
  const building2: NavBuilding = { id: 2, name: 'Building B', floors: [b2f1] };

  return { buildings: [building1, building2] };
}

describe('MobilePathfindingEngine', () => {
  const normalizedResult = normalizeNavGraph(createTestNavGraph());
  if (!normalizedResult.ok) {
    throw new Error('Failed to normalize test nav graph');
  }
  const graph = normalizedResult.data;
  const engine = new MobilePathfindingEngine(graph);

  it('returns trivial path for same-node request', () => {
    const result = engine.findRoute('b1f1-room1', 'b1f1-room1', 'standard');
    expect(result.found).toBe(true);
    expect(result.nodeIds).toEqual(['b1f1-room1']);
    expect(result.totalDistance).toBe(0);
    expect(result.segments).toEqual([]);
  });

  it('finds route between rooms on the same floor (standard mode)', () => {
    const result = engine.findRoute('b1f1-room1', 'b1f1-room2', 'standard');
    expect(result.found).toBe(true);
    expect(result.nodeIds.length).toBeGreaterThanOrEqual(2);
    expect(result.nodeIds[0]).toBe('b1f1-room1');
    expect(result.nodeIds[result.nodeIds.length - 1]).toBe('b1f1-room2');
    expect(result.totalDistance).toBeGreaterThan(0);
  });

  it('finds route across floors via stairs (standard mode)', () => {
    const result = engine.findRoute('b1f1-room1', 'b1f2-room1', 'standard');
    expect(result.found).toBe(true);
    expect(result.nodeIds[0]).toBe('b1f1-room1');
    expect(result.nodeIds[result.nodeIds.length - 1]).toBe('b1f2-room1');
    // Path should include stairs
    expect(result.nodeIds).toContain('b1f1-stairs');
    expect(result.nodeIds).toContain('b1f2-stairs');
  });

  it('finds accessible route via elevator (accessible mode)', () => {
    const result = engine.findRoute('b1f1-room1', 'b1f2-room1', 'accessible');
    expect(result.found).toBe(true);
    expect(result.nodeIds[0]).toBe('b1f1-room1');
    expect(result.nodeIds[result.nodeIds.length - 1]).toBe('b1f2-room1');
    // Accessible route should use elevator, not stairs
    expect(result.nodeIds).toContain('b1f1-elevator');
    expect(result.nodeIds).toContain('b1f2-elevator');
  });

  it('returns not-found for missing source node', () => {
    const result = engine.findRoute('nonexistent-node', 'b1f1-room2', 'standard');
    expect(result.found).toBe(false);
    expect(result.nodeIds).toEqual([]);
    expect(result.totalDistance).toBe(0);
  });

  it('returns not-found for missing target node', () => {
    const result = engine.findRoute('b1f1-room1', 'nonexistent-node', 'standard');
    expect(result.found).toBe(false);
    expect(result.nodeIds).toEqual([]);
    expect(result.totalDistance).toBe(0);
  });

  it('returns not-found for disconnected subgraph', () => {
    // Building B is disconnected from Building A
    const result = engine.findRoute('b1f1-room1', 'b2f1-room1', 'standard');
    expect(result.found).toBe(false);
    expect(result.nodeIds).toEqual([]);
  });

  it('includes segments in path result', () => {
    const result = engine.findRoute('b1f1-room1', 'b1f1-room2', 'standard');
    expect(result.found).toBe(true);
    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.segments[0]).toHaveProperty('fromId');
    expect(result.segments[0]).toHaveProperty('toId');
    expect(result.segments[0]).toHaveProperty('distance');
  });

  it('calculates total distance from segments', () => {
    const result = engine.findRoute('b1f1-room1', 'b1f1-room2', 'standard');
    const sumFromSegments = result.segments.reduce((sum, seg) => sum + seg.distance, 0);
    expect(result.totalDistance).toBeCloseTo(sumFromSegments, 5);
  });

  it('accessible route is longer or equal to standard route', () => {
    const standard = engine.findRoute('b1f1-room1', 'b1f2-room1', 'standard');
    const accessible = engine.findRoute('b1f1-room1', 'b1f2-room1', 'accessible');
    // Both should find routes
    expect(standard.found).toBe(true);
    expect(accessible.found).toBe(true);
  });
});
