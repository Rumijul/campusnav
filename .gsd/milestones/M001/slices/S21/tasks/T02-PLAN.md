---
phase: 19-student-floor-tab-ui
plan: "01"
type: tdd
wave: 1
depends_on: ["19-00"]
files_modified:
  - src/client/hooks/useFloorFiltering.ts
  - src/client/hooks/useFloorPlanImage.ts
autonomous: true
requirements: [MFLR-05, MFLR-06, CAMP-05]

must_haves:
  truths:
    - "filterNodesByActiveFloor returns only active-floor nodes plus dimmed adjacent-floor elevator nodes"
    - "filterNodesByActiveFloor excludes stairs/ramp nodes from adjacent floors (remain student-invisible)"
    - "filterRouteSegmentByFloor returns only nodeIds on the active floor"
    - "filterRouteSegmentByFloor returns [] when route has no nodes on the active floor"
    - "totalFloorCount sums floors across all buildings correctly"
    - "useFloorPlanImage accepts a target param and builds the correct URL"
    - "All 7 Wave 0 tests pass (GREEN)"
  artifacts:
    - path: "src/client/hooks/useFloorFiltering.ts"
      provides: "Three exported pure functions: filterNodesByActiveFloor, filterRouteSegmentByFloor, totalFloorCount"
      exports: ["filterNodesByActiveFloor", "filterRouteSegmentByFloor", "totalFloorCount"]
    - path: "src/client/hooks/useFloorPlanImage.ts"
      provides: "Parameterized image hook accepting target: { buildingId, floorNumber } | 'campus' | undefined"
  key_links:
    - from: "src/client/hooks/useFloorFiltering.test.ts"
      to: "src/client/hooks/useFloorFiltering.ts"
      via: "named imports of pure functions"
      pattern: "filterNodesByActiveFloor|filterRouteSegmentByFloor|totalFloorCount"
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/hooks/useFloorPlanImage.ts"
      via: "useFloorPlanImage({ buildingId, floorNumber }) call (wired in Plan 03)"
      pattern: "useFloorPlanImage"
---

<objective>
Create the pure-function filtering module and parameterize the floor plan image hook. This is the GREEN phase of the TDD loop started in Plan 00.

Purpose: Provides the tested, reusable logic that FloorPlanCanvas (Plan 03) will call — keeps the canvas component free of complex filtering logic.
Output: `useFloorFiltering.ts` with 3 exported pure functions; updated `useFloorPlanImage.ts` with optional `target` param.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/19-student-floor-tab-ui/19-CONTEXT.md
@.planning/phases/19-student-floor-tab-ui/19-RESEARCH.md
@src/client/hooks/useFloorFiltering.test.ts
@src/client/hooks/useFloorPlanImage.ts
@src/shared/types.ts

<interfaces>
<!-- Types consumed by the new pure functions -->
<!-- Source: src/shared/types.ts -->
```typescript
export type NavNodeType = 'room'|'entrance'|'elevator'|'stairs'|'ramp'|'restroom'|'junction'|'hallway'|'landmark'

export interface NavNode extends NavNodeData {
  id: string
  floorId: number
  type: NavNodeType
  connectsToFloorAboveId?: number
  connectsToFloorBelowId?: number
}

export interface NavBuilding {
  id: number
  name: string
  floors: NavFloor[]
}
```

<!-- Current useFloorPlanImage (to be updated) -->
<!-- Source: src/client/hooks/useFloorPlanImage.ts -->
```typescript
// CURRENT — hardcoded URLs (legacy)
import useImage from 'use-image'
export function useFloorPlanImage() {
  const [thumb, thumbStatus] = useImage('/api/floor-plan/thumbnail')
  const [full, fullStatus] = useImage('/api/floor-plan/image')
  return { image, isLoading, isFailed, isFullLoaded }
}
```
</interfaces>
</context>

