---
phase: 02-floor-plan-rendering
plan: 02
type: execute
wave: 2
depends_on: [02-01]
files_modified:
  - src/client/hooks/useMapViewport.ts
  - src/client/components/ZoomControls.tsx
  - src/client/components/FloorPlanCanvas.tsx
  - src/client/style.css
autonomous: false
requirements: [MAP-01, MAP-02]

must_haves:
  truths:
    - "User can pan the floor plan by clicking and dragging on desktop"
    - "User can zoom with scroll wheel toward cursor position (Google Maps style, not viewport center)"
    - "User can zoom with +/- buttons and see smooth animated transition"
    - "User can pinch-zoom on mobile/touch devices"
    - "User can rotate the map with two-finger gesture on mobile"
    - "Floor plan snaps back elastically when dragged too far off-screen"
    - "+/- zoom buttons are visible in the bottom-right corner"
    - "Floor plan re-fits when viewport dimensions change (orientation change)"
    - "Pan/zoom controls are disabled while floor plan is loading"
  artifacts:
    - path: "src/client/hooks/useMapViewport.ts"
      provides: "All viewport interaction handlers: wheel zoom, pinch zoom, rotation, elastic bounds, button zoom"
      exports: ["useMapViewport"]
    - path: "src/client/components/ZoomControls.tsx"
      provides: "HTML overlay with accessible +/- zoom buttons"
      exports: ["default"]
  key_links:
    - from: "src/client/hooks/useMapViewport.ts"
      to: "Konva.Stage"
      via: "stageRef direct node manipulation (NOT React setState)"
      pattern: "stageRef\\.current"
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/hooks/useMapViewport.ts"
      via: "hook call with Stage event props wired to handlers"
      pattern: "useMapViewport|onWheel|onTouchMove|onDragEnd"
    - from: "src/client/components/ZoomControls.tsx"
      to: "useMapViewport.zoomByButton"
      via: "callback prop from FloorPlanCanvas parent"
      pattern: "onZoomIn|onZoomOut"
---

<objective>
Add interactive pan, zoom, rotation, and touch gesture support to the floor plan canvas.

Purpose: Transform the static floor plan display (from Plan 01) into a fully interactive map viewer that users can navigate with mouse, scroll wheel, touch gestures, and on-screen controls — matching the Google Maps interaction feel specified by the user.

Output: Complete interactive floor plan viewer with pointer-centric zoom, pinch-zoom, two-finger rotation, elastic pan bounds, animated zoom controls, and orientation-change re-fit.
</objective>

<execution_context>
@C:/Users/admin/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:/Users/admin/.planning/PROJECT.md
@C:/Users/admin/.planning/ROADMAP.md
@C:/Users/admin/.planning/STATE.md
@C:/Users/admin/.planning/phases/02-floor-plan-rendering/02-RESEARCH.md
@C:/Users/admin/.planning/phases/02-floor-plan-rendering/02-01-SUMMARY.md

