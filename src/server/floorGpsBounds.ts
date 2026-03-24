import type { NavFloorGpsBounds } from '@shared/types'
import { eq } from 'drizzle-orm'
import { db } from './db/client'
import { floors } from './db/schema'

export interface FloorGpsBoundsColumns {
  gpsMinLat: number | null
  gpsMaxLat: number | null
  gpsMinLng: number | null
  gpsMaxLng: number | null
}

export type FloorGpsBoundsErrorCode =
  | 'INVALID_REQUEST'
  | 'GPS_BOUNDS_INCOMPLETE'
  | 'BOUNDS_RANGE_INVALID'
  | 'FLOOR_NOT_FOUND'

type FloorGpsBoundsErrorStatus = 400 | 404

const FLOOR_GPS_BOUNDS_ERROR_STATUS = {
  INVALID_REQUEST: 400,
  GPS_BOUNDS_INCOMPLETE: 400,
  BOUNDS_RANGE_INVALID: 400,
  FLOOR_NOT_FOUND: 404,
} as const satisfies Record<FloorGpsBoundsErrorCode, FloorGpsBoundsErrorStatus>

export class FloorGpsBoundsError extends Error {
  readonly code: FloorGpsBoundsErrorCode
  readonly status: FloorGpsBoundsErrorStatus

  constructor(code: FloorGpsBoundsErrorCode, message: string) {
    super(message)
    this.name = 'FloorGpsBoundsError'
    this.code = code
    this.status = FLOOR_GPS_BOUNDS_ERROR_STATUS[code]
  }
}

export interface FloorGpsBoundsUpdateResult {
  ok: true
  floorId: number
  gpsBounds: NavFloorGpsBounds | null
}

interface FloorGpsBoundsRow extends FloorGpsBoundsColumns {
  id: number
}

export interface FloorGpsBoundsStoreTx {
  getFloorById(floorId: number): Promise<FloorGpsBoundsRow | null>
  updateFloorGpsBounds(floorId: number, bounds: FloorGpsBoundsColumns): Promise<FloorGpsBoundsRow | null>
}

export interface FloorGpsBoundsStore {
  transaction<T>(callback: (tx: FloorGpsBoundsStoreTx) => Promise<T>): Promise<T>
}

type DrizzleFloorGpsBoundsTx = Pick<typeof db, 'select' | 'update'>

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseFloorGpsBoundsTuple(values: {
  minLat: unknown
  maxLat: unknown
  minLng: unknown
  maxLng: unknown
}): FloorGpsBoundsColumns {
  const { minLat, maxLat, minLng, maxLng } = values
  const tupleValues = [minLat, maxLat, minLng, maxLng] as const

  if (tupleValues.some(value => value === undefined)) {
    throw new FloorGpsBoundsError(
      'GPS_BOUNDS_INCOMPLETE',
      'minLat, maxLat, minLng, and maxLng must all be provided',
    )
  }

  if (tupleValues.every(value => value === null)) {
    return {
      gpsMinLat: null,
      gpsMaxLat: null,
      gpsMinLng: null,
      gpsMaxLng: null,
    }
  }

  if (tupleValues.some(value => value === null)) {
    throw new FloorGpsBoundsError(
      'GPS_BOUNDS_INCOMPLETE',
      'GPS bounds must be a complete numeric tuple or a full null clear tuple',
    )
  }

  if (
    !isFiniteNumber(minLat)
    || !isFiniteNumber(maxLat)
    || !isFiniteNumber(minLng)
    || !isFiniteNumber(maxLng)
  ) {
    throw new FloorGpsBoundsError(
      'INVALID_REQUEST',
      'minLat, maxLat, minLng, and maxLng must be finite numbers or all null',
    )
  }

  if (minLat >= maxLat || minLng >= maxLng) {
    throw new FloorGpsBoundsError(
      'BOUNDS_RANGE_INVALID',
      'GPS bounds must satisfy minLat < maxLat and minLng < maxLng',
    )
  }

  return {
    gpsMinLat: minLat,
    gpsMaxLat: maxLat,
    gpsMinLng: minLng,
    gpsMaxLng: maxLng,
  }
}

/**
 * Converts nullable DB floor GPS columns into a complete GPS bounds object.
 * Returns null when any value is missing (or non-finite), ensuring callers never
 * serialize partial coordinate tuples.
 */
