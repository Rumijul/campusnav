# Phase 10: Admin Map Editor — Management - Research

**Researched:** 2026-02-21
**Domain:** React admin data table, CSV/JSON import-export, node/edge deletion, canvas-table selection sync
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Tab switcher layout**
- Tab switcher pattern: "Map" tab shows the canvas, "Data" tab shows the table — full-screen each, no split
- The canvas remains mounted behind the Data tab (hidden, not destroyed) so selection state is preserved when switching tabs
- Data tab has two sub-tabs: Nodes and Edges

**Nodes table columns:** Name, Type, Room #, Floor, Searchable, Actions (Edit button opens side panel, Delete button removes)
**Nodes default sort:** Name A–Z
**Edges table columns:** Source → Target, Distance (weight), Accessible, Actions
**Edges default sort:** By source node name
**Filter bar above both tables:** text search by name (nodes) or source/target name (edges), plus a Type dropdown filter for nodes

**Deletion behavior**
- Deleting a node auto-deletes all connected edges — no dangling edges allowed
- No confirmation dialog — deletion is immediate and undoable via Ctrl+Z (undo/redo from Phase 9 covers this)
- Deletion from canvas: both Delete/Backspace keyboard shortcut (when node/edge selected) AND a Delete button in the side panel
- Deletion from table: Delete button in the Actions column per row

**Import behavior**
- Import replaces the entire graph — wipes existing nodes/edges and loads the file as the new complete dataset
- On validation errors: reject the whole file and show a summary of all errors — nothing is saved until the file is clean
- CSV format: separate files for nodes and edges — export produces `nodes.csv` + `edges.csv`; import accepts either or both
- JSON format: single file with `{ nodes: [...], edges: [...] }` structure (matching the existing `/api/map` response shape)
- Import UI: button in the toolbar area of the Data tab; export buttons likewise in the Data tab toolbar

**Inline editing scope**
- Nodes table: Name cell (click to edit text inline) and Type cell (click for dropdown) are inline-editable; all other fields require the side panel
- Edges table: Accessible checkbox is inline-editable; all other edge fields require the side panel
- Clicking any row in either table also selects that node/edge on the hidden canvas — switching to Map tab shows it pre-selected and centered

**Canvas stays mounted (not unmounted) when switching to Data tab** — preserves undo history and selection sync

### Claude's Discretion
- Exact table component implementation (whether to use a library or plain HTML table)
- Pagination vs virtual scroll for large node counts
- Exact export button placement within the Data tab toolbar
- Error display format for import validation errors (inline list, toast, or modal)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EDIT-06 | Admin can rename, edit properties of, and delete any node | Covered by: inline table editing for Name/Type, Delete button in side panel, Delete/Backspace keyboard shortcut wired to `DELETE_NODE` dispatcher, DELETE_NODE reducer auto-removing connected edges |
| EDIT-07 | Admin can view and edit all nodes in a sortable, filterable data table with inline editing | Covered by: plain HTML table (or TanStack Table) with client-side sort/filter state, controlled input for inline Name edit, select dropdown for inline Type edit, checkbox for inline Accessible edit on edges |
| EDIT-08 | Admin can import and export graph data in JSON or CSV format | Covered by: JSON export via `JSON.stringify` + Blob download, CSV export via hand-rolled serializer + Blob download, JSON import via FileReader + JSON.parse + Zod validation, CSV import via FileReader + hand-rolled parser + Zod validation |

</phase_requirements>

---

## Summary

Phase 10 adds management tooling on top of the Phase 9 visual editor. The three main domains are: (1) a tab switcher that reveals a data table while keeping the canvas mounted in memory, (2) node/edge deletion from both canvas and table, and (3) bulk import/export in JSON and CSV formats.

The existing `useEditorState` hook (useReducer + undo/redo history) is the state foundation. Phase 10 extends it with two new action types — `DELETE_NODE` (cascades to connected edges) and `DELETE_EDGE` — and wires those into keyboard events, the side panel, and table row action buttons. The tab switcher is a top-level UI concern in `MapEditorCanvas`: a `useState('map' | 'data')` tab + Tailwind `hidden` class keeps the canvas mounted but invisible. No library is needed for either feature.

