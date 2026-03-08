---
phase: 18-admin-multi-floor-editor
plan: 04
type: execute
wave: 3
depends_on: [18-02, 18-03]
files_modified:
  - src/client/components/admin/ManageFloorsModal.tsx
  - src/client/components/admin/EditorToolbar.tsx
  - src/client/components/admin/EditorSidePanel.tsx
  - src/client/components/admin/NodeMarkerLayer.tsx
autonomous: true
requirements:
  - MFLR-04
  - CAMP-03
  - CAMP-04

must_haves:
  truths:
    - "ManageFloorsModal lists floors with image thumbnail, Replace Image button, and Delete button per row"
    - "Adding a floor requires both floor number and image upload together in one form"
    - "Delete floor with nodes shows confirm dialog: 'Floor X has N nodes. Delete all?'"
    - "EditorToolbar shows Manage Floors button (only when building context active, not campus)"
    - "EditorSidePanel shows building link dropdown when a campus entrance node is selected"
    - "NodeMarkerLayer renders entrance nodes with connectsToBuildingId in amber (#f59e0b) instead of standard entrance green"
  artifacts:
    - path: "src/client/components/admin/ManageFloorsModal.tsx"
      provides: "NEW — Manage Floors modal component"
      min_lines: 80
    - path: "src/client/components/admin/EditorToolbar.tsx"
      provides: "EditorToolbar with onManageFloors prop + campus context awareness"
      contains: "onManageFloors"
    - path: "src/client/components/admin/EditorSidePanel.tsx"
      provides: "EditorSidePanel with campus entrance building link dropdown"
      contains: "connectsToBuildingId"
    - path: "src/client/components/admin/NodeMarkerLayer.tsx"
      provides: "NodeMarkerLayer with campus entrance amber marker color"
      contains: "CAMPUS_ENTRANCE_COLOR"
  key_links:
    - from: "ManageFloorsModal"
      to: "POST /api/admin/floors"
      via: "FormData fetch on Add Floor submit"
      pattern: "api/admin/floors"
    - from: "ManageFloorsModal"
      to: "DELETE /api/admin/floors/:id"
      via: "fetch DELETE on row delete after confirm"
      pattern: "api/admin/floors"
    - from: "EditorSidePanel"
      to: "NavNodeData.connectsToBuildingId"
      via: "onUpdateNode call with connectsToBuildingId value from dropdown"
      pattern: "connectsToBuildingId"
---

<objective>
Create the ManageFloorsModal component and extend EditorToolbar, EditorSidePanel, and NodeMarkerLayer with the floor management and campus-specific UI needed for MFLR-04, CAMP-03, and CAMP-04.

Purpose: These are the UI building blocks for floor management (MFLR-04), campus entrance node editing (CAMP-03, CAMP-04), and visual distinction of campus entrance markers.

Output: Four files — one new (ManageFloorsModal.tsx) and three extended.
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
@.planning/phases/18-admin-multi-floor-editor/18-03-SUMMARY.md

<interfaces>
<!-- Key interfaces the executor needs. Extracted from codebase. -->

NavFloor (from src/shared/types.ts):
```typescript
export interface NavFloor {
  id: number; floorNumber: number; imagePath: string; updatedAt: string
  nodes: NavNode[]; edges: NavEdge[]
}
```

NavBuilding (from src/shared/types.ts):
```typescript
export interface NavBuilding { id: number; name: string; floors: NavFloor[] }
```

NavNodeData (from src/shared/types.ts, after Plan 01):
```typescript
// ...existing fields...
connectsToBuildingId?: number  // added in Plan 01
```

EditorToolbar current props (src/client/components/admin/EditorToolbar.tsx):
```typescript
interface EditorToolbarProps {
  mode: EditorMode; onModeChange: (mode: EditorMode) => void
  onUpload: () => void; onSave: () => void
  onUndo: () => void; onRedo: () => void
  canUndo: boolean; canRedo: boolean; isDirty: boolean; onLogout: () => void
  // ADD: onManageFloors?: () => void; isCampusActive?: boolean
}
```

