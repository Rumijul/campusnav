import type { NavBuilding, NavEdge, NavNode, NavNodeType } from '@shared/types'
import type { ConnectorCandidate, ConnectorDirection } from './connectorLinking'
import { formatConnectorCandidateLabel, isConnectorNodeType } from './connectorLinking'

/* ──────────────── Helpers ──────────────── */

const LANDMARK_TYPES = new Set<NavNodeType>([
  'room',
  'entrance',
  'elevator',
  'restroom',
  'landmark',
])

function isLandmarkType(type: NavNodeType): boolean {
  return LANDMARK_TYPES.has(type)
}

const NODE_TYPE_LABELS: Record<NavNodeType, string> = {
  room: 'Room',
  entrance: 'Entrance',
  elevator: 'Elevator',
  restroom: 'Restroom',
  landmark: 'Landmark',
  stairs: 'Stairs',
  ramp: 'Ramp',
  junction: 'Hallway Junction',
  hallway: 'Hallway',
}

function resolveConnectorSelectValue(
  currentNodeId: string | undefined,
  options: ConnectorCandidate[],
): string {
  if (!currentNodeId) return ''
  return options.some((candidate) => candidate.nodeId === currentNodeId) ? currentNodeId : ''
}

/* ──────────────── Props ──────────────── */

interface EditorSidePanelProps {
  selectedNode: NavNode | null
  selectedEdge: (NavEdge & { sourceName: string; targetName: string }) | null
  onUpdateNode: (id: string, changes: Partial<NavNode>) => void
  onUpdateEdge: (id: string, changes: Partial<NavEdge>) => void
  onDeleteNode: (id: string) => void
  onDeleteEdge: (id: string) => void
  onClose: () => void
  isCampusActive?: boolean
  buildings?: NavBuilding[]
  connectorCandidates?: { above: ConnectorCandidate[]; below: ConnectorCandidate[] }
  onConnectorLinkChange?: (direction: ConnectorDirection, targetNodeId: string | null) => void
  connectorLinkError?: string | null
  isConnectorLinkPending?: boolean
}

/* ──────────────── Component ──────────────── */

