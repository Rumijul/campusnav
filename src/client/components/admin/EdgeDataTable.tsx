import type { NavEdge, NavNode } from '@shared/types'
import { useMemo, useState } from 'react'

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

export function EdgeDataTable({
  edges,
  nodes,
  selectedEdgeId,
  onUpdateEdge,
  onDeleteEdge,
  onSelectEdge,
  recordHistory,
}: EdgeDataTableProps) {
  const [sortField, setSortField] = useState<SortField>('source')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filterText, setFilterText] = useState('')

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n.label])), [nodes])

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
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

  const sortIcon = (field: SortField) =>
    sortField === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

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
              <th
                className="cursor-pointer px-3 py-2 text-left"
                onClick={() => toggleSort('source')}
              >
                Source → Target{sortIcon('source')}
              </th>
              <th
                className="cursor-pointer px-3 py-2 text-left"
                onClick={() => toggleSort('distance')}
              >
                Distance{sortIcon('distance')}
              </th>
              <th
                className="cursor-pointer px-3 py-2 text-left"
                onClick={() => toggleSort('accessible')}
              >
                Accessible{sortIcon('accessible')}
              </th>
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
                  {nodeMap.get(edge.sourceId) ?? edge.sourceId} →{' '}
                  {nodeMap.get(edge.targetId) ?? edge.targetId}
                </td>
                <td className="px-3 py-2">{edge.standardWeight.toFixed(3)}</td>
                {/* Accessible — inline checkbox */}
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: td stopPropagation only; checkbox inside handles keyboard */}
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
                    aria-label="Edge accessible"
                  />
                </td>
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: td stopPropagation only; button inside handles keyboard */}
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
                <td colSpan={4} className="px-3 py-4 text-center text-gray-400">
                  No edges match the filter
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400">
        {sorted.length} of {edges.length} edges
      </p>
    </div>
  )
}
