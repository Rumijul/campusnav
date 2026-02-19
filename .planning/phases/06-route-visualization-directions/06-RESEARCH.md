# Phase 6: Route Visualization & Directions - Research

**Researched:** 2026-02-19
**Domain:** Konva canvas route rendering, animated dashes, turn-by-turn direction generation, Vaul bottom sheet with tabs
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Route Path Rendering
- Toggle mode: only one route (standard OR accessible) is drawn on the canvas at a time
- Default route shown first: standard route
- Color scheme: blue for standard route, green for accessible route
- Line style: animated dashes moving along the path (conveys direction of travel)
- A legend must explain which color is which

#### Directions Panel
- A new bottom sheet replaces the compact strip (A/B selection strip) once routes are computed
- Default state: peeked (partial height), user can drag up to full screen
- Route toggle lives inside the sheet as tabs in the sheet header — Standard tab / Accessible tab; switching tab updates both the sheet content and the active map route simultaneously
- Dismissal: back arrow returns user to the compact strip (A/B pin selection state)
- On open: map auto-fits to show the full active route, then user is free to pan freely

#### Step Format & Content
- Steps are landmark-based turns: e.g., "Turn left at the cafeteria"
- Time estimate shown per step (each step has a small duration alongside the instruction)
- Walking speed assumption: Claude's discretion (mode-appropriate speeds are acceptable — slower for accessible route)
- Each step has a directional icon (arrow for turn, straight arrow for forward, accessibility symbol for ramp/accessible segments)

#### Same-Route & Missing-Route Edge Cases
- Standard and accessible routes are **identical**: merge into a single tab with a combined label (e.g., "Standard (accessible)") — no duplicate steps
- Accessible route **doesn't exist** (no wheelchair path): Accessible tab is shown but disabled/grayed out with a tooltip: "No accessible route available"
- **Neither route exists** (A and B disconnected): sheet shows a "No route found" message, map clears the route overlay, user can change their selection

### Claude's Discretion
- Exact walking speed values for time calculation (mode-appropriate is acceptable)
- Sheet drag snap points (peek height, half, full)
- Exact animated dash parameters (speed, gap size, stroke width)
- Legend placement on the canvas
- Empty/loading state while pathfinding runs (if any)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ROUT-03 | App displays both standard and wheelchair-accessible routes simultaneously with distinct color coding | Tab toggle architecture; blue/green line rendering via Konva `Line` with `stroke` prop; legend as HTML overlay above canvas |
| ROUT-04 | App draws visual route paths on the floor plan map from start to destination | Konva `Line` with flat `points` array; normalized coords → pixel conversion via `imageRect`; positioned in a dedicated `Layer` between floor plan and landmark layers |
| ROUT-05 | App provides step-by-step text directions with landmark references | Direction generation algorithm (angle-based turn classification, landmark detection on segments); step list rendered in Vaul bottom sheet |
| ROUT-06 | App shows estimated walking time for both standard and wheelchair-accessible routes | Walking speed constants; `totalDistance` from `PathResult` already computed; per-step duration from `PathSegment.distance` |
</phase_requirements>

---

## Summary

Phase 6 wires up the already-computed `routeResult` (stored in `FloorPlanCanvas` state but unused) into visible output: an animated route line on the Konva canvas and a Vaul bottom sheet with step-by-step directions and a Standard/Accessible tab toggle.

The canvas rendering work is straightforward: a `RouteLayer` Konva component renders a `Line` shape with `dash` and animated `dashOffset` driven by `Konva.Animation`. Coordinates come from `PathResult.nodeIds` → node lookup → normalized coords × `imageRect` dimensions, matching the exact pattern already used in `SelectionMarkerLayer`. The animated dash uses `dashOffset` incremented per-frame via `Konva.Animation` attached to the line's layer — this is the canonical Konva approach (verified via Context7 and existing codebase usage of `KonvaModule.Tween`).

The directions sheet replaces the compact strip. It builds on the existing `LandmarkSheet` pattern (Vaul `Drawer.Root` with `snapPoints`, `modal={false}`, `dismissible`) but adds a tab header row and step list. Vaul 1.1.2 supports fractional snap points (0–1 range, same as used in `LandmarkSheet`). Direction steps are generated from `PathResult.nodeIds` by computing bearing changes between consecutive segments — a "turn" occurs when the bearing delta exceeds a threshold (~30°). Landmark references are provided by checking whether a node on the path is a named landmark visible to students.

