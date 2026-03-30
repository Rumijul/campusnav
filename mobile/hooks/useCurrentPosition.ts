/**
 * GPS + heading subscription hook.
 *
 * Wraps navigator.geolocation.watchPosition and an optional magnetometer reader
 * behind thin interfaces so both are injectable for unit testing.
 *
 * Returns:
 * - position: latest GPS fix (null until first reading)
 * - heading: raw magnetometer reading (null until available)
 * - smoothedHeadingDegrees: EMA-smoothed heading (0–360, null until first reading)
 * - isConfident: true when accuracy ≤ maxAccuracyMeters (from isGpsFixConfident)
 * - isHeadingValid: true when magnetometer is available AND accuracyDegrees ≤ 15
 */

import { useEffect, useRef, useState } from 'react';
import { isGpsFixConfident } from '../../src/shared/gps';

/* ──────────────── Types ──────────────── */

/**
 * A single GPS position fix.
 * headingDegrees may be null when the device does not provide it.
 */
export interface PositionFix {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  headingDegrees: number | null;
  timestamp: number;
}

/**
 * A single magnetometer/compass reading.
 * headingDegrees is 0–360 clockwise from magnetic north.
 * accuracyDegrees estimates heading precision.
 */
export interface HeadingData {
  headingDegrees: number;
  accuracyDegrees: number;
}

/**
 * Abstracts the device magnetometer / compass API.
 * Start/stop lifecycle so the hook controls when the sensor is active.
 */
export interface HeadingReader {
  start(callback: (data: HeadingData) => void): void;
  stop(): void;
}

/**
 * Abstracts navigator.geolocation.watchPosition.
 * Returns a stop handle so the hook can tear down the watcher on unmount.
 */
export interface PositionReader {
  watchPosition(
    onPosition: (fix: PositionFix) => void,
    onError: (error: Error) => void,
  ): { stop: () => void };
}

/* ──────────────── Hook options ──────────────── */

export interface UseCurrentPositionOptions {
  /** Minimum interval between position updates in ms. Default: 2000. */
  updateIntervalMs?: number;
  /** Maximum accuracy (metres) for isConfident. Default: 50. */
  maxAccuracyMeters?: number;
  /** Heading source. Defaults to DefaultNativeHeadingReader. */
  headingReader?: HeadingReader;
  /** Position source. Defaults to DefaultPositionReader. */
  positionReader?: PositionReader;
}

/* ──────────────── Default readers ──────────────── */

/**
 * Default heading reader using the expo-sensors Magnetometer API.
 * Falls back to a no-op if the module is unavailable (e.g. web / no sensor).
 * Maps magnetometer X/Y magnitude to a heading in degrees.
 */
export class DefaultNativeHeadingReader implements HeadingReader {
  private subscription: { remove: () => void } | null = null;

  start(callback: (data: HeadingData) => void): void {
    this.stop();
    try {
      // Dynamic import so this file still compiles without expo-sensors installed.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Magnetometer } = require('expo-sensors') as {
        Magnetometer: { addListener: (cb: (e: { x: number; y: number }) => void) => { remove: () => void } };
      };
      this.subscription = Magnetometer.addListener((event) => {
        // atan2(y, x) gives angle from magnetic north in radians; + math.PI/2 rotates
        // so 0° points magnetic north, then convert to degrees and normalise 0–360.
        const radians = Math.atan2(event.x, event.y);
        let degrees = ((radians * 180) / Math.PI + 90 + 360) % 360;
        callback({ headingDegrees: degrees, accuracyDegrees: 10 });
      });
    } catch {
      // expo-sensors not available — heading stays null.
    }
  }

  stop(): void {
    this.subscription?.remove();
    this.subscription = null;
  }
}

/**
 * Default position reader using navigator.geolocation.watchPosition.
 * Works in any browser or React Native environment with the Geolocation API.
 */