EditorSidePanel current props (src/client/components/admin/EditorSidePanel.tsx):
```typescript
interface EditorSidePanelProps {
  selectedNode: NavNode | null
  selectedEdge: (NavEdge & { sourceName: string; targetName: string }) | null
  onUpdateNode: (id: string, changes: Partial<NavNode>) => void
  onUpdateEdge: (id: string, changes: Partial<NavEdge>) => void
  onDeleteNode: (id: string) => void; onDeleteEdge: (id: string) => void; onClose: () => void
  // ADD: isCampusActive?: boolean; buildings?: NavBuilding[]
}
```

NodeMarkerLayer existing color constants (verify in NodeMarkerLayer.tsx before editing):
- Entry nodes use green; junction/hallway use gray; elevator uses blue; restroom uses amber
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Create ManageFloorsModal.tsx and extend EditorToolbar.tsx</name>
  <files>src/client/components/admin/ManageFloorsModal.tsx, src/client/components/admin/EditorToolbar.tsx</files>
  <action>
    **Create src/client/components/admin/ManageFloorsModal.tsx** (new file):

    Props interface:
    ```typescript
    interface ManageFloorsModalProps {
      isOpen: boolean
      buildingId: number
      floors: NavFloor[]  // current floors for the selected building
      onClose: () => void
      onFloorAdded: () => void   // callback to re-fetch NavGraph after floor added
      onFloorDeleted: () => void // callback to re-fetch NavGraph after floor deleted
      onFloorImageReplaced: () => void // callback after replace image
    }
    ```

    Implementation requirements:
    - Full-screen backdrop: `fixed inset-0 z-50 flex items-center justify-center bg-black/40`
    - Modal card: `bg-white rounded-lg shadow-xl w-[480px] max-h-[80vh] flex flex-col`
    - Header: "Manage Floors" title + close (x) button
    - Floor list (scrollable): one row per floor, sorted by floorNumber ascending
      - Each row shows: "Floor {floorNumber}" label + small image preview (img tag with `src=/api/floor-plan/{buildingId}/{floorNumber}` + `className="w-12 h-8 object-cover rounded"`) + "Replace Image" button + "Delete" button
      - Replace Image: hidden file input per row; click triggers input click; on file selected, POST multipart to `/api/admin/floor-plan/${buildingId}/${floor.floorNumber}` with field name 'image'; on success call onFloorImageReplaced()
      - Delete button: check floor.nodes.length; if > 0 call `window.confirm('Floor ${floor.floorNumber} has ${floor.nodes.length} nodes. Delete all?')`; if confirmed (or nodes.length === 0), DELETE `/api/admin/floors/${floor.id}` with `credentials: 'include'`; on success call onFloorDeleted()
    - Add Floor form (below list, always visible):
      - Floor number input: `type="number"` min=1 step=1
      - File input: `accept="image/*"` — both required
      - "Add Floor" submit button: disabled until both floor number and file are selected
      - On submit: POST multipart to `/api/admin/floors` with fields: buildingId (text), floorNumber (text), image (File); credentials: 'include'; on success clear form fields + call onFloorAdded()
    - All fetch calls use `credentials: 'include'`
    - Loading state: disable buttons during fetch (useState isSaving)
    - Import NavFloor from '@shared/types'

    **Extend src/client/components/admin/EditorToolbar.tsx**:

    Add two new optional props to EditorToolbarProps:
    ```typescript
    onManageFloors?: () => void
    isCampusActive?: boolean
    ```

    Add "Manage Floors" button in the toolbar — place it after the Upload Floor Plan button, inside the same div, only when `!isCampusActive && onManageFloors`:
    ```tsx
    {!isCampusActive && onManageFloors && (
      <button
        type="button"
        className="bg-white text-gray-700 border border-gray-300 px-3 py-1 rounded text-sm font-medium hover:bg-gray-50"
        onClick={onManageFloors}
      >
        Manage Floors
      </button>
    )}
    ```

    Change the Upload Floor Plan button label to be context-sensitive:
    - When `isCampusActive`: label = "Upload Campus Map"
    - Otherwise: label = "Upload Floor Plan"
    ```tsx
    <button ... onClick={onUpload}>
      {isCampusActive ? 'Upload Campus Map' : 'Upload Floor Plan'}
    </button>
    ```

    All existing props remain unchanged (backward compatible — new props are optional).
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>ManageFloorsModal.tsx exists with floor list + add-floor form + delete confirm; EditorToolbar has onManageFloors optional prop and renders "Manage Floors" button when not campus; TypeScript compiles without errors</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Extend EditorSidePanel and NodeMarkerLayer for campus context</name>
  <files>src/client/components/admin/EditorSidePanel.tsx, src/client/components/admin/NodeMarkerLayer.tsx</files>
  <action>
    **Extend src/client/components/admin/EditorSidePanel.tsx**:

    Add two optional props to EditorSidePanelProps:
    ```typescript
    isCampusActive?: boolean
    buildings?: NavBuilding[]  // non-campus buildings for the link dropdown
    ```

    Add NavBuilding to the import: `import type { NavBuilding, NavEdge, NavNode, NavNodeType } from '@shared/types'`

    In the node editing form section, after the Type dropdown and before the Room Number field, add a "Links to Building" dropdown that renders only when `isCampusActive && selectedNode.type === 'entrance'`:

    ```tsx
    {isCampusActive && selectedNode.type === 'entrance' && (
      <div className="flex flex-col gap-1">
        <label
          htmlFor="node-building-link"
          className="text-xs font-medium text-gray-600 uppercase tracking-wide"
        >
          Links to Building
        </label>
        <select
          id="node-building-link"
          value={selectedNode.connectsToBuildingId ?? ''}
          onChange={(e) => {
            const val = e.target.value
            onUpdateNode(selectedNode.id, {
              ...(val ? { connectsToBuildingId: Number(val) } : { connectsToBuildingId: undefined }),
            })
          }}
          className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">— None —</option>
          {(buildings ?? []).map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          {selectedNode.connectsToBuildingId
            ? 'This entrance bridges to a building for cross-building routing.'
            : 'Select a building to enable cross-building pathfinding.'}
        </p>
      </div>
    )}
    ```

    Note on exactOptionalPropertyTypes: Use `{ connectsToBuildingId: Number(val) }` for set and `{}` for clear — avoid passing undefined directly. Pattern: `onUpdateNode(selectedNode.id, val ? { connectsToBuildingId: Number(val) } : {})` — this avoids the exactOptionalPropertyTypes issue with Partial<NavNode>.

    All existing props remain unchanged (backward compatible).

    **Extend src/client/components/admin/NodeMarkerLayer.tsx**:

    Read the current NodeMarkerLayer.tsx to identify the existing node color constants, then add campus entrance color logic.

    Add a constant near the top of the file (after existing color constants):
    ```typescript
    const CAMPUS_ENTRANCE_COLOR = '#f59e0b'  // amber — visually distinct from standard entrance green
    ```

    Add an optional prop to NodeMarkerLayerProps:
    ```typescript
    isCampusActive?: boolean
    ```

    In the color selection logic for nodes (wherever type === 'entrance' maps to a color), add a conditional:
    - When `isCampusActive && node.connectsToBuildingId` → use `CAMPUS_ENTRANCE_COLOR` (amber)
    - Otherwise use the existing entrance color (green or whatever it currently is)

    The exact location to insert depends on the current color selection code — read the file first to identify the pattern. The change must be: if `isCampusActive` and the node is type 'entrance' and has connectsToBuildingId set, use amber. All other nodes use existing colors unchanged.

    All existing props remain unchanged (backward compatible — new prop is optional).
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>EditorSidePanel shows "Links to Building" dropdown for campus entrance nodes; NodeMarkerLayer renders campus entrance nodes in amber when connectsToBuildingId is set; TypeScript compiles without errors</done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `npx tsc --noEmit` passes for full project
2. `ls src/client/components/admin/ManageFloorsModal.tsx` — file exists
3. `grep "onManageFloors" src/client/components/admin/EditorToolbar.tsx` — returns match
4. `grep "connectsToBuildingId" src/client/components/admin/EditorSidePanel.tsx` — returns match
5. `grep "CAMPUS_ENTRANCE_COLOR" src/client/components/admin/NodeMarkerLayer.tsx` — returns match
</verification>

<success_criteria>
- ManageFloorsModal.tsx: floor list with image preview, replace image, delete with confirm dialog, add-floor form requiring both floor number and image
- EditorToolbar: onManageFloors optional prop, Manage Floors button when not campus, context-sensitive upload label
- EditorSidePanel: isCampusActive + buildings props, building link dropdown for campus entrance nodes only
- NodeMarkerLayer: isCampusActive prop, amber color for campus entrance nodes with connectsToBuildingId
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/phases/18-admin-multi-floor-editor/18-04-SUMMARY.md`
</output>
