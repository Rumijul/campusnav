import { describe, it, expect } from 'vitest';
import { findNearestNodeOnFloor } from './findNearestNodeOnFloor';
import { normalizeNavGraph } from '../domain/navGraph';
import type { NavGraph } from '../../src/shared/types';

function createTestNavGraph(): NavGraph {
  const libF1Nodes = [
    { id: 'lib-f1-entrance', x: 0.5, y: 0.9, floorId: 1, type: 'entrance' as const, searchable: true, label: 'Main Entrance', description: 'Library main entrance' },
    { id: 'lib-f1-reception', x: 0.5, y: 0.8, floorId: 1, type: 'room' as const, searchable: true, label: 'Reception', roomNumber: '101', description: 'Front desk' },
    { id: 'lib-f1-study-a', x: 0.3, y: 0.6, floorId: 1, type: 'room' as const, searchable: true, label: 'Study Room A', roomNumber: '102' },
    { id: 'lib-f1-elevator', x: 0.1, y: 0.5, floorId: 1, type: 'elevator' as const, searchable: true, label: 'Elevator' },
  ];
  const libF2Nodes = [
    { id: 'lib-f2-elevator', x: 0.1, y: 0.5, floorId: 2, type: 'elevator' as const, searchable: true, label: 'Elevator' },
    { id: 'lib-f2-cafeteria', x: 0.5, y: 0.7, floorId: 2, type: 'landmark' as const, searchable: true, label: 'Cafeteria', roomNumber: '201' },
  ];
  const sciF1Nodes = [
    { id: 'sci-f1-entrance', x: 0.5, y: 0.9, floorId: 3, type: 'entrance' as const, searchable: true, label: 'Science Entrance', description: 'Science building main entrance' },
    { id: 'sci-f1-lab-101', x: 0.3, y: 0.5, floorId: 3, type: 'room' as const, searchable: true, label: 'Chemistry Lab', roomNumber: '101', description: 'Teaching chemistry lab' },
  ];
  return {
    buildings: [
      { id: 1, name: 'Library', floors: [
        { id: 1, floorNumber: 1, imagePath: '/lib-f1.png', updatedAt: '2024-01-01T00:00:00Z', nodes: libF1Nodes, edges: [] },
        { id: 2, floorNumber: 2, imagePath: '/lib-f2.png', updatedAt: '2024-01-01T00:00:00Z', nodes: libF2Nodes, edges: [] },
      ]},
      { id: 2, name: 'Science Building', floors: [
        { id: 3, floorNumber: 1, imagePath: '/sci-f1.png', updatedAt: '2024-01-01T00:00:00Z', nodes: sciF1Nodes, edges: [] },
      ]},
    ],
  };
}

function makeGraph() {
  const result = normalizeNavGraph(createTestNavGraph());
  if (!result.ok) throw new Error('Failed to normalize: ' + result.error.message);
  return result.data;
}

describe('findNearestNodeOnFloor', () => {
  it('returns the nearest node on the specified floor', () => {
    const graph = makeGraph();
    // Position at origin (0, 0) - closest to lib-f1-elevator at (0.1, 0.5)
    const nearest = findNearestNodeOnFloor(graph, 1, { x: 0, y: 0 });
    expect(nearest).toBe('lib-f1-elevator');
  });

  it('returns the closest node when position is near multiple nodes', () => {
    const graph = makeGraph();
    // Position at (0.5, 0.8) - exactly at lib-f1-reception
    const nearest = findNearestNodeOnFloor(graph, 1, { x: 0.5, y: 0.8 });
    expect(nearest).toBe('lib-f1-reception');
  });

  it('returns null when no nodes exist on the floor', () => {
    const graph = makeGraph();
    // Floor 99 doesn't exist
    const nearest = findNearestNodeOnFloor(graph, 99, { x: 0.5, y: 0.5 });
    expect(nearest).toBeNull();
  });

  it('filters correctly by floorId', () => {
    const graph = makeGraph();
    // Find nearest on floor 2 (Library F2)
    // lib-f2-cafeteria at (0.5, 0.7) is closer to (0.5, 0.5) than lib-f2-elevator at (0.1, 0.5)
    const nearest = findNearestNodeOnFloor(graph, 2, { x: 0.5, y: 0.5 });
    expect(nearest).toBe('lib-f2-cafeteria');
  });

  it('does not return nodes from other floors', () => {
    const graph = makeGraph();
    // Find nearest on floor 3 (Science F1)
    const nearest = findNearestNodeOnFloor(graph, 3, { x: 0.5, y: 0.5 });
    expect(nearest).not.toBe('lib-f1-entrance');
    expect(nearest).not.toBe('lib-f2-cafeteria');
    expect(nearest).toBeTruthy(); // Should be one of the Science F1 nodes
  });

  it('uses Euclidean distance correctly', () => {
    const graph = makeGraph();
    // Position at (0.5, 0.9) - exactly at lib-f1-entrance
    const nearest = findNearestNodeOnFloor(graph, 1, { x: 0.5, y: 0.9 });
    expect(nearest).toBe('lib-f1-entrance');
  });

  it('handles position at origin (0, 0)', () => {
    const graph = makeGraph();
    const nearest = findNearestNodeOnFloor(graph, 1, { x: 0, y: 0 });
    expect(nearest).toBeTruthy();
    expect(typeof nearest).toBe('string');
  });

  it('handles position at corner (1, 1)', () => {
    const graph = makeGraph();
    const nearest = findNearestNodeOnFloor(graph, 1, { x: 1, y: 1 });
    // Should return the node closest to (1, 1) - lib-f1-entrance at (0.5, 0.9)
    expect(nearest).toBe('lib-f1-entrance');
  });
});
