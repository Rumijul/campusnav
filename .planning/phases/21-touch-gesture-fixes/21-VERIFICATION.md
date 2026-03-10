---
phase: 21-touch-gesture-fixes
verified: 2026-03-10T10:55:00Z
status: human_needed
score: 5/5 must-haves verified
re_verification: false
human_verification:
  - test: "Pinch-zoom on a rotated floor plan keeps map stationary under fingers"
    expected: "The point between both fingers stays fixed on-screen as the map scales — no jump toward stage origin at any rotation angle"
    why_human: "Touch input, Konva canvas rendering, and multi-touch gesture behavior cannot be verified programmatically. Unit tests validate the math; device behavior requires an actual touch device or Chrome DevTools touch emulation."
  - test: "Two-finger rotation pivots around touch midpoint"
    expected: "The midpoint between both fingers does not move on screen during a two-finger twist — rotation wraps around that point at all canvas rotation angles"
    why_human: "Visual pivot correctness requires observing rendered canvas output during a real gesture — not verifiable from source code alone."
  - test: "Pure pinch gesture (< 2 degrees finger rotation) does not change map rotation"
    expected: "Map rotation stays constant during a straight pinch-to-zoom with no twisting. The 2-degree threshold absorbs incidental finger angle variation."
    why_human: "The threshold logic is unit-tested but whether it feels correct in practice (no visible jitter, no accidental rotation) requires human perception on a touch device."
---

# Phase 21: Touch Gesture Fixes — Verification Report

**Phase Goal:** Fix the three touch gesture bugs (pinch-zoom focal point, rotation pivot, rotation jitter) so mobile users get accurate, stable gesture control of the campus map.
**Verified:** 2026-03-10T10:55:00Z
**Status:** human_needed — all automated checks pass; device verification required for TOUCH-01, TOUCH-02, TOUCH-03
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Pinch-to-zoom on a rotated floor plan keeps map stationary under fingers — no jump toward stage origin | ? HUMAN NEEDED | `toStageLocalFromScreen` uses `getAbsoluteTransform().copy().invert()` — Tests 1–3 (TOUCH-01) pass at 0°, 45°, 90°. Device gesture feel cannot be verified from code. |
| 2 | Two-finger rotation pivots around touch midpoint at all canvas rotation angles | ? HUMAN NEEDED | `computePivotPosition` uses `Konva.Transform` forward projection — Tests 4–5 (TOUCH-02) pass at 0° and 30°. Visual pivot correctness requires device. |
| 3 | Slow pinch gesture with incidental rotation < 2° does not apply any rotation | ? HUMAN NEEDED | `applyRotationThreshold` returns `false` for \|angleDiff\| <= 2° — Tests 6–8 (TOUCH-03) verify strict greater-than boundary. Whether threshold eliminates perceptible jitter requires touch device. |
| 4 | `onScaleChange` callback called after every pinch-zoom scale mutation | ✓ VERIFIED | Line 214: `onScaleChange?.(newScale)` immediately after `stage.scaleX(newScale)` + `stage.scaleY(newScale)` |
| 5 | All 8 vitest tests pass (GREEN) | ✓ VERIFIED | `npx vitest run src/client/hooks/useMapViewport.test.ts` → 8/8 pass. Full suite 72/72 pass, zero regressions. |

