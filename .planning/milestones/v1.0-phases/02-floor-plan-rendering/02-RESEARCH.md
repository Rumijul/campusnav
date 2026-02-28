# Phase 2: Floor Plan Rendering - Research

**Researched:** 2026-02-18
**Domain:** Konva canvas — image rendering, pan/zoom, touch gestures, progressive loading
**Confidence:** HIGH

## Summary

Phase 2 transforms the existing Konva "hello world" canvas from Phase 1 into an interactive floor plan viewer. The core technical challenge is implementing Google Maps-style pan/zoom with pointer-centric zooming, multi-touch pinch-zoom, mobile rotation, smooth animated transitions, elastic pan bounds, and progressive image loading — all within the react-konva declarative model.

Konva has first-class support for every feature needed. The `Stage` component accepts `draggable`, `scaleX/Y`, `x/y`, and `rotation` props that control the viewport transform. Wheel zoom uses the `onWheel` handler with `stage.getPointerPosition()` to compute pointer-centric scale. Pinch-zoom uses `onTouchMove` with two-finger distance/center calculations. The `use-image` hook (from the Konva team) handles image loading with status tracking. `Konva.Tween` with `Konva.Easings.EaseInOut` provides smooth animated zoom transitions. No external pan/zoom library is needed.

**Primary recommendation:** Build a custom `useMapViewport` hook that manages `{ x, y, scale, rotation }` state, handles wheel/touch/button events with pointer-centric math, clamps scale to min/max bounds, and animates zoom transitions via `Konva.Tween`. Serve the floor plan image from a dedicated Hono endpoint (`GET /api/floor-plan/image`) and use `use-image` with dual-resolution loading for progressive display.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Zoom & pan behavior
- Moderate zoom max (~3x-4x) — enough to read room labels clearly, not deep architectural zoom
- Zoom toward cursor/finger position (like Google Maps), not viewport center
- Soft bounds on panning — allow some overscroll past floor plan edges, then elastic snap-back
- No special gestures — just pan (drag) and zoom (scroll/pinch). No double-tap, no long-press
- Smooth animated zoom transitions (eased), not instant
- No reset-to-fit button
- On-screen +/- zoom buttons visible (for discoverability, especially on desktop)

#### Floor plan image source
- Any test image is fine for development — no need for a real floor plan
- Floor plan image served from the API (not bundled as static asset) — ready for Phase 7 persistence
- Subtle grid pattern as canvas background behind/around the floor plan
- User can rotate the map on mobile (e.g., align with walking direction)

#### Initial view & framing
- Re-fit floor plan to new viewport dimensions on device orientation change (portrait ↔ landscape)

#### Loading & error states
- Centered spinner while floor plan image loads from server
- Progressive loading — show low-res thumbnail first, swap in full image when ready
- Spinner visible during initial load, thumbnail replaces spinner, then full image replaces thumbnail

### Claude's Discretion
- Image format support (PNG, JPEG, etc.)
- Large image handling strategy
- Fallback image when server is unavailable
- Server endpoint design for floor plan image (dedicated endpoint vs static middleware)
- Initial view framing (fit-to-screen vs fill viewport)
- Aspect ratio handling (preserve vs crop)
- Canvas layout (full viewport with overlays vs header + map)
- Error state design when image fails to load
- Empty state when no floor plan exists
- Pan/zoom behavior during loading
- Min zoom level
- Connection-lost indicator behavior
- Image caching strategy
- Image appearance transition (fade-in vs instant)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MAP-01 | User can view a 2D floor plan rendered from an uploaded image with pan and zoom controls | Konva `Image` component + `use-image` hook for rendering; `Stage` `draggable` + `onWheel` for pan/zoom; `+/-` button overlay for zoom controls |
| MAP-02 | User can interact with the map on mobile devices using touch gestures (pinch-zoom, drag-pan, tap-select) | Konva's `onTouchMove` handler with two-finger distance calculation for pinch-zoom; `Stage` `draggable` for drag-pan; `Konva.hitOnDragEnabled = true` required for reliable touch events |

