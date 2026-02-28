# Phase 4: Map Landmarks & Location Display - Research

**Researched:** 2026-02-19 (re-researched with fresh Context7 lookups + source code verification)
**Domain:** Konva canvas markers + React bottom sheet (Vaul) + Hono static JSON endpoint
**Confidence:** HIGH

## Summary

Phase 4 layers two distinct UI concerns onto the existing Konva canvas: (1) interactive landmark markers on the floor plan layer, and (2) an HTML bottom sheet that slides up when a marker is tapped. These concerns live in different coordinate systems — markers live inside Konva's transform space, the bottom sheet lives as an HTML overlay outside it — which is the central architectural fact of this phase.

The marker rendering pattern is well-established: a react-konva `Group` containing a `Circle` + `Text` per landmark node, positioned using normalized→pixel coordinate conversion from the existing `imageRect`. The existing codebase already threads `imageRect` from `FloorPlanImage` up through `FloorPlanCanvas` (`FloorPlanCanvas.tsx:22-27`), so the conversion formula is ready to use. Visibility filtering (hide navigation-only nodes) is a pure `Array.filter()` on node type before rendering — no Konva-specific logic needed.

The bottom sheet uses **Vaul** (v1.1.2, by Emil Kowalski). Vaul is the de-facto standard for Google Maps-style peek-then-expand drawer behavior in React. It handles all three dismissal methods (tap outside, swipe down, close button), supports snap points (peek → full height), and is unstyled — Tailwind CSS applies directly. **Critical from source code review:** When `modal={false}`, Vaul's `Overlay` component returns `null` (no backdrop rendered), and `onPointerDownOutside` calls `e.preventDefault()` which prevents auto-close on outside click. This means "tap outside to dismiss" must be handled manually via a Stage click handler.

**Primary recommendation:** Use Vaul with `snapPoints={[0.15, 0.9]}` + `modal={false}` for the bottom sheet. Use react-konva `Group` + `Circle` + `Text` with counter-scaling for fixed-screen-size markers. Serve graph data from a new `GET /api/map` endpoint on the Hono server using a static JSON fixture file in `src/server/assets/`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Marker appearance:** Filled circles with text label — clean, map-like style
- **Label visibility:** Labels appear on hover (desktop) or tap (mobile) only — NOT always visible
- **Type distinction:** Different landmark types (classroom, office, restroom, etc.) must be visually distinguishable
- **Bottom sheet style:** Google Maps style — slides up from bottom, starts as small peek showing name + type; user drags up to see full details
- **Bottom sheet full content:** name, room number, type, description, floor, building, and accessibility notes
- **Bottom sheet dismissal:** All three methods: tap outside the sheet, swipe down, and close button
- **Test data size:** 15–30 landmarks covering full campus variety (classrooms, offices, restrooms, exits, stairs, elevators, cafeteria)
- **Test data includes:** Hidden navigation nodes (hallway junctions, staircase nodes, ramp nodes) to verify they're properly hidden
- **Test data delivery:** Served from Hono API server (static JSON endpoint for now)

### Claude's Discretion

- Marker color scheme by landmark type (color-coding approach and palette)
- Selected marker visual treatment (highlight, scale, color change)
- Whether labels auto-appear at high zoom levels or stay hover/tap-only at all zoom levels
- Marker scaling behavior (fixed screen size vs scale with map)
- Clustering behavior at low zoom levels (cluster badges vs show all)
- Tap target sizing on mobile (enlarged hit areas vs match visible size)
- Loading state while graph data is being fetched from API

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MAP-03 | User can see visible landmarks/nodes on the map for classrooms, rooms, offices, and other points of interest | react-konva `Group`/`Circle`/`Text` rendered in a dedicated `Layer` above the floor plan image. Visibility filter: nodes where `type` is in `['room', 'entrance', 'elevator', 'restroom', 'landmark']`. |
| MAP-04 | Map hides navigation-only nodes (ramps, staircases, hallway junctions) from the student view | Filter applied before rendering: `nodes.filter(n => VISIBLE_TYPES.includes(n.type))`. Hidden types: `stairs`, `ramp`, `junction`, `hallway`. The nodes still exist in the graph data (for pathfinding in Phase 6) — they are simply never rendered. |
| ROUT-07 | User can tap a location to see its details (name, room number, type, description) | Tap handler on each marker `Group` sets `selectedNode` state; Vaul drawer renders outside Konva stage as an HTML overlay with `open={selectedNode !== null}`. Full detail: name, room number, type, description, floor, building, accessibility notes from extended `NavNodeData`. |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-konva | ^19.2.2 | Render markers as declarative canvas shapes | Already installed (`package.json`). `Group`, `Circle`, `Text` components — standard approach for map markers. Verified via Context7 `/konvajs/react-konva`. |
| konva | ^10.2.0 | Hit detection, counter-scale, stage coordinate access | Already installed. `hitFunc` for enlarged tap targets. `scaleX()` for reading current zoom. Verified via Context7 `/konvajs/site`. |
| vaul | 1.1.2 | Bottom sheet drawer with snap points | De-facto React drawer standard. Source code reviewed on GitHub — built on `@radix-ui/react-dialog`. Snap points, `modal={false}`, `dismissible`, `Handle` component all verified. |
| tailwindcss | ^4.1.18 | Styling the bottom sheet content | Already installed. Applies to HTML overlay outside Konva space. |
| hono | ^4.11.9 | Serve `GET /api/map` static JSON | Already installed. Existing routes in `src/server/index.ts` follow `readFile` + `resolve(__dirname, 'assets/...')` pattern. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | No additional libraries needed | All needs covered by existing stack + Vaul. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vaul | react-spring + hand-rolled sheet | Vaul handles scroll locking, overscroll, velocity snap, focus trap, accessibility (ARIA dialog via Radix). Hand-rolling misses edge cases. |
| Vaul | @radix-ui/react-dialog directly | Dialog doesn't support drag-to-dismiss or snap points. |
| react-konva Group + Circle | Konva.Circle direct mutation | Declarative API is cleaner for data-driven markers. Direct mutation is only appropriate for viewport transforms (existing pattern in `useMapViewport.ts`). |

