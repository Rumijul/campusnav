/**
 * Tests for generateDirections.
 */

import { describe, expect, it } from 'vitest';
import { NavNode, NavFloor } from '../../src/shared/types';
import { generateDirections, routesAreIdentical } from './generateDirections';
import { PathResult } from '../domain/navGraph';

/**
 * Create a test node with given properties.
 */
function makeNode(
  id: string,
  x: number,
  y: number,
  floorId: number,
  type: NavNode['type'] = 'room',
  options: Partial<NavNode> = {},
): NavNode {
  return {
    id,
    x,
    y,
    floorId,
    type,
    searchable: type === 'room' || type === 'landmark' || type === 'entrance',
    label: id,
    ...options,
  };
}

describe('generateDirections', () => {
  const floorMap = new Map<number, NavFloor>([
    [1, { id: 1, floorNumber: 1, imagePath: '/f1.png', updatedAt: '2024-01-01', nodes: [], edges: [] }],
    [2, { id: 2, floorNumber: 2, imagePath: '/f2.png', updatedAt: '2024-01-01', nodes: [], edges: [] }],
  ]);

  describe('node count handling', () => {
    it('returns empty result for empty node list', () => {
      const nodeMap = new Map<string, NavNode>();
      const result = generateDirections([], nodeMap, 'standard', floorMap);
      expect(result.steps).toEqual([]);
      expect(result.totalDistanceNorm).toBe(0);
      expect(result.totalDurationSec).toBe(0);
    });

    it('returns empty result for single node', () => {
      const nodeMap = new Map<string, NavNode>([
        ['room1', makeNode('room1', 0.1, 0.5, 1)],
      ]);
      const result = generateDirections(['room1'], nodeMap, 'standard', floorMap);
      expect(result.steps).toEqual([]);
      expect(result.totalDistanceNorm).toBe(0);
    });

    it('returns only arrive step for two nodes', () => {
      const nodeMap = new Map<string, NavNode>([
        ['room1', makeNode('room1', 0.1, 0.5, 1)],
        ['room2', makeNode('room2', 0.9, 0.5, 1, 'room', { label: 'Room 102' })],
      ]);
      const result = generateDirections(['room1', 'room2'], nodeMap, 'standard', floorMap);
      expect(result.steps.length).toBe(1);
      expect(result.steps[0]?.icon).toBe('arrive');
      expect(result.steps[0]?.instruction).toContain('Room 102');
    });
  });

  describe('turn generation', () => {
    it('generates straight instruction for collinear nodes', () => {
      const nodeMap = new Map<string, NavNode>([
        ['a', makeNode('a', 0.1, 0.5, 1)],
        ['b', makeNode('b', 0.5, 0.5, 1)],
        ['c', makeNode('c', 0.9, 0.5, 1)],
      ]);
      const result = generateDirections(['a', 'b', 'c'], nodeMap, 'standard', floorMap);
      // Should have a straight step at b and arrive step at c
      expect(result.steps.length).toBeGreaterThanOrEqual(1);
      const turnStep = result.steps.find((s) => s.icon !== 'arrive');
      expect(turnStep?.icon).toBe('straight');
    });

    it('generates turn instruction for perpendicular path', () => {
      // Create nodes that form a right angle
      const nodeMap = new Map<string, NavNode>([
        ['start', makeNode('start', 0.1, 0.1, 1)],
        ['corner', makeNode('corner', 0.1, 0.5, 1)],
        ['end', makeNode('end', 0.9, 0.5, 1)],
      ]);
      const result = generateDirections(['start', 'corner', 'end'], nodeMap, 'standard', floorMap);
      const turnStep = result.steps.find((s) => s.icon !== 'arrive');
      expect(turnStep?.icon).toBe('turn-left');
    });

    it('includes landmark reference in instruction when node is searchable', () => {
      const nodeMap = new Map<string, NavNode>([
        ['a', makeNode('a', 0.1, 0.5, 1)],
        ['b', makeNode('b', 0.5, 0.5, 1, 'room', { label: 'Cafeteria', searchable: true })],
        ['c', makeNode('c', 0.9, 0.5, 1)],
      ]);
      const result = generateDirections(['a', 'b', 'c'], nodeMap, 'standard', floorMap);
      const turnStep = result.steps.find((s) => s.icon !== 'arrive');
      expect(turnStep?.instruction).toContain('Cafeteria');
    });
  });

  describe('floor change detection', () => {
    it('generates stairs-up icon for floor change up via stairs', () => {
      const nodeMap = new Map<string, NavNode>([
        ['room1', makeNode('room1', 0.5, 0.5, 1)],
        ['stairs1', makeNode('stairs1', 0.7, 0.5, 1, 'stairs')],
        ['stairs2', makeNode('stairs2', 0.7, 0.5, 2, 'stairs')],
        ['room2', makeNode('room2', 0.5, 0.5, 2)],
      ]);
      const result = generateDirections(['room1', 'stairs1', 'stairs2', 'room2'], nodeMap, 'standard', floorMap);
      const stairsStep = result.steps.find((s) => s.icon === 'stairs-up');
      expect(stairsStep).toBeDefined();
      expect(stairsStep?.instruction).toContain('stairs');
      expect(stairsStep?.instruction).toContain('up');
      expect(stairsStep?.instruction).toContain('Floor 2');
    });

    it('generates elevator icon for floor change via elevator', () => {
      const nodeMap = new Map<string, NavNode>([
        ['room1', makeNode('room1', 0.5, 0.5, 1)],
        ['elev1', makeNode('elev1', 0.9, 0.5, 1, 'elevator')],
        ['elev2', makeNode('elev2', 0.9, 0.5, 2, 'elevator')],
        ['room2', makeNode('room2', 0.5, 0.5, 2)],
      ]);
      const result = generateDirections(['room1', 'elev1', 'elev2', 'room2'], nodeMap, 'standard', floorMap);
      const elevStep = result.steps.find((s) => s.icon === 'elevator');
      expect(elevStep).toBeDefined();
      expect(elevStep?.instruction).toContain('elevator');
    });

    it('marks elevator/ramp steps as accessible segments', () => {
      const nodeMap = new Map<string, NavNode>([
        ['room1', makeNode('room1', 0.5, 0.5, 1)],
        ['elev1', makeNode('elev1', 0.9, 0.5, 1, 'elevator')],
        ['elev2', makeNode('elev2', 0.9, 0.5, 2, 'elevator')],
        ['room2', makeNode('room2', 0.5, 0.5, 2)],
      ]);
      const result = generateDirections(['room1', 'elev1', 'elev2', 'room2'], nodeMap, 'accessible', floorMap);
      const elevStep = result.steps.find((s) => s.icon === 'elevator');
      expect(elevStep?.isAccessibleSegment).toBe(true);
    });
  });

  describe('accessible mode', () => {
    it('uses slower walking speed in accessible mode', () => {
      const nodeMap = new Map<string, NavNode>([
        ['a', makeNode('a', 0.1, 0.5, 1)],
        ['b', makeNode('b', 0.9, 0.5, 1)],
      ]);
      const standard = generateDirections(['a', 'b'], nodeMap, 'standard', floorMap);
      const accessible = generateDirections(['a', 'b'], nodeMap, 'accessible', floorMap);
      // Accessible mode should have longer duration for same distance
      expect(accessible.steps[0]?.durationSec).toBeGreaterThan(standard.steps[0]?.durationSec ?? 0);
    });
  });

  describe('distance and duration calculations', () => {
    it('calculates total distance from all steps', () => {
      const nodeMap = new Map<string, NavNode>([
        ['a', makeNode('a', 0.1, 0.5, 1)],
        ['b', makeNode('b', 0.5, 0.5, 1)],
        ['c', makeNode('c', 0.9, 0.5, 1)],
      ]);
      const result = generateDirections(['a', 'b', 'c'], nodeMap, 'standard', floorMap);
      const sumDistances = result.steps.reduce((sum, s) => sum + s.distanceM, 0);
      expect(result.totalDistanceNorm).toBeCloseTo(sumDistances, 5);
    });

    it('calculates total duration from all steps', () => {
      const nodeMap = new Map<string, NavNode>([
        ['a', makeNode('a', 0.1, 0.5, 1)],
        ['b', makeNode('b', 0.5, 0.5, 1)],
        ['c', makeNode('c', 0.9, 0.5, 1)],
      ]);
      const result = generateDirections(['a', 'b', 'c'], nodeMap, 'standard', floorMap);
      const sumDuration = result.steps.reduce((sum, s) => sum + s.durationSec, 0);
      expect(result.totalDurationSec).toBeCloseTo(sumDuration, 5);
    });
  });

  describe('edge cases', () => {
    it('handles missing nodes gracefully', () => {
      const nodeMap = new Map<string, NavNode>([
        ['a', makeNode('a', 0.1, 0.5, 1)],
        ['c', makeNode('c', 0.9, 0.5, 1)],
      ]);
      // 'b' is missing
      const result = generateDirections(['a', 'b', 'c'], nodeMap, 'standard', floorMap);
      // Should not crash, returns empty or partial result
      expect(result).toBeDefined();
    });

    it('uses floorId as floorNumber fallback when floorMap is empty', () => {
      const emptyFloorMap = new Map<number, NavFloor>();
      const nodeMap = new Map<string, NavNode>([
        ['a', makeNode('a', 0.1, 0.5, 5)],
        ['b', makeNode('b', 0.9, 0.5, 5)],
      ]);
      const result = generateDirections(['a', 'b'], nodeMap, 'standard', emptyFloorMap);
      expect(result.steps[0]?.floorNumber).toBe(5);
    });
  });
});