</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| konva | 10.2.0 | Canvas rendering engine | Already in project; provides Stage, Layer, Image, Tween, touch events |
| react-konva | 19.2.2 | React bindings for Konva | Already in project; declarative canvas components |
| react | 19.2.4 | UI framework | Already in project |
| hono | 4.11.9 | Backend framework | Already in project; will serve floor plan image |
| @hono/node-server | 1.19.9 | Node.js adapter for Hono | Already in project; includes `serveStatic` middleware |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| use-image | 1.1.4 | React hook for loading images into Konva | Loading floor plan images with status tracking (`loading`/`loaded`/`failed`). Made by the Konva team; the standard approach for react-konva image rendering |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| use-image | Manual `new Image()` + `onload` | use-image handles React lifecycle, crossOrigin, caching automatically. Manual approach is more code for zero benefit |
| Konva.Tween for animation | requestAnimationFrame manually | Konva.Tween integrates with Konva's batch rendering; manual rAF risks double-rendering |
| Custom pan/zoom logic | react-zoom-pan-pinch library | External library would fight Konva's transform system; Konva already has all the primitives |

### Installation
```bash
npm install use-image
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── client/
│   ├── App.tsx                    # Root component — Stage + layers
│   ├── main.tsx                   # React mount (unchanged)
│   ├── style.css                  # Global styles (unchanged)
│   ├── components/
│   │   ├── FloorPlanCanvas.tsx    # Main canvas: Stage + viewport logic + layers
│   │   ├── FloorPlanImage.tsx     # Image rendering with progressive loading
│   │   ├── GridBackground.tsx     # Repeating grid pattern behind floor plan
│   │   └── ZoomControls.tsx       # +/- buttons overlay (HTML, not Konva)
│   └── hooks/
│       ├── useMapViewport.ts      # Pan/zoom/rotation state + event handlers
│       ├── useFloorPlanImage.ts   # Image fetching with progressive loading
│       └── useViewportSize.ts     # Window dimensions (extract from existing App.tsx)
├── server/
│   ├── index.ts                   # Add floor plan image endpoint
│   └── assets/                    # Test floor plan images (full + thumbnail)
│       ├── floor-plan.png         # Full resolution test image
│       └── floor-plan-thumb.jpg   # Low-res thumbnail for progressive loading
└── shared/
    └── types.ts                   # Unchanged for this phase
```

### Pattern 1: Pointer-Centric Zoom (Wheel)
**What:** Zoom toward the cursor position so the point under the cursor stays fixed — the "Google Maps" feel.
**When to use:** Every wheel/scroll zoom event.
**Source:** Konva official docs — Zooming Relative To Pointer

```typescript
// Source: https://konvajs.org/docs/sandbox/Zooming_Relative_To_Pointer.html
const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
  e.evt.preventDefault();

  const stage = stageRef.current;
  if (!stage) return;

  const oldScale = stage.scaleX();
  const pointer = stage.getPointerPosition();
  if (!pointer) return;

  // Point in stage coordinates under the cursor
  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };

  // Determine zoom direction; invert for trackpad pinch (ctrlKey)
  let direction = e.evt.deltaY > 0 ? -1 : 1;
  if (e.evt.ctrlKey) direction = -direction;

  const scaleBy = 1.1; // 10% per scroll tick
  const newScale = clamp(
    direction > 0 ? oldScale * scaleBy : oldScale / scaleBy,
    MIN_SCALE,
    MAX_SCALE
  );

  // Reposition stage so cursor point stays fixed
  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  };

  // Animate with Konva.Tween for smooth transition
  new Konva.Tween({
    node: stage,
    duration: 0.15,
    scaleX: newScale,
    scaleY: newScale,
    x: newPos.x,
    y: newPos.y,
    easing: Konva.Easings.EaseInOut,
  }).play();
};
```

### Pattern 2: Multi-Touch Pinch-Zoom
**What:** Two-finger pinch on mobile scales the stage and pans simultaneously.
**When to use:** All mobile/touch interactions.
**Source:** Konva official docs — Multi-touch Scale Stage

