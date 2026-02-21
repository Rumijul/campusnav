import type { NavEdge, NavNode } from '@shared/types'
import { useRef, useState } from 'react'
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
    if (!result.ok) {
      setImportErrors(result.errors)
      return
    }
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
    if (firstLine.includes('label') && firstLine.includes('type')) {
      const result = parseNodesCsv(text)
      if (!result.ok) {
        setImportErrors(result.errors)
        return
      }
      setImportErrors([])
      onImportGraph(result.data, edges) // merge nodes, keep edges
    } else {
      const result = parseEdgesCsv(text)
      if (!result.ok) {
        setImportErrors(result.errors)
        return
      }
      setImportErrors([])
      onImportGraph(nodes, result.data) // keep nodes, merge edges
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
            onClick={() => {
              exportNodesCsv(nodes)
              exportEdgesCsv(edges)
            }}
            className="rounded bg-gray-700 px-3 py-1 text-sm text-white hover:bg-gray-800"
          >
            Export CSV
          </button>
        </div>
      </div>
      {/* Hidden file inputs */}
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleJsonFile}
      />
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleCsvFile}
      />
      {/* Import error display */}
      {importErrors.length > 0 && (
        <details
          open
          className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700"
        >
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