The data table is the biggest UI deliverable. Given the small dataset (tens to low hundreds of nodes), a plain HTML `<table>` with React-controlled sort/filter state is the correct choice — no TanStack Table overhead needed. Inline editing follows the standard "click to swap display span for input" pattern. Import/export uses native browser APIs (Blob, URL.createObjectURL, FileReader) with PapaParse for CSV parsing robustness, and Zod (already in the project) for validation of both JSON and CSV payloads.

**Primary recommendation:** Extend `useEditorState` with DELETE actions, add a tab state to `MapEditorCanvas`, build a plain HTML table component with controlled sort/filter, and implement import/export via browser Blob API + PapaParse + Zod.

---

## Standard Stack

### Core (already in project — no new installs needed for most features)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | Tab state, table render, inline edit state | Already installed |
| Tailwind CSS | 4.1.18 | `hidden` class for tab hiding, table styles | Already installed |
| Zod | 4.3.6 | Validate imported JSON/CSV payload shape | Already installed — perfect for "reject entire file on any error" requirement |
| TypeScript | 5.9.3 | Type-safe reducer actions, CSV row shapes | Already installed |
| useEditorState (internal) | — | Undo/redo, graph state, dispatch | Phase 9 foundation |

### Supporting (one new install recommended)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| papaparse | ^5.5.3 | CSV parsing (import) | Use for CSV import: handles quoted fields, \r\n vs \n, malformed rows correctly. 7.6 KB gzipped. Hand-rolled splitting breaks on quoted commas. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain HTML table | TanStack Table v8 | TanStack is powerful but adds 14KB+ and significant API surface. Not justified for tens of rows with two sort columns. Plain table with useState sort/filter is complete in ~80 lines. |
| PapaParse | Hand-rolled CSV split | Hand-rolling fails on values with commas inside quotes (e.g., `"Room 204, East Wing"`). RFC 4180 edge cases are non-trivial. PapaParse is 7.6 KB and handles all edge cases correctly. |
| Blob download | Server-side download endpoint | Browser-side Blob + URL.createObjectURL requires zero server changes and works offline. Correct choice for client-state export. |
| Zod for validation | Manual type checks | Zod already in project. Provides clear error messages per field, which feeds directly into the "show all errors" validation summary requirement. |

**Installation:**
```bash
npm install papaparse
npm install --save-dev @types/papaparse
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/client/
├── hooks/
│   └── useEditorState.ts          # ADD: DELETE_NODE, DELETE_EDGE actions
├── components/admin/
│   ├── EditorToolbar.tsx           # UNCHANGED (canvas toolbar stays clean)
│   ├── EditorSidePanel.tsx         # ADD: onDeleteNode, onDeleteEdge props + Delete button
│   ├── NodeMarkerLayer.tsx         # UNCHANGED
│   ├── EdgeLayer.tsx               # UNCHANGED
│   ├── DataTabToolbar.tsx          # NEW: import/export buttons for Data tab
│   ├── NodeDataTable.tsx           # NEW: sortable/filterable nodes table
│   └── EdgeDataTable.tsx           # NEW: sortable/filterable edges table
└── pages/admin/
    └── MapEditorCanvas.tsx         # ADD: tab state, keyboard delete, tab-switch wiring
```

### Pattern 1: Tab Switcher with Mounted-but-Hidden Canvas

**What:** A `activeTab: 'map' | 'data'` state in `MapEditorCanvas`. The Konva Stage div gets `className={activeTab !== 'map' ? 'hidden' : ''}`. The Data panel div gets `className={activeTab !== 'data' ? 'hidden' : ''}`. Both exist in the DOM simultaneously.

**Why:** The CONTEXT decision is explicit — canvas must stay mounted to preserve undo history (historyRef) and selection sync. `hidden` (Tailwind, which applies `display: none`) removes the element from layout but keeps it in the React tree and DOM, so all refs, state, and event listeners survive intact.