```typescript
// Source: https://konvajs.org/docs/sandbox/Multi-touch_Scale_Stage.html
// CRITICAL: Must set this for reliable touch events during drag
Konva.hitOnDragEnabled = true;

const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
  e.evt.preventDefault();
  const touch1 = e.evt.touches[0];
  const touch2 = e.evt.touches[1];

  if (!touch1 || !touch2) return; // Single finger = pan (handled by draggable)

  const stage = stageRef.current;
  if (!stage) return;

  // Stop Konva's built-in drag so we can do our own two-finger logic
  if (stage.isDragging()) {
    stage.stopDrag();
  }

  const p1 = { x: touch1.clientX, y: touch1.clientY };
  const p2 = { x: touch2.clientX, y: touch2.clientY };

  const newCenter = getCenter(p1, p2);
  const dist = getDistance(p1, p2);

  if (!lastCenter.current || !lastDist.current) {
    lastCenter.current = newCenter;
    lastDist.current = dist;
    return;
  }

  const pointTo = {
    x: (newCenter.x - stage.x()) / stage.scaleX(),
    y: (newCenter.y - stage.y()) / stage.scaleX(),
  };

  const scale = clamp(
    stage.scaleX() * (dist / lastDist.current),
    MIN_SCALE,
    MAX_SCALE
  );

  const dx = newCenter.x - lastCenter.current.x;
  const dy = newCenter.y - lastCenter.current.y;

  stage.scaleX(scale);
  stage.scaleY(scale);
  stage.position({
    x: newCenter.x - pointTo.x * scale + dx,
    y: newCenter.y - pointTo.y * scale + dy,
  });

  lastDist.current = dist;
  lastCenter.current = newCenter;
};
```

### Pattern 3: Smooth Animated Zoom (Button Controls)
**What:** +/- buttons trigger animated zoom with easing, centered on viewport center.
**When to use:** Click on zoom control buttons.

```typescript
// Source: Konva Tween API — https://konvajs.org/api/Konva.Tween.html
const zoomToCenter = (direction: 1 | -1) => {
  const stage = stageRef.current;
  if (!stage) return;

  const oldScale = stage.scaleX();
  const scaleBy = 1.3; // Larger step for buttons
  const newScale = clamp(
    direction > 0 ? oldScale * scaleBy : oldScale / scaleBy,
    MIN_SCALE,
    MAX_SCALE
  );

  // Zoom toward viewport center
  const center = {
    x: stage.width() / 2,
    y: stage.height() / 2,
  };

  const mousePointTo = {
    x: (center.x - stage.x()) / oldScale,
    y: (center.y - stage.y()) / oldScale,
  };

  const newPos = {
    x: center.x - mousePointTo.x * newScale,
    y: center.y - mousePointTo.y * newScale,
  };

  new Konva.Tween({
    node: stage,
    duration: 0.25,
    scaleX: newScale,
    scaleY: newScale,
    x: newPos.x,
    y: newPos.y,
    easing: Konva.Easings.EaseInOut,
  }).play();
};
```

### Pattern 4: Elastic Pan Bounds (Snap-Back)
**What:** Allow slight overscroll past floor plan edges, then animate back to soft bounds.
**When to use:** On `dragEnd` of the Stage.

```typescript
const handleDragEnd = () => {
  const stage = stageRef.current;
  if (!stage) return;

  const scale = stage.scaleX();
  const stagePos = stage.position();

  // Calculate the floor plan bounds in viewport coordinates
  const floorPlanRight = imageX * scale + imageWidth * scale + stagePos.x;
  const floorPlanBottom = imageY * scale + imageHeight * scale + stagePos.y;
  const floorPlanLeft = imageX * scale + stagePos.x;
  const floorPlanTop = imageY * scale + stagePos.y;

  // Allow some margin of overscroll (e.g., 100px), then snap back
  const margin = 100;
  let newX = stagePos.x;
  let newY = stagePos.y;
  let needsSnap = false;

  // If floor plan is dragged too far off-screen, snap back
  if (floorPlanRight < margin) {
    newX = margin - (imageX + imageWidth) * scale;
    needsSnap = true;
  }
  if (floorPlanLeft > stage.width() - margin) {
    newX = stage.width() - margin - imageX * scale;
    needsSnap = true;
  }
  // ... same for Y axis

  if (needsSnap) {
    new Konva.Tween({
      node: stage,
      duration: 0.3,
      x: newX,
      y: newY,
      easing: Konva.Easings.EaseInOut,
    }).play();
  }
};
```