**Installation:**
```bash
npm install vaul
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── client/
│   ├── components/
│   │   ├── FloorPlanCanvas.tsx     # Add: landmark layer, selectedNode state, stageScale state
│   │   ├── LandmarkLayer.tsx       # NEW: renders all visible marker Groups
│   │   ├── LandmarkMarker.tsx      # NEW: single Circle+Text Group with counter-scale
│   │   └── LandmarkSheet.tsx       # NEW: Vaul bottom sheet for detail display
│   └── hooks/
│       └── useGraphData.ts         # NEW: fetches GET /api/map, returns NavGraph
├── server/
│   ├── assets/
│   │   ├── floor-plan.png          # Existing
│   │   ├── floor-plan-thumb.jpg    # Existing
│   │   └── campus-graph.json       # NEW: 15-30 landmark test fixture
│   └── index.ts                    # Add: GET /api/map route
└── shared/
    └── types.ts                    # Extend NavNodeData with display fields
```

### Pattern 1: Normalized→Pixel Coordinate Conversion

**What:** Convert a node's normalized (0–1) coordinates to pixel positions within the rendered image rect.

**When to use:** In `LandmarkLayer` or `LandmarkMarker` when computing the `x`/`y` of each Konva `Group`.

**Critical note:** The `imageRect` from `FloorPlanImage` (`FloorPlanImage.tsx:29-41`) is in **stage-local coordinates** (i.e., at `scale=1`, before the Stage transform is applied). Markers placed at these coordinates transform with the stage automatically — no manual transform math needed.

```typescript
// Source: FloorPlanImage.tsx imageRect calculation + Konva coordinate system
function nodeToPixel(
  nx: number,
  ny: number,
  imageRect: { x: number; y: number; width: number; height: number }
): { x: number; y: number } {
  return {
    x: imageRect.x + nx * imageRect.width,
    y: imageRect.y + ny * imageRect.height,
  }
}
```

### Pattern 2: Counter-Scaling Markers for Fixed Screen Size

**What:** When the Konva stage is zoomed, markers would normally scale with it. Counter-scaling divides the marker's visual size by the current stage scale so markers maintain a consistent screen-pixel size at all zoom levels.

**When to use:** For the marker circle and text.

```typescript
// Source: Context7 /konvajs/react-konva — Group scale prop
// Applied to each marker Group:
<Group
  x={pixelX}
  y={pixelY}
  scaleX={1 / stageScale}
  scaleY={1 / stageScale}
>
  <Circle radius={SCREEN_RADIUS} fill={color} />
</Group>

// stageScale is read from stageRef.current?.scaleX()
// Updated via callback from viewport handlers (see Pattern 7)
```

**Important:** Counter-scaling requires the stage scale to be passed down as a React prop. Since the viewport uses direct Konva mutation (not React state), a scale-change callback is needed. See Pitfall 3 and Pattern 7 for the correct approach.

### Pattern 3: Vaul Bottom Sheet with Snap Points

**What:** Google Maps-style bottom sheet that peeks at ~15% viewport height, expandable to ~90%.

**Source code findings (verified from vaul GitHub source `src/index.tsx`):**
- `activeSnapPoint` type is actually `number | string | null` (NOT `boolean` as API docs misleadingly show)
- When `modal={false}`, `Overlay` component returns `null` — no backdrop is rendered
- `onPointerDownOutside` with `!modal` calls `e.preventDefault()` — click-outside does NOT auto-close
- `closeDrawer()` internally calls `setActiveSnapPoint(snapPoints[0])` after close animation (resets to first snap point)