**Tailwind `hidden` vs `invisible`:** Use `hidden` (`display: none`) not `invisible` (`visibility: hidden`). `display: none` prevents Konva Stage from receiving pointer events while hidden and removes it from layout. The Stage itself is not harmed by `display: none` — its internal state is pure JS refs.

**Important:** The tab toggle buttons live in the top toolbar area (alongside the existing EditorToolbar for the Map tab). When on the Data tab, the EditorToolbar mode buttons (Select / Add Node / Add Edge) can be visually hidden or disabled — they don't apply to the table view.

**Example:**
```typescript
// MapEditorCanvas.tsx — tab state addition
const [activeTab, setActiveTab] = useState<'map' | 'data'>('map')

// In JSX:
// Tab switcher buttons in header
<div className="flex gap-1 border-b">
  <button onClick={() => setActiveTab('map')} className={activeTab === 'map' ? 'border-b-2 border-blue-600' : ''}>Map</button>
  <button onClick={() => setActiveTab('data')} className={activeTab === 'data' ? 'border-b-2 border-blue-600' : ''}>Data</button>
</div>

// Canvas area — hidden not unmounted
<div className={activeTab !== 'map' ? 'hidden' : ''}>
  <Stage ...>...</Stage>
  <EditorSidePanel ... />
</div>

// Data area
<div className={activeTab !== 'data' ? 'hidden' : ''}>
  <DataTabToolbar onImportJson={...} onImportCsv={...} onExportJson={...} onExportCsv={...} />
  {dataSubTab === 'nodes'
    ? <NodeDataTable nodes={state.nodes} ... />
    : <EdgeDataTable edges={state.edges} nodes={state.nodes} ... />}
</div>
```

### Pattern 2: DELETE_NODE Cascade in Reducer

**What:** A new `DELETE_NODE` action removes the node AND all edges where `sourceId === id || targetId === id`. This ensures no dangling edges. A `DELETE_EDGE` action removes a single edge.

**Why:** The existing `editorReducer` pattern (pure function, action dispatch) is already established. Adding two cases keeps everything consistent with Phase 9 architecture.

**Example:**
```typescript
// useEditorState.ts — new action types
| { type: 'DELETE_NODE'; id: string }
| { type: 'DELETE_EDGE'; id: string }

// Reducer cases:
case 'DELETE_NODE':
  return {
    ...state,
    nodes: state.nodes.filter((n) => n.id !== action.id),
    edges: state.edges.filter((e) => e.sourceId !== action.id && e.targetId !== action.id),
    selectedNodeId: state.selectedNodeId === action.id ? null : state.selectedNodeId,
    isDirty: true,
  }

case 'DELETE_EDGE':
  return {
    ...state,
    edges: state.edges.filter((e) => e.id !== action.id),
    selectedEdgeId: state.selectedEdgeId === action.id ? null : state.selectedEdgeId,
    isDirty: true,
  }
```

### Pattern 3: Keyboard Delete Guard

**What:** The existing `handleKeyDown` in `MapEditorCanvas` needs to fire `DELETE_NODE`/`DELETE_EDGE` on Delete/Backspace, BUT only when focus is NOT on an input/textarea/select element. Without this guard, typing in the side panel's text inputs triggers deletion.

**Critical pitfall:** This is the #1 bug in graph editors with keyboard delete shortcuts. React Flow, react-diagrams, and other graph editors have all had this issue reported.

**How to detect focus is on input:**
```typescript
// In handleKeyDown:
const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
  (document.activeElement as HTMLElement)?.tagName ?? ''
)
if (isInputFocused) return // Don't delete while typing

if (e.key === 'Delete' || e.key === 'Backspace') {
  if (state.selectedNodeId) {
    dispatch({ type: 'DELETE_NODE', id: state.selectedNodeId })
    recordHistory()
  } else if (state.selectedEdgeId) {
    dispatch({ type: 'DELETE_EDGE', id: state.selectedEdgeId })
    recordHistory()
  }
}
```

