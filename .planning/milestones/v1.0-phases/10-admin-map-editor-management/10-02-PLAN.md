---
phase: 10-admin-map-editor-management
plan: 02
type: execute
wave: 2
depends_on: [10-01]
files_modified:
  - src/client/pages/admin/MapEditorCanvas.tsx
  - src/client/components/admin/NodeDataTable.tsx
  - src/client/components/admin/EdgeDataTable.tsx
  - src/client/utils/importExport.ts
  - src/client/components/admin/DataTabToolbar.tsx
  - package.json
autonomous: true
requirements: [EDIT-07, EDIT-08]

must_haves:
  truths:
    - "Admin can switch between Map and Data tabs without losing canvas state or undo history"
    - "Nodes table shows Name, Type, Room #, Floor, Searchable columns sorted A-Z by default with filter bar"
    - "Admin can click a node name or type cell to edit it inline; blur or Enter commits the change"
    - "Edges table shows Source → Target, Distance, Accessible columns sorted by source node name"
    - "Admin can toggle the Accessible checkbox inline in the edges table"
    - "Admin can delete a node or edge from the table's Delete button"
    - "Clicking a table row selects that node/edge on the hidden canvas"
    - "Admin can export the graph as a single campus-graph.json download"
    - "Admin can export nodes and edges as separate nodes.csv and edges.csv downloads"
    - "Admin can import a JSON file — valid file replaces the graph; invalid file shows all errors without saving"
    - "Admin can import a nodes.csv or edges.csv file — valid file merges/replaces; invalid shows all errors"
  artifacts:
    - path: "src/client/pages/admin/MapEditorCanvas.tsx"
      provides: "Tab switcher (map/data) with canvas mounted-but-hidden behind Data tab"
      contains: "activeTab"
    - path: "src/client/components/admin/NodeDataTable.tsx"
      provides: "Sortable/filterable node table with inline Name and Type editing"
      exports: ["NodeDataTable"]
    - path: "src/client/components/admin/EdgeDataTable.tsx"
      provides: "Sortable/filterable edge table with inline Accessible checkbox"
      exports: ["EdgeDataTable"]
    - path: "src/client/utils/importExport.ts"
      provides: "exportJson, exportNodesCsv, exportEdgesCsv, handleJsonImport, parseNodesCsv, parseEdgesCsv"
      exports: ["exportJson", "exportNodesCsv", "exportEdgesCsv", "handleJsonImport", "parseNodesCsv", "parseEdgesCsv"]
    - path: "src/client/components/admin/DataTabToolbar.tsx"
      provides: "Import/export buttons and sub-tab switcher (Nodes/Edges) for the Data tab"
      exports: ["DataTabToolbar"]
  key_links:
    - from: "src/client/pages/admin/MapEditorCanvas.tsx"
      to: "src/client/components/admin/NodeDataTable.tsx"
      via: "state.nodes passed as nodes prop; onUpdateNode, onDeleteNode, onSelectNode wired from dispatch"
      pattern: "NodeDataTable"
    - from: "src/client/components/admin/DataTabToolbar.tsx"
      to: "src/client/utils/importExport.ts"
      via: "import export functions called from toolbar button handlers"
      pattern: "exportJson|exportNodesCsv|handleJsonImport"
    - from: "src/client/utils/importExport.ts"
      to: "papaparse"
      via: "Papa.parse for CSV import"
      pattern: "Papa\\.parse"
---

<objective>
Build the Data tab with sortable/filterable node and edge tables (inline editing, row deletion, row selection sync) and the import/export utility for JSON and CSV.

Purpose: EDIT-07 requires a tabular view with inline editing; EDIT-08 requires JSON and CSV import/export. This plan adds the tab switcher, both data tables, and the full import/export surface — completing Phase 10's management tooling.
Output: Tab switcher in MapEditorCanvas; NodeDataTable and EdgeDataTable components; importExport.ts utility; DataTabToolbar with import/export file buttons; PapaParse installed.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/10-admin-map-editor-management/10-01-SUMMARY.md
@.planning/phases/09-admin-map-editor-visual/09-03-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install PapaParse + build importExport utility + DataTabToolbar</name>
  <files>src/client/utils/importExport.ts, src/client/components/admin/DataTabToolbar.tsx, package.json</files>
  <action>
