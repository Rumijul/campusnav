import type { NavGraph, NavNode } from '@shared/types'
import { describe, expect, it } from 'vitest'
import {
  applyConnectorUpdatesToFloorNodes,
  applyConnectorUpdatesToNavGraph,
  deriveConnectorCandidates,
  type ConnectorUpdatedNode,
} from './connectorLinking'

function makeNode(overrides: Partial<NavNode> & { id: string; floorId: number }): NavNode {
  return {
    id: overrides.id,
    floorId: overrides.floorId,
    x: 0.5,
    y: 0.5,
    label: overrides.label ?? overrides.id,
    type: overrides.type ?? 'room',
    searchable: overrides.searchable ?? true,
    ...overrides,
  }
}

function makeGraph(): NavGraph {
  return {
    buildings: [
      {
        id: 1,
        name: 'Science',
        floors: [
          {
            id: 101,
            floorNumber: 1,
            imagePath: '/science-1.png',
            updatedAt: '2026-01-01T00:00:00Z',
            nodes: [
              makeNode({ id: 'elevator-f1', floorId: 101, type: 'elevator', label: 'F1 Elevator' }),
              makeNode({ id: 'room-f1', floorId: 101, type: 'room', label: 'Room 101' }),
            ],
            edges: [],
          },
          {
            id: 102,
            floorNumber: 2,
            imagePath: '/science-2.png',
            updatedAt: '2026-01-01T00:00:00Z',
            nodes: [
              makeNode({ id: 'stairs-f2-source', floorId: 102, type: 'stairs', label: 'F2 Stairs' }),
              makeNode({ id: 'elevator-f2', floorId: 102, type: 'elevator', label: 'F2 Elevator' }),
            ],
            edges: [],
          },
          {
            id: 103,
            floorNumber: 3,
            imagePath: '/science-3.png',
            updatedAt: '2026-01-01T00:00:00Z',
            nodes: [
              makeNode({ id: 'ramp-f3', floorId: 103, type: 'ramp', label: 'F3 Ramp' }),
              makeNode({ id: 'room-f3', floorId: 103, type: 'room', label: 'Room 301' }),
            ],
            edges: [],
          },
        ],
      },
      {
        id: 2,
        name: 'Library',
        floors: [
          {
            id: 201,
            floorNumber: 2,
            imagePath: '/library-2.png',
            updatedAt: '2026-01-01T00:00:00Z',
            nodes: [
              makeNode({ id: 'elevator-library', floorId: 201, type: 'elevator', label: 'Library Elevator' }),
            ],
            edges: [],
          },
        ],
      },
    ],
  }
}

describe('deriveConnectorCandidates', () => {
  it('returns only same-building adjacent-floor connector candidates', () => {
    const graph = makeGraph()
    const source = graph.buildings[0]?.floors[1]?.nodes[0] ?? null

    const candidates = deriveConnectorCandidates(graph, source)

    expect(candidates.above.map((candidate) => candidate.nodeId)).toEqual(['ramp-f3'])
    expect(candidates.below.map((candidate) => candidate.nodeId)).toEqual(['elevator-f1'])
    expect(candidates.above.map((candidate) => candidate.nodeId)).not.toContain('elevator-library')
    expect(candidates.above.map((candidate) => candidate.nodeId)).not.toContain('elevator-f2')
  })

  it('returns no candidates for non-connector source nodes', () => {
    const graph = makeGraph()
    const source = graph.buildings[0]?.floors[0]?.nodes[1] ?? null

    const candidates = deriveConnectorCandidates(graph, source)

    expect(candidates).toEqual({ above: [], below: [] })
  })
})

describe('applyConnectorUpdatesToFloorNodes', () => {
  it('applies connector patches and clears null fields', () => {
    const source = makeNode({
      id: 'stairs-f2-source',
      floorId: 102,
      type: 'stairs',
      connectsToFloorAboveId: 103,
      connectsToNodeAboveId: 'ramp-f3',
    })
    const untouched = makeNode({ id: 'room-f2', floorId: 102, type: 'room' })
    const nodes = [source, untouched]

    const updates: ConnectorUpdatedNode[] = [
      {
        id: 'stairs-f2-source',
        floorId: 102,
        connectsToFloorAboveId: null,
        connectsToFloorBelowId: 101,
        connectsToNodeAboveId: null,
        connectsToNodeBelowId: 'elevator-f1',
      },
    ]

    const result = applyConnectorUpdatesToFloorNodes(nodes, updates)
    const patchedSource = result[0]

    expect(patchedSource).toMatchObject({
      id: 'stairs-f2-source',
      connectsToFloorBelowId: 101,
      connectsToNodeBelowId: 'elevator-f1',
    })
    expect(patchedSource?.connectsToFloorAboveId).toBeUndefined()
    expect(patchedSource?.connectsToNodeAboveId).toBeUndefined()
    expect(result[1]).toBe(untouched)
  })
})

describe('applyConnectorUpdatesToNavGraph', () => {
  it('patches updated connector nodes across floors while leaving other buildings untouched', () => {
    const graph = makeGraph()

    const updates: ConnectorUpdatedNode[] = [
      {
        id: 'stairs-f2-source',
        floorId: 102,
        connectsToFloorAboveId: 103,
        connectsToFloorBelowId: null,
        connectsToNodeAboveId: 'ramp-f3',
        connectsToNodeBelowId: null,
      },
      {
        id: 'ramp-f3',
        floorId: 103,
        connectsToFloorAboveId: null,
        connectsToFloorBelowId: 102,
        connectsToNodeAboveId: null,
        connectsToNodeBelowId: 'stairs-f2-source',
      },
    ]

    const nextGraph = applyConnectorUpdatesToNavGraph(graph, updates)

    const patchedSource = nextGraph?.buildings[0]?.floors[1]?.nodes.find(
      (node) => node.id === 'stairs-f2-source',
    )
    const patchedTarget = nextGraph?.buildings[0]?.floors[2]?.nodes.find((node) => node.id === 'ramp-f3')

    expect(patchedSource).toMatchObject({
      connectsToFloorAboveId: 103,
      connectsToNodeAboveId: 'ramp-f3',
    })
    expect(patchedSource?.connectsToFloorBelowId).toBeUndefined()
    expect(patchedSource?.connectsToNodeBelowId).toBeUndefined()

    expect(patchedTarget).toMatchObject({
      connectsToFloorBelowId: 102,
      connectsToNodeBelowId: 'stairs-f2-source',
    })

    expect(nextGraph?.buildings[1]).toBe(graph.buildings[1])
  })
})