### Pattern 4: Plain HTML Table with Controlled Sort/Filter

**What:** A React component with local state for `sortField`, `sortDir`, `filterText`, and `filterType` (for nodes). Data is derived via `useMemo` from props. No external table library.

**Why appropriate:** The dataset is small (the campus graph fixture has ~25 nodes; even a large real campus floor has <300 nodes). Client-side sort/filter over this dataset is instantaneous. TanStack Table would add complexity with no benefit.

**Inline edit pattern:** Each cell renders either a display span or a controlled input, toggled by a per-row-per-field `editingCell` state (`{ rowId, field } | null`). On blur or Enter, commit the change via `onUpdateNode`.

**Example:**
```typescript
// NodeDataTable.tsx
const [editingCell, setEditingCell] = useState<{ rowId: string; field: 'label' | 'type' } | null>(null)
const [editValue, setEditValue] = useState('')

// Name cell render:
{editingCell?.rowId === node.id && editingCell.field === 'label' ? (
  <input
    autoFocus
    value={editValue}
    onChange={(e) => setEditValue(e.target.value)}
    onBlur={() => { onUpdateNode(node.id, { label: editValue }); setEditingCell(null) }}
    onKeyDown={(e) => { if (e.key === 'Enter') { onUpdateNode(node.id, { label: editValue }); setEditingCell(null) } }}
    className="border rounded px-1 py-0.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
  />
) : (
  <span
    className="cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded block"
    onClick={() => { setEditingCell({ rowId: node.id, field: 'label' }); setEditValue(node.label) }}
  >
    {node.label}
  </span>
)}
```

**Sort pattern:**
```typescript
const sorted = useMemo(() => {
  return [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortField === 'label') return a.label.localeCompare(b.label) * dir
    // ... other fields
    return 0
  })
}, [filtered, sortField, sortDir])
```

### Pattern 5: Row Selection → Canvas Sync

**What:** Clicking a table row dispatches `SELECT_NODE` or `SELECT_EDGE` to the shared editor state. Since the canvas is mounted, the selection is immediately reflected on the Konva canvas. Switching to the Map tab reveals the selected node highlighted.

**Centering on canvas (optional enhancement):** After selecting from table, optionally animate the Konva Stage to center on the selected node. This requires knowing the node's canvas pixel position from `imageRect`. This is Claude's discretion — implement if straightforward, skip if complex.

### Pattern 6: JSON Export

**What:** Serialize `state.nodes` + `state.edges` into the existing `NavGraph` shape (identical to what `POST /api/admin/graph` accepts) and trigger a browser download via Blob.

**Example:**
```typescript
function exportJson(nodes: NavNode[], edges: NavEdge[]) {
  const graph: NavGraph = {
    nodes,
    edges,
    metadata: { buildingName: 'Main Building', floor: 1, lastUpdated: new Date().toISOString() },
  }
  const blob = new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'campus-graph.json'
  a.click()
  URL.revokeObjectURL(url)
}
```

### Pattern 7: CSV Export (Two Files)

**What:** Export produces two separate files: `nodes.csv` and `edges.csv`. Trigger both downloads in sequence.

**Node CSV columns:** `id,label,type,floor,roomNumber,searchable,x,y`
**Edge CSV columns:** `id,sourceId,targetId,standardWeight,accessibleWeight,accessible,bidirectional,accessibilityNotes`

**CSV serialization — quoting rule:** Wrap any value in double-quotes if it contains a comma, double-quote, or newline. Escape internal double-quotes by doubling them (`"` → `""`).

**Example:**
```typescript
function toCsvRow(values: (string | number | boolean | undefined | null)[]): string {
  return values
    .map((v) => {
      const s = v == null ? '' : String(v)
      // Quote if contains comma, quote, or newline
      return /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    })
    .join(',')
}

function exportNodesCsv(nodes: NavNode[]) {
  const header = toCsvRow(['id', 'label', 'type', 'floor', 'roomNumber', 'searchable', 'x', 'y'])
  const rows = nodes.map((n) =>
    toCsvRow([n.id, n.label, n.type, n.floor, n.roomNumber ?? '', n.searchable, n.x, n.y])
  )
  const csv = '\ufeff' + [header, ...rows].join('\n') // BOM for Excel UTF-8 compat
  triggerDownload(csv, 'text/csv', 'nodes.csv')
}
```

