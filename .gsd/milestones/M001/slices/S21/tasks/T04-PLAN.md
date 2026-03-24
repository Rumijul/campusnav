---
phase: 19-student-floor-tab-ui
plan: "03"
type: execute
wave: 2
depends_on: ["19-01", "19-02"]
files_modified:
  - src/client/components/FloorPlanCanvas.tsx
autonomous: true
requirements: [MFLR-05, MFLR-06, CAMP-05]

must_haves:
  truths:
    - "On app load, Floor 1 of the first non-campus building is the active floor"
    - "FloorTabStrip is visible when totalFloorCount > 1 AND DirectionsSheet is closed"
    - "FloorTabStrip is hidden when DirectionsSheet is open (sheetOpen=true)"
    - "FloorTabStrip is hidden entirely when only one floor exists across all buildings"
    - "Switching floors re-fits the floor plan image to screen via fitToScreen"
    - "Active floor's nodes are shown at full opacity; adjacent elevator connectors are dimmed"
    - "RouteLayer renders only the route segment on the currently active floor"
    - "When Get Directions is triggered, active floor switches to the start node's floor"
    - "Tapping a dimmed elevator connector auto-switches to that node's floor"
    - "Campus building in the building selector shows no floor tabs (campus has one map only)"
  artifacts:
    - path: "src/client/components/FloorPlanCanvas.tsx"
      provides: "Rewired student canvas with full multi-floor state, filtering, FloorTabStrip, auto-switch on route"
      min_lines: 200
  key_links:
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/hooks/useFloorFiltering.ts"
      via: "filterNodesByActiveFloor, filterRouteSegmentByFloor, totalFloorCount imports"
      pattern: "filterNodesByActiveFloor|filterRouteSegmentByFloor|totalFloorCount"
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/hooks/useFloorPlanImage.ts"
      via: "useFloorPlanImage({ buildingId, floorNumber }) parameterized call"
      pattern: "useFloorPlanImage"
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/components/FloorTabStrip.tsx"
      via: "conditional JSX render when showTabStrip is true"
      pattern: "FloorTabStrip"
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/components/LandmarkLayer.tsx"
      via: "filteredNodes and dimmedNodeIds props"
      pattern: "dimmedNodeIds"
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/components/RouteLayer.tsx"
      via: "activeRoutePoints filtered to active floor only"
      pattern: "filterRouteSegmentByFloor"
---

<objective>
Rewire FloorPlanCanvas.tsx with full multi-floor state management: active building/floor state, derived filtering via useMemo, FloorTabStrip rendering, auto-switch on route trigger, default initialization on graph load, and dimmed connector tap handling.

Purpose: This is the integration plan — it connects all pieces from Plans 01 and 02 into the working student-facing experience.
Output: Updated FloorPlanCanvas.tsx implementing all locked decisions from CONTEXT.md.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/19-student-floor-tab-ui/19-CONTEXT.md
@.planning/phases/19-student-floor-tab-ui/19-RESEARCH.md
@src/client/components/FloorPlanCanvas.tsx
@src/client/hooks/useFloorFiltering.ts
@src/client/hooks/useFloorPlanImage.ts
@src/client/components/FloorTabStrip.tsx

<interfaces>
<!-- Pure functions from Plan 01 -->
<!-- Source: src/client/hooks/useFloorFiltering.ts -->
```typescript
export function filterNodesByActiveFloor(
  allNodes: NavNode[],
  activeFloorId: number,
): { nodes: NavNode[]; dimmedNodeIds: Set<string> }

export function filterRouteSegmentByFloor(
  nodeIds: string[],
  nodeMap: Map<string, NavNode>,
  activeFloorId: number,
): string[]

export function totalFloorCount(buildings: NavBuilding[]): number
```

<!-- Updated hook from Plan 01 -->
<!-- Source: src/client/hooks/useFloorPlanImage.ts -->
```typescript
type FloorTarget = { buildingId: number; floorNumber: number } | 'campus'
export function useFloorPlanImage(target?: FloorTarget): {
  image: HTMLImageElement | undefined
  isLoading: boolean
  isFailed: boolean
  isFullLoaded: boolean
}
```

<!-- FloorTabStrip from Plan 02 -->
<!-- Source: src/client/components/FloorTabStrip.tsx -->
```typescript
interface FloorTabStripProps {
  buildings: NavBuilding[]
  campusBuilding: NavBuilding | undefined
  activeBuildingId: number | 'campus' | null
  activeFloorId: number | null
  sortedFloors: NavFloor[]
  onBuildingSwitch: (id: number | 'campus') => void
  onFloorSwitch: (floor: NavFloor) => void
}
export function FloorTabStrip(props: FloorTabStripProps): JSX.Element
```