describe('routesAreIdentical', () => {
  it('returns true for identical found routes', () => {
    const a: PathResult = {
      found: true,
      nodeIds: ['a', 'b', 'c'],
      totalDistance: 100,
      segments: [],
    };
    const b: PathResult = {
      found: true,
      nodeIds: ['a', 'b', 'c'],
      totalDistance: 100,
      segments: [],
    };
    expect(routesAreIdentical(a, b)).toBe(true);
  });

  it('returns false for routes with different lengths', () => {
    const a: PathResult = { found: true, nodeIds: ['a', 'b', 'c'], totalDistance: 100, segments: [] };
    const b: PathResult = { found: true, nodeIds: ['a', 'c'], totalDistance: 80, segments: [] };
    expect(routesAreIdentical(a, b)).toBe(false);
  });

  it('returns false for routes where one is not found', () => {
    const a: PathResult = { found: true, nodeIds: ['a', 'b', 'c'], totalDistance: 100, segments: [] };
    const b: PathResult = { found: false, nodeIds: [], totalDistance: 0, segments: [] };
    expect(routesAreIdentical(a, b)).toBe(false);
  });

  it('returns false for identical not-found routes', () => {
    const a: PathResult = { found: false, nodeIds: [], totalDistance: 0, segments: [] };
    const b: PathResult = { found: false, nodeIds: [], totalDistance: 0, segments: [] };
    expect(routesAreIdentical(a, b)).toBe(false);
  });
});
