---
phase: 10-admin-map-editor-management
plan: 03
type: execute
wave: 3
depends_on: [10-02]
files_modified: []
autonomous: false
requirements: [EDIT-06, EDIT-07, EDIT-08]

must_haves:
  truths:
    - "Admin can delete a node via Delete key and all connected edges disappear too"
    - "Admin can delete a node via the side panel Delete button"
    - "Pressing Backspace in a side panel text input does NOT delete the selected node"
    - "Admin can switch to Data tab and see all nodes sorted A-Z with Name, Type, Room #, Floor, Searchable, Actions columns"
    - "Admin can switch to Data tab and see all edges sorted by source name with Source->Target, Distance, Accessible, Actions columns"
    - "Admin can filter nodes by name and by type dropdown"
    - "Admin can click a Name cell to edit it inline and the canvas reflects the updated name"
    - "Admin can click a Type cell to change node type via dropdown"
    - "Admin can toggle the Accessible checkbox in the edges table"
    - "Admin can delete a node from the table Delete button — node and its edges disappear from both table and canvas"
    - "Admin can export campus-graph.json — downloads a valid JSON file"
    - "Admin can export CSV — downloads nodes.csv and edges.csv"
    - "Admin can import a valid JSON file — graph replaces; switching to Map tab shows the imported nodes"
    - "Admin can import a valid nodes.csv — nodes replace without losing edges"
    - "Admin can import an invalid JSON file — error list appears below import button; graph is unchanged"
    - "Canvas undo history is preserved after switching tabs (Ctrl+Z after Data tab edits works)"
  artifacts:
    - path: "src/client/hooks/useEditorState.ts"
      provides: "DELETE_NODE and DELETE_EDGE actions"
      contains: "DELETE_NODE"
    - path: "src/client/pages/admin/MapEditorCanvas.tsx"
      provides: "Tab switcher with mounted canvas hidden behind Data tab"
      contains: "activeTab"
    - path: "src/client/components/admin/NodeDataTable.tsx"
      provides: "Sortable filterable node table"
    - path: "src/client/components/admin/EdgeDataTable.tsx"
      provides: "Sortable filterable edge table"
    - path: "src/client/utils/importExport.ts"
      provides: "JSON and CSV import/export utilities"
    - path: "src/client/components/admin/DataTabToolbar.tsx"
      provides: "Import/export buttons and sub-tab switcher"
  key_links:
    - from: "src/client/pages/admin/MapEditorCanvas.tsx"
      to: "src/client/hooks/useEditorState.ts"
      via: "DELETE_NODE and DELETE_EDGE dispatched from keyboard handler and table Delete buttons"
      pattern: "DELETE_NODE|DELETE_EDGE"
    - from: "src/client/components/admin/DataTabToolbar.tsx"
      to: "src/client/utils/importExport.ts"
      via: "Import/export functions called from toolbar buttons"
      pattern: "exportJson|handleJsonImport"
---

<objective>
Human verification that all Phase 10 management requirements work correctly end-to-end in a live browser session.

Purpose: Automated checks (tsc, lint) confirm code correctness but cannot verify visual behavior, interactive edge cases, or cross-component data sync. This checkpoint closes Phase 10 with admin-confirmed UAT.
Output: Human approval or identified issues for gap closure.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Human verification: all Phase 10 management features end-to-end</name>
  <what-built>
Phase 10 admin map editor management features:
- DELETE_NODE / DELETE_EDGE reducer actions wired to keyboard (Delete/Backspace), side panel Delete button, and table Delete buttons
- Input focus guard preventing Backspace-in-text-field from triggering deletion
- Tab switcher (Map/Data) keeping canvas mounted but hidden behind Data tab
- NodeDataTable: sortable (Name, Type, Floor), filterable (text + type dropdown), inline Name and Type editing, Delete per row
- EdgeDataTable: sortable (Source, Distance, Accessible), filterable (source/target name), inline Accessible checkbox, Delete per row
- DataTabToolbar: Nodes/Edges sub-tab switcher, Import JSON button, Import CSV button, Export JSON button, Export CSV button, inline import error list
- importExport.ts: Zod-validated JSON import/export, PapaParse CSV import, RFC-4180-compliant CSV export
  </what-built>
  <how-to-verify>
Start the dev server (`npm run dev`) and navigate to the admin map editor (log in if needed).