### Pattern 5: Progressive Image Loading
**What:** Load low-res thumbnail first, then swap to full image.
**When to use:** Initial floor plan load.

```typescript
// use-image returns [HTMLImageElement | undefined, 'loading' | 'loaded' | 'failed']
import useImage from 'use-image';

function useFloorPlanImage() {
  const [thumb, thumbStatus] = useImage('/api/floor-plan/thumbnail');
  const [full, fullStatus] = useImage('/api/floor-plan/image');

  // Priority: full image > thumbnail > null
  const image = fullStatus === 'loaded' ? full : thumbStatus === 'loaded' ? thumb : undefined;
  const isLoading = thumbStatus === 'loading' && fullStatus !== 'loaded';
  const isFailed = thumbStatus === 'failed' && fullStatus === 'failed';

  return { image, isLoading, isFailed, isFullLoaded: fullStatus === 'loaded' };
}
```

### Pattern 6: Fit-to-Screen on Load and Orientation Change
**What:** Calculate scale to fit the floor plan image within the viewport while preserving aspect ratio.
**When to use:** On initial load and when viewport dimensions change (resize/orientation).

```typescript
function calculateFitScale(
  viewportWidth: number,
  viewportHeight: number,
  imageWidth: number,
  imageHeight: number,
  padding: number = 40
): { scale: number; x: number; y: number } {
  const availW = viewportWidth - padding * 2;
  const availH = viewportHeight - padding * 2;
  const scale = Math.min(availW / imageWidth, availH / imageHeight);

  // Center the image in the viewport
  const x = (viewportWidth - imageWidth * scale) / 2;
  const y = (viewportHeight - imageHeight * scale) / 2;

  return { scale, x, y };
}
```

### Pattern 7: Grid Background
**What:** Subtle grid pattern behind the floor plan — drafting-table feel.
**When to use:** Background layer, always visible.

```typescript
// Draw grid lines using Konva Rect/Line on a separate layer
// The grid must account for the current viewport transform (pan/zoom)
// Option A: Draw a fixed grid on a non-transformed layer (simpler, grid doesn't move)
// Option B: Draw grid on the transformed layer (grid moves with pan/zoom like graph paper)
// Recommendation: Option A — fixed grid behind everything, just visual texture

function GridBackground({ width, height }: { width: number; height: number }) {
  const gridSize = 30; // px between lines
  const lines: JSX.Element[] = [];

  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <Line key={`v-${x}`} points={[x, 0, x, height]}
        stroke="#e2e8f0" strokeWidth={0.5} />
    );
  }
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      <Line key={`h-${y}`} points={[0, y, width, y]}
        stroke="#e2e8f0" strokeWidth={0.5} />
    );
  }

  return <>{lines}</>;
}
```

### Pattern 8: Mobile Rotation
**What:** Two-finger rotate gesture to rotate the map.
**When to use:** Mobile only — extend the pinch-zoom handler to also track rotation.

```typescript
// Extend pinch-zoom handler:
// Calculate angle between two touch points
function getAngle(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

// In handleTouchMove, alongside scale:
const newAngle = getAngle(p1, p2);
if (lastAngle.current !== null) {
  const angleDiff = newAngle - lastAngle.current;
  const currentRotation = stage.rotation();
  stage.rotation(currentRotation + (angleDiff * 180) / Math.PI);
}
lastAngle.current = newAngle;
```

### Anti-Patterns to Avoid
- **Transforming each shape individually:** Never pan/zoom by moving each Konva shape. Transform the Stage (or a Group containing the map content) as a single unit. Individual transforms cause O(n) recalculations.
- **Using `stage.scale()` without repositioning:** Scaling without adjusting position zooms from the top-left corner, not the cursor. Always compute the new position alongside the new scale.
- **Creating new `Konva.Tween` on every frame:** Wheel events fire rapidly. Either debounce/throttle, or skip the tween for wheel (apply scale directly) and only use tweens for button-triggered zooms. Using a tween for every wheel tick creates jittery stacked animations.
- **Re-rendering the React tree on every pan/zoom frame:** Pan/zoom should mutate the Konva Stage node directly (via ref), NOT trigger React re-renders via setState. React re-renders at 60fps will lag.
- **Disabling browser touch defaults too late:** Must call `e.evt.preventDefault()` in the touch handler to prevent browser scroll/zoom competing with canvas gestures.

