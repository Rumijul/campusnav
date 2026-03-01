import { PathfindingEngine } from '@shared/pathfinding/engine'
import type { NavGraph } from '@shared/types'
import { describe, expect, it } from 'vitest'
import multiFloorGraphData from './fixtures/multi-floor-test-graph.json'
import testGraphData from './fixtures/test-graph.json'

const testGraph = testGraphData as NavGraph
const multiFloorGraph = multiFloorGraphData as NavGraph

describe('PathfindingEngine', () => {
  const engine = new PathfindingEngine(testGraph)

  describe('standard shortest path (ROUT-01)', () => {
    it('finds shortest standard route through stairs', () => {
      const result = engine.findRoute('entrance', 'room-101', 'standard')

      expect(result.found).toBe(true)
      expect(result.nodeIds).toEqual(['entrance', 'hall-1', 'junction-1', 'stairs-1', 'room-101'])
      // entrance→hall-1: 0.2, hall-1→junction-1: 0.2, junction-1→stairs-1: 0.2, stairs-1→room-101: 0.2
      expect(result.totalDistance).toBeCloseTo(0.8, 5)
      expect(result.segments).toHaveLength(4)
    })
  })

  describe('accessible path avoids stairs (ROUT-02)', () => {
    it('finds accessible route through elevator', () => {
      const result = engine.findRoute('entrance', 'room-101', 'accessible')

      expect(result.found).toBe(true)
      expect(result.nodeIds).toEqual(['entrance', 'hall-1', 'junction-1', 'elevator-1', 'room-101'])
      // entrance→hall-1: 0.2, hall-1→junction-1: 0.2, junction-1→elevator-1: 0.2, elevator-1→room-101: ~0.4472
      expect(result.totalDistance).toBeCloseTo(0.2 + 0.2 + 0.2 + 0.4472135955, 5)
      expect(result.segments).toHaveLength(4)
    })
  })

  describe('accessible path is longer than standard', () => {
    it('accessible route has greater total distance', () => {
      const standard = engine.findRoute('entrance', 'room-101', 'standard')
      const accessible = engine.findRoute('entrance', 'room-101', 'accessible')

      expect(standard.found).toBe(true)
      expect(accessible.found).toBe(true)
      expect(accessible.totalDistance).toBeGreaterThan(standard.totalDistance)
    })
  })

  describe('disconnected graph returns not-found', () => {
    it('returns not-found for isolated node', () => {
      const result = engine.findRoute('entrance', 'isolated-1', 'standard')

      expect(result.found).toBe(false)
      expect(result.nodeIds).toEqual([])
      expect(result.totalDistance).toBe(0)
      expect(result.segments).toEqual([])
    })
  })

  describe('same start and destination', () => {
    it('returns single-node path with zero distance', () => {
      const result = engine.findRoute('entrance', 'entrance', 'standard')

      expect(result.found).toBe(true)
      expect(result.nodeIds).toEqual(['entrance'])
      expect(result.totalDistance).toBe(0)
      expect(result.segments).toEqual([])
    })
  })

  describe('non-existent node ID returns not-found', () => {
    it('handles non-existent source node', () => {
      const result = engine.findRoute('nonexistent', 'room-101', 'standard')

      expect(result.found).toBe(false)
      expect(result.nodeIds).toEqual([])
      expect(result.totalDistance).toBe(0)
      expect(result.segments).toEqual([])
    })

    it('handles non-existent target node', () => {
      const result = engine.findRoute('entrance', 'nonexistent', 'standard')

      expect(result.found).toBe(false)
      expect(result.nodeIds).toEqual([])
      expect(result.totalDistance).toBe(0)
      expect(result.segments).toEqual([])
    })
  })

  describe('all-accessible graph: both modes return same path', () => {
    it('returns same path when all edges are accessible', () => {
      // entrance → hall-1 only uses accessible edges
      const standard = engine.findRoute('entrance', 'hall-1', 'standard')
      const accessible = engine.findRoute('entrance', 'hall-1', 'accessible')

      expect(standard.found).toBe(true)
      expect(accessible.found).toBe(true)
      expect(accessible.nodeIds).toEqual(standard.nodeIds)
    })
  })

  describe('performance: under 50ms for 500-node graph', () => {
    it('completes pathfinding on 500-node grid in under 50ms', () => {
      // Generate a 25×20 grid graph (500 nodes)
      const gridGraph = generateGridGraph(25, 20)
      const gridEngine = new PathfindingEngine(gridGraph)

      const start = performance.now()
      const result = gridEngine.findRoute('node-0-0', 'node-24-19', 'standard')
      const elapsed = performance.now() - start

      expect(result.found).toBe(true)
      expect(result.nodeIds.length).toBeGreaterThan(1)
      expect(elapsed).toBeLessThan(50)
    })
  })

  describe('segment structure', () => {
    it('produces correct segment details for each edge', () => {
      const result = engine.findRoute('entrance', 'hall-1', 'standard')

      expect(result.found).toBe(true)
      expect(result.segments).toEqual([{ fromId: 'entrance', toId: 'hall-1', distance: 0.2 }])
    })
  })
})

