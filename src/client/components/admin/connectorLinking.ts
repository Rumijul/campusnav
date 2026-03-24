import type { NavGraph, NavNode, NavNodeType } from '@shared/types'

export type ConnectorDirection = 'above' | 'below'
export type ConnectorNodeType = Extract<NavNodeType, 'stairs' | 'elevator' | 'ramp'>

const CONNECTOR_NODE_TYPES = new Set<ConnectorNodeType>(['stairs', 'elevator', 'ramp'])

export interface ConnectorCandidate {
  nodeId: string
  floorId: number
  floorNumber: number
  buildingId: number
  buildingName: string
  label: string
  nodeType: ConnectorNodeType
}

export interface ConnectorCandidateLists {
  above: ConnectorCandidate[]
  below: ConnectorCandidate[]
}

export interface ConnectorUpdatedNode {
  id: string
  floorId: number
  connectsToFloorAboveId: number | null
  connectsToFloorBelowId: number | null
  connectsToNodeAboveId: string | null
  connectsToNodeBelowId: string | null
}

interface FloorLookup {
  floorId: number
  floorNumber: number
  buildingId: number
  buildingName: string
  nodes: NavNode[]
}

interface ConnectorLookups {
  floorById: Map<number, FloorLookup>
  floorByBuildingAndNumber: Map<string, FloorLookup>
  connectorNodesByFloorId: Map<number, Array<NavNode & { type: ConnectorNodeType }>>
}

function floorKey(buildingId: number, floorNumber: number): string {
  return `${buildingId}:${floorNumber}`
}

export function isConnectorNodeType(type: NavNodeType): type is ConnectorNodeType {
  return CONNECTOR_NODE_TYPES.has(type as ConnectorNodeType)
}

function buildLookups(navGraph: NavGraph): ConnectorLookups {
  const floorById = new Map<number, FloorLookup>()
  const floorByBuildingAndNumber = new Map<string, FloorLookup>()
  const connectorNodesByFloorId = new Map<number, Array<NavNode & { type: ConnectorNodeType }>>()

  for (const building of navGraph.buildings) {
    for (const floor of building.floors) {
      const floorLookup: FloorLookup = {
        floorId: floor.id,
        floorNumber: floor.floorNumber,
        buildingId: building.id,
        buildingName: building.name,
        nodes: floor.nodes,
      }

      floorById.set(floor.id, floorLookup)
      floorByBuildingAndNumber.set(floorKey(building.id, floor.floorNumber), floorLookup)

      connectorNodesByFloorId.set(
        floor.id,
        floor.nodes.filter(
          (node): node is NavNode & { type: ConnectorNodeType } => isConnectorNodeType(node.type),
        ),
      )
    }
  }

  return {
    floorById,
    floorByBuildingAndNumber,
    connectorNodesByFloorId,
  }
}

function toCandidates(
  floor: FloorLookup | undefined,
  sourceNodeId: string,
  connectorNodesByFloorId: Map<number, Array<NavNode & { type: ConnectorNodeType }>>,
): ConnectorCandidate[] {
  if (!floor) return []

  const nodes = connectorNodesByFloorId.get(floor.floorId) ?? []

  return nodes
    .filter((node) => node.id !== sourceNodeId)
    .map((node) => ({
      nodeId: node.id,
      floorId: floor.floorId,
      floorNumber: floor.floorNumber,
      buildingId: floor.buildingId,
      buildingName: floor.buildingName,
      label: node.label,
      nodeType: node.type,
    }))
    .sort((left, right) => {
      if (left.floorNumber !== right.floorNumber) {
        return left.floorNumber - right.floorNumber
      }

      const labelCmp = left.label.localeCompare(right.label)
      if (labelCmp !== 0) return labelCmp

      return left.nodeId.localeCompare(right.nodeId)
    })
}

