import { describe, expect, it } from 'vitest'
import { serializeFloorGpsBounds, toNavFloorGpsBounds } from './floorGpsBounds'

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
