---
phase: 14.1-node-selection-fixes-and-admin-room-number-edit
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - src/client/components/admin/NodeDataTable.tsx
  - src/client/components/SearchOverlay.tsx
autonomous: true
requirements: [FIX-05]

must_haves:
  truths:
    - "Clicking the Room # cell in NodeDataTable enters edit mode — an input appears with the current room number"
    - "Pressing Enter or blurring the Room # input commits the edit and updates the node"
    - "Pressing Escape in the Room # input cancels the edit without saving"
    - "Submitting an empty string clears the room number (stored as undefined, not empty string)"
    - "Room # column has no sort header — it is editable but not sortable/filterable"
    - "Search result dropdown shows room number as secondary text when present — e.g. 'Room 204 · room'"
  artifacts:
    - path: "src/client/components/admin/NodeDataTable.tsx"
      provides: "editingCell union extended to include 'roomNumber'; commitEdit handles roomNumber; Room # cell renders inline input"
      contains: "'label' | 'type' | 'roomNumber'"
    - path: "src/client/components/SearchOverlay.tsx"
      provides: "Room number displayed as 'Room {n.roomNumber}' with separator before type label"
      contains: "Room {node.roomNumber}"
  key_links:
    - from: "NodeDataTable Room # cell span onClick"
      to: "setEditingCell({ rowId: node.id, field: 'roomNumber' })"
      via: "same pattern as label cell"
      pattern: "field: 'roomNumber'"
    - from: "NodeDataTable commitEdit roomNumber"
      to: "onUpdateNode(node.id, { roomNumber: editValue.trim() === '' ? undefined : editValue.trim() })"
      via: "empty string treated as undefined (removes field)"
      pattern: "roomNumber: editValue.trim"
    - from: "SearchOverlay result item secondary row"
      to: "node.roomNumber"
      via: "conditional span with 'Room {n}' prefix and separator"
      pattern: "Room.*roomNumber"
---

<objective>
Add inline editing to the Room # column in NodeDataTable (consistent with the existing Name/Type pattern), and improve room number display in the SearchOverlay result dropdown to show "Room 204" with a separator rather than the raw value "204".

Purpose: Room numbers are the most practically useful identifier for students and admins. The data table edit is blocked, and the search dropdown currently shows a bare number with no context.
Output: NodeDataTable Room # cell gains inline edit; SearchOverlay result items show "Room 204 · room" secondary text.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/14.1-node-selection-fixes-and-admin-room-number-edit/14.1-RESEARCH.md

<interfaces>
<!-- Key interfaces the executor needs. Extracted from codebase. -->

From src/client/components/admin/NodeDataTable.tsx (current state — editingCell and commitEdit):
```typescript
// Line 36 — current editingCell type (needs extending):
const [editingCell, setEditingCell] = useState<{ rowId: string; field: 'label' | 'type' } | null>(null)

// Line 61 — current commitEdit (needs roomNumber branch):
function commitEdit(node: NavNode, field: 'label' | 'type') {
  if (field === 'label') onUpdateNode(node.id, { label: editValue })
  else onUpdateNode(node.id, { type: editValue as NavNodeType })
  setEditingCell(null)
}

// Line 187 — current Room # cell (static, needs replacement):
<td className="px-3 py-2 text-gray-500">{node.roomNumber ?? '—'}</td>
```

From src/client/components/admin/NodeDataTable.tsx (label cell pattern — replicate for roomNumber):
```typescript
// Lines 128-154 — label cell inline edit pattern:
{/* biome-ignore lint/a11y/useKeyWithClickEvents: td stopPropagation only, actual interactive elements inside handle keyboard */}
<td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
  {editingCell?.rowId === node.id && editingCell.field === 'label' ? (
    <input
      // biome-ignore lint/a11y/noAutofocus: intentional focus for inline edit UX
      autoFocus
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={() => commitEdit(node, 'label')}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commitEdit(node, 'label')
      }}
      className="w-full rounded border border-blue-400 px-1 py-0.5 text-sm focus:outline-none"
    />
  ) : (
    // biome-ignore lint/a11y/useKeyWithClickEvents: inline edit trigger; keyboard handled by surrounding input on activation
    // biome-ignore lint/a11y/noStaticElementInteractions: span is an inline edit trigger; role would conflict with parent row click
    <span
      className="block cursor-text rounded px-1 py-0.5 hover:bg-blue-100"
      onClick={() => {
        setEditingCell({ rowId: node.id, field: 'label' })
        setEditValue(node.label)
      }}
    >
      {node.label}
    </span>
  )}
</td>
```

From src/client/components/SearchOverlay.tsx (current room number display — lines 306-309):
```typescript
<div className="text-xs text-slate-400 flex gap-2">
  {node.roomNumber && <span>{node.roomNumber}</span>}   {/* shows raw "204" */}
  <span>{TYPE_LABELS[node.type] ?? node.type}</span>
</div>
```

