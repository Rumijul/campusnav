---
phase: 18-admin-multi-floor-editor
plan: 05
type: execute
wave: 4
depends_on: [18-02, 18-03, 18-04]
files_modified:
  - src/client/pages/admin/MapEditorCanvas.tsx
autonomous: true
requirements:
  - MFLR-04
  - CAMP-02
  - CAMP-03
  - CAMP-04

must_haves:
  truths:
    - "Building selector dropdown appears between toolbar and canvas; switching buildings updates floor tabs"
    - "Floor tab row renders sorted floor tabs; active tab highlighted in blue"
    - "Switching floor tabs auto-saves current floor silently before loading new floor data"
    - "Campus tab appears in building selector; switching to campus shows campus canvas context"
    - "When Campus is active and no image exists, centered 'Upload campus map to begin' prompt appears and clicking it triggers file upload"
    - "Manage Floors modal opens when Manage Floors button is clicked (building context only)"
    - "New nodes placed on any floor get floorId set to the active floor's DB id (not hardcoded 1)"
    - "handleSave wraps active floor nodes/edges in the correct building/floor NavGraph structure"
    - "Upload button routes to correct endpoint based on active context (floor vs campus)"
  artifacts:
    - path: "src/client/pages/admin/MapEditorCanvas.tsx"
      provides: "Full multi-floor editor with building selector, floor tabs, auto-save, campus mode"
      min_lines: 300
  key_links:
    - from: "MapEditorCanvas building selector"
      to: "useEditorState SWITCH_BUILDING action"
      via: "handleBuildingSwitch dispatches SWITCH_BUILDING then loads first floor"
      pattern: "SWITCH_BUILDING"
    - from: "MapEditorCanvas floor tab"
      to: "useEditorState switchFloor helper"
      via: "handleFloorSwitch calls auto-save then switchFloor with fetched data"
      pattern: "switchFloor"
    - from: "handleSave"
      to: "POST /api/admin/graph"
      via: "NavGraph built from active building/floor with state.nodes and state.edges"
      pattern: "api/admin/graph"
    - from: "campus upload"
      to: "POST /api/admin/campus/image"
      via: "handleFileChange routes to /api/admin/campus/image when activeBuildingId === 'campus'"
      pattern: "api/admin/campus/image"
---

<objective>
Wire all the Phase 18 components together in MapEditorCanvas: building selector, floor tab row, auto-save on floor switch, campus mode, Manage Floors modal, context-sensitive upload, and correct node floorId assignment.

Purpose: This is the integration plan — the canvas is the single component that coordinates all the multi-floor and campus features. Without this rewire, none of the prior plans are user-visible.

Output: MapEditorCanvas.tsx fully rewired for multi-floor editing — the largest single file change in Phase 18.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/phases/18-admin-multi-floor-editor/18-CONTEXT.md
@.planning/phases/18-admin-multi-floor-editor/18-RESEARCH.md
@.planning/phases/18-admin-multi-floor-editor/18-02-SUMMARY.md
@.planning/phases/18-admin-multi-floor-editor/18-03-SUMMARY.md
@.planning/phases/18-admin-multi-floor-editor/18-04-SUMMARY.md

<interfaces>
<!-- Key types the executor will use — extracted from codebase. -->

NavGraph / NavBuilding / NavFloor (src/shared/types.ts):
```typescript
interface NavGraph { buildings: NavBuilding[] }
interface NavBuilding { id: number; name: string; floors: NavFloor[] }
interface NavFloor { id: number; floorNumber: number; imagePath: string; updatedAt: string; nodes: NavNode[]; edges: NavEdge[] }
```

useEditorState return (after Plan 03):
```typescript
{
  state: EditorState,  // includes activeBuildingId, activeFloorId, floorSnapshots, campusSnapshot
  dispatch, recordHistory, handleUndo, handleRedo, canUndo, canRedo,
  switchFloor: (floorId: number, nodes: NavNode[], edges: NavEdge[]) => void,
  switchToCampus: (nodes: NavNode[], edges: NavEdge[]) => void,
}
```

EditorToolbar (after Plan 04):
```typescript
// Additional optional props: onManageFloors?: () => void; isCampusActive?: boolean
```

EditorSidePanel (after Plan 04):
```typescript
// Additional optional props: isCampusActive?: boolean; buildings?: NavBuilding[]
```

NodeMarkerLayer (after Plan 04):
```typescript
// Additional optional prop: isCampusActive?: boolean
```