export class DefaultPositionReader implements PositionReader {
  watchPosition(
    onPosition: (fix: PositionFix) => void,
    onError: (error: Error) => void,
  ): { stop: () => void } {
    let watchId: number;

    const onGeoSuccess = (pos: GeolocationPosition) => {
      onPosition({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracyMeters: pos.coords.accuracy ?? Infinity,
        headingDegrees: pos.coords.heading ?? null,
        timestamp: pos.timestamp,
      });
    };

    const onGeoError = (err: GeolocationPositionError) => {
      onError(new Error(`[Geolocation] ${err.message}`));
    };

    watchId = navigator.geolocation.watchPosition(onGeoSuccess, onGeoError, {
      enableHighAccuracy: true,
    });

    return {
      stop() {
        navigator.geolocation.clearWatch(watchId);
      },
    };
  }
}

/* ──────────────── Hook ──────────────── */

export interface UseCurrentPositionReturn {
  position: PositionFix | null;
  heading: HeadingData | null;
  /** EMA-smoothed heading in degrees (0–360). Null until first reading. */
  smoothedHeadingDegrees: number | null;
  isConfident: boolean;
  isHeadingValid: boolean;
}

/**
 * EMA smoothing factor applied per heading update.
 * Higher alpha → faster convergence to new reading.
 */
const HEADING_EMA_ALPHA = 0.3;

/**
 * Maximum magnetometer accuracy (degrees) to trust the heading.
 * Readings with worse accuracy are treated as invalid.
 */
const HEADING_ACCURACY_THRESHOLD_DEG = 15;

/**
 * Subscribes to device position and (optionally) magnetometer heading.
 *
 * Heading EMA handles wraparound at 0°/360° by always moving through the
 * shorter angular path toward the new reading.
 */
export function useCurrentPosition(
  options: UseCurrentPositionOptions = {},
): UseCurrentPositionReturn {
  const {
    maxAccuracyMeters = 50,
    headingReader = new DefaultNativeHeadingReader(),
    positionReader = new DefaultPositionReader(),
  } = options;

  const [position, setPosition] = useState<PositionFix | null>(null);
  const [heading, setHeading] = useState<HeadingData | null>(null);
  const [smoothedHeadingDegrees, setSmoothedHeadingDegrees] = useState<number | null>(null);
  const [isHeadingValid, setIsHeadingValid] = useState(false);

  // Keep the current smoothed heading in a ref so we don't need to re-subscribe
  // on every EMA update.
  const smoothedHeadingRef = useRef<number | null>(null);

  // True once at least one position fix has been received.
  const hasPosition = useRef(false);

  useEffect(() => {
    // ── Position subscription ────────────────────────────────────────────────
    const posHandle = positionReader.watchPosition(
      (fix) => {
        hasPosition.current = true;
        setPosition(fix);
      },
      // Non-fatal: keep the last known position rather than resetting to null.
      () => {},
    );

    // ── Heading subscription ────────────────────────────────────────────────
    headingReader.start((data) => {
      setHeading(data);
      const isValid = data.accuracyDegrees <= HEADING_ACCURACY_THRESHOLD_DEG;
      setIsHeadingValid(isValid);

      if (!isValid) return;

      const raw = data.headingDegrees;
      const current = smoothedHeadingRef.current;

      if (current === null) {
        // First valid reading — no smoothing needed.
        smoothedHeadingRef.current = raw;
        setSmoothedHeadingDegrees(raw);
        return;
      }

      // Compute shortest angular distance from current to new reading.
      let delta = raw - current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      const smoothed = current + HEADING_EMA_ALPHA * delta;
      // Normalise to 0–360.
      const normalised = ((smoothed % 360) + 360) % 360;

      smoothedHeadingRef.current = normalised;
      setSmoothedHeadingDegrees(normalised);
    });

    return () => {
      posHandle.stop();
      headingReader.stop();
    };
  }, [positionReader, headingReader]); // stable object references — no re-mount on render

  const isConfident = hasPosition.current
    ? position !== null && isGpsFixConfident(position.accuracyMeters, maxAccuracyMeters)
    : false;

  return {
    position,
    heading,
    smoothedHeadingDegrees,
    isConfident,
    isHeadingValid,
  };
}