export function deriveConnectorCandidates(
  navGraph: NavGraph | null,
  sourceNode: NavNode | null,
): ConnectorCandidateLists {
  if (!navGraph || !sourceNode || !isConnectorNodeType(sourceNode.type)) {
    return { above: [], below: [] }
  }

  const lookups = buildLookups(navGraph)
  const sourceFloor = lookups.floorById.get(sourceNode.floorId)
  if (!sourceFloor) {
    return { above: [], below: [] }
  }

  const aboveFloor = lookups.floorByBuildingAndNumber.get(
    floorKey(sourceFloor.buildingId, sourceFloor.floorNumber + 1),
  )
  const belowFloor = lookups.floorByBuildingAndNumber.get(
    floorKey(sourceFloor.buildingId, sourceFloor.floorNumber - 1),
  )

  return {
    above: toCandidates(aboveFloor, sourceNode.id, lookups.connectorNodesByFloorId),
    below: toCandidates(belowFloor, sourceNode.id, lookups.connectorNodesByFloorId),
  }
}

function applyConnectorPatch(node: NavNode, update: ConnectorUpdatedNode): NavNode {
  const {
    connectsToFloorAboveId: _oldAboveFloorId,
    connectsToFloorBelowId: _oldBelowFloorId,
    connectsToNodeAboveId: _oldAboveNodeId,
    connectsToNodeBelowId: _oldBelowNodeId,
    ...baseNode
  } = node

  return {
    ...baseNode,
    ...(update.connectsToFloorAboveId !== null
      ? { connectsToFloorAboveId: update.connectsToFloorAboveId }
      : {}),
    ...(update.connectsToFloorBelowId !== null
      ? { connectsToFloorBelowId: update.connectsToFloorBelowId }
      : {}),
    ...(update.connectsToNodeAboveId !== null
      ? { connectsToNodeAboveId: update.connectsToNodeAboveId }
      : {}),
    ...(update.connectsToNodeBelowId !== null
      ? { connectsToNodeBelowId: update.connectsToNodeBelowId }
      : {}),
  }
}

export function applyConnectorUpdatesToFloorNodes(
  nodes: NavNode[],
  updatedNodes: ConnectorUpdatedNode[],
): NavNode[] {
  if (updatedNodes.length === 0) return nodes

  const updatesByNodeId = new Map(updatedNodes.map((node) => [node.id, node]))
  let hasChanges = false

  const nextNodes = nodes.map((node) => {
    const update = updatesByNodeId.get(node.id)
    if (!update) return node

    hasChanges = true
    return applyConnectorPatch(node, update)
  })

  return hasChanges ? nextNodes : nodes
}

export function applyConnectorUpdatesToNavGraph(
  navGraph: NavGraph | null,
  updatedNodes: ConnectorUpdatedNode[],
): NavGraph | null {
  if (!navGraph || updatedNodes.length === 0) return navGraph

  const updatesByNodeId = new Map(updatedNodes.map((node) => [node.id, node]))
  const affectedFloorIds = new Set(updatedNodes.map((node) => node.floorId))
  let graphChanged = false

  const nextBuildings = navGraph.buildings.map((building) => {
    let buildingChanged = false

    const nextFloors = building.floors.map((floor) => {
      if (!affectedFloorIds.has(floor.id)) {
        return floor
      }

      const nextNodes = floor.nodes.map((node) => {
        const update = updatesByNodeId.get(node.id)
        if (!update) return node

        buildingChanged = true
        return applyConnectorPatch(node, update)
      })

      if (!buildingChanged) {
        return floor
      }

      return {
        ...floor,
        nodes: nextNodes,
      }
    })

    if (!buildingChanged) {
      return building
    }

    graphChanged = true

    return {
      ...building,
      floors: nextFloors,
    }
  })

  if (!graphChanged) {
    return navGraph
  }

  return {
    buildings: nextBuildings,
  }
}

export function formatConnectorCandidateLabel(candidate: ConnectorCandidate): string {
  const displayLabel = candidate.label.trim().length > 0 ? candidate.label : candidate.nodeId
  const nodeTypeLabel = candidate.nodeType[0].toUpperCase() + candidate.nodeType.slice(1)
  return `Floor ${candidate.floorNumber} · ${displayLabel} (${nodeTypeLabel})`
}
