import { describe, expect, it } from 'vitest'
import {
  type ConnectorFloorRecord,
  type ConnectorLinkStore,
  type ConnectorLinkStoreTx,
  type ConnectorNodeRecord,
  ConnectorLinkingError,
  linkConnectorNodes,
} from './connectorLinking'

interface InMemoryStore {
  store: ConnectorLinkStore
  getNode(nodeId: string): ConnectorNodeRecord | null
  snapshotNodes(): ConnectorNodeRecord[]
}

const DEFAULT_FLOORS: ConnectorFloorRecord[] = [
  { id: 101, buildingId: 1, floorNumber: 1 },
  { id: 102, buildingId: 1, floorNumber: 2 },
  { id: 103, buildingId: 1, floorNumber: 3 },
  { id: 201, buildingId: 2, floorNumber: 2 },
]

function makeNode(
  id: string,
  floorId: number,
  type: ConnectorNodeRecord['type'] = 'stairs',
  overrides: Partial<ConnectorNodeRecord> = {},
): ConnectorNodeRecord {
  return {
    id,
    type,
    floorId,
    connectsToFloorAboveId: null,
    connectsToFloorBelowId: null,
    connectsToNodeAboveId: null,
    connectsToNodeBelowId: null,
    ...overrides,
  }
}

function cloneNode(node: ConnectorNodeRecord): ConnectorNodeRecord {
  return { ...node }
}

function createInMemoryStore(options: {
  nodes: ConnectorNodeRecord[]
  floors?: ConnectorFloorRecord[]
}): InMemoryStore {
  const floorMap = new Map(
    (options.floors ?? DEFAULT_FLOORS).map((floor) => [floor.id, { ...floor }]),
  )

  let committedNodes = new Map(
    options.nodes.map((node) => [node.id, cloneNode(node)]),
  )

  const buildTransaction = (
    workingNodes: Map<string, ConnectorNodeRecord>,
  ): ConnectorLinkStoreTx => ({
    async getNodeById(nodeId) {
      const node = workingNodes.get(nodeId)
      return node ? cloneNode(node) : null
    },

    async getFloorById(floorId) {
      const floor = floorMap.get(floorId)
      return floor ? { ...floor } : null
    },

    async updateNodeById(nodeId, patch) {
      const current = workingNodes.get(nodeId)
      if (!current) {
        throw new Error(`Unknown node ${nodeId}`)
      }

      const next = { ...current, ...patch }
      workingNodes.set(nodeId, next)

      return {
        id: next.id,
        floorId: next.floorId,
        connectsToFloorAboveId: next.connectsToFloorAboveId,
        connectsToFloorBelowId: next.connectsToFloorBelowId,
        connectsToNodeAboveId: next.connectsToNodeAboveId,
        connectsToNodeBelowId: next.connectsToNodeBelowId,
      }
    },
  })

  const store: ConnectorLinkStore = {
    async transaction(callback) {
      const workingNodes = new Map(
        Array.from(committedNodes.entries()).map(([id, node]) => [id, cloneNode(node)]),
      )

      try {
        const result = await callback(buildTransaction(workingNodes))
        committedNodes = workingNodes
        return result
      } catch (error) {
        throw error
      }
    },
  }

  return {
    store,
    getNode(nodeId) {
      const node = committedNodes.get(nodeId)
      return node ? cloneNode(node) : null
    },
    snapshotNodes() {
      return Array.from(committedNodes.values())
        .map((node) => cloneNode(node))
        .sort((left, right) => left.id.localeCompare(right.id))
    },
  }
}