### Pattern 8: JSON Import with Zod Validation

**What:** FileReader reads the uploaded JSON file. `JSON.parse` parses it. Zod validates the shape against `NavGraph`. On any error, collect ALL Zod issues and display a summary. Nothing is applied to editor state until the file is valid.

**Zod schema approach:** Define `navGraphSchema` using Zod that mirrors the `NavGraph` interface. Use `.safeParse()` (not `.parse()`) to get all errors without throwing.

**Example:**
```typescript
import { z } from 'zod'

const navNodeTypeSchema = z.enum([
  'room', 'entrance', 'elevator', 'stairs', 'ramp', 'restroom', 'junction', 'hallway', 'landmark'
])

const navNodeSchema = z.object({
  id: z.string().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  label: z.string().min(1),
  type: navNodeTypeSchema,
  searchable: z.boolean(),
  floor: z.number().int().positive(),
  roomNumber: z.string().optional(),
  description: z.string().optional(),
  buildingName: z.string().optional(),
  accessibilityNotes: z.string().optional(),
})

const navEdgeSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  standardWeight: z.number().positive(),
  accessibleWeight: z.number().positive(),
  accessible: z.boolean(),
  bidirectional: z.boolean(),
  accessibilityNotes: z.string().optional(),
})

const navGraphSchema = z.object({
  nodes: z.array(navNodeSchema),
  edges: z.array(navEdgeSchema),
  metadata: z.object({
    buildingName: z.string(),
    floor: z.number(),
    lastUpdated: z.string(),
  }).optional(),
})

// Usage:
function handleJsonImport(jsonText: string): { ok: true; graph: NavGraph } | { ok: false; errors: string[] } {
  let parsed: unknown
  try { parsed = JSON.parse(jsonText) } catch { return { ok: false, errors: ['File is not valid JSON'] } }
  const result = navGraphSchema.safeParse(parsed)
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    return { ok: false, errors }
  }
  return { ok: true, graph: result.data as NavGraph }
}
```

### Pattern 9: CSV Import with PapaParse

**What:** PapaParse reads the CSV file text and returns structured objects with header mapping. Then validate each row with Zod. Collect all errors before deciding whether to proceed.

**Why PapaParse over hand-rolled:** Handles quoted commas, CRLF line endings, trailing commas, BOM, and malformed rows correctly. 7.6 KB gzipped — negligible. Hand-rolled CSV splits fail on `"Room 204, East Wing"`.

**Example:**
```typescript
import Papa from 'papaparse'

function parseNodesCsv(csvText: string): { ok: true; nodes: NavNode[] } | { ok: false; errors: string[] } {
  const result = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })
  const errors: string[] = []
  const nodes: NavNode[] = []

  if (result.errors.length > 0) {
    return { ok: false, errors: result.errors.map((e) => `Row ${e.row ?? '?'}: ${e.message}`) }
  }

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i]
    const parsed = navNodeSchema.safeParse({
      id: row.id,
      x: Number(row.x),
      y: Number(row.y),
      label: row.label,
      type: row.type,
      searchable: row.searchable === 'true',
      floor: Number(row.floor),
      roomNumber: row.roomNumber || undefined,
      description: row.description || undefined,
    })
    if (!parsed.success) {
      errors.push(...parsed.error.issues.map((e) => `Row ${i + 2}: ${e.path.join('.')}: ${e.message}`))
    } else {
      nodes.push(parsed.data)
    }
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, nodes }
}
```

### Pattern 10: Import Applies via LOAD_GRAPH Dispatch

**What:** A successful import calls `dispatch({ type: 'LOAD_GRAPH', nodes, edges })` — the same action used on initial server load. This replaces the entire graph, clears selection, and resets `isDirty: false` (import is a clean load). Then `recordHistory()` makes the import undoable.