export function toNavFloorGpsBounds(row: FloorGpsBoundsColumns): NavFloorGpsBounds | null {
  if (
    !isFiniteNumber(row.gpsMinLat)
    || !isFiniteNumber(row.gpsMaxLat)
    || !isFiniteNumber(row.gpsMinLng)
    || !isFiniteNumber(row.gpsMaxLng)
  ) {
    return null
  }

  return {
    minLat: row.gpsMinLat,
    maxLat: row.gpsMaxLat,
    minLng: row.gpsMinLng,
    maxLng: row.gpsMaxLng,
  }
}

export function serializeFloorGpsBounds(row: FloorGpsBoundsColumns): { gpsBounds?: NavFloorGpsBounds } {
  const gpsBounds = toNavFloorGpsBounds(row)
  return gpsBounds ? { gpsBounds } : {}
}

export function parseFloorGpsBoundsUpdatePayload(payload: unknown): FloorGpsBoundsColumns {
  if (!isRecord(payload)) {
    throw new FloorGpsBoundsError('INVALID_REQUEST', 'Request body must be a JSON object')
  }

  return parseFloorGpsBoundsTuple({
    minLat: payload.minLat,
    maxLat: payload.maxLat,
    minLng: payload.minLng,
    maxLng: payload.maxLng,
  })
}

function createDrizzleStoreTx(tx: DrizzleFloorGpsBoundsTx): FloorGpsBoundsStoreTx {
  return {
    async getFloorById(floorId) {
      const [row] = await tx
        .select({
          id: floors.id,
          gpsMinLat: floors.gpsMinLat,
          gpsMaxLat: floors.gpsMaxLat,
          gpsMinLng: floors.gpsMinLng,
          gpsMaxLng: floors.gpsMaxLng,
        })
        .from(floors)
        .where(eq(floors.id, floorId))
        .limit(1)

      return row ?? null
    },

    async updateFloorGpsBounds(floorId, bounds) {
      const [row] = await tx
        .update(floors)
        .set({
          ...bounds,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(floors.id, floorId))
        .returning({
          id: floors.id,
          gpsMinLat: floors.gpsMinLat,
          gpsMaxLat: floors.gpsMaxLat,
          gpsMinLng: floors.gpsMinLng,
          gpsMaxLng: floors.gpsMaxLng,
        })

      return row ?? null
    },
  }
}

const drizzleFloorGpsBoundsStore: FloorGpsBoundsStore = {
  transaction(callback) {
    return db.transaction(async (tx) => callback(createDrizzleStoreTx(tx)))
  },
}

async function executeUpdateFloorGpsBounds(
  tx: FloorGpsBoundsStoreTx,
  floorId: number,
  bounds: FloorGpsBoundsColumns,
): Promise<FloorGpsBoundsUpdateResult> {
  const existingFloor = await tx.getFloorById(floorId)
  if (!existingFloor) {
    throw new FloorGpsBoundsError('FLOOR_NOT_FOUND', `Floor ${floorId} was not found`)
  }

  const updatedFloor = await tx.updateFloorGpsBounds(existingFloor.id, bounds)
  if (!updatedFloor) {
    throw new FloorGpsBoundsError('FLOOR_NOT_FOUND', `Floor ${floorId} was not found`)
  }

  return {
    ok: true,
    floorId: updatedFloor.id,
    gpsBounds: toNavFloorGpsBounds(updatedFloor),
  }
}

export async function updateFloorGpsBounds(
  floorId: number,
  bounds: FloorGpsBoundsColumns,
  options?: { store?: FloorGpsBoundsStore },
): Promise<FloorGpsBoundsUpdateResult> {
  if (!Number.isInteger(floorId) || floorId <= 0) {
    throw new FloorGpsBoundsError('INVALID_REQUEST', 'floorId must be a positive integer')
  }

  const store = options?.store ?? drizzleFloorGpsBoundsStore
  return store.transaction(async (tx) => executeUpdateFloorGpsBounds(tx, floorId, bounds))
}

export async function updateFloorGpsBoundsFromPayload(
  floorId: number,
  payload: unknown,
  options?: { store?: FloorGpsBoundsStore },
): Promise<FloorGpsBoundsUpdateResult> {
  const bounds = parseFloorGpsBoundsUpdatePayload(payload)
  return updateFloorGpsBounds(floorId, bounds, options)
}