## Discretion Recommendations

Research-informed recommendations for areas left to Claude's discretion:

| Area | Recommendation | Rationale |
|------|----------------|-----------|
| **Image format support** | Support PNG and JPEG; no special handling needed | `use-image` loads any browser-supported format via `<img>`. No format-specific code required |
| **Large image handling** | Cap served image at ~4000px max dimension; resize server-side if larger | Canvas performance degrades with very large textures. 4000px is generous for floor plans while staying under GPU texture limits |
| **Fallback when server unavailable** | Show error state with "Could not load floor plan" message and retry button | Don't bundle a fallback image — it would be stale. Better to show a clear error |
| **Server endpoint design** | Dedicated `GET /api/floor-plan/image` endpoint (not static middleware) | Dedicated endpoint allows adding auth headers in Phase 7, content negotiation, and thumbnail variant (`GET /api/floor-plan/thumbnail`) |
| **Initial view framing** | Fit-to-screen with padding (show entire floor plan, letterboxed) | Users need orientation before zooming in. Fill-viewport would crop, losing context |
| **Aspect ratio handling** | Always preserve aspect ratio (letterbox, never crop or stretch) | Distorted floor plans would be confusing and unusable for wayfinding |
| **Canvas layout** | Full viewport with overlays (zoom controls as absolute-positioned HTML elements) | Maximizes map space. Header/title from Phase 1 will be removed — the entire viewport is the map |
| **Error state design** | Centered message with icon on the grid background: "Failed to load floor plan" + "Tap to retry" | Minimal, clear, actionable |
| **Empty state** | Show grid background with centered message: "No floor plan available" | Distinct from error — no retry needed |
| **Pan/zoom during loading** | Disable pan/zoom until at least thumbnail is loaded | Panning an empty canvas is disorienting |
| **Min zoom level** | ~0.3x (30% of fit-to-screen scale) so the floor plan never becomes smaller than ~1/3 of viewport | Zooming out too far is useless; 0.3x still shows the full plan with generous margin |
| **Connection-lost indicator** | Not needed for Phase 2 — image is loaded once, not streamed | If image load fails, the error state handles it. Real-time connection monitoring is a later concern |
| **Image caching strategy** | Browser-native HTTP caching via `Cache-Control: max-age=3600` header on the image endpoint | Simple, effective. No service worker needed. 1 hour cache is reasonable for development |
| **Image appearance transition** | Fade-in via Konva `opacity` tween (0 -> 1 over 300ms) when image first renders | Smooth visual transition avoids jarring pop-in. Especially important for the thumbnail -> full swap |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image loading + status tracking | Manual `new Image()` + onload/onerror + React state sync | `use-image` hook (v1.1.4) | Handles crossOrigin, React lifecycle, re-renders on status change, caching. 3 lines vs 30 |
| Pointer-centric zoom math | Custom matrix transform math | Konva's `stage.getPointerPosition()` + the standard formula from Konva docs | The formula is well-established and battle-tested in Konva's official examples |
| Smooth animated transitions | Manual `requestAnimationFrame` interpolation | `Konva.Tween` with `Konva.Easings` | Integrates with Konva's rendering pipeline; handles interrupts/resets correctly |
| Touch gesture detection | Custom gesture recognizer (e.g., Hammer.js) | Konva's native touch events (`onTouchMove`, `onTouchEnd`) | Konva already normalizes touch events across browsers; adding Hammer.js would create event conflicts |
| Viewport resize detection | Manual `ResizeObserver` + debounce | Existing `useEffect` + `window.addEventListener('resize')` pattern from Phase 1 | Already works in the codebase; no need to add complexity. Extract to `useViewportSize` hook |

