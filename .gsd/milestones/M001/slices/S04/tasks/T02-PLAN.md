---
phase: 04-map-landmarks-location-display
plan: 02
type: execute
wave: 2
depends_on: [04-01]
files_modified:
  - src/client/hooks/useGraphData.ts
  - src/client/components/LandmarkMarker.tsx
  - src/client/components/LandmarkLayer.tsx
  - src/client/hooks/useMapViewport.ts
  - src/client/components/FloorPlanCanvas.tsx
autonomous: true
requirements: [MAP-03, MAP-04]

must_haves:
  truths:
    - "Visible landmark markers (circles) appear on the floor plan for all 18 visible node types"
    - "Hidden navigation nodes (junction, hallway, stairs, ramp) render NO markers on the map"
    - "Markers maintain constant screen-pixel size (counter-scaled) as user zooms in/out"
    - "Markers are color-coded by type (room=blue, entrance=green, elevator=purple, restroom=amber, landmark=red)"
    - "Tapping/clicking a marker sets selectedNode state in FloorPlanCanvas (consumed by Plan 03)"
    - "While graph data loads, no markers appear and the floor plan remains interactive"
  artifacts:
    - path: "src/client/hooks/useGraphData.ts"
      provides: "Fetch hook for GET /api/map returning NavGraph state machine"
      exports: ["useGraphData"]
    - path: "src/client/components/LandmarkMarker.tsx"
      provides: "Single counter-scaled Konva Group with Circle + hitFunc"
      exports: ["LandmarkMarker"]
    - path: "src/client/components/LandmarkLayer.tsx"
      provides: "Filtered landmark layer rendering all visible markers"
      exports: ["LandmarkLayer"]
  key_links:
    - from: "src/client/components/LandmarkLayer.tsx"
      to: "src/client/hooks/useGraphData.ts"
      via: "useGraphData() hook call"
      pattern: "useGraphData"
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/components/LandmarkLayer.tsx"
      via: "Layer containing LandmarkLayer, passing imageRect + stageScale + onSelectNode"
      pattern: "LandmarkLayer"
    - from: "src/client/hooks/useMapViewport.ts"
      to: "src/client/components/FloorPlanCanvas.tsx"
      via: "onScaleChange callback syncing stageScale React state"
      pattern: "onScaleChange"
---

<objective>
Build the interactive landmark marker system: a data fetch hook, individual counter-scaled Konva markers with hitFunc tap targets, a filtered landmark layer, and stageScale sync so markers maintain constant screen size during zoom.

Purpose: This is the visual core of MAP-03 (show landmarks) and MAP-04 (hide nav nodes). Produces the selectedNode state that Plan 03 consumes for the bottom sheet.

Output: LandmarkMarker, LandmarkLayer, useGraphData hook; FloorPlanCanvas wired with landmark layer + selectedNode state + stageScale sync.
</objective>

<execution_context>
@C:/Users/LENOVO/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@src/shared/types.ts
@src/client/hooks/useMapViewport.ts
@src/client/components/FloorPlanCanvas.tsx
@.planning/phases/04-map-landmarks-location-display/04-01-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create useGraphData hook and LandmarkMarker + LandmarkLayer components</name>
  <files>src/client/hooks/useGraphData.ts, src/client/components/LandmarkMarker.tsx, src/client/components/LandmarkLayer.tsx</files>
  <action>
**Part A — src/client/hooks/useGraphData.ts:**

Create a fetch hook for `GET /api/map`:

```typescript
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
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<NavGraph>
      })
      .then((data) => {
        if (!cancelled) setState({ status: 'loaded', data })
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ status: 'error', message: String(err) })
      })
    return () => { cancelled = true }
  }, [])

  return state
}
```

**Part B — src/client/components/LandmarkMarker.tsx:**

Single marker component — a Konva `Group` at the node's pixel position with counter-scaling:

- Import `Group`, `Circle`, `Text` from `react-konva`
- Import `type { NavNode }` from `@shared/types`