describe('linkConnectorNodes', () => {
  it('links source and target connectors atomically', async () => {
    const source = makeNode('stairs-f1-a', 101)
    const target = makeNode('stairs-f2-a', 102)
    const memory = createInMemoryStore({ nodes: [source, target] })

    const result = await linkConnectorNodes(
      {
        sourceNodeId: source.id,
        direction: 'above',
        targetNodeId: target.id,
      },
      { store: memory.store },
    )

    expect(result.ok).toBe(true)
    expect(result.updatedNodes).toHaveLength(2)

    expect(memory.getNode(source.id)).toMatchObject({
      connectsToNodeAboveId: target.id,
      connectsToFloorAboveId: 102,
      connectsToNodeBelowId: null,
      connectsToFloorBelowId: null,
    })

    expect(memory.getNode(target.id)).toMatchObject({
      connectsToNodeBelowId: source.id,
      connectsToFloorBelowId: 101,
      connectsToNodeAboveId: null,
      connectsToFloorAboveId: null,
    })
  })

  it('relinks and clears stale reciprocal links for both displaced connectors', async () => {
    const source = makeNode('stairs-f1-source', 101, 'stairs', {
      connectsToNodeAboveId: 'stairs-f2-old',
      connectsToFloorAboveId: 102,
    })
    const oldTarget = makeNode('stairs-f2-old', 102, 'stairs', {
      connectsToNodeBelowId: source.id,
      connectsToFloorBelowId: 101,
    })

    const newTarget = makeNode('stairs-f2-new', 102, 'stairs', {
      connectsToNodeBelowId: 'stairs-f1-displaced',
      connectsToFloorBelowId: 101,
    })

    const displacedSource = makeNode('stairs-f1-displaced', 101, 'stairs', {
      connectsToNodeAboveId: newTarget.id,
      connectsToFloorAboveId: 102,
    })

    const memory = createInMemoryStore({
      nodes: [source, oldTarget, newTarget, displacedSource],
    })

    const result = await linkConnectorNodes(
      {
        sourceNodeId: source.id,
        direction: 'above',
        targetNodeId: newTarget.id,
      },
      { store: memory.store },
    )

    expect(result.ok).toBe(true)
    expect(result.updatedNodes).toHaveLength(4)

    expect(memory.getNode(source.id)).toMatchObject({
      connectsToNodeAboveId: newTarget.id,
      connectsToFloorAboveId: 102,
    })

    expect(memory.getNode(newTarget.id)).toMatchObject({
      connectsToNodeBelowId: source.id,
      connectsToFloorBelowId: 101,
    })

    expect(memory.getNode(oldTarget.id)).toMatchObject({
      connectsToNodeBelowId: null,
      connectsToFloorBelowId: null,
    })

    expect(memory.getNode(displacedSource.id)).toMatchObject({
      connectsToNodeAboveId: null,
      connectsToFloorAboveId: null,
    })
  })

  it('unlinks and clears both sides of an existing connector pair', async () => {
    const source = makeNode('stairs-f1-unlink', 101, 'stairs', {
      connectsToNodeAboveId: 'stairs-f2-unlink',
      connectsToFloorAboveId: 102,
    })

    const target = makeNode('stairs-f2-unlink', 102, 'stairs', {
      connectsToNodeBelowId: source.id,
      connectsToFloorBelowId: 101,
    })

    const memory = createInMemoryStore({ nodes: [source, target] })

    const result = await linkConnectorNodes(
      {
        sourceNodeId: source.id,
        direction: 'above',
        targetNodeId: null,
      },
      { store: memory.store },
    )

    expect(result.ok).toBe(true)
    expect(result.updatedNodes).toHaveLength(2)

    expect(memory.getNode(source.id)).toMatchObject({
      connectsToNodeAboveId: null,
      connectsToFloorAboveId: null,
    })

    expect(memory.getNode(target.id)).toMatchObject({
      connectsToNodeBelowId: null,
      connectsToFloorBelowId: null,
    })
  })

  it('returns LINK_VALIDATION_ERROR when direction/floor pairing is invalid', async () => {
    const source = makeNode('stairs-f2-direction', 102)
    const target = makeNode('stairs-f1-direction', 101)
    const memory = createInMemoryStore({ nodes: [source, target] })
    const before = memory.snapshotNodes()

    await expect(
      linkConnectorNodes(
        {
          sourceNodeId: source.id,
          direction: 'above',
          targetNodeId: target.id,
        },
        { store: memory.store },
      ),
    ).rejects.toMatchObject<Partial<ConnectorLinkingError>>({
      code: 'LINK_VALIDATION_ERROR',
    })

    expect(memory.snapshotNodes()).toEqual(before)
  })

  it('rejects same-floor links and leaves state unchanged', async () => {
    const source = makeNode('stairs-f1-same-floor-source', 101)
    const target = makeNode('stairs-f1-same-floor-target', 101)
    const memory = createInMemoryStore({ nodes: [source, target] })
    const before = memory.snapshotNodes()

    await expect(
      linkConnectorNodes(
        {
          sourceNodeId: source.id,
          direction: 'above',
          targetNodeId: target.id,
        },
        { store: memory.store },
      ),
    ).rejects.toMatchObject<Partial<ConnectorLinkingError>>({
      code: 'LINK_VALIDATION_ERROR',
    })

    expect(memory.snapshotNodes()).toEqual(before)
  })

  it('rejects cross-building links and leaves state unchanged', async () => {
    const source = makeNode('stairs-building-a', 101)
    const target = makeNode('stairs-building-b', 201)
    const memory = createInMemoryStore({ nodes: [source, target] })
    const before = memory.snapshotNodes()

    await expect(
      linkConnectorNodes(
        {
          sourceNodeId: source.id,
          direction: 'above',
          targetNodeId: target.id,
        },
        { store: memory.store },
      ),
    ).rejects.toMatchObject<Partial<ConnectorLinkingError>>({
      code: 'LINK_VALIDATION_ERROR',
    })

    expect(memory.snapshotNodes()).toEqual(before)
  })

  it('rejects non-connector target nodes and leaves state unchanged', async () => {
    const source = makeNode('stairs-f1', 101)
    const target = makeNode('room-f2', 102, 'room')
    const memory = createInMemoryStore({ nodes: [source, target] })
    const before = memory.snapshotNodes()

    await expect(
      linkConnectorNodes(
        {
          sourceNodeId: source.id,
          direction: 'above',
          targetNodeId: target.id,
        },
        { store: memory.store },
      ),
    ).rejects.toMatchObject<Partial<ConnectorLinkingError>>({
      code: 'TARGET_NOT_CONNECTOR',
    })

    expect(memory.snapshotNodes()).toEqual(before)
  })
})