**Key insight:** Konva provides all the primitives for an interactive map viewer. The main implementation work is composing them correctly (pointer-centric math, state management, progressive loading), not building low-level capabilities.

## Common Pitfalls

### Pitfall 1: Zoom from Top-Left Instead of Cursor
**What goes wrong:** Stage zooms but the point under the cursor shifts, making zoom feel disorienting.
**Why it happens:** Setting `stage.scale()` without repositioning the stage. Scale is applied from the Stage's origin (0,0 by default).
**How to avoid:** Always use the pointer-centric formula: `newPos = pointer - mousePointTo * newScale`. This is the core formula from Pattern 1.
**Warning signs:** During testing, zoom and notice if the cursor "slides" relative to what it was pointing at.

### Pitfall 2: React Re-Renders Killing Pan/Zoom Performance
**What goes wrong:** Pan/zoom becomes laggy because every mouse move triggers a React re-render of the entire component tree.
**Why it happens:** Storing stage position/scale in React state (`useState`) and updating on every drag/wheel event.
**How to avoid:** Use a `stageRef` and mutate the Konva Stage node directly for pan/zoom transforms. Only update React state for discrete changes (e.g., after drag ends, for UI elements like zoom level display). The Konva Stage manages its own rendering pipeline.
**Warning signs:** React DevTools Profiler shows frequent re-renders during drag. Noticeable jank on mobile.

### Pitfall 3: Touch Events Not Firing During Drag
**What goes wrong:** Multi-touch pinch-zoom doesn't work — the second touch event is swallowed.
**Why it happens:** Konva optimizes performance by disabling hit detection during drag by default.
**How to avoid:** Set `Konva.hitOnDragEnabled = true` at the module level (before any Stage renders). This is explicitly documented in Konva's multi-touch example.
**Warning signs:** Pinch-zoom works on first attempt but fails if you start with a pan gesture first.

### Pitfall 4: Stacked Tweens on Rapid Scroll
**What goes wrong:** Rapidly scrolling the mouse wheel creates dozens of overlapping `Konva.Tween` animations that fight each other, causing jittery zoom.
**Why it happens:** Each wheel event creates a new Tween while previous ones are still animating.
**How to avoid:** Two options: (A) Don't use Tween for wheel zoom — apply scale/position directly (instant, no animation). Use Tween only for button-triggered zooms. (B) Keep a ref to the active tween, call `tween.destroy()` before creating a new one. Option A is simpler and matches Google Maps feel (wheel zoom is instant, only button zoom animates).
**Warning signs:** Zoom "bounces" or overshoots when scrolling quickly.

### Pitfall 5: Browser Zoom/Scroll Competing with Canvas Zoom
**What goes wrong:** Scrolling on the canvas also scrolls the page or triggers browser pinch-zoom.
**Why it happens:** Not calling `e.evt.preventDefault()` in the wheel/touch handlers, or the CSS doesn't disable default touch behavior.
**How to avoid:** (1) Call `e.evt.preventDefault()` in `onWheel` and `onTouchMove`. (2) Add `touch-action: none` CSS on the canvas container to prevent browser gesture handling.
**Warning signs:** Page scrolls behind the canvas on mobile; browser zoom indicator appears on trackpad pinch.

### Pitfall 6: Image Blurring at High Zoom
**What goes wrong:** Floor plan image becomes blurry or pixelated when zoomed in past 1:1 pixel ratio.
**Why it happens:** Source image resolution is lower than the displayed pixel dimensions at high zoom.
**How to avoid:** Serve a reasonably high-resolution source image (2000-4000px). The 3-4x max zoom means you need at least `viewport_width * 4` pixels in the source for crisp display at max zoom. For a 1920px viewport, that's ~7680px — which is excessive. Practical answer: serve ~3000-4000px wide and accept slight softening at max zoom. This matches real map applications.
**Warning signs:** Room labels become unreadable at max zoom.