**Step 1 — Install PapaParse:**

```bash
npm install papaparse && npm install --save-dev @types/papaparse
```

**Step 2 — Create `src/client/utils/importExport.ts`:**

This file contains ALL import/export logic. Do NOT scatter it across components.

Implement the following exports:

```typescript
import Papa from 'papaparse'
import { z } from 'zod'
import type { NavNode, NavEdge, NavGraph, NavNodeType } from '@shared/types'

// ─── Zod schemas for validation ───────────────────────────────────────────────

const navNodeTypeValues: [NavNodeType, ...NavNodeType[]] = [
  'room', 'entrance', 'elevator', 'stairs', 'ramp', 'restroom', 'junction', 'hallway', 'landmark',
]

const navNodeSchema = z.object({
  id: z.string().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  label: z.string().min(1),
  type: z.enum(navNodeTypeValues),
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

// ─── Download helper ──────────────────────────────────────────────────────────

function triggerDownload(content: string, mimeType: string, filename: string): void {
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

// ─── CSV quoting helper ───────────────────────────────────────────────────────

function toCsvRow(values: (string | number | boolean | undefined | null)[]): string {
  return values
    .map((v) => {
      const s = v == null ? '' : String(v)
      return /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    })
    .join(',')
}

// ─── JSON export ──────────────────────────────────────────────────────────────

export function exportJson(nodes: NavNode[], edges: NavEdge[]): void {
  const graph: NavGraph = {
    nodes,
    edges,
    metadata: {
      buildingName: 'Main Building',
      floor: 1,
      lastUpdated: new Date().toISOString(),
    },
  }
  triggerDownload(JSON.stringify(graph, null, 2), 'application/json', 'campus-graph.json')
}

// ─── CSV export ───────────────────────────────────────────────────────────────

export function exportNodesCsv(nodes: NavNode[]): void {
  const header = toCsvRow(['id', 'label', 'type', 'floor', 'roomNumber', 'searchable', 'x', 'y', 'description', 'buildingName', 'accessibilityNotes'])
  const rows = nodes.map((n) =>
    toCsvRow([n.id, n.label, n.type, n.floor, n.roomNumber ?? '', n.searchable, n.x, n.y, n.description ?? '', n.buildingName ?? '', n.accessibilityNotes ?? ''])
  )
  const csv = '\ufeff' + [header, ...rows].join('\n')
  triggerDownload(csv, 'text/csv', 'nodes.csv')
}

export function exportEdgesCsv(edges: NavEdge[]): void {
  const header = toCsvRow(['id', 'sourceId', 'targetId', 'standardWeight', 'accessibleWeight', 'accessible', 'bidirectional', 'accessibilityNotes'])
  const rows = edges.map((e) =>
    toCsvRow([e.id, e.sourceId, e.targetId, e.standardWeight, e.accessibleWeight, e.accessible, e.bidirectional, e.accessibilityNotes ?? ''])
  )
  const csv = '\ufeff' + [header, ...rows].join('\n')
  triggerDownload(csv, 'text/csv', 'edges.csv')
}

// ─── JSON import ──────────────────────────────────────────────────────────────

export type ImportResult<T> = { ok: true; data: T } | { ok: false; errors: string[] }

export function handleJsonImport(jsonText: string): ImportResult<{ nodes: NavNode[]; edges: NavEdge[] }> {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return { ok: false, errors: ['File is not valid JSON'] }
  }
  const result = navGraphSchema.safeParse(parsed)
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    return { ok: false, errors }
  }
  return { ok: true, data: { nodes: result.data.nodes as NavNode[], edges: result.data.edges as NavEdge[] } }
}

// ─── CSV import ───────────────────────────────────────────────────────────────

export function parseNodesCsv(csvText: string): ImportResult<NavNode[]> {
  const result = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })
  const errors: string[] = []
  const nodes: NavNode[] = []

  if (result.errors.length > 0) {
    return { ok: false, errors: result.errors.map((e) => `Row ${e.row ?? '?'}: ${e.message}`) }
  }

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i]
    const parsed = navNodeSchema.safeParse({
      id: row['id'],
      x: Number(row['x']),
      y: Number(row['y']),
      label: row['label'],
      type: row['type'],
      searchable: row['searchable'] === 'true',
      floor: Number(row['floor']),
      roomNumber: row['roomNumber'] || undefined,
      description: row['description'] || undefined,
      buildingName: row['buildingName'] || undefined,
      accessibilityNotes: row['accessibilityNotes'] || undefined,
    })
    if (!parsed.success) {
      errors.push(...parsed.error.issues.map((e) => `Row ${i + 2}: ${e.path.join('.')}: ${e.message}`))
    } else {
      nodes.push(parsed.data as NavNode)
    }
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, data: nodes }
}

export function parseEdgesCsv(csvText: string): ImportResult<NavEdge[]> {
  const result = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })
  const errors: string[] = []
  const edges: NavEdge[] = []

  if (result.errors.length > 0) {
    return { ok: false, errors: result.errors.map((e) => `Row ${e.row ?? '?'}: ${e.message}`) }
  }

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i]
    const parsed = navEdgeSchema.safeParse({
      id: row['id'],
      sourceId: row['sourceId'],
      targetId: row['targetId'],
      standardWeight: Number(row['standardWeight']),
      accessibleWeight: Number(row['accessibleWeight']),
      accessible: row['accessible'] === 'true',
      bidirectional: row['bidirectional'] === 'true',
      accessibilityNotes: row['accessibilityNotes'] || undefined,
    })
    if (!parsed.success) {
      errors.push(...parsed.error.issues.map((e) => `Row ${i + 2}: ${e.path.join('.')}: ${e.message}`))
    } else {
      edges.push(parsed.data as NavEdge)
    }
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, data: edges }
}

// ─── FileReader helper ────────────────────────────────────────────────────────

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file, 'utf-8')
  })
}
```

