import { describe, expect, it } from 'vitest'
import {
  type FloorGpsBoundsColumns,
  type FloorGpsBoundsStore,
  type FloorGpsBoundsStoreTx,
  FloorGpsBoundsError,
  parseFloorGpsBoundsUpdatePayload,
  serializeFloorGpsBounds,
  toNavFloorGpsBounds,
  updateFloorGpsBoundsFromPayload,
} from './floorGpsBounds'

interface InMemoryFloorRow extends FloorGpsBoundsColumns {
  id: number
}

interface InMemoryFloorStore {
  store: FloorGpsBoundsStore
  getFloor(floorId: number): InMemoryFloorRow | null
  snapshotFloors(): InMemoryFloorRow[]
}

function cloneFloorRow(row: InMemoryFloorRow): InMemoryFloorRow {
  return { ...row }
}

function createInMemoryFloorStore(rows: InMemoryFloorRow[]): InMemoryFloorStore {
  let committedRows = new Map(rows.map((row) => [row.id, cloneFloorRow(row)]))

  const buildTx = (workingRows: Map<number, InMemoryFloorRow>): FloorGpsBoundsStoreTx => ({
    async getFloorById(floorId) {
      const row = workingRows.get(floorId)
      return row ? cloneFloorRow(row) : null
    },

    async updateFloorGpsBounds(floorId, bounds) {
      const current = workingRows.get(floorId)
      if (!current) {
        return null
      }

      const next = { ...current, ...bounds }
      workingRows.set(floorId, next)
      return cloneFloorRow(next)
    },
  })

  return {
    store: {
      async transaction(callback) {
        const workingRows = new Map(
          Array.from(committedRows.entries()).map(([id, row]) => [id, cloneFloorRow(row)]),
        )

        const result = await callback(buildTx(workingRows))
        committedRows = workingRows
        return result
      },
    },

    getFloor(floorId) {
      const row = committedRows.get(floorId)
      return row ? cloneFloorRow(row) : null
    },

    snapshotFloors() {
      return Array.from(committedRows.values())
        .map((row) => cloneFloorRow(row))
        .sort((left, right) => left.id - right.id)
    },
  }
}

describe('serializeFloorGpsBounds', () => {
  it('serializes gpsBounds only when complete tuple is present', () => {
    expect(
      serializeFloorGpsBounds({
        gpsMinLat: 14.5811,
        gpsMaxLat: 14.5822,
        gpsMinLng: 121.0412,
        gpsMaxLng: 121.0423,
      }),
    ).toEqual({
      gpsBounds: {
        minLat: 14.5811,
        maxLat: 14.5822,
        minLng: 121.0412,
        maxLng: 121.0423,
      },
    })

    expect(
      serializeFloorGpsBounds({
        gpsMinLat: 14.5811,
        gpsMaxLat: 14.5822,
        gpsMinLng: null,
        gpsMaxLng: 121.0423,
      }),
    ).toEqual({})

    expect(
      serializeFloorGpsBounds({
        gpsMinLat: null,
        gpsMaxLat: null,
        gpsMinLng: null,
        gpsMaxLng: null,
      }),
    ).toEqual({})
  })
})

describe('toNavFloorGpsBounds', () => {
  it('returns null when one or more tuple values are missing', () => {
    expect(
      toNavFloorGpsBounds({
        gpsMinLat: 14.5811,
        gpsMaxLat: null,
        gpsMinLng: 121.0412,
        gpsMaxLng: 121.0423,
      }),
    ).toBeNull()
  })

  it('returns null when tuple contains non-finite values', () => {
    expect(
      toNavFloorGpsBounds({
        gpsMinLat: Number.NaN,
        gpsMaxLat: 14.5822,
        gpsMinLng: 121.0412,
        gpsMaxLng: 121.0423,
      }),
    ).toBeNull()
  })
})

describe('parseFloorGpsBoundsUpdatePayload', () => {
  it('parses complete numeric tuples', () => {
    expect(
      parseFloorGpsBoundsUpdatePayload({
        minLat: 14.5811,
        maxLat: 14.5822,
        minLng: 121.0412,
        maxLng: 121.0423,
      }),
    ).toEqual({
      gpsMinLat: 14.5811,
      gpsMaxLat: 14.5822,
      gpsMinLng: 121.0412,
      gpsMaxLng: 121.0423,
    })
  })

  it('rejects non-object payloads as INVALID_REQUEST', () => {
    expect(() => parseFloorGpsBoundsUpdatePayload('invalid')).toThrowError(FloorGpsBoundsError)

    try {
      parseFloorGpsBoundsUpdatePayload('invalid')
      throw new Error('Expected INVALID_REQUEST error')
    } catch (error) {
      expect(error).toMatchObject<Partial<FloorGpsBoundsError>>({
        code: 'INVALID_REQUEST',
        status: 400,
      })
    }
  })
})