**Primary recommendation:** Implement as four focused units: (1) `RouteLayer` — Konva canvas component, (2) `useRouteDirections` — pure step generation hook, (3) `DirectionsSheet` — Vaul sheet with tab state, (4) wiring changes in `FloorPlanCanvas` to expose `routeResult` and control sheet visibility.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `konva` | 10.2.0 (installed) | `Konva.Animation`, `Line` shape, `dashOffset` | Already in project; `Konva.Animation` is the idiomatic loop API |
| `react-konva` | 19.2.2 (installed) | `<Line>` declarative shape, `<Layer>` | Already used for all canvas rendering in project |
| `vaul` | 1.1.2 (installed) | Bottom sheet with snap points and tab headers | Already used in `LandmarkSheet`; no new install needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React `useRef` + `useEffect` | n/a (React 19) | Attach `Konva.Animation` to line node ref | Animation must be imperative; `useRef` is the correct bridge |
| Tailwind CSS | 4.x (installed) | Tab styling, step list, icons | Already used throughout project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Konva.Animation` (imperative) | React `useState` + `setInterval` | `setInterval` causes React re-renders every frame, destroying canvas performance. `Konva.Animation` mutates the node imperatively without React reconciliation. |
| `Konva.Animation` dashOffset | CSS animation on SVG overlay | Would require a separate SVG layer above canvas; misaligns with existing Konva-only rendering approach |
| Hand-rolled tab component | Radix UI Tabs | Radix not installed; simple two-tab toggle is 20 lines of React state — hand-rolling is appropriate at this scale |

**Installation:** No new packages needed. All required libraries are already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/client/
├── components/
│   ├── RouteLayer.tsx           # NEW: Konva Layer with animated route line + legend
│   ├── DirectionsSheet.tsx      # NEW: Vaul bottom sheet with tabs + step list
│   └── FloorPlanCanvas.tsx      # MODIFIED: expose routeResult, sheet state
├── hooks/
│   └── useRouteDirections.ts    # NEW: pure hook — PathResult → DirectionStep[]
```

### Pattern 1: Animated Dashed Line (dashOffset via Konva.Animation)

**What:** A `Konva.Line` with `dash` array. A `Konva.Animation` increments `dashOffset` each frame to make dashes appear to move along the path toward the destination.

**When to use:** Any time a route line needs to convey direction of travel. The animation runs only while a route is active; it is stopped and the node destroyed on cleanup.

**Example:**
```typescript
// Source: Context7 /konvajs/site + existing codebase pattern (FloorPlanCanvas uses KonvaModule.Tween)
import KonvaModule from 'konva'
import { useEffect, useRef } from 'react'
import { Layer, Line } from 'react-konva'
import type Konva from 'konva'

const DASH_LENGTH = 16
const GAP_LENGTH = 10
const DASH_SPEED = 30 // px per second (dashOffset units)

function RouteLayer({ points, color }: { points: number[]; color: string }) {
  const lineRef = useRef<Konva.Line>(null)
  const animRef = useRef<KonvaModule.Animation | null>(null)

  useEffect(() => {
    const node = lineRef.current
    if (!node) return

    // Konva.Animation increments dashOffset per frame — no React setState
    animRef.current = new KonvaModule.Animation((frame) => {
      if (!frame) return
      const delta = (frame.timeDiff / 1000) * DASH_SPEED
      node.dashOffset(node.dashOffset() - delta)
    }, node.getLayer())

    animRef.current.start()

    return () => {
      animRef.current?.stop()
      animRef.current = null
    }
  }, [points]) // re-create animation when route changes

  return (
    <Layer>
      <Line
        ref={lineRef}
        points={points}
        stroke={color}
        strokeWidth={5}
        lineCap="round"
        lineJoin="round"
        dash={[DASH_LENGTH, GAP_LENGTH]}
        dashOffset={0}
        listening={false} // route line is display-only
      />
    </Layer>
  )
}
```

**Key detail:** `dashOffset` decreasing = dashes move forward (toward destination). The `frame.timeDiff` in milliseconds divided by 1000 gives seconds; multiply by pixels/second for smooth frame-rate-independent motion.

**Counter-scaling is NOT needed for the route line.** The line lives in stage-space, not screen-space. It scales naturally with zoom like the floor plan image. Only markers (pins, landmark circles) need counter-scaling to stay constant screen size.

