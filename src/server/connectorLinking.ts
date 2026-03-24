import type { NavNodeType } from '@shared/types'
import { eq } from 'drizzle-orm'
import { db } from './db/client'
import { floors, nodes } from './db/schema'

export type ConnectorDirection = 'above' | 'below'

type NodeConnectorField = 'connectsToNodeAboveId' | 'connectsToNodeBelowId'
type FloorConnectorField = 'connectsToFloorAboveId' | 'connectsToFloorBelowId'

type ConnectorNodeType = Extract<NavNodeType, 'stairs' | 'elevator' | 'ramp'>

const CONNECTOR_NODE_TYPES = new Set<ConnectorNodeType>(['stairs', 'elevator', 'ramp'])

export type ConnectorLinkErrorCode =
  | 'INVALID_REQUEST'
  | 'SOURCE_NOT_FOUND'
  | 'TARGET_NOT_FOUND'
  | 'SOURCE_NOT_CONNECTOR'
  | 'TARGET_NOT_CONNECTOR'
  | 'LINK_VALIDATION_ERROR'

type ConnectorLinkErrorStatus = 400 | 404

const CONNECTOR_LINK_ERROR_STATUS = {
  INVALID_REQUEST: 400,
  SOURCE_NOT_FOUND: 404,
  TARGET_NOT_FOUND: 404,
  SOURCE_NOT_CONNECTOR: 400,
  TARGET_NOT_CONNECTOR: 400,
  LINK_VALIDATION_ERROR: 400,
} as const satisfies Record<ConnectorLinkErrorCode, ConnectorLinkErrorStatus>

export class ConnectorLinkingError extends Error {
  readonly code: ConnectorLinkErrorCode
  readonly status: ConnectorLinkErrorStatus

  constructor(code: ConnectorLinkErrorCode, message: string) {
    super(message)
    this.name = 'ConnectorLinkingError'
    this.code = code
    this.status = CONNECTOR_LINK_ERROR_STATUS[code]
  }
}

export interface ConnectorLinkRequest {
  sourceNodeId: string
  direction: ConnectorDirection
  targetNodeId: string | null
}

export interface ConnectorNodeUpdate {
  id: string
  floorId: number
  connectsToFloorAboveId: number | null
  connectsToFloorBelowId: number | null
  connectsToNodeAboveId: string | null
  connectsToNodeBelowId: string | null
}

export interface ConnectorLinkResult {
  ok: true
  updatedNodes: ConnectorNodeUpdate[]
}

export interface ConnectorNodeRecord extends ConnectorNodeUpdate {
  type: string
}

export interface ConnectorFloorRecord {
  id: number
  buildingId: number
  floorNumber: number
}

type ConnectorNodePatch = Partial<Pick<
  ConnectorNodeUpdate,
  | 'connectsToFloorAboveId'
  | 'connectsToFloorBelowId'
  | 'connectsToNodeAboveId'
  | 'connectsToNodeBelowId'
>>

interface DirectionSpec {
  sourceNodeField: NodeConnectorField
  sourceFloorField: FloorConnectorField
  counterpartNodeField: NodeConnectorField
  counterpartFloorField: FloorConnectorField
}

export interface ConnectorLinkStoreTx {
  getNodeById(nodeId: string): Promise<ConnectorNodeRecord | null>
  getFloorById(floorId: number): Promise<ConnectorFloorRecord | null>
  updateNodeById(nodeId: string, patch: ConnectorNodePatch): Promise<ConnectorNodeUpdate>
}

export interface ConnectorLinkStore {
  transaction<T>(callback: (tx: ConnectorLinkStoreTx) => Promise<T>): Promise<T>
}

type DrizzleConnectorTx = Pick<typeof db, 'select' | 'update'>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isConnectorNodeType(nodeType: string): nodeType is ConnectorNodeType {
  return CONNECTOR_NODE_TYPES.has(nodeType as ConnectorNodeType)
}

