/**
 * Tests for useLocationSearch hook.
 */

import { renderHook } from '@testing-library/react-native';
import { useLocationSearch } from './useLocationSearch';
import { normalizeNavGraph } from '../domain/navGraph';
import { NavBuilding, NavFloor, NavGraph } from '../../src/shared/types';

function createTestNavGraph(): NavGraph {
  const libF1Nodes = [
    { id: 'lib-f1-entrance', x: 0.5, y: 0.9, floorId: 1, type: 'entrance' as const, searchable: true, label: 'Main Entrance', description: 'Library main entrance' },
    { id: 'lib-f1-reception', x: 0.5, y: 0.8, floorId: 1, type: 'room' as const, searchable: true, label: 'Reception', roomNumber: '101', description: 'Front desk' },
    { id: 'lib-f1-study-a', x: 0.3, y: 0.6, floorId: 1, type: 'room' as const, searchable: true, label: 'Study Room A', roomNumber: '102' },
    { id: 'lib-f1-stairs', x: 0.9, y: 0.5, floorId: 1, type: 'stairs' as const, searchable: false, label: 'Stairs', connectsToNodeAboveId: 'lib-f2-stairs', connectsToFloorAboveId: 2 },
    { id: 'lib-f1-elevator', x: 0.1, y: 0.5, floorId: 1, type: 'elevator' as const, searchable: true, label: 'Elevator' },
  ];
  const libF2Nodes = [
    { id: 'lib-f2-stairs', x: 0.9, y: 0.5, floorId: 2, type: 'stairs' as const, searchable: false, label: 'Stairs', connectsToNodeBelowId: 'lib-f1-stairs', connectsToFloorBelowId: 1 },
    { id: 'lib-f2-cafeteria', x: 0.5, y: 0.7, floorId: 2, type: 'landmark' as const, searchable: true, label: 'Cafeteria', roomNumber: '201' },
  ];
  const sciF1Nodes = [
    { id: 'sci-f1-entrance', x: 0.5, y: 0.9, floorId: 3, type: 'entrance' as const, searchable: true, label: 'Science Entrance', description: 'Science building main entrance' },
    { id: 'sci-f1-lab-101', x: 0.3, y: 0.5, floorId: 3, type: 'room' as const, searchable: true, label: 'Chemistry Lab', roomNumber: '101', description: 'Teaching chemistry lab' },
    { id: 'sci-f1-restroom', x: 0.1, y: 0.3, floorId: 3, type: 'restroom' as const, searchable: true, label: 'Restroom' },
    { id: 'sci-f1-stairs', x: 0.9, y: 0.5, floorId: 3, type: 'stairs' as const, searchable: false, label: 'Stairs' },
  ];
  return {
    buildings: [
      { id: 1, name: 'Library', floors: [
        { id: 1, floorNumber: 1, imagePath: '/lib-f1.png', updatedAt: '2024-01-01T00:00:00Z', nodes: libF1Nodes, edges: [{ id: 'e1', sourceId: 'lib-f1-entrance', targetId: 'lib-f1-reception', standardWeight: 0.1, accessibleWeight: 0.1, accessible: true, bidirectional: true }] },
        { id: 2, floorNumber: 2, imagePath: '/lib-f2.png', updatedAt: '2024-01-01T00:00:00Z', nodes: libF2Nodes, edges: [{ id: 'e2', sourceId: 'lib-f2-stairs', targetId: 'lib-f2-cafeteria', standardWeight: 0.3, accessibleWeight: 0.3, accessible: true, bidirectional: true }] },
      ]},
      { id: 2, name: 'Science Building', floors: [
        { id: 3, floorNumber: 1, imagePath: '/sci-f1.png', updatedAt: '2024-01-01T00:00:00Z', nodes: sciF1Nodes, edges: [{ id: 'e3', sourceId: 'sci-f1-entrance', targetId: 'sci-f1-lab-101', standardWeight: 0.2, accessibleWeight: 0.2, accessible: true, bidirectional: true }] },
      ]},
    ],
  };
}

function makeGraph() {
  const result = normalizeNavGraph(createTestNavGraph());
  if (!result.ok) throw new Error('Failed to normalize: ' + result.error.message);
  return result.data;
}