### Pattern 2: Coordinate Conversion — Normalized → Pixel Points Array

**What:** Convert `PathResult.nodeIds` to a flat `[x1, y1, x2, y2, ...]` array for the Konva `Line` `points` prop, using `imageRect` (already passed throughout the component tree).

**Example:**
```typescript
// Source: Pattern extrapolated from SelectionMarkerLayer.tsx:43-48 coordinate conversion
function buildRoutePoints(
  nodeIds: string[],
  nodeMap: Map<string, { x: number; y: number }>,
  imageRect: { x: number; y: number; width: number; height: number }
): number[] {
  const points: number[] = []
  for (const id of nodeIds) {
    const node = nodeMap.get(id)
    if (!node) continue
    points.push(
      imageRect.x + node.x * imageRect.width,
      imageRect.y + node.y * imageRect.height,
    )
  }
  return points
}
```

**This is the exact same coordinate math used in `SelectionMarkerLayer`** — no new pattern needed.

### Pattern 3: Layer Ordering in FloorPlanCanvas

The route line must render **above** the floor plan image but **below** landmarks and pins. Current layer order in `FloorPlanCanvas`:

```
Layer 1: GridBackground (static)
Layer 2: FloorPlanImage
Layer 3: LandmarkLayer
Layer 4: SelectionMarkerLayer (A/B pins)
Layer 5: UI overlay (loading/error text)
```

Insert `RouteLayer` between Layer 2 and Layer 3:
```
Layer 2: FloorPlanImage
Layer 2.5: RouteLayer  ← NEW (route line drawn below landmarks)
Layer 3: LandmarkLayer
```

### Pattern 4: Vaul Bottom Sheet with Tabs

**What:** Directions sheet mirrors `LandmarkSheet` structure (same `snapPoints`, `modal={false}`, `dismissible`) but with a custom tab row in the header instead of a close button.

**Key differences from LandmarkSheet:**
- `open` is controlled by `routeResult !== null && bothSelected`
- `onOpenChange(false)` → call `clearAll()` to return to A/B selection (NOT just close the sheet)
- Tab state is local (`useState<'standard' | 'accessible'>('standard')`)
- `dismissible={false}` — user must use the back arrow (back arrow calls `clearAll`)

**Example:**
```typescript
// Source: LandmarkSheet.tsx:26-34 pattern + Vaul API from Context7 /websites/vaul_emilkowal_ski
import { Drawer } from 'vaul'

<Drawer.Root
  open={isOpen}
  onOpenChange={(open) => { if (!open) onDismiss() }}
  snapPoints={[0.35, 0.92]}
  activeSnapPoint={activeSnapPoint}
  setActiveSnapPoint={setActiveSnapPoint}
  modal={false}
  dismissible={false}   // back arrow is the only exit
>
  <Drawer.Portal>
    <Drawer.Content ...>
      {/* Drag handle */}
      <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-gray-300" />
      
      {/* Header: back arrow + tabs */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-0">
        <button onClick={onDismiss} aria-label="Back to selection">
          <BackArrowIcon />
        </button>
        <TabButton active={tab === 'standard'} onClick={() => setTab('standard')}>
          Standard
        </TabButton>
        <TabButton active={tab === 'accessible'} onClick={() => setTab('accessible')} disabled={!accessibleRoute.found}>
          Accessible
        </TabButton>
      </div>
      
      {/* Step list */}
      <div className="overflow-y-auto px-4 pb-10 pt-2">
        {steps.map((step, i) => <StepRow key={i} step={step} />)}
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
```

### Pattern 5: Direction Step Generation Algorithm

**What:** Convert `PathResult.nodeIds` + node metadata into human-readable `DirectionStep[]`.

**Algorithm:**
1. Walk `nodeIds` array; for each consecutive triple `[prev, curr, next]`:
   - Compute bearing from `prev → curr` and `curr → next`
   - Compute angular delta (bearing change at `curr`)
   - Classify: |delta| < 30° → "straight", 30°–120° left/right → "turn left/right", > 120° → "sharp turn"
2. A new step is emitted when: bearing changes significantly **OR** `curr` is a named landmark node
3. Landmark reference: if any node on the straight segment between turns is a `searchable` visible type, include its label in the step text ("past the cafeteria" / "at the elevator")
4. Distance for the step: sum of `PathSegment.distance` values for segments in the step

