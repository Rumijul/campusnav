import type { NavNode } from '@shared/types'
import { Circle, Group, Layer, Text } from 'react-konva'
import type { EditorMode } from '../../hooks/useEditorState'

/* ──────────────── Constants ──────────────── */

const LANDMARK_RADIUS = 8
const NAV_RADIUS = 4
const SELECTION_RING_RADIUS = 12

/** Node types considered "landmark" (visible to students, shown as pin markers) */
const LANDMARK_TYPES = new Set(['room', 'entrance', 'elevator', 'restroom', 'landmark'])

const TYPE_COLORS: Record<string, string> = {
  room: '#ef4444', // red
  entrance: '#22c55e', // green
  elevator: '#a855f7', // purple
  restroom: '#f59e0b', // amber
  landmark: '#ef4444', // red
}

/** Amber color for campus entrance nodes that bridge to a building — visually distinct from standard entrance green */
const CAMPUS_ENTRANCE_COLOR = '#f59e0b'

/* ──────────────── Props ──────────────── */

interface NodeMarkerLayerProps {
  nodes: NavNode[]
  selectedNodeId: string | null
  stageScale: number
  imageRect: { x: number; y: number; width: number; height: number } | null
  mode: EditorMode
  onNodeClick: (nodeId: string) => void
  onNodeDragEnd: (nodeId: string, normX: number, normY: number) => void
  isCampusActive?: boolean
}

/* ──────────────── Component ──────────────── */

export default function NodeMarkerLayer({
  nodes,
  selectedNodeId,
  stageScale,
  imageRect,
  mode,
  onNodeClick,
  onNodeDragEnd,
  isCampusActive,
}: NodeMarkerLayerProps) {
  if (!imageRect) return null

  const scale = 1 / stageScale

  return (
    <Layer>
      {nodes.map((node) => {
        const pixelX = imageRect.x + node.x * imageRect.width
        const pixelY = imageRect.y + node.y * imageRect.height
        const isSelected = node.id === selectedNodeId
        const isLandmark = LANDMARK_TYPES.has(node.type)
        const isCampusEntrance =
          isCampusActive && node.type === 'entrance' && node.connectsToBuildingId != null
        const fill = isCampusEntrance
          ? CAMPUS_ENTRANCE_COLOR
          : isLandmark
            ? (TYPE_COLORS[node.type] ?? '#ef4444')
            : '#9ca3af'
        const radius = isLandmark ? LANDMARK_RADIUS : NAV_RADIUS

        return (
          <Group
            key={node.id}
            x={pixelX}
            y={pixelY}
            scaleX={scale}
            scaleY={scale}
            draggable={mode === 'select'}
            onClick={(e) => { e.cancelBubble = true; onNodeClick(node.id) }}
            onTap={(e) => { e.cancelBubble = true; onNodeClick(node.id) }}
            onDragEnd={(e) => {
              const pixX = e.target.x()
              const pixY = e.target.y()
              const normX = Math.max(0, Math.min(1, (pixX - imageRect.x) / imageRect.width))
              const normY = Math.max(0, Math.min(1, (pixY - imageRect.y) / imageRect.height))
              onNodeDragEnd(node.id, normX, normY)
            }}
          >
            {/* Selection highlight ring */}
            {isSelected && (
              <Circle
                radius={SELECTION_RING_RADIUS}
                stroke="#3b82f6"
                strokeWidth={2}
                fill="transparent"
              />
            )}

            {/* Main marker */}
            <Circle
              radius={radius}
              fill={fill}
              stroke="#ffffff"
              strokeWidth={isLandmark ? 2 : 1}
              hitFunc={(context, shape) => {
                context.beginPath()
                context.arc(0, 0, Math.max(radius, LANDMARK_RADIUS) * 2.5, 0, Math.PI * 2, true)
                context.closePath()
                context.fillStrokeShape(shape)
              }}
            />

            {/* Label for landmark nodes */}
            {isLandmark && (
              <Text
                text={node.label}
                fontSize={11}
                fill="#1e293b"
                offsetX={40}
                y={radius + 4}
                align="center"
                width={80}
              />
            )}
          </Group>
        )
      })}
    </Layer>
  )
}
