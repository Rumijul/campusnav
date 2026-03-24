import { describe, expect, it, vi } from 'vitest'
import {
  createGeolocationSnapshot,
  mapGeolocationErrorCode,
  startGeolocationWatch,
  type GeolocationAdapter,
  type GeolocationPositionLike,
  type GeolocationSnapshot,
} from './useGeolocation'

interface MockGeolocationController {
  adapter: GeolocationAdapter
  emitSuccess: (watchId: number, position: GeolocationPositionLike) => void
  emitError: (watchId: number, code: number) => void
  hasWatch: (watchId: number) => boolean
}

function createMockGeolocation(): MockGeolocationController {
  let nextWatchId = 100
  const registrations = new Map<
    number,
    {
      success: (position: GeolocationPositionLike) => void
      error?: (error: { code: number }) => void
    }
  >()

  const adapter: GeolocationAdapter = {
    watchPosition: vi.fn((success, error) => {
      const watchId = nextWatchId
      nextWatchId += 1
      registrations.set(watchId, {
        success,
        error,
      })
      return watchId
    }),
    clearWatch: vi.fn((watchId: number) => {
      registrations.delete(watchId)
    }),
  }

  return {
    adapter,
    emitSuccess: (watchId, position) => {
      registrations.get(watchId)?.success(position)
    },
    emitError: (watchId, code) => {
      registrations.get(watchId)?.error?.({ code })
    },
    hasWatch: (watchId) => registrations.has(watchId),
  }
}

describe('mapGeolocationErrorCode', () => {
  it('maps browser permission denial to permission-denied status', () => {
    expect(mapGeolocationErrorCode(1)).toBe('permission-denied')
  })

  it('maps non-permission error codes to unavailable status', () => {
    expect(mapGeolocationErrorCode(2)).toBe('unavailable')
    expect(mapGeolocationErrorCode(3)).toBe('unavailable')
  })
})

describe('startGeolocationWatch', () => {
  it('returns unsupported status when geolocation API is missing', () => {
    const snapshots: GeolocationSnapshot[] = []

    const session = startGeolocationWatch({
      geolocation: null,
      watchOptions: { enableHighAccuracy: true },
      onSnapshot: (snapshot) => snapshots.push(snapshot),
    })

    expect(session.watchId).toBeNull()
    expect(snapshots).toEqual([createGeolocationSnapshot('unsupported')])
  })

  it('emits watching first, then ready with latest fix data on successful callback', () => {
    const controller = createMockGeolocation()
    const snapshots: GeolocationSnapshot[] = []

    const session = startGeolocationWatch({
      geolocation: controller.adapter,
      watchOptions: { enableHighAccuracy: true },
      onSnapshot: (snapshot) => snapshots.push(snapshot),
    })

    expect(snapshots[0]).toEqual(createGeolocationSnapshot('watching'))
    expect(session.watchId).not.toBeNull()

    controller.emitSuccess(session.watchId as number, {
      coords: {
        latitude: 14.601,
        longitude: 120.993,
        accuracy: 12,
      },
      timestamp: 1700000000000,
    })

    expect(snapshots[snapshots.length - 1]).toEqual(
      createGeolocationSnapshot('ready', {
        latitude: 14.601,
        longitude: 120.993,
        accuracyMeters: 12,
        timestamp: 1700000000000,
      }),
    )
  })

  it('maps permission denied geolocation errors to explicit status', () => {
    const controller = createMockGeolocation()
    const snapshots: GeolocationSnapshot[] = []

    const session = startGeolocationWatch({
      geolocation: controller.adapter,
      watchOptions: { enableHighAccuracy: true },
      onSnapshot: (snapshot) => snapshots.push(snapshot),
    })

    controller.emitError(session.watchId as number, 1)

    expect(snapshots[snapshots.length - 1]).toEqual(
      createGeolocationSnapshot('permission-denied'),
    )
  })

  it('maps non-permission geolocation errors to unavailable status', () => {
    const controller = createMockGeolocation()
    const snapshots: GeolocationSnapshot[] = []

    const session = startGeolocationWatch({
      geolocation: controller.adapter,
      watchOptions: { enableHighAccuracy: true },
      onSnapshot: (snapshot) => snapshots.push(snapshot),
    })

    controller.emitError(session.watchId as number, 2)

    expect(snapshots[snapshots.length - 1]).toEqual(createGeolocationSnapshot('unavailable'))
  })

  it('clears active watcher exactly once during teardown', () => {
    const controller = createMockGeolocation()

    const session = startGeolocationWatch({
      geolocation: controller.adapter,
      watchOptions: { enableHighAccuracy: true },
      onSnapshot: () => {},
    })

    const watchId = session.watchId as number
    expect(controller.hasWatch(watchId)).toBe(true)

    session.stop()

    expect(controller.adapter.clearWatch).toHaveBeenCalledTimes(1)
    expect(controller.adapter.clearWatch).toHaveBeenCalledWith(watchId)
    expect(controller.hasWatch(watchId)).toBe(false)

    session.stop()

    expect(controller.adapter.clearWatch).toHaveBeenCalledTimes(1)
  })
})
