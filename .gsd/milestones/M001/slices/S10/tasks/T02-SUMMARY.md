---
phase: 09-admin-map-editor-visual
plan: 02
subsystem: ui
tags: [react, konva, react-konva, use-image, tailwind, admin, editor, canvas]

# Dependency graph
requires:
  - phase: 09-admin-map-editor-visual-01
    provides: useEditorState hook (useReducer + undo/redo), POST /api/admin/graph, POST /api/admin/floor-plan
  - phase: 02-floor-plan-rendering
    provides: FloorPlanImage component, useMapViewport hook, useViewportSize hook
  - phase: 04-map-landmarks-location-display
    provides: LandmarkMarker counter-scale pattern, onScaleChange callback
provides:
  - MapEditorCanvas component — full-screen Konva editor with floor plan, node placement, drag, upload, save, undo/redo
  - EditorToolbar component — horizontal toolbar with mode buttons, upload, save, undo/redo, logout
  - NodeMarkerLayer component — landmark pin markers + navigation dot markers with selection ring
  - Updated AdminShell — mounts MapEditorCanvas as full-screen editor (replaces placeholder)
affects: [09-03, 09-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Counter-scaled Konva Groups (scaleX={1/stageScale}) for constant screen-pixel markers during zoom
    - Layer.getRelativePointerPosition() for transform-aware coordinate conversion
    - EditorToolbar as absolute-positioned HTML overlay above Konva Stage (z-10)
    - Blob URL from URL.createObjectURL() for instant floor plan preview before server response
    - Stage draggable={mode === 'select'} — disable stage pan in placement modes so canvas clicks place nodes

key-files:
  created:
    - src/client/pages/admin/MapEditorCanvas.tsx
    - src/client/components/admin/EditorToolbar.tsx
    - src/client/components/admin/NodeMarkerLayer.tsx
  modified:
    - src/client/pages/admin/AdminShell.tsx

key-decisions:
  - "NodeMarkerLayer renders as its own <Layer> — clean encapsulation matching LandmarkLayer pattern in student view"
  - "FloorPlanImage reused directly in editor — same viewport-fit calculation works for both student and admin views"
  - "Stage height is viewportHeight - 52px (toolbar height) — toolbar outside Stage preserves Konva coordinate space"
  - "floor plan load from /api/floor-plan/image on mount; blob URL after upload for cache-bust + instant preview"

patterns-established:
  - "NodeMarkerLayer: LANDMARK_TYPES Set for O(1) type classification; TYPE_COLORS Record for marker color by type"
  - "EditorToolbar: modeButtonClass() helper returns tailwind classes — avoids inline ternary duplication"

requirements-completed: [EDIT-01, EDIT-02, EDIT-03]

# Metrics
duration: 3min
completed: 2026-02-21
---

# Phase 9 Plan 02: Admin Map Editor Visual Components Summary

**Konva editor canvas (MapEditorCanvas) + EditorToolbar + NodeMarkerLayer wired into AdminShell — admin can place landmark/navigation nodes, drag to reposition, upload floor plan, undo/redo, and save to server**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-21T06:13:18Z
- **Completed:** 2026-02-21T06:16:15Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created `MapEditorCanvas` — Konva Stage with floor plan image, mode-gated node placement (add-node), node selection/drag (select), keyboard shortcuts (Ctrl+Z/Y/Escape), save to POST /api/admin/graph, and floor plan upload with instant blob URL preview
- Created `NodeMarkerLayer` — renders landmark nodes as colored pin circles with text labels, navigation nodes as small grey dots; selected node gets blue ring; all counter-scaled for zoom-invariant screen size
- Created `EditorToolbar` — horizontal toolbar with Select/Add Node/Add Edge mode buttons (active = blue-600), Upload Floor Plan, Save (green when dirty, grey otherwise), Undo/Redo (disabled when unavailable), Logout; all semantic `<button>` elements
- Updated `AdminShell` — replaced placeholder with full-screen `<MapEditorCanvas>` mounted inside `h-screen w-screen` container; logout passed as prop through toolbar

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MapEditorCanvas with Konva Stage, node placement, and floor plan rendering** - `ac54e96` (feat)
2. **Task 2: Create EditorToolbar and wire MapEditorCanvas into AdminShell** - `bc9d28e` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/client/pages/admin/MapEditorCanvas.tsx` — Top-level editor component; Konva Stage with floorPlanLayerRef for coordinate conversion; useEditorState + useMapViewport + useViewportSize; handles PLACE_NODE, MOVE_NODE, SELECT_NODE, MARK_SAVED; keyboard shortcuts via window listener
- `src/client/components/admin/NodeMarkerLayer.tsx` — Konva Layer; LANDMARK_TYPES Set; landmark markers (Circle + Text) and navigation dots; selection highlight ring; draggable in select mode; onDragEnd normalizes coordinates from pixel position
- `src/client/components/admin/EditorToolbar.tsx` — HTML toolbar (absolute top-0 z-10); modeButtonClass() helper; semantic buttons; disabled states for undo/redo
- `src/client/pages/admin/AdminShell.tsx` — Simplified to h-screen container mounting MapEditorCanvas with onLogout prop

## Decisions Made
- `NodeMarkerLayer` exports as default and renders its own `<Layer>` — clean encapsulation matching the student view's `LandmarkLayer` pattern
- `FloorPlanImage` reused as-is — the viewport-fit rect calculation works identically for the admin editor (same image URL, same padding logic)
- Toolbar is an HTML overlay (not inside Konva Stage) — matches existing `SearchOverlay`/`ZoomControls` pattern; keeps toolbar in normal flow without Konva transform
- Stage height = `editorHeight - 52` — subtracts fixed toolbar height so Stage fills the remaining viewport

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing CRLF line ending format errors across project files reported by `npx biome check .` — same pre-existing issue noted in Plan 01 SUMMARY. All new files pass `npx biome check` cleanly after auto-formatting with `npx biome format --write`.
- Import order warning in MapEditorCanvas.tsx — auto-fixed with `npx biome check --write` (organizeImports).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `MapEditorCanvas` and `NodeMarkerLayer` are ready for Plan 03 (edge creation + properties side panel)
- `EditorToolbar` is extensible — Plan 03 can add edge-related buttons if needed
- All `add-edge` mode click handling in MapEditorCanvas is stubbed as no-op, ready for Plan 03 implementation
- `useEditorState` dispatch actions `CREATE_EDGE`, `SELECT_EDGE`, `SET_PENDING_EDGE_SOURCE` are already typed and available

---
*Phase: 09-admin-map-editor-visual*
*Completed: 2026-02-21*
