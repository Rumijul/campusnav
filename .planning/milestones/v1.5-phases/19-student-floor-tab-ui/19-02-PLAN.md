---
phase: 19-student-floor-tab-ui
plan: "02"
type: execute
wave: 1
depends_on: ["19-00"]
files_modified:
  - src/client/components/LandmarkMarker.tsx
  - src/client/components/LandmarkLayer.tsx
  - src/client/components/FloorTabStrip.tsx
autonomous: true
requirements: [MFLR-06, CAMP-05]

must_haves:
  truths:
    - "LandmarkMarker renders at opacity 0.35 when isDimmed prop is true"
    - "LandmarkLayer accepts dimmedNodeIds prop and passes isDimmed=true to markers in the set"
    - "FloorTabStrip renders building selector and floor tab buttons matching admin editor visual style"
    - "FloorTabStrip is hidden when DirectionsSheet is open (sheetOpen prop)"
    - "Campus building shows no floor tabs (only the building selector entry)"
  artifacts:
    - path: "src/client/components/FloorTabStrip.tsx"
      provides: "New HTML overlay component for building selector + floor tab buttons"
      exports: ["FloorTabStrip"]
    - path: "src/client/components/LandmarkMarker.tsx"
      provides: "Updated with optional isDimmed prop reducing opacity to 0.35"
    - path: "src/client/components/LandmarkLayer.tsx"
      provides: "Updated with dimmedNodeIds?: Set<string> prop; passes isDimmed to markers"
  key_links:
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/components/FloorTabStrip.tsx"
      via: "JSX render in Plan 03 rewire"
      pattern: "FloorTabStrip"
    - from: "src/client/components/LandmarkLayer.tsx"
      to: "src/client/components/LandmarkMarker.tsx"
      via: "isDimmed prop passed when node.id in dimmedNodeIds"
      pattern: "isDimmed"
---

<objective>
Build the UI components needed for floor navigation: dimmed marker support in LandmarkMarker/LandmarkLayer, and the new FloorTabStrip HTML overlay.

Purpose: These components are the visual layer; Plan 03 will wire them into FloorPlanCanvas with real state. This plan can run parallel to Plan 01 (different files, no shared dependency).
Output: FloorTabStrip.tsx (new), LandmarkMarker.tsx (updated), LandmarkLayer.tsx (updated).
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/19-student-floor-tab-ui/19-CONTEXT.md
@.planning/phases/19-student-floor-tab-ui/19-RESEARCH.md
@src/client/components/LandmarkMarker.tsx
@src/client/components/LandmarkLayer.tsx

<interfaces>
<!-- Current LandmarkMarkerProps — to be extended -->
<!-- Source: src/client/components/LandmarkMarker.tsx -->
```typescript
interface LandmarkMarkerProps {
  node: NavNode
  imageRect: { x: number; y: number; width: number; height: number }
  stageScale: number
  isSelected: boolean
  isLabelVisible: boolean
  onClick: () => void
  // NEW: isDimmed?: boolean — added in this plan
}
```

<!-- Current LandmarkLayerProps — to be extended -->
<!-- Source: src/client/components/LandmarkLayer.tsx -->
```typescript
interface LandmarkLayerProps {
  nodes: NavNode[]
  imageRect: { x: number; y: number; width: number; height: number } | null
  stageScale: number
  selectedNodeId: string | null
  onSelectNode: (node: NavNode) => void
  hiddenNodeIds?: string[]
  // NEW: dimmedNodeIds?: Set<string> — added in this plan
}

const VISIBLE_NODE_TYPES: NavNodeType[] = ['room', 'entrance', 'elevator', 'restroom', 'landmark']
```

<!-- NavBuilding + NavFloor for FloorTabStrip props -->
<!-- Source: src/shared/types.ts -->
```typescript
export interface NavBuilding { id: number; name: string; floors: NavFloor[] }
export interface NavFloor { id: number; floorNumber: number; imagePath: string; updatedAt: string; nodes: NavNode[]; edges: NavEdge[] }
```

<!-- Admin editor building selector pattern to replicate -->
<!-- Source: src/client/pages/admin/MapEditorCanvas.tsx lines 472-398 -->
```tsx
<select
  value={isCampusActive ? 'campus' : String(state.activeBuildingId)}
  onChange={(e) => handleBuildingSwitch(e.target.value)}
  className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
>
  <option value="campus">Campus</option>
  {nonCampusBuildings.map((b) => (
    <option key={b.id} value={String(b.id)}>{b.name}</option>
  ))}
</select>
{!isCampusActive && sortedFloors.map((floor) => (
  <button
    key={floor.id}
    type="button"
    onClick={() => handleFloorSwitch(floor)}
    className={`px-3 py-1 rounded text-sm font-medium ${
      state.activeFloorId === floor.id
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    Floor {floor.floorNumber}
  </button>
))}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add isDimmed support to LandmarkMarker and LandmarkLayer</name>
  <files>src/client/components/LandmarkMarker.tsx, src/client/components/LandmarkLayer.tsx</files>
  <action>
**LandmarkMarker.tsx:** Add optional `isDimmed?: boolean` prop. When true, render the Konva Group with `opacity={0.35}`. The Group already wraps all visual elements (Circle + Text), so a single `opacity` prop on the Group handles everything. Keep all other props and behavior unchanged.

```tsx
// Updated prop interface
interface LandmarkMarkerProps {
  node: NavNode
  imageRect: { x: number; y: number; width: number; height: number }
  stageScale: number
  isSelected: boolean
  isLabelVisible: boolean
  onClick: () => void
  isDimmed?: boolean  // NEW
}

// Updated Group render — add opacity prop
<Group
  x={pixelX}
  y={pixelY}
  scaleX={scale}
  scaleY={scale}
  onClick={onClick}
  onTap={onClick}
  opacity={isDimmed ? 0.35 : 1}  // NEW
>
```

