import type { NavNode, NavNodeType } from '@shared/types'
import { useMemo, useState } from 'react'

const NODE_TYPES: NavNodeType[] = [
  'room',
  'entrance',
  'elevator',
  'stairs',
  'ramp',
  'restroom',
  'junction',
  'hallway',
  'landmark',
]
type SortField = 'label' | 'type' | 'floor'

interface NodeDataTableProps {
  nodes: NavNode[]
  selectedNodeId: string | null
  onUpdateNode: (id: string, updates: Partial<NavNode>) => void
  onDeleteNode: (id: string) => void
  onSelectNode: (id: string) => void
}

export function NodeDataTable({
  nodes,
  selectedNodeId,
  onUpdateNode,
  onDeleteNode,
  onSelectNode,
}: NodeDataTableProps) {
  const [sortField, setSortField] = useState<SortField>('label')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filterText, setFilterText] = useState('')
  const [filterType, setFilterType] = useState<NavNodeType | 'all'>('all')
  const [editingCell, setEditingCell] = useState<{
    rowId: string
    field: 'label' | 'type' | 'roomNumber'
  } | null>(null)
  const [editValue, setEditValue] = useState('')

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
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

  function commitEdit(node: NavNode, field: 'label' | 'type' | 'roomNumber') {
    if (field === 'label') onUpdateNode(node.id, { label: editValue })
    else if (field === 'type') onUpdateNode(node.id, { type: editValue as NavNodeType })
    else if (field === 'roomNumber') {
      const trimmed = editValue.trim()
      // Empty string treated as undefined (removes room number).
      // Spread conditional key to satisfy exactOptionalPropertyTypes.
      onUpdateNode(node.id, trimmed === '' ? {} : { roomNumber: trimmed })
    }
    setEditingCell(null)
  }

  const sortIcon = (field: SortField) =>
    sortField === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

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
          {NODE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      {/* Table */}
      <div className="overflow-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th
                className="cursor-pointer px-3 py-2 text-left"
                onClick={() => toggleSort('label')}
              >
                Name{sortIcon('label')}
              </th>
              <th className="cursor-pointer px-3 py-2 text-left" onClick={() => toggleSort('type')}>
                Type{sortIcon('type')}
              </th>
              <th className="px-3 py-2 text-left">Room #</th>
              <th
                className="cursor-pointer px-3 py-2 text-left"
                onClick={() => toggleSort('floor')}
              >
                Floor{sortIcon('floor')}
              </th>
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
                {/* Type — inline editable (dropdown) */}
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: td stopPropagation only, actual interactive elements inside handle keyboard */}
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  {editingCell?.rowId === node.id && editingCell.field === 'type' ? (
                    <select
                      // biome-ignore lint/a11y/noAutofocus: intentional focus for inline edit UX
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => commitEdit(node, 'type')}
                      className="rounded border border-blue-400 px-1 py-0.5 text-sm focus:outline-none"
                    >
                      {NODE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  ) : (
                    // biome-ignore lint/a11y/useKeyWithClickEvents: inline edit trigger; keyboard handled by surrounding select on activation
                    // biome-ignore lint/a11y/noStaticElementInteractions: span is an inline edit trigger; role would conflict with parent row click
                    <span
                      className="block cursor-pointer rounded px-1 py-0.5 hover:bg-blue-100"
                      onClick={() => {
                        setEditingCell({ rowId: node.id, field: 'type' })
                        setEditValue(node.type)
                      }}
                    >
                      {node.type}
                    </span>
                  )}
                </td>
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
                <td className="px-3 py-2">{node.floor}</td>
                <td className="px-3 py-2">{node.searchable ? 'Yes' : 'No'}</td>
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: td stopPropagation only; button inside handles keyboard */}
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
                <td colSpan={6} className="px-3 py-4 text-center text-gray-400">
                  No nodes match the filter
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400">
        {sorted.length} of {nodes.length} nodes
      </p>
    </div>
  )
}
