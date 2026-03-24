# Phase 21: Touch Gesture Fixes - Research

**Researched:** 2026-03-10
**Domain:** Konva.js touch gesture math — pinch-zoom focal point, two-finger rotation pivot, per-frame rotation threshold
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Coordinate conversion (TOUCH-01 / TOUCH-02 fix)
- Use `stage.getAbsoluteTransform().copy().invert().point(center)` to convert the touch midpoint from screen coordinates to stage-local coordinates — this is Konva's own approach for `getPointerPosition()` and handles all rotation angles correctly
- Before passing to the inverse transform, offset clientX/clientY by `stage.container().getBoundingClientRect()` top-left, so the math is correct regardless of where the stage container sits on the page

#### Rotation pivot fix (TOUCH-02)
- After computing the new rotation, adjust the stage position so the touch midpoint remains stationary on screen — same "point stays under pointer" pattern used for wheel-zoom, but applied to the rotated midpoint
- Both scale and rotation apply independently in the same frame (no dominance logic)

#### Rotation jitter threshold (TOUCH-03)
- Per-frame dead zone: only apply `angleDiff` if `|angleDiff| > 2°` — sub-threshold deltas are silently discarded, no accumulation buffer
- Same 2° threshold applies to both student canvas and admin editor (fix is in the shared `useMapViewport` hook, no per-caller configuration needed)
- First frame of gesture remains initialization-only (stores lastDist / lastCenter / lastAngle, returns early) — threshold only applies from frame 2 onward

#### One-finger recovery after pinch
- On any `touchend`, reset all tracking refs (`lastDist`, `lastCenter`, `lastAngle`) — current behavior
- No distinction between 2→1 finger and 1→0 finger transitions; Konva's built-in `draggable` resumes single-finger pan automatically
- Rotation persists after gesture ends — no snap-back to nearest 90° on touchend
- `fitToScreen()` and floor-switch (already calls fitToScreen) continue to reset rotation to 0°

### Claude's Discretion
- Whether to extract a `toStageLocal(stage, screenPoint)` helper or inline the transform inversion
- Exact variable naming for the midpoint and pointTo calculations
- Whether to add a brief JSDoc comment explaining the coordinate conversion

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TOUCH-01 | Pinch-to-zoom zooms toward the midpoint of both fingers at all rotation angles (not the stage origin) | Konva Transform API: `stage.getAbsoluteTransform().copy().invert().point()` converts screen midpoint to stage-local coords correctly at any rotation angle; then the standard `pointTo` / position recalculation pattern ensures the focal point stays fixed |
| TOUCH-02 | Two-finger rotation pivots around the touch midpoint (not the stage origin) | After applying `stage.rotation()`, recalculate `stage.position()` so that the stage-local point under the screen midpoint remains at the same screen position — mirrors the wheel-zoom pattern already implemented in `handleWheel` |
| TOUCH-03 | Two-finger gesture applies a 2-degree rotation threshold to eliminate micro-rotation jitter during pinch-zoom | Per-frame `|angleDiff| <= 2°` guard: skip `stage.rotation()` mutation when delta is below threshold; no accumulation needed |
</phase_requirements>

---

## Summary

Phase 21 fixes two related bugs in `handleTouchMove` inside `src/client/hooks/useMapViewport.ts`. Both bugs share the same root cause: the current code computes the touch midpoint in raw screen coordinates and uses it directly in Konva stage-space arithmetic, without accounting for the stage's current rotation transform. When the stage is rotated (e.g. the user has done a two-finger rotate), the stage axes are no longer aligned with the screen axes, so the focal-point math produces incorrect position offsets and the map jumps toward the stage origin instead of staying under the fingers.

The fix follows the same technique Konva uses internally for `getPointerPosition()` and `getRelativePointerPosition()`: invert the stage's absolute transform matrix and apply it to the screen-space midpoint to obtain the correct stage-local coordinate. From there, the existing `mousePointTo` / position recalculation pattern (already proven correct in `handleWheel`) can be applied unchanged. A secondary fix adds a per-frame 2-degree dead zone to the rotation delta to suppress the micro-rotation jitter that occurs during a pure pinch gesture where fingers shift slightly.