From src/shared/types.ts (NavNode.roomNumber is optional string):
```typescript
roomNumber?: string   // optional — undefined means no room number
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add roomNumber inline editing to NodeDataTable</name>
  <files>src/client/components/admin/NodeDataTable.tsx</files>
  <action>
Three changes to `NodeDataTable.tsx`:

**Change 1 — Extend editingCell type (line 36):**
```typescript
const [editingCell, setEditingCell] = useState<{
  rowId: string
  field: 'label' | 'type' | 'roomNumber'
} | null>(null)
```

**Change 2 — Extend commitEdit function signature and add roomNumber branch:**
```typescript
function commitEdit(node: NavNode, field: 'label' | 'type' | 'roomNumber') {
  if (field === 'label') onUpdateNode(node.id, { label: editValue })
  else if (field === 'type') onUpdateNode(node.id, { type: editValue as NavNodeType })
  else if (field === 'roomNumber') {
    // Empty string treated as undefined (removes room number)
    onUpdateNode(node.id, { roomNumber: editValue.trim() === '' ? undefined : editValue.trim() })
  }
  setEditingCell(null)
}
```

**Change 3 — Replace static Room # cell (line 187) with inline-edit cell:**

Replace:
```typescript
<td className="px-3 py-2 text-gray-500">{node.roomNumber ?? '—'}</td>
```

With the full inline-edit cell (mirroring the label cell pattern exactly, plus Escape-cancel):
```typescript
{/* Room # — inline editable */}
{/* biome-ignore lint/a11y/useKeyWithClickEvents: td stopPropagation only, actual interactive elements inside handle keyboard */}
<td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
  {editingCell?.rowId === node.id && editingCell.field === 'roomNumber' ? (
    <input
      // biome-ignore lint/a11y/noAutofocus: intentional focus for inline edit UX
      autoFocus
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={() => commitEdit(node, 'roomNumber')}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commitEdit(node, 'roomNumber')
        if (e.key === 'Escape') setEditingCell(null)
      }}
      className="w-full rounded border border-blue-400 px-1 py-0.5 text-sm focus:outline-none"
    />
  ) : (
    // biome-ignore lint/a11y/useKeyWithClickEvents: inline edit trigger; keyboard handled by surrounding input on activation
    // biome-ignore lint/a11y/noStaticElementInteractions: span is an inline edit trigger
    <span
      className="block cursor-text rounded px-1 py-0.5 text-gray-500 hover:bg-blue-100"
      onClick={() => {
        setEditingCell({ rowId: node.id, field: 'roomNumber' })
        setEditValue(node.roomNumber ?? '')
      }}
    >
      {node.roomNumber ?? '—'}
    </span>
  )}
</td>
```

Key differences from label cell:
- Span has `text-gray-500` class (room number is secondary info, lighter than label)
- Escape key cancels edit (label cell has no Escape handler — adding Escape here is additive, not a breaking pattern change)
- `setEditValue(node.roomNumber ?? '')` — initializes to empty string if room number absent (not undefined)
- `commitEdit` sends `undefined` when trimmed value is empty (not `''`) — avoids storing empty strings

Note: The Room # column header (`<th className="px-3 py-2 text-left">Room #</th>`) has no sort click handler already — no change needed there per CONTEXT.md ("Not sortable or filterable").
  </action>
  <verify>
    <automated>rtk tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
    - editingCell type includes 'roomNumber' in union
    - commitEdit handles roomNumber with empty-string-to-undefined conversion
    - Room # cell renders inline input on click, commits on Enter/blur, cancels on Escape
    - TypeScript passes with no errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Improve room number secondary text in SearchOverlay results</name>
  <files>src/client/components/SearchOverlay.tsx</files>
  <action>
Update the secondary text row in the search result list items to display room numbers as "Room 204" with a separator before the type label, instead of the raw value "204".

Find the current secondary text div (around line 306):
```typescript
<div className="text-xs text-slate-400 flex gap-2">
  {node.roomNumber && <span>{node.roomNumber}</span>}
  <span>{TYPE_LABELS[node.type] ?? node.type}</span>
</div>
```

Replace with:
```typescript
<div className="text-xs text-slate-400 flex gap-1 items-center">
  {node.roomNumber && (
    <>
      <span>Room {node.roomNumber}</span>
      <span>·</span>
    </>
  )}
  <span>{TYPE_LABELS[node.type] ?? node.type}</span>
</div>
```

This renders as "Room 204 · room" when a room number is present, or just "room" when absent. The `·` separator is conditionally rendered only when there is a room number — so the type label is never prefixed with an orphan separator.

Styling notes:
- `gap-1` instead of `gap-2` — smaller gap for tighter "Room 204 · room" grouping
- `items-center` — vertical alignment for the dot separator
- The `·` separator sits between roomNumber and type, not after type

This change only affects the compact search results list (the `displayResults.map(...)` block). The nearest-results block uses the same component structure if it exists — check if there is a second `.map()` for nearestResults that also renders the same secondary div, and apply the same change if so.
  </action>
  <verify>
    <automated>rtk tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
    - Search result items show "Room 204 · room" when roomNumber is present
    - Items without roomNumber show just the type label (no orphan separator)
    - TypeScript passes with no errors
    - rtk lint reports no new violations
  </done>
</task>

</tasks>

<verification>
After both tasks:
1. `rtk tsc --noEmit` — zero TypeScript errors
2. `rtk lint` — zero new Biome violations
3. Admin data table: click Room # cell → input appears with current value → type new value → Enter commits → node updated ✓; clear the field → Enter → cell shows "—" ✓; click → Escape → no change ✓
4. Student search: search for a room with a room number → result shows "Room 204 · room" ✓; room without number shows just type label ✓
</verification>

<success_criteria>
- NodeDataTable Room # column supports inline editing consistent with Name and Type columns
- Empty room number input clears the room number (stored as undefined, not empty string)
- Escape cancels Room # edit without saving
- SearchOverlay shows "Room {n}" with separator before type label when room number is present
- TypeScript and Biome pass with zero errors
</success_criteria>

<output>
After completion, create `.planning/phases/14.1-node-selection-fixes-and-admin-room-number-edit/14.1-03-SUMMARY.md`
</output>
