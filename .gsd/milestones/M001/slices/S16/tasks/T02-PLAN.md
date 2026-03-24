---
phase: 14.1-node-selection-fixes-and-admin-room-number-edit
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - src/client/components/SelectionMarkerLayer.tsx
  - src/client/components/FloorPlanCanvas.tsx
autonomous: true
requirements: [FIX-04]

must_haves:
  truths:
    - "Tapping the A (green) pin clears the start selection — start becomes null, activeField becomes 'start'"
    - "Tapping the B (red) pin clears the destination selection — destination becomes null, activeField becomes 'destination'"
    - "Clearing either pin also clears the route (route line disappears, directions sheet closes) via the existing useEffect"
    - "Pin tap does not trigger a landmark tap for the underlying node — event does not bubble to LandmarkLayer"
  artifacts:
    - path: "src/client/components/SelectionMarkerLayer.tsx"
      provides: "onClearStart and onClearDestination optional props; onClick/onTap on Groups with cancelBubble; hitFunc on Circles"
      contains: "onClearStart"
    - path: "src/client/components/FloorPlanCanvas.tsx"
      provides: "onClearStart and onClearDestination wired from routeSelection"
      contains: "onClearStart={routeSelection.clearStart}"
  key_links:
    - from: "SelectionMarkerLayer A pin Group"
      to: "routeSelection.clearStart"
      via: "onClick/onTap with e.cancelBubble = true"
      pattern: "onClearStart"
    - from: "SelectionMarkerLayer B pin Group"
      to: "routeSelection.clearDestination"
      via: "onClick/onTap with e.cancelBubble = true"
      pattern: "onClearDestination"
    - from: "FloorPlanCanvas.tsx SelectionMarkerLayer usage"
      to: "routeSelection.clearStart / routeSelection.clearDestination"
      via: "props passed directly"
      pattern: "routeSelection.clearStart"
---

<objective>
Make the A and B selection pins in the student-facing map tappable so users can clear a route endpoint by tapping its pin directly.

Purpose: Currently there is no way to clear a route endpoint from the map canvas — users must use the X button in the search overlay. Tapping the pin is the natural gesture students expect.
Output: SelectionMarkerLayer gains two optional callback props and click/tap handlers on pin Groups; FloorPlanCanvas wires the callbacks from useRouteSelection.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/14.1-node-selection-fixes-and-admin-room-number-edit/14.1-RESEARCH.md

<interfaces>
<!-- Key interfaces the executor needs. Extracted from codebase. -->

From src/client/components/SelectionMarkerLayer.tsx (current — display-only):
```typescript
interface SelectionMarkerLayerProps {
  start: NavNode | null
  destination: NavNode | null
  imageRect: { x: number; y: number; width: number; height: number } | null
  stageScale: number
  // No click handlers — display-only
}
const PIN_RADIUS = 12
// A pin: green circle + "A" text; B pin: red circle + "B" text
// Both use counter-scale: scale = 1 / stageScale on Group
```

From src/client/hooks/useRouteSelection.ts (clearStart/clearDestination already set activeField):
```typescript
const clearStart = useCallback(() => {
  setStartState(null)
  setActiveField('start')     // ← satisfies CONTEXT.md requirement
}, [])

const clearDestination = useCallback(() => {
  setDestinationState(null)
  setActiveField('destination') // ← satisfies CONTEXT.md requirement
}, [])
```

From src/client/components/FloorPlanCanvas.tsx (current SelectionMarkerLayer usage):
```typescript
<SelectionMarkerLayer
  start={routeSelection.start}
  destination={routeSelection.destination}
  imageRect={imageRect}
  stageScale={stageScale}
  // ← no onClearStart / onClearDestination yet
/>
```

From src/client/components/FloorPlanCanvas.tsx (clear-route useEffect — already handles clearing):
```typescript
// Clear route result and close sheet when selections change (start or dest cleared)
useEffect(() => {
  if (!routeSelection.start || !routeSelection.destination) {
    setRouteResult(null)
    setSheetOpen(false)
    setRouteVisible(false)
  }
}, [routeSelection.start, routeSelection.destination])
// ↑ This fires automatically when clearStart/clearDestination are called — no additional wiring needed
```

From src/client/components/LandmarkMarker.tsx (hitFunc pattern — use this for expanded tap target):
```typescript
hitFunc={(context, shape) => {
  context.beginPath()
  context.arc(0, 0, SCREEN_RADIUS * 2.5, 0, Math.PI * 2, true)
  context.closePath()
  context.fillStrokeShape(shape)
}}
```

