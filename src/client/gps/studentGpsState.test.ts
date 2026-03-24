import { describe, expect, it } from 'vitest'
import { deriveStudentGpsState } from './studentGpsState'

describe('deriveStudentGpsState', () => {
  it('maps uncalibrated floors to an explicit fallback state', () => {
    const state = deriveStudentGpsState({
      hasFloorCalibration: false,
      geolocationStatus: 'ready',
      accuracyMeters: 5,
      nearestNodeId: 'node-a',
    })

    expect(state.canUseMyLocation).toBe(false)
    expect(state.fallbackReason).toBe('floor-not-calibrated')
    expect(state.fallbackMessage).toContain('unavailable on this floor')
  })

  it('maps unsupported browser geolocation to explicit fallback state', () => {
    const state = deriveStudentGpsState({
      hasFloorCalibration: true,
      geolocationStatus: 'unsupported',
      accuracyMeters: null,
      nearestNodeId: null,
    })

    expect(state.canUseMyLocation).toBe(false)
    expect(state.fallbackReason).toBe('geolocation-unsupported')
  })

  it('maps permission-denied geolocation to explicit fallback state', () => {
    const state = deriveStudentGpsState({
      hasFloorCalibration: true,
      geolocationStatus: 'permission-denied',
      accuracyMeters: null,
      nearestNodeId: null,
    })

    expect(state.canUseMyLocation).toBe(false)
    expect(state.fallbackReason).toBe('permission-denied')
    expect(state.fallbackMessage).toContain('permission is blocked')
  })

  it('maps unavailable geolocation fixes to explicit fallback state', () => {
    const state = deriveStudentGpsState({
      hasFloorCalibration: true,
      geolocationStatus: 'unavailable',
      accuracyMeters: null,
      nearestNodeId: null,
    })

    expect(state.canUseMyLocation).toBe(false)
    expect(state.fallbackReason).toBe('position-unavailable')
  })

  it('maps low-confidence fixes above 50m to explicit fallback state', () => {
    const state = deriveStudentGpsState({
      hasFloorCalibration: true,
      geolocationStatus: 'ready',
      accuracyMeters: 51,
      nearestNodeId: 'node-a',
    })

    expect(state.canUseMyLocation).toBe(false)
    expect(state.fallbackReason).toBe('low-confidence')
    expect(state.fallbackMessage).toContain('above 50m')
  })

  it('maps missing nearest-node candidates to explicit fallback state', () => {
    const state = deriveStudentGpsState({
      hasFloorCalibration: true,
      geolocationStatus: 'ready',
      accuracyMeters: 12,
      nearestNodeId: null,
    })

    expect(state.canUseMyLocation).toBe(false)
    expect(state.fallbackReason).toBe('no-nearest-node')
  })

  it('returns ready use-location state when fix is confident and a nearest node exists', () => {
    const state = deriveStudentGpsState({
      hasFloorCalibration: true,
      geolocationStatus: 'ready',
      accuracyMeters: 8,
      nearestNodeId: 'node-a',
    })

    expect(state.canUseMyLocation).toBe(true)
    expect(state.fallbackReason).toBeNull()
    expect(state.fallbackMessage).toBeNull()
    expect(state.nearestNodeId).toBe('node-a')
  })
})