ManageFloorsModal (from Plan 04):
```typescript
interface ManageFloorsModalProps {
  isOpen: boolean; buildingId: number; floors: NavFloor[]
  onClose: () => void; onFloorAdded: () => void
  onFloorDeleted: () => void; onFloorImageReplaced: () => void
}
```

Campus sentinel: building with name === 'Campus' and floor floorNumber === 0
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Add NavGraph state, building selector row, and floor tab row to MapEditorCanvas</name>
  <files>src/client/pages/admin/MapEditorCanvas.tsx</files>
  <action>
    This is a surgical extension of MapEditorCanvas.tsx — preserve all existing logic, add multi-floor capabilities.

    **1. Add imports:**
    ```typescript
    import type { NavBuilding, NavEdge, NavFloor, NavGraph, NavNode } from '@shared/types'
    import { ManageFloorsModal } from '../../components/admin/ManageFloorsModal'
    ```
    (Remove NavGraph, NavNode from existing import if duplicated — consolidate)

    **2. Add state variables** (inside the component, after existing useState declarations):
    ```typescript
    const [navGraph, setNavGraph] = useState<NavGraph | null>(null)
    const [manageFloorsOpen, setManageFloorsOpen] = useState(false)
    const [isSavingFloor, setIsSavingFloor] = useState(false)
    ```

    **3. Update the initial data load effect** (replace the existing useEffect that fetches GET /api/map):
    ```typescript
    const loadNavGraph = useCallback(async () => {
      try {
        const res = await fetch('/api/map', { credentials: 'include' })
        if (!res.ok) return
        const graph = (await res.json()) as NavGraph
        setNavGraph(graph)
        // Auto-select first real building (non-Campus), first floor
        const firstRealBuilding = graph.buildings.find(b => b.name !== 'Campus')
        if (firstRealBuilding) {
          const firstFloor = firstRealBuilding.floors.sort((a, b) => a.floorNumber - b.floorNumber)[0]
          if (firstFloor) {
            switchFloor(firstFloor.id, firstFloor.nodes, firstFloor.edges)
            dispatch({ type: 'SWITCH_BUILDING', buildingId: firstRealBuilding.id })
          }
        }
      } catch {
        // Silently fail — editor starts empty
      }
    }, [dispatch, switchFloor])  // switchFloor from useEditorState

    useEffect(() => { loadNavGraph() }, [loadNavGraph])
    ```

    **4. Derive helpers from navGraph + state:**
    ```typescript
    const isCampusActive = state.activeBuildingId === 'campus'

    const nonCampusBuildings = (navGraph?.buildings ?? []).filter(b => b.name !== 'Campus')

    const activeBuilding: NavBuilding | undefined = isCampusActive
      ? undefined
      : nonCampusBuildings.find(b => b.id === state.activeBuildingId)

    const sortedFloors: NavFloor[] = (activeBuilding?.floors ?? [])
      .slice()
      .sort((a, b) => a.floorNumber - b.floorNumber)
    ```

    **5. Add handleBuildingSwitch** (switches building context, loads first floor):
    ```typescript
    const handleBuildingSwitch = useCallback(async (value: string) => {
      if (value === 'campus') {
        // Switch to campus context
        const campusBuilding = navGraph?.buildings.find(b => b.name === 'Campus')
        const campusFloor = campusBuilding?.floors[0]
        switchToCampus(campusFloor?.nodes ?? [], campusFloor?.edges ?? [])
        setFloorPlanUrl('/api/campus/image')
      } else {
        const buildingId = Number(value)
        dispatch({ type: 'SWITCH_BUILDING', buildingId })
        const building = navGraph?.buildings.find(b => b.id === buildingId)
        const firstFloor = building?.floors.sort((a, b) => a.floorNumber - b.floorNumber)[0]
        if (firstFloor) {
          switchFloor(firstFloor.id, firstFloor.nodes, firstFloor.edges)
          setFloorPlanUrl(`/api/floor-plan/${buildingId}/${firstFloor.floorNumber}?t=${firstFloor.updatedAt}`)
        }
      }
    }, [navGraph, dispatch, switchFloor, switchToCampus])
    ```

    **6. Add handleFloorSwitch** (auto-saves current floor, loads new floor):
    ```typescript
    const handleFloorSwitch = useCallback(async (floor: NavFloor) => {
      if (floor.id === state.activeFloorId) return
      // Auto-save current floor silently (fire-and-forget)
      if (state.isDirty && !isCampusActive && state.activeFloorId !== null) {
        setIsSavingFloor(true)
        try { await handleSave() } catch { /* silent */ } finally { setIsSavingFloor(false) }
      }
      // Switch floor
      switchFloor(floor.id, floor.nodes, floor.edges)
      setFloorPlanUrl(`/api/floor-plan/${state.activeBuildingId}/${floor.floorNumber}?t=${floor.updatedAt}`)
    }, [state.activeFloorId, state.isDirty, isCampusActive, state.activeBuildingId, switchFloor, handleSave])
    ```

    **7. Add the building selector + floor tab row** in the JSX, BETWEEN the tab bar div and the Map panel div. Insert after the existing tab bar (`{/* Tab bar — always visible */}` div, around line 336):

    ```tsx
    {/* Building selector + floor tab row — only shown on Map tab */}
    {activeTab === 'map' && (
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-1.5 flex-wrap">
        {/* Building / Campus selector */}
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

        {/* Floor tabs — only when a real building is active */}
        {!isCampusActive && sortedFloors.map((floor) => (
          <button
            key={floor.id}
            type="button"
            onClick={() => handleFloorSwitch(floor)}
            disabled={isSavingFloor}
            className={`px-3 py-1 rounded text-sm font-medium ${
              state.activeFloorId === floor.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Floor {floor.floorNumber}
          </button>
        ))}

        {/* Manage Floors button */}
        {!isCampusActive && (
          <button
            type="button"
            onClick={() => setManageFloorsOpen(true)}
            className="ml-auto text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            Manage Floors
          </button>
        )}
      </div>
    )}
    ```

    **8. Add ManageFloorsModal** at the end of the component's JSX (before the closing `</div>`):
    ```tsx
    {manageFloorsOpen && activeBuilding && (
      <ManageFloorsModal
        isOpen={manageFloorsOpen}
        buildingId={activeBuilding.id}
        floors={activeBuilding.floors}
        onClose={() => setManageFloorsOpen(false)}
        onFloorAdded={() => { setManageFloorsOpen(false); loadNavGraph() }}
        onFloorDeleted={() => { setManageFloorsOpen(false); loadNavGraph() }}
        onFloorImageReplaced={() => { loadNavGraph() }}
      />
    )}
    ```

    **9. Update the Campus empty state** in the Map panel div (inside the Stage container, after the Stage element):
    ```tsx
    {/* Campus empty state overlay */}
    {isCampusActive && !image && (
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-auto cursor-pointer"
        onClick={handleUploadClick}
      >
        <div className="text-center text-slate-500 hover:text-slate-700">
          <p className="text-lg font-medium">Upload campus map to begin</p>
          <p className="text-sm">Click to upload an overhead image</p>
        </div>
      </div>
    )}
    ```
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>MapEditorCanvas renders building selector + floor tabs row; NavGraph stored in state; ManageFloorsModal rendered when open; campus empty state overlay renders; TypeScript compiles</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Fix node placement floorId, handleSave, handleFileChange, and pass new props</name>
  <files>src/client/pages/admin/MapEditorCanvas.tsx</files>
  <action>
    Four focused fixes to make all wiring correct:

    **1. Fix node placement floorId** — in handleStageClick where `newNode` is created (around line 155), change the hardcoded `floorId: 1` to use the active floor:
    ```typescript
    const newNode: NavNode = {
      id: generateNodeId('room', 'New Node'),
      type: 'room',
      label: 'New Node',
      x: normX,
      y: normY,
      searchable: true,
      floorId: state.activeFloorId ?? 1,  // use active floor DB id, fallback to 1
    }
    ```

    **2. Fix handleSave** — replace the hardcoded single-building NavGraph with the active context. The existing handleSave (around line 250) wraps everything in building 1 / floor 1. Replace the graph construction:
    ```typescript
    const handleSave = useCallback(async () => {
      if (isCampusActive) {
        // Campus save: find campus building/floor in navGraph
        const campusBuilding = navGraph?.buildings.find(b => b.name === 'Campus')
        if (!campusBuilding) return
        const campusFloor = campusBuilding.floors[0]
        if (!campusFloor) return
        const graph: NavGraph = {
          buildings: [{
            ...campusBuilding,
            floors: [{ ...campusFloor, nodes: state.nodes, edges: state.edges }],
          }],
        }
        const res = await fetch('/api/admin/graph', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(graph),
        })
        if (res.ok) dispatch({ type: 'MARK_SAVED' })
      } else {
        // Building/floor save: wrap active floor nodes into the full NavGraph
        if (!navGraph || !activeBuilding || state.activeFloorId === null) return
        const updatedBuildings = navGraph.buildings.map(b => {
          if (b.id !== activeBuilding.id) return b
          return {
            ...b,
            floors: b.floors.map(f => {
              if (f.id !== state.activeFloorId) return f
              return { ...f, nodes: state.nodes, edges: state.edges }
            }),
          }
        })
        const graph: NavGraph = { buildings: updatedBuildings }
        const res = await fetch('/api/admin/graph', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(graph),
        })
        if (res.ok) dispatch({ type: 'MARK_SAVED' })
      }
    }, [isCampusActive, navGraph, activeBuilding, state.activeFloorId, state.nodes, state.edges, dispatch])
    ```

    **3. Fix handleFileChange** — route to correct endpoint based on active context:
    ```typescript
    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const previewUrl = URL.createObjectURL(file)
      setFloorPlanUrl(previewUrl)
      const formData = new FormData()
      formData.append('image', file)
      if (isCampusActive) {
        await fetch('/api/admin/campus/image', { method: 'POST', credentials: 'include', body: formData })
        // Reload navGraph to pick up new campus building/floor ids
        await loadNavGraph()
      } else {
        // Per-floor upload — use active building/floor numbers
        const floorNumber = activeBuilding?.floors.find(f => f.id === state.activeFloorId)?.floorNumber ?? 1
        await fetch(`/api/admin/floor-plan/${state.activeBuildingId}/${floorNumber}`, {
          method: 'POST', credentials: 'include', body: formData,
        })
      }
    }, [isCampusActive, activeBuilding, state.activeBuildingId, state.activeFloorId, loadNavGraph])
    ```

    **4. Pass new props to existing components** — update the JSX prop lists:

    On `<EditorToolbar ...>`, add:
    ```tsx
    isCampusActive={isCampusActive}
    onManageFloors={() => setManageFloorsOpen(true)}
    ```

    On `<EditorSidePanel ...>`, add:
    ```tsx
    isCampusActive={isCampusActive}
    buildings={nonCampusBuildings}
    ```

    On `<NodeMarkerLayer ...>`, add:
    ```tsx
    isCampusActive={isCampusActive}
    ```

    Note: The Manage Floors button was already added to the building/floor tab row in Task 1 — remove any duplicate if present. The EditorToolbar Manage Floors button uses onManageFloors prop from Plan 04; both the tab row button and the toolbar button open the same modal (setManageFloorsOpen(true)). Keep both — they're in different visual positions. Actually, to avoid confusion, only keep ONE: remove the "Manage Floors" button from the tab row (Task 1 JSX), and let EditorToolbar render it via the onManageFloors prop. This is cleaner.

    Update Task 1's tab row JSX to remove the standalone Manage Floors button — EditorToolbar handles it via onManageFloors prop.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Node placement uses state.activeFloorId; handleSave is context-aware (campus vs floor); handleFileChange routes to correct endpoint; EditorToolbar/SidePanel/NodeMarkerLayer receive new props; TypeScript compiles without errors</done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `npx tsc --noEmit` passes for full project
2. `grep "activeBuildingId\|activeFloorId\|switchFloor\|isCampusActive" src/client/pages/admin/MapEditorCanvas.tsx` returns matches
3. `grep "ManageFloorsModal" src/client/pages/admin/MapEditorCanvas.tsx` returns matches
4. `grep "api/admin/campus/image" src/client/pages/admin/MapEditorCanvas.tsx` returns match
5. `grep "floorId: state.activeFloorId" src/client/pages/admin/MapEditorCanvas.tsx` returns match
</verification>

<success_criteria>
- Building selector dropdown renders in the tab row area; switches buildings + loads first floor
- Floor tabs render sorted by floorNumber; active tab is highlighted
- Auto-save fires silently before floor switch when isDirty
- Campus tab in selector activates campus context; empty state prompt appears when no image
- Manage Floors modal opens from toolbar button; onFloorAdded/onFloorDeleted reload navGraph
- New nodes get floorId: state.activeFloorId (not hardcoded 1)
- handleSave wraps active context (building/floor or campus) correctly
- handleFileChange routes to /api/admin/campus/image when campus active, per-floor route otherwise
- isCampusActive, buildings, isCampusActive props passed to EditorToolbar, EditorSidePanel, NodeMarkerLayer
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/phases/18-admin-multi-floor-editor/18-05-SUMMARY.md`
</output>
