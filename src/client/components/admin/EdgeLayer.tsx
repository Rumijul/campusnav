import type { NavEdge, NavNode } from '@shared/types'
import { Layer, Line } from 'react-konva'
import type { EditorMode } from '../../hooks/useEditorState'

/* ──────────────── Props ──────────────── */

interface EdgeLayerProps {
  edges: NavEdge[]
  nodes: NavNode[]
  selectedEdgeId: string | null
  pendingEdgeSourceId: string | null
  cursorPosition: { x: number; y: number } | null
  imageRect: { x: number; y: number; width: number; height: number } | null
  mode: EditorMode
  onEdgeClick: (edgeId: string) => void
}

/* ──────────────── Component ──────────────── */

export default function EdgeLayer({
  edges,
  nodes,
  selectedEdgeId,
  pendingEdgeSourceId,
  cursorPosition,
  imageRect,
  mode,
  onEdgeClick,
}: EdgeLayerProps) {
  if (!imageRect) return null

  // Helper to convert normalized node coordinates to canvas pixel coordinates
  const toPixel = (node: { x: number; y: number }) => ({
    px: imageRect.x + node.x * imageRect.width,
    py: imageRect.y + node.y * imageRect.height,
  })

  // Determine rubber-band preview source position
  const pendingSourceNode = pendingEdgeSourceId
    ? nodes.find((n) => n.id === pendingEdgeSourceId)
    : null

  const showRubberBand =
    mode === 'add-edge' && pendingSourceNode !== null && cursorPosition !== null

  return (
    <Layer>
      {/* Render all existing edges */}
      {edges.map((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.sourceId)
        const targetNode = nodes.find((n) => n.id === edge.targetId)

        if (!sourceNode || !targetNode) return null

        const src = toPixel(sourceNode)
        const tgt = toPixel(targetNode)
        const isSelected = edge.id === selectedEdgeId

        const stroke = isSelected ? '#3b82f6' : edge.accessible ? '#22c55e' : '#9ca3af'
        const strokeWidth = isSelected ? 3 : 2

        return (
          <Line
            key={edge.id}
            points={[src.px, src.py, tgt.px, tgt.py]}
            stroke={stroke}
            strokeWidth={strokeWidth}
            listening={true}
            hitStrokeWidth={10}
            onClick={() => onEdgeClick(edge.id)}
            onTap={() => onEdgeClick(edge.id)}
          />
        )
      })}

      {/* Rubber-band preview line during edge creation */}
      {showRubberBand && pendingSourceNode && cursorPosition && (
        <Line
          points={[
            toPixel(pendingSourceNode).px,
            toPixel(pendingSourceNode).py,
            cursorPosition.x,
            cursorPosition.y,
          ]}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[8, 4]}
          listening={false}
        />
      )}
    </Layer>
  )
}