### Pitfall 7: Orientation Change Losing Pan/Zoom State
**What goes wrong:** On mobile orientation change, the floor plan jumps to a weird position or is partially off-screen.
**Why it happens:** Viewport dimensions change but stage position/scale aren't recalculated.
**How to avoid:** On viewport resize, recalculate fit-to-screen and animate to the new position. The user decided "re-fit floor plan to new viewport dimensions on orientation change."
**Warning signs:** Rotate phone and floor plan is off-screen or tiny.

## Code Examples

### Complete useMapViewport Hook Shape
```typescript
// Source: Composed from Konva official examples (pointer zoom + multi-touch + tween)
import Konva from 'konva';
import type { RefObject } from 'react';
import { useCallback, useRef } from 'react';

// Enable touch events during drag — MUST be set before Stage renders
Konva.hitOnDragEnabled = true;

const MIN_SCALE = 0.3;
const MAX_SCALE = 4;
const SCROLL_SCALE_BY = 1.1;
const BUTTON_SCALE_BY = 1.3;

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

interface UseMapViewportOptions {
  stageRef: RefObject<Konva.Stage | null>;
  imageRect: { x: number; y: number; width: number; height: number } | null;
}

export function useMapViewport({ stageRef, imageRect }: UseMapViewportOptions) {
  const lastDist = useRef<number>(0);
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const lastAngle = useRef<number | null>(null);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      let direction = e.evt.deltaY > 0 ? -1 : 1;
      if (e.evt.ctrlKey) direction = -direction;

      const newScale = clamp(
        direction > 0 ? oldScale * SCROLL_SCALE_BY : oldScale / SCROLL_SCALE_BY,
        MIN_SCALE,
        MAX_SCALE
      );

      // Apply directly (no tween) — matches Google Maps instant wheel zoom
      stage.scale({ x: newScale, y: newScale });
      stage.position({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [stageRef]
  );

  const zoomByButton = useCallback(
    (direction: 1 | -1) => {
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      const newScale = clamp(
        direction > 0 ? oldScale * BUTTON_SCALE_BY : oldScale / BUTTON_SCALE_BY,
        MIN_SCALE,
        MAX_SCALE
      );

      const center = { x: stage.width() / 2, y: stage.height() / 2 };
      const mousePointTo = {
        x: (center.x - stage.x()) / oldScale,
        y: (center.y - stage.y()) / oldScale,
      };

      new Konva.Tween({
        node: stage,
        duration: 0.25,
        scaleX: newScale,
        scaleY: newScale,
        x: center.x - mousePointTo.x * newScale,
        y: center.y - mousePointTo.y * newScale,
        easing: Konva.Easings.EaseInOut,
      }).play();
    },
    [stageRef]
  );

  // ... handleTouchMove, handleTouchEnd, handleDragEnd (elastic snap-back)

  return {
    handleWheel,
    handleTouchMove,
    handleTouchEnd,
    handleDragEnd,
    zoomByButton,
  };
}
```

### Hono Endpoint for Floor Plan Image
```typescript
// Source: Hono docs — https://hono.dev/docs/getting-started/nodejs
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Hono } from 'hono';

const app = new Hono();

app.get('/api/floor-plan/image', async (c) => {
  try {
    const imagePath = resolve(__dirname, 'assets/floor-plan.png');
    const buffer = await readFile(imagePath);
    c.header('Content-Type', 'image/png');
    c.header('Cache-Control', 'public, max-age=3600');
    return c.body(buffer);
  } catch {
    return c.json({ error: 'Floor plan not found' }, 404);
  }
});

app.get('/api/floor-plan/thumbnail', async (c) => {
  try {
    const imagePath = resolve(__dirname, 'assets/floor-plan-thumb.jpg');
    const buffer = await readFile(imagePath);
    c.header('Content-Type', 'image/jpeg');
    c.header('Cache-Control', 'public, max-age=3600');
    return c.body(buffer);
  } catch {
    return c.json({ error: 'Thumbnail not found' }, 404);
  }
});
```

### ZoomControls as HTML Overlay
```typescript
// Zoom buttons should be HTML elements positioned over the canvas,
// NOT Konva shapes. This ensures they:
// 1. Don't transform with the stage (always same size/position)
// 2. Are accessible (keyboard, screen reader)
// 3. Have standard button hover/active states

function ZoomControls({ onZoomIn, onZoomOut }: {
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2">
      <button onClick={onZoomIn}
        className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-xl font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100"
        aria-label="Zoom in">
        +
      </button>
      <button onClick={onZoomOut}
        className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-xl font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100"
        aria-label="Zoom out">
        -
      </button>
    </div>
  );
}
```

