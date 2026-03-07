import type { NavNode } from '@shared/types'
import { Circle, Group, Text } from 'react-konva'

/* ──────────────── Constants ──────────────── */

const SCREEN_RADIUS = 8

const TYPE_COLORS: Record<string, string> = {
  room: '#3b82f6', // blue
  entrance: '#22c55e', // green
  elevator: '#a855f7', // purple
  restroom: '#f59e0b', // amber
  landmark: '#ef4444', // red
}

/* ──────────────── Props ──────────────── */

interface LandmarkMarkerProps {
  node: NavNode
  imageRect: { x: number; y: number; width: number; height: number }
  stageScale: number
  isSelected: boolean
  isLabelVisible: boolean // true when selected OR stageScale >= 2.0
  onClick: () => void
  isDimmed?: boolean
}

/* ──────────────── Component ──────────────── */

export function LandmarkMarker({
  node,
  imageRect,
  stageScale,
  isSelected,
  isLabelVisible,
  onClick,
  isDimmed,
}: LandmarkMarkerProps) {
  // Convert normalized coordinates to pixel position
  const pixelX = imageRect.x + node.x * imageRect.width
  const pixelY = imageRect.y + node.y * imageRect.height
  const scale = 1 / stageScale
  const fill = TYPE_COLORS[node.type] ?? '#64748b'
  const radius = isSelected ? SCREEN_RADIUS * 1.4 : SCREEN_RADIUS

  return (
    <Group x={pixelX} y={pixelY} scaleX={scale} scaleY={scale} onClick={onClick} onTap={onClick} opacity={isDimmed ? 0.35 : 1}>
      <Circle
        radius={radius}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={2}
        hitFunc={(context, shape) => {
          context.beginPath()
          context.arc(0, 0, SCREEN_RADIUS * 2.5, 0, Math.PI * 2, true)
          context.closePath()
          context.fillStrokeShape(shape)
        }}
      />
      {isLabelVisible && (
        <Text
          text={node.label}
          fontSize={11}
          fill="#1e293b"
          offsetX={0}
          y={radius + 4}
          align="center"
          width={80}
          offsetY={0}
          x={-40}
        />
      )}
    </Group>
  )
}