All changes are confined to a single function (`handleTouchMove`). No new libraries are needed. No new API surface is introduced. The fix applies to both the student `FloorPlanCanvas` and admin `MapEditorCanvas` because they both consume `useMapViewport`.

**Primary recommendation:** Replace the manual `(center.x - stage.x()) / stage.scaleX()` inverse with `stage.getAbsoluteTransform().copy().invert().point(offsetCenter)` and mirror the `handleWheel` position recalculation pattern, then add the `|angleDiff| > 2°` guard before applying rotation.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| konva | ^10.2.0 | Canvas stage/transform manipulation | Already in project; provides `Transform.copy().invert().point()` API |
| react-konva | ^19.2.2 | React bindings for Konva | Already in project; Stage ref gives direct Konva node access |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^4.0.18 | Unit test runner | Testing pure helper functions extracted from the hook |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `getAbsoluteTransform().copy().invert().point()` | Manual matrix math (sin/cos decomposition) | Manual is error-prone and fragile; Konva's own API is the authoritative implementation |
| Per-frame threshold (TOUCH-03) | Accumulation buffer | Buffer introduces latency; per-frame discard is simpler and sufficient per user decision |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure
The fix is entirely within the existing hook. No new files are required unless the developer chooses to extract a helper:

```
src/client/hooks/
├── useMapViewport.ts         # All changes land here — handleTouchMove only
└── useMapViewport.test.ts    # New: unit tests for the fixed logic (Wave 0 gap)
```

### Pattern 1: Konva Inverse-Transform for Screen-to-Stage Conversion

**What:** When a Konva Stage has a non-zero rotation, the stage's x/y position and scale axes are rotated relative to the screen. To map a screen point (e.g. touch midpoint in `clientX/clientY`) to stage-local coordinates, you must invert the full absolute transform rather than naively dividing by scale.

**When to use:** Any time touch/mouse coordinates in screen space need to be expressed in the stage's local coordinate system, especially when the stage may be rotated.

**Correct pattern (TOUCH-01 / TOUCH-02):**
```typescript
// Source: Konva Transform API — https://konvajs.org/api/Konva.Transform.html
// and Konva internal implementation of getPointerPosition()

// Step 1: Offset clientX/Y by container top-left to get stage-relative screen coords
const rect = stage.container().getBoundingClientRect()
const screenCenter = {
  x: center.x - rect.left,
  y: center.y - rect.top,
}

// Step 2: Invert the absolute transform to map screen → stage-local
const stageLocal = stage.getAbsoluteTransform().copy().invert().point(screenCenter)

// Step 3: Compute new scale
const newScale = clamp(stage.scaleX() * (dist / lastDist.current), MIN_SCALE, MAX_SCALE)

// Step 4: Apply scale, then reposition so stageLocal stays under screenCenter
stage.scaleX(newScale)
stage.scaleY(newScale)

// Step 5: After scale, also apply rotation if threshold exceeded
const angleDiffDeg = angleDiff * (180 / Math.PI)
if (Math.abs(angleDiffDeg) > 2) {
  stage.rotation(stage.rotation() + angleDiffDeg)
}

// Step 6: Reposition — mirrors handleWheel "point stays under pointer" pattern
// Re-invert AFTER rotation change so position accounts for new rotation
const newTransform = stage.getAbsoluteTransform().copy().invert()
const newCenter = newTransform.point(screenCenter)
// The offset needed = screenCenter - (newCenter projected back through new scale/rotation)
stage.position({
  x: screenCenter.x - stageLocal.x * newScale,   // NOTE: see Anti-Patterns below
  y: screenCenter.y - stageLocal.y * newScale,
})
```

**Important nuance:** After changing `stage.rotation()`, `stage.getAbsoluteTransform()` reflects the new rotation. The position must be recalculated so that `stageLocal` (the point that was under the finger before scale/rotation) maps back to `screenCenter`. The correct formulation uses the pre-mutation stageLocal point:

```typescript
// Source: mirrors handleWheel in useMapViewport.ts (existing reference implementation)
// The wheel version (no rotation) is:
//   pointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale }
//   stage.position({ x: pointer.x - pointTo.x * newScale, y: pointer.y - pointTo.y * newScale })
//
// The touch version with rotation uses the inverted transform instead of manual division.
// After applying both scale AND rotation mutations, the stage position that keeps
// stageLocal under screenCenter is obtained by re-applying the updated forward transform:
//   screenCenter = stage.getAbsoluteTransform().point(stageLocal)
//   => stage.position({
//       x: screenCenter.x - ... (algebra using current rotation matrix)
//      })
//
// Simplest correct implementation: apply scale+rotation first to the stage node,
// then call stage.position() using the relationship:
//   new_stage_pos.x = screenCenter.x - (stageLocal.x * cos(θ) - stageLocal.y * sin(θ)) * newScale
//   new_stage_pos.y = screenCenter.y - (stageLocal.x * sin(θ) + stageLocal.y * cos(θ)) * newScale
// where θ is stage.rotation() in radians after the rotation mutation.
//
// Alternatively: use Konva's own transform composition to avoid manual trig:
//   const t = new Konva.Transform()
//   t.rotate(stage.rotation() * Math.PI / 180)
//   t.scale(newScale, newScale)
//   const projected = t.point(stageLocal)
//   stage.position({ x: screenCenter.x - projected.x, y: screenCenter.y - projected.y })
```

### Pattern 2: Per-Frame Rotation Dead Zone (TOUCH-03)

**What:** Before applying a rotation delta, check whether `|angleDiff| > threshold`. If not, discard silently and do not accumulate.

**When to use:** Any gesture where incidental small-angle rotation from finger drift should not affect the map orientation.

```typescript
// Source: user decision in CONTEXT.md
const angleDiffDeg = (angle - lastAngle.current) * (180 / Math.PI)
if (Math.abs(angleDiffDeg) > 2) {
  stage.rotation(stage.rotation() + angleDiffDeg)
  // position recalculation follows here
}
// No else accumulation — sub-threshold deltas are discarded each frame
```

### Anti-Patterns to Avoid

- **Manual scale-only inverse when stage is rotated:** The existing bug `pointTo = { x: (center.x - stage.x()) / stage.scaleX(), ... }` is only correct when `stage.rotation() === 0`. With a rotated stage, this produces wrong stage-local coordinates, causing the map to jump. **Fix:** use `stage.getAbsoluteTransform().copy().invert().point()`.

- **Accumulating sub-threshold rotation deltas:** Buffering small angleDiffs and applying when they exceed the threshold introduces latency and complexity. Per the locked decision: discard sub-threshold deltas each frame with no accumulation.

- **Re-ordering rotation before position:** Applying `stage.position()` before `stage.rotation()` and then trying to compensate will produce wrong results because the transform matrix changes with rotation. Apply scale and rotation first, then compute the correcting position.

- **Using clientX/clientY directly without container offset:** `stage.container().getBoundingClientRect()` must be subtracted first. If the stage container is not at (0,0) on the page (e.g. in the admin editor where the canvas panel is a flex child), raw clientX/clientY will be wrong.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Screen-to-stage coordinate conversion at arbitrary rotation | Manual sin/cos matrix decomposition | `stage.getAbsoluteTransform().copy().invert().point()` | Konva's own implementation handles all transform combinations; manual code introduces rotation-direction sign errors |
| Stage transform recomposition after rotation | Manual trig with `Math.cos(θ)` etc | `new Konva.Transform()` + `.rotate()` + `.scale()` + `.point()` | Avoids rounding and sign convention errors in custom matrix math |

**Key insight:** The Konva `Transform` class is the same one Konva itself uses to compute pointer positions. Using it eliminates all the edge cases from combined rotation+scale+translation that manual math would have to re-derive.

---

## Common Pitfalls