```tsx
// Source: vaul.emilkowal.ski/api + GitHub source (verified)
import { Drawer } from 'vaul'
import type { NavNode } from '@shared/types'

interface LandmarkSheetProps {
  node: NavNode | null
  onClose: () => void
}

export function LandmarkSheet({ node, onClose }: LandmarkSheetProps) {
  return (
    <Drawer.Root
      open={node !== null}
      onOpenChange={(open) => { if (!open) onClose() }}
      snapPoints={[0.15, 0.9]}
      modal={false}           // map remains interactive; Overlay returns null
      dismissible={true}      // swipe down closes
    >
      <Drawer.Portal>
        {/* No Drawer.Overlay needed — modal={false} returns null anyway */}
        <Drawer.Content className="fixed inset-x-0 bottom-0 rounded-t-2xl bg-white shadow-2xl outline-none focus:outline-none">
          <Drawer.Handle />
          {/* Peek content: name + type */}
          <div className="px-5 pb-2 pt-3">
            <Drawer.Title className="text-lg font-semibold text-gray-900">
              {node?.label}
            </Drawer.Title>
            <Drawer.Description className="text-sm font-medium text-gray-500 capitalize">
              {node?.type}
            </Drawer.Description>
          </div>
          {/* Full content: all detail fields */}
          <div className="overflow-y-auto px-5 pb-10">
            {node?.roomNumber && <p>Room {node.roomNumber}</p>}
            {node?.description && <p>{node.description}</p>}
            {node?.buildingName && <p>Building: {node.buildingName}</p>}
            {node?.accessibilityNotes && <p>{node.accessibilityNotes}</p>}
          </div>
          <Drawer.Close asChild>
            <button className="absolute right-4 top-4 rounded-full p-1" onClick={onClose}>
              ×
            </button>
          </Drawer.Close>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
```

**Key props:**
- `modal={false}` — essential for map interactivity while sheet is peeked open. Vaul's Overlay returns `null` in this mode. Students can pan/zoom freely.
- `snapPoints={[0.15, 0.9]}` — values are fractions of viewport height (15% peek, 90% full). Verified from source: values between 0 and 1 are fractions.
- `dismissible={true}` (default) — swipe down closes.
- **Manual "tap outside" dismissal required:** Since `modal={false}` prevents auto-close on outside click (`onPointerDownOutside` calls `e.preventDefault()`), use Stage's `onClick` handler to dismiss when tapping map background.
- Use `Drawer.Title` and `Drawer.Description` for accessibility (ARIA attributes inherited from Radix Dialog).

### Pattern 4: Marker Click → Bottom Sheet Trigger (Cross-System Communication)

**What:** Konva click event on a canvas marker must open an HTML drawer component. The bridge is React state (`selectedNode`) in the shared parent `FloorPlanCanvas`.

```tsx
// FloorPlanCanvas.tsx — add selectedNode state
const [selectedNode, setSelectedNode] = useState<NavNode | null>(null)

// In LandmarkLayer (inside Stage → Layer):
<LandmarkMarker
  node={node}
  onClick={() => setSelectedNode(node)}
/>

// Outside Stage (HTML overlay, same parent div):
<LandmarkSheet
  node={selectedNode}
  onClose={() => setSelectedNode(null)}
/>

// Stage-level click to dismiss when tapping map background:
<Stage
  onClick={(e) => {
    // Only dismiss if clicking on stage background, not on a marker
    if (e.target === e.target.getStage()) {
      setSelectedNode(null)
    }
  }}
>
```

**Verified from Context7 `/konvajs/react-konva`:** The deselect-on-background-click pattern (`e.target === e.target.getStage()`) is the official recommended approach. The Transformer demo in react-konva docs uses this exact pattern.

### Pattern 5: Tap Target Enlargement with hitFunc

**What:** On mobile, an 8px visual circle is too small to tap reliably. Konva's `hitFunc` overrides the hit detection area with a larger circle.

```typescript
// Source: Context7 /konvajs/site — Custom Hit Region docs
// hitFunc receives (context, shape) — draw a larger arc for the hit area
<Circle
  radius={SCREEN_RADIUS}
  fill={color}
  hitFunc={(context, shape) => {
    context.beginPath()
    context.arc(0, 0, SCREEN_RADIUS * 2.5, 0, Math.PI * 2, true)
    context.closePath()
    context.fillStrokeShape(shape)
  }}
/>
```

**Verified from Context7:** `hitFunc` signature is `(context) => void` in the imperative API, but `(context, shape) => void` also works. The critical call is `context.fillStrokeShape(shape)` — without it, Konva doesn't register the hit area.

### Pattern 6: Visible Node Type Filter

**What:** Before rendering, filter nodes to only those visible to students.

```typescript
// Visible node types — all others are navigation infrastructure
const VISIBLE_NODE_TYPES: NavNodeType[] = [
  'room',
  'entrance',
  'elevator',
  'restroom',
  'landmark',
]

// Hidden types (present in graph data for pathfinding, never rendered):
// 'stairs', 'ramp', 'junction', 'hallway'

// In LandmarkLayer:
const visibleNodes = graphData.nodes.filter(n =>
  VISIBLE_NODE_TYPES.includes(n.type)
)
```

**Key observation — two conflicts with `types.ts` comments:**
1. **`stairs`**: Current comment says "visible on map but not searchable." CONTEXT.md says stairs must be completely invisible. **CONTEXT.md is authoritative.** The comment must be updated.
2. **`ramp`**: Current comment lists ramp under "Visible to students." CONTEXT.md says "Navigation nodes (ramps, stairs, hallway junctions) must be completely invisible." **CONTEXT.md is authoritative.** Ramp must be excluded from visible types and the comment updated.

**Action needed:** Update `NavNodeType` doc comments in `src/shared/types.ts` to reflect the correct visibility:
- **Visible:** `room`, `entrance`, `elevator`, `restroom`, `landmark`
- **Hidden:** `stairs`, `ramp`, `junction`, `hallway`

### Pattern 7: Stage Scale Sync via Callback

**What:** The viewport uses direct Konva mutations (`useMapViewport.ts`), so React has no awareness of the current stage scale. Markers need the scale for counter-scaling.