**Step 3 — Create `src/client/components/admin/DataTabToolbar.tsx`:**

This component renders the Data tab's sub-tab switcher (Nodes/Edges) and the import/export buttons. Import errors are displayed inline below the buttons as a collapsible list.

```tsx
import { useRef, useState } from 'react'
import type { NavEdge, NavNode } from '@shared/types'
import {
  exportEdgesCsv,
  exportJson,
  exportNodesCsv,
  handleJsonImport,
  parseEdgesCsv,
  parseNodesCsv,
  readFileAsText,
} from '../../utils/importExport'

interface DataTabToolbarProps {
  nodes: NavNode[]
  edges: NavEdge[]
  activeSubTab: 'nodes' | 'edges'
  onSubTabChange: (tab: 'nodes' | 'edges') => void
  onImportGraph: (nodes: NavNode[], edges: NavEdge[]) => void
}

export function DataTabToolbar({
  nodes,
  edges,
  activeSubTab,
  onSubTabChange,
  onImportGraph,
}: DataTabToolbarProps) {
  const [importErrors, setImportErrors] = useState<string[]>([])
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  async function handleJsonFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset so same file can be re-imported
    const text = await readFileAsText(file)
    const result = handleJsonImport(text)
    if (!result.ok) { setImportErrors(result.errors); return }
    setImportErrors([])
    onImportGraph(result.data.nodes, result.data.edges)
  }

  async function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset for re-import
    const text = await readFileAsText(file)
    // Detect nodes vs edges by checking CSV header
    const firstLine = text.split('\n')[0] ?? ''
    let result: { ok: boolean; errors?: string[]; data?: NavNode[] | NavEdge[] }
    if (firstLine.includes('label') && firstLine.includes('type')) {
      result = parseNodesCsv(text)
      if (!result.ok || !result.data) { setImportErrors(result.errors ?? []); return }
      setImportErrors([])
      onImportGraph(result.data as NavNode[], edges) // merge nodes, keep edges
    } else {
      result = parseEdgesCsv(text)
      if (!result.ok || !result.data) { setImportErrors(result.errors ?? []); return }
      setImportErrors([])
      onImportGraph(nodes, result.data as NavEdge[]) // keep nodes, merge edges
    }
  }

  return (
    <div className="border-b border-gray-200 px-4 py-2">
      {/* Sub-tab switcher */}
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          onClick={() => onSubTabChange('nodes')}
          className={`rounded px-3 py-1 text-sm font-medium ${activeSubTab === 'nodes' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Nodes
        </button>
        <button
          type="button"
          onClick={() => onSubTabChange('edges')}
          className={`rounded px-3 py-1 text-sm font-medium ${activeSubTab === 'edges' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Edges
        </button>
        <div className="ml-auto flex gap-2">
          {/* Import buttons */}
          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
          >
            Import JSON
          </button>
          <button
            type="button"
            onClick={() => csvInputRef.current?.click()}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
          >
            Import CSV
          </button>
          {/* Export buttons */}
          <button
            type="button"
            onClick={() => exportJson(nodes, edges)}
            className="rounded bg-gray-700 px-3 py-1 text-sm text-white hover:bg-gray-800"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => { exportNodesCsv(nodes); exportEdgesCsv(edges) }}
            className="rounded bg-gray-700 px-3 py-1 text-sm text-white hover:bg-gray-800"
          >
            Export CSV
          </button>
        </div>
      </div>
      {/* Hidden file inputs */}
      <input ref={jsonInputRef} type="file" accept=".json" className="hidden" onChange={handleJsonFile} />
      <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvFile} />
      {/* Import error display */}
      {importErrors.length > 0 && (
        <details open className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          <summary className="cursor-pointer font-medium">
            Import failed — {importErrors.length} error{importErrors.length > 1 ? 's' : ''}
          </summary>
          <ul className="mt-1 list-disc pl-4">
            {importErrors.map((err, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: import errors are ephemeral display only
              <li key={i}>{err}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
```

Run `rtk tsc` and `rtk lint` after creating both files.
  </action>
  <verify>rtk tsc passes; rtk lint passes; papaparse appears in package.json dependencies; importExport.ts exports all six functions; DataTabToolbar renders without errors</verify>
  <done>PapaParse installed; importExport.ts contains all export/import/validation logic; DataTabToolbar handles sub-tab switching, import file selection (with error display), and export button clicks</done>
</task>

<task type="auto">
  <name>Task 2: Build NodeDataTable + EdgeDataTable + wire tab switcher in MapEditorCanvas</name>
  <files>src/client/components/admin/NodeDataTable.tsx, src/client/components/admin/EdgeDataTable.tsx, src/client/pages/admin/MapEditorCanvas.tsx</files>
  <action>
**Step 1 — Create `src/client/components/admin/NodeDataTable.tsx`:**

Plain HTML table with React-controlled sort and filter state. No external table library.

```tsx
import { useMemo, useState } from 'react'
import type { NavNode, NavNodeType } from '@shared/types'

const NODE_TYPES: NavNodeType[] = ['room', 'entrance', 'elevator', 'stairs', 'ramp', 'restroom', 'junction', 'hallway', 'landmark']
type SortField = 'label' | 'type' | 'floor'

interface NodeDataTableProps {
  nodes: NavNode[]
  selectedNodeId: string | null
  onUpdateNode: (id: string, updates: Partial<NavNode>) => void
  onDeleteNode: (id: string) => void
  onSelectNode: (id: string) => void
}

export function NodeDataTable({ nodes, selectedNodeId, onUpdateNode, onDeleteNode, onSelectNode }: NodeDataTableProps) {
  const [sortField, setSortField] = useState<SortField>('label')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filterText, setFilterText] = useState('')
  const [filterType, setFilterType] = useState<NavNodeType | 'all'>('all')
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: 'label' | 'type' } | null>(null)
  const [editValue, setEditValue] = useState('')

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

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

  function commitEdit(node: NavNode, field: 'label' | 'type') {
    if (field === 'label') onUpdateNode(node.id, { label: editValue })
    else onUpdateNode(node.id, { type: editValue as NavNodeType })
    setEditingCell(null)
  }

  const sortIcon = (field: SortField) => sortField === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Filter bar */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Filter by name..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as NavNodeType | 'all')}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All types</option>
          {NODE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {/* Table */}
      <div className="overflow-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="cursor-pointer px-3 py-2 text-left" onClick={() => toggleSort('label')}>Name{sortIcon('label')}</th>
              <th className="cursor-pointer px-3 py-2 text-left" onClick={() => toggleSort('type')}>Type{sortIcon('type')}</th>
              <th className="px-3 py-2 text-left">Room #</th>
              <th className="cursor-pointer px-3 py-2 text-left" onClick={() => toggleSort('floor')}>Floor{sortIcon('floor')}</th>
              <th className="px-3 py-2 text-left">Searchable</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((node) => (
              <tr
                key={node.id}
                onClick={() => onSelectNode(node.id)}
                className={`cursor-pointer border-t border-gray-100 hover:bg-blue-50 ${selectedNodeId === node.id ? 'bg-blue-100' : ''}`}
              >
                {/* Name — inline editable */}
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  {editingCell?.rowId === node.id && editingCell.field === 'label' ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => commitEdit(node, 'label')}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(node, 'label') }}
                      className="w-full rounded border border-blue-400 px-1 py-0.5 text-sm focus:outline-none"
                    />
                  ) : (
                    <span
                      className="block cursor-text rounded px-1 py-0.5 hover:bg-blue-100"
                      onClick={() => { setEditingCell({ rowId: node.id, field: 'label' }); setEditValue(node.label) }}
                    >
                      {node.label}
                    </span>
                  )}
                </td>
                {/* Type — inline editable (dropdown) */}
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  {editingCell?.rowId === node.id && editingCell.field === 'type' ? (
                    <select
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => commitEdit(node, 'type')}
                      className="rounded border border-blue-400 px-1 py-0.5 text-sm focus:outline-none"
                    >
                      {NODE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : (
                    <span
                      className="block cursor-pointer rounded px-1 py-0.5 hover:bg-blue-100"
                      onClick={() => { setEditingCell({ rowId: node.id, field: 'type' }); setEditValue(node.type) }}
                    >
                      {node.type}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-500">{node.roomNumber ?? '—'}</td>
                <td className="px-3 py-2">{node.floor}</td>
                <td className="px-3 py-2">{node.searchable ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onDeleteNode(node.id)}
                    className="rounded bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-gray-400">No nodes match the filter</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400">{sorted.length} of {nodes.length} nodes</p>
    </div>
  )
}
```

**Step 2 — Create `src/client/components/admin/EdgeDataTable.tsx`:**

```tsx
import { useMemo, useState } from 'react'
import type { NavEdge, NavNode } from '@shared/types'

type SortField = 'source' | 'distance' | 'accessible'

interface EdgeDataTableProps {
  edges: NavEdge[]
  nodes: NavNode[]
  selectedEdgeId: string | null
  onUpdateEdge: (id: string, updates: Partial<NavEdge>) => void
  onDeleteEdge: (id: string) => void
  onSelectEdge: (id: string) => void
  recordHistory: () => void
}

export function EdgeDataTable({ edges, nodes, selectedEdgeId, onUpdateEdge, onDeleteEdge, onSelectEdge, recordHistory }: EdgeDataTableProps) {
  const [sortField, setSortField] = useState<SortField>('source')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filterText, setFilterText] = useState('')

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n.label])), [nodes])

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    const filtered = edges.filter((e) => {
      const src = nodeMap.get(e.sourceId) ?? e.sourceId
      const tgt = nodeMap.get(e.targetId) ?? e.targetId
      return (
        src.toLowerCase().includes(filterText.toLowerCase()) ||
        tgt.toLowerCase().includes(filterText.toLowerCase())
      )
    })
    return [...filtered].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortField === 'source') {
        const srcA = nodeMap.get(a.sourceId) ?? a.sourceId
        const srcB = nodeMap.get(b.sourceId) ?? b.sourceId
        return srcA.localeCompare(srcB) * dir
      }
      if (sortField === 'distance') return (a.standardWeight - b.standardWeight) * dir
      return (Number(a.accessible) - Number(b.accessible)) * dir
    })
  }, [edges, filterText, sortField, sortDir, nodeMap])

  const sortIcon = (field: SortField) => sortField === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Filter by source or target name..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="overflow-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="cursor-pointer px-3 py-2 text-left" onClick={() => toggleSort('source')}>Source → Target{sortIcon('source')}</th>
              <th className="cursor-pointer px-3 py-2 text-left" onClick={() => toggleSort('distance')}>Distance{sortIcon('distance')}</th>
              <th className="cursor-pointer px-3 py-2 text-left" onClick={() => toggleSort('accessible')}>Accessible{sortIcon('accessible')}</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((edge) => (
              <tr
                key={edge.id}
                onClick={() => onSelectEdge(edge.id)}
                className={`cursor-pointer border-t border-gray-100 hover:bg-blue-50 ${selectedEdgeId === edge.id ? 'bg-blue-100' : ''}`}
              >
                <td className="px-3 py-2">
                  {nodeMap.get(edge.sourceId) ?? edge.sourceId} → {nodeMap.get(edge.targetId) ?? edge.targetId}
                </td>
                <td className="px-3 py-2">{edge.standardWeight.toFixed(3)}</td>
                {/* Accessible — inline checkbox */}
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
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
                    className="h-4 w-4 accent-green-600"
                    aria-label={`Edge accessible`}
                  />
                </td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onDeleteEdge(edge.id)}
                    className="rounded bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-gray-400">No edges match the filter</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400">{sorted.length} of {edges.length} edges</p>
    </div>
  )
}
```

**Step 3 — Extend `MapEditorCanvas.tsx` with tab switcher and Data tab:**

Add tab state at the top of the component (after existing state):

```typescript
const [activeTab, setActiveTab] = useState<'map' | 'data'>('map')
const [activeSubTab, setActiveSubTab] = useState<'nodes' | 'edges'>('nodes')
```

In the JSX, wrap the existing return in a flex-col container. Add a tab bar at the top and conditionally show Map or Data content. The Konva Stage + side panel wrapper gets `className={activeTab !== 'map' ? 'hidden' : 'flex-1 relative'}`. The Data div gets `className={activeTab !== 'data' ? 'hidden' : 'flex-1 overflow-auto'}`.

IMPORTANT: Wrap the Konva Stage container div (not the Stage itself) with the `hidden` class. Konva's Stage accepts its own `style` prop — applying `hidden` to its wrapper div (not to Stage directly) is correct per anti-pattern warning in research.

The top area (above the canvas/data) should contain:
1. The existing EditorToolbar (only shown on Map tab: `className={activeTab !== 'map' ? 'hidden' : ''}`)
2. A tab switcher row with "Map" and "Data" tab buttons (always visible)

Wire the Data tab content:

```tsx
<div className={activeTab !== 'data' ? 'hidden' : 'flex-1 overflow-auto'}>
  <DataTabToolbar
    nodes={state.nodes}
    edges={state.edges}
    activeSubTab={activeSubTab}
    onSubTabChange={setActiveSubTab}
    onImportGraph={(nodes, edges) => {
      dispatch({ type: 'LOAD_GRAPH', nodes, edges })
      recordHistory()
    }}
  />
  {activeSubTab === 'nodes' ? (
    <NodeDataTable
      nodes={state.nodes}
      selectedNodeId={state.selectedNodeId}
      onUpdateNode={(id, updates) => { dispatch({ type: 'UPDATE_NODE', id, updates }); recordHistory() }}
      onDeleteNode={(id) => { dispatch({ type: 'DELETE_NODE', id }); recordHistory() }}
      onSelectNode={(id) => dispatch({ type: 'SELECT_NODE', id })}
    />
  ) : (
    <EdgeDataTable
      edges={state.edges}
      nodes={state.nodes}
      selectedEdgeId={state.selectedEdgeId}
      onUpdateEdge={(id, updates) => { dispatch({ type: 'UPDATE_EDGE', id, updates }); recordHistory() }}
      onDeleteEdge={(id) => { dispatch({ type: 'DELETE_EDGE', id }); recordHistory() }}
      onSelectEdge={(id) => dispatch({ type: 'SELECT_EDGE', id })}
      recordHistory={recordHistory}
    />
  )}
</div>
```

Check what action types already exist in useEditorState for UPDATE_NODE, UPDATE_EDGE, SELECT_NODE, SELECT_EDGE — use the exact names from the existing reducer. If LOAD_GRAPH does not exist as an action type, add it to the reducer (it replaces all nodes + edges, clears selection, sets isDirty: false).

Run `rtk tsc` and `rtk lint` after all changes.
  </action>
  <verify>rtk tsc passes; rtk lint passes; in browser: Map/Data tabs switch correctly; canvas is visible on Map tab, hidden on Data tab (but still mounted); Nodes/Edges sub-tabs switch the table; filter and sort work; inline name edit saves on blur; inline accessible checkbox saves immediately; Delete button removes the row; Export JSON triggers download; Export CSV triggers two downloads (nodes.csv + edges.csv)</verify>
  <done>NodeDataTable renders with sort/filter/inline-edit/delete; EdgeDataTable renders with sort/filter/inline-accessible/delete; tab switcher mounts both in DOM simultaneously (canvas hidden behind Data tab, preserving undo history); DataTabToolbar handles import/export; MapEditorCanvas wires all state connections</done>
</task>

</tasks>

<verification>
1. Run `rtk tsc` — zero errors
2. Run `rtk lint` — zero errors
3. Start dev server, go to admin map editor
4. Verify Map tab shows canvas; Data tab shows table (canvas is hidden, NOT removed)
5. Add several nodes and edges; switch to Data tab — data appears in table
6. Filter nodes by name — table updates live
7. Click a Name cell — becomes editable input; press Enter — value saves; node on canvas updates
8. Click Type cell — becomes dropdown; change type — saves immediately
9. Accessible checkbox in edges table — click toggles accessible state
10. Delete a node from table — node disappears from table and canvas
11. Switch to Map tab — canvas shows updated state; undo (Ctrl+Z) restores deleted node
12. Export JSON — campus-graph.json downloads with correct shape
13. Export CSV — nodes.csv and edges.csv download
14. Import a valid JSON file — graph replaces; Import an invalid JSON — errors shown below import button
</verification>

<success_criteria>
- PapaParse appears in package.json dependencies
- importExport.ts exports all six functions (exportJson, exportNodesCsv, exportEdgesCsv, handleJsonImport, parseNodesCsv, parseEdgesCsv)
- NodeDataTable and EdgeDataTable are standalone components with no external table library
- Tab switcher uses className=hidden on wrapper divs (NOT unmounting either panel)
- rtk tsc and rtk lint pass with zero errors
- Inline edits dispatch UPDATE_NODE/UPDATE_EDGE actions with recordHistory()
- Import uses LOAD_GRAPH dispatch + recordHistory() so it is undoable
</success_criteria>

<output>
After completion, create `.planning/phases/10-admin-map-editor-management/10-02-SUMMARY.md`
</output>
</invoke>