<!-- LandmarkLayer updated props from Plan 02 -->
<!-- Source: src/client/components/LandmarkLayer.tsx -->
```typescript
interface LandmarkLayerProps {
  nodes: NavNode[]
  imageRect: { x: number; y: number; width: number; height: number } | null
  stageScale: number
  selectedNodeId: string | null
  onSelectNode: (node: NavNode) => void
  hiddenNodeIds?: string[]
  dimmedNodeIds?: Set<string>  // NEW from Plan 02
}
```

<!-- Existing FloorPlanCanvas hooks available -->
<!-- Source: src/client/components/FloorPlanCanvas.tsx -->
```typescript
// Already present:
const graphState = useGraphData()        // { status: 'loading'|'loaded'|'error', data?: NavGraph }
const floorMap = useMemo<Map<number, NavFloor>>(...)   // floorId → NavFloor
const { fitToScreen } = useMapViewport({ stageRef, imageRect, onScaleChange: setStageScale })
const { width, height } = useViewportSize()
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add active floor state, derived data, and default initialization</name>
  <files>src/client/components/FloorPlanCanvas.tsx</files>
  <action>
Add the following to `FloorPlanCanvas.tsx`. All additions go AFTER existing hook calls and BEFORE the return statement. Do not remove or reorganize existing code — add new pieces.

**New state (add after existing useState calls):**
```typescript
const [activeBuildingId, setActiveBuildingId] = useState<number | 'campus' | null>(null)
const [activeFloorId, setActiveFloorId] = useState<number | null>(null)
```

**New derived data (add after existing useMemo calls for nodes/nodeMap/floorMap):**
```typescript
import { filterNodesByActiveFloor, filterRouteSegmentByFloor, totalFloorCount } from '../hooks/useFloorFiltering'
import type { NavBuilding } from '@shared/types'

// All buildings from the graph
const allBuildings = useMemo<NavBuilding[]>(() => {
  if (graphState.status !== 'loaded') return []
  return graphState.data.buildings
}, [graphState])

// Non-campus buildings for the building selector
const nonCampusBuildings = useMemo(
  () => allBuildings.filter(b => b.name !== 'Campus'),
  [allBuildings],
)

// Campus building (may be undefined — only present if admin uploaded campus map)
const campusBuilding = useMemo(
  () => allBuildings.find(b => b.name === 'Campus'),
  [allBuildings],
)

// The active NavBuilding object
const activeBuilding = useMemo(() => {
  if (activeBuildingId === 'campus') return campusBuilding
  if (activeBuildingId === null) return undefined
  return allBuildings.find(b => b.id === activeBuildingId)
}, [activeBuildingId, allBuildings, campusBuilding])

// Sorted floors for the active building (for floor tab buttons)
const sortedActiveFloors = useMemo(
  () => (activeBuilding?.floors ?? []).slice().sort((a, b) => a.floorNumber - b.floorNumber),
  [activeBuilding],
)

// The currently active NavFloor object
const activeFloor = useMemo(
  () => sortedActiveFloors.find(f => f.id === activeFloorId) ?? null,
  [sortedActiveFloors, activeFloorId],
)

// Floor count across all buildings — used to show/hide the tab strip
const floorCount = useMemo(() => totalFloorCount(allBuildings), [allBuildings])

// Show tab strip: only when > 1 total floor AND DirectionsSheet is closed
const showTabStrip = graphState.status === 'loaded' && floorCount > 1 && !sheetOpen

// Filtered nodes for LandmarkLayer — active floor + dimmed adjacent elevator connectors
const { nodes: filteredNodes, dimmedNodeIds } = useMemo(() => {
  if (!activeFloor) return { nodes: [], dimmedNodeIds: new Set<string>() }
  return filterNodesByActiveFloor(nodes, activeFloor.id)
}, [nodes, activeFloor])
```

**Update activeRoutePoints to filter by active floor:**
Replace the existing `activeRoutePoints` useMemo:
```typescript
// BEFORE (old):
const activeRoutePoints = useMemo(() => {
  if (!routeResult) return []
  const result = activeMode === 'standard' ? routeResult.standard : routeResult.accessible
  if (!result.found) return []
  return buildRoutePoints(result.nodeIds)
}, [routeResult, activeMode, buildRoutePoints])