**Important:** After `LOAD_GRAPH`, call `recordHistory()` so the admin can Ctrl+Z the import.

### Anti-Patterns to Avoid

- **Splitting CSV parsing across components:** Keep all import/export logic in a single `importExport.ts` utility file. Do NOT scatter it across DataTabToolbar, NodeDataTable, and EdgeDataTable.
- **Re-using file input elements:** Create a fresh `<input type="file">` click per import (or keep one hidden input and reset its value after each use to allow re-importing the same file).
- **Skipping the input focus guard on keyboard delete:** Without `isInputFocused` check, pressing Backspace in the side panel's Name field triggers node deletion.
- **Deleting edges before nodes in cascade:** The reducer correctly handles this — filter edges first (or simultaneously), avoiding any state where a node is gone but edges still reference it.
- **Using `display: none` on the Konva Stage via inline style overriding `style=` prop:** Konva's Stage accepts a `style` prop. Don't set `style={{ display: 'none' }}` directly. Instead wrap the Stage in a container div and apply `hidden` to the wrapper.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV parsing (import) | Custom string.split(',') parser | PapaParse | Quoted commas, CRLF endings, BOM, empty fields — hand-roll breaks on real data |
| Import validation | Manual type checks with if/else | Zod (already installed) | Zod collects ALL errors in one pass; manual checks miss deeply nested issues |
| File download | Server endpoint returning a file | Browser Blob + URL.createObjectURL | Zero server round-trip; works for client-state exports; well-supported in all browsers |
| Table sort/filter | External table library | useState + useMemo | Dataset is <300 rows; useState sort/filter is 20 lines, TanStack Table is 200 lines of setup |

**Key insight:** This phase's complexity is in the data transformation correctness (CSV quoting, Zod validation) not in UI framework choices. Keep UI simple; invest in correctness.

---

## Common Pitfalls

### Pitfall 1: Backspace in Side Panel Deletes Selected Node

**What goes wrong:** Admin types in the Name input field, hits Backspace to correct a typo — and the selected node disappears because the global `keydown` handler fires DELETE_NODE.

**Why it happens:** `window.addEventListener('keydown', handler)` receives ALL key events, not just those from the canvas.

**How to avoid:**
```typescript
const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
  (document.activeElement as HTMLElement)?.tagName ?? ''
)
if (isInputFocused) return
```
**Warning signs:** Any test that types in a field while a node is selected will trigger this bug.

### Pitfall 2: CSV Values with Commas Break Export Round-Trip

**What goes wrong:** A node named `"Room 204, East Wing"` exports as `Room 204, East Wing` (unquoted). On import, PapaParse splits it into two columns, corrupting the row.

**Why it happens:** Naively joining with `.join(',')` doesn't quote values containing commas.

**How to avoid:** Use the `toCsvRow` helper shown in Pattern 7 that wraps commas/quotes/newlines in double-quotes.

**Warning signs:** Export a node with a comma in the label, re-import it, verify the label is preserved exactly.

### Pitfall 3: Import Doesn't Reset File Input Value

**What goes wrong:** Admin imports `nodes.csv`, corrects errors, tries to re-import the same filename — browser doesn't trigger `onChange` because the input already has that file selected.

**Why it happens:** HTML file inputs don't fire `onChange` if the same file is selected again.

**How to avoid:** After processing an import (success or failure), reset the file input: `fileInputRef.current.value = ''`.

### Pitfall 4: Dangling Edges After Node Delete from Table

**What goes wrong:** Table's Delete button calls `dispatch({ type: 'DELETE_NODE', id })` but the reducer only removes the node, not connected edges. The canvas then renders edges with no source/target node — crashes on label lookup.

**Why it happens:** If DELETE_NODE reducer forgets to cascade to edges.

**How to avoid:** The reducer's DELETE_NODE case MUST filter `state.edges` to remove any edge where `sourceId === id || targetId === id`. This is locked in the reducer, not in the UI callers.

