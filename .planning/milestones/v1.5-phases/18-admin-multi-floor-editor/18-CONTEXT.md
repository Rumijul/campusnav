# Phase 18: Admin Multi-floor Editor - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Extends the admin map editor to support two new capabilities:
1. **Multi-floor editing** — Admin can add/remove floors per building (floor number + image required together) and switch between floors to edit their node graphs independently.
2. **Campus outdoor map editing** — Admin can upload an overhead campus image and place outdoor path nodes + building entrance markers that bridge the outdoor graph to each building's floor 1.

Creating new buildings, student-facing floor tab UI, and cross-building route rendering are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Floor switching UX
- Floor tabs appear between the toolbar and the canvas (second row)
- Active floor tab shows only that floor's image and nodes/edges — no cross-floor overlays
- Unsaved changes on the current floor are **auto-saved** before switching tabs (silent, no interruption)
- A **building selector** (dropdown or button group) sits above the floor tab row; switching buildings updates the floor tabs

### Floor management workflow
- A **"Manage Floors" button** in the EditorToolbar opens a modal dialog
- Modal lists all floors for the selected building; each row has: floor number, image preview, Replace Image button, and Delete (×)
- Adding a floor: both **floor number and image upload are required** together in one form — no empty floors
- Removing a floor with nodes: **confirm dialog showing "Floor X has N nodes. Delete all?"** — explicit, not blocked, not soft-delete
- Replace Image: available per floor in the Manage Floors modal; nodes are preserved (coordinates are normalized 0–1)

### Campus map editing
- **"Campus" tab** appears at the top level alongside building name tabs (e.g., "Campus | Building A")
- Campus editor reuses the same Konva canvas infrastructure as the floor editor
- Two node types on the campus map: **outdoor path nodes** (junctions/hallways for routing) and **building entrance markers** (link to a specific building's floor 1)
- Existing `NavNodeType` values (`'entrance'`, `'junction'`, `'hallway'`) are reused — no new node types needed
- Campus image upload: **context-sensitive** — when Campus tab is active, the toolbar Upload button targets the campus image
- Empty state (no campus image yet): **"Upload campus map to begin" prompt** centered on the canvas, click triggers upload

### Building entrance linking
- **Claude's discretion** — how the admin specifies which building/floor-1 node an entrance links to (side panel dropdown is the likely approach)
- **Claude's discretion** — whether a campus entrance node must link to a specific floor-1 node or just a building (implement whatever enables accurate pathfinding per CAMP-04)
- Multiple campus entrance nodes can link to the **same building** — each can represent a different door (front, back, accessible ramp)
- Entrance nodes on the campus map use a **visually distinct marker** (different color or icon) vs. regular outdoor path nodes — so the admin can identify bridge points at a glance

### Claude's Discretion
- How `NavNodeData` / `NavNode` is extended to carry the campus-to-building bridge FK (e.g., `connectsToBuildingId` or similar)
- Whether the campus map is stored as a special building+floor in the DB or as a separate entity
- Exact visual styling for entrance node markers on the canvas
- Campus image upload API endpoint design
- How the Manage Floors modal integrates with existing toolbar (button placement, modal vs. sheet)

</decisions>

<specifics>
## Specific Ideas

- The floor tab row mirrors what students will see in Phase 19 (per-floor tabs on the student map) — keeping the spatial metaphor consistent is a bonus
- Auto-save on floor switch means the explicit "Save" button in the toolbar is still useful for confirming a final state, but is no longer the only safety net

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MapEditorCanvas.tsx` — main Konva editor; needs floor-awareness wired in (floor tab state, active floor image/nodes)
- `EditorToolbar.tsx` — add "Manage Floors" button and make Upload Floor Plan context-sensitive (active floor vs. campus)
- `EditorSidePanel.tsx` — will show building-link properties when an entrance node is selected on the campus map
- `useEditorState.ts` — current reducer handles a single flat `nodes[]`/`edges[]`; will need to be scoped per floor (or a new per-floor editor state hook)
- `FloorPlanImage.tsx` + `useFloorPlanImage.ts` — currently loads `/api/floor-plan/image`; must accept `buildingId` + `floorNumber` (API `GET /api/floor-plan/:buildingId/:floorNumber` already exists)
- `NavNodeType` — `'entrance'`, `'junction'`, `'hallway'` are all present; no schema changes needed for node types

### Established Patterns
- Konva `Stage` + `Layer` pattern for canvas rendering — all editor layers use this
- `useReducer` + action dispatch in `useEditorState` for editor state — extend to support multi-floor
- Normalized coordinates (0.0–1.0) for all node positions — consistent across all floors and campus map
- Tailwind CSS for all styling
- Drizzle ORM for DB — `buildings`, `floors`, `nodes`, `edges` tables already have multi-building/multi-floor schema

### Integration Points
- `EditorToolbar` → add "Manage Floors" button (new modal) + conditional upload target
- `MapEditorCanvas` → add building selector + floor tab row above canvas; swap active floor image + state
- `useEditorState` → likely split into per-floor instances or extend state shape to include `activeFloorId`
- `POST /api/admin/floor-plan` (existing, single-floor) → replace/augment with `POST /api/admin/floor-plan/:buildingId/:floorNumber`
- Server needs new routes: `POST /api/admin/floors` (add floor), `DELETE /api/admin/floors/:id` (remove floor with nodes), campus image upload

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 18-admin-multi-floor-editor*
*Context gathered: 2026-03-01*