Prop interface:
```typescript
interface LandmarkMarkerProps {
  node: NavNode
  imageRect: { x: number; y: number; width: number; height: number }
  stageScale: number
  isSelected: boolean
  isLabelVisible: boolean  // true when selected OR stageScale >= 2.0
  onClick: () => void
}
```

Constants:
```typescript
const SCREEN_RADIUS = 8

const TYPE_COLORS: Record<string, string> = {
  room: '#3b82f6',       // blue
  entrance: '#22c55e',   // green
  elevator: '#a855f7',   // purple
  restroom: '#f59e0b',   // amber
  landmark: '#ef4444',   // red
}
```

Coordinate conversion (inline in component, NOT in a separate util file):
```typescript
const pixelX = imageRect.x + node.x * imageRect.width
const pixelY = imageRect.y + node.y * imageRect.height
const scale = 1 / stageScale
const fill = TYPE_COLORS[node.type] ?? '#64748b'
const radius = isSelected ? SCREEN_RADIUS * 1.4 : SCREEN_RADIUS
```

Render:
```tsx
<Group
  x={pixelX}
  y={pixelY}
  scaleX={scale}
  scaleY={scale}
  onClick={onClick}
  onTap={onClick}
>
  <Circle
    radius={radius}
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
  {isLabelVisible && (
    <Text
      text={node.label}
      fontSize={11}
      fill="#1e293b"
      offsetX={0}
      y={radius + 4}
      align="center"
      width={80}
      offsetY={0}
      x={-40}
    />
  )}
</Group>
```

**Part C — src/client/components/LandmarkLayer.tsx:**

The filtered landmark layer. This component:
1. Calls `useGraphData()` to fetch map data
2. Filters to visible types only (VISIBLE_NODE_TYPES)
3. Renders a react-konva `Layer` containing one `LandmarkMarker` per visible node

```typescript
import { Layer } from 'react-konva'
import type { NavNode, NavNodeType } from '@shared/types'
import { useGraphData } from '../hooks/useGraphData'
import { LandmarkMarker } from './LandmarkMarker'

const VISIBLE_NODE_TYPES: NavNodeType[] = [
  'room',
  'entrance',
  'elevator',
  'restroom',
  'landmark',
]

interface LandmarkLayerProps {
  imageRect: { x: number; y: number; width: number; height: number } | null
  stageScale: number
  selectedNodeId: string | null
  onSelectNode: (node: NavNode) => void
}
```

Render logic:
- If `imageRect` is null, return null (image not yet loaded)
- Get graphState from `useGraphData()`
- If `graphState.status !== 'loaded'`, return null (loading or error — no markers; floor plan still usable)
- `const visibleNodes = graphState.data.nodes.filter(n => VISIBLE_NODE_TYPES.includes(n.type))`
- Return a react-konva `<Layer>` containing `visibleNodes.map(node => <LandmarkMarker key={node.id} ... />)`
- Pass `isLabelVisible={node.id === selectedNodeId || stageScale >= 2.0}` to each marker
  </action>
  <verify>Run `npx tsc --noEmit` and `npx biome check .` — zero errors. Verify the three files exist and export the expected identifiers.</verify>
  <done>useGraphData, LandmarkMarker, LandmarkLayer all created with correct TypeScript types. No lint errors.</done>
</task>

<task type="auto">
  <name>Task 2: Add stageScale sync to useMapViewport and wire landmark layer into FloorPlanCanvas</name>
  <files>src/client/hooks/useMapViewport.ts, src/client/components/FloorPlanCanvas.tsx</files>
  <action>
**Part A — Add onScaleChange to useMapViewport (src/client/hooks/useMapViewport.ts):**

The viewport uses direct Konva mutations (no React state) per Phase 2 design. Markers need the current scale for counter-scaling. Add a thin event-driven callback:

1. Add `onScaleChange?: (scale: number) => void` to `UseMapViewportOptions` interface.
2. In `handleWheel`, after `stage.scale({ x: newScale, y: newScale })`, add: `options.onScaleChange?.(newScale)` (use the `options` parameter pattern, or add it as a named param). Specifically: add `onScaleChange` to the destructured options at the top of the hook, then call it after every scale mutation.
3. In `handleTouchMove`, after `stage.scaleX(newScale)` / `stage.scaleY(newScale)`, add: `onScaleChange?.(newScale)`.
4. In `zoomByButton`, the Tween's `onFinish` is where scale changes complete — add a `onFinish: () => onScaleChange?.(newScale)` callback to the `Konva.Tween` constructor options, alongside duration/easing.
5. In `fitToScreen`, after animated tween `onFinish` or after direct `stage.scale({ x: 1, y: 1 })`: call `onScaleChange?.(1)`.

**Part B — Wire LandmarkLayer into FloorPlanCanvas (src/client/components/FloorPlanCanvas.tsx):**

1. Import `LandmarkLayer` from `./LandmarkLayer`
2. Import `NavNode` type from `@shared/types`
3. Add two new state variables:
   ```typescript
   const [selectedNode, setSelectedNode] = useState<NavNode | null>(null)
   const [stageScale, setStageScale] = useState<number>(1)
   ```
4. Pass `onScaleChange={setStageScale}` to `useMapViewport`.
5. Add a landmark layer `<Layer>` after the existing image Layer, inside the Stage, before the UI overlay Layer:
   ```tsx
   {/* Landmarks — markers above floor plan image */}
   {imageRect && (
     <LandmarkLayer
       imageRect={imageRect}
       stageScale={stageScale}
       selectedNodeId={selectedNode?.id ?? null}
       onSelectNode={setSelectedNode}
     />
   )}
   ```
   Wait — `LandmarkLayer` already renders its own `<Layer>` internally (from Task 1). So in `FloorPlanCanvas`, render `<LandmarkLayer .../>` directly inside the Stage (not wrapped in an additional `<Layer>`).
6. Add `onClick` on the Stage to dismiss selection when user taps the map background:
   ```tsx
   onClick={(e) => {
     if (e.target === e.target.getStage()) setSelectedNode(null)
   }}
   ```
7. Export `selectedNode` and `setSelectedNode` accessors are only used internally in this file for now (Plan 03 will add the sheet component that reads `selectedNode`).

Keep `selectedNode` and `setSelectedNode` in scope so Plan 03 can add `<LandmarkSheet node={selectedNode} onClose={() => setSelectedNode(null)} />` outside the Stage in the same file.
  </action>
  <verify>
1. `npx tsc --noEmit` — zero errors
2. `npx biome check .` — zero errors
3. Start dev server (`npm run dev`) and open browser — landmarks should appear as colored circles on the floor plan. Verify:
   - Circles visible over the floor plan image
   - Zooming in/out keeps circles at approximately the same screen size
   - Clicking a landmark logs no errors in the console (selectedNode state changes)
   - Clicking map background deselects (no visual change yet — sheet comes in Plan 03)
  </verify>
  <done>Landmark circles appear on the floor plan. Counter-scaling works (circles stay same screen size during zoom). Stage click sets/clears selectedNode state. TypeScript and lint pass.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — zero TypeScript errors
2. `npx biome check .` — zero lint errors
3. Dev server loads: landmark markers are visible on the floor plan
4. Zoom in/out: markers maintain consistent screen-pixel size (counter-scaled)
5. Hidden nodes (junction, hallway, stairs, ramp) produce NO visible markers
6. Different landmark types show different colors (blue for rooms, green for entrances, purple for elevators, amber for restrooms, red for landmarks)
7. At 2× zoom, labels appear below markers; below 2× zoom, no labels
8. `console.log(selectedNode)` in browser confirms state changes on click
</verification>

<success_criteria>
- LandmarkLayer renders 18 visible markers (not 25 — 7 hidden nodes filtered out)
- Markers counter-scale correctly during zoom (constant screen size)
- Each type has a distinct color
- selectedNode state wired in FloorPlanCanvas ready for Plan 03's bottom sheet
- TypeScript compiles, Biome lint passes
</success_criteria>

<output>
After completion, create `.planning/phases/04-map-landmarks-location-display/04-02-SUMMARY.md`
</output>