**Score:** 5/5 must-haves verified (2 fully automated, 3 automated-math-verified / device-confirmation pending)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/client/hooks/useMapViewport.test.ts` | 8 unit tests (RED scaffold, then GREEN after Plan 02) | ✓ VERIFIED | 257-line file. 8 tests across 3 describe blocks. All 8 pass. Commit `1274ad5`. |
| `src/client/hooks/useMapViewport.ts` | Fixed `handleTouchMove` with inverse-transform focal-point zoom, pivot correction, 2° threshold | ✓ VERIFIED | 393 lines. Exports `toStageLocalFromScreen`, `computePivotPosition`, `applyRotationThreshold`. `handleTouchMove` uses all three. Commit `b443641`. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `useMapViewport.ts` | `Konva.Stage` | `stage.getAbsoluteTransform().copy().invert().point()` | ✓ WIRED | Lines 59, 208 — called at export level (`toStageLocalFromScreen`) and inside `handleTouchMove` |
| `useMapViewport.ts` | `Konva.Transform` | `new Konva.Transform()` forward projection for position recalc | ✓ WIRED | Line 75 (`computePivotPosition` export), invoked from `handleTouchMove` line 224 |
| `useMapViewport.test.ts` | `useMapViewport.ts` | `import { applyRotationThreshold, computePivotPosition, toStageLocalFromScreen }` | ✓ WIRED | Line 28–32 of test file — named exports imported and invoked across all 8 tests |
| `handleTouchMove` (internal) | `applyRotationThreshold` | Called at line 218: `if (applyRotationThreshold(angleDiffDeg))` | ✓ WIRED | Threshold guard applied before rotation mutation |
| `handleTouchMove` (internal) | `computePivotPosition` | Called at line 224: `const newPos = computePivotPosition(...)` | ✓ WIRED | Position recalculated after every scale/rotation mutation |
| `handleTouchMove` (internal) | `onScaleChange` | Called at line 214 after `stage.scaleX(newScale)` | ✓ WIRED | Callback preserved; not skipped |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TOUCH-01 | 21-01-PLAN.md, 21-02-PLAN.md | Pinch-to-zoom zooms toward finger midpoint at all rotation angles | ✓ SATISFIED | `toStageLocalFromScreen` uses Konva inverse transform (not naive division). Tests 1–3 verify at 0°, 45°, 90°. `handleTouchMove` uses this export. |
| TOUCH-02 | 21-01-PLAN.md, 21-02-PLAN.md | Two-finger rotation pivots around touch midpoint | ✓ SATISFIED | `computePivotPosition` forward-projects stageLocal through post-mutation rotation + scale. Tests 4–5 verify pivot math at 0° and 30°. `handleTouchMove` calls this after rotation. |
| TOUCH-03 | 21-01-PLAN.md, 21-02-PLAN.md | 2-degree rotation threshold eliminates micro-rotation jitter | ✓ SATISFIED | `applyRotationThreshold(angleDiffDeg)` returns `false` at exactly 2° (strict `> 2`), `true` at 2.1°. Tests 6–8 verify exact boundary. `handleTouchMove` guards rotation behind this export. |

No orphaned requirements — REQUIREMENTS.md maps TOUCH-01, TOUCH-02, TOUCH-03 to Phase 21; all three are claimed by both plans and verified.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No TODOs, FIXMEs, placeholders, or empty implementations found | — | — |

Scan confirmed: no `TODO`, `FIXME`, `XXX`, `HACK`, `placeholder`, `return null`, `return {}`, or `=> {}` patterns in `useMapViewport.ts` or `useMapViewport.test.ts`.

---

### Human Verification Required

#### 1. TOUCH-01 — Pinch-zoom focal point on rotated map

**Test:** Open the app on a touch device (or Chrome DevTools with touch emulation). Navigate to any floor plan. Rotate the map approximately 45° using a two-finger twist. Then pinch to zoom in and out.

**Expected:** The point between your two fingers stays visually fixed on the canvas as it scales. The map does not jump toward the top-left (stage origin) during zoom at non-zero rotation.

**Why human:** The unit tests validate `toStageLocalFromScreen` math at 0°, 45°, and 90° using mock Konva.Transform objects. What cannot be verified programmatically is whether the Konva stage's live `getAbsoluteTransform()` matches the mock under real rendering, and whether the visual result is perceptibly correct to the user.

---

#### 2. TOUCH-02 — Rotation pivots at touch midpoint

**Test:** On a touch device, place two fingers on the floor plan and slowly twist them (rotate) without pinching.

**Expected:** The midpoint between your two fingers stays stationary on screen. The map rotates around that point, not around the map center or the stage origin.

**Why human:** `computePivotPosition` math is verified algebraically by Tests 4–5 — they confirm `mapped = screenCenter` within 1e-6 tolerance. Whether the Konva stage rendering actually reflects this — and whether the visual pivot is perceptible to the user — requires device observation.

---

#### 3. TOUCH-03 — Jitter threshold suppresses incidental rotation during pure pinch

**Test:** On a touch device, perform a slow pinch-zoom (move fingers apart or together) without intentionally twisting. Watch the map rotation indicator (or a reference landmark) during the gesture.

**Expected:** The map's rotation angle does not change during a pure pinch gesture. Small incidental finger angle variation (< 2°) is absorbed silently.

**Why human:** `applyRotationThreshold` is unit-tested at 1°, 2°, and 2.1° boundaries. Whether this 2-degree dead zone feels "right" in practice — neither too sensitive (still jitters) nor too coarse (feels sluggish to intentional rotation) — can only be judged by a human using a real touch device.

---

### Gaps Summary

No automated gaps. All five Plan 02 must-haves are verified:

1. The buggy `pointTo` formula (naive division) has been replaced — `toStageLocalFromScreen` uses Konva's inverse transform, verified at 0°, 45°, 90°.
2. The `dx/dy` double-counting pan terms have been removed — `computePivotPosition` recalculates position from the pre-mutation stage-local anchor.
3. The 2° rotation threshold is implemented as strict `> 2` — `applyRotationThreshold(2)` returns `false`, `applyRotationThreshold(2.1)` returns `true`.
4. `onScaleChange?.(newScale)` is called at line 214 immediately after scale mutation, before rotation or position recalculation.
5. All 8 vitest tests pass GREEN; full suite 72/72 pass with no regressions.

The only items not automatically verifiable are the three touch behaviors on an actual device — as expected for a gesture/rendering phase.

---

### Commits Verified

| Commit | Description | Status |
|--------|-------------|--------|
| `1274ad5` | `test(21-01)`: 8 failing tests for TOUCH-01, TOUCH-02, TOUCH-03 | ✓ Exists |
| `b443641` | `feat(21-02)`: inverse-transform focal-point + threshold fix in `handleTouchMove` | ✓ Exists |
| `3c0d757` | `docs(21-01)`: plan 01 summary | ✓ Exists |
| `954439c` | `docs(21-02)`: plan 02 summary | ✓ Exists |

---

_Verified: 2026-03-10T10:55:00Z_
_Verifier: Claude (gsd-verifier)_