describe('PathfindingEngine — cross-floor routing (MFLR-03)', () => {
  const multiFloorEngine = new PathfindingEngine(multiFloorGraph)

  describe('Test 1: standard mode finds cross-floor path via stairs', () => {
    it('routes entrance → room-201 through stairs connector', () => {
      const result = multiFloorEngine.findRoute('entrance', 'room-201', 'standard')

      expect(result.found).toBe(true)
      expect(result.nodeIds).toContain('stairs-f1')
      expect(result.nodeIds).toContain('stairs-f2')
      // stairs-f1 must appear before stairs-f2 in the path
      const stairsF1Idx = result.nodeIds.indexOf('stairs-f1')
      const stairsF2Idx = result.nodeIds.indexOf('stairs-f2')
      expect(stairsF1Idx).toBeLessThan(stairsF2Idx)
      expect(result.totalDistance).toBeGreaterThan(0)
    })
  })

  describe('Test 2: accessible mode finds cross-floor path via elevator', () => {
    it('routes entrance → room-201 through elevator connector, avoiding stairs', () => {
      const result = multiFloorEngine.findRoute('entrance', 'room-201', 'accessible')

      expect(result.found).toBe(true)
      expect(result.nodeIds).toContain('elevator-f1')
      expect(result.nodeIds).toContain('elevator-f2')
      // elevator-f1 must appear before elevator-f2 in the path
      const elevF1Idx = result.nodeIds.indexOf('elevator-f1')
      const elevF2Idx = result.nodeIds.indexOf('elevator-f2')
      expect(elevF1Idx).toBeLessThan(elevF2Idx)
      expect(result.nodeIds).not.toContain('stairs-f1')
      expect(result.nodeIds).not.toContain('stairs-f2')
    })
  })

  describe('Test 3: accessible mode returns not-found when only stairs exist between floors', () => {
    it('returns not-found when only stairs connector links the floors', () => {
      // Single-connector graph: entrance → stairs-only-f1 --(stairs inter-floor)--> stairs-only-f2 → dest
      const stairsOnlyGraph: NavGraph = {
        buildings: [
          {
            id: 1,
            name: 'Stairs-Only Building',
            floors: [
              {
                id: 1,
                floorNumber: 1,
                imagePath: 'floor-1.png',
                updatedAt: '2026-01-01T00:00:00Z',
                nodes: [
                  {
                    id: 'start',
                    x: 0.1,
                    y: 0.5,
                    label: 'Start',
                    type: 'hallway',
                    searchable: true,
                    floorId: 1,
                  },
                  {
                    id: 'stairs-only-f1',
                    x: 0.5,
                    y: 0.5,
                    label: 'Stairs F1',
                    type: 'stairs',
                    searchable: false,
                    floorId: 1,
                    connectsToFloorAboveId: 2,
                    connectsToNodeAboveId: 'stairs-only-f2',
                  },
                ],
                edges: [
                  {
                    id: 'se1',
                    sourceId: 'start',
                    targetId: 'stairs-only-f1',
                    standardWeight: 0.2,
                    accessibleWeight: 1e10,
                    accessible: false,
                    bidirectional: true,
                  },
                ],
              },
              {
                id: 2,
                floorNumber: 2,
                imagePath: 'floor-2.png',
                updatedAt: '2026-01-01T00:00:00Z',
                nodes: [
                  {
                    id: 'stairs-only-f2',
                    x: 0.5,
                    y: 0.5,
                    label: 'Stairs F2',
                    type: 'stairs',
                    searchable: false,
                    floorId: 2,
                    connectsToFloorBelowId: 1,
                    connectsToNodeBelowId: 'stairs-only-f1',
                  },
                  {
                    id: 'dest',
                    x: 0.8,
                    y: 0.5,
                    label: 'Destination',
                    type: 'room',
                    searchable: true,
                    floorId: 2,
                  },
                ],
                edges: [
                  {
                    id: 'se2',
                    sourceId: 'stairs-only-f2',
                    targetId: 'dest',
                    standardWeight: 0.3,
                    accessibleWeight: 1e10,
                    accessible: false,
                    bidirectional: true,
                  },
                ],
              },
            ],
          },
        ],
      }
      const stairsOnlyEngine = new PathfindingEngine(stairsOnlyGraph)
      const result = stairsOnlyEngine.findRoute('start', 'dest', 'accessible')

      expect(result.found).toBe(false)
    })
  })

  describe('Test 4: same-floor routing still works after heuristic change', () => {
    it('routes within floor 1 correctly', () => {
      const result = multiFloorEngine.findRoute('entrance', 'corridor-1', 'standard')

      expect(result.found).toBe(true)
      expect(result.nodeIds).toEqual(['entrance', 'corridor-1'])
    })
  })

  describe('Test 5: cross-floor path has correct segment count', () => {
    it('entrance → corridor-1 → stairs-f1 → stairs-f2 → room-201 = 4 segments', () => {
      const result = multiFloorEngine.findRoute('entrance', 'room-201', 'standard')

      expect(result.found).toBe(true)
      // Path must be: entrance → corridor-1 → stairs-f1 → stairs-f2 → room-201
      expect(result.nodeIds).toEqual(['entrance', 'corridor-1', 'stairs-f1', 'stairs-f2', 'room-201'])
      expect(result.segments).toHaveLength(4)
    })
  })
})