### Pitfall 1: Container Offset Not Subtracted
**What goes wrong:** Touch midpoint is computed from `t0.clientX / t1.clientX` (viewport-relative), but the stage may not be at viewport origin. The inverse transform expects coordinates relative to the stage container's top-left corner.
**Why it happens:** `clientX/clientY` are relative to the viewport, not the container element. In the student canvas the stage fills the full viewport so the error is zero, but in the admin editor (stage is inside a flex panel) the offset is nonzero.
**How to avoid:** Always subtract `stage.container().getBoundingClientRect().left/top` before passing to the transform inversion.
**Warning signs:** Pinch works correctly at one page layout but breaks in another — the difference is the container offset.

### Pitfall 2: Position Recalculation Using Stale Transform
**What goes wrong:** Developer applies `stage.rotation(newRot)` then calls `stage.getAbsoluteTransform().copy().invert().point()` to re-derive the position — but the inversion now reflects the new rotation, so the stageLocal point read before the mutation is no longer the correct input.
**Why it happens:** `getAbsoluteTransform()` is live — it reflects the current state of the node including mutations just applied.
**How to avoid:** Read `stageLocal` (the stage-local point under the finger) BEFORE mutating scale or rotation. Then use that pre-mutation `stageLocal` with the post-mutation transform math to compute the correcting position.
**Warning signs:** Map "drifts" slightly during each gesture frame even when fingers are stationary.

### Pitfall 3: Rotation Threshold Applied to Radians Instead of Degrees
**What goes wrong:** The locked decision specifies 2 degrees. If the guard uses `|angleDiff| > 2` where `angleDiff` is in radians (as returned by `Math.atan2`), the threshold is effectively 2 radians (~115 degrees), making rotation almost impossible to trigger.
**Why it happens:** `getAngle()` returns radians; the threshold is specified in degrees.
**How to avoid:** Convert `angleDiff` to degrees before the threshold check: `Math.abs(angleDiff * 180 / Math.PI) > 2`.
**Warning signs:** Two-finger rotation requires exaggerated gestures; map never rotates during normal use.

### Pitfall 4: Breaking the `onScaleChange` Callback
**What goes wrong:** Refactored code path skips calling `onScaleChange?.(newScale)` after scale mutation.
**Why it happens:** The callback call is easy to miss when restructuring the position recalculation block.
**How to avoid:** `onScaleChange?.(newScale)` must be called every time `stage.scaleX(newScale)` / `stage.scaleY(newScale)` is called. Keep it immediately after the scale mutations, before the rotation/position block.
**Warning signs:** Zoom level indicator in the UI becomes desynchronized from actual stage scale.

### Pitfall 5: First-Frame Initialization Guard Position
**What goes wrong:** The threshold check for `lastDist.current === 0` is moved or removed, causing division by zero (`dist / lastDist.current`) or NaN positions on the first touch frame.
**Why it happens:** Refactoring the function body accidentally reorders the early return.
**How to avoid:** Keep the first-frame initialization block (set refs, return early) as the first check after the `touches.length < 2` guard — before any arithmetic.

---

## Code Examples

Verified patterns from official sources and existing codebase:

### Existing Reference Implementation: handleWheel (current correct pattern)
```typescript
// Source: src/client/hooks/useMapViewport.ts (current codebase)
// This is the REFERENCE — the touch fix mirrors this pattern

const pointer = stage.getPointerPosition()   // screen coords, already container-offset by Konva
if (!pointer) return

const oldScale = stage.scaleX()
const mousePointTo = {
  x: (pointer.x - stage.x()) / oldScale,     // stage-local, works because rotation=0 for mouse
  y: (pointer.y - stage.y()) / oldScale,
}
const newScale = clamp(...)
stage.scale({ x: newScale, y: newScale })
stage.position({
  x: pointer.x - mousePointTo.x * newScale,  // keeps mousePointTo under pointer
  y: pointer.y - mousePointTo.y * newScale,
})
```

