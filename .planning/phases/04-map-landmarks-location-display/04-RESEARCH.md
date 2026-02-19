# Phase 4: Map Landmarks & Location Display - Research

**Researched:** 2026-02-19
**Domain:** Konva canvas markers + React bottom sheet (Vaul) + Hono static JSON endpoint
**Confidence:** HIGH

## Summary

Phase 4 layers two distinct UI concerns onto the existing Konva canvas: (1) interactive landmark markers on the floor plan layer, and (2) an HTML bottom sheet that slides up when a marker is tapped. These concerns live in different coordinate systems — markers live inside Konva's transform space, the bottom sheet lives as an HTML overlay outside it — which is the central architectural fact of this phase.

The marker rendering pattern is well-established: a react-konva `Group` containing a `Circle` + `Text` per landmark node, positioned using normalized→pixel coordinate conversion from the existing `imageRect`. The existing codebase already threads `imageRect` from `FloorPlanImage` up through `FloorPlanCanvas`, so the conversion formula is ready to use. Visibility filtering (hide junction/hallway/stairs/ramp nodes) is a pure `Array.filter()` on node type before rendering — no Konva-specific logic needed.

The bottom sheet should use **Vaul** (v1.1.2, by Emil Kowalski). Vaul is the de-facto standard for Google Maps-style peek-then-expand drawer behavior in React. It handles all three dismissal methods (tap outside, swipe down, close button), supports snap points (peek → full height), and is unstyled — Tailwind CSS applies directly. The `modal={false}` prop lets users continue interacting with the map while the sheet is peeked open.

**Primary recommendation:** Use Vaul with `snapPoints={[0.15, 0.9]}` + `modal={false}` for the bottom sheet. Use react-konva `Group` + `Circle` + `Text` with counter-scaling for fixed-screen-size markers. Serve graph data from a new `GET /api/map` endpoint on the Hono server using a static JSON fixture file in `src/server/assets/`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Marker appearance:** Filled circles with text label — clean, map-like style
- **Label visibility:** Labels appear on hover (desktop) or tap (mobile) only — NOT always visible
- **Type distinction:** Different landmark types (classroom, office, restroom, etc.) must be visually distinguishable
- **Bottom sheet style:** Google Maps style — slides up from bottom, starts as small peek showing name + type; user drags up to see full details
- **Bottom sheet full content:** name, room number, type, description, floor, building, accessibility notes
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
| MAP-03 | User can see visible landmarks/nodes on the map for classrooms, rooms, offices, and other points of interest | react-konva `Group`/`Circle`/`Text` rendered in a dedicated `Layer` above the floor plan image. Visibility filter: nodes where `type` is NOT in `['junction', 'hallway', 'stairs', 'ramp']`. NavNodeType enum already defined in `src/shared/types.ts`. |
| MAP-04 | Map hides navigation-only nodes (ramps, staircases, hallway junctions) from the student view | Filter applied before rendering: `nodes.filter(n => VISIBLE_TYPES.includes(n.type))`. Hidden types: `junction`, `hallway`, `stairs`, `ramp`. The nodes still exist in the graph data (for pathfinding in Phase 6) — they are simply never rendered. |
| ROUT-07 | User can tap a location to see its details (name, room number, type, description) | Tap handler on each marker `Group` sets `selectedNode` state; Vaul drawer renders outside Konva stage as an HTML overlay with `open={selectedNode !== null}`. Full detail: name, room number, type, description, floor, building, accessibility notes from `NavNodeData`. |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-konva | 19.2.2 | Render markers as declarative canvas shapes | Already installed. `Group`, `Circle`, `Text` components are the standard approach for map markers in Konva. |
| konva | 10.2.0 | Hit detection, counter-scale, stage coordinate access | Already installed. `hitFunc` / `hitStrokeWidth` enlarges tap targets. `getAbsoluteScale()` enables counter-scaling. |
| vaul | 1.1.2 | Bottom sheet drawer with snap points | De-facto React drawer standard. 8.2k GitHub stars. Built-in snap points, all dismissal methods, `modal={false}` for map interaction. Unstyled — Tailwind applies directly. |
| tailwindcss | 4.1.18 | Styling the bottom sheet content | Already installed. Applies to HTML overlay outside Konva space. |
| hono | 4.11.9 | Serve `GET /api/map` static JSON | Already installed. Add one route to existing `src/server/index.ts`. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | No additional libraries needed | All needs covered by existing stack + Vaul. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vaul | react-spring + hand-rolled sheet | Vaul handles all edge cases (overscroll, scroll locking, focus trapping, accessibility). Hand-rolling would take ~4× longer and miss edge cases. |
| Vaul | @radix-ui/react-dialog | Dialog doesn't support drag-to-dismiss or snap points. Not Google Maps style. |
| Vaul | CSS-only slide-up div | No drag physics, no snap points, no accessibility. Not appropriate. |
| react-konva Group + Circle | Konva.Circle direct mutation | React-Konva declarative API is cleaner and consistent with existing codebase pattern. Direct mutation used only for viewport (existing pattern) — markers are data-driven, so React state is appropriate. |

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
│   │   ├── FloorPlanCanvas.tsx     # Add: landmark layer, selectedNode state
│   │   ├── LandmarkLayer.tsx       # NEW: renders all visible marker Groups
│   │   ├── LandmarkMarker.tsx      # NEW: single Circle+Text Group
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
    └── types.ts                    # Existing: NavNodeData, NavNode, NavGraph