// AFTER (new — floor-filtered):
const activeRoutePoints = useMemo(() => {
  if (!routeResult || !activeFloor) return []
  const result = activeMode === 'standard' ? routeResult.standard : routeResult.accessible
  if (!result.found) return []
  const floorNodeIds = filterRouteSegmentByFloor(result.nodeIds, nodeMap, activeFloor.id)
  return buildRoutePoints(floorNodeIds)
}, [routeResult, activeMode, activeFloor, nodeMap, buildRoutePoints])
```

**Floor image target for useFloorPlanImage:**
Derive the image target BEFORE the `useFloorPlanImage` call. Move/update the hook call:
```typescript
// Compute target for useFloorPlanImage — must be stable (not constructed inline) to avoid hook dependency issues
// Place this BEFORE the useFloorPlanImage call at the top of the component
const floorImageTarget = useMemo<{ buildingId: number; floorNumber: number } | 'campus' | undefined>(() => {
  if (activeBuildingId === 'campus') return 'campus'
  if (!activeBuilding || !activeFloor) return undefined
  return { buildingId: activeBuilding.id, floorNumber: activeFloor.floorNumber }
}, [activeBuildingId, activeBuilding, activeFloor])
```

Then update the `useFloorPlanImage` call at the top of the component:
```typescript
// Change: useFloorPlanImage() → useFloorPlanImage(floorImageTarget)
// Note: floorImageTarget must be computed first — place floorImageTarget useState/useMemo BEFORE this line
```

IMPORTANT: React requires hooks to be called unconditionally at the top level. The `floorImageTarget` useMemo must be declared before `useFloorPlanImage` is called. Reorganize the top of the component to:
1. All useState calls
2. floorImageTarget useMemo (new — needed before the hook call)
3. useFloorPlanImage(floorImageTarget) call (updated)
4. Remaining hook calls and useMemo derivations

**Default initialization useEffect (add after existing useEffects):**
```typescript
// biome-ignore lint/correctness/useExhaustiveDependencies: initialize once on first load
useEffect(() => {
  if (graphState.status !== 'loaded') return
  if (activeFloorId !== null) return // already initialized
  const firstBuilding = graphState.data.buildings.find(b => b.name !== 'Campus')
  if (!firstBuilding) return
  const floor1 = firstBuilding.floors
    .slice()
    .sort((a, b) => a.floorNumber - b.floorNumber)[0]
  if (floor1) {
    setActiveBuildingId(firstBuilding.id)
    setActiveFloorId(floor1.id)
  }
}, [graphState.status])
```

**handleFloorSwitch helper (add after existing useCallback handlers):**
```typescript
const handleFloorSwitch = useCallback(
  (floor: NavFloor) => {
    const building = allBuildings.find(b => b.floors.some(f => f.id === floor.id))
    if (building) setActiveBuildingId(building.id)
    setActiveFloorId(floor.id)
    fitToScreen(width, height, true)
  },
  [allBuildings, width, height, fitToScreen],
)
```

**handleBuildingSwitch helper (add after handleFloorSwitch):**
```typescript
const handleBuildingSwitch = useCallback(
  (id: number | 'campus') => {
    setActiveBuildingId(id)
    if (id === 'campus') {
      // Campus has exactly one map — no floor tabs. Set activeFloorId to campus floor id.
      const campusBld = allBuildings.find(b => b.name === 'Campus')
      const campusFloor = campusBld?.floors[0]
      if (campusFloor) setActiveFloorId(campusFloor.id)
    } else {
      // Switch to floor 1 (lowest floorNumber) of the newly selected building
      const bld = allBuildings.find(b => b.id === id)
      const firstFloor = bld?.floors.slice().sort((a, b) => a.floorNumber - b.floorNumber)[0]
      if (firstFloor) setActiveFloorId(firstFloor.id)
      fitToScreen(width, height, true)
    }
  },
  [allBuildings, width, height, fitToScreen],
)
```

**Update handleLandmarkTap to auto-switch floor when dimmed connector is tapped:**
```typescript
const handleLandmarkTap = useCallback(
  (node: NavNode) => {
    // Auto-switch floor when tapping a node on a different floor (e.g. dimmed elevator connector)
    if (activeFloor && node.floorId !== activeFloor.id) {
      const targetFloor = floorMap.get(node.floorId)
      if (targetFloor) {
        handleFloorSwitch(targetFloor)
        return // Don't open detail sheet on auto-switch tap
      }
    }
    setDetailNode(node)
    routeSelection.setFromTap(node)
  },
  [routeSelection, activeFloor, floorMap, handleFloorSwitch],
)
```

**Update handleRouteTrigger to auto-switch to start node's floor:**
Add to the block after `setSheetOpen(true)`:
```typescript
// Auto-switch to start node's floor so student sees where journey begins
if (routeSelection.start) {
  const startFloor = floorMap.get(routeSelection.start.floorId)
  if (startFloor) handleFloorSwitch(startFloor)
}
```

This goes inside the `if (standard.found || accessible.found)` branch in `handleRouteTrigger`.
  </action>
  <verify>
    <automated>npx vitest run src/client/hooks/ src/shared/__tests__/ --reporter=verbose</automated>
  </verify>
  <done>FloorPlanCanvas compiles without TypeScript errors. State additions, derived data, floor switch handlers, and auto-initialization useEffect are all in place. Full test suite passes.</done>
</task>

<task type="auto">
  <name>Task 2: Wire FloorTabStrip and LandmarkLayer dimmedNodeIds into JSX render</name>
  <files>src/client/components/FloorPlanCanvas.tsx</files>
  <action>
Complete the JSX rewire in the return statement of FloorPlanCanvas.

**Add FloorTabStrip import and render:**
```typescript
import { FloorTabStrip } from './FloorTabStrip'
```

In the JSX, after the toast notification div (near end of component), add:
```tsx
{/* Floor tab strip — hidden when DirectionsSheet is open or only 1 floor total */}
{showTabStrip && (
  <FloorTabStrip
    buildings={nonCampusBuildings}
    campusBuilding={campusBuilding}
    activeBuildingId={activeBuildingId}
    activeFloorId={activeFloorId}
    sortedFloors={sortedActiveFloors}
    onBuildingSwitch={handleBuildingSwitch}
    onFloorSwitch={handleFloorSwitch}
  />
)}
```

**Update LandmarkLayer to pass filteredNodes and dimmedNodeIds:**
Change:
```tsx
<LandmarkLayer
  nodes={nodes}
  imageRect={imageRect}
  stageScale={stageScale}
  selectedNodeId={null}
  onSelectNode={handleLandmarkTap}
  hiddenNodeIds={hiddenNodeIds}