**Bearing calculation (verified math):**
```typescript
function bearing(ax: number, ay: number, bx: number, by: number): number {
  // Returns angle in degrees, 0 = right, 90 = down (canvas Y-axis is inverted from geographic)
  return Math.atan2(by - ay, bx - ax) * (180 / Math.PI)
}

function angleDelta(fromBearing: number, toBearing: number): number {
  let delta = toBearing - fromBearing
  // Normalize to -180..180
  while (delta > 180) delta -= 360
  while (delta < -180) delta += 360
  return delta
}
```

**Direction classification:**
```typescript
function classifyTurn(delta: number): 'straight' | 'left' | 'right' | 'sharp-left' | 'sharp-right' | 'u-turn' {
  const abs = Math.abs(delta)
  if (abs < 30) return 'straight'
  if (abs < 120) return delta < 0 ? 'left' : 'right'
  if (abs < 160) return delta < 0 ? 'sharp-left' : 'sharp-right'
  return 'u-turn'
}
```

**Note on Y-axis:** Canvas Y increases downward; north is up. When using `Math.atan2(dy, dx)`, turning "left" in screen space corresponds to a negative delta (counter-clockwise) IF the user is walking right-to-left. This only matters for "left/right" label accuracy. For the test graph (25 nodes), direction labels will be plausible; exact accuracy depends on map orientation.

### Pattern 6: Walking Speed & Time Estimation

Edge weights in the graph are Euclidean distance in normalized 0–1 coordinate space. The floor plan image is 1600×1000 px (verified from `generate-test-images.ts`). Assuming a real building of ~50m × 30m (a typical medium-sized academic building wing):