From src/client/components/admin/NodeMarkerLayer.tsx (cancelBubble pattern):
```typescript
onClick={(e) => { e.cancelBubble = true; onNodeClick(node.id) }}
onTap={(e) => { e.cancelBubble = true; onNodeClick(node.id) }}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add click/tap handlers to SelectionMarkerLayer A/B pins</name>
  <files>src/client/components/SelectionMarkerLayer.tsx</files>
  <action>
Update `SelectionMarkerLayerProps` to add two optional callback props, then add click/tap handlers with cancelBubble and expanded hitFunc to each pin Group and Circle.

**Step 1 — Extend interface:**
```typescript
interface SelectionMarkerLayerProps {
  start: NavNode | null
  destination: NavNode | null
  imageRect: { x: number; y: number; width: number; height: number } | null
  stageScale: number
  onClearStart?: () => void       // new
  onClearDestination?: () => void // new
}
```

**Step 2 — Destructure new props** in the function signature.

**Step 3 — A pin Group:** Add onClick and onTap with cancelBubble:
```typescript
<Group
  x={imageRect.x + start.x * imageRect.width}
  y={imageRect.y + start.y * imageRect.height}
  scaleX={scale}
  scaleY={scale}
  onClick={(e) => { e.cancelBubble = true; onClearStart?.() }}
  onTap={(e) => { e.cancelBubble = true; onClearStart?.() }}
>
```

**Step 4 — A pin Circle:** Add hitFunc for expanded tap target (30px vs 12px visual radius):
```typescript
<Circle
  radius={PIN_RADIUS}
  fill={START_COLOR}
  stroke="#ffffff"
  strokeWidth={2}
  hitFunc={(context, shape) => {
    context.beginPath()
    context.arc(0, 0, PIN_RADIUS * 2.5, 0, Math.PI * 2, true)
    context.closePath()
    context.fillStrokeShape(shape)
  }}
/>
```

**Step 5 — B pin Group:** Same onClick/onTap pattern but calling `onClearDestination?.()`.

**Step 6 — B pin Circle:** Same hitFunc as A pin Circle.

**Step 7 — Update JSDoc comment** at top: remove "Display-only — no click handlers" and replace with "Tapping A pin calls onClearStart; tapping B pin calls onClearDestination."

cancelBubble is critical: the A/B pins sit above LandmarkLayer. Without it, the tap could bubble and trigger handleLandmarkTap on the underlying node, which would re-assign the cleared slot via setFromTap.
  </action>
  <verify>
    <automated>rtk tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>SelectionMarkerLayerProps has onClearStart and onClearDestination; both Groups have onClick/onTap with cancelBubble; both Circles have hitFunc; TypeScript passes</done>
</task>

<task type="auto">
  <name>Task 2: Wire onClearStart/onClearDestination in FloorPlanCanvas</name>
  <files>src/client/components/FloorPlanCanvas.tsx</files>
  <action>
Pass the new props to `SelectionMarkerLayer` from `routeSelection`:

```typescript
<SelectionMarkerLayer
  start={routeSelection.start}
  destination={routeSelection.destination}
  imageRect={imageRect}
  stageScale={stageScale}
  onClearStart={routeSelection.clearStart}
  onClearDestination={routeSelection.clearDestination}
/>
```

That is the only change needed. The `clearStart` and `clearDestination` functions in `useRouteSelection` already set `activeField` to `'start'` and `'destination'` respectively (verified in RESEARCH.md lines 496-506). The existing `useEffect` in `FloorPlanCanvas` (watching `[routeSelection.start, routeSelection.destination]`) automatically clears `routeResult`, closes the sheet, and hides the route line when either becomes null — no additional logic required.
  </action>
  <verify>
    <automated>rtk tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>SelectionMarkerLayer in FloorPlanCanvas.tsx has onClearStart={routeSelection.clearStart} and onClearDestination={routeSelection.clearDestination}; TypeScript passes</done>
</task>

</tasks>

<verification>
After both tasks:
1. `rtk tsc --noEmit` — zero TypeScript errors
2. `rtk lint` — zero new Biome violations
3. Manual browser test: set a route (A + B pins visible) → tap A pin → pin disappears, search shows empty start field, activeField is 'start' ✓; set route again → tap B pin → same behavior for destination ✓; route line disappears when either pin tapped ✓
</verification>

<success_criteria>
- Tapping A pin calls clearStart (start becomes null, activeField = 'start')
- Tapping B pin calls clearDestination (destination becomes null, activeField = 'destination')
- Route line and directions sheet close automatically via existing useEffect
- Pin tap does not trigger landmark detail sheet for the underlying node (cancelBubble prevents it)
- TypeScript and Biome pass with zero errors
</success_criteria>

<output>
After completion, create `.planning/phases/14.1-node-selection-fixes-and-admin-room-number-edit/14.1-02-SUMMARY.md`
</output>
