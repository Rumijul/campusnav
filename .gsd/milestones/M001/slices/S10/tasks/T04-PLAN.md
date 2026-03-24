---
phase: 09-admin-map-editor-visual
plan: 04
type: execute
wave: 4
depends_on: ["09-03"]
files_modified: []
autonomous: false
requirements: [EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05]

must_haves:
  truths:
    - "Admin can upload a floor plan image that becomes the canvas background"
    - "Admin can place landmark nodes and navigation nodes on the floor plan"
    - "Admin can create edges between nodes with auto-calculated distance"
    - "Admin can mark edges as wheelchair-accessible or not"
    - "Admin can edit node and edge properties in the side panel"
    - "Undo/Redo works for all canvas actions"
    - "Save persists the graph to the server database"
  artifacts: []
  key_links: []
---

<objective>
Human verification of the complete admin map editor.

Purpose: Verify all five EDIT requirements (01-05) work end-to-end before marking Phase 9 complete.

Output: Verified editor functionality or list of issues to address.
</objective>

<execution_context>
@C:/Users/LENOVO/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/09-admin-map-editor-visual/09-01-SUMMARY.md
@.planning/phases/09-admin-map-editor-visual/09-02-SUMMARY.md
@.planning/phases/09-admin-map-editor-visual/09-03-SUMMARY.md
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 1: Verify complete admin map editor</name>
  <action>
Human verification of the complete admin visual map editor. All automated implementation is done in Plans 01-03. This checkpoint verifies all five EDIT requirements (01-05) work end-to-end from the user's perspective.
  </action>
  <what-built>
Complete admin visual map editor with floor plan upload, node placement (landmark + navigation), edge creation with rubber-band preview, property editing side panel, accessibility marking, undo/redo, and save to database.
  </what-built>
  <verify>Follow the how-to-verify steps below and confirm each one passes.</verify>
  <done>All 9 verification steps pass. All EDIT-01 through EDIT-05 requirements confirmed working.</done>
  <how-to-verify>
Start the dev server: `npm run dev`

**Pre-requisite:** Ensure `.env` has ADMIN_EMAIL, ADMIN_PASSWORD_HASH, and JWT_SECRET configured (from Phase 8).

**1. Login and access editor:**
- Navigate to `http://localhost:5173/admin/login`
- Log in with admin credentials
- Verify: Editor canvas loads with floor plan image and toolbar at top
- Verify: Toolbar shows Select | Add Node | Add Edge mode buttons, Upload, Save, Undo, Redo, Logout

**2. EDIT-01 — Floor plan upload:**
- Click "Upload Floor Plan" in toolbar
- Select a new image file from your computer
- Verify: Canvas background updates to show the new image immediately
- Verify: After refreshing the page, the uploaded image persists (saved to server)

**3. EDIT-02 — Place landmark nodes:**
- Click "Add Node" mode in toolbar
- Verify: Cursor changes to crosshair
- Click on the floor plan at several locations
- Verify: Pin markers appear at each click position with "New Node" labels
- In Select mode, click a placed node
- Verify: Side panel opens on the right showing node properties
- Change the name to "Room 101" and type to "room"
- Verify: The marker label updates to "Room 101"

**4. EDIT-03 — Place hidden navigation nodes:**
- In Add Node mode, place another node
- In Select mode, click the new node and change its type to "junction" in the side panel
- Verify: The marker changes from a pin to a small grey dot (navigation node style)
- Verify: The searchable flag in the side panel unchecks automatically

**5. EDIT-04 — Create edges:**
- Click "Add Edge" mode in toolbar
- Click on one node (source)
- Verify: A dashed blue line follows your cursor from the source node
- Click on a second node (target)
- Verify: An edge line appears between the two nodes (green by default — accessible)
- Verify: The side panel opens showing edge properties with auto-calculated distance
- Press Escape while a source is selected but before clicking target
- Verify: The rubber-band line disappears (edge creation cancelled)

**6. EDIT-05 — Mark edge accessibility:**
- In Select mode, click an edge line
- Verify: Edge turns blue (selected), side panel shows edge properties
- Uncheck the "Wheelchair Accessible" toggle
- Verify: Edge color changes from green to grey
- Verify: accessibleWeight displays as a large number (1e10 sentinel)

**7. Undo/Redo:**
- Press Ctrl+Z
- Verify: The last action is undone (e.g., accessibility change reverts)
- Press Ctrl+Y
- Verify: The action is re-applied

**8. Save and persistence:**
- Make several edits (place nodes, create edges)
- Click "Save" button in toolbar
- Refresh the browser page (F5)
- Verify: All nodes and edges are still present after reload (loaded from server DB)

**9. Student view unaffected:**
- Open `http://localhost:5173/` in a new tab
- Verify: Student wayfinding app still works normally (shows saved graph data)
  </how-to-verify>
  <resume-signal>Type "approved" if all checks pass, or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
All EDIT-01 through EDIT-05 requirements verified by human testing.
</verification>

<success_criteria>
- All 9 verification steps pass
- No console errors during editor usage
- Student-facing app remains unaffected by admin editor changes
</success_criteria>

<output>
After completion, create `.planning/phases/09-admin-map-editor-visual/09-04-SUMMARY.md`
</output>