function directionSpec(direction: ConnectorDirection): DirectionSpec {
  if (direction === 'above') {
    return {
      sourceNodeField: 'connectsToNodeAboveId',
      sourceFloorField: 'connectsToFloorAboveId',
      counterpartNodeField: 'connectsToNodeBelowId',
      counterpartFloorField: 'connectsToFloorBelowId',
    }
  }

  return {
    sourceNodeField: 'connectsToNodeBelowId',
    sourceFloorField: 'connectsToFloorBelowId',
    counterpartNodeField: 'connectsToNodeAboveId',
    counterpartFloorField: 'connectsToFloorAboveId',
  }
}

function getRequiredStringField(
  body: Record<string, unknown>,
  fieldName: string,
): string {
  const rawValue = body[fieldName]
  if (typeof rawValue !== 'string') {
    throw new ConnectorLinkingError('INVALID_REQUEST', `${fieldName} must be a string`)
  }

  const value = rawValue.trim()
  if (value.length === 0) {
    throw new ConnectorLinkingError('INVALID_REQUEST', `${fieldName} is required`)
  }

  return value
}

function getTargetNodeId(body: Record<string, unknown>): string | null {
  if (!Object.hasOwn(body, 'targetNodeId')) {
    return null
  }

  const rawValue = body.targetNodeId
  if (rawValue === null || rawValue === undefined) {
    return null
  }

  if (typeof rawValue !== 'string') {
    throw new ConnectorLinkingError('INVALID_REQUEST', 'targetNodeId must be a string or null')
  }

  const value = rawValue.trim()
  return value.length === 0 ? null : value
}

export function parseConnectorLinkRequest(payload: unknown): ConnectorLinkRequest {
  if (!isRecord(payload)) {
    throw new ConnectorLinkingError('INVALID_REQUEST', 'Request body must be a JSON object')
  }

  const sourceNodeId = getRequiredStringField(payload, 'sourceNodeId')
  const directionRaw = getRequiredStringField(payload, 'direction')

  if (directionRaw !== 'above' && directionRaw !== 'below') {
    throw new ConnectorLinkingError('INVALID_REQUEST', 'direction must be "above" or "below"')
  }

  return {
    sourceNodeId,
    direction: directionRaw,
    targetNodeId: getTargetNodeId(payload),
  }
}

function createDrizzleStoreTx(tx: DrizzleConnectorTx): ConnectorLinkStoreTx {
  return {
    async getNodeById(nodeId) {
      const [row] = await tx
        .select({
          id: nodes.id,
          type: nodes.type,
          floorId: nodes.floorId,
          connectsToFloorAboveId: nodes.connectsToFloorAboveId,
          connectsToFloorBelowId: nodes.connectsToFloorBelowId,
          connectsToNodeAboveId: nodes.connectsToNodeAboveId,
          connectsToNodeBelowId: nodes.connectsToNodeBelowId,
        })
        .from(nodes)
        .where(eq(nodes.id, nodeId))
        .limit(1)

      return row ?? null
    },

    async getFloorById(floorId) {
      const [row] = await tx
        .select({ id: floors.id, buildingId: floors.buildingId, floorNumber: floors.floorNumber })
        .from(floors)
        .where(eq(floors.id, floorId))
        .limit(1)

      return row ?? null
    },

    async updateNodeById(nodeId, patch) {
      const [updatedRow] = await tx
        .update(nodes)
        .set(patch)
        .where(eq(nodes.id, nodeId))
        .returning({
          id: nodes.id,
          floorId: nodes.floorId,
          connectsToFloorAboveId: nodes.connectsToFloorAboveId,
          connectsToFloorBelowId: nodes.connectsToFloorBelowId,
          connectsToNodeAboveId: nodes.connectsToNodeAboveId,
          connectsToNodeBelowId: nodes.connectsToNodeBelowId,
        })

      if (!updatedRow) {
        throw new ConnectorLinkingError('LINK_VALIDATION_ERROR', `Node ${nodeId} no longer exists`)
      }

      return updatedRow
    },
  }
}

const drizzleConnectorStore: ConnectorLinkStore = {
  transaction(callback) {
    return db.transaction(async (tx) => callback(createDrizzleStoreTx(tx)))
  },
}