describe('useLocationSearch', () => {
  describe('empty query', () => {
    it('returns all searchable nodes grouped by building/floor', () => {
      const graph = makeGraph();
      const { result } = renderHook(() => useLocationSearch(graph, ''));
      expect(result.current.buildings).toHaveLength(2);
      expect(result.current.buildings[0]?.buildingName).toBe('Library');
    });

    it('excludes non-searchable nodes (stairs)', () => {
      const graph = makeGraph();
      const { result } = renderHook(() => useLocationSearch(graph, ''));
      const allNodeIds = result.current.buildings.flatMap(b => b.floors.flatMap(f => f.nodes.map(n => n.node.id)));
      expect(allNodeIds).not.toContain('lib-f1-stairs');
      expect(allNodeIds).not.toContain('sci-f1-stairs');
    });

    it('totalMatches counts searchable nodes only', () => {
      const graph = makeGraph();
      const { result } = renderHook(() => useLocationSearch(graph, ''));
      // Library F1: entrance, reception, study-a, elevator = 4; F2: cafeteria = 1; Science F1: entrance, lab-101, restroom = 3
      expect(result.current.totalMatches).toBe(8);
    });

    it('buildings sorted alphabetically', () => {
      const graph = makeGraph();
      const { result } = renderHook(() => useLocationSearch(graph, ''));
      expect(result.current.buildings.map(b => b.buildingName)).toEqual(['Library', 'Science Building']);
    });

    it('floors sorted by floor number', () => {
      const graph = makeGraph();
      const { result } = renderHook(() => useLocationSearch(graph, ''));
      const libFloors = result.current.buildings.find(b => b.buildingName === 'Library')?.floors.map(f => f.floorNumber);
      expect(libFloors).toEqual([1, 2]);
    });

    it('nodes sorted by label', () => {
      const graph = makeGraph();
      const { result } = renderHook(() => useLocationSearch(graph, ''));
      const libF1Labels = result.current.buildings.find(b => b.buildingName === 'Library')?.floors.find(f => f.floorNumber === 1)?.nodes.map(n => n.node.label);
      expect(libF1Labels).toEqual(['Elevator', 'Main Entrance', 'Reception', 'Study Room A']);
    });
  });

  describe('prefix matching', () => {
    it('matches label prefix "Study"', () => {
      const graph = makeGraph();
      const { result } = renderHook(() => useLocationSearch(graph, 'Study'));
      expect(result.current.totalMatches).toBe(1);
    });

    it('case-insensitive matching', () => {
      const graph = makeGraph();
      const { result: lower } = renderHook(() => useLocationSearch(graph, 'study'));
      const { result: upper } = renderHook(() => useLocationSearch(graph, 'STUDY'));
      expect(lower.current.totalMatches).toBe(upper.current.totalMatches);
    });

    it('matches room number prefix "10"', () => {
      const graph = makeGraph();
      const { result } = renderHook(() => useLocationSearch(graph, '10'));
      expect(result.current.totalMatches).toBe(2); // 101 Reception + 101 Chemistry Lab
    });

    it('matches description "chemistry"', () => {
      const graph = makeGraph();
      const { result } = renderHook(() => useLocationSearch(graph, 'chemistry'));
      expect(result.current.totalMatches).toBe(1);
    });

    it('matches building name prefix "Sci"', () => {
      const graph = makeGraph();
      const { result } = renderHook(() => useLocationSearch(graph, 'Sci'));
      expect(result.current.buildings).toHaveLength(1);
      expect(result.current.buildings[0]?.buildingName).toBe('Science Building');
    });

    it('matches building name prefix "Lib"', () => {
      const graph = makeGraph();
      const { result } = renderHook(() => useLocationSearch(graph, 'Lib'));
      expect(result.current.buildings).toHaveLength(1);
      expect(result.current.buildings[0]?.buildingName).toBe('Library');
    });
  });

  describe('type filter', () => {
    it('excludes non-room nodes when typeFilter is {room}', () => {
      const graph = makeGraph();
      const { result } = renderHook(() => useLocationSearch(graph, '', new Set(['room'])));
      const allTypes = result.current.buildings.flatMap(b => b.floors.flatMap(f => f.nodes.map(n => n.node.type)));
      expect(allTypes.every(t => t === 'room')).toBe(true);
      expect(allTypes).toHaveLength(3);
    });

    it('filters to restroom only', () => {
      const graph = makeGraph();
      const { result } = renderHook(() => useLocationSearch(graph, '', new Set(['restroom'])));
      expect(result.current.totalMatches).toBe(1);
    });
  });

  describe('nonsense query', () => {
    it('returns empty result', () => {
      const graph = makeGraph();
      const { result } = renderHook(() => useLocationSearch(graph, 'xyz123'));
      expect(result.current.buildings).toHaveLength(0);
      expect(result.current.totalMatches).toBe(0);
    });
  });

  describe('result structure', () => {
    it('SearchNode includes full NavNode plus context', () => {
      const graph = makeGraph();
      const { result } = renderHook(() => useLocationSearch(graph, 'Reception'));
      const sn = result.current.buildings[0].floors[0].nodes[0];
      expect(sn.node.id).toBe('lib-f1-reception');
      expect(sn.buildingId).toBe(1);
      expect(sn.buildingName).toBe('Library');
      expect(sn.floorId).toBe(1);
      expect(sn.floorNumber).toBe(1);
    });
  });
});
