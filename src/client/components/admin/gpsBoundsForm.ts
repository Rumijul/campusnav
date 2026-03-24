import type { NavFloor, NavFloorGpsBounds } from '@shared/types'

export interface GpsBoundsDraftValues {
  minLat: string
  maxLat: string
  minLng: string
  maxLng: string
}

export type GpsBoundsDraftByFloorId = Record<number, GpsBoundsDraftValues>

export interface FloorGpsBoundsUpdatePayload {
  minLat: number | null
  maxLat: number | null
  minLng: number | null
  maxLng: number | null
}

export type GpsBoundsFormErrorCode = 'GPS_BOUNDS_INCOMPLETE' | 'BOUNDS_RANGE_INVALID' | 'INVALID_REQUEST'

export interface GpsBoundsFormState {
  normalized: GpsBoundsDraftValues
  payload: FloorGpsBoundsUpdatePayload | null
  nextGpsBounds: NavFloorGpsBounds | null
  errorCode: GpsBoundsFormErrorCode | null
  error: string | null
  isValid: boolean
  hasChanges: boolean
}

const EMPTY_GPS_BOUNDS_DRAFT: GpsBoundsDraftValues = {
  minLat: '',
  maxLat: '',
  minLng: '',
  maxLng: '',
}

function trimGpsBoundsDraftValues(values: GpsBoundsDraftValues): GpsBoundsDraftValues {
  return {
    minLat: values.minLat.trim(),
    maxLat: values.maxLat.trim(),
    minLng: values.minLng.trim(),
    maxLng: values.maxLng.trim(),
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function createGpsBoundsDraft(gpsBounds?: NavFloorGpsBounds | null): GpsBoundsDraftValues {
  if (!gpsBounds) {
    return { ...EMPTY_GPS_BOUNDS_DRAFT }
  }

  return {
    minLat: String(gpsBounds.minLat),
    maxLat: String(gpsBounds.maxLat),
    minLng: String(gpsBounds.minLng),
    maxLng: String(gpsBounds.maxLng),
  }
}

export function createGpsBoundsDraftByFloor(
  floor: Pick<NavFloor, 'gpsBounds'>,
): GpsBoundsDraftValues {
  return createGpsBoundsDraft(floor.gpsBounds)
}

export function createGpsBoundsDraftMap(
  floors: ReadonlyArray<Pick<NavFloor, 'id' | 'gpsBounds'>>,
): GpsBoundsDraftByFloorId {
  return floors.reduce<GpsBoundsDraftByFloorId>((acc, floor) => {
    acc[floor.id] = createGpsBoundsDraft(floor.gpsBounds)
    return acc
  }, {})
}

export function areGpsBoundsEqual(
  left: NavFloorGpsBounds | null,
  right: NavFloorGpsBounds | null,
): boolean {
  if (!left && !right) return true
  if (!left || !right) return false

  return (
    left.minLat === right.minLat
    && left.maxLat === right.maxLat
    && left.minLng === right.minLng
    && left.maxLng === right.maxLng
  )
}

function areGpsBoundsDraftsEqual(left: GpsBoundsDraftValues, right: GpsBoundsDraftValues): boolean {
  return (
    left.minLat === right.minLat
    && left.maxLat === right.maxLat
    && left.minLng === right.minLng
    && left.maxLng === right.maxLng
  )
}

function toPayloadBounds(payload: FloorGpsBoundsUpdatePayload): NavFloorGpsBounds | null {
  if (
    !isFiniteNumber(payload.minLat)
    || !isFiniteNumber(payload.maxLat)
    || !isFiniteNumber(payload.minLng)
    || !isFiniteNumber(payload.maxLng)
  ) {
    return null
  }

  return {
    minLat: payload.minLat,
    maxLat: payload.maxLat,
    minLng: payload.minLng,
    maxLng: payload.maxLng,
  }
}

export function deriveGpsBoundsFormState(
  draftValues: GpsBoundsDraftValues,
  persistedGpsBounds: NavFloorGpsBounds | null = null,
): GpsBoundsFormState {
  const normalized = trimGpsBoundsDraftValues(draftValues)
  const values = [normalized.minLat, normalized.maxLat, normalized.minLng, normalized.maxLng] as const
  const emptyCount = values.filter((value) => value.length === 0).length
  const persistedDraft = createGpsBoundsDraft(persistedGpsBounds)
  const hasChanges = !areGpsBoundsDraftsEqual(normalized, persistedDraft)

  if (emptyCount === values.length) {
    const clearPayload: FloorGpsBoundsUpdatePayload = {
      minLat: null,
      maxLat: null,
      minLng: null,
      maxLng: null,
    }

    return {
      normalized,
      payload: clearPayload,
      nextGpsBounds: null,
      errorCode: null,
      error: null,
      isValid: true,
      hasChanges,
    }
  }

  if (emptyCount > 0) {
    return {
      normalized,
      payload: null,
      nextGpsBounds: null,
      errorCode: 'GPS_BOUNDS_INCOMPLETE',
      error: 'GPS_BOUNDS_INCOMPLETE: Enter all four bounds or clear all fields.',
      isValid: false,
      hasChanges,
    }
  }

  const parsedPayload: FloorGpsBoundsUpdatePayload = {
    minLat: Number(normalized.minLat),
    maxLat: Number(normalized.maxLat),
    minLng: Number(normalized.minLng),
    maxLng: Number(normalized.maxLng),
  }

  if (
    !isFiniteNumber(parsedPayload.minLat)
    || !isFiniteNumber(parsedPayload.maxLat)
    || !isFiniteNumber(parsedPayload.minLng)
    || !isFiniteNumber(parsedPayload.maxLng)
  ) {
    return {
      normalized,
      payload: null,
      nextGpsBounds: null,
      errorCode: 'INVALID_REQUEST',
      error: 'INVALID_REQUEST: GPS bounds must be finite numbers.',
      isValid: false,
      hasChanges,
    }
  }

  if (parsedPayload.minLat >= parsedPayload.maxLat || parsedPayload.minLng >= parsedPayload.maxLng) {
    return {
      normalized,
      payload: null,
      nextGpsBounds: null,
      errorCode: 'BOUNDS_RANGE_INVALID',
      error: 'BOUNDS_RANGE_INVALID: minLat must be < maxLat and minLng must be < maxLng.',
      isValid: false,
      hasChanges,
    }
  }

  return {
    normalized,
    payload: parsedPayload,
    nextGpsBounds: toPayloadBounds(parsedPayload),
    errorCode: null,
    error: null,
    isValid: true,
    hasChanges,
  }
}

export function buildGpsBoundsRequestPayload(
  draftValues: GpsBoundsDraftValues,
): FloorGpsBoundsUpdatePayload | null {
  return deriveGpsBoundsFormState(draftValues).payload
}
