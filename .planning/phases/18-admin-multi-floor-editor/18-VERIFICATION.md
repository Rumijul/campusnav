---
phase: 18-admin-multi-floor-editor
verified: 2026-03-07T08:30:00Z
status: human_needed
score: 26/26 automated must-haves verified
re_verification: false
human_verification:
  - test: "Building selector + floor tabs render and switch correctly"
    expected: "Selector dropdown shows Campus + non-campus buildings; floor tabs appear sorted by floorNumber; clicking a tab loads that floor's image and nodes; active tab highlighted blue"
    why_human: "React-Konva canvas rendering and tab interaction require browser verification"
  - test: "Floor switch auto-saves silently"
    expected: "When isDirty, switching floor tabs triggers a silent background save with no modal or interruption to the admin"
    why_human: "Side-effect timing and UX flow cannot be verified without browser interaction"
  - test: "Manage Floors modal full interaction"
    expected: "Modal opens from toolbar; lists floors with label/thumbnail/Replace/Delete buttons; Add Floor form creates a new floor tab; Delete with nodes shows confirm dialog"
    why_human: "Modal UX, confirm dialogs, and file picker behavior require browser verification"
  - test: "Campus tab empty state and image upload"
    expected: "Selecting Campus hides floor tabs and Manage Floors button; 'Upload campus map to begin' prompt appears centered when no image; clicking it opens file picker; after upload image renders on canvas; toolbar label reads 'Upload Campus Map'"
    why_human: "Visual layout, click-to-upload interaction, and image rendering require browser"
  - test: "Campus entrance node building link and amber color"
    expected: "In Campus context, placing an Entrance node shows 'Links to Building' dropdown in side panel; selecting a building turns the node marker amber (#f59e0b)"
    why_human: "Canvas color rendering and conditional side-panel UI require browser verification"
  - test: "Server starts without migration errors"
    expected: "Server startup applies connects_to_building_id migration cleanly with no FK violations or missing-column errors"
    why_human: "Database migration outcome requires live server run to confirm"
---

# Phase 18: Admin Multi-Floor Editor — Verification Report

**Phase Goal:** Extend the admin map editor to support multiple floors per building and a campus-level overview canvas. Admins can switch between buildings, manage floors (add/delete/replace image), switch floor tabs with auto-save, and place campus entrance nodes that link to buildings.