**Recommended approach:** Add an `onScaleChange?: (scale: number) => void` callback parameter to `useMapViewport`. Call it after each scale mutation:
- In `handleWheel` (after `stage.scale()` — line 93)
- In `handleTouchMove` (after `stage.scaleX()` — line 151)
- In `zoomByButton` (after Tween completes — `onFinish` callback)
- In `fitToScreen` (after reset — scale is 1)

```typescript
// In useMapViewport.ts — add to handleWheel after stage.scale():
onScaleChange?.(newScale)

// In FloorPlanCanvas.tsx:
const [stageScale, setStageScale] = useState(1)

const { handleWheel, ... } = useMapViewport({
  stageRef,
  imageRect,
  onScaleChange: setStageScale,
})

// Pass stageScale to LandmarkLayer:
<LandmarkLayer stageScale={stageScale} ... />
```

This is cleaner than ref-based polling because scale changes are discrete events (wheel, pinch end, button click), not continuous mutations.

### Anti-Patterns to Avoid

- **Putting bottom sheet state inside Konva:** The sheet is HTML. Its state (`selectedNode`) must live in React, not in Konva node attributes or refs.
- **Using `modal={true}` (default) for Vaul when map interaction is needed:** The default Vaul overlay blocks the canvas while the sheet is open. Always use `modal={false}`.
- **Omitting `Drawer.Title` / `Drawer.Description`:** Vaul is built on `@radix-ui/react-dialog`. Without these components, the dialog has no accessible name, which triggers accessibility warnings and degrades screen reader experience.
- **Positioning markers with absolute stage coordinates:** Always use `imageRect` to convert from normalized coordinates. Never hard-code pixel offsets — the image position changes on viewport resize.
- **Rendering all graph nodes including navigation nodes:** Always filter before rendering. Never pass the raw `NavGraph.nodes` array directly to the marker layer.
- **Re-creating `useGraphData` fetch on every render:** Use `useEffect` with empty deps `[]` to fetch once on mount. Cache the result in state. Use a cleanup `cancelled` flag to prevent state updates after unmount.
- **Using React `setState` for zoom-level reads:** The stage scale lives in a Konva ref (direct mutation pattern from Phase 2). Reading it requires `stageRef.current?.scaleX()` — not React state. For counter-scaling, propagate scale via the callback pattern in Pattern 7.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet with drag physics | CSS transitions + mouse/touch event tracking | Vaul | Scroll locking, overscroll, velocity snap, focus trap, accessibility (ARIA dialog via Radix), cross-browser touch events. Vaul handles keyboard repositioning on mobile (`repositionInputs`). |
| Snap-to-height behavior | Manual height state + transition | Vaul `snapPoints` | Velocity-based snapping requires tracking drag velocity. Vaul's `useSnapPoints` hook handles this internally. |
| Hit area expansion | Custom invisible Rect overlay | Konva `hitFunc` | `hitFunc` is the official Konva pattern for custom hit regions. Overlay approach breaks Group click delegation. |
| Coordinate conversion utilities | Custom pixel math | Simple formula + imageRect | Formula is trivial but must use the exact same `imageRect` as `FloorPlanImage` uses (`FloorPlanImage.tsx:29-41`) — not a separate calculation. |

**Key insight:** The hard parts of this phase (drag physics, scroll lock, focus trap, accessibility) are all solved by Vaul. The Konva marker rendering is straightforward declarative shapes. Don't invest effort in the wrong place.

---

## Common Pitfalls

### Pitfall 1: Bottom Sheet Overlaps Canvas / Blocks Interaction

**What goes wrong:** With `modal={true}` (Vaul default), a semi-transparent overlay covers the canvas when the sheet is open. Students can't pan or zoom while reviewing a location.

**Why it happens:** Vaul defaults to modal behavior (inherited from `@radix-ui/react-dialog`). Verified in source: `Overlay` component returns `null` only when `!modal`.

**How to avoid:** Always set `modal={false}` on `Drawer.Root`. With `modal={false}`:
1. `Overlay` returns `null` — no backdrop rendered
2. `onPointerDownOutside` calls `e.preventDefault()` — click outside does NOT auto-close
3. `onFocusOutside` calls `e.preventDefault()` — focus leaving drawer doesn't auto-close

Therefore "tap outside to dismiss" must be implemented manually via the Stage `onClick` handler (Pattern 4).

**Warning signs:** Canvas is unresponsive while sheet is peeked; grey overlay visible behind the sheet.

### Pitfall 2: Markers Scale with Zoom (Become Huge at High Zoom)

**What goes wrong:** If markers are placed inside the zoomed Konva Stage without counter-scaling, a `radius=8` circle at `scale=4x` appears as a 32px circle on screen. At max zoom (4×, defined in `useMapViewport.ts:11`), markers overwhelm the floor plan.

**Why it happens:** All children of the Stage transform with its scale.

**How to avoid:** Apply counter-scaling to each marker's `Group`: `scaleX={1 / stageScale}` and `scaleY={1 / stageScale}`. This keeps screen-pixel size constant.

**Warning signs:** Markers are tiny at initial zoom and enormous when zoomed in. Or vice versa.

### Pitfall 3: stageScale Out of Sync with Direct Konva Mutations

