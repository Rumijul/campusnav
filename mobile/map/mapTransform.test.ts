import { describe, expect, it } from 'vitest';

import {
  MAX_VIEWPORT_SCALE,
  MIN_VIEWPORT_SCALE,
  applyPanDelta,
  applyPinchRotate,
  clampViewportScale,
  createInitialMapTransform,
  mapTransformsEqual,
  normalizeRotationDeg,
  screenFromWorld,
  worldFromScreen,
  type MapTransform,
} from './mapTransform';

const EPSILON = 1e-6;

function approximatelyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < EPSILON;
}

describe('mapTransform', () => {
  it('anchors focal point under pinch+rotate transforms without drift', () => {
    const transform: MapTransform = {
      scale: 1.4,
      rotationDeg: 25,
      translation: { x: 40, y: -30 },
    };
    const focal = { x: 210, y: 160 };
    const worldAnchor = worldFromScreen(focal, transform);

    const next = applyPinchRotate(transform, {
      scaleFactor: 1.3,
      rotationDeltaDeg: 22,
      focal,
      viewport: { width: 360, height: 640 },
    });

    const mapped = screenFromWorld(worldAnchor, next);

    expect(approximatelyEqual(mapped.x, focal.x)).toBe(true);
    expect(approximatelyEqual(mapped.y, focal.y)).toBe(true);
  });

  it('normalizes wraparound rotation into [-180, 180)', () => {
    expect(normalizeRotationDeg(185)).toBe(-175);
    expect(normalizeRotationDeg(-181)).toBe(179);

    const wrapped = applyPinchRotate(
      {
        scale: 1,
        rotationDeg: 179,
        translation: { x: 0, y: 0 },
      },
      {
        scaleFactor: 1,
        rotationDeltaDeg: 5,
        focal: { x: 120, y: 80 },
        viewport: { width: 240, height: 240 },
      },
    );

    expect(wrapped.rotationDeg).toBe(-176);
  });

  it('clamps zoom to min and max bounds', () => {
    const zoomedOut = clampViewportScale(0.01);
    const zoomedIn = clampViewportScale(99);

    expect(zoomedOut).toBe(MIN_VIEWPORT_SCALE);
    expect(zoomedIn).toBe(MAX_VIEWPORT_SCALE);

    const transform = {
      scale: 3.9,
      rotationDeg: 0,
      translation: { x: 0, y: 0 },
    };

    const next = applyPinchRotate(transform, {
      scaleFactor: 2,
      rotationDeltaDeg: 0,
      focal: { x: 80, y: 80 },
      viewport: { width: 160, height: 160 },
    });

    expect(next.scale).toBe(MAX_VIEWPORT_SCALE);
  });

  it('ignores malformed gesture frames (NaN/Infinity/missing viewport) and keeps stable transform', () => {
    const stable = {
      scale: 1.2,
      rotationDeg: 15,
      translation: { x: 10, y: 12 },
    };

    const nextNaNScale = applyPinchRotate(stable, {
      scaleFactor: Number.NaN,
      rotationDeltaDeg: 0,
      focal: { x: 10, y: 10 },
      viewport: { width: 100, height: 100 },
    });

    const nextInfinityRotation = applyPinchRotate(stable, {
      scaleFactor: 1,
      rotationDeltaDeg: Number.POSITIVE_INFINITY,
      focal: { x: 10, y: 10 },
      viewport: { width: 100, height: 100 },
    });

    const nextMissingViewport = applyPinchRotate(stable, {
      scaleFactor: 1.1,
      rotationDeltaDeg: 5,
      focal: { x: 10, y: 10 },
      viewport: undefined,
    });

    expect(mapTransformsEqual(nextNaNScale, stable)).toBe(true);
    expect(mapTransformsEqual(nextInfinityRotation, stable)).toBe(true);
    expect(mapTransformsEqual(nextMissingViewport, stable)).toBe(true);
  });

  it('applies pan deltas and rejects malformed pan inputs', () => {
    const transform = createInitialMapTransform();

    const panned = applyPanDelta(transform, { x: 24, y: -16 });
    expect(panned.translation).toEqual({ x: 24, y: -16 });

    const malformed = applyPanDelta(panned, { x: Number.NaN, y: 3 });
    expect(mapTransformsEqual(malformed, panned)).toBe(true);
  });
});
