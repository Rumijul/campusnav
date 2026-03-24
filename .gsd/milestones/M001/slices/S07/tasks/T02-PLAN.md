---
phase: 06-route-visualization-directions
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - src/client/components/RouteLayer.tsx
autonomous: true
requirements:
  - ROUT-03
  - ROUT-04

must_haves:
  truths:
    - "When a route is active, a dashed line is drawn on the Konva canvas along the path nodes"
    - "The line animates (dashes move along the path direction) at ~40 px/s using Konva.Animation"
    - "Standard route renders in blue (#3b82f6), accessible route renders in green (#22c55e)"
    - "Route line lives in stage-space (not counter-scaled) and scales naturally with zoom"
    - "When visible=false or points.length < 4, nothing is rendered"
    - "Animation is stopped and cleaned up when the component unmounts or visibility changes"
  artifacts:
    - path: "src/client/components/RouteLayer.tsx"
      provides: "Animated dashed Konva route line inside its own Layer"
      exports: ["RouteLayer", "RouteLayerProps"]
      min_lines: 50
  key_links:
    - from: "src/client/components/RouteLayer.tsx"
      to: "konva"
      via: "KonvaModule.Animation for dashOffset animation"
      pattern: "KonvaModule\\.Animation"
    - from: "src/client/components/RouteLayer.tsx"
      to: "react-konva"
      via: "Layer and Line declarative components"
      pattern: "Line.*ref={lineRef}"
---

<objective>
Build RouteLayer — a Konva canvas component that renders an animated dashed route line from a list of pixel points.

Purpose: Visualizes the computed route path on the floor plan so the student can see exactly where to walk.
Output: RouteLayer component ready to be inserted between FloorPlanImage and LandmarkLayer in FloorPlanCanvas.
</objective>

<execution_context>
@C:/Users/admin/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@src/client/components/SelectionMarkerLayer.tsx
@src/client/components/FloorPlanCanvas.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create RouteLayer component with animated dash</name>
  <files>src/client/components/RouteLayer.tsx</files>
  <action>
Create `src/client/components/RouteLayer.tsx` with the following exact implementation:

**Props interface:**
```typescript
export interface RouteLayerProps {
  points: number[]          // flat [x1, y1, x2, y2, ...] pixel coords
  color: string             // stroke color (#3b82f6 blue or #22c55e green)
  visible: boolean          // whether to render the line at all
}
```

**Constants (use exactly these values — Claude's discretion per context decisions):**
```typescript
const DASH_LENGTH = 16
const GAP_LENGTH = 10
const STROKE_WIDTH = 5
const DASH_SPEED = 40  // px/s — dashes move along path direction
```

**Implementation:**
- Import `KonvaModule` from `'konva'` (default import) for `KonvaModule.Animation`
- Import `type Konva from 'konva'` for ref types
- Import `useEffect, useRef` from `'react'`
- Import `Layer, Line` from `'react-konva'`
- `lineRef = useRef<Konva.Line>(null)`
- `animRef = useRef<KonvaModule.Animation | null>(null)`
- `useEffect` runs when `[points, visible]` changes:
  - If `!visible || points.length < 4`: stop any running animation and return
  - Get `node = lineRef.current`; if null, return
  - Get `layer = node.getLayer()`; if null, return
  - Stop previous animation: `animRef.current?.stop()`
  - Create new animation:
    ```typescript
    animRef.current = new KonvaModule.Animation((frame) => {
      if (!frame) return
      node.dashOffset(node.dashOffset() - (frame.timeDiff / 1000) * DASH_SPEED)
    }, layer)
    animRef.current.start()
    ```
  - Cleanup: `return () => { animRef.current?.stop(); animRef.current = null }`
- Render: if `!visible || points.length < 4`, return null
- Return:
  ```tsx
  <Layer>
    <Line
      ref={lineRef}
      points={points}
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      lineCap="round"
      lineJoin="round"
      dash={[DASH_LENGTH, GAP_LENGTH]}
      dashOffset={0}
      listening={false}
      tension={0}
    />
  </Layer>
  ```

**CRITICAL:** 
- NEVER use React setState for dashOffset (causes re-renders at 60fps — dropped frames)
- `tension={0}` is mandatory — tension > 0 causes spline that doesn't pass through node points
- `listening={false}` — route line should not intercept pointer events
- The Layer rendered here gets inserted between FloorPlanImage and LandmarkLayer in FloorPlanCanvas (Plan 04 wiring)
  </action>
  <verify>
Run: `npx tsc --noEmit`
Run: `npx biome check src/client/components/RouteLayer.tsx`
Both must exit 0 with no errors.
  </verify>
  <done>
RouteLayer.tsx exists, exports RouteLayer and RouteLayerProps, TypeScript compiles, Biome clean.
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` exits 0
- `npx biome check src/client/components/RouteLayer.tsx` exits 0
- File exports: `RouteLayer` (component), `RouteLayerProps` (interface)
</verification>

<success_criteria>
- RouteLayer.tsx created with animated dashOffset via Konva.Animation (NOT React setState)
- tension={0} on Line to ensure straight segments through node points
- listening={false} so route line doesn't block map interaction
- Component returns null when not visible or insufficient points
</success_criteria>

<output>
After completion, create `.planning/phases/06-route-visualization-directions/06-02-SUMMARY.md`
</output>