**What goes wrong:** `useMapViewport.ts` mutates stage scale directly (`stage.scale({ x: newScale, y: newScale })` at line 93, `stage.scaleX(newScale)` at line 151) without React setState. If `LandmarkLayer` needs the current scale for counter-scaling, React state was never updated.

**Why it happens:** The architectural decision from Phase 2 was to bypass React setState for all viewport mutations for 60fps performance.

**How to avoid:** **Event-driven sync (recommended):** Add an `onScaleChange` callback to `useMapViewport` (Pattern 7). Call it after each scale mutation point:
- `handleWheel`: after `stage.scale()` (line 93) — synchronous, call immediately
- `handleTouchMove`: after `stage.scaleX()` (line 151) — synchronous, call immediately
- `zoomByButton`: after Tween — use Konva.Tween `onFinish` callback (line 269)
- `fitToScreen`: after reset — scale is always 1 (lines 311/312)

This is clean because scale changes are discrete events, not continuous mutations. The marker re-render cost is negligible (15–30 Groups).

**Warning signs:** Counter-scaling is stale — markers appear at the wrong size after zooming, but correct after forcing a re-render.

### Pitfall 4: Normalized Coordinates Not Accounting for imageRect Offset

**What goes wrong:** A node at normalized `(0.5, 0.5)` is placed at pixel `(viewportWidth/2, viewportHeight/2)` instead of the center of the floor plan image.

**Why it happens:** Normalized coordinates are relative to the floor plan image, not the viewport. The image is centered with 40px padding inside the viewport (`FloorPlanImage.tsx:31`).

**How to avoid:** Always use the `imageRect` from `FloorPlanImage`:
```typescript
x = imageRect.x + normalizedX * imageRect.width
y = imageRect.y + normalizedY * imageRect.height
```
Never compute `normalizedX * viewportWidth`.

**Warning signs:** Markers appear offset from their intended positions on the floor plan, or cluster near the top-left corner.

### Pitfall 5: NavNodeData Missing Fields for Bottom Sheet

**What goes wrong:** The bottom sheet needs `roomNumber`, `description`, `buildingName`, `accessibilityNotes` — but `NavNodeData` in `shared/types.ts:56-69` only has `x`, `y`, `label`, `type`, `searchable`, `floor`.

**Why it happens:** The current `NavNodeData` was designed for routing in Phase 3. Landmark display details weren't added yet.

**How to avoid:** Extend `NavNodeData` with optional display fields before building the bottom sheet:
```typescript
export interface NavNodeData {
  // ... existing fields ...
  roomNumber?: string
  description?: string
  buildingName?: string
  accessibilityNotes?: string
}
```
All optional — navigation-only nodes don't need them. `NavNode` (extends `NavNodeData`) inherits them automatically.

**Impact on Phase 3 fixtures:** The existing `test-graph.json` (`src/shared/__tests__/fixtures/test-graph.json`) doesn't include these fields. Since they're optional, TypeScript won't error — no fixture changes needed.

**Warning signs:** TypeScript errors when accessing `node.roomNumber` in the sheet component.

### Pitfall 6: Vaul `snapPoints` Array Format

**What goes wrong:** Snap points are passed as pixel values instead of viewport-height fractions, or `activeSnapPoint` is treated as `boolean`.

**Why it happens:** The Vaul API docs show `activeSnapPoint` type as `boolean` — this is **incorrect**. Verified from source code (`src/index.tsx`): `activeSnapPoint` type is actually `number | string | null`. The docs appear to have a bug.

**How to avoid:**
- `snapPoints` values between 0 and 1 are fractions of viewport height. Values > 1 are pixel heights. Use fractions for responsive behavior: `[0.15, 0.9]`.
- `activeSnapPoint` is the actual snap point value (e.g., `0.15` or `0.9`), NOT a boolean.
- `setActiveSnapPoint` callback receives `(snapPoint: number | string | null) => void`.

**Warning signs:** Sheet snaps to wrong heights; peek is too small or too large on different devices.

### Pitfall 7: Stage `onClick` Conflicts with Marker Clicks

**What goes wrong:** Adding `onClick` to the Stage to dismiss the sheet fires even when clicking a marker, immediately re-dismissing after the marker opens the sheet.

**Why it happens:** Konva's event system bubbles clicks from shapes up to the Stage.

**How to avoid:** Check `e.target === e.target.getStage()` in the Stage click handler — only dismiss if the user clicked the bare stage background (not a shape). Verified from Context7 `/konvajs/react-konva` — this is the official pattern (used in the Transformer selection demo).

```tsx
<Stage onClick={(e) => {
  if (e.target === e.target.getStage()) setSelectedNode(null)
}}>
```

**Warning signs:** Sheet flickers open then immediately closes when tapping a marker.

### Pitfall 8: `ramp` and `stairs` Visibility Classification Conflict

**What goes wrong:** The current `types.ts` comments list `ramp` as "Visible to students" and `stairs` as partially visible. But CONTEXT.md says both must be completely invisible.

**Why it happens:** The `types.ts` comments were written before the discussion phase locked decisions about visibility.

**How to avoid:** Update `types.ts` doc comments to match the CONTEXT.md-authoritative classification. The `VISIBLE_NODE_TYPES` constant must exclude both `ramp` and `stairs`.