### CSS for Canvas Container
```css
/* Prevent browser from intercepting touch gestures on the canvas */
.konvajs-content {
  touch-action: none;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-konva-utils` for useImage | Standalone `use-image` package (v1.1.4) | Konva team extracted it as separate package | Install `use-image` directly, not as part of a utils bundle |
| Manual `new Image()` + useEffect | `use-image` hook | Standardized by Konva team | 3 lines vs 20+ lines; handles edge cases automatically |
| `Konva.FastLayer` for performance | Regular `Layer` (FastLayer deprecated) | Konva v8+ | Don't use FastLayer — it's gone |
| `stage.draggable(true)` imperative | `<Stage draggable>` declarative prop | react-konva has always supported this | Use JSX prop, not imperative calls |

**Deprecated/outdated:**
- `Konva.FastLayer`: Removed. Use `Layer` — Konva v8+ optimized standard layers sufficiently.
- `react-konva-utils`: Package exists but `use-image` is the standalone replacement for image loading. Don't install the utils package for this use case.

## Open Questions

1. **Test image dimensions — what resolution?**
   - What we know: Need a test floor plan image. Any image works. Recommend ~3000x2000px for realistic testing of zoom quality.
   - What's unclear: Whether to generate a simple test image programmatically or use a free sample.
   - Recommendation: Create a simple 3000x2000 PNG with room outlines, labels, and hallways using a drawing tool or a placeholder generator. Also create a ~400x267 JPEG thumbnail for progressive loading.

2. **Rotation interaction details**
   - What we know: User wants mobile rotation so students can align map with walking direction. Two-finger rotation gesture is standard.
   - What's unclear: Should there be a "reset rotation" button? Should rotation persist across sessions? Should rotation be quantized (snap to 0/90/180/270)?
   - Recommendation: Implement free-form rotation via two-finger gesture. No snap, no persistence, no reset button for Phase 2 (keep it simple). If orientation gets weird, user just rotates back.

3. **Konva.Tween cleanup in React strict mode**
   - What we know: React 19 strict mode double-invokes effects. Konva.Tween is created imperatively, not via React state.
   - What's unclear: Whether orphaned tweens from strict mode double-invoke could cause issues.
   - Recommendation: Store active tweens in refs and call `.destroy()` on the previous tween before creating a new one. This handles both strict mode and rapid user input.

## Sources

### Primary (HIGH confidence)
- `/konvajs/site` (Context7) — Zooming Relative To Pointer, Multi-touch Scale Stage, Canvas Scrolling, Tween API, Image rendering, dragBoundFunc
- `/konvajs/react-konva` (Context7) — React component API, use-image integration, declarative Stage/Layer/Image
- `/llmstxt/hono_dev_llms-full_txt` (Context7) — `serveStatic` middleware for Node.js, file serving patterns
- `use-image` npm registry — v1.1.4, peer deps React >=16.8, from konvajs org

### Secondary (MEDIUM confidence)
- Konva.Tween easing options — verified via Context7 code examples showing `Konva.Easings.EaseInOut`, `BounceEaseOut`, etc.
- `Konva.hitOnDragEnabled` — documented in official multi-touch example as required for reliable touch events during drag

### Tertiary (LOW confidence)
- GPU texture size limits (~4096-8192px depending on device) — general WebGL/Canvas knowledge, not verified against specific Konva documentation for this version
- `touch-action: none` CSS — standard web platform behavior, not Konva-specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project except `use-image` (verified via npm + Context7)
- Architecture: HIGH — patterns directly from Konva official examples, verified via Context7
- Pitfalls: HIGH — all pitfalls sourced from official examples (e.g., `hitOnDragEnabled`) or well-documented canvas performance patterns
- Discretion recommendations: MEDIUM — based on general web/UX best practices, not Konva-specific docs

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable libraries, no breaking changes expected)