export default function EditorSidePanel({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge,
  onClose,
  isCampusActive,
  buildings,
  connectorCandidates,
  onConnectorLinkChange,
  connectorLinkError,
  isConnectorLinkPending,
}: EditorSidePanelProps) {
  if (!selectedNode && !selectedEdge) return null

  const aboveCandidates = connectorCandidates?.above ?? []
  const belowCandidates = connectorCandidates?.below ?? []
  const showFloorConnections =
    !!selectedNode && !isCampusActive && isConnectorNodeType(selectedNode.type)
  const selectedAboveNodeId = selectedNode
    ? resolveConnectorSelectValue(selectedNode.connectsToNodeAboveId, aboveCandidates)
    : ''
  const selectedBelowNodeId = selectedNode
    ? resolveConnectorSelectValue(selectedNode.connectsToNodeBelowId, belowCandidates)
    : ''

  return (
    <div className="absolute right-0 top-0 h-full w-72 bg-white border-l shadow-lg overflow-y-auto z-10 flex flex-col">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <span className="font-semibold text-gray-800 text-sm">
          {selectedNode ? 'Node Properties' : 'Edge Properties'}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 focus:outline-none text-lg leading-none"
          aria-label="Close panel"
        >
          x
        </button>
      </div>

      {/* Node Editing Form */}
      {selectedNode && (
        <div className="p-4 flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="node-name"
              className="text-xs font-medium text-gray-600 uppercase tracking-wide"
            >
              Name
            </label>
            <input
              id="node-name"
              type="text"
              value={selectedNode.label}
              onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
              className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="node-type"
              className="text-xs font-medium text-gray-600 uppercase tracking-wide"
            >
              Type
            </label>
            <select
              id="node-type"
              value={selectedNode.type}
              onChange={(e) => {
                const newType = e.target.value as NavNodeType
                onUpdateNode(selectedNode.id, {
                  type: newType,
                  searchable: isLandmarkType(newType),
                })
              }}
              className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <optgroup label="Visible to Students">
                <option value="room">Room</option>
                <option value="entrance">Entrance</option>
                <option value="elevator">Elevator</option>
                <option value="restroom">Restroom</option>
                <option value="landmark">Landmark</option>
              </optgroup>
              <optgroup label="Navigation Only (Hidden)">
                <option value="stairs">Stairs</option>
                <option value="ramp">Ramp</option>
                <option value="junction">Junction</option>
                <option value="hallway">Hallway</option>
              </optgroup>
            </select>
          </div>

          {/* Links to Building — campus entrance only */}
          {isCampusActive && selectedNode.type === 'entrance' && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="node-building-link"
                className="text-xs font-medium text-gray-600 uppercase tracking-wide"
              >
                Links to Building
              </label>
              <select
                id="node-building-link"
                value={selectedNode.connectsToBuildingId ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  onUpdateNode(
                    selectedNode.id,
                    val ? { connectsToBuildingId: Number(val) } : {},
                  )
                }}
                className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">— None —</option>
                {(buildings ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                {selectedNode.connectsToBuildingId
                  ? 'This entrance bridges to a building for cross-building routing.'
                  : 'Select a building to enable cross-building pathfinding.'}
              </p>
            </div>
          )}

          {/* Category (read-only display, no input to associate) */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Category
            </span>
            <p className="text-sm text-gray-700 px-2 py-1.5 bg-gray-50 rounded border">
              {NODE_TYPE_LABELS[selectedNode.type]}
            </p>
          </div>

          {/* Floor connector linking controls */}
          {showFloorConnections && (
            <div className="flex flex-col gap-3 rounded border border-blue-100 bg-blue-50/40 p-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Floor Connections
                </span>
                <p className="text-xs text-gray-500">
                  Link this connector to nodes on the floor above or below.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="connector-above"
                  className="text-xs font-medium text-gray-600 uppercase tracking-wide"
                >
                  Above
                </label>
                <select
                  id="connector-above"
                  value={selectedAboveNodeId}
                  onChange={(e) => onConnectorLinkChange?.('above', e.target.value || null)}
                  disabled={!onConnectorLinkChange || isConnectorLinkPending}
                  className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Unlink</option>
                  {aboveCandidates.map((candidate) => (
                    <option key={candidate.nodeId} value={candidate.nodeId}>
                      {formatConnectorCandidateLabel(candidate)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="connector-below"
                  className="text-xs font-medium text-gray-600 uppercase tracking-wide"
                >
                  Below
                </label>
                <select
                  id="connector-below"
                  value={selectedBelowNodeId}
                  onChange={(e) => onConnectorLinkChange?.('below', e.target.value || null)}
                  disabled={!onConnectorLinkChange || isConnectorLinkPending}
                  className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Unlink</option>
                  {belowCandidates.map((candidate) => (
                    <option key={candidate.nodeId} value={candidate.nodeId}>
                      {formatConnectorCandidateLabel(candidate)}
                    </option>
                  ))}
                </select>
              </div>

              {connectorLinkError && (
                <p role="alert" className="text-xs text-red-700" aria-live="polite">
                  {connectorLinkError}
                </p>
              )}
            </div>
          )}

          {/* Room Number */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="node-room-number"
              className="text-xs font-medium text-gray-600 uppercase tracking-wide"
            >
              Room Number <span className="text-gray-400 normal-case font-normal">(optional)</span>
            </label>
            <input
              id="node-room-number"
              type="text"
              value={selectedNode.roomNumber ?? ''}
              onChange={(e) => onUpdateNode(selectedNode.id, { roomNumber: e.target.value })}
              placeholder="e.g. 204"
              className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="node-description"
              className="text-xs font-medium text-gray-600 uppercase tracking-wide"
            >
              Description <span className="text-gray-400 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              id="node-description"
              value={selectedNode.description ?? ''}
              onChange={(e) => onUpdateNode(selectedNode.id, { description: e.target.value })}
              placeholder="Brief description..."
              rows={3}
              className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Searchable indicator */}
          <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
            {isLandmarkType(selectedNode.type) ? (
              <span className="text-green-700">Visible to students in search results</span>
            ) : (
              <span className="text-gray-500">Hidden from students (navigation only)</span>
            )}
          </div>

          {/* Delete Node */}
          <button
            type="button"
            onClick={() => onDeleteNode(selectedNode.id)}
            className="mt-4 w-full rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete Node
          </button>
        </div>
      )}

      {/* Edge Editing Form */}
      {selectedEdge && (
        <div className="p-4 flex flex-col gap-4">
          {/* Source → Target (read-only display) */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Connection
            </span>
            <p className="text-sm text-gray-700 px-2 py-1.5 bg-gray-50 rounded border">
              {selectedEdge.sourceName} &rarr; {selectedEdge.targetName}
            </p>
          </div>

          {/* Distance / Weight */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="edge-weight"
              className="text-xs font-medium text-gray-600 uppercase tracking-wide"
            >
              Distance (weight)
            </label>
            <input
              id="edge-weight"
              type="number"
              step="0.001"
              value={selectedEdge.standardWeight}
              onChange={(e) => {
                const val = Number.parseFloat(e.target.value)
                if (Number.isNaN(val)) return
                const changes: Partial<NavEdge> = { standardWeight: val }
                if (selectedEdge.accessible) {
                  changes.accessibleWeight = val
                }
                onUpdateEdge(selectedEdge.id, changes)
              }}
              className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Wheelchair Accessible */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Wheelchair Accessible
            </span>
            <label htmlFor="edge-accessible" className="flex items-center gap-2 cursor-pointer">
              <input
                id="edge-accessible"
                type="checkbox"
                checked={selectedEdge.accessible}
                onChange={(e) => {
                  if (e.target.checked) {
                    onUpdateEdge(selectedEdge.id, {
                      accessible: true,
                      accessibleWeight: selectedEdge.standardWeight,
                    })
                  } else {
                    onUpdateEdge(selectedEdge.id, {
                      accessible: false,
                      accessibleWeight: 1e10,
                    })
                  }
                }}
                className="w-4 h-4 accent-green-600"
              />
              <span className="text-sm text-gray-700">
                {selectedEdge.accessible ? 'Accessible' : 'Not accessible'}
              </span>
            </label>
          </div>

          {/* Accessibility Notes */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="edge-a11y-notes"
              className="text-xs font-medium text-gray-600 uppercase tracking-wide"
            >
              Accessibility Notes{' '}
              <span className="text-gray-400 normal-case font-normal">(optional)</span>
            </label>
            <input
              id="edge-a11y-notes"
              type="text"
              value={selectedEdge.accessibilityNotes ?? ''}
              onChange={(e) =>
                onUpdateEdge(selectedEdge.id, { accessibilityNotes: e.target.value })
              }
              placeholder='e.g. "3 steps", "narrow doorway"'
              className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Accessibility status indicator */}
          <div className="text-xs rounded p-2 bg-gray-50">
            {selectedEdge.accessible ? (
              <span className="text-green-700">
                Accessible weight: {selectedEdge.accessibleWeight.toFixed(3)}
              </span>
            ) : (
              <span className="text-red-600">Blocked for wheelchair routing (weight = 1e10)</span>
            )}
          </div>

          {/* Delete Edge */}
          <button
            type="button"
            onClick={() => onDeleteEdge(selectedEdge.id)}
            className="mt-4 w-full rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete Edge
          </button>
        </div>
      )}
    </div>
  )
}
