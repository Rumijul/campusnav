---
phase: 17-multi-floor-pathfinding-engine
plan: 04
type: auto
wave: 3
depends_on:
  - 17-02
  - 17-03
files_modified:
  - src/client/components/FloorPlanCanvas.tsx
autonomous: true
requirements:
  - MFLR-03

must_haves:
  truths:
    - "FloorPlanCanvas builds floorMap from the loaded NavGraph and passes it to useRouteDirections"
    - "flattenNavGraph is not imported or called by FloorPlanCanvas.tsx or any other call-site file — only graph-builder.ts retains the export for the admin editor"
    - "All existing tests pass — no regressions from call-site wiring"
    - "TypeScript compiles with zero errors"
  artifacts:
    - path: "src/client/components/FloorPlanCanvas.tsx"
      provides: "floorMap useMemo + updated useRouteDirections calls passing floorMap"
      contains: "floorMap"
  key_links:
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "useRouteDirections (hook)"
      via: "floorMap passed as 4th argument to both standardDirections and accessibleDirections"
      pattern: "floorMap"
---

<objective>
Wire the completed engine and directions changes into FloorPlanCanvas: build a floorMap (Map<number, NavFloor>) from the loaded NavGraph and pass it as the 4th argument to both useRouteDirections calls. Also confirm flattenNavGraph is no longer imported anywhere.

Purpose: The engine (Plan 02) and directions (Plan 03) changes are complete but isolated. This plan connects them to the live UI so floor-change steps appear in the DirectionsSheet when a multi-floor route is computed.
Output: Updated FloorPlanCanvas.tsx with floorMap wiring; clean codebase with no flattenNavGraph imports.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/17-multi-floor-pathfinding-engine/17-02-SUMMARY.md
@.planning/phases/17-multi-floor-pathfinding-engine/17-03-SUMMARY.md

<interfaces>
<!-- Key interfaces the executor needs. -->

From src/client/hooks/useRouteDirections.ts (updated in Plan 03):
```typescript
import type { NavFloor } from '@shared/types'

export function generateDirections(
  nodeIds: string[],
  nodeMap: Map<string, NavNode>,
  mode: 'standard' | 'accessible',
  floorMap?: Map<number, NavFloor>,
): DirectionsResult

// The hook wraps generateDirections:
export function useRouteDirections(
  pathResult: PathResult | null,
  nodeMap: Map<string, NavNode>,
  mode: 'standard' | 'accessible',
  floorMap?: Map<number, NavFloor>,  // add this 4th param to the hook in Plan 04
): DirectionsResult
```

NOTE: Plan 03 left the hook signature without floorMap. This plan adds floorMap to the hook as well and passes it to generateDirections inside the hook's useMemo. The hook update is in useRouteDirections.ts — add it here alongside the FloorPlanCanvas wiring (both changes are small, same concern).

From src/client/components/FloorPlanCanvas.tsx (current relevant lines):
```typescript
// Line 76-78: nodeMap built from nodes
const nodeMap = useMemo<Map<string, NavNode>>(() => {
  return new Map(nodes.map((n) => [n.id, n]))
}, [nodes])

// Line 81-86: two useRouteDirections calls (currently no floorMap)
const standardDirections = useRouteDirections(routeResult?.standard ?? null, nodeMap, 'standard')
const accessibleDirections = useRouteDirections(
  routeResult?.accessible ?? null,
  nodeMap,
  'accessible',
)
```

floorMap to build (add after nodeMap useMemo):
```typescript
const floorMap = useMemo<Map<number, NavFloor>>(() => {
  if (graphState.status !== 'loaded') return new Map()
  return new Map(
    graphState.data.buildings.flatMap((b) => b.floors).map((f) => [f.id, f])
  )
}, [graphState])
```

Updated useRouteDirections calls:
```typescript
const standardDirections = useRouteDirections(routeResult?.standard ?? null, nodeMap, 'standard', floorMap)
const accessibleDirections = useRouteDirections(
  routeResult?.accessible ?? null,
  nodeMap,
  'accessible',
  floorMap,
)
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add floorMap to useRouteDirections hook and wire FloorPlanCanvas</name>
  <files>src/client/hooks/useRouteDirections.ts, src/client/components/FloorPlanCanvas.tsx</files>
  <action>
    Two small changes:

    **1. useRouteDirections.ts — add floorMap to hook:**
    Add optional `floorMap?: Map<number, NavFloor>` as 4th parameter to `useRouteDirections`. Update the useMemo body to pass `floorMap` as 4th argument to `generateDirections`. Import `NavFloor` from `@shared/types` at the top (it is already in scope from Plan 03's generateDirections change). Add `floorMap` to the useMemo dependency array.

    **2. FloorPlanCanvas.tsx — build floorMap and pass to calls:**
    a. Import `NavFloor` from `@shared/types` (add to existing import line for NavNode).
    b. Add `floorMap` useMemo after the existing `nodeMap` useMemo (around line 79):
       ```typescript
       const floorMap = useMemo<Map<number, NavFloor>>(() => {
         if (graphState.status !== 'loaded') return new Map()
         return new Map(
           graphState.data.buildings.flatMap((b) => b.floors).map((f) => [f.id, f])
         )
       }, [graphState])
       ```
    c. Update both `useRouteDirections` calls to pass `floorMap` as the 4th argument.

    Do NOT change any other part of FloorPlanCanvas.tsx — no layout, no rendering, no other hooks.

    After changes: run `grep -r "flattenNavGraph" src/ --include="*.ts" --include="*.tsx" -l` — output must list only `src/shared/pathfinding/graph-builder.ts` (the export definition). No other file — especially not FloorPlanCanvas.tsx or any hook — should import or call flattenNavGraph.
  </action>
  <verify>
    <automated>npm test && npx tsc --noEmit</automated>
  </verify>
  <done>
    floorMap useMemo in FloorPlanCanvas.tsx. Both useRouteDirections calls pass floorMap as 4th argument. useRouteDirections hook passes floorMap through to generateDirections. No flattenNavGraph imports anywhere. npm test passes. npx tsc --noEmit exits 0.
  </done>
</task>

</tasks>

<verification>
Run the full test suite and TypeScript compiler:
```
npm test
npx tsc --noEmit
```
Both must exit 0. Also verify:
```
grep -r "flattenNavGraph" src/ --include="*.ts" --include="*.tsx" -l
```
Must list only `src/shared/pathfinding/graph-builder.ts` — no other file imports or calls flattenNavGraph. The export is intentionally retained for the admin editor (MapEditorCanvas.tsx in Phase 18); no call-site files should reference it.
</verification>

<success_criteria>
- useRouteDirections hook accepts optional floorMap 4th parameter and passes it to generateDirections
- FloorPlanCanvas builds floorMap from loaded NavGraph (Map<number, NavFloor>)
- Both standardDirections and accessibleDirections calls pass floorMap
- flattenNavGraph is not imported by any file other than graph-builder.ts (the export is kept; no call-site imports it)
- npm test: all pass
- npx tsc --noEmit: 0 errors
</success_criteria>

<output>
After completion, create `.planning/phases/17-multi-floor-pathfinding-engine/17-04-SUMMARY.md`
</output>
