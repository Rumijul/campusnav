/**
 * useMapViewport — gesture math unit tests (RED phase)
 *
 * Strategy: Test the FORMULAS as pure functions using mock Konva.Stage-like objects.
 * These tests do NOT import useMapViewport — they validate the corrected arithmetic
 * that Plan 02 will implement.
 *
 * Design: Each test calls a formula function that Plan 02 must export from
 * useMapViewport (or a helper file). The tests import those exports by name.
 * Since those exports do NOT yet exist in the production code, all 8 tests fail
 * with "not a function" / "undefined is not a function" style errors, which
 * constitutes a RED state.
 *
 * Requirements covered:
 *   TOUCH-01: focal-point zoom stays at finger midpoint at all rotation angles
 *   TOUCH-02: two-finger rotation pivots around touch midpoint
 *   TOUCH-03: per-frame 2-degree rotation threshold eliminates micro-jitter
 */

import Konva from 'konva'
import { describe, expect, it } from 'vitest'

// ---------------------------------------------------------------------------
// Imports from production code that Plan 02 must add.
// These do NOT exist yet — all tests will fail with import errors until implemented.
// ---------------------------------------------------------------------------

import {
  applyRotationThreshold,
  computePivotPosition,
  toStageLocalFromScreen,
} from './useMapViewport'

// ---------------------------------------------------------------------------
// Tolerance for floating-point comparisons
// ---------------------------------------------------------------------------

const EPS = 1e-6

function approx(actual: number, expected: number, eps = EPS): boolean {
  return Math.abs(actual - expected) < eps
}

// ---------------------------------------------------------------------------
// MockStage factory
//
// Builds a plain object that mimics the Konva.Stage API surface used in the
// corrected handleTouchMove formula. The getAbsoluteTransform mock is built
// from a real Konva.Transform so the math is identical to what the real stage
// produces.
// ---------------------------------------------------------------------------

type MockStage = {
  x: () => number
  y: () => number
  scaleX: () => number
  scaleY: () => number
  rotation: () => number
  getAbsoluteTransform: () => {
    copy: () => { invert: () => { point: (p: { x: number; y: number }) => { x: number; y: number } } }
  }
  container: () => { getBoundingClientRect: () => { left: number; top: number } }
}

interface MockStageOpts {
  x?: number
  y?: number
  scale?: number
  /** rotation in degrees */
  rotationDeg?: number
  /** container top-left offset (default 0, 0) */
  containerLeft?: number
  containerTop?: number
}

function mockStage(opts: MockStageOpts = {}): MockStage {
  const sx = opts.x ?? 0
  const sy = opts.y ?? 0
  const scale = opts.scale ?? 1
  const rotDeg = opts.rotationDeg ?? 0
  const containerLeft = opts.containerLeft ?? 0
  const containerTop = opts.containerTop ?? 0

  // Build a real Konva.Transform that encodes translate + rotate + scale.
  // This is the same decomposition Konva.Stage uses internally for getAbsoluteTransform().
  // Order: translate → rotate → scale  (Konva applies transforms in this order)
  const t = new Konva.Transform()
  t.translate(sx, sy)
  t.rotate((rotDeg * Math.PI) / 180) // Konva.Transform.rotate() takes radians
  t.scale(scale, scale)

  return {
    x: () => sx,
    y: () => sy,
    scaleX: () => scale,
    scaleY: () => scale,
    rotation: () => rotDeg,
    getAbsoluteTransform: () => ({
      copy: () => ({
        invert: () => ({
          point: (p: { x: number; y: number }) => t.copy().invert().point(p),
        }),
      }),
    }),
    container: () => ({
      getBoundingClientRect: () => ({ left: containerLeft, top: containerTop }),
    }),
  }
}

// ---------------------------------------------------------------------------
// TOUCH-01: focal-point zoom stays at finger midpoint at all rotation angles
//
// Tests call toStageLocalFromScreen(stage, screenPoint) — a helper that Plan 02
// must export from useMapViewport.ts. This function must use Konva's inverse
// transform (NOT naive division) so it is correct at any rotation angle.
// ---------------------------------------------------------------------------