/**
 * Generates a grid graph with cols×rows nodes and edges to adjacent nodes.
 * Each node connects to its right and bottom neighbor (bidirectional).
 * Returns a NavGraph in the multi-floor format (buildings → floors → nodes/edges).
 */
function generateGridGraph(cols: number, rows: number): NavGraph {
  const nodes: NavGraph['buildings'][number]['floors'][number]['nodes'] = []
  const edges: NavGraph['buildings'][number]['floors'][number]['edges'] = []
  let edgeId = 0

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      nodes.push({
        id: `node-${x}-${y}`,
        x: x / (cols - 1),
        y: y / (rows - 1),
        label: `Node ${x},${y}`,
        type: 'hallway',
        searchable: false,
        floorId: 1,
      })
    }
  }

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      // Right neighbor
      if (x + 1 < cols) {
        const dx = 1 / (cols - 1)
        edges.push({
          id: `e-${edgeId++}`,
          sourceId: `node-${x}-${y}`,
          targetId: `node-${x + 1}-${y}`,
          standardWeight: dx,
          accessibleWeight: dx,
          accessible: true,
          bidirectional: true,
        })
      }
      // Bottom neighbor
      if (y + 1 < rows) {
        const dy = 1 / (rows - 1)
        edges.push({
          id: `e-${edgeId++}`,
          sourceId: `node-${x}-${y}`,
          targetId: `node-${x}-${y + 1}`,
          standardWeight: dy,
          accessibleWeight: dy,
          accessible: true,
          bidirectional: true,
        })
      }
    }
  }

  return {
    buildings: [
      {
        id: 1,
        name: 'Grid Test Building',
        floors: [
          {
            id: 1,
            floorNumber: 1,
            imagePath: 'floor-plan.png',
            updatedAt: '2026-01-01T00:00:00Z',
            nodes,
            edges,
          },
        ],
      },
    ],
  }
}
