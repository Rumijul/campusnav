# Phase 10: Admin Map Editor — Management - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Layer data management tools onto the Phase 9 visual editor: node/edge deletion from both canvas and table, a tabular view of all graph data with inline editing, and bulk import/export (JSON and CSV). This phase does not add new map features — it makes existing graph data manageable at scale.

</domain>

<decisions>
## Implementation Decisions

### Table view layout
- Tab switcher pattern: "Map" tab shows the canvas, "Data" tab shows the table — full-screen each, no split
- The canvas remains mounted behind the Data tab (hidden, not destroyed) so selection state is preserved when switching tabs
- Data tab has two sub-tabs: Nodes and Edges
- **Nodes table columns:** Name, Type, Room #, Floor, Searchable, Actions (Edit button opens side panel, Delete button removes)
- **Nodes default sort:** Name A–Z
- **Edges table columns:** Source → Target, Distance (weight), Accessible, Actions
- **Edges default sort:** By source node name
- Filter bar above both tables: text search by name (nodes) or source/target name (edges), plus a Type dropdown filter for nodes

### Deletion behavior
- Deleting a node auto-deletes all connected edges — no dangling edges allowed (would break pathfinding)
- No confirmation dialog — deletion is immediate and undoable via Ctrl+Z (undo/redo from Phase 9 covers this)
- Deletion from canvas: **both** Delete/Backspace keyboard shortcut (when node/edge selected) AND a Delete button in the side panel
- Deletion from table: Delete button in the Actions column per row

### Import behavior
- Import **replaces** the entire graph — wipes existing nodes/edges and loads the file as the new complete dataset
- On validation errors: reject the whole file and show a summary of all errors — nothing is saved until the file is clean
- CSV format: **separate files for nodes and edges** — export produces `nodes.csv` + `edges.csv`; import accepts either or both
- JSON format: single file with `{ nodes: [...], edges: [...] }` structure (matching the existing `/api/map` response shape)
- Import UI: button in the toolbar area of the Data tab; export buttons likewise in the Data tab toolbar

### Inline editing scope
- **Nodes table:** Name cell (click to edit text inline) and Type cell (click for dropdown) are inline-editable; all other fields require the side panel
- **Edges table:** Accessible checkbox is inline-editable; all other edge fields require the side panel
- Clicking any row in either table also selects that node/edge on the hidden canvas — switching to Map tab shows it pre-selected and centered

### Claude's Discretion
- Exact table component implementation (whether to use a library or plain HTML table)
- Pagination vs virtual scroll for large node counts
- Exact export button placement within the Data tab toolbar
- Error display format for import validation errors (inline list, toast, or modal)

</decisions>

<specifics>
## Specific Ideas

- Canvas stays mounted (not unmounted) when switching to Data tab — this preserves undo history and selection sync
- "Locate on map" behavior: clicking a table row selects the corresponding node/edge on canvas; switching to Map tab reveals it highlighted
- Import/export lives in the Data tab, not the existing EditorToolbar (keeps the canvas toolbar clean)

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-admin-map-editor-management*
*Context gathered: 2026-02-21*
