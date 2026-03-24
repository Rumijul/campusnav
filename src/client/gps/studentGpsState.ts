import { DEFAULT_MAX_GPS_ACCURACY_METERS, isGpsFixConfident } from '@shared/gps'
import type { GeolocationStatus } from '../hooks/useGeolocation'

export type StudentGpsFallbackReason =
  | 'floor-not-calibrated'
  | 'geolocation-unsupported'
  | 'permission-denied'
  | 'position-unavailable'
  | 'locating'
  | 'low-confidence'
  | 'no-nearest-node'

export interface DeriveStudentGpsStateInput {
  hasFloorCalibration: boolean
  geolocationStatus: GeolocationStatus
  accuracyMeters: number | null
  nearestNodeId: string | null
  maxAccuracyMeters?: number
}

export interface StudentGpsState {
  canUseMyLocation: boolean
  fallbackReason: StudentGpsFallbackReason | null
  fallbackMessage: string | null
  nearestNodeId: string | null
}

function buildFallbackMessage(reason: StudentGpsFallbackReason, maxAccuracyMeters: number): string {
  switch (reason) {
    case 'floor-not-calibrated':
      return 'Location assist is unavailable on this floor. Choose a start point manually.'
    case 'geolocation-unsupported':
      return 'This browser does not support geolocation. Choose a start point manually.'
    case 'permission-denied':
      return 'Location permission is blocked. Enable it or choose a start point manually.'
    case 'position-unavailable':
      return 'We could not determine your location. Try again or choose a start point manually.'
    case 'locating':
      return 'Finding your location… You can still choose a start point manually.'
    case 'low-confidence':
      return `Location accuracy is currently above ${maxAccuracyMeters}m. Choose a start point manually.`
    case 'no-nearest-node':
      return 'No walkable path node was found near your location. Choose a start point manually.'
  }
}

function withFallback(
  reason: StudentGpsFallbackReason,
  nearestNodeId: string | null,
  maxAccuracyMeters: number,
): StudentGpsState {
  return {
    canUseMyLocation: false,
    fallbackReason: reason,
    fallbackMessage: buildFallbackMessage(reason, maxAccuracyMeters),
    nearestNodeId,
  }
}

export function deriveStudentGpsState({
  hasFloorCalibration,
  geolocationStatus,
  accuracyMeters,
  nearestNodeId,
  maxAccuracyMeters = DEFAULT_MAX_GPS_ACCURACY_METERS,
}: DeriveStudentGpsStateInput): StudentGpsState {
  if (!hasFloorCalibration) {
    return withFallback('floor-not-calibrated', nearestNodeId, maxAccuracyMeters)
  }

  if (geolocationStatus === 'unsupported') {
    return withFallback('geolocation-unsupported', nearestNodeId, maxAccuracyMeters)
  }

  if (geolocationStatus === 'permission-denied') {
    return withFallback('permission-denied', nearestNodeId, maxAccuracyMeters)
  }

  if (geolocationStatus === 'unavailable') {
    return withFallback('position-unavailable', nearestNodeId, maxAccuracyMeters)
  }

  if (geolocationStatus === 'watching') {
    return withFallback('locating', nearestNodeId, maxAccuracyMeters)
  }

  if (!isGpsFixConfident(accuracyMeters ?? Number.NaN, maxAccuracyMeters)) {
    return withFallback('low-confidence', nearestNodeId, maxAccuracyMeters)
  }

  if (nearestNodeId == null) {
    return withFallback('no-nearest-node', nearestNodeId, maxAccuracyMeters)
  }

  return {
    canUseMyLocation: true,
    fallbackReason: null,
    fallbackMessage: null,
    nearestNodeId,
  }
}