### Pitfall 5: Zod v4 `.parse()` Throws on First Error

**What goes wrong:** Using `schema.parse(data)` instead of `schema.safeParse(data)` — throws on first error, preventing collection of ALL validation errors.

**Why it happens:** `parse()` is the throwing variant; `safeParse()` returns `{ success, data, error }`.

**How to avoid:** Always use `navGraphSchema.safeParse()` for import validation. Extract all errors from `result.error.issues` array.

**Zod v4 note:** The project uses Zod 4.3.6. In Zod v4, the API is identical to v3 for `.safeParse()`. No migration concern here.

### Pitfall 6: Inline Edit Loses Value on Tab Key

**What goes wrong:** Admin clicks a Name cell to edit, presses Tab to move to next field — the edit commits (onBlur fires), but Tab navigation skips to a browser default element rather than the next table cell.

**Why it happens:** `onBlur` fires before the Tab navigation completes. The value is saved but Tab goes to browser chrome.

**How to avoid (Claude's discretion):** Either accept Tab-triggers-save behavior (simple), or add `onKeyDown` handler that calls `e.preventDefault()` on Tab and manually focuses the next input. For this admin tool, simple blur-save is acceptable.

### Pitfall 7: Import Payload Missing `metadata` Field

**What goes wrong:** Admin exports JSON (which includes metadata), edits it externally, accidentally removes the metadata block, re-imports — Zod rejects if metadata is required.

**How to avoid:** Make `metadata` optional in the Zod schema for import (the LOAD_GRAPH action only needs nodes + edges). The `navGraphSchema.metadata` field should be `.optional()`.

---

## Code Examples

### FileReader for Import (browser-side)

```typescript
// DataTabToolbar.tsx or importExport.ts
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file, 'utf-8')
  })
}

async function handleJsonFileSelected(file: File) {
  const text = await readFileAsText(file)
  const result = handleJsonImport(text)
  if (!result.ok) {
    setImportErrors(result.errors)
    return
  }
  dispatch({ type: 'LOAD_GRAPH', nodes: result.graph.nodes, edges: result.graph.edges })
  recordHistory()
  setImportErrors([])
}
```

### Trigger Browser Download

```typescript
// Source: standard browser Blob API — no library needed
function triggerDownload(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

### Nodes Table Skeleton with Sort

```typescript
// NodeDataTable.tsx — client-side sort via useMemo
const [sortField, setSortField] = useState<'label' | 'type' | 'floor'>('label')
const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
const [filterText, setFilterText] = useState('')
const [filterType, setFilterType] = useState<NavNodeType | 'all'>('all')

const sorted = useMemo(() => {
  const filtered = nodes
    .filter((n) => n.label.toLowerCase().includes(filterText.toLowerCase()))
    .filter((n) => filterType === 'all' || n.type === filterType)
  return [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortField === 'label') return a.label.localeCompare(b.label) * dir
    if (sortField === 'floor') return (a.floor - b.floor) * dir
    return a.type.localeCompare(b.type) * dir
  })
}, [nodes, filterText, filterType, sortField, sortDir])
```

### Accessible Inline Checkbox for Edges Table

```typescript
// EdgeDataTable.tsx — Accessible column is inline-editable
<td>
  <input
    type="checkbox"
    checked={edge.accessible}
    onChange={(e) => {
      onUpdateEdge(edge.id, {
        accessible: e.target.checked,
        accessibleWeight: e.target.checked ? edge.standardWeight : 1e10,
      })
      recordHistory()
    }}
    className="w-4 h-4 accent-green-600"
    aria-label={`Edge ${edge.id} accessible`}
  />
</td>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full table library (react-table v7) for any table | TanStack Table v8 headless (or plain HTML for small data) | 2022 (v8 release) | Headless means you write the markup; for small datasets, plain HTML is now preferred |
| PapaParse v4 | PapaParse v5.x (current: 5.5.3) | 2019 | Streaming large files, web worker support; API stable |
| Blob download via `window.URL` | `URL.createObjectURL` (standard API) | ~2018 | Now standard in all evergreen browsers |
| React 18 `<Suspense>` for hidden tabs | React 19 `<Activity>` for keep-alive | 2025 (React 19) | Activity preserves state with `display:none`; BUT this is experimental and not needed — plain `hidden` div accomplishes the same result for this use case |