**LandmarkLayer.tsx:** Add optional `dimmedNodeIds?: Set<string>` prop. Pass `isDimmed={dimmedNodeIds?.has(node.id) ?? false}` to each `LandmarkMarker`. This prop is optional — when not provided (undefined), no markers are dimmed (backward compatible with existing callers like the admin editor if it ever uses this component).

```tsx
interface LandmarkLayerProps {
  nodes: NavNode[]
  imageRect: { x: number; y: number; width: number; height: number } | null
  stageScale: number
  selectedNodeId: string | null
  onSelectNode: (node: NavNode) => void
  hiddenNodeIds?: string[]
  dimmedNodeIds?: Set<string>  // NEW
}

// In the map:
<LandmarkMarker
  key={node.id}
  node={node}
  imageRect={imageRect}
  stageScale={stageScale}
  isSelected={node.id === selectedNodeId}
  isLabelVisible={node.id === selectedNodeId || stageScale >= 2.0}
  onClick={() => onSelectNode(node)}
  isDimmed={dimmedNodeIds?.has(node.id) ?? false}  // NEW
/>
```

Both changes are additive — no breaking changes to existing call sites.
  </action>
  <verify>
    <automated>npx vitest run src/client/hooks/ src/shared/__tests__/ --reporter=verbose</automated>
  </verify>
  <done>LandmarkMarker renders with opacity 0.35 when isDimmed=true. LandmarkLayer accepts dimmedNodeIds prop and passes isDimmed correctly. Full test suite green.</done>
</task>

<task type="auto">
  <name>Task 2: Create FloorTabStrip component</name>
  <files>src/client/components/FloorTabStrip.tsx</files>
  <action>
Create `src/client/components/FloorTabStrip.tsx` — a fixed-position HTML overlay anchored to the bottom of the viewport. This component is a read-only presenter: all state lives in FloorPlanCanvas (wired in Plan 03).

Props interface:
```typescript
interface FloorTabStripProps {
  /** Non-campus buildings for the building selector */
  buildings: NavBuilding[]
  /** Campus building if one exists (optional — may not be configured) */
  campusBuilding: NavBuilding | undefined
  /** Currently active building ID; 'campus' for the campus overhead view */
  activeBuildingId: number | 'campus' | null
  /** Currently active floor ID */
  activeFloorId: number | null
  /** Sorted floors of the active building (empty when campus is active) */
  sortedFloors: NavFloor[]
  /** Called when user selects a different building from the dropdown */
  onBuildingSwitch: (id: number | 'campus') => void
  /** Called when user taps a floor tab button */
  onFloorSwitch: (floor: NavFloor) => void
}
```

Layout: fixed bottom, z-30 (below DirectionsSheet z-50 and LocationDetailSheet z-40). White background with top border. Flex row with building selector + floor tabs.

```tsx
export function FloorTabStrip({
  buildings,
  campusBuilding,
  activeBuildingId,
  activeFloorId,
  sortedFloors,
  onBuildingSwitch,
  onFloorSwitch,
}: FloorTabStripProps) {
  const isCampusActive = activeBuildingId === 'campus'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-3 py-2 flex items-center gap-2 overflow-x-auto">
      {/* Building selector */}
      <select
        value={isCampusActive ? 'campus' : String(activeBuildingId ?? '')}
        onChange={(e) => {
          const val = e.target.value
          onBuildingSwitch(val === 'campus' ? 'campus' : Number(val))
        }}
        className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 shrink-0"
      >
        {campusBuilding && <option value="campus">Campus</option>}
        {buildings.map((b) => (
          <option key={b.id} value={String(b.id)}>{b.name}</option>
        ))}
      </select>

      {/* Floor tabs — hidden when campus is active (campus has no floor tabs) */}
      {!isCampusActive && sortedFloors.map((floor) => (
        <button
          key={floor.id}
          type="button"
          onClick={() => onFloorSwitch(floor)}
          className={`px-3 py-1 rounded text-sm font-medium shrink-0 ${
            floor.id === activeFloorId
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Floor {floor.floorNumber}
        </button>
      ))}
    </div>
  )
}
```

Key constraints:
- `z-30`: renders below DirectionsSheet (z-50) and LocationDetailSheet (z-40)
- `overflow-x-auto`: handles buildings with many floors without wrapping
- `shrink-0` on buttons: prevents flex compression on small screens
- No `safe-area-inset` padding yet — acceptable for initial implementation (Claude's Discretion)

The component does NOT manage its own visibility. The caller (FloorPlanCanvas) will conditionally render it: `{showTabStrip && <FloorTabStrip ... />}`. Do not add internal visibility logic.
  </action>
  <verify>
    <automated>npx vitest run --reporter=verbose 2>&1 | tail -10</automated>
  </verify>
  <done>FloorTabStrip.tsx created with correct props interface. Full test suite still passes (no regressions). Component is importable from FloorPlanCanvas in Plan 03.</done>
</task>

</tasks>

<verification>
`npx vitest run` passes. TypeScript compilation clean: `npx tsc --noEmit`. FloorTabStrip.tsx exists and exports the component. LandmarkMarker and LandmarkLayer accept new optional props without breaking existing callers.
</verification>

<success_criteria>
- LandmarkMarker accepts isDimmed prop; renders at opacity 0.35 when true
- LandmarkLayer accepts dimmedNodeIds prop; backward-compatible (optional)
- FloorTabStrip.tsx exists with correct prop types and Tailwind styling matching admin editor pattern
- All tests green
</success_criteria>

<output>
After completion, create `.planning/phases/19-student-floor-tab-ui/19-02-SUMMARY.md`
</output>
