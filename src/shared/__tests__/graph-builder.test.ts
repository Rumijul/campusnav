import { buildGraph, calculateWeight } from '@shared/pathfinding/graph-builder'
import type { NavGraph } from '@shared/types'
import { describe, expect, it } from 'vitest'
import testGraphData from './fixtures/test-graph.json'

const testGraph = testGraphData as NavGraph

describe('buildGraph', () => {
  const graph = buildGraph(testGraph)

  it('builds graph with correct node count', () => {
    expect(graph.getNodesCount()).toBe(7)
  })

  it('preserves node data', () => {
    const entrance = graph.getNode('entrance')
    expect(entrance).toBeDefined()
    expect(entrance?.data).toEqual({
      x: 0.1,
      y: 0.5,
      label: 'Main Entrance',
      type: 'entrance',
      searchable: true,
      floorId: 1,
    })
  })

  it('creates bidirectional links', () => {
    const forward = graph.getLink('entrance', 'hall-1')
    const reverse = graph.getLink('hall-1', 'entrance')
    expect(forward).toBeTruthy()
    expect(reverse).toBeTruthy()
  })

  it('preserves edge data', () => {
    const link = graph.getLink('entrance', 'hall-1')
    expect(link).toBeDefined()
    expect(link?.data).toEqual({
      standardWeight: 0.2,
      accessibleWeight: 0.2,
      accessible: true,
      bidirectional: true,
    })
  })

  it('non-accessible edges have Infinity accessibleWeight', () => {
    const link = graph.getLink('junction-1', 'stairs-1')
    expect(link).toBeDefined()
    expect(link?.data.accessibleWeight).toBe(Number.POSITIVE_INFINITY)
    expect(link?.data.accessible).toBe(false)
  })

  it('isolated node has no links', () => {
    const links = graph.getLinks('isolated-1')
    // ngraph.graph returns null for nodes with no links
    expect(links === null || (links !== null && [...links].length === 0)).toBe(true)
  })
})

describe('calculateWeight', () => {
  it('computes Euclidean distance', () => {
    // Classic 3-4-5 triangle
    expect(calculateWeight(0, 0, 3, 4)).toBe(5)
    // Horizontal distance matching fixture edge e1
    expect(calculateWeight(0.1, 0.5, 0.3, 0.5)).toBeCloseTo(0.2, 10)
  })
})
