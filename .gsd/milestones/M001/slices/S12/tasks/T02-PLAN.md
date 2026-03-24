---
phase: 11-fix-data-tab
plan: 02
type: execute
wave: 2
depends_on:
  - 11-01
files_modified: []
autonomous: false
requirements:
  - EDIT-07
  - EDIT-08

must_haves:
  truths:
    - "Clicking the Data tab shows NodeDataTable and EdgeDataTable (not a blank/empty panel)"
    - "Nodes table displays rows with sortable columns and filterable content"
    - "Edges table displays rows and is accessible via the sub-tab toggle"
    - "Inline editing in the data tables works (editing a cell updates the value)"
    - "Clicking Map tab after Data tab still shows the Konva canvas correctly"
    - "JSON export and CSV export buttons in DataTabToolbar trigger file downloads"
  artifacts:
    - path: "src/client/pages/admin/MapEditorCanvas.tsx"
      provides: "Fixed layout with min-h-0 applied"
      contains: "min-h-0"
  key_links:
    - from: "Data tab button click"
      to: "Data panel div (flex-1 overflow-auto)"
      via: "activeTab state → className toggle"
      pattern: "activeTab.*data"
---

<objective>
Human UAT: verify the Data tab renders correctly with interactive tables after the CSS layout fix, and confirm Map tab canvas shows no regression.

Purpose: Confirm EDIT-07 and EDIT-08 are satisfied — the admin can view/edit nodes in a data table and use import/export. Close the known issue deferred from Phase 10.

Output: Human approval of Data tab functionality; Phase 11 complete.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

@.planning/phases/11-fix-data-tab/11-01-SUMMARY.md
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Human verification: Data tab renders and is fully interactive, Map tab shows no regression</name>
  <what-built>
    Applied `min-h-0` to the MapEditorCanvas root flex container in Phase 11 Plan 01. This allows the Data panel's `flex-1 overflow-auto` to properly fill the remaining viewport height. NodeDataTable, EdgeDataTable, and DataTabToolbar were already fully implemented in Phase 10 — only the CSS visibility was broken.
  </what-built>
  <how-to-verify>
    Start the dev server if not already running:
    ```
    npm run dev
    ```
    Then open the admin map editor in the browser (http://localhost:5173/admin or the configured dev URL) and log in.

    **Smoke test steps (5-8 steps):**

    1. **Data tab renders:** Click the "Data" tab button in the editor tab bar. Verify the NodeDataTable appears (not a blank/white area). You should see a table with column headers and rows for each node in the current graph.

    2. **Nodes table is sortable:** Click a column header (e.g., "Label" or "Type") in the Nodes table. Verify the rows reorder. Click again to reverse sort.

    3. **Nodes table is filterable:** If a filter/search input is visible above the table, type a partial node name. Verify the table rows filter to matching results.

    4. **Inline editing works:** Click on a cell value in the Nodes table (e.g., a node label). Verify the cell becomes editable (input appears). Change the value and confirm (press Enter or click away). Verify the updated value is reflected.

    5. **Edges sub-tab works:** Click the "Edges" sub-tab toggle (if visible) or equivalent control to switch to EdgeDataTable. Verify edge rows appear with their source/target labels.

    6. **Export works:** Click the "Export JSON" (or similar) button in the DataTabToolbar. Verify a file download is triggered.

    7. **Map tab regression check:** Click the "Map" tab button. Verify the Konva canvas (floor plan + nodes + edges) still renders correctly. Try panning the map. Verify no blank canvas or sizing issues.

    8. **Undo history preserved:** After switching from Map to Data to Map, press Ctrl+Z. Verify undo still works (if any edits were made prior to switching).
  </how-to-verify>
  <resume-signal>Type "approved" if all steps pass, or describe any issues found (e.g., "step 3 fails — filter input missing")</resume-signal>
  <action>Follow the how-to-verify steps above. Start the dev server with `npm run dev`, navigate to the admin map editor, log in, and execute each smoke test step in order. Note any failures.</action>
  <verify>All 8 smoke test steps produce the expected outcome</verify>
  <done>Human types "approved" confirming Data tab is visible, tables are interactive (sort, filter, inline edit), export works, and Map tab canvas shows no regression</done>
</task>

</tasks>

<verification>
Human confirms:
- Data tab panel is visible and non-blank when clicked
- NodeDataTable shows rows with working sort, filter, and inline edit
- EdgeDataTable accessible and shows rows
- JSON/CSV export triggers a download
- Map tab canvas still works after switching
- Undo history intact across tab switches
</verification>

<success_criteria>
Phase 11 complete when:
1. Human types "approved" after completing all smoke test steps
2. No regressions in Map tab (canvas renders, pan works)
3. EDIT-07: Nodes table visible, sortable, filterable, inline-editable — confirmed
4. EDIT-08: Export buttons functional — confirmed
</success_criteria>

<output>
After completion, create `.planning/phases/11-fix-data-tab/11-02-SUMMARY.md` following the summary template.
</output>