**Verified:** 2026-03-07T08:30:00Z
**Status:** HUMAN NEEDED — all automated checks pass; 6 items need human browser/server testing
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | nodes table has connects_to_building_id nullable FK in DB schema | VERIFIED | `schema.ts` line 34: `connectsToBuildingId: integer('connects_to_building_id').references(() => buildings.id)` |
| 2 | NavNodeData TypeScript interface includes optional connectsToBuildingId | VERIFIED | `types.ts` line 87: `connectsToBuildingId?: number` with JSDoc |
| 3 | Migration SQL file exists with ALTER TABLE | VERIFIED | `drizzle/0002_campus_entrance_bridge.sql` contains both ALTER TABLE and FK constraint |
| 4 | GET /api/map passes connectsToBuildingId when non-null | VERIFIED | `index.ts` line 190: `...(n.connectsToBuildingId != null && { connectsToBuildingId: n.connectsToBuildingId })` |
| 5 | POST /api/admin/graph saves connectsToBuildingId | VERIFIED | `index.ts` line 268: `connectsToBuildingId: n.connectsToBuildingId ?? null` |
| 6 | POST /api/admin/floors creates floor row + saves image atomically | VERIFIED | `index.ts` line 321: writes file then inserts floor row with returning |
| 7 | DELETE /api/admin/floors/:id deletes edges → nodes → floor in FK-safe order | VERIFIED | `index.ts` lines 356-375: transaction deletes edges (sourceId and targetId), then nodes, then floor |
| 8 | POST /api/admin/floor-plan/:buildingId/:floorNumber saves per-floor image | VERIFIED | `index.ts` line 382: saves `floor-plan-{buildingId}-{floorNumber}.{ext}`, updates imagePath |
| 9 | POST /api/admin/campus/image upserts Campus building+floor, saves campus-map.{ext} | VERIFIED | `index.ts` line 413: full upsert pattern with sentinel floorNumber=0 |
| 10 | GET /api/campus/image serves campus map from DB path | VERIFIED | `index.ts` line 107: queries Campus building → floor → imagePath → readFile |
| 11 | useEditorState exports activeBuildingId and activeFloorId | VERIFIED | `useEditorState.ts` lines 19-21: both in EditorState type and initialState |
| 12 | SWITCH_FLOOR action loads new floor and resets undo history | VERIFIED | Reducer case at line 176 + switchFloor helper at line 308 resets history refs |
| 13 | SWITCH_TO_CAMPUS activates campus context and resets history | VERIFIED | Reducer case at line 195 + switchToCampus helper at line 325 |
| 14 | SWITCH_BUILDING action changes building and resets floor selection | VERIFIED | Reducer case at line 210 |
| 15 | floorSnapshots cache exists in EditorState | VERIFIED | EditorState type line 21, initialState line 58, SWITCH_FLOOR caches at line 189 |
| 16 | ManageFloorsModal lists floors with thumbnail, Replace, and Delete per row | VERIFIED | `ManageFloorsModal.tsx` lines 130-182: sorted floor rows with img/replace/delete |
| 17 | Adding a floor requires both floor number and image upload | VERIFIED | Submit disabled until both `newFloorNumber && newFloorFile` (line 211); form POSTs to `/api/admin/floors` |
| 18 | Delete floor with nodes shows confirm dialog | VERIFIED | `handleDeleteFloor` line 55-61: `window.confirm('Floor X has N nodes. Delete all?')` |
| 19 | EditorToolbar shows Manage Floors button only when not campus | VERIFIED | `EditorToolbar.tsx` lines 82-90: `{!isCampusActive && onManageFloors && ...}` |
| 20 | EditorToolbar upload label is context-sensitive | VERIFIED | Line 80: `{isCampusActive ? 'Upload Campus Map' : 'Upload Floor Plan'}` |
| 21 | EditorSidePanel shows building link dropdown for campus entrance nodes | VERIFIED | `EditorSidePanel.tsx` lines 132-165: conditional on `isCampusActive && selectedNode.type === 'entrance'` |
| 22 | NodeMarkerLayer renders campus entrance nodes in amber | VERIFIED | `NodeMarkerLayer.tsx` lines 61-67: `CAMPUS_ENTRANCE_COLOR = '#f59e0b'` applied when `isCampusActive && type === 'entrance' && connectsToBuildingId != null` |
| 23 | MapEditorCanvas building selector + floor tab row render | VERIFIED | `MapEditorCanvas.tsx` lines 469-501: selector + floor tabs shown on Map tab |
| 24 | Floor switch auto-saves then loads new floor | VERIFIED | `handleFloorSwitch` lines 356-375: calls handleSave when isDirty, then switchFloor |
| 25 | handleSave is context-aware (campus vs floor) | VERIFIED | `handleSave` lines 311-353: branches on isCampusActive |
| 26 | handleFileChange routes to correct endpoint | VERIFIED | Lines 395-412: routes to `/api/admin/campus/image` vs per-floor endpoint |