**Warning signs:** Ramp and/or stair markers appear on the student-facing map.

---

## Code Examples

Verified patterns from official sources:

### Normalized → Pixel Coordinate Conversion

```typescript
// Source: Derived from FloorPlanImage.tsx:29-41 imageRect calculation
// imageRect is in stage-local coordinates (scale=1). Markers placed here
// transform with the stage automatically.

function nodeToPixel(
  node: Pick<NavNode, 'x' | 'y'>,
  imageRect: { x: number; y: number; width: number; height: number }
): { x: number; y: number } {
  return {
    x: imageRect.x + node.x * imageRect.width,
    y: imageRect.y + node.y * imageRect.height,
  }
}
```

### LandmarkMarker Component (react-konva)

```tsx
// Source: Context7 /konvajs/react-konva — Group, Circle, Text patterns
// Source: Context7 /konvajs/site — hitFunc custom hit region
import { Group, Circle, Text } from 'react-konva'
import type { NavNode } from '@shared/types'

interface LandmarkMarkerProps {
  node: NavNode
  pixelX: number
  pixelY: number
  stageScale: number
  isSelected: boolean
  showLabel: boolean
  onClick: () => void
}

const SCREEN_RADIUS = 8   // Visual radius in screen pixels (constant at all zoom)
const TYPE_COLORS: Record<string, string> = {
  room:      '#3b82f6',   // blue
  entrance:  '#22c55e',   // green
  elevator:  '#a855f7',   // purple
  restroom:  '#f59e0b',   // amber
  landmark:  '#ef4444',   // red
}

export function LandmarkMarker({
  node, pixelX, pixelY, stageScale, isSelected, showLabel, onClick
}: LandmarkMarkerProps) {
  const scale = 1 / stageScale       // Counter-scale to maintain screen size
  const fill = TYPE_COLORS[node.type] ?? '#64748b'

  return (
    <Group
      x={pixelX}
      y={pixelY}
      scaleX={scale}
      scaleY={scale}
      onClick={onClick}
      onTap={onClick}
    >
      <Circle
        radius={isSelected ? SCREEN_RADIUS * 1.4 : SCREEN_RADIUS}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={2}
        hitFunc={(context, shape) => {
          context.beginPath()
          context.arc(0, 0, SCREEN_RADIUS * 2.5, 0, Math.PI * 2, true)
          context.closePath()
          context.fillStrokeShape(shape)
        }}
      />
      {(isSelected || showLabel) && (
        <Text
          text={node.label}
          fontSize={12}
          fill="#1e293b"
          y={SCREEN_RADIUS + 4}
          align="center"
          offsetX={/* computed from text width */0}
        />
      )}
    </Group>
  )
}
```

### Vaul Bottom Sheet Setup

```tsx
// Source: vaul.emilkowal.ski/api + GitHub source (verified v1.1.2)
import { Drawer } from 'vaul'
import type { NavNode } from '@shared/types'

interface LandmarkSheetProps {
  node: NavNode | null
  onClose: () => void
}

export function LandmarkSheet({ node, onClose }: LandmarkSheetProps) {
  return (
    <Drawer.Root
      open={node !== null}
      onOpenChange={(open) => { if (!open) onClose() }}
      snapPoints={[0.15, 0.9]}
      modal={false}
    >
      <Drawer.Portal>
        <Drawer.Content className="fixed inset-x-0 bottom-0 rounded-t-2xl bg-white shadow-2xl outline-none focus:outline-none">
          <Drawer.Handle />
          <div className="px-5 pb-2 pt-3">
            <Drawer.Title className="text-lg font-semibold text-gray-900">
              {node?.label}
            </Drawer.Title>
            <Drawer.Description className="text-sm font-medium text-gray-500 capitalize">
              {node?.type}
            </Drawer.Description>
          </div>
          <div className="overflow-y-auto px-5 pb-10">
            {node?.roomNumber && (
              <div className="py-1 text-sm text-gray-700">Room: {node.roomNumber}</div>
            )}
            {node?.buildingName && (
              <div className="py-1 text-sm text-gray-700">Building: {node.buildingName}</div>
            )}
            {node?.floor && (
              <div className="py-1 text-sm text-gray-700">Floor: {node.floor}</div>
            )}
            {node?.description && (
              <p className="py-2 text-sm text-gray-600">{node.description}</p>
            )}
            {node?.accessibilityNotes && (
              <div className="py-2 text-sm text-green-700">
                Accessibility: {node.accessibilityNotes}
              </div>
            )}
          </div>
          <Drawer.Close asChild>
            <button className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-gray-100" onClick={onClose}>
              ×
            </button>
          </Drawer.Close>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
```

### GET /api/map Hono Route

```typescript
// Source: Existing src/server/index.ts pattern (lines 18-48)
// Follows identical pattern to /api/floor-plan/image and /api/floor-plan/thumbnail
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

app.get('/api/map', async (c) => {
  try {
    const filePath = resolve(__dirname, 'assets/campus-graph.json')
    const raw = await readFile(filePath, 'utf-8')
    const graph = JSON.parse(raw)
    c.header('Content-Type', 'application/json')
    c.header('Cache-Control', 'public, max-age=60')
    return c.json(graph)
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENOENT') return c.json({ error: 'Graph data not found' }, 404)
    return c.json({ error: 'Failed to load graph data' }, 500)
  }
})
```