/>
```
To:
```tsx
<LandmarkLayer
  nodes={filteredNodes}
  imageRect={imageRect}
  stageScale={stageScale}
  selectedNodeId={null}
  onSelectNode={handleLandmarkTap}
  hiddenNodeIds={hiddenNodeIds}
  dimmedNodeIds={dimmedNodeIds}
/>
```

**Update SearchOverlay nodes prop:** The search overlay receives `nodes` for the autocomplete list. This should still receive the FULL `nodes` array (all floors), not `filteredNodes` — students need to search for rooms on any floor.

SearchOverlay currently renders: `nodes={nodes}` — keep this unchanged (do not change to filteredNodes).

**Verify canvas legend bottom offset accounts for FloorTabStrip:**
The canvas legend currently uses:
```
style={{ bottom: sheetOpen ? '276px' : detailNode !== null ? '196px' : '16px' }}
```

When the FloorTabStrip is visible (not sheetOpen, not detailNode), the bottom offset should account for the strip height (~48px). Update to:
```tsx
style={{
  bottom: sheetOpen
    ? '276px'
    : detailNode !== null
      ? '196px'
      : showTabStrip
        ? '64px'   // 48px strip height + 16px gap
        : '16px'
}}
```

After completing both tasks, run TypeScript check and full test suite:
```bash
npx tsc --noEmit && npx vitest run
```
  </action>
  <verify>
    <automated>npx vitest run --reporter=verbose</automated>
  </verify>
  <done>FloorTabStrip renders in the student canvas. LandmarkLayer receives filteredNodes and dimmedNodeIds. Canvas legend bottom offset accounts for tab strip. TypeScript clean. Full test suite passes.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes (no TypeScript errors)
- `npx vitest run` passes (all tests green)
- FloorPlanCanvas.tsx imports FloorTabStrip, filterNodesByActiveFloor, filterRouteSegmentByFloor, totalFloorCount
- grep confirms: `grep -n "showTabStrip\|filteredNodes\|dimmedNodeIds\|handleFloorSwitch\|handleBuildingSwitch" src/client/components/FloorPlanCanvas.tsx`
</verification>

<success_criteria>
- FloorPlanCanvas has activeBuildingId / activeFloorId state
- Default initialization useEffect fires once on graph load
- handleFloorSwitch and handleBuildingSwitch are useCallback helpers
- handleRouteTrigger auto-switches to start floor
- handleLandmarkTap auto-switches floor when dimmed connector tapped
- activeRoutePoints filtered to active floor via filterRouteSegmentByFloor
- FloorTabStrip rendered conditionally (showTabStrip)
- LandmarkLayer receives filteredNodes + dimmedNodeIds
- Full test suite green, TypeScript clean
</success_criteria>

<output>
After completion, create `.planning/phases/19-student-floor-tab-ui/19-03-SUMMARY.md`
</output>
