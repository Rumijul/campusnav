# Phase 9: Admin Map Editor — Visual - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin can build the campus navigation graph visually: upload a floor plan image as the canvas background, place landmark nodes and hidden navigation nodes on it, and draw edges between nodes with distance and accessibility metadata. Node editing/deletion, table view, and import/export belong in Phase 10.

</domain>

<decisions>
## Implementation Decisions

### Interaction model
- OSM iD editor is the explicit reference — all interaction patterns should feel familiar to OpenStreetMap users
- Three distinct editor modes: **Select**, **Add Node**, **Add Edge** — switched via a horizontal toolbar at the top

### Editor toolbar
- Toolbar at top with labeled mode buttons: `Select | Add Node | Add Edge`
- Toolbar also contains: **Upload Floor Plan** button, **Save** button, **Undo** and **Redo** buttons
- Floor plan upload: Upload button in the toolbar opens a file picker; selected image replaces the current canvas background inline (no separate upload page)
- Default mode on load: **Select** — safe default, no accidental edits

### Node placement
- Admin activates **Add Node** mode, then clicks on the floor plan canvas to place a node
- After placement, a side panel opens (OSM-style) where admin sets all properties:
  - **Name** (required)
  - **Type**: Landmark (visible to users) or Navigation (hidden, routing-only)
  - **Category**: Room, Restroom, Staircase, Ramp, Hallway Junction (and similar)
  - **Description** (optional)
- Nodes can be **repositioned by dragging** in Select mode (OSM-style)

### Edge creation
- **Claude's Discretion**: Two-click flow — admin activates Add Edge mode, clicks the source node, then clicks the target node to create the edge. Escape cancels mid-creation. A rubber-band line follows the cursor between clicks.
- **Distance/weight**: Auto-calculated from the pixel distance between node positions on the floor plan. Admin can manually override the value in the side panel after creation.
- **Wheelchair accessibility**: Set in the side panel after edge creation (OSM-style) — not prompted during creation
- **Directionality**: **Claude's Discretion** — all edges are bidirectional; one-way path support is deferred to Phase 10 if needed

### Visual design — nodes
- **Landmark nodes**: Google Maps-style pin/marker icon with the node's name as a label beneath
- **Hidden navigation nodes**: Small grey dot — minimal visual weight, clearly secondary
- **Selected node**: Blue highlight ring (OSM-style selection indicator)

### Visual design — edges
- **Claude's Discretion**: Color-coded lines — green for wheelchair-accessible edges, grey/muted for non-accessible edges. Thin lines at rest; thicker/highlighted on hover or selection.
- **Selected edge**: Blue-tinted line (OSM-style)

### Save and undo
- Admin must explicitly save via the Save button — no auto-save
- Undo/Redo supported for all canvas actions (place node, move node, create edge, delete)

</decisions>

<specifics>
## Specific Ideas

- "I want the editing to be like OpenStreetMap.org" — the iD web editor is the explicit reference for mode switching, node placement, side panel properties, and selection highlighting
- The side panel for node/edge properties should feel like OSM's tag editor: appears on selection, fields are clearly labeled, and changes apply immediately

</specifics>

<deferred>
## Deferred Ideas

- One-way (directional) edges — deferred to Phase 10 if needed
- Node deletion and editing of existing nodes — Phase 10 (Admin Map Editor — Management)
- Sortable data table view of nodes/edges — Phase 10
- JSON/CSV import/export — Phase 10

</deferred>

---

*Phase: 09-admin-map-editor-visual*
*Context gathered: 2026-02-21*