**Score:** 26/26 automated truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/server/db/schema.ts` | Drizzle schema with connectsToBuildingId on nodes | VERIFIED | Line 34: `connectsToBuildingId: integer('connects_to_building_id').references(() => buildings.id)` |
| `src/shared/types.ts` | NavNodeData with optional connectsToBuildingId | VERIFIED | Line 87: `connectsToBuildingId?: number` |
| `drizzle/0002_campus_entrance_bridge.sql` | Migration SQL adding connects_to_building_id | VERIFIED | ALTER TABLE + FK constraint present |
| `src/server/index.ts` | 5 new admin routes for multi-floor and campus ops | VERIFIED | All 5 routes present: POST /floors, DELETE /floors/:id, POST /floor-plan/:b/:f, POST /campus/image, GET /campus/image |
| `src/client/hooks/useEditorState.ts` | Extended EditorState with multi-floor context + 3 new actions | VERIFIED | 353 lines, all 3 actions in union + reducer, switchFloor + switchToCampus exported |
| `src/client/components/admin/ManageFloorsModal.tsx` | NEW — Manage Floors modal component | VERIFIED | 220 lines, substantive implementation with floor list + add form + delete confirm |
| `src/client/components/admin/EditorToolbar.tsx` | EditorToolbar with onManageFloors prop + campus context | VERIFIED | Contains `onManageFloors` optional prop and context-sensitive render |
| `src/client/components/admin/EditorSidePanel.tsx` | EditorSidePanel with campus entrance building link dropdown | VERIFIED | Contains `connectsToBuildingId` — full dropdown implementation |
| `src/client/components/admin/NodeMarkerLayer.tsx` | NodeMarkerLayer with campus entrance amber color | VERIFIED | Contains `CAMPUS_ENTRANCE_COLOR` constant and conditional color logic |
| `src/client/pages/admin/MapEditorCanvas.tsx` | Full multi-floor editor — 300+ lines | VERIFIED | 705 lines; building selector, floor tabs, ManageFloorsModal integrated, campus empty state |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| schema.ts | drizzle/0002_campus_entrance_bridge.sql | `drizzle-kit generate` | WIRED | Migration file exists with correct ALTER TABLE |
| GET /api/map | types.ts connectsToBuildingId | conditional spread in node mapping | WIRED | `index.ts` line 190 |
| POST /api/admin/floors | floors table | `tx.insert(floors)` | WIRED | `index.ts` lines 321-351: file write then DB insert with `returning` |
| DELETE /api/admin/floors/:id | edges/nodes/floors tables | FK-safe transaction | WIRED | `index.ts` lines 356-375: edges sourceId, edges targetId, nodes, floor — correct order |
| POST /api/admin/campus/image | buildings + floors tables | upsert with Campus sentinel | WIRED | `index.ts` lines 413-457: full upsert with floorNumber=0 sentinel |
| ManageFloorsModal | POST /api/admin/floors | FormData fetch on Add Floor | WIRED | `ManageFloorsModal.tsx` line 83: `fetch('/api/admin/floors', ...)` |
| ManageFloorsModal | DELETE /api/admin/floors/:id | fetch DELETE on row delete | WIRED | `ManageFloorsModal.tsx` line 64: `fetch('/api/admin/floors/${floor.id}', { method: 'DELETE' })` |
| EditorSidePanel | NavNodeData.connectsToBuildingId | onUpdateNode with value from dropdown | WIRED | `EditorSidePanel.tsx` lines 144-149: `onUpdateNode(selectedNode.id, val ? { connectsToBuildingId: Number(val) } : {})` |
| MapEditorCanvas building selector | SWITCH_BUILDING action | handleBuildingSwitch | WIRED | `MapEditorCanvas.tsx` line 137: `dispatch({ type: 'SWITCH_BUILDING', buildingId })` |
| MapEditorCanvas floor tab | switchFloor helper | handleFloorSwitch | WIRED | `MapEditorCanvas.tsx` line 371: `switchFloor(floor.id, floor.nodes, floor.edges)` |
| handleSave | POST /api/admin/graph | NavGraph built from active context | WIRED | `MapEditorCanvas.tsx` lines 311-353: both campus and floor branches POST to `/api/admin/graph` |
| campus upload | POST /api/admin/campus/image | handleFileChange routes on isCampusActive | WIRED | `MapEditorCanvas.tsx` lines 395-402: `fetch('/api/admin/campus/image', ...)` |

---

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| MFLR-04 | 18-01, 18-02, 18-03, 18-04, 18-05 | Admin can add/remove floors per building and upload a distinct floor plan image for each floor | SATISFIED | POST /admin/floors creates floors; DELETE /admin/floors/:id removes floors with FK-safe cleanup; POST /admin/floor-plan/:b/:f uploads per-floor images; ManageFloorsModal provides the UI; floor tabs switch contexts |
| CAMP-02 | 18-01, 18-02, 18-03, 18-04, 18-05 | Admin uploads a hand-drawn overhead image as the campus-level outdoor map | SATISFIED | POST /admin/campus/image upserts Campus building+floor and saves campus-map.{ext}; GET /api/campus/image serves it; handleFileChange routes upload correctly when isCampusActive |
| CAMP-03 | 18-01, 18-03, 18-04, 18-05 | Admin places outdoor path nodes and building entrance markers on the campus map | SATISFIED | Campus context in MapEditorCanvas allows node placement; node placement uses state.activeFloorId (campus floor); EditorSidePanel shows "Links to Building" dropdown for entrance type nodes when isCampusActive |
| CAMP-04 | 18-01, 18-03, 18-04, 18-05 | Building entrance nodes bridge the outdoor graph to floor 1 of each building for cross-building routes | SATISFIED | connectsToBuildingId column exists in DB schema (FK to buildings.id); field flows through GET /api/map and POST /api/admin/graph; EditorSidePanel saves it via onUpdateNode; NodeMarkerLayer visually distinguishes linked nodes in amber |

All 4 requirement IDs from PLAN frontmatter are accounted for. No orphaned requirements found for Phase 18.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| ManageFloorsModal.tsx | 35 | `if (!isOpen) return null` | Info | Expected guard — isOpen prop drives rendering |
| EditorSidePanel.tsx | 56 | `if (!selectedNode && !selectedEdge) return null` | Info | Expected guard — panel is not shown when nothing is selected |
| NodeMarkerLayer.tsx | 50 | `if (!imageRect) return null` | Info | Expected guard — no rendering before image is positioned |
| MapEditorCanvas.tsx | 419, 421 | `return null` in IIFE | Info | Expected — selectedEdgeWithNames IIFE returns null when no edge selected |

No blocker or warning-level anti-patterns found. All `return null` occurrences are legitimate early returns in conditional rendering or computed-value helpers.

---

## Notable Implementation Differences from Plan

The following deviations from the original plans were discovered during implementation (documented in SUMMARYs) and do NOT represent gaps:

1. **ManageFloorsModal callback signatures** — Plan 02 specified `onFloorAdded: () => void` and `onFloorDeleted: () => void`. The actual implementation uses `onFloorAdded: (floor: NavFloor) => void` and `onFloorDeleted: (floorId: number) => void`. This is an improvement — the parent (MapEditorCanvas) does optimistic local state updates instead of a full `loadNavGraph()` re-fetch, which is better UX. TypeScript compiles without errors.

2. **ManageFloorsModal import** — Used `export default` (not named export), so MapEditorCanvas uses `import ManageFloorsModal from ...` (default import). Correct and working.

3. **loadNavGraph uses dispatch directly** — Rather than calling `switchFloor` (non-memoized) inside `loadNavGraph`'s `useCallback`, it dispatches `SWITCH_BUILDING` and `SWITCH_FLOOR` directly to keep `[dispatch]` as the only stable dependency. This prevents an infinite render loop. Correct fix.

4. **ResizeObserver for canvas dimensions** — MapEditorCanvas replaced hardcoded `windowHeight - 52` with a `ResizeObserver` on the canvas container `div`. This correctly handles the multi-row toolbar added in Phase 18. Correct fix.

---

## Human Verification Required

### 1. Building Selector and Floor Tabs

**Test:** Log in as admin, open the admin map editor. Observe the toolbar area.
**Expected:** Building selector dropdown appears below the toolbar, to the left of floor tab buttons. Floor tabs appear sorted by floor number. Clicking a tab switches the floor plan image and node positions on the canvas. Active tab is blue.
**Why human:** React-Konva canvas rendering and interactive tab behavior require browser confirmation.

### 2. Floor Switch Auto-Save

**Test:** Modify a node on a floor (move or rename), then click a different floor tab without manually saving.
**Expected:** The save fires silently in the background (no dialog, no interruption). The toolbar Save button does not flash or block.
**Why human:** Side-effect timing and background I/O cannot be observed from static code analysis.

### 3. Manage Floors Modal

**Test:** Click the "Manage Floors" button in the toolbar (visible only when a real building is selected). Interact with the modal.
**Expected:** Modal opens with list of floors; each row shows floor number, small image thumbnail, Replace Image button, Delete button. "Add Floor" form at bottom requires both floor number and image file before enabling the Add Floor button. Deleting a floor that has nodes prompts a confirm dialog.
**Why human:** Modal layout, confirm dialog behavior, and file picker interaction require browser.

### 4. Campus Tab and Image Upload

**Test:** Select "Campus" from the building selector dropdown.
**Expected:** Floor tabs disappear. "Manage Floors" button disappears from toolbar. If no campus image has been uploaded, a centered "Upload campus map to begin" text prompt appears on the canvas; clicking it opens a file picker. After uploading an image, it renders on the canvas. The toolbar upload button reads "Upload Campus Map" (not "Upload Floor Plan").
**Why human:** Visual layout, conditional UI, and image rendering require browser verification.

### 5. Campus Entrance Node — Building Link and Amber Color

**Test:** While in Campus context, switch to Add Node mode and click the canvas to place a node. In the side panel, change the node type to "Entrance". Select a building from the "Links to Building" dropdown.
**Expected:** "Links to Building" dropdown appears in the side panel only when type is "Entrance" in Campus context. After selecting a building, the node marker on the canvas turns amber (#f59e0b) instead of the standard entrance green.
**Why human:** Canvas color rendering and conditional side-panel UI require browser confirmation.

### 6. Server Migration — No Errors on Startup

**Test:** Start the development server with `npm run dev`. Check terminal output during startup.
**Expected:** Server starts without any migration errors, no "column does not exist" errors, no FK violation messages. The `connects_to_building_id` column is confirmed present.
**Why human:** Database migration outcome requires a live database connection to confirm.

---

## Gaps Summary

No automated gaps found. All 26 must-have truths verified. All 10 key artifacts exist and are substantive (not stubs). All 12 key links wired and verified. TypeScript compiles without errors (confirmed by `npx tsc --noEmit` returning with no output).

The phase is blocked only on the 6 human verification items above, which cover interactive browser behavior and live database state that cannot be confirmed from static code analysis.

---

_Verified: 2026-03-07T08:30:00Z_
_Verifier: Claude (gsd-verifier)_