**Deletion — canvas keyboard:**
1. Place two nodes and connect them with an edge
2. Click the first node to select it (highlighted)
3. Press Delete (or Backspace) — node disappears AND its edge disappears (cascade confirmed)
4. Press Ctrl+Z — node and edge restored

**Deletion — input focus guard:**
5. Select a node; click the Name field in the side panel (focus moves to the input)
6. Press Backspace to delete a character — ONLY the character is removed; node stays on canvas
7. Click outside the input to deselect it; press Delete — node is now deleted (guard released)

**Deletion — side panel button:**
8. Place a node; select it; click "Delete Node" in the side panel → node removed
9. Place an edge; select it; click "Delete Edge" in the side panel → edge removed

**Tab switching:**
10. Place 3+ nodes with labels; add some edges
11. Click the "Data" tab → canvas disappears, table appears
12. Click the "Map" tab → canvas reappears with all nodes still visible and undo history intact (verify by pressing Ctrl+Z)

**Nodes table:**
13. On Data tab → Nodes sub-tab: verify all columns (Name, Type, Room #, Floor, Searchable, Actions)
14. Default sort is Name A–Z — confirm alphabetical order
15. Click "Name" column header — sort reverses (Z–A); click again → A–Z
16. Type a partial name in the filter box — table filters live
17. Use the Type dropdown filter — only matching node types appear
18. Click a Name cell — becomes editable input; change the value; press Enter → name updates in table; switch to Map tab → canvas shows updated name

**Edges table:**
19. Switch to Edges sub-tab; verify columns (Source → Target, Distance, Accessible, Actions)
20. Default sort is by source name A–Z
21. Filter by a node name — only edges involving that node appear
22. Click the Accessible checkbox for an edge — toggles state; verify it persists after switching sub-tabs and back

**Delete from table:**
23. On Nodes sub-tab, click Delete for any node that has connected edges → node disappears from table AND from canvas AND its edges disappear from both table and Edges sub-tab
24. Press Ctrl+Z → deletion undone; node and edges restored

**Export JSON:**
25. Click "Export JSON" — browser downloads campus-graph.json
26. Open the file — verify it has `{ "nodes": [...], "edges": [...], "metadata": {...} }` structure with your test data

**Export CSV:**
27. Click "Export CSV" — browser triggers two downloads: nodes.csv and edges.csv
28. Open nodes.csv — verify header row is `id,label,type,floor,roomNumber,searchable,x,y,...`

**Import JSON (valid):**
29. Take the downloaded campus-graph.json, import it via "Import JSON" button → graph replaces; table shows the same data (import of same data is a no-op visually)
30. Modify campus-graph.json to add a new node, re-import → new node appears in table and on canvas

**Import JSON (invalid):**
31. Create a file with `{ "nodes": [{"id": ""}], "edges": [] }` (id is empty string — invalid)
32. Import it → error list appears below the import button listing the validation error; graph is UNCHANGED

**Import CSV:**
33. Import the exported nodes.csv → nodes replace without error; edges remain
34. Modify a node's label in nodes.csv, re-import → updated label appears in table

**Overall sync:**
35. Make edits in the Data tab (rename a node, toggle an edge accessible)
36. Switch to Map tab → canvas reflects all edits (name on canvas updated, edge color changed if accessibility changed)
  </how-to-verify>
  <resume-signal>Type "approved" if all 36 verification steps pass, or describe which steps failed and what the actual behavior was</resume-signal>
  <action>Follow the how-to-verify steps above. Start the dev server with `npm run dev`, navigate to the admin map editor, and execute each verification step in order. Note any failures.</action>
  <verify>All 36 how-to-verify steps produce the expected outcome</verify>
  <done>Human types "approved" confirming all EDIT-06, EDIT-07, and EDIT-08 behaviors work as specified</done>
</task>

</tasks>

<verification>
Human confirmation that all 36 verification steps pass.
</verification>

<success_criteria>
All Phase 10 EDIT requirements verified by human UAT:
- EDIT-06: Admin can rename, edit properties of, and delete any node — confirmed via keyboard delete, side panel delete, and inline table editing
- EDIT-07: Admin can view and edit all nodes in a sortable, filterable data table — confirmed via both Nodes and Edges tables
- EDIT-08: Admin can import and export graph data in JSON or CSV format — confirmed via all four export/import flows
</success_criteria>

<output>
After completion, create `.planning/phases/10-admin-map-editor-management/10-03-SUMMARY.md`
</output>
</invoke>