function createDirectionalPatch(
  nodeField: NodeConnectorField,
  nodeId: string | null,
  floorField: FloorConnectorField,
  floorId: number | null,
): ConnectorNodePatch {
  return {
    [nodeField]: nodeId,
    [floorField]: floorId,
  } as ConnectorNodePatch
}

function mergePatch(
  patchMap: Map<string, ConnectorNodePatch>,
  nodeId: string,
  patch: ConnectorNodePatch,
): void {
  const existing = patchMap.get(nodeId)
  if (!existing) {
    patchMap.set(nodeId, patch)
    return
  }

  patchMap.set(nodeId, { ...existing, ...patch })
}

async function applyPatches(
  tx: ConnectorLinkStoreTx,
  patchMap: Map<string, ConnectorNodePatch>,
): Promise<ConnectorNodeUpdate[]> {
  const updatedNodes: ConnectorNodeUpdate[] = []

  for (const [nodeId, patch] of patchMap) {
    updatedNodes.push(await tx.updateNodeById(nodeId, patch))
  }

  updatedNodes.sort((a, b) => a.id.localeCompare(b.id))
  return updatedNodes
}

function validateFloorDirection(
  sourceFloor: ConnectorFloorRecord,
  targetFloor: ConnectorFloorRecord,
  direction: ConnectorDirection,
): void {
  if (sourceFloor.buildingId !== targetFloor.buildingId) {
    throw new ConnectorLinkingError(
      'LINK_VALIDATION_ERROR',
      'Source and target connectors must be in the same building',
    )
  }

  const floorDelta = targetFloor.floorNumber - sourceFloor.floorNumber

  if (floorDelta === 0) {
    throw new ConnectorLinkingError('LINK_VALIDATION_ERROR', 'Source and target cannot be on the same floor')
  }

  if (Math.abs(floorDelta) !== 1) {
    throw new ConnectorLinkingError('LINK_VALIDATION_ERROR', 'Connector links must target an adjacent floor')
  }

  if (direction === 'above' && floorDelta <= 0) {
    throw new ConnectorLinkingError('LINK_VALIDATION_ERROR', 'Direction "above" requires a higher floor target')
  }

  if (direction === 'below' && floorDelta >= 0) {
    throw new ConnectorLinkingError('LINK_VALIDATION_ERROR', 'Direction "below" requires a lower floor target')
  }
}

async function clearReciprocalIfLinked(
  tx: ConnectorLinkStoreTx,
  patchMap: Map<string, ConnectorNodePatch>,
  counterpartNodeId: string,
  counterpartNodeField: NodeConnectorField,
  counterpartFloorField: FloorConnectorField,
  expectedLinkedNodeId: string,
): Promise<void> {
  const counterpartNode = await tx.getNodeById(counterpartNodeId)
  if (!counterpartNode) return

  if (counterpartNode[counterpartNodeField] !== expectedLinkedNodeId) {
    return
  }

  mergePatch(
    patchMap,
    counterpartNode.id,
    createDirectionalPatch(counterpartNodeField, null, counterpartFloorField, null),
  )
}

async function unlinkConnectorDirection(
  tx: ConnectorLinkStoreTx,
  sourceNode: ConnectorNodeRecord,
  spec: DirectionSpec,
): Promise<ConnectorLinkResult> {
  const patchMap = new Map<string, ConnectorNodePatch>()

  mergePatch(
    patchMap,
    sourceNode.id,
    createDirectionalPatch(spec.sourceNodeField, null, spec.sourceFloorField, null),
  )

  const previousCounterpartId = sourceNode[spec.sourceNodeField]
  if (previousCounterpartId) {
    await clearReciprocalIfLinked(
      tx,
      patchMap,
      previousCounterpartId,
      spec.counterpartNodeField,
      spec.counterpartFloorField,
      sourceNode.id,
    )
  }

  const updatedNodes = await applyPatches(tx, patchMap)
  return { ok: true, updatedNodes }
}

