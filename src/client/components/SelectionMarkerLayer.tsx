import type { NavNode } from '@shared/types'
import { Circle, Group, Layer, Text } from 'react-konva'

/* ──────────────── Constants ──────────────── */

const PIN_RADIUS = 12
const LABEL_FONT_SIZE = 14

const START_COLOR = '#22c55e' // green
const DEST_COLOR = '#ef4444' // red

/* ──────────────── Props ──────────────── */

interface SelectionMarkerLayerProps {
  start: NavNode | null
  destination: NavNode | null
  imageRect: { x: number; y: number; width: number; height: number } | null
  stageScale: number
}

/* ──────────────── Component ──────────────── */

/**
 * Renders A/B labeled pin markers for the selected start and destination nodes.
 *
 * - Start pin: green circle with white "A" label
 * - Destination pin: red circle with white "B" label
 * - Counter-scaled to maintain constant screen size during zoom
 * - Display-only — no click handlers
 */
export function SelectionMarkerLayer({
  start,
  destination,
  imageRect,
  stageScale,
}: SelectionMarkerLayerProps) {
  if (!imageRect) return null

  const scale = 1 / stageScale

  return (
    <Layer>
      {start && (
        <Group
          x={imageRect.x + start.x * imageRect.width}
          y={imageRect.y + start.y * imageRect.height}
          scaleX={scale}
          scaleY={scale}
        >
          <Circle radius={PIN_RADIUS} fill={START_COLOR} stroke="#ffffff" strokeWidth={2} />
          <Text
            text="A"
            fontSize={LABEL_FONT_SIZE}
            fontStyle="bold"
            fill="#ffffff"
            width={PIN_RADIUS * 2}
            height={PIN_RADIUS * 2}
            offsetX={PIN_RADIUS}
            offsetY={PIN_RADIUS}
            align="center"
            verticalAlign="middle"
          />
        </Group>
      )}
      {destination && (
        <Group
          x={imageRect.x + destination.x * imageRect.width}
          y={imageRect.y + destination.y * imageRect.height}
          scaleX={scale}
          scaleY={scale}
        >
          <Circle radius={PIN_RADIUS} fill={DEST_COLOR} stroke="#ffffff" strokeWidth={2} />
          <Text
            text="B"
            fontSize={LABEL_FONT_SIZE}
            fontStyle="bold"
            fill="#ffffff"
            width={PIN_RADIUS * 2}
            height={PIN_RADIUS * 2}
            offsetX={PIN_RADIUS}
            offsetY={PIN_RADIUS}
            align="center"
            verticalAlign="middle"
          />
        </Group>
      )}
    </Layer>
  )
}