### Konva Transform Inversion (the fix for rotated stage)
```typescript
// Source: Konva.Transform API — https://konvajs.org/api/Konva.Transform.html
// getAbsoluteTransform() returns a Transform encoding the full matrix (translate + scale + rotate)
// copy() + invert() gives the screen→local mapping

const rect = stage.container().getBoundingClientRect()
const screenPoint = { x: rawClientX - rect.left, y: rawClientY - rect.top }
const stageLocal = stage.getAbsoluteTransform().copy().invert().point(screenPoint)
// stageLocal is now the correct stage-local coordinate at any rotation angle
```

### Konva Transform Forward Projection (for position recalculation after rotation)
```typescript
// Source: Konva.Transform API — https://konvajs.org/api/Konva.Transform.html
// After mutating stage.rotation() and stage.scale(), compute the correcting position:

const t = new Konva.Transform()
t.rotate((stage.rotation() * Math.PI) / 180)  // stage.rotation() is in degrees; Transform.rotate() takes radians
t.scale(newScale, newScale)
const projected = t.point(stageLocal)          // where stageLocal would land on screen (relative to stage origin)
stage.position({
  x: screenCenter.x - projected.x,
  y: screenCenter.y - projected.y,
})
```

### Per-Frame Rotation Threshold
```typescript
// Source: locked decision in 21-CONTEXT.md
// angleDiff is in radians (from Math.atan2 via getAngle helper)
// Convert to degrees before threshold check

const angleDiff = angle - lastAngle.current  // radians
const angleDiffDeg = angleDiff * (180 / Math.PI)
if (Math.abs(angleDiffDeg) > 2) {
  stage.rotation(stage.rotation() + angleDiffDeg)
  // position recalculation follows
}
// sub-threshold: no rotation applied, no accumulation
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `(center.x - stage.x()) / stage.scaleX()` for stage-local coords | `getAbsoluteTransform().copy().invert().point()` | Phase 21 (this phase) | Correct at all rotation angles |
| Rotation applied after position with no pivot compensation | Rotation applied first, then position recalculated to keep midpoint stationary | Phase 21 | Rotation pivots around finger midpoint instead of stage origin |
| Rotation delta applied unconditionally every frame | Per-frame `|angleDiff| > 2°` guard before rotation mutation | Phase 21 | Eliminates jitter during pure pinch-zoom |

**Deprecated/outdated in this phase:**
- The `pointTo` calculation using raw `center.x/y` (lines 147–149 of current `useMapViewport.ts`): replaced by the inverse-transform approach.

---

## Open Questions

1. **Exact position formula after combined scale + rotation**
   - What we know: `stage.getAbsoluteTransform()` is live and reflects mutations already applied. The pre-mutation `stageLocal` point is the correct anchor.
   - What's unclear: Whether `new Konva.Transform()` + `.rotate()` + `.scale()` + `.point(stageLocal)` exactly replicates what `getAbsoluteTransform()` would return after the mutations (it should, since the stage transform at that point is just rotation + scale when position is zero, but this should be verified in the implementation).
   - Recommendation: Write the test first (identity case: no rotation, scale = 1) to confirm the formula matches the wheel handler's known-correct output, then extend to rotated case.

2. **Translation delta from midpoint movement**
   - What we know: The current code adds `dx/dy` (midpoint movement per frame) to the position. In the fixed version, the position recalculation after focal-point math already accounts for this because the midpoint itself is the anchor point — the midpoint moves, so the recalculation naturally tracks it.
   - What's unclear: Whether `dx/dy` panning should be removed from the fixed version or kept as a redundant but harmless term.
   - Recommendation: The focal-point recalculation anchors the pre-mutation stageLocal to the CURRENT screenCenter (which already moved by dx/dy), so the separate dx/dy addition should be removed to avoid double-counting pan.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | none — vitest picks up from vite.config.ts or package.json "test" script |
| Quick run command | `npx vitest run src/client/hooks/useMapViewport.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOUCH-01 | Pinch zoom focal point stays at finger midpoint at 0° rotation | unit | `npx vitest run src/client/hooks/useMapViewport.test.ts` | ❌ Wave 0 |
| TOUCH-01 | Pinch zoom focal point stays at finger midpoint at 45° rotation | unit | `npx vitest run src/client/hooks/useMapViewport.test.ts` | ❌ Wave 0 |
| TOUCH-01 | Pinch zoom focal point stays at finger midpoint at 90° rotation | unit | `npx vitest run src/client/hooks/useMapViewport.test.ts` | ❌ Wave 0 |
| TOUCH-02 | Two-finger rotation pivots around touch midpoint at 0° initial rotation | unit | `npx vitest run src/client/hooks/useMapViewport.test.ts` | ❌ Wave 0 |
| TOUCH-02 | Two-finger rotation pivots around touch midpoint at 30° initial rotation | unit | `npx vitest run src/client/hooks/useMapViewport.test.ts` | ❌ Wave 0 |
| TOUCH-03 | angleDiff of 1° is not applied to stage rotation | unit | `npx vitest run src/client/hooks/useMapViewport.test.ts` | ❌ Wave 0 |
| TOUCH-03 | angleDiff of 2° is not applied to stage rotation (boundary) | unit | `npx vitest run src/client/hooks/useMapViewport.test.ts` | ❌ Wave 0 |
| TOUCH-03 | angleDiff of 2.1° IS applied to stage rotation (above threshold) | unit | `npx vitest run src/client/hooks/useMapViewport.test.ts` | ❌ Wave 0 |