<feature>
  <name>Floor Filtering Pure Functions + useFloorPlanImage Parameterization</name>
  <files>src/client/hooks/useFloorFiltering.ts, src/client/hooks/useFloorPlanImage.ts</files>
  <behavior>
    **filterNodesByActiveFloor(allNodes, activeFloorId)**
    - Returns `{ nodes: NavNode[], dimmedNodeIds: Set<string> }`
    - `nodes` includes: all nodes where `n.floorId === activeFloorId` (at full opacity)
    - `nodes` also includes: elevator nodes from adjacent floors IF `n.connectsToFloorAboveId === activeFloorId || n.connectsToFloorBelowId === activeFloorId` (dimmed)
    - `nodes` excludes: stairs/ramp nodes from non-active floors (remain student-invisible per v1.0 design)
    - `dimmedNodeIds` is the Set of IDs for nodes from non-active floors (adjacent elevator connectors)

    **filterRouteSegmentByFloor(nodeIds, nodeMap, activeFloorId)**
    - Returns `string[]` — subset of nodeIds where `nodeMap.get(id)?.floorId === activeFloorId`
    - Returns `[]` when no nodeIds map to activeFloorId or nodeMap is empty

    **totalFloorCount(buildings)**
    - Returns `number` — sum of `building.floors.length` across all buildings
    - Returns 0 for empty array
    - Returns 1 for single-building single-floor campus
  </behavior>
  <implementation>
    **RED phase:** Plan 00 has already created the failing test file. Do NOT re-create it.

    **GREEN phase — Task 1:** Create `src/client/hooks/useFloorFiltering.ts` implementing the three pure functions with the exact signatures expected by the test file. Run tests to reach GREEN.

    **GREEN phase — Task 2:** Update `src/client/hooks/useFloorPlanImage.ts` to accept an optional `target` parameter:
    - `target?: { buildingId: number; floorNumber: number } | 'campus'`
    - When `target` is `'campus'`: load `/api/campus/image` (single image, no thumbnail)
    - When `target` is `{ buildingId, floorNumber }`: load `/api/floor-plan/${buildingId}/${floorNumber}` (single image, no thumbnail)
    - When `target` is `undefined` (legacy): keep existing thumbnail + full behavior for `/api/floor-plan/thumbnail` and `/api/floor-plan/image`
    - Return shape unchanged: `{ image, isLoading, isFailed, isFullLoaded }`

    **REFACTOR (if needed):** Clean up dead code, add JSDoc comments on the three pure functions.

    **Adjacency rule for filterNodesByActiveFloor:**
    Connector nodes from an adjacent floor are included (dimmed) when:
    - `n.type === 'elevator'` (stairs/ramp remain hidden from students)
    - `n.floorId !== activeFloorId` (it is NOT on the active floor)
    - `n.connectsToFloorAboveId === activeFloorId || n.connectsToFloorBelowId === activeFloorId` (it links to the active floor)
  </implementation>
</feature>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement useFloorFiltering.ts (GREEN)</name>
  <files>src/client/hooks/useFloorFiltering.ts</files>
  <behavior>
    - filterNodesByActiveFloor: active floor nodes included at full opacity; adjacent elevator connectors included as dimmed; stairs/ramp excluded
    - filterRouteSegmentByFloor: filters flat nodeIds array by floorId via nodeMap lookup
    - totalFloorCount: sums b.floors.length across buildings array
  </behavior>
  <action>
Create `src/client/hooks/useFloorFiltering.ts` exporting the three pure functions that satisfy the test stubs in `useFloorFiltering.test.ts`.

```typescript
import type { NavBuilding, NavNode } from '@shared/types'

/** Elevator is the only connector type visible to students (stairs/ramp are routing-infrastructure only) */
const STUDENT_VISIBLE_CONNECTOR_TYPE = 'elevator' as const

/**
 * Filters nodes for display on the active floor canvas.
 * Returns active-floor nodes at full opacity + adjacent-floor elevator
 * connector nodes shown dimmed so students can locate them.
 */
export function filterNodesByActiveFloor(
  allNodes: NavNode[],
  activeFloorId: number,
): { nodes: NavNode[]; dimmedNodeIds: Set<string> } {
  const activeFloorNodes = allNodes.filter(n => n.floorId === activeFloorId)
  const dimmedConnectors = allNodes.filter(
    n =>
      n.type === STUDENT_VISIBLE_CONNECTOR_TYPE &&
      n.floorId !== activeFloorId &&
      (n.connectsToFloorAboveId === activeFloorId || n.connectsToFloorBelowId === activeFloorId),
  )
  const nodes = [...activeFloorNodes, ...dimmedConnectors]
  const dimmedNodeIds = new Set(dimmedConnectors.map(n => n.id))
  return { nodes, dimmedNodeIds }
}

/**
 * Filters a route's nodeIds to those belonging to the active floor.
 * Used to render only the active floor's route segment in RouteLayer.
 */
export function filterRouteSegmentByFloor(
  nodeIds: string[],
  nodeMap: Map<string, NavNode>,
  activeFloorId: number,
): string[] {
  return nodeIds.filter(id => nodeMap.get(id)?.floorId === activeFloorId)
}

/**
 * Total number of floors across all buildings.
 * Used to decide whether to show the FloorTabStrip at all.
 * Tab strip is hidden when totalFloorCount <= 1.
 */
export function totalFloorCount(buildings: NavBuilding[]): number {
  return buildings.reduce((sum, b) => sum + b.floors.length, 0)
}
```