```

### Pattern 1: Normalized→Pixel Coordinate Conversion

**What:** Convert a node's normalized (0–1) coordinates to pixel positions within the rendered image rect.

**When to use:** In `LandmarkLayer` or `LandmarkMarker` when computing the `x`/`y` of each Konva `Group`.

**Critical note:** The `imageRect` from `FloorPlanImage` is in **stage-local coordinates** (i.e., at `scale=1`, before the Stage transform is applied). This is exactly the coordinate space where markers should be positioned — they transform with the stage automatically.

```typescript
// Source: FloorPlanImage.tsx imageRect calculation + Konva coordinate system
function normalizedToPixel(
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

**When to use:** For the marker circle and text — the decision area says "marker scaling behavior is Claude's discretion." This is the recommended approach (see Discretion Recommendations section).

```typescript
// Source: Konva.Node.getAbsoluteScale() — verified in Context7 /konvajs/site
// Used inside LandmarkMarker to read current zoom level
import { useRef, useEffect } from 'react'
import type Konva from 'konva'

// In a Group ref callback or useEffect:
const groupRef = useRef<Konva.Group>(null)

// The marker's visual radius in screen pixels (constant)
const SCREEN_RADIUS = 8

// Konva renders the Group at its logical position (which scales with stage).
// To make the circle appear at constant screen size, scale the Group down
// by the reciprocal of the stage scale:
//   group.scaleX = 1 / stageScale
//   group.scaleY = 1 / stageScale

// Pass stageScale as a prop from FloorPlanCanvas (stageRef.current?.scaleX())
// and apply via Group's scale prop in react-konva.
```

**Important:** Counter-scaling requires the stage scale to be passed down as a React prop or via context. Since the viewport uses direct Konva mutation (not React state), a `useEffect` listener on `dragend`/`wheel` events or a periodic ref read is needed. See Pitfall 3 below for the correct approach.

### Pattern 3: Vaul Bottom Sheet with Snap Points

**What:** Google Maps-style bottom sheet that peeks at ~15% viewport height, expandable to ~90%.

```tsx
// Source: https://vaul.emilkowal.ski/api (vaul v1.1.2)
import { Drawer } from 'vaul'

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
      activeSnapPoint={0.15}       // starts peeked
      modal={false}                // map remains interactive when peeked
      dismissible={true}           // tap outside closes
    >
      <Drawer.Portal>
        {/* No overlay when modal=false — map stays interactive */}
        <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-xl outline-none">
          <Drawer.Handle />
          {/* Peek content: name + type */}
          <div className="px-4 py-3">
            <h2 className="text-lg font-semibold">{node?.label}</h2>
            <p className="text-sm text-gray-500">{node?.type}</p>
          </div>
          {/* Full content: all detail fields */}
          {/* ... */}
          <Drawer.Close asChild>
            <button>×</button>
          </Drawer.Close>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
```

**Key props:**
- `modal={false}` — essential for map interactivity while sheet is peeked. Without this, a backdrop blocks the canvas.
- `snapPoints={[0.15, 0.9]}` — values are fractions of viewport height (15% peek, 90% full)
- `dismissible={true}` (default) — swipe down closes; tap outside closes when `modal={true}`
- When `modal={false}`, "tap outside" does NOT auto-close. Use stage's `onClick` on background to call `onClose()`.

### Pattern 4: Marker Click → Bottom Sheet Trigger (Cross-System Communication)

**What:** Konva click event on a canvas marker must open an HTML drawer component. The bridge is React state (`selectedNode`) in the shared parent `FloorPlanCanvas`.

```tsx
// FloorPlanCanvas.tsx — add selectedNode state
const [selectedNode, setSelectedNode] = useState<NavNode | null>(null)

// In LandmarkLayer (inside Stage):
<LandmarkMarker
  node={node}
  onClick={() => setSelectedNode(node)}
/>

// Outside Stage (HTML overlay):
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

### Pattern 5: Tap Target Enlargement with hitFunc

**What:** On mobile, an 8px visual circle is too small to tap reliably. Konva's `hitFunc` overrides the hit detection area with a larger circle.

```typescript
// Source: Context7 /konvajs/site — Custom Hit Region docs
// Apply to the Circle shape inside LandmarkMarker:
<Circle
  radius={SCREEN_RADIUS}
  fill={color}
  hitFunc={(context, shape) => {
    context.beginPath()
    context.arc(0, 0, SCREEN_RADIUS * 2.5, 0, Math.PI * 2, true) // 2.5× hit radius
    context.closePath()
    context.fillStrokeShape(shape)
  }}
/>
```

**Alternative:** `hitStrokeWidth` works for stroked shapes (lines). For filled circles, `hitFunc` is cleaner.

### Pattern 6: Visible Node Type Filter

**What:** Before rendering, filter nodes to only those visible to students.

```typescript
// src/shared/types.ts defines NavNodeType — use this constant:
const VISIBLE_NODE_TYPES: NavNodeType[] = [
  'room',
  'entrance',
  'elevator',
  'restroom',
  'landmark',
  // Note: 'ramp', 'stairs', 'junction', 'hallway' are EXCLUDED
]

// In LandmarkLayer:
const visibleNodes = graphData.nodes.filter(n =>
  VISIBLE_NODE_TYPES.includes(n.type)
)
```

**Key observation from types.ts:** The existing comment says "stairs — navigation waypoint, visible on map but not searchable." However, the CONTEXT.md decisions say stairs must be completely invisible. The CONTEXT.md is the authoritative source — `stairs` should be excluded from visible rendering.

### Anti-Patterns to Avoid

- **Putting bottom sheet state inside Konva:** The sheet is HTML. Its state (`selectedNode`) must live in React, not in Konva node attributes or refs.
- **Using `modal={true}` (default) for Vaul when map interaction is needed:** The default Vaul overlay will block the canvas while the sheet is open. Use `modal={false}` so students can still pan/zoom while reviewing a peeked location.
- **Positioning markers with absolute stage coordinates:** Always use `imageRect` to convert from normalized coordinates. Never hard-code pixel offsets — the image position changes on viewport resize.
- **Rendering all graph nodes including navigation nodes:** Always filter before rendering. Never pass the raw `NavGraph.nodes` array directly to the marker layer.
- **Re-creating `useGraphData` fetch on every render:** Use `useEffect` with empty deps `[]` to fetch once on mount. Cache the result in state.
- **Using React `setState` for zoom-level reads:** The stage scale lives in a Konva ref (direct mutation pattern from Phase 2). Reading it requires `stageRef.current?.scaleX()` — not React state. For counter-scaling, pass scale as a prop updated via a stage event listener.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet with drag physics | CSS transitions + mouse/touch event tracking | Vaul | Scroll locking, overscroll, velocity snap, focus trap, accessibility (ARIA dialog), cross-browser touch events are all edge-case-heavy |
| Snap-to-height behavior | Manual height state + transition | Vaul `snapPoints` | Velocity-based snapping requires tracking drag velocity — complex math, tested in Vaul |
| Hit area expansion | Custom invisible Rect overlay | Konva `hitFunc` | hitFunc is the official Konva pattern for custom hit regions. Overlay approach breaks Group click delegation |
| Coordinate conversion utilities | Custom pixel math | Simple formula + imageRect | Formula is trivial but must use the exact same `imageRect` as FloorPlanImage uses — not a separate calculation |

**Key insight:** The hard parts of this phase (drag physics, scroll lock, focus trap, accessibility) are all solved by Vaul. The Konva marker rendering is straightforward declarative shapes. Don't invest effort in the wrong place.

---

## Common Pitfalls

### Pitfall 1: Bottom Sheet Overlaps Canvas / Blocks Interaction

**What goes wrong:** With `modal={true}` (Vaul default), a semi-transparent overlay covers the canvas when the sheet is open. Students can't pan or zoom while reviewing a location.

**Why it happens:** Vaul defaults to modal behavior (like a dialog).

**How to avoid:** Always set `modal={false}` on `Drawer.Root`. With `modal={false}`, also add a stage-level click handler to manually dismiss when tapping the map background (since Vaul's built-in "tap outside" only works in modal mode).

**Warning signs:** Canvas is unresponsive while sheet is peeked; grey overlay visible behind the sheet.

### Pitfall 2: Markers Scale with Zoom (Become Huge at High Zoom)

**What goes wrong:** If markers are placed inside the zoomed Konva Stage without counter-scaling, a `radius=8` circle at `scale=4x` appears as a 32px circle on screen. At max zoom (4×), markers overwhelm the floor plan.

**Why it happens:** All children of the Stage transform with its scale.

**How to avoid:** Apply counter-scaling to each marker's `Group`: `scaleX={1 / stageScale}` and `scaleY={1 / stageScale}`. This keeps screen-pixel size constant.

**Implementation note:** `stageScale` must be tracked. Since the viewport uses direct Konva mutation (not React state), read it as: `stageRef.current?.scaleX()` after zoom events. Use a React `useState` for `stageScale`, updated by a thin wrapper around the existing wheel/pinch handlers.

**Warning signs:** Markers are tiny at initial zoom and enormous when zoomed in. Or vice versa — markers disappear when zooming out.

### Pitfall 3: stageScale Out of Sync with Direct Konva Mutations

**What goes wrong:** The Phase 2 viewport uses direct `stage.scale()` mutations (no React setState) for 60fps performance. If LandmarkLayer needs the current scale for counter-scaling, it can't use React state — that state was never updated.

**Why it happens:** The architectural decision from Phase 2 was to bypass React setState for all viewport mutations.

**How to avoid:** Two clean options:
1. **Event-driven sync (recommended):** Add a thin `onScaleChange` callback to `useMapViewport` that fires after each scale mutation. Propagate up to `FloorPlanCanvas` and store in a `stageScale` state. Only triggers on scale change (not every frame).
2. **Ref-based read:** Pass `stageRef` to `LandmarkLayer` and have each marker read `stageRef.current?.scaleX()` inside a `useLayoutEffect` keyed on a `renderVersion` counter incremented after each zoom.

Option 1 is cleaner — scale changes are discrete events (wheel, pinch end, button click), not continuous mutations.

**Warning signs:** Counter-scaling is stale — markers appear at the wrong size after zooming.

### Pitfall 4: Normalized Coordinates Not Accounting for imageRect Offset

**What goes wrong:** A node at normalized `(0.5, 0.5)` is placed at pixel `(viewportWidth/2, viewportHeight/2)` instead of the center of the floor plan image.

**Why it happens:** Normalized coordinates are relative to the floor plan image, not the viewport. The image is centered with padding inside the viewport.

**How to avoid:** Always use the `imageRect` from `FloorPlanImage`:
```typescript
x = imageRect.x + normalizedX * imageRect.width
y = imageRect.y + normalizedY * imageRect.height
```
Never compute `normalizedX * viewportWidth`.

**Warning signs:** Markers appear offset from their intended positions on the floor plan, or cluster near the top-left corner.

### Pitfall 5: NavNode Missing Fields for Bottom Sheet

**What goes wrong:** The bottom sheet needs `roomNumber`, `description`, `buildingName`, `accessibilityNotes` — but `NavNodeData` in `shared/types.ts` only has `x`, `y`, `label`, `type`, `searchable`, `floor`.

**Why it happens:** The current `NavNodeData` was designed for routing. Landmark display details weren't added yet.

**How to avoid:** Extend `NavNodeData` (or add a `LandmarkDetails` interface merged into `NavNode`) before building the bottom sheet. New optional fields: `roomNumber?: string`, `description?: string`, `buildingName?: string`, `accessibilityNotes?: string`. All optional — navigation-only nodes don't need them.

**Warning signs:** TypeScript errors when accessing `node.roomNumber` in the sheet component.

### Pitfall 6: Vaul `snapPoints` Array Format

**What goes wrong:** Snap points are passed as pixel values instead of viewport-height fractions.

**Why it happens:** The API isn't immediately obvious — the values `[0.15, 0.9]` look like fractions but the Context7 docs show examples using arbitrary numbers.

**How to avoid:** Verified from vaul.emilkowal.ski/api: `snapPoints` is an array. Values between 0 and 1 are treated as **fractions of viewport height**. Values > 1 are treated as **pixel heights**. Use fractions (e.g., `[0.15, 0.9]`) for responsive behavior across screen sizes.

**Warning signs:** Sheet snaps to wrong heights; peek is too small or too large on different devices.

### Pitfall 7: Stage `onClick` Conflicts with Marker Clicks

**What goes wrong:** Adding `onClick` to the Stage to dismiss the sheet fires even when clicking a marker, immediately re-dismissing after the marker opens the sheet.

**Why it happens:** Konva's event system bubbles clicks from shapes up to the Stage.

**How to avoid:** Check `e.target === e.target.getStage()` in the Stage click handler — only dismiss if the user clicked the bare stage background (not a shape).

```tsx
// Correct stage click handler for dismissal:
<Stage onClick={(e) => {
  if (e.target === e.target.getStage()) setSelectedNode(null)
}}>
```

**Warning signs:** Sheet flickers open then immediately closes when tapping a marker.

---

## Code Examples

Verified patterns from official sources:

### Normalized → Pixel Coordinate Conversion

```typescript
// Source: Derived from FloorPlanImage.tsx imageRect calculation
// imageRect is in stage-local coordinates (scale=1). This is correct:
// markers placed at these coordinates transform with the stage automatically.

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
import { Group, Circle, Text } from 'react-konva'
import type { NavNode } from '@shared/types'

interface LandmarkMarkerProps {
  node: NavNode
  imageRect: { x: number; y: number; width: number; height: number }
  stageScale: number
  isSelected: boolean
  onClick: () => void
}

const SCREEN_RADIUS = 8   // Visual radius in screen pixels
const VISIBLE_FILL: Record<string, string> = {
  room:      '#3b82f6',   // blue
  entrance:  '#22c55e',   // green
  elevator:  '#a855f7',   // purple
  restroom:  '#f59e0b',   // amber
  landmark:  '#ef4444',   // red
}

export function LandmarkMarker({ node, imageRect, stageScale, isSelected, onClick }: LandmarkMarkerProps) {
  const { x, y } = nodeToPixel(node, imageRect)
  const scale = 1 / stageScale       // Counter-scale to maintain screen size
  const fill = VISIBLE_FILL[node.type] ?? '#64748b'

  return (
    <Group
      x={x}
      y={y}
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
          // Enlarged tap target: 2.5× visual radius
          context.beginPath()
          context.arc(0, 0, SCREEN_RADIUS * 2.5, 0, Math.PI * 2, true)
          context.closePath()
          context.fillStrokeShape(shape)
        }}
      />
      {/* Label — shown on selected state; hover handled via onMouseEnter/Leave */}
    </Group>
  )
}
```

### Vaul Bottom Sheet Setup

```tsx
// Source: https://vaul.emilkowal.ski/getting-started + /api (vaul v1.1.2)
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
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-gray-300" /> {/* handle */}
          <div className="px-5 pb-2 pt-3">
            <h2 className="text-lg font-semibold text-gray-900">{node?.label}</h2>
            <p className="text-sm font-medium text-gray-500 capitalize">{node?.type}</p>
          </div>
          <div className="overflow-y-auto px-5 pb-10">
            {node?.roomNumber && <p>Room {node.roomNumber}</p>}
            {node?.description && <p>{node.description}</p>}
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