describe('TOUCH-01: focal-point zoom', () => {
  it('Test 1: At 0° rotation — toStageLocalFromScreen returns correct stage-local coords', () => {
    // Arrange: stage at (0,0), scale=1, no rotation
    const stage = mockStage({ x: 0, y: 0, scale: 1, rotationDeg: 0 })
    const screenPoint = { x: 200, y: 300 }

    // toStageLocalFromScreen must be exported from useMapViewport — Plan 02 must add this.
    // At 0° with stage at origin: stageLocal = (200, 300) because inverse transform = identity
    const stageLocal = toStageLocalFromScreen(stage as Parameters<typeof toStageLocalFromScreen>[0], screenPoint)

    // Verify the result matches what the Konva inverse transform produces
    expect(approx(stageLocal.x, 200)).toBe(true)
    expect(approx(stageLocal.y, 300)).toBe(true)
  })

  it('Test 2: At 45° rotation — toStageLocalFromScreen uses inverse transform (NOT naive division)', () => {
    // Arrange: stage at (0,0), scale=1, rotated 45°
    const stage = mockStage({ x: 0, y: 0, scale: 1, rotationDeg: 45 })
    const screenPoint = { x: 100, y: 100 }

    // The CORRECT inverse-transform result for (100,100) at 45° rotation
    // At 45°, screen (100,100) maps to stage-local: rotate by -45°
    // stageLocal.x = 100*cos(-45°) - 100*sin(-45°) = 100*(√2/2) + 100*(√2/2) = 100√2 ≈ 141.42
    // stageLocal.y = 100*sin(-45°) + 100*cos(-45°) = -100*(√2/2) + 100*(√2/2) = 0
    const expectedStageLocalX = 100 * Math.SQRT2  // ≈ 141.42
    const expectedStageLocalY = 0

    const stageLocal = toStageLocalFromScreen(stage as Parameters<typeof toStageLocalFromScreen>[0], screenPoint)

    // The naive buggy formula would give: (100 - 0) / 1 = 100, (100 - 0) / 1 = 100
    // The correct inverse-transform result must be different
    expect(approx(stageLocal.x, expectedStageLocalX, 1e-4)).toBe(true)
    expect(approx(stageLocal.y, expectedStageLocalY, 1e-4)).toBe(true)
  })

  it('Test 3: At 90° rotation — toStageLocalFromScreen correctly maps screen axes to rotated stage axes', () => {
    // Arrange: stage at (0,0), scale=1, rotated 90°
    const stage = mockStage({ x: 0, y: 0, scale: 1, rotationDeg: 90 })
    const screenPoint = { x: 150, y: 200 }

    // The CORRECT inverse-transform result for (150,200) at 90° rotation
    // At 90°, screen (150,200) maps to stage-local: rotate by -90°
    // stageLocal.x = 150*cos(-90°) - 200*sin(-90°) = 0 + 200 = 200
    // stageLocal.y = 150*sin(-90°) + 200*cos(-90°) = -150 + 0 = -150
    const expectedStageLocalX = 200
    const expectedStageLocalY = -150

    const stageLocal = toStageLocalFromScreen(stage as Parameters<typeof toStageLocalFromScreen>[0], screenPoint)

    // The naive buggy formula gives: (150 - 0) / 1 = 150, (200 - 0) / 1 = 200 — WRONG
    expect(approx(stageLocal.x, expectedStageLocalX, 1e-4)).toBe(true)
    expect(approx(stageLocal.y, expectedStageLocalY, 1e-4)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// TOUCH-02: two-finger rotation pivots around touch midpoint
//
// Tests call computePivotPosition(stageLocal, screenCenter, newScale, newRotationDeg)
// — a helper that Plan 02 must export from useMapViewport.ts. This function
// computes the stage position that keeps stageLocal fixed under screenCenter
// after applying newScale and newRotationDeg.
// ---------------------------------------------------------------------------

describe('TOUCH-02: rotation pivot at touch midpoint', () => {
  it('Test 4: At 0° rotation — apply 10° rotation, position recalculated so midpoint stays fixed', () => {
    // Arrange: stageLocal = (150, 200), screenCenter = (150, 200), newRotation = 10°
    // At 0° initial rotation with stage at origin: stageLocal = screenCenter = (150, 200)
    const stageLocal = { x: 150, y: 200 }
    const screenCenter = { x: 150, y: 200 }
    const newScale = 1
    const newRotationDeg = 10

    // computePivotPosition must be exported from useMapViewport — Plan 02 must add this.
    // It computes: rotate(newRotDeg) * scale(newScale) * stageLocal = projected
    //              newPos = screenCenter - projected
    const newPos = computePivotPosition(stageLocal, screenCenter, newScale, newRotationDeg)

    // Verify: forward-project stageLocal through new transform => should land at screenCenter
    const t = new Konva.Transform()
    t.translate(newPos.x, newPos.y)
    t.rotate((newRotationDeg * Math.PI) / 180)
    t.scale(newScale, newScale)
    const mapped = t.point(stageLocal)

    expect(approx(mapped.x, screenCenter.x)).toBe(true)
    expect(approx(mapped.y, screenCenter.y)).toBe(true)
  })

  it('Test 5: At 30° initial rotation — apply 5° additional rotation, midpoint still stationary', () => {
    // Arrange: stage at (50, 100), scale=1.5, already rotated 30°, pinch at screen (200, 250)
    const stage = mockStage({ x: 50, y: 100, scale: 1.5, rotationDeg: 30 })
    const screenCenter = { x: 200, y: 250 }
    const newScale = 1.5
    const newRotationDeg = 35 // 30° + 5° additional

    // Get stage-local using the CORRECT inverse transform (toStageLocalFromScreen)
    const stageLocal = toStageLocalFromScreen(stage as Parameters<typeof toStageLocalFromScreen>[0], screenCenter)

    // Compute correcting position
    const newPos = computePivotPosition(stageLocal, screenCenter, newScale, newRotationDeg)

    // Verify: forward-project stageLocal through new transform => should land at screenCenter
    const t = new Konva.Transform()
    t.translate(newPos.x, newPos.y)
    t.rotate((newRotationDeg * Math.PI) / 180)
    t.scale(newScale, newScale)
    const mapped = t.point(stageLocal)

    expect(approx(mapped.x, screenCenter.x)).toBe(true)
    expect(approx(mapped.y, screenCenter.y)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// TOUCH-03: per-frame 2-degree rotation threshold
//
// Tests call applyRotationThreshold(angleDiffDeg) — a helper that Plan 02 must
// export from useMapViewport.ts. This function returns true if the angleDiff
// should be applied (> 2°), false if it should be discarded (<= 2°).
// ---------------------------------------------------------------------------

describe('TOUCH-03: rotation threshold', () => {
  it('Test 6: angleDiff of 1° — rotation NOT applied (|1| <= 2)', () => {
    // applyRotationThreshold must be exported from useMapViewport — Plan 02 must add this.
    // Threshold is STRICT greater-than: |angleDiff| > 2 degrees
    expect(applyRotationThreshold(1)).toBe(false)
  })

  it('Test 7: angleDiff of exactly 2° — rotation NOT applied (threshold is strict greater-than)', () => {
    // |2| > 2 is false — rotation is NOT applied at exactly 2°
    expect(applyRotationThreshold(2)).toBe(false)
  })

  it('Test 8: angleDiff of 2.1° — rotation IS applied (|2.1| > 2 is true)', () => {
    // |2.1| > 2 is true — rotation IS applied above threshold
    expect(applyRotationThreshold(2.1)).toBe(true)
  })
})
