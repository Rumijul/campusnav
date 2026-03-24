import { useEffect, useMemo, useState } from 'react'

export type GeolocationStatus =
  | 'unsupported'
  | 'watching'
  | 'ready'
  | 'permission-denied'
  | 'unavailable'

export interface GeolocationFix {
  latitude: number
  longitude: number
  accuracyMeters: number
  timestamp: number
}

export interface GeolocationSnapshot {
  status: GeolocationStatus
  fix: GeolocationFix | null
  accuracyMeters: number | null
}

export interface GeolocationPositionLike {
  coords: {
    latitude: number
    longitude: number
    accuracy: number
  }
  timestamp: number
}

export interface GeolocationErrorLike {
  code: number
}

export interface GeolocationAdapter {
  watchPosition: (
    success: (position: GeolocationPositionLike) => void,
    error?: (error: GeolocationErrorLike) => void,
    options?: PositionOptions,
  ) => number
  clearWatch: (watchId: number) => void
}

export interface GeolocationWatchSession {
  watchId: number | null
  stop: () => void
}

export interface UseGeolocationOptions {
  enabled?: boolean
  geolocation?: GeolocationAdapter | null
  watchOptions?: PositionOptions
}

interface StartGeolocationWatchOptions {
  geolocation: GeolocationAdapter | null
  watchOptions: PositionOptions
  onSnapshot: (snapshot: GeolocationSnapshot) => void
}

const GEOLOCATION_PERMISSION_DENIED_CODE = 1

const DEFAULT_WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000,
}

const INACTIVE_GEOLOCATION_SNAPSHOT = createGeolocationSnapshot('unavailable')

export function createGeolocationSnapshot(
  status: GeolocationStatus,
  fix: GeolocationFix | null = null,
): GeolocationSnapshot {
  return {
    status,
    fix,
    accuracyMeters: fix?.accuracyMeters ?? null,
  }
}

export function mapGeolocationErrorCode(code: number): 'permission-denied' | 'unavailable' {
  return code === GEOLOCATION_PERMISSION_DENIED_CODE ? 'permission-denied' : 'unavailable'
}

export function startGeolocationWatch({
  geolocation,
  watchOptions,
  onSnapshot,
}: StartGeolocationWatchOptions): GeolocationWatchSession {
  if (geolocation == null) {
    onSnapshot(createGeolocationSnapshot('unsupported'))
    return {
      watchId: null,
      stop: () => {},
    }
  }

  let isActive = true

  const emitSnapshot = (snapshot: GeolocationSnapshot) => {
    if (!isActive) return
    onSnapshot(snapshot)
  }

  emitSnapshot(createGeolocationSnapshot('watching'))

  let watchId: number

  try {
    watchId = geolocation.watchPosition(
      (position) => {
        const fix = toGeolocationFix(position)
        if (fix == null) {
          emitSnapshot(createGeolocationSnapshot('unavailable'))
          return
        }
        emitSnapshot(createGeolocationSnapshot('ready', fix))
      },
      (error) => {
        emitSnapshot(createGeolocationSnapshot(mapGeolocationErrorCode(error.code)))
      },
      watchOptions,
    )
  } catch {
    emitSnapshot(createGeolocationSnapshot('unavailable'))
    return {
      watchId: null,
      stop: () => {
        isActive = false
      },
    }
  }

  return {
    watchId,
    stop: () => {
      if (!isActive) return
      isActive = false
      geolocation.clearWatch(watchId)
    },
  }
}

function toGeolocationFix(position: GeolocationPositionLike): GeolocationFix | null {
  const latitude = position.coords.latitude
  const longitude = position.coords.longitude
  const accuracyMeters = position.coords.accuracy
  const timestamp = position.timestamp

  if (!Number.isFinite(latitude)) return null
  if (!Number.isFinite(longitude)) return null
  if (!Number.isFinite(accuracyMeters) || accuracyMeters < 0) return null
  if (!Number.isFinite(timestamp)) return null

  return {
    latitude,
    longitude,
    accuracyMeters,
    timestamp,
  }
}

function resolveNavigatorGeolocation(): GeolocationAdapter | null {
  if (typeof navigator === 'undefined') return null
  if (navigator.geolocation == null) return null

  return {
    watchPosition: navigator.geolocation.watchPosition.bind(navigator.geolocation),
    clearWatch: navigator.geolocation.clearWatch.bind(navigator.geolocation),
  }
}

export function useGeolocation(options: UseGeolocationOptions = {}): GeolocationSnapshot {
  const enabled = options.enabled ?? true
  const geolocation = useMemo(
    () => options.geolocation ?? resolveNavigatorGeolocation(),
    [options.geolocation],
  )
  const watchOptions = options.watchOptions ?? DEFAULT_WATCH_OPTIONS

  const [snapshot, setSnapshot] = useState<GeolocationSnapshot>(() => {
    if (!enabled) return INACTIVE_GEOLOCATION_SNAPSHOT
    if (geolocation == null) return createGeolocationSnapshot('unsupported')
    return createGeolocationSnapshot('watching')
  })

  useEffect(() => {
    if (!enabled) {
      setSnapshot(INACTIVE_GEOLOCATION_SNAPSHOT)
      return
    }

    const session = startGeolocationWatch({
      geolocation,
      watchOptions,
      onSnapshot: setSnapshot,
    })

    return () => {
      session.stop()
    }
  }, [enabled, geolocation, watchOptions])

  return snapshot
}