async function linkConnectorDirection(
  tx: ConnectorLinkStoreTx,
  sourceNode: ConnectorNodeRecord,
  sourceFloor: ConnectorFloorRecord,
  targetNode: ConnectorNodeRecord,
  targetFloor: ConnectorFloorRecord,
  spec: DirectionSpec,
): Promise<ConnectorLinkResult> {
  const patchMap = new Map<string, ConnectorNodePatch>()

  const sourcePreviousCounterpartId = sourceNode[spec.sourceNodeField]
  if (sourcePreviousCounterpartId && sourcePreviousCounterpartId !== targetNode.id) {
    await clearReciprocalIfLinked(
      tx,
      patchMap,
      sourcePreviousCounterpartId,
      spec.counterpartNodeField,
      spec.counterpartFloorField,
      sourceNode.id,
    )
  }

  const targetPreviousCounterpartId = targetNode[spec.counterpartNodeField]
  if (targetPreviousCounterpartId && targetPreviousCounterpartId !== sourceNode.id) {
    await clearReciprocalIfLinked(
      tx,
      patchMap,
      targetPreviousCounterpartId,
      spec.sourceNodeField,
      spec.sourceFloorField,
      targetNode.id,
    )
  }

  mergePatch(
    patchMap,
    sourceNode.id,
    createDirectionalPatch(spec.sourceNodeField, targetNode.id, spec.sourceFloorField, targetFloor.id),
  )

  mergePatch(
    patchMap,
    targetNode.id,
    createDirectionalPatch(spec.counterpartNodeField, sourceNode.id, spec.counterpartFloorField, sourceFloor.id),
  )

  const updatedNodes = await applyPatches(tx, patchMap)
  return { ok: true, updatedNodes }
}

async function executeConnectorLink(
  tx: ConnectorLinkStoreTx,
  request: ConnectorLinkRequest,
): Promise<ConnectorLinkResult> {
  const sourceNode = await tx.getNodeById(request.sourceNodeId)
  if (!sourceNode) {
    throw new ConnectorLinkingError('SOURCE_NOT_FOUND', `Source node ${request.sourceNodeId} was not found`)
  }

  if (!isConnectorNodeType(sourceNode.type)) {
    throw new ConnectorLinkingError('SOURCE_NOT_CONNECTOR', 'Source node must be stairs, elevator, or ramp')
  }

  const sourceFloor = await tx.getFloorById(sourceNode.floorId)
  if (!sourceFloor) {
    throw new ConnectorLinkingError('LINK_VALIDATION_ERROR', 'Source node floor could not be resolved')
  }

  const spec = directionSpec(request.direction)

  if (request.targetNodeId === null) {
    return unlinkConnectorDirection(tx, sourceNode, spec)
  }

  if (request.targetNodeId === sourceNode.id) {
    throw new ConnectorLinkingError('LINK_VALIDATION_ERROR', 'Source node cannot link to itself')
  }

  const targetNode = await tx.getNodeById(request.targetNodeId)
  if (!targetNode) {
    throw new ConnectorLinkingError('TARGET_NOT_FOUND', `Target node ${request.targetNodeId} was not found`)
  }

  if (!isConnectorNodeType(targetNode.type)) {
    throw new ConnectorLinkingError('TARGET_NOT_CONNECTOR', 'Target node must be stairs, elevator, or ramp')
  }

  const targetFloor = await tx.getFloorById(targetNode.floorId)
  if (!targetFloor) {
    throw new ConnectorLinkingError('LINK_VALIDATION_ERROR', 'Target node floor could not be resolved')
  }

  validateFloorDirection(sourceFloor, targetFloor, request.direction)

  return linkConnectorDirection(tx, sourceNode, sourceFloor, targetNode, targetFloor, spec)
}

export async function linkConnectorNodes(
  request: ConnectorLinkRequest,
  options?: { store?: ConnectorLinkStore },
): Promise<ConnectorLinkResult> {
  const store = options?.store ?? drizzleConnectorStore
  return store.transaction(async (tx) => executeConnectorLink(tx, request))
}

export async function linkConnectorNodesFromPayload(
  payload: unknown,
  options?: { store?: ConnectorLinkStore },
): Promise<ConnectorLinkResult> {
  const request = parseConnectorLinkRequest(payload)
  return linkConnectorNodes(request, options)
}