**Recommended speed constants (Claude's discretion):**
```typescript
// Normalized units per second
// 1 normalized unit ≈ hypothetical building diagonal ≈ ~60m real distance
// Walking speed: 1.4 m/s standard, 0.8 m/s accessible
// → in normalized: 1.4/60 ≈ 0.023 units/s standard, 0.013 units/s accessible

const WALKING_SPEED_STANDARD = 0.023  // normalized units/s
const WALKING_SPEED_ACCESSIBLE = 0.013  // normalized units/s

function estimateSeconds(distance: number, mode: 'standard' | 'accessible'): number {
  const speed = mode === 'accessible' ? WALKING_SPEED_ACCESSIBLE : WALKING_SPEED_STANDARD
  return Math.round(distance / speed)
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  return `${Math.round(seconds / 60)} min`
}
```

**Alternative acceptable approach:** Use a simpler arbitrary scale (e.g., 1 normalized distance unit = 1 minute of walking). The exact numbers are less important than consistency. The planner can choose.

### Pattern 7: Identical Routes — Tab Merging

When `standard.nodeIds.join(',') === accessible.nodeIds.join(',')`:
- Render single tab labeled "Standard (accessible)"
- Show one step list
- No tab switching needed; `activeTab` state still exists but never changes

When accessible route not found (`accessible.found === false`):
- Show disabled "Accessible" tab with `title="No accessible route available"` tooltip
- Active tab stays on "standard"
- The canvas still shows standard route only

When neither found:
- Don't open the directions sheet
- Show the existing toast ("No route found") already implemented in `FloorPlanCanvas`
- Map clears route overlay (routeResult remains null)

### Anti-Patterns to Avoid

- **Re-creating `Konva.Animation` every render:** Create animation in `useEffect` with correct deps. Only re-create when `points` array identity changes (i.e., new route computed), not on every parent re-render.
- **Using React state for dashOffset:** Never `setState({ dashOffset })` every animation frame. This triggers full React reconciliation 60× per second and will cause dropped frames. Use `node.dashOffset(value)` imperatively.
- **Putting route line in same Layer as landmarks:** A separate `<Layer>` for the route line keeps animation redraws isolated to that layer only, not the entire stage.
- **Counter-scaling the route line:** The route line is in stage-space and should scale with zoom. Only circle/text markers need counter-scaling.
- **Using `dismissible={true}` on directions sheet:** The swipe-down gesture would clear the route unexpectedly. The back arrow must be the only exit path.
- **Applying `tension` to the route Line:** `tension > 0` creates a Catmull-Rom spline that does NOT pass through the node points. Route lines must pass exactly through each node. Use `tension={0}` (default).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-frame dashOffset animation | `setInterval` + `useState` | `Konva.Animation` with `frame.timeDiff` | setInterval triggers React reconciliation every frame; Konva.Animation is decoupled from React render cycle |
| Bottom sheet with drag/snap | Custom CSS drawer | `vaul` (already installed) | Vaul handles gesture physics, momentum, snap points, accessibility, keyboard trap — ~2000 lines of complexity |
| Coordinate conversion | Custom scale function | The same formula as `SelectionMarkerLayer`: `imageRect.x + node.x * imageRect.width` | Already battle-tested in codebase |

**Key insight:** The two genuinely novel pieces of work are (1) the `dashOffset` animation loop and (2) the direction generation algorithm. Everything else reuses existing project patterns directly.

---

## Common Pitfalls

### Pitfall 1: Stale `imageRect` in Animation Closure
**What goes wrong:** Route points are computed once when the route is set. If `imageRect` changes (viewport resize) while animation is running, the line points become stale.
**Why it happens:** Points are pre-computed from `imageRect` at route-computation time. The `Konva.Animation` closure doesn't recompute them.
**How to avoid:** `RouteLayer` takes `points` as a prop computed from `imageRect` in the parent. `imageRect` is already in `FloorPlanCanvas` state and triggers re-render when changed. As long as `points` is recomputed when `imageRect` changes, the line auto-updates.
**Warning signs:** Route line appears offset or misaligned after window resize.

### Pitfall 2: Animation Persists After Route Cleared
**What goes wrong:** `Konva.Animation` runs indefinitely even after the route is cleared, causing canvas redraws for nothing.
**Why it happens:** Animation started in `useEffect` without proper cleanup.
**How to avoid:** `useEffect` cleanup function calls `animRef.current?.stop()`. Additionally, only render `RouteLayer` when `routeResult !== null` — the component unmounts and cleanup fires.
**Warning signs:** CPU usage stays elevated after clearing route.

### Pitfall 3: Tab Switch Doesn't Update Map Route
**What goes wrong:** User switches to Accessible tab in the sheet but the canvas still shows the standard route line.
**Why it happens:** `activeTab` state is local to `DirectionsSheet`; `FloorPlanCanvas` doesn't know which tab is active.
**How to avoid:** Lift `activeTab` state (or an `activeRouteMode` derived value) up to `FloorPlanCanvas`, pass it down to both `RouteLayer` and `DirectionsSheet`. Alternative: pass an `onTabChange` callback from `FloorPlanCanvas` to `DirectionsSheet`.
**Warning signs:** The canvas and the step list show different routes.

### Pitfall 4: Vaul Sheet Open/Close State Conflicts with Route State
**What goes wrong:** Vaul's `onOpenChange(false)` fires when the user drags the sheet down; this should clear the route and return to A/B selection. But if the sheet is programmatically opened when both nodes are selected, dragging it to 0 snap would clear the route unintentionally.
**Why it happens:** `dismissible={true}` allows swipe-to-dismiss as a route-clear gesture.
**How to avoid:** Set `dismissible={false}` on the directions sheet. The only dismiss path is the back arrow, which explicitly calls `clearAll()`. This prevents accidental route clearing.

### Pitfall 5: Direction Generation — Same Node in nodeIds
**What goes wrong:** `ngraph.path` can return the same node ID consecutively in edge cases (same-node route: `nodeIds = ['room-a']`). The bearing calculation `Math.atan2(0, 0)` returns 0 but produces no step.
**Why it happens:** `PathfindingEngine.findRoute` returns `{ found: true, nodeIds: [fromId], totalDistance: 0, segments: [] }` for same-start-and-destination.
**How to avoid:** In `useRouteDirections`, if `nodeIds.length <= 1`, return a single step "You are already at your destination" with 0 distance and no direction icon.
**Warning signs:** Empty directions sheet for same-location routes.

### Pitfall 6: `Konva.Animation` Layer Reference
**What goes wrong:** `new KonvaModule.Animation(fn, layer)` requires a live layer reference. If the layer hasn't mounted yet when `useEffect` runs, `node.getLayer()` returns null.
**Why it happens:** Effect runs after first render, but the Layer node might not be registered yet if the component tree isn't fully mounted.
**How to avoid:** Check `node.getLayer()` for null before creating animation. Alternatively, use `node.getLayer()` after a brief delay or in an `onMount` callback, but in practice this is rarely an issue since `useEffect` runs after the DOM and canvas are painted.
**Warning signs:** Animation never starts; console error "Cannot read properties of null".

---

## Code Examples

Verified patterns from official sources and codebase:

### Animated Dashed Route Line (complete component)
```typescript
// Sources:
//   Context7 /konvajs/site — dashOffset, Konva.Animation
//   Context7 /konvajs/react-konva — useRef + useEffect imperative pattern
//   Existing codebase — KonvaModule import pattern (FloorPlanCanvas.tsx:4)
import KonvaModule from 'konva'
import type Konva from 'konva'
import { useEffect, useRef } from 'react'
import { Layer, Line } from 'react-konva'

interface RouteLayerProps {
  points: number[]    // flat [x1,y1,x2,y2,...] in pixel coords
  color: string       // '#3b82f6' standard, '#22c55e' accessible
  visible: boolean
}

const DASH: [number, number] = [16, 10]
const DASH_SPEED = 40 // px/s — moves toward destination

export function RouteLayer({ points, color, visible }: RouteLayerProps) {
  const lineRef = useRef<Konva.Line>(null)
  const animRef = useRef<KonvaModule.Animation | null>(null)

  useEffect(() => {
    if (!visible || points.length < 4) return
    const node = lineRef.current
    if (!node) return
    const layer = node.getLayer()
    if (!layer) return

    animRef.current?.stop()
    animRef.current = new KonvaModule.Animation((frame) => {
      if (!frame) return
      node.dashOffset(node.dashOffset() - (frame.timeDiff / 1000) * DASH_SPEED)
    }, layer)
    animRef.current.start()

    return () => {
      animRef.current?.stop()
      animRef.current = null
    }
  }, [points, visible])

  if (!visible || points.length < 4) return null

  return (
    <Layer>
      <Line
        ref={lineRef}
        points={points}
        stroke={color}
        strokeWidth={5}
        lineCap="round"
        lineJoin="round"
        dash={DASH}
        dashOffset={0}
        listening={false}
      />
    </Layer>
  )
}
```

### Node ID Array → Pixel Points Array
```typescript
// Source: SelectionMarkerLayer.tsx:43-48 coordinate pattern
function buildRoutePoints(
  nodeIds: string[],
  nodeMap: ReadonlyMap<string, { x: number; y: number }>,
  imageRect: { x: number; y: number; width: number; height: number },
): number[] {
  const result: number[] = []
  for (const id of nodeIds) {
    const n = nodeMap.get(id)
    if (!n) continue
    result.push(
      imageRect.x + n.x * imageRect.width,
      imageRect.y + n.y * imageRect.height,
    )
  }
  return result
}
```

### Vaul Snap Points (directions sheet)
```typescript
// Source: LandmarkSheet.tsx:32-33 — existing vaul snap point pattern
// Snap points: 0.35 = peek (header visible), 0.92 = full
const [activeSnapPoint, setActiveSnapPoint] = useState<number | string | null>(0.35)

<Drawer.Root
  open={isOpen}
  snapPoints={[0.35, 0.92]}
  activeSnapPoint={activeSnapPoint}
  setActiveSnapPoint={setActiveSnapPoint}
  modal={false}
  dismissible={false}
>
```

### Direction Step Type
```typescript
export type TurnDirection = 'start' | 'straight' | 'left' | 'right' | 'sharp-left' | 'sharp-right' | 'arrive' | 'accessible-segment'

export interface DirectionStep {
  instruction: string        // "Turn left at the Cafeteria"
  landmarkRef?: string       // landmark label referenced in instruction
  direction: TurnDirection
  distanceNorm: number       // normalized distance for this step
  durationSeconds: number    // estimated walk time for this step
  isAccessibleSegment: boolean // true if step uses ramp/elevator
}
```

### Route Identity Check (same-route merging)
```typescript
function routesAreIdentical(a: PathResult, b: PathResult): boolean {
  if (!a.found || !b.found) return false
  if (a.nodeIds.length !== b.nodeIds.length) return false
  return a.nodeIds.every((id, i) => id === b.nodeIds[i])
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS animation on SVG route overlay | Konva `dashOffset` + `Konva.Animation` | Matches existing Konva-only canvas approach | No SVG/canvas mixing; animations stay in canvas layer |
| Separate drawer library (react-spring-bottom-sheet, etc.) | Vaul (already installed) | Vaul chosen in Phase 4 | Already installed and used in LandmarkSheet — no new dependencies |

**No deprecated patterns identified** — all APIs used (`Konva.Animation`, `dash`, `dashOffset`, Vaul `snapPoints`) are current in the installed versions.

---

## Open Questions

1. **How much of `FloorPlanCanvas` state needs lifting?**
   - What we know: `routeResult` is currently local state in `FloorPlanCanvas`. `DirectionsSheet` needs it. `RouteLayer` needs the active route's `nodeIds`.
   - What's unclear: Whether to lift `activeRouteMode` to `FloorPlanCanvas` (so canvas and sheet are always in sync) or use a callback.
   - Recommendation: Keep `routeResult` in `FloorPlanCanvas`, pass it down as a prop to both `RouteLayer` and `DirectionsSheet`. Pass `activeRouteMode` state up via `onTabChange` callback, or keep `activeRouteMode` in `FloorPlanCanvas` and pass setter to `DirectionsSheet`. The latter is cleaner.

2. **Should `fitToBounds` be called on tab switch (standard ↔ accessible)?**
   - What we know: The CONTEXT says "on open: map auto-fits to show the full active route, then user is free to pan freely." No mention of re-fitting on tab switch.
   - What's unclear: If accessible route is substantially longer than standard route, switching to it might show a route partially off screen.
   - Recommendation: Do NOT re-fit on tab switch (user has already panned freely; a sudden re-fit would be jarring). Accept that the user may need to pan. This honors "user is free to pan freely."

3. **Legend placement — canvas vs HTML overlay?**
   - What we know: Legend is Claude's discretion. It must explain blue = standard, green = accessible.
   - Recommendation: Place legend as an HTML `div` overlay (like zoom controls and toast) in the bottom-left corner of the canvas area. HTML overlays are simpler to style with Tailwind than Konva `Text`/`Rect` nodes, and they don't need counter-scaling. Only render the legend when `routeResult !== null`.

4. **Direction generation accuracy for the test graph**
   - What we know: The test graph has 25 nodes with normalized coordinates. Edge weights are ~0.08–0.25 normalized units. Most paths will be 3–8 nodes long.
   - What's unclear: Whether bearing-based turn detection at such short distances (2–4 "real meters" per segment) produces sensible instructions.
   - Recommendation: Use `isAccessibleSegment` on any segment connecting a `ramp` or `elevator` node type. For very short segments (< 0.05 normalized units), suppress turn instructions and merge with next segment. This prevents spurious "turn right, then turn left" for minor jogs.

---

## Sources

### Primary (HIGH confidence)
- `/konvajs/site` (Context7) — `dashOffset`, `dash` array API, `Konva.Animation` loop pattern
- `/konvajs/react-konva` (Context7) — `useRef` + `useEffect` imperative animation pattern
- `/websites/vaul_emilkowal_ski` (Context7) — `snapPoints`, `modal`, `dismissible`, Root API
- Codebase (`src/client/components/LandmarkSheet.tsx`) — existing Vaul pattern with snap points 0.15/0.9
- Codebase (`src/client/components/SelectionMarkerLayer.tsx`) — normalized→pixel coordinate pattern
- Codebase (`src/client/components/FloorPlanCanvas.tsx`) — `KonvaModule.Tween` usage, `routeResult` state location, `fitToBounds` API
- Codebase (`src/shared/pathfinding/types.ts`) — `PathResult`, `PathSegment` types
- Codebase (`src/server/assets/campus-graph.json`) — 25 nodes, normalized 0–1 coords, edge weight ranges

### Secondary (MEDIUM confidence)
- Installed package versions verified at runtime: `konva@10.2.0`, `react-konva@19.2.2`, `vaul@1.1.2`
- `Konva.Animation` and `Konva.Tween` existence confirmed via Node.js inspection of `konva/lib/index.js`

### Tertiary (LOW confidence)
- Walking speed constants (0.023 / 0.013 normalized units/s) — derived from assumed building dimensions; plausible but not based on actual campus measurements

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use; versions confirmed at runtime
- Architecture: HIGH — patterns directly extrapolated from existing codebase (same `imageRect` conversion, same Konva import style, same Vaul structure)
- Pitfalls: HIGH — verified against actual code paths in `FloorPlanCanvas` and `LandmarkSheet`
- Walking speeds: LOW — assumed building scale; functionally correct relative values

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stable stack — Konva 10.x, Vaul 1.x are not fast-moving)
