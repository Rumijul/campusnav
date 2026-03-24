import { describe, expect, it } from 'vitest'
import {
  buildGpsBoundsRequestPayload,
  createGpsBoundsDraft,
  createGpsBoundsDraftMap,
  deriveGpsBoundsFormState,
} from './gpsBoundsForm'

describe('gpsBoundsForm', () => {
  it('builds draft strings from persisted gps bounds', () => {
    expect(
      createGpsBoundsDraft({
        minLat: 14.554,
        maxLat: 14.555,
        minLng: 121.02,
        maxLng: 121.021,
      }),
    ).toEqual({
      minLat: '14.554',
      maxLat: '14.555',
      minLng: '121.02',
      maxLng: '121.021',
    })

    expect(createGpsBoundsDraft(null)).toEqual({
      minLat: '',
      maxLat: '',
      minLng: '',
      maxLng: '',
    })
  })

  it('creates floor-id keyed draft map from floor metadata', () => {
    const drafts = createGpsBoundsDraftMap([
      {
        id: 10,
        gpsBounds: {
          minLat: 1,
          maxLat: 2,
          minLng: 3,
          maxLng: 4,
        },
      },
      {
        id: 11,
      },
    ])

    expect(drafts).toEqual({
      10: {
        minLat: '1',
        maxLat: '2',
        minLng: '3',
        maxLng: '4',
      },
      11: {
        minLat: '',
        maxLat: '',
        minLng: '',
        maxLng: '',
      },
    })
  })

  it('returns clear payload as valid when all fields are empty', () => {
    const formState = deriveGpsBoundsFormState(
      {
        minLat: '',
        maxLat: '',
        minLng: '',
        maxLng: '',
      },
      null,
    )

    expect(formState.isValid).toBe(true)
    expect(formState.errorCode).toBeNull()
    expect(formState.payload).toEqual({
      minLat: null,
      maxLat: null,
      minLng: null,
      maxLng: null,
    })
    expect(formState.hasChanges).toBe(false)
  })

  it('returns GPS_BOUNDS_INCOMPLETE when tuple is partially provided', () => {
    const formState = deriveGpsBoundsFormState({
      minLat: '14.55',
      maxLat: '',
      minLng: '121.0',
      maxLng: '121.1',
    })

    expect(formState.isValid).toBe(false)
    expect(formState.errorCode).toBe('GPS_BOUNDS_INCOMPLETE')
    expect(formState.error).toContain('GPS_BOUNDS_INCOMPLETE')
    expect(formState.payload).toBeNull()
  })

  it('returns BOUNDS_RANGE_INVALID when min/max ordering is invalid', () => {
    const formState = deriveGpsBoundsFormState({
      minLat: '14.56',
      maxLat: '14.56',
      minLng: '121.10',
      maxLng: '121.09',
    })

    expect(formState.isValid).toBe(false)
    expect(formState.errorCode).toBe('BOUNDS_RANGE_INVALID')
    expect(formState.error).toContain('minLat must be < maxLat')
    expect(formState.payload).toBeNull()
  })

  it('returns valid numeric payload and unchanged=false when tuple differs from persisted bounds', () => {
    const formState = deriveGpsBoundsFormState(
      {
        minLat: ' 14.5501 ',
        maxLat: '14.5502',
        minLng: '121.0201',
        maxLng: '121.0202',
      },
      {
        minLat: 14.55,
        maxLat: 14.56,
        minLng: 121.02,
        maxLng: 121.03,
      },
    )

    expect(formState.isValid).toBe(true)
    expect(formState.error).toBeNull()
    expect(formState.payload).toEqual({
      minLat: 14.5501,
      maxLat: 14.5502,
      minLng: 121.0201,
      maxLng: 121.0202,
    })
    expect(formState.nextGpsBounds).toEqual({
      minLat: 14.5501,
      maxLat: 14.5502,
      minLng: 121.0201,
      maxLng: 121.0202,
    })
    expect(formState.hasChanges).toBe(true)
  })

  it('buildGpsBoundsRequestPayload returns null for invalid drafts and tuples for clear/set states', () => {
    expect(
      buildGpsBoundsRequestPayload({
        minLat: '1',
        maxLat: '',
        minLng: '2',
        maxLng: '3',
      }),
    ).toBeNull()

    expect(
      buildGpsBoundsRequestPayload({
        minLat: '',
        maxLat: '',
        minLng: '',
        maxLng: '',
      }),
    ).toEqual({
      minLat: null,
      maxLat: null,
      minLng: null,
      maxLng: null,
    })

    expect(
      buildGpsBoundsRequestPayload({
        minLat: '1',
        maxLat: '2',
        minLng: '3',
        maxLng: '4',
      }),
    ).toEqual({
      minLat: 1,
      maxLat: 2,
      minLng: 3,
      maxLng: 4,
    })
  })
})