**Note:** `useMapViewport` uses `useRef`/`useCallback` from React and receives a `stageRef`. Unit tests for the gesture math should test the extracted helper functions (e.g. `toStageLocal`) and the position formula directly, rather than rendering the full hook with a DOM. If the developer inlines the math (no helper extraction), TOUCH-01/02 can be tested via integration smoke test on a real device or by testing the math formulas as standalone pure functions. Pure function extraction is recommended for testability.

### Sampling Rate
- **Per task commit:** `npx vitest run src/client/hooks/useMapViewport.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/client/hooks/useMapViewport.test.ts` — covers TOUCH-01, TOUCH-02, TOUCH-03 (does not exist yet)
- [ ] If coordinate conversion is extracted: `toStageLocal(stage, screenPoint)` helper and its test cases

---

## Sources

### Primary (HIGH confidence)
- [Konva.Transform API](https://konvajs.org/api/Konva.Transform.html) — `copy()`, `invert()`, `point()` method signatures confirmed
- [Konva Relative Pointer Position](https://konvajs.org/docs/sandbox/Relative_Pointer_Position.html) — confirmed that `getRelativePointerPosition()` internally uses `getAbsoluteTransform().copy().invert()` approach; this is the canonical pattern for screen→local conversion
- `src/client/hooks/useMapViewport.ts` (project codebase) — full implementation of existing `handleWheel` reference pattern, existing helpers (`getCenter`, `getAngle`, `getDistance`, `clamp`), and the current buggy `handleTouchMove`
- `src/client/components/FloorPlanCanvas.tsx` — confirmed `onTouchMove={handleTouchMove}`, no changes needed there
- `src/client/pages/admin/MapEditorCanvas.tsx` — confirmed `useMapViewport` is also used here; fix is automatically shared

### Secondary (MEDIUM confidence)
- [Konva Gestures sandbox](https://konvajs.org/docs/sandbox/Gestures.html) — confirms multi-touch gestures must be implemented manually; no built-in pinch-zoom handler provided by Konva
- [Konva Node.ts source](https://github.com/konvajs/konva/blob/master/src/Node.ts) — confirms `getAbsoluteTransform()` is available on all Konva nodes including Stage

### Tertiary (LOW confidence)
None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — using existing project dependencies, no new packages
- Architecture: HIGH — single-file change, well-understood Konva API, locked decisions from CONTEXT.md
- Pitfalls: HIGH — derived from direct code analysis of the current buggy implementation and Konva API behavior
- Test approach: MEDIUM — hook testing requires React test environment or pure function extraction; testability depends on implementation choice

**Research date:** 2026-03-10
**Valid until:** 2026-09-10 (Konva 10.x API is stable; no breaking changes expected in this window)