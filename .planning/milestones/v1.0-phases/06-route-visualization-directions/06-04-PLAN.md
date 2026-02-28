---
phase: 06-route-visualization-directions
plan: 04
type: execute
wave: 3
depends_on:
  - 06-01
  - 06-02
  - 06-03
files_modified:
  - src/client/components/FloorPlanCanvas.tsx
autonomous: true
requirements:
  - ROUT-03
  - ROUT-04
  - ROUT-05
  - ROUT-06

must_haves:
  truths:
    - "After selecting start + destination, both route lines are computed and the active route is drawn on the canvas"
    - "DirectionsSheet opens automatically (peeked at 35%) when a route is computed"
    - "Switching tabs in DirectionsSheet changes activeMode, which changes which route line is drawn"
    - "Clicking the back arrow in DirectionsSheet closes the sheet and returns user to A/B pin compact strip"
    - "A canvas legend shows blue=Standard, green=Accessible in a small pill overlaid on the map"
    - "The @ts-expect-error and biome-ignore suppression on routeResult are removed — routeResult is now fully consumed"
    - "When start or destination is cleared, sheet closes and route lines are cleared"
    - "Map auto-fits the active route on initial open (reuses fitToBounds logic)"
  artifacts:
    - path: "src/client/components/FloorPlanCanvas.tsx"
      provides: "FloorPlanCanvas with RouteLayer, DirectionsSheet, legend, and route visibility control"
      contains: "RouteLayer"
  key_links:
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/components/RouteLayer.tsx"
      via: "RouteLayer inserted between FloorPlanImage Layer and LandmarkLayer"
      pattern: "RouteLayer"
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/components/DirectionsSheet.tsx"
      via: "DirectionsSheet rendered as HTML sibling to ZoomControls"
      pattern: "DirectionsSheet"
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/hooks/useRouteDirections.ts"
      via: "useRouteDirections hook called for both standard and accessible results"
      pattern: "useRouteDirections"
---

<objective>
Wire RouteLayer, DirectionsSheet, legend, and useRouteDirections into FloorPlanCanvas — making routeResult fully consumed and the route visualization end-to-end complete.

Purpose: This is the final integration step that connects all Phase 6 components into a working feature.
Output: FloorPlanCanvas updated with route lines on canvas, directions sheet, legend, and activeMode tab control.
</objective>

<execution_context>
@C:/Users/admin/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@src/client/components/FloorPlanCanvas.tsx
@src/client/components/RouteLayer.tsx
@src/client/components/DirectionsSheet.tsx
@src/client/hooks/useRouteDirections.ts
@.planning/phases/06-route-visualization-directions/06-01-SUMMARY.md
@.planning/phases/06-route-visualization-directions/06-02-SUMMARY.md
@.planning/phases/06-route-visualization-directions/06-03-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Wire RouteLayer, DirectionsSheet, legend into FloorPlanCanvas</name>
  <files>src/client/components/FloorPlanCanvas.tsx</files>
  <action>
Modify `src/client/components/FloorPlanCanvas.tsx` to fully consume `routeResult` and add all Phase 6 visual output.

**Step-by-step changes:**

### 1. Remove suppression comments on routeResult

Find these lines and remove them:
```typescript
// @ts-expect-error routeResult will be consumed by Phase 6 route visualization layer
// biome-ignore lint/correctness/noUnusedVariables: stored for Phase 6 consumption
const [routeResult, setRouteResult] = useState<RouteResult | null>(null)
```
Replace with clean declaration:
```typescript
const [routeResult, setRouteResult] = useState<RouteResult | null>(null)
```

### 2. Add new imports

Add to imports block:
```typescript
import { useRouteDirections, routesAreIdentical } from '../hooks/useRouteDirections'
import { RouteLayer } from './RouteLayer'
import { DirectionsSheet } from './DirectionsSheet'
```

### 3. Add activeMode state and sheet open state

After the existing `const [stageScale, setStageScale] = useState<number>(1)` line, add:
```typescript
const [activeMode, setActiveMode] = useState<'standard' | 'accessible'>('standard')
const [sheetOpen, setSheetOpen] = useState<boolean>(false)
```

### 4. Compute node map from graph data

After the `const nodes = useMemo(...)` block, add:
```typescript
const nodeMap = useMemo<Map<string, NavNode>>(() => {
  if (graphState.status !== 'loaded') return new Map()
  return new Map(graphState.data.nodes.map((n) => [n.id, n]))
}, [graphState])
```

Note: you need `import type { NavNode } from '@shared/types'` — this import may already exist; check before adding.

### 5. Call useRouteDirections for both modes

After `nodeMap`, add:
```typescript
const standardDirections = useRouteDirections(
  routeResult?.standard ?? null,
  nodeMap,
  'standard',
)
const accessibleDirections = useRouteDirections(
  routeResult?.accessible ?? null,
  nodeMap,
  'accessible',
)
const routesIdentical = routeResult
  ? routesAreIdentical(routeResult.standard, routeResult.accessible)
  : false
```

### 6. Compute route points for the active route line

Add helper function (inline in component, before return):
```typescript
const buildRoutePoints = useCallback(
  (nodeIds: string[]): number[] => {
    if (!imageRect) return []
    const pts: number[] = []
    for (const id of nodeIds) {
      const n = nodeMap.get(id)
      if (!n) continue
      pts.push(imageRect.x + n.x * imageRect.width, imageRect.y + n.y * imageRect.height)
    }
    return pts
  },
  [imageRect, nodeMap],
)

const activeRoutePoints = useMemo(() => {
  if (!routeResult) return []
  const result = activeMode === 'standard' ? routeResult.standard : routeResult.accessible
  if (!result.found) return []
  return buildRoutePoints(result.nodeIds)
}, [routeResult, activeMode, buildRoutePoints])

const activeRouteColor = activeMode === 'standard' ? '#3b82f6' : '#22c55e'
```

### 7. Open sheet when route is computed

In the existing `handleRouteTrigger` callback, after `setRouteResult({ standard, accessible })`:
```typescript
if (standard.found || accessible.found) {
  setSheetOpen(true)
  setActiveMode('standard')
  showToast('Route calculated')
} else {
  showToast('No route found', true)
}
```
(Remove the existing `showToast` calls and replace with the block above.)

### 8. Close sheet when selections cleared

In the existing `useEffect` that watches `routeSelection.start / routeSelection.destination`:
```typescript
useEffect(() => {
  if (!routeSelection.start || !routeSelection.destination) {
    setRouteResult(null)
    setSheetOpen(false)
  }
}, [routeSelection.start, routeSelection.destination])
```

### 9. Add onBack handler

```typescript
const handleSheetBack = useCallback(() => {
  setSheetOpen(false)
}, [])
```

### 10. Add RouteLayer inside Stage (between FloorPlanImage Layer and LandmarkLayer)

Find the Stage JSX. After the `<Layer>` containing `<FloorPlanImage />`, add:
```tsx
{/* Route path — animated dashed line for active route */}
<RouteLayer
  points={activeRoutePoints}
  color={activeRouteColor}
  visible={sheetOpen && activeRoutePoints.length >= 4}
/>
```

### 11. Add DirectionsSheet as HTML sibling (after ZoomControls)

After `<ZoomControls ... />`, add:
```tsx
<DirectionsSheet
  open={sheetOpen}
  standard={routeResult?.standard ?? null}
  accessible={routeResult?.accessible ?? null}
  standardDirections={standardDirections}
  accessibleDirections={accessibleDirections}
  routesIdentical={routesIdentical}
  activeMode={activeMode}
  onTabChange={setActiveMode}
  onBack={handleSheetBack}
  startNode={routeSelection.start}
  destNode={routeSelection.destination}
/>
```

### 12. Add canvas legend (HTML overlay)

Add a small pill legend when sheetOpen AND (standard route found OR accessible route found):
```tsx
{sheetOpen && routeResult && (routeResult.standard.found || routeResult.accessible.found) && (
  <div className="absolute bottom-40 right-3 z-20 bg-white/90 backdrop-blur-sm rounded-lg shadow px-3 py-2 flex flex-col gap-1.5 text-xs">
    {routeResult.standard.found && (
      <div className="flex items-center gap-2">
        <span className="w-6 h-1.5 rounded-full bg-blue-500 inline-block" />
        <span className="text-slate-700">Standard</span>
      </div>
    )}
    {routeResult.accessible.found && !routesIdentical && (
      <div className="flex items-center gap-2">
        <span className="w-6 h-1.5 rounded-full bg-green-500 inline-block" />
        <span className="text-slate-700">Accessible</span>
      </div>
    )}
    {routesIdentical && (
      <div className="flex items-center gap-2">
        <span className="w-6 h-1.5 rounded-full bg-blue-500 inline-block" />
        <span className="text-slate-700">Standard (accessible)</span>
      </div>
    )}
  </div>
)}
```

**CRITICAL:**
- `NavNode` import may already exist from earlier phases — do NOT duplicate
- Remove the now-unused `@ts-expect-error` and `biome-ignore` suppression comments
- `buildRoutePoints` function uses `useCallback`; `activeRoutePoints` uses `useMemo`
- RouteLayer sits inside the Stage (between FloorPlanImage layer and LandmarkLayer) — NOT outside
- DirectionsSheet, legend, and ZoomControls are HTML siblings outside the Stage
  </action>
  <verify>
Run: `npx tsc --noEmit`
Run: `npx biome check src/client/components/FloorPlanCanvas.tsx`
Run: `npm run dev` (in a separate terminal, check no runtime errors in console)
First two must exit 0. Dev server must start without TypeScript/import errors.
  </verify>
  <done>
FloorPlanCanvas.tsx updated:
- @ts-expect-error and biome-ignore suppression on routeResult removed
- RouteLayer renders active route in Stage
- DirectionsSheet opens on route compute, back arrow closes it
- Canvas legend shows color coding
- activeMode tab switching changes displayed route and route line color
- Sheet closes when start/destination cleared
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` exits 0
- `npx biome check src/client/components/FloorPlanCanvas.tsx` exits 0
- No @ts-expect-error or biome-ignore suppressions remain on routeResult
- RouteLayer, DirectionsSheet, useRouteDirections all imported and used
</verification>

<success_criteria>
- FloorPlanCanvas fully consumes routeResult with no TypeScript suppression comments
- Route line appears on map when route is computed
- DirectionsSheet opens automatically at 35% peek when route computed
- Tab switching updates both sheet content and route line color simultaneously
- Back arrow returns to compact strip (no active sheet)
- Legend visible in bottom-right corner when sheet is open
</success_criteria>

<output>
After completion, create `.planning/phases/06-route-visualization-directions/06-04-SUMMARY.md`
</output>