After creating the file, run the tests. All 7 should turn GREEN.
  </action>
  <verify>
    <automated>npx vitest run src/client/hooks/useFloorFiltering.test.ts --reporter=verbose</automated>
  </verify>
  <done>All 7 tests in useFloorFiltering.test.ts pass (GREEN). Module exports three named functions.</done>
</task>

<task type="auto">
  <name>Task 2: Parameterize useFloorPlanImage</name>
  <files>src/client/hooks/useFloorPlanImage.ts</files>
  <action>
Update `src/client/hooks/useFloorPlanImage.ts` to accept an optional `target` parameter. The legacy (no-param) path must continue working unchanged so existing FloorPlanCanvas code does not break before Plan 03 rewires it.

New signature:
```typescript
type FloorTarget =
  | { buildingId: number; floorNumber: number }
  | 'campus'

export function useFloorPlanImage(target?: FloorTarget) { ... }
```

Logic:
- If `target === 'campus'`: use `useImage('/api/campus/image')` — single image, no thumbnail. `image` = campus img when loaded. `isLoading` = true while loading. `isFailed` = status === 'failed'. `isFullLoaded` = status === 'loaded'.
- If `target` is `{ buildingId, floorNumber }`: use `useImage(`/api/floor-plan/${target.buildingId}/${target.floorNumber}`)` — single image. Same status logic as campus case.
- If `target` is `undefined` (legacy): keep existing dual-image (thumbnail + full) behavior exactly as-is.

The hook must always call all `useImage` hooks unconditionally (React rules of hooks — no conditional hook calls). Use a sentinel URL approach: pass `''` (empty string) to `useImage` for unused slots — `useImage` with an empty string does not fetch.

Implementation approach using conditional URLs passed to `useImage`:

```typescript
import useImage from 'use-image'

type FloorTarget = { buildingId: number; floorNumber: number } | 'campus'

export function useFloorPlanImage(target?: FloorTarget) {
  // Multi-floor target URL (campus or specific floor)
  const targetUrl =
    target === 'campus'
      ? '/api/campus/image'
      : target
        ? `/api/floor-plan/${target.buildingId}/${target.floorNumber}`
        : ''

  // Legacy thumbnail URL — only used when target is undefined
  const thumbUrl = target ? '' : '/api/floor-plan/thumbnail'
  // Legacy full URL — only used when target is undefined
  const fullUrl = target ? '' : '/api/floor-plan/image'

  const [targetImg, targetStatus] = useImage(targetUrl)
  const [thumb, thumbStatus] = useImage(thumbUrl)
  const [full, fullStatus] = useImage(fullUrl)

  if (target) {
    // Multi-floor mode: single image, no progressive loading
    return {
      image: targetStatus === 'loaded' ? targetImg : undefined,
      isLoading: targetStatus === 'loading',
      isFailed: targetStatus === 'failed',
      isFullLoaded: targetStatus === 'loaded',
    }
  }

  // Legacy mode: progressive thumbnail + full
  return {
    image: fullStatus === 'loaded' ? full : thumbStatus === 'loaded' ? thumb : undefined,
    isLoading: thumbStatus === 'loading' && fullStatus !== 'loaded',
    isFailed: thumbStatus === 'failed' && fullStatus === 'failed',
    isFullLoaded: fullStatus === 'loaded',
  }
}
```

After updating, ensure the full test suite still passes (no regressions from hook signature change since FloorPlanCanvas still calls `useFloorPlanImage()` with no args until Plan 03).
  </action>
  <verify>
    <automated>npx vitest run src/client/hooks/ src/shared/__tests__/ --reporter=verbose</automated>
  </verify>
  <done>useFloorPlanImage.ts exports a backward-compatible function accepting optional target param. All tests pass.</done>
</task>

</tasks>

<verification>
`npx vitest run` passes with all tests green. No TypeScript errors (`npx tsc --noEmit` clean).
</verification>

<success_criteria>
- useFloorFiltering.ts exported with 3 named pure functions
- All 7 useFloorFiltering.test.ts tests GREEN
- useFloorPlanImage.ts backward-compatible, accepts optional target
- Full Vitest suite green
</success_criteria>

<output>
After completion, create `.planning/phases/19-student-floor-tab-ui/19-01-SUMMARY.md`
</output>
