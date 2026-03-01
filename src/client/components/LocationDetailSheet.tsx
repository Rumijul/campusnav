import type { NavNode } from '@shared/types'
import { useEffect, useRef, useState } from 'react'

// ============================================================
// Props
// ============================================================

export interface LocationDetailSheetProps {
  node: NavNode | null // null = sheet hidden (returns null from render)
  onClose: () => void
}

// ============================================================
// Helpers
// ============================================================

const TYPE_LABELS: Record<string, string> = {
  room: 'Room',
  entrance: 'Entrance',
  elevator: 'Elevator',
  restroom: 'Restroom',
  landmark: 'Point of Interest',
}

// ============================================================
// Constants
// ============================================================

const PEEK_HEIGHT = 180 // px — smaller than DirectionsSheet (260) since detail needs less space
const EXPANDED_MAX = 0.75 // fraction of window height

// ============================================================
// Main component — custom CSS bottom sheet (no Vaul)
//
// Renders as position:fixed bottom-0 — only covers the visible
// peek/expanded area. No full-viewport overlay. No pointer-event
// blocking above the sheet. z-40 keeps it below DirectionsSheet (z-50).
// ============================================================

export function LocationDetailSheet({ node, onClose }: LocationDetailSheetProps) {
  const [expanded, setExpanded] = useState(false)
  const nodeId = node?.id

  // Reset to peek whenever node changes (keyed by id)
  // biome-ignore lint/correctness/useExhaustiveDependencies: nodeId is derived from prop node — intentionally react to node identity changes
  useEffect(() => {
    setExpanded(false)
  }, [nodeId])

  // Drag state
  const dragStartY = useRef<number | null>(null)

  function onDragStart(clientY: number) {
    dragStartY.current = clientY
  }

  function onDragMove(clientY: number) {
    if (dragStartY.current === null) return
    const dy = dragStartY.current - clientY // positive = dragging up
    if (dy > 40) setExpanded(true)
    if (dy < -40) setExpanded(false)
  }

  function onDragEnd() {
    dragStartY.current = null
  }

  if (node === null) return null

  const expandedHeight = `${Math.round(window.innerHeight * EXPANDED_MAX)}px`
  const currentHeight = expanded ? expandedHeight : `${PEEK_HEIGHT}px`

  return (
    <section
      aria-label={`Details for ${node.label}`}
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl bg-white shadow-2xl"
      style={{
        height: currentHeight,
        transition: 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      {/* Drag handle */}
      <div
        className="shrink-0 flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          onDragStart(e.clientY)
        }}
        onPointerMove={(e) => onDragMove(e.clientY)}
        onPointerUp={() => onDragEnd()}
        onPointerCancel={() => onDragEnd()}
      >
        <div className="h-1.5 w-10 rounded-full bg-gray-300" />
      </div>

      {/* Header — always visible in peek */}
      <div className="flex items-center justify-between px-5 pb-2 pt-2 shrink-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{node.label}</h2>
          <p className="text-sm font-medium capitalize text-gray-500">
            {TYPE_LABELS[node.type] ?? node.type}
          </p>
        </div>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 shrink-0 ml-3"
          onClick={onClose}
          aria-label="Close location details"
        >
          <span aria-hidden>×</span>
        </button>
      </div>

      {/* Scrollable detail content — visible when expanded */}
      <div className="overflow-y-auto px-5 pb-10 pt-1 flex-1">
        {node.roomNumber && (
          <div className="mb-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Room</p>
            <p className="text-sm text-gray-700">{node.roomNumber}</p>
          </div>
        )}
        {node.description && (
          <div className="mb-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Description</p>
            <p className="text-sm text-gray-700">{node.description}</p>
          </div>
        )}
        <div className="mb-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Floor</p>
          <p className="text-sm text-gray-700">{node.floorId}</p>
        </div>
        {node.accessibilityNotes && (
          <div className="mb-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Accessibility
            </p>
            <p className="text-sm text-gray-700">{node.accessibilityNotes}</p>
          </div>
        )}
      </div>
    </section>
  )
}