@C:/Users/admin/Desktop/projects/campusnav/src/client/components/FloorPlanCanvas.tsx
@C:/Users/admin/Desktop/projects/campusnav/src/client/components/FloorPlanImage.tsx
@C:/Users/admin/Desktop/projects/campusnav/src/client/hooks/useViewportSize.ts
@C:/Users/admin/Desktop/projects/campusnav/src/client/hooks/useFloorPlanImage.ts
@C:/Users/admin/Desktop/projects/campusnav/src/client/style.css
@C:/Users/admin/Desktop/projects/campusnav/package.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create useMapViewport hook with all viewport interactions</name>
  <files>src/client/hooks/useMapViewport.ts</files>
  <action>
  Create `src/client/hooks/useMapViewport.ts` — the core interaction hook for the floor plan canvas.

  **Module-level setup:**
  - `import Konva from 'konva'`
  - Set `Konva.hitOnDragEnabled = true` at module scope — CRITICAL for multi-touch to work when starting from a pan gesture. Without this, the second touch is swallowed during drag and pinch-zoom fails (research pitfall #3).
  - Define constants: `MIN_SCALE = 0.3`, `MAX_SCALE = 4`, `SCROLL_SCALE_BY = 1.1` (10% per scroll tick), `BUTTON_SCALE_BY = 1.3` (larger step for button clicks)
  - Helper: `clamp(val: number, min: number, max: number): number`
  - Helper: `getDistance(p1: {x:number,y:number}, p2: {x:number,y:number}): number` — Euclidean distance
  - Helper: `getCenter(p1: {x:number,y:number}, p2: {x:number,y:number}): {x:number,y:number}` — midpoint
  - Helper: `getAngle(p1: {x:number,y:number}, p2: {x:number,y:number}): number` — Math.atan2

  **Hook signature:**
  ```typescript
  interface UseMapViewportOptions {
    stageRef: RefObject<Konva.Stage | null>;
    imageRect: { x: number; y: number; width: number; height: number } | null;
  }

  export function useMapViewport({ stageRef, imageRect }: UseMapViewportOptions): {
    handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
    handleTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => void;
    handleTouchEnd: () => void;
    handleDragEnd: () => void;
    zoomByButton: (direction: 1 | -1) => void;
    fitToScreen: (viewportWidth: number, viewportHeight: number, animate?: boolean) => void;
  }
  ```

  **Internal refs (useRef):**
  - `lastDist: useRef<number>(0)` — previous pinch distance
  - `lastCenter: useRef<{x:number,y:number} | null>(null)` — previous pinch center
  - `lastAngle: useRef<number | null>(null)` — previous rotation angle
  - `activeTween: useRef<Konva.Tween | null>(null)` — for tween cleanup

  **handleWheel — Pointer-centric zoom (INSTANT, no Tween):**
  Per user decision: zoom toward cursor position like Google Maps.
  - Call `e.evt.preventDefault()` to prevent browser scroll/zoom
  - Get `pointer = stage.getPointerPosition()` — if null, return
  - Compute `mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale }` — the point in stage coordinates under the cursor
  - Direction: `e.evt.deltaY > 0 ? -1 : 1`, invert if `e.evt.ctrlKey` (trackpad pinch gesture sends ctrlKey)
  - `newScale = clamp(direction > 0 ? oldScale * SCROLL_SCALE_BY : oldScale / SCROLL_SCALE_BY, MIN_SCALE, MAX_SCALE)`
  - Apply DIRECTLY to stage node: `stage.scale({ x: newScale, y: newScale })` and `stage.position({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale })`
  - **CRITICAL:** Do NOT use Konva.Tween for wheel zoom. Rapid scroll events create stacked animations that fight each other, causing jittery "bouncing" zoom (research pitfall #4). Wheel zoom must be instant — this matches Google Maps behavior.

  **handleTouchMove — Pinch-zoom + rotation:**
  Per user decision: pinch-zoom + rotation on mobile.
  - Call `e.evt.preventDefault()` to prevent browser gesture handling
  - If `e.evt.touches.length < 2`, return (single finger = pan, handled by Stage draggable)
  - If `stage.isDragging()`, call `stage.stopDrag()` — hand off from single-finger pan to two-finger pinch
  - Extract touch points: `p1 = { x: touches[0].clientX, y: touches[0].clientY }`, same for p2
  - Compute `dist = getDistance(p1, p2)`, `center = getCenter(p1, p2)`, `angle = getAngle(p1, p2)`
  - If `lastDist.current === 0` (first frame of gesture): store all values in refs, return
  - Compute `pointTo = { x: (center.x - stage.x()) / stage.scaleX(), y: (center.y - stage.y()) / stage.scaleY() }`
  - `newScale = clamp(stage.scaleX() * (dist / lastDist.current), MIN_SCALE, MAX_SCALE)`
  - `dx = center.x - lastCenter.current.x`, `dy = center.y - lastCenter.current.y`
  - Apply scale: `stage.scaleX(newScale)`, `stage.scaleY(newScale)`
  - Apply position: `stage.position({ x: center.x - pointTo.x * newScale + dx, y: center.y - pointTo.y * newScale + dy })`
  - **Rotation:** If `lastAngle.current !== null`: `angleDiff = angle - lastAngle.current`, `stage.rotation(stage.rotation() + angleDiff * 180 / Math.PI)` — per user decision: mobile rotation so students can align map with walking direction
  - Update all refs: `lastDist.current = dist`, `lastCenter.current = center`, `lastAngle.current = angle`

  **handleTouchEnd — Reset tracking refs:**
  - `lastDist.current = 0`, `lastCenter.current = null`, `lastAngle.current = null`

  **handleDragEnd — Elastic snap-back:**
  Per user decision: soft bounds with elastic snap-back.
  - If no imageRect, return
  - Get stage position and scale
  - Calculate floor plan edges in viewport coordinates:
    - `left = imageRect.x * scale + stagePos.x`
    - `right = (imageRect.x + imageRect.width) * scale + stagePos.x`
    - `top = imageRect.y * scale + stagePos.y`
    - `bottom = (imageRect.y + imageRect.height) * scale + stagePos.y`
  - Define `margin = 100` pixels of allowed overscroll
  - Check bounds and compute clamped position:
    - If `right < margin`: `newX = margin - (imageRect.x + imageRect.width) * scale`
    - If `left > stage.width() - margin`: `newX = stage.width() - margin - imageRect.x * scale`
    - Same pattern for Y axis with top/bottom
  - If snap needed: destroy `activeTween.current`, create `new Konva.Tween({ node: stage, duration: 0.3, x: newX, y: newY, easing: Konva.Easings.EaseInOut }).play()`, store in activeTween ref

  **zoomByButton(direction) — Animated zoom toward viewport center:**
  Per user decision: smooth animated zoom transitions for buttons (eased, not instant).
  - `newScale = clamp(direction > 0 ? oldScale * BUTTON_SCALE_BY : oldScale / BUTTON_SCALE_BY, MIN_SCALE, MAX_SCALE)`
  - `center = { x: stage.width() / 2, y: stage.height() / 2 }`
  - `mousePointTo = { x: (center.x - stage.x()) / oldScale, y: (center.y - stage.y()) / oldScale }`
  - `newPos = { x: center.x - mousePointTo.x * newScale, y: center.y - mousePointTo.y * newScale }`
  - Destroy `activeTween.current`, create `new Konva.Tween({ node: stage, duration: 0.25, scaleX: newScale, scaleY: newScale, x: newPos.x, y: newPos.y, easing: Konva.Easings.EaseInOut }).play()`, store ref

  **fitToScreen(viewportWidth, viewportHeight, animate = false):**
  Per user decision: re-fit on orientation change.
  - If no imageRect, return
  - NOTE: imageRect contains the VIEWPORT-SPACE dimensions of the image (after fit-to-screen scaling from FloorPlanImage). For re-fitting, we need to reset the stage transform to identity (scale=1, position=0,0, rotation=0) because FloorPlanImage already handles the fit calculation internally.
  - If `animate`: use Konva.Tween to animate `{ scaleX: 1, scaleY: 1, x: 0, y: 0, rotation: 0, duration: 0.3, easing: EaseInOut }`
  - If not animate: set directly via `stage.scale({x:1, y:1})`, `stage.position({x:0, y:0})`, `stage.rotation(0)`

  **PERFORMANCE CRITICAL:** Every handler mutates the Konva Stage via `stageRef.current` directly. NEVER call React setState for position/scale/rotation during interactions — React re-renders at 60fps will cause visible jank (research pitfall #2).

  Wrap all handlers in `useCallback` with appropriate dependencies.
  </action>
  <verify>`npm run typecheck` passes with zero errors. The hook file exports `useMapViewport` with all 6 handler methods.</verify>
  <done>useMapViewport hook provides pointer-centric wheel zoom (instant), animated button zoom, multi-touch pinch-zoom with rotation, elastic snap-back, and fit-to-screen — all via direct stage manipulation for 60fps performance.</done>
</task>

<task type="auto">
  <name>Task 2: Add zoom controls and integrate viewport interactions into canvas</name>
  <files>
    src/client/components/ZoomControls.tsx
    src/client/components/FloorPlanCanvas.tsx
    src/client/style.css
  </files>
  <action>
  **1. Create `src/client/components/ZoomControls.tsx`** — HTML overlay (NOT Konva).
  Per user decision: on-screen +/- zoom buttons visible for discoverability.

  - Props: `{ onZoomIn: () => void, onZoomOut: () => void, disabled?: boolean }`
  - Render a `<div>` container with Tailwind: `absolute bottom-6 right-6 flex flex-col gap-2 z-10`
  - Two buttons, each styled with Tailwind:
    `w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-xl font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none`
  - "+" button: `onClick={onZoomIn}`, `aria-label="Zoom in"`, `disabled={disabled}`
  - "−" button (use minus sign `−` U+2212, not hyphen): `onClick={onZoomOut}`, `aria-label="Zoom out"`, `disabled={disabled}`
  - Buttons are standard HTML — they don't transform with pan/zoom, remain accessible to keyboard/screen reader, and have native hover/active states
  - Minimum 40x40px touch target size for mobile tappability

  **2. Modify `src/client/components/FloorPlanCanvas.tsx`** — Wire all interactions.

  Add imports: `useMapViewport`, `ZoomControls`, `useRef`, `useEffect`, `useCallback` as needed.

  Changes to the existing component:
  - Ensure `stageRef = useRef<Konva.Stage>(null)` exists (may already be present from Plan 01)
  - Call `useMapViewport({ stageRef, imageRect })` to get `{ handleWheel, handleTouchMove, handleTouchEnd, handleDragEnd, zoomByButton, fitToScreen }`
  - Wire handlers to the `<Stage>` component:
    - `ref={stageRef}`
    - `draggable={!isLoading && !isFailed}` — enable drag-to-pan, disabled during loading per discretion decision ("disable pan/zoom until at least thumbnail is loaded")
    - `onWheel={handleWheel}`
    - `onTouchMove={handleTouchMove}`
    - `onTouchEnd={handleTouchEnd}`
    - `onDragEnd={handleDragEnd}`
  - **Re-fit on viewport resize / orientation change:**
    Add a useEffect that re-fits when viewport size changes AND image is loaded:
    ```typescript
    useEffect(() => {
      if (image && imageRect) {
        fitToScreen(width, height, true);  // animate=true for smooth re-fit
      }
    }, [width, height]);
    ```
    This fulfills the user's decision: "Re-fit floor plan to new viewport dimensions on device orientation change (portrait ↔ landscape)."
  - Render `<ZoomControls>` as a sibling of `<Stage>` inside the wrapper div (HTML overlay, not inside Konva):
    ```tsx
    <ZoomControls
      onZoomIn={() => zoomByButton(1)}
      onZoomOut={() => zoomByButton(-1)}
      disabled={isLoading || isFailed}
    />
    ```

  **3. Modify `src/client/style.css`** — Add touch-action CSS.
  Add this rule after the existing viewport reset:
  ```css
  .konvajs-content {
    touch-action: none;
  }
  ```
  This prevents the browser from intercepting touch gestures on the canvas — without it, browser pinch-zoom and page scrolling compete with canvas interactions on mobile (research pitfall #5). Keep all existing styles intact.
  </action>
  <verify>
  1. `npm run typecheck` passes with zero errors
  2. `npm run lint` passes with zero issues
  3. `npm run dev` → open http://localhost:5173 → floor plan with:
     - Working scroll wheel zoom (zooms toward cursor, not viewport center)
     - Working click-and-drag pan
     - +/- buttons visible in bottom-right corner, trigger smooth animated zoom
     - Floor plan snaps back when dragged far off-screen
  4. Resize browser window → floor plan re-fits to new dimensions
  </verify>
  <done>Floor plan canvas has full interactive controls: pointer-centric wheel zoom, animated +/- button zoom, multi-touch pinch-zoom, two-finger rotation, elastic snap-back panning, orientation-change re-fit, and touch-action CSS for mobile. Controls disabled during loading.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Verify complete interactive floor plan viewer</name>
  <action>Human verification checkpoint — user visually and functionally verifies the complete interactive floor plan viewer built in Tasks 1-2.</action>
  <what-built>Complete interactive floor plan viewer with progressive image loading, grid background, pan/zoom/rotation, touch gestures, and zoom controls — fulfilling MAP-01 and MAP-02 requirements.</what-built>
  <how-to-verify>
  1. Run `npm run dev` and open http://localhost:5173 in a desktop browser
  2. **Progressive loading:** Open Network tab, hard refresh (Ctrl+Shift+R) — observe requests to /api/floor-plan/thumbnail and /api/floor-plan/image. Floor plan should appear with a brief loading state, then thumbnail, then full image.
  3. **Grid background:** Subtle grid pattern should be visible behind/around the floor plan (like a drafting table).
  4. **Fit-to-screen:** Floor plan should be centered and fully visible, fitting the viewport with padding. Not cropped, not stretched.
  5. **Scroll wheel zoom:** Hover over a specific spot on the floor plan and scroll — the point under your cursor should stay fixed (zoom toward cursor, like Google Maps). Verify it does NOT zoom toward the center of the screen.
  6. **Zoom limits:** Zoom in past 4x should stop. Zoom out past 0.3x should stop.
  7. **Drag to pan:** Click and drag the floor plan — should pan smoothly without jank.
  8. **Elastic snap-back:** Drag the floor plan far off-screen — it should animate back to keep at least part of the image visible.
  9. **+/- buttons:** Click the + and − buttons in the bottom-right — floor plan should zoom in/out with a smooth animated transition (not instant, unlike scroll wheel).
  10. **Orientation re-fit:** Resize the browser window significantly (or toggle mobile emulation) — floor plan should re-fit to the new viewport.
  11. **Mobile (if possible):** In Chrome DevTools mobile emulation with touch simulation: test pinch-zoom (Shift+drag simulates pinch in Chrome) and single-finger drag-to-pan.
  12. **Code quality:** `npm run typecheck` and `npm run lint` both pass with zero errors.
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues you see</resume-signal>
</task>

</tasks>

<verification>
- Floor plan image loads from server API and renders on Konva canvas
- Progressive loading works: loading indicator → thumbnail → full image with fade-in
- Grid background visible behind the floor plan
- Scroll wheel zooms toward cursor position (Google Maps style)
- Click-and-drag pans the floor plan
- +/- buttons trigger smooth animated zoom
- Floor plan snaps back when dragged too far off-screen
- Floor plan re-fits on viewport resize / orientation change
- Mobile touch gestures work (pinch-zoom, drag-pan, two-finger rotation)
- Pan/zoom disabled during loading
- `npm run typecheck`, `npm run lint`, and `npm run dev` all work
</verification>

<success_criteria>
MAP-01 complete: User can view a 2D floor plan rendered from an uploaded image with pan and zoom controls
MAP-02 complete: User can interact with the map on mobile devices using touch gestures (pinch-zoom, drag-pan)

All 5 roadmap success criteria met:
1. Floor plan image on Konva canvas fills viewport ✓
2. Pan by click-and-drag on desktop ✓
3. Zoom with scroll wheel on desktop ✓
4. Pan by drag + zoom by pinch on mobile/touch ✓
5. Crisp and responsive during interactions (direct stage manipulation, no React re-renders) ✓
</success_criteria>

<output>
After completion, create `C:\Users\admin\.planning\phases\02-floor-plan-rendering\02-02-SUMMARY.md`
</output>
