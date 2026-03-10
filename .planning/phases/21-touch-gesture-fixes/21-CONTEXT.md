# Phase 21: Touch Gesture Fixes - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix pinch-to-zoom and two-finger rotation in `useMapViewport.ts` so both gestures use the touch midpoint as the focal/pivot point at all canvas rotation angles, with a per-frame 2-degree threshold to eliminate micro-rotation jitter. No new gesture types, no UI changes, no new controls.

</domain>

<decisions>
## Implementation Decisions

### Coordinate conversion (TOUCH-01 / TOUCH-02 fix)
- Use `stage.getAbsoluteTransform().copy().invert().point(center)` to convert the touch midpoint from screen coordinates to stage-local coordinates — this is Konva's own approach for `getPointerPosition()` and handles all rotation angles correctly
- Before passing to the inverse transform, offset clientX/clientY by `stage.container().getBoundingClientRect()` top-left, so the math is correct regardless of where the stage container sits on the page

### Rotation pivot fix (TOUCH-02)
- After computing the new rotation, adjust the stage position so the touch midpoint remains stationary on screen — same "point stays under pointer" pattern used for wheel-zoom, but applied to the rotated midpoint
- Both scale and rotation apply independently in the same frame (no dominance logic)

### Rotation jitter threshold (TOUCH-03)
- Per-frame dead zone: only apply `angleDiff` if `|angleDiff| > 2°` — sub-threshold deltas are silently discarded, no accumulation buffer
- Same 2° threshold applies to both student canvas and admin editor (fix is in the shared `useMapViewport` hook, no per-caller configuration needed)
- First frame of gesture remains initialization-only (stores lastDist / lastCenter / lastAngle, returns early) — threshold only applies from frame 2 onward

### One-finger recovery after pinch
- On any `touchend`, reset all tracking refs (`lastDist`, `lastCenter`, `lastAngle`) — current behavior
- No distinction between 2→1 finger and 1→0 finger transitions; Konva's built-in `draggable` resumes single-finger pan automatically
- Rotation persists after gesture ends — no snap-back to nearest 90° on touchend
- `fitToScreen()` and floor-switch (already calls fitToScreen) continue to reset rotation to 0°

### Claude's Discretion
- Whether to extract a `toStageLocal(stage, screenPoint)` helper or inline the transform inversion
- Exact variable naming for the midpoint and pointTo calculations
- Whether to add a brief JSDoc comment explaining the coordinate conversion

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getCenter(p1, p2)` helper already exists in `useMapViewport.ts` — computes midpoint, use as-is
- `getAngle(p1, p2)` helper already exists — computes atan2 angle, use as-is
- `getDistance(p1, p2)` helper already exists — Euclidean distance, use as-is
- `clamp(val, min, max)` helper already exists — use for scale bounds
- `handleWheel` in the same file has the correct "point stays under pointer" pattern for mouse scroll zoom — the touch fix should mirror this logic

### Established Patterns
- **Direct Konva stage mutations only** — `stage.scaleX()`, `stage.scaleY()`, `stage.position()`, `stage.rotation()`, no React setState. Must be preserved.
- `Konva.hitOnDragEnabled = true` already set at module level — enables second-touch detection during drag; keep untouched
- `onScaleChange?.(newScale)` callback is called after every scale mutation — must continue to be called after pinch-zoom

### Integration Points
- All changes are confined to `handleTouchMove` in `src/client/hooks/useMapViewport.ts`
- `handleTouchEnd` already resets all three refs; no changes needed there
- `FloorPlanCanvas.tsx` wires `onTouchMove={handleTouchMove}` and `onTouchEnd={handleTouchEnd}` — no changes needed there

</code_context>

<specifics>
## Specific Ideas

- The wheel handler's focal-point logic is the reference implementation for "zoom toward a point":
  ```ts
  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  }
  stage.position({
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  })
  ```
  For the touch fix, replace the manual inverse with Konva's transform API and extend the same pattern to include rotation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 21-touch-gesture-fixes*
*Context gathered: 2026-03-10*