### useGraphData Hook

```typescript
// Client-side fetch hook — mirrors existing useFloorPlanImage pattern
import { useEffect, useState } from 'react'
import type { NavGraph } from '@shared/types'

type GraphState =
  | { status: 'loading' }
  | { status: 'loaded'; data: NavGraph }
  | { status: 'error'; message: string }

export function useGraphData(): GraphState {
  const [state, setState] = useState<GraphState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetch('/api/map')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<NavGraph>
      })
      .then(data => {
        if (!cancelled) setState({ status: 'loaded', data })
      })
      .catch(err => {
        if (!cancelled) setState({ status: 'error', message: String(err) })
      })
    return () => { cancelled = true }
  }, [])

  return state
}
```

**Note:** The Vite dev server proxy (`vite.config.ts:17-19`) already forwards `/api` requests to `http://localhost:3001`, so `fetch('/api/map')` works in development without CORS configuration.

---

## NavNodeData Extension Required

The current `NavNodeData` (`src/shared/types.ts:56-69`) covers routing fields only. The bottom sheet requires additional optional display fields:

```typescript
export interface NavNodeData {
  // ... existing fields (x, y, label, type, searchable, floor) ...

  /** Room/office number identifier (e.g. "204", "A-102") */
  roomNumber?: string
  /** Human-readable description shown in location detail sheet */
  description?: string
  /** Building name for multi-building campuses */
  buildingName?: string
  /** Accessibility information shown in detail sheet (e.g. "Automatic door", "Step-free access") */
  accessibilityNotes?: string
}
```

**Impact:**
- `NavNode` (extends `NavNodeData`) inherits these fields automatically.
- Phase 3 test fixture (`src/shared/__tests__/fixtures/test-graph.json`) doesn't include these fields. Since they're all optional, TypeScript won't error — no Phase 3 fixture changes needed.
- The new `campus-graph.json` fixture must include these fields on visible landmark nodes. Navigation-only nodes can omit them.
- The `NavGraph.metadata.buildingName` field already exists (`types.ts:148`). Individual node `buildingName` is useful for multi-building campuses but could fall back to `metadata.buildingName` for single-building use.

---

## NavNodeType Comment Update Required

The `types.ts` doc comments (`src/shared/types.ts:24-39`) have two inaccuracies per the CONTEXT.md decisions:

**Current (incorrect):**
```
Visible to students: room, entrance, elevator, ramp, restroom, landmark
Invisible: stairs (partial), junction, hallway
```

**Correct (per CONTEXT.md):**
```
Visible to students: room, entrance, elevator, restroom, landmark
Invisible: stairs, ramp, junction, hallway
```

Both `ramp` and `stairs` must move to the "Invisible to students" group. This is a comment-only change — no runtime behavior is affected since the `NavNodeType` union itself doesn't change.

---

## Discretion Recommendations

### Marker Color Scheme by Type

Recommended palette (distinguishable, accessible, map-like):

| Type | Color | Hex | Tailwind Equiv | Rationale |
|------|-------|-----|----------------|-----------|
| `room` | Blue | `#3b82f6` | blue-500 | Neutral, most common type |
| `entrance` | Green | `#22c55e` | green-500 | Entry = go/green |
| `elevator` | Purple | `#a855f7` | purple-500 | Accessibility-associated |
| `restroom` | Amber | `#f59e0b` | amber-500 | Utility/service |
| `landmark` | Red | `#ef4444` | red-500 | Notable destination |
| `ramp` | (hidden) | — | — | Not rendered |
| `stairs` | (hidden) | — | — | Not rendered |
| `junction` | (hidden) | — | — | Not rendered |
| `hallway` | (hidden) | — | — | Not rendered |

All colors are from Tailwind's 500 shade — good contrast against white stroke and light/dark backgrounds.

### Selected Marker Treatment

**Recommendation:** When selected, enlarge the circle by 1.4× and persistently show the label (Text below circle). Add a subtle stroke color change (e.g., blue ring instead of white). This provides clear feedback without visual noise.

### Marker Scaling: Counter-Scale (Fixed Screen Size)

**Recommendation:** Counter-scale markers so they maintain a constant ~16px diameter (8px radius) at all zoom levels.

**Rationale:** At 4× zoom (max in `useMapViewport.ts:11`), an 8px marker becomes 32px — it overlaps labels and obscures the floor plan. At 0.3× zoom (min), it becomes 2.4px — invisible. Counter-scaling is ~3 lines of code with Konva Group scale.

### Label Visibility: Show on Hover + Selected, Auto-Show at High Zoom

**Recommendation:** Labels are hidden by default. Show on:
1. `onMouseEnter` (desktop hover) — hide on `onMouseLeave`
2. `isSelected === true` (tap on mobile or desktop)
3. Auto-show at `stageScale >= 2.0` (2× zoom threshold) — at this zoom level there's sufficient room for labels without overlap

The `showLabel` prop on `LandmarkMarker` is controlled by `LandmarkLayer` which tracks hover state per-marker and the auto-show threshold.

### Clustering: No Clustering for 15–30 Landmarks