**Deprecated/outdated:**
- `react-table` v7 (not v8): API changed completely in v8; avoid any tutorials using `useTable` hook from v7.
- `FileReader.readAsText` with `encoding` param: not available in all browsers as the second argument to readAsText. Use `new TextDecoder` for encoding control, or rely on PapaParse which handles encoding internally.

---

## Open Questions

1. **Error display format for import validation errors (Claude's Discretion)**
   - What we know: The decision is Claude's discretion. Options: inline red list below the import button, a modal dialog, or toast notifications.
   - What's unclear: How many errors could realistically appear (1? 20? 100?)?
   - Recommendation: Use an inline error list below the import button (no extra library). A collapsible `<details>` element works for long lists. Toast is too transient for errors that require user action. Modal adds complexity.

2. **Pagination vs virtual scroll (Claude's Discretion)**
   - What we know: The dataset is small (campus graph = tens to low hundreds of nodes). Virtual scroll adds significant complexity (react-window or react-virtual).
   - What's unclear: Nothing — this is unambiguous given the dataset size.
   - Recommendation: No pagination, no virtual scroll. Render all rows. The browser handles 300 table rows trivially. Add pagination only if validated by actual performance testing showing >100ms render times.

3. **"Locate on map" centering behavior**
   - What we know: Clicking a row selects the node/edge via dispatch. Switching to Map tab shows it highlighted.
   - What's unclear: Whether to auto-pan the Konva stage to center the selected node.
   - Recommendation: Implement auto-pan. The pattern already exists in the student app (`Konva.Tween` for auto-pan). Trigger it when `activeTab` switches from 'data' to 'map' and `selectedNodeId` is non-null. Uses existing `stageRef` and `imageRect`.

---

## Sources

### Primary (HIGH confidence)
- Project codebase — `src/client/hooks/useEditorState.ts`: Confirmed reducer pattern, existing action types, undo/redo architecture
- Project codebase — `src/client/pages/admin/MapEditorCanvas.tsx`: Confirmed existing keyboard handler pattern, stage ref usage
- Project codebase — `src/shared/types.ts`: NavNode, NavEdge, NavGraph exact shapes for Zod schema construction
- Project codebase — `package.json`: Zod 4.3.6 confirmed installed; papaparse NOT installed (needs adding)
- [PapaParse official](https://www.papaparse.com/) — bundle size 7.6KB gzipped, no dependencies, handles RFC 4180 edge cases
- Browser Blob API — standard, universally supported in all modern browsers

### Secondary (MEDIUM confidence)
- [TanStack Table docs](https://tanstack.com/table/latest/docs/introduction) — confirmed headless architecture; supports inline editing via custom cell renderers
- [LogRocket: Inline editable UI in React](https://blog.logrocket.com/build-inline-editable-ui-react/) — click-to-swap-input pattern verified
- [React graph editor keyboard delete issue](https://github.com/wbkd/react-flow/issues/2254) — confirmed the `document.activeElement` guard is the standard fix
- [Data import UX patterns](https://www.importcsv.com/blog/data-import-ux) — "reject whole file, show all errors" is validated UX pattern

### Tertiary (LOW confidence — for awareness only)
- React 19 `<Activity>` component: Experimental API, not yet stable. The simpler `hidden` class approach is more appropriate for this use case and doesn't require upgrading to an experimental React API.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries confirmed by package.json and official docs; only papaparse is new
- Architecture: HIGH — Extension of proven Phase 9 patterns; reducer, Konva mounting, keyboard handlers all established
- Pitfalls: HIGH — Backspace-in-input, CSV quoting, file input reset are documented issues in graph editor literature and browser standards
- Import/export patterns: HIGH — Blob API and PapaParse are mature, stable, well-documented

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (30 days — stack is stable)