### GET /api/map Hono Route

```typescript
// Source: Existing src/server/index.ts pattern + hono v4.11.9
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { NavGraph } from '@shared/types'

app.get('/api/map', async (c) => {
  try {
    const filePath = resolve(__dirname, 'assets/campus-graph.json')
    const raw = await readFile(filePath, 'utf-8')
    const graph: NavGraph = JSON.parse(raw)
    c.header('Content-Type', 'application/json')
    c.header('Cache-Control', 'public, max-age=60')
    return c.json(graph)
  } catch (err) {
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

---

## NavNodeData Extension Required

The current `NavNodeData` (in `src/shared/types.ts`) covers routing fields only. The bottom sheet requires additional optional display fields. These must be added to `NavNodeData` before building the sheet:

```typescript
// Add to NavNodeData in src/shared/types.ts:
export interface NavNodeData {
  // ... existing fields ...
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

**Impact:** NavNode inherits from NavNodeData, so NavNode gets these fields automatically. The test fixture JSON must include these fields on visible nodes. Navigation-only nodes (junction, hallway, ramp, stairs) can omit them.

---

## Discretion Recommendations

### Marker Color Scheme by Type

Recommended palette (distinguishable, accessible, map-like):

| Type | Color | Hex | Rationale |
|------|-------|-----|-----------|
| `room` | Blue | `#3b82f6` | Neutral, most common type |
| `entrance` | Green | `#22c55e` | Entry = go/green |
| `elevator` | Purple | `#a855f7` | Accessibility-associated |
| `restroom` | Amber | `#f59e0b` | Utility/service |
| `landmark` | Red | `#ef4444` | Notable destination |
| `ramp` | (hidden) | — | Not rendered |
| `stairs` | (hidden) | — | Not rendered |
| `junction` | (hidden) | — | Not rendered |
| `hallway` | (hidden) | — | Not rendered |

### Selected Marker Treatment

Show the label (Text below circle) and enlarge the circle by 1.4× when selected. Ring/stroke highlight is common but adds visual noise — a size + persistent label is simpler and clearer.

### Marker Scaling: Counter-Scale (Fixed Screen Size)

**Recommendation:** Counter-scale markers so they maintain a constant ~16px diameter (8px radius) at all zoom levels.

**Rationale:** At 4× zoom, an 8px marker becomes 32px — it overlaps labels and obscures the floor plan. At 0.3× zoom, it becomes 2.4px — invisible. A constant screen size is the standard for map markers (Google Maps, Apple Maps both counter-scale markers). Counter-scaling is ~3 lines of code with Konva Group scale.

### Label Visibility: Show on Hover + Selected, Auto-Show at High Zoom

**Recommendation:** Labels are hidden by default. Show on `onMouseEnter` (desktop) and when `isSelected === true` (tap). Additionally, auto-show at `stageScale >= 2.0` (2× zoom threshold). This is the sweet spot — at 2× zoom there's room to display labels without overlap.

### Clustering: No Clustering for 15–30 Landmarks

**Recommendation:** Skip clustering entirely. With 15–30 landmarks, even at minimum zoom (0.3×) the markers don't meaningfully overlap. Clustering adds significant complexity (cluster management, animated expand/collapse) for no visible benefit at this data size.

### Tap Target: 2.5× Hit Radius via hitFunc

**Recommendation:** Use `hitFunc` to expand hit detection to 2.5× the visual radius (20px hit diameter for 8px visual circle). This follows Apple HIG guidelines (~44pt minimum touch target) and is the standard Konva approach.

### Loading State

**Recommendation:** While `useGraphData` returns `{ status: 'loading' }`, show no markers (render null from LandmarkLayer). Add a subtle loading indicator in the ZoomControls area or as a small Konva Text node. Do NOT block the floor plan — the image can be panned/zoomed while graph data loads.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom bottom sheet with `touchstart`/`touchmove` | Vaul library | 2023+ (Vaul v1.0) | Vaul handles scroll locking, overscroll, velocity snap, ARIA |
| Konva stage-based overlays for info panels | HTML overlay outside Stage | Konva best practice | Canvas text is not accessible, not searchable, harder to style |
| Icon-based map markers | Filled circle markers | Design preference | Circles are cleaner, render faster, and scale better than SVG icons on canvas |

**Deprecated/outdated:**
- `react-spring-bottom-sheet` — superseded by Vaul for most use cases. No snap points in the same ergonomic API.

---

## Open Questions

1. **`types.ts` extension backward compatibility**
   - What we know: `NavNodeData` needs 4 new optional fields for the bottom sheet.
   - What's unclear: Phase 3 test fixtures (`test-graph.json`) don't include these fields. TypeScript optional fields mean no compile error, but it's worth confirming the test fixtures don't need updating (they don't — optional fields).
   - Recommendation: Add fields as optional (`?`). No changes to Phase 3 fixtures needed.

2. **`stairs` visibility classification conflict**
   - What we know: `src/shared/types.ts` comment says "stairs — navigation waypoint, visible on map but not searchable." CONTEXT.md decisions say stairs must be completely invisible.
   - What's unclear: Was the comment written with a different intent, or is there a desired stair icon on the map?
   - Recommendation: CONTEXT.md is authoritative. Exclude `stairs` from rendered types. Update the comment in `types.ts` to reflect the correct behavior.

3. **`activeSnapPoint` controlled vs uncontrolled in Vaul**
   - What we know: Vaul's `snapPoints` prop works with both controlled (`activeSnapPoint` + `setActiveSnapPoint`) and uncontrolled modes.
   - What's unclear: Whether uncontrolled mode (no `activeSnapPoint` prop) correctly defaults to the first snap point (peek) when the drawer opens.
   - Recommendation: Use controlled mode (`activeSnapPoint` state, `setActiveSnapPoint` callback) for predictability. Always open to peek (0.15) by resetting `activeSnapPoint` to 0 when `selectedNode` changes.

---

## Sources

### Primary (HIGH confidence)
- Context7 `/konvajs/site` — Circle, Group, Text, hitFunc, hitStrokeWidth, getAbsoluteScale, event handling (click, tap, mouseenter)
- Context7 `/konvajs/react-konva` — Group, Circle, Text declarative API, onClick/onTap props, selection pattern
- Context7 `/websites/vaul_emilkowal_ski` — Vaul snap points API, Root props, dismissible, modal, Portal/Overlay/Content anatomy
- vaul.emilkowal.ski/api — Full component API reference (confirmed vaul v1.1.2, npm verified)
- vaul.emilkowal.ski/getting-started — Installation and basic usage (confirmed `npm install vaul`)
- `src/client/components/FloorPlanImage.tsx` — imageRect coordinate system, normalized→pixel conversion derivation
- `src/client/components/FloorPlanCanvas.tsx` — Stage structure, existing overlay pattern (HTML outside Stage)
- `src/client/hooks/useMapViewport.ts` — Direct Konva mutation pattern; confirmed no React state for scale
- `src/shared/types.ts` — NavNodeType enum, NavNodeData fields, NavGraph shape

### Secondary (MEDIUM confidence)
- npm `vaul` package metadata — version 1.1.2 confirmed current

### Tertiary (LOW confidence)
- None — all critical findings verified via Context7 or official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Vaul verified via official docs + npm. All Konva APIs verified via Context7.
- Architecture: HIGH — Coordinate system derived from existing codebase. Cross-layer communication via React state is established pattern.
- Pitfalls: HIGH — Modal conflict, counter-scale, stageScale sync, and coordinate offset pitfalls all derived from direct code analysis of existing files + verified Konva/Vaul API behavior.
- Discretion recommendations: MEDIUM — Color palette and thresholds are design judgments, not verified facts.

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (Vaul moves slowly; 30 days safe)