**Recommendation:** Skip clustering entirely. With 15–30 landmarks, even at minimum zoom (0.3×) the markers don't meaningfully overlap. Clustering adds significant complexity (cluster management, animated expand/collapse) for no visible benefit at this data size.

### Tap Target: 2.5× Hit Radius via hitFunc

**Recommendation:** Use `hitFunc` to expand hit detection to 2.5× the visual radius (40px diameter hit area for 16px visual circle). This meets Apple HIG guidelines (~44pt minimum touch target) and is the official Konva approach for custom hit regions.

### Loading State

**Recommendation:** While `useGraphData` returns `{ status: 'loading' }`, show no markers (render null from `LandmarkLayer`). Do NOT block the floor plan — the image can be panned/zoomed while graph data loads. Optionally show a small loading indicator near the zoom controls. For errors, show a subtle error message — don't crash the canvas.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom bottom sheet with `touchstart`/`touchmove` | Vaul library (built on Radix Dialog) | 2023+ (Vaul v1.0) | Vaul handles scroll locking, overscroll, velocity snap, ARIA, keyboard repositioning |
| Konva stage-based overlays for info panels | HTML overlay outside Stage | Konva best practice | Canvas text is not accessible, not searchable, harder to style |
| Icon-based map markers | Filled circle markers | Design preference | Circles render faster, scale better, and look cleaner than SVG icons on canvas |

**Deprecated/outdated:**
- `react-spring-bottom-sheet` — superseded by Vaul. No snap points in the same ergonomic API.

---

## Open Questions

1. **`activeSnapPoint` controlled vs uncontrolled in Vaul**
   - What we know: Vaul's `snapPoints` works with both controlled (`activeSnapPoint` + `setActiveSnapPoint`) and uncontrolled modes. The source code shows `activeSnapPoint` type is `number | string | null` (NOT `boolean` as the API docs page claims).
   - What's unclear: Whether uncontrolled mode correctly defaults to the first snap point (peek) when the drawer opens, or if it opens to the last snap point.
   - Recommendation: Use controlled mode for predictability. Track `activeSnapPoint` in React state, reset to `snapPoints[0]` (0.15) when `selectedNode` changes. This guarantees the drawer always opens in peek mode.

2. **`Drawer.Handle` double-tap cycling behavior**
   - What we know: From source code, `Drawer.Handle` has built-in double-tap cycling between snap points (`handleStartCycle` → `handleCycleSnapPoints`). It also has a `preventCycle` prop to disable this.
   - What's unclear: Whether this built-in cycling creates an unexpected UX when combined with our controlled snap point state.
   - Recommendation: Test and keep the default cycling behavior — it's a nice UX feature. If it conflicts, use `preventCycle={true}`.

---

## Sources

### Primary (HIGH confidence)
- Context7 `/konvajs/site` — Circle, Group, Text, hitFunc (custom hit region), hitStrokeWidth, event handling (click, tap, mouseenter/mouseleave)
- Context7 `/konvajs/react-konva` — Group, Circle, Text declarative API, onClick/onTap/onMouseEnter/onMouseLeave props, selection/deselection pattern (e.target === e.target.getStage())
- Context7 `/websites/vaul_emilkowal_ski` — Vaul snap points API, Root props, dismissible, modal, Portal/Content anatomy, controlled drawer pattern
- GitHub `emilkowalski/vaul` source code (`src/index.tsx`) — `activeSnapPoint` true type (`number | string | null`), `Overlay` returns `null` when `!modal`, `onPointerDownOutside` prevents auto-close with `!modal`, `closeDrawer()` resets to `snapPoints[0]`, `Handle` double-tap cycling
- `src/client/components/FloorPlanImage.tsx:29-41` — imageRect coordinate system, normalized→pixel conversion derivation
- `src/client/components/FloorPlanCanvas.tsx:22-27` — imageRect state, existing Stage structure
- `src/client/hooks/useMapViewport.ts:63-100` — Direct Konva mutation pattern; confirmed no React state for scale; scale mutation points at lines 93, 151
- `src/shared/types.ts:40-69` — NavNodeType enum, NavNodeData fields, NavGraph shape
- `src/server/index.ts:18-48` — Existing Hono route pattern (readFile + resolve)
- `vite.config.ts:17-19` — Proxy configuration `/api` → localhost:3001
- npm registry — Vaul v1.1.2 confirmed current

### Secondary (MEDIUM confidence)
- vaul.emilkowal.ski/api — Official API page (note: `activeSnapPoint` type is listed as `boolean` which is incorrect per source code)
- vaul.emilkowal.ski/snap-points — Snap points examples page

### Tertiary (LOW confidence)
- None — all critical findings verified via Context7 or official source code

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Vaul verified via source code + npm. All Konva APIs verified via Context7. All existing codebase patterns directly inspected.
- Architecture: HIGH — Coordinate system derived from `FloorPlanImage.tsx`. Cross-layer communication via React state is established pattern. Scale sync approach derived from direct analysis of `useMapViewport.ts` mutation points.
- Pitfalls: HIGH — Modal conflict verified from Vaul source. Counter-scale, stageScale sync, coordinate offset, and type visibility conflicts all derived from direct code analysis. Stage click bubbling pattern verified from Context7 react-konva docs.
- Discretion recommendations: MEDIUM — Color palette and thresholds are design judgments, not verified facts.

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (Vaul moves slowly; 30 days safe)