describe('updateFloorGpsBoundsFromPayload', () => {
  it('updates and returns authoritative gpsBounds when complete tuple is provided', async () => {
    const memory = createInMemoryFloorStore([
      {
        id: 101,
        gpsMinLat: null,
        gpsMaxLat: null,
        gpsMinLng: null,
        gpsMaxLng: null,
      },
    ])

    const result = await updateFloorGpsBoundsFromPayload(
      101,
      {
        minLat: 14.5811,
        maxLat: 14.5822,
        minLng: 121.0412,
        maxLng: 121.0423,
      },
      { store: memory.store },
    )

    expect(result).toEqual({
      ok: true,
      floorId: 101,
      gpsBounds: {
        minLat: 14.5811,
        maxLat: 14.5822,
        minLng: 121.0412,
        maxLng: 121.0423,
      },
    })

    expect(memory.getFloor(101)).toEqual({
      id: 101,
      gpsMinLat: 14.5811,
      gpsMaxLat: 14.5822,
      gpsMinLng: 121.0412,
      gpsMaxLng: 121.0423,
    })
  })

  it('clears gps bounds when full null tuple is provided', async () => {
    const memory = createInMemoryFloorStore([
      {
        id: 102,
        gpsMinLat: 14.5811,
        gpsMaxLat: 14.5822,
        gpsMinLng: 121.0412,
        gpsMaxLng: 121.0423,
      },
    ])

    const result = await updateFloorGpsBoundsFromPayload(
      102,
      {
        minLat: null,
        maxLat: null,
        minLng: null,
        maxLng: null,
      },
      { store: memory.store },
    )

    expect(result).toEqual({
      ok: true,
      floorId: 102,
      gpsBounds: null,
    })

    expect(memory.getFloor(102)).toEqual({
      id: 102,
      gpsMinLat: null,
      gpsMaxLat: null,
      gpsMinLng: null,
      gpsMaxLng: null,
    })
  })

  it('returns GPS_BOUNDS_INCOMPLETE when tuple is partially provided', async () => {
    const memory = createInMemoryFloorStore([
      {
        id: 201,
        gpsMinLat: 14.57,
        gpsMaxLat: 14.58,
        gpsMinLng: 121.04,
        gpsMaxLng: 121.05,
      },
    ])

    const before = memory.snapshotFloors()

    await expect(
      updateFloorGpsBoundsFromPayload(
        201,
        {
          minLat: 14.571,
          maxLat: 14.582,
          minLng: null,
          maxLng: 121.052,
        },
        { store: memory.store },
      ),
    ).rejects.toMatchObject<Partial<FloorGpsBoundsError>>({
      code: 'GPS_BOUNDS_INCOMPLETE',
      status: 400,
    })

    expect(memory.snapshotFloors()).toEqual(before)
  })

  it('returns BOUNDS_RANGE_INVALID when min/max ordering is invalid', async () => {
    const memory = createInMemoryFloorStore([
      {
        id: 202,
        gpsMinLat: 14.57,
        gpsMaxLat: 14.58,
        gpsMinLng: 121.04,
        gpsMaxLng: 121.05,
      },
    ])

    const before = memory.snapshotFloors()

    await expect(
      updateFloorGpsBoundsFromPayload(
        202,
        {
          minLat: 14.59,
          maxLat: 14.58,
          minLng: 121.04,
          maxLng: 121.05,
        },
        { store: memory.store },
      ),
    ).rejects.toMatchObject<Partial<FloorGpsBoundsError>>({
      code: 'BOUNDS_RANGE_INVALID',
      status: 400,
    })

    expect(memory.snapshotFloors()).toEqual(before)
  })

  it('returns FLOOR_NOT_FOUND when floor id does not exist', async () => {
    const memory = createInMemoryFloorStore([])

    await expect(
      updateFloorGpsBoundsFromPayload(
        999,
        {
          minLat: 14.5811,
          maxLat: 14.5822,
          minLng: 121.0412,
          maxLng: 121.0423,
        },
        { store: memory.store },
      ),
    ).rejects.toMatchObject<Partial<FloorGpsBoundsError>>({
      code: 'FLOOR_NOT_FOUND',
      status: 404,
    })
  })
})
