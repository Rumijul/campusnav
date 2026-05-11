import type { FloorPlanGeometry } from '@shared/types'
import { useMemo } from 'react'
import { Group, Line, Text } from 'react-konva'

interface FloorPlanGeometryLayerProps {
  geometry: FloorPlanGeometry
  imageRect: { x: number; y: number; width: number; height: number }
}

// ── Maps-Inspired Dark Palette ────────────────────────────────────────────────

const WALL_STYLE = {
  exterior: { stroke: '#64748b', strokeWidth: 2.5 },
  interior: { stroke: '#475569', strokeWidth: 1.5 },
  glass:    { stroke: '#38bdf8', strokeWidth: 1, opacity: 0.3, dash: [4, 4] as number[] },
} as const

interface WallStyle {
  stroke: string
  strokeWidth: number
  opacity?: number
  dash?: number[]
}

function getWallStyle(type: string): WallStyle {
  return ((WALL_STYLE as unknown as Record<string, WallStyle>)[type]) ?? (WALL_STYLE.interior as WallStyle)
}

function roomFill(type: string): string {
  switch (type) {
    case 'classroom': return 'rgba(59, 130, 246, 0.06)'
    case 'office':    return 'rgba(100, 116, 139, 0.05)'
    case 'restroom':  return 'rgba(37, 99, 235, 0.08)'
    case 'lab':       return 'rgba(168, 85, 247, 0.06)'
    case 'stairs':    return 'rgba(245, 158, 11, 0.08)'
    case 'elevator':  return 'rgba(34, 197, 94, 0.08)'
    case 'corridor':  return 'transparent'
    default:          return 'transparent'
  }
}

function roomLabelColor(type: string): string {
  switch (type) {
    case 'restroom': return '#60a5fa'
    case 'stairs':   return '#fbbf24'
    case 'elevator': return '#4ade80'
    default:         return '#94a3b8'
  }
}

// ── Coordinate Conversion ────────────────────────────────────────────────────

function toPixelX(nx: number, rect: { x: number; width: number }): number {
  return rect.x + nx * rect.width
}

function toPixelY(ny: number, rect: { y: number; height: number }): number {
  return rect.y + ny * rect.height
}

function toLinePoints(segments: { x1: number; y1: number; x2: number; y2: number }[], rect: { x: number; y: number; width: number; height: number }): number[] {
  const points: number[] = []
  for (const s of segments) {
    points.push(toPixelX(s.x1, rect), toPixelY(s.y1, rect), toPixelX(s.x2, rect), toPixelY(s.y2, rect))
  }
  return points
}

function toFlatPoints(polygon: { x: number; y: number }[], rect: { x: number; y: number; width: number; height: number }): number[] {
  const pts: number[] = []
  for (const p of polygon) {
    pts.push(toPixelX(p.x, rect), toPixelY(p.y, rect))
  }
  return pts
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Renders a vector floor plan from structured geometry data.
 *
 * Draws walls, room polygons, door arcs, and text labels on a Konva canvas
 * using a dark Maps-inspired palette. All coordinates in the geometry are
 * normalized 0–1 and converted to pixel positions using imageRect.
 *
 * Lives in the same Layer slot as FloorPlanImage — when geometry exists
 * on a floor, this renders instead of the raster PNG backdrop.
 */
export default function FloorPlanGeometryLayer({ geometry, imageRect }: FloorPlanGeometryLayerProps) {
  // Memoize: pixel conversion runs once per geometry/imageRect change
  const walls = useMemo(() => {
    return geometry.walls.map((w) => {
      const style = getWallStyle(w.type)
      const lineProps: Record<string, unknown> = {
        key: w.id,
        points: toLinePoints(w.segments, imageRect),
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
        opacity: style.opacity ?? 1,
        lineCap: 'round' as const,
        lineJoin: 'round' as const,
        listening: false,
      }
      if (style.dash) lineProps.dash = style.dash
      return <Line {...lineProps} />
    })
  }, [geometry.walls, imageRect])

  const rooms = useMemo(() => {
    return geometry.rooms.map((r) => {
      const fill = roomFill(r.type)
      const flat = toFlatPoints(r.polygon, imageRect)
      // Compute center of polygon for label placement
      let cx = 0; let cy = 0
      for (let i = 0; i < flat.length; i += 2) { cx += flat[i]!; cy += flat[i + 1]! }
      const n = flat.length / 2
      cx /= n; cy /= n

      return (
        <Group key={r.id} listening={false}>
          {/* Room fill */}
          {fill !== 'transparent' && (
            <Line points={flat} closed fill={fill} stroke="transparent" listening={false} />
          )}
          {/* Room label centered in polygon */}
          <Text
            x={cx - 30}
            y={cy - 6}
            width={60}
            text={r.label}
            fontSize={10}
            fontFamily="system-ui, -apple-system, sans-serif"
            fill={roomLabelColor(r.type)}
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        </Group>
      )
    })
  }, [geometry.rooms, imageRect])

  const doors = useMemo(() => {
    return geometry.doors.map((d) => {
      const cx = toPixelX(d.x, imageRect)
      const cy = toPixelY(d.y, imageRect)
      const doorWidth = 8 // fixed pixel size — doors are small indicators
      const angleRad = (d.rotation * Math.PI) / 180

      // Door: a small arc showing the swing direction
      return (
        <Line
          key={d.id}
          x={cx}
          y={cy}
          points={[0, 0, doorWidth * Math.cos(angleRad), doorWidth * Math.sin(angleRad)]}
          stroke="#64748b"
          strokeWidth={1.5}
          lineCap="round"
          listening={false}
        />
      )
    })
  }, [geometry.doors, imageRect])

  const labels = useMemo(() => {
    return geometry.labels.map((l) => {
      const x = toPixelX(l.x, imageRect)
      const y = toPixelY(l.y, imageRect)
      return (
        <Text
          key={l.id}
          x={x}
          y={y}
          text={l.text}
          fontSize={l.fontSize ?? 11}
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#64748b"
          rotation={l.rotation ?? 0}
          listening={false}
        />
      )
    })
  }, [geometry.labels, imageRect])

  return (
    <Group>
      {/* Render order: rooms (back) → doors → walls → labels (front) */}
      {rooms}
      {doors}
      {walls}
      {labels}
    </Group>
  )
}
