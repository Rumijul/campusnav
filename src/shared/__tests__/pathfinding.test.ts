import { PathfindingEngine } from '@shared/pathfinding/engine'
import type { NavGraph } from '@shared/types'
import { describe, expect, it } from 'vitest'
import testGraphData from './fixtures/test-graph.json'

const testGraph = testGraphData as NavGraph

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

/**
 * Generates a grid graph with cols×rows nodes and edges to adjacent nodes.
 * Each node connects to its right and bottom neighbor (bidirectional).
 */
function generateGridGraph(cols: number, rows: number): NavGraph {
  const nodes: NavGraph['nodes'] = []
  const edges: NavGraph['edges'] = []
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
        floor: 1,
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
    nodes,
    edges,
    metadata: {
      buildingName: 'Grid Test Building',
      floor: 1,
      lastUpdated: '2026-01-01T00:00:00Z',
    },
  }
}
