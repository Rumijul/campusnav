import type Konva from 'konva'
import { Group, Image as KonvaImage, Layer, Line, Stage, Text } from 'react-konva'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DoorGeometry, DrawSession, FloorLabel, GeometryObject, GeometryState, GeometryTool, RoomPolygon, Wall, WallSegment } from './types'
import { generateId, pixelToNorm } from './types'

interface GeometryCanvasProps {
  image: HTMLImageElement | undefined
  imageRect: { x: number; y: number; width: number; height: number } | null
  floorGeometry: GeometryState
  activeTool: GeometryTool
  onStateChange: (state: GeometryState) => void
  onObjectSelect: (obj: GeometryObject | null) => void
  selectedObject: GeometryObject | null
  width: number
  height: number
  /** Set to true when the parent wants the image to be semi-transparent (geometry tab) */
  imageDimmed?: boolean
}

// ── Colour palette (matching FloorPlanGeometryLayer) ───────────────────────────

interface WallStyleEntry { stroke: string; strokeWidth: number; opacity?: number; dash?: number[] }

const WALL_STYLE: Record<string, WallStyleEntry> = {
  exterior: { stroke: '#64748b', strokeWidth: 2.5 },
  interior: { stroke: '#475569', strokeWidth: 1.5 },
  glass:    { stroke: '#38bdf8', strokeWidth: 1, opacity: 0.5, dash: [6, 4] },
}

function getWallStyle(type: string): WallStyleEntry {
  return WALL_STYLE[type] ?? WALL_STYLE['interior']!
}

const ROOM_FILL: Record<string, string> = {
  classroom: 'rgba(59,130,246,0.08)',
  office:    'rgba(100,116,139,0.07)',
  restroom:  'rgba(37,99,235,0.10)',
  lab:       'rgba(168,85,247,0.08)',
  stairs:    'rgba(245,158,11,0.09)',
  elevator:  'rgba(34,197,94,0.09)',
  corridor:  'rgba(148,163,184,0.05)',
  other:     'rgba(148,163,184,0.04)',
}

const SELECTED_STROKE = '#3b82f6'
const PREVIEW_STROKE  = '#60a5fa'
const GRID_COLOR      = 'rgba(148,163,184,0.15)'

// ── Coordinate helpers ────────────────────────────────────────────────────────

function toPixelX(nx: number, r: { x: number; width: number }) { return r.x + nx * r.width }
function toPixelY(ny: number, r: { y: number; height: number }) { return r.y + ny * r.height }

function toLinePoints(segs: WallSegment[], r: { x: number; y: number; width: number; height: number }): number[] {
  const pts: number[] = []
  for (const s of segs) pts.push(toPixelX(s.x1, r), toPixelY(s.y1, r), toPixelX(s.x2, r), toPixelY(s.y2, r))
  return pts
}

function toFlatPoints(polygon: { x: number; y: number }[], r: { x: number; y: number; width: number; height: number }): number[] {
  const pts: number[] = []
  for (const p of polygon) pts.push(toPixelX(p.x, r), toPixelY(p.y, r))
  return pts
}

function snapToGridNorm(v: number, grid = 0.01) {
  return Math.round(v / grid) * grid
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GridLayer({ width, height }: { width: number; height: number }) {
  const lines = useMemo(() => {
    const pts: number[] = []
    // vertical
    for (let x = 0; x <= width; x += 40) { pts.push(x, 0, x, height) }
    // horizontal
    for (let y = 0; y <= height; y += 40) { pts.push(0, y, width, y) }
    return pts
  }, [width, height])
  return <Line points={lines} stroke={GRID_COLOR} strokeWidth={0.5} listening={false} />
}

interface WallLayerProps {
  walls: Wall[]
  selectedId: string | null
  imageRect: { x: number; y: number; width: number; height: number }
  onWallClick: (id: string) => void
}

function WallLayer({ walls, selectedId, imageRect, onWallClick }: WallLayerProps) {
  return (
    <>
      {walls.map((w) => {
        const style = getWallStyle(w.type)
        const pts = toLinePoints(w.segments, imageRect)
        const isSelected = selectedId === w.id
        const lineProps: Record<string, unknown> = {
          key: w.id,
          points: pts,
          stroke: isSelected ? SELECTED_STROKE : style.stroke,
          strokeWidth: isSelected ? style.strokeWidth + 1 : style.strokeWidth,
          opacity: isSelected ? 1 : (style.opacity ?? 1),
          lineCap: 'round',
          lineJoin: 'round',
          onClick: () => onWallClick(w.id),
          onTap: () => onWallClick(w.id),
          hitStrokeWidth: 12,
        }
        if (style.dash) lineProps.dash = style.dash
        return <Line {...lineProps} />
      })}
    </>
  )
}

interface RoomLayerProps {
  rooms: RoomPolygon[]
  selectedId: string | null
  imageRect: { x: number; y: number; width: number; height: number }
  onRoomClick: (id: string) => void
}

function RoomLayer({ rooms, selectedId, imageRect, onRoomClick }: RoomLayerProps) {
  return (
    <>
      {rooms.map((r) => {
        const fill = (ROOM_FILL as unknown as Record<string, string>)[r.type] ?? 'transparent'
        const pts = toFlatPoints(r.polygon, imageRect)
        const isSelected = selectedId === r.id
        return (
          <Group key={r.id} onClick={() => onRoomClick(r.id)} onTap={() => onRoomClick(r.id)}>
            <Line
              points={pts}
              closed
              fill={fill}
              stroke={isSelected ? SELECTED_STROKE : 'transparent'}
              strokeWidth={isSelected ? 2 : 0}
              listening={false}
            />
          </Group>
        )
      })}
    </>
  )
}

interface DoorLayerProps {
  doors: DoorGeometry[]
  selectedId: string | null
  imageRect: { x: number; y: number; width: number; height: number }
  onDoorClick: (id: string) => void
}

function DoorLayer({ doors, selectedId, imageRect, onDoorClick }: DoorLayerProps) {
  const DOOR_PX = 10
  return (
    <>
      {doors.map((d) => {
        const cx = toPixelX(d.x, imageRect)
        const cy = toPixelY(d.y, imageRect)
        const rad = (d.rotation * Math.PI) / 180
        const isSelected = selectedId === d.id
        return (
          <Group key={d.id} onClick={() => onDoorClick(d.id)} onTap={() => onDoorClick(d.id)}>
            <Line
              points={[cx, cy, cx + DOOR_PX * Math.cos(rad), cy + DOOR_PX * Math.sin(rad)]}
              stroke={isSelected ? SELECTED_STROKE : '#94a3b8'}
              strokeWidth={isSelected ? 2.5 : 1.5}
              lineCap="round"
            />
            {/* Door symbol: small arc */}
            <Line
              x={cx}
              y={cy}
              points={[0, 0, DOOR_PX * Math.cos(rad), DOOR_PX * Math.sin(rad)]}
              stroke={isSelected ? SELECTED_STROKE : '#94a3b8'}
              strokeWidth={1.5}
              lineCap="round"
              listening={false}
            />
          </Group>
        )
      })}
    </>
  )
}

interface LabelLayerProps {
  labels: FloorLabel[]
  selectedId: string | null
  imageRect: { x: number; y: number; width: number; height: number }
  onLabelClick: (id: string) => void
}

function LabelLayer({ labels, selectedId, imageRect, onLabelClick }: LabelLayerProps) {
  return (
    <>
      {labels.map((l) => {
        const px = toPixelX(l.x, imageRect)
        const py = toPixelY(l.y, imageRect)
        const isSelected = selectedId === l.id
        return (
          <Text
            key={l.id}
            x={px - 30}
            y={py - 6}
            width={60}
            text={l.text}
            fontSize={l.fontSize ?? 11}
            fontFamily="system-ui, -apple-system, sans-serif"
            fill={isSelected ? SELECTED_STROKE : '#64748b'}
            align="center"
            verticalAlign="middle"
            rotation={l.rotation ?? 0}
            onClick={() => onLabelClick(l.id)}
            onTap={() => onLabelClick(l.id)}
          />
        )
      })}
    </>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function GeometryCanvas({
  image,
  imageRect,
  floorGeometry,
  activeTool,
  onStateChange,
  onObjectSelect,
  selectedObject,
  width,
  height,
  imageDimmed = false,
}: GeometryCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)

  // Drawing session (wall/room in progress)
  const [session, setSession] = useState<DrawSession>({ type: 'idle' })

  // Cursor canvas position (for rubber-band edge preview)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)

  // Grid snap preference
  const [snapEnabled] = useState(true)

  // ── Hit-test helpers ──────────────────────────────────────────────────────

  const findObjectAtNorm = useCallback(
    (nx: number, ny: number): GeometryObject | null => {
      const t = 0.012
      // Walls
      for (const wall of [...floorGeometry.walls].reverse()) {
        for (const seg of wall.segments) {
          const dist = pointToSegmentDist(nx, ny, seg.x1, seg.y1, seg.x2, seg.y2)
          if (dist <= t) return { kind: 'wall', wall }
        }
      }
      // Rooms (point in polygon)
      for (const room of [...floorGeometry.rooms].reverse()) {
        if (pointInPolygon(nx, ny, room.polygon)) return { kind: 'room', room }
      }
      // Doors
      for (const door of [...floorGeometry.doors].reverse()) {
        if (Math.hypot(door.x - nx, door.y - ny) <= t * 2) return { kind: 'door', door }
      }
      // Labels
      for (const label of [...floorGeometry.labels].reverse()) {
        if (Math.hypot(label.x - nx, label.y - ny) <= t * 2) return { kind: 'label', label }
      }
      return null
    },
    [floorGeometry],
  )

  // ── Stage event handlers ─────────────────────────────────────────────────

  const handleMouseMove = useCallback(() => {
    const stage = stageRef.current
    if (!stage || !imageRect) return
    const pos = stage.getPointerPosition()
    if (!pos) return
    const { x: sx, y: sy } = stage.position()
    const scale = stage.scaleX()
    const cx = (pos.x - sx) / scale
    const cy = (pos.y - sy) / scale
    const norm = pixelToNorm(cx, cy, imageRect)
    const nx = snapEnabled ? snapToGridNorm(norm.x) : norm.x
    const ny = snapEnabled ? snapToGridNorm(norm.y) : norm.y

    setCursorPos({ x: cx, y: cy })

    setSession((prev) => {
      if (prev.type === 'wall') return { ...prev, currentX: nx, currentY: ny }
      if (prev.type === 'room') return { ...prev, currentX: nx, currentY: ny }
      return prev
    })
  }, [imageRect, snapEnabled])

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!imageRect) return
      const stage = stageRef.current
      if (!stage) return
      const pos = stage.getPointerPosition()
      if (!pos) return
      const { x: sx, y: sy } = stage.position()
      const scale = stage.scaleX()
      const cx = (pos.x - sx) / scale
      const cy = (pos.y - sy) / scale
      const norm = pixelToNorm(cx, cy, imageRect)
      const nx = snapEnabled ? snapToGridNorm(norm.x) : norm.x
      const ny = snapEnabled ? snapToGridNorm(norm.y) : norm.y

      if (activeTool === 'select') {
        if (e.target === stage) {
          onObjectSelect(null)
          setSession({ type: 'idle' })
        }
        return
      }

      if (activeTool === 'erase') {
        const obj = findObjectAtNorm(nx, ny)
        if (!obj) return
        if (obj.kind === 'wall') {
          onStateChange({ ...floorGeometry, walls: floorGeometry.walls.filter((w) => w.id !== obj.wall.id) })
        } else if (obj.kind === 'room') {
          onStateChange({ ...floorGeometry, rooms: floorGeometry.rooms.filter((r) => r.id !== obj.room.id) })
        } else if (obj.kind === 'door') {
          onStateChange({ ...floorGeometry, doors: floorGeometry.doors.filter((d) => d.id !== obj.door.id) })
        } else if (obj.kind === 'label') {
          onStateChange({ ...floorGeometry, labels: floorGeometry.labels.filter((l) => l.id !== obj.label.id) })
        }
        return
      }

      if (activeTool === 'wall') {
        setSession((prev) => {
          if (prev.type === 'idle') {
            return { type: 'wall', startX: nx, startY: ny, currentX: nx, currentY: ny }
          }
          if (prev.type === 'wall') {
            // Commit this segment as a wall (single segment per wall for simplicity)
            const newSeg: WallSegment = { x1: prev.startX, y1: prev.startY, x2: nx, y2: ny }
            const newWall: Wall = { id: generateId('wall'), segments: [newSeg], type: 'interior' }
            onStateChange({ ...floorGeometry, walls: [...floorGeometry.walls, newWall] })
            // Start new wall from this endpoint
            return { type: 'wall', startX: nx, startY: ny, currentX: nx, currentY: ny }
          }
          return { type: 'idle' }
        })
        return
      }

      if (activeTool === 'room') {
        setSession((prev) => {
          if (prev.type === 'idle') {
            return { type: 'room', points: [{ x: nx, y: ny }], currentX: nx, currentY: ny }
          }
          if (prev.type === 'room') {
            const pts = prev.points
            // Click near start point → close polygon
            const first = pts[0]!
            if (pts.length >= 3 && Math.hypot(nx - first.x, ny - first.y) < 0.02) {
              const newRoom: RoomPolygon = {
                id: generateId('room'),
                polygon: [...pts],
                label: 'New Room',
                type: 'other',
              }
              onStateChange({ ...floorGeometry, rooms: [...floorGeometry.rooms, newRoom] })
              return { type: 'idle' }
            }
            return { type: 'room', points: [...pts, { x: nx, y: ny }], currentX: nx, currentY: ny }
          }
          return { type: 'idle' }
        })
        return
      }

      if (activeTool === 'door') {
        const newDoor: DoorGeometry = {
          id: generateId('door'),
          x: nx,
          y: ny,
          rotation: 0,
          type: 'single',
        }
        onStateChange({ ...floorGeometry, doors: [...floorGeometry.doors, newDoor] })
        return
      }

      if (activeTool === 'label') {
        const newLabel: FloorLabel = {
          id: generateId('label'),
          x: nx,
          y: ny,
          text: 'Label',
          fontSize: 11,
        }
        onStateChange({ ...floorGeometry, labels: [...floorGeometry.labels, newLabel] })
        return
      }
    },
    [activeTool, imageRect, floorGeometry, onStateChange, onObjectSelect, findObjectAtNorm, snapEnabled],
  )

  // Click on an object (walls, rooms, doors, labels rendered in canvas)
  const handleObjectClick = useCallback(
    (obj: GeometryObject) => {
      onObjectSelect(obj)
      setSession({ type: 'idle' })
    },
    [onObjectSelect],
  )

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSession({ type: 'idle' })
        onObjectSelect(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onObjectSelect])

  // ── Derived: selected IDs ─────────────────────────────────────────────────

  const selectedWallId  = selectedObject?.kind === 'wall'  ? selectedObject.wall.id : null
  const selectedRoomId  = selectedObject?.kind === 'room'  ? selectedObject.room.id : null
  const selectedDoorId = selectedObject?.kind === 'door' ? selectedObject.door.id : null
  const selectedLabelId = selectedObject?.kind === 'label' ? selectedObject.label.id : null

  // ── Preview shapes for active drawing sessions ────────────────────────────

  const wallPreviewLine = useMemo(() => {
    if (session.type !== 'wall' || !imageRect) return null
    const { startX, startY, currentX, currentY } = session
    return [
      toPixelX(startX, imageRect), toPixelY(startY, imageRect),
      toPixelX(currentX, imageRect), toPixelY(currentY, imageRect),
    ] as number[]
  }, [session, imageRect])

  const roomPreviewPts = useMemo(() => {
    if (session.type !== 'room' || !imageRect) return null
    const { points, currentX, currentY } = session
    const all = [...points, { x: currentX, y: currentY }]
    return toFlatPoints(all, imageRect)
  }, [session, imageRect])

  const roomPreviewStartDot = useMemo(() => {
    if (session.type !== 'room' || !imageRect || session.points.length < 3) return null
    const first = session.points[0]!
    return [toPixelX(first.x, imageRect), toPixelY(first.y, imageRect)] as number[]
  }, [session, imageRect])

  // Cursor crosshair dot
  const cursorDot = useMemo(() => {
    if (!cursorPos || !imageRect) return null
    // Only show if cursor is within image rect
    if (cursorPos.x < imageRect.x || cursorPos.x > imageRect.x + imageRect.width) return null
    if (cursorPos.y < imageRect.y || cursorPos.y > imageRect.y + imageRect.height) return null
    return [cursorPos.x, cursorPos.y] as number[]
  }, [cursorPos, imageRect])

  // ── Cursor style ──────────────────────────────────────────────────────────

  const cursorStyle = (() => {
    if (activeTool === 'select') return 'default'
    if (activeTool === 'erase') return 'crosshair'
    return 'crosshair'
  })()

  // ── Image opacity ─────────────────────────────────────────────────────────

  const imageOpacity = imageDimmed ? 0.35 : 1.0

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      draggable={activeTool === 'select'}
      onClick={handleStageClick}
      onMouseMove={handleMouseMove}
      style={{ cursor: cursorStyle }}
    >
      {/* Layer 0: Grid */}
      <Layer listening={false}>
        <GridLayer width={width} height={height} />
      </Layer>

      {/* Layer 1: Floor plan image
          Note: render with <Image> (not <Rect fillPatternImage=...>). The rect
          approach with fillPatternScale=1 tiles the image at its natural pixel
          size, which crops the image when the fitted rect is smaller than
          natural dimensions and produces a 3×3 grid of duplicated copies when
          the rect is larger (zoom-out). <Image> renders a single stretched copy. */}
      <Layer>
        {image && imageRect && (
          <KonvaImage
            image={image}
            x={imageRect.x}
            y={imageRect.y}
            width={imageRect.width}
            height={imageRect.height}
            opacity={imageOpacity}
            listening={false}
          />
        )}
      </Layer>

      {/* Layer 2: Rooms */}
      <Layer>
        <RoomLayer
          rooms={floorGeometry.rooms}
          selectedId={selectedRoomId}
          imageRect={imageRect ?? { x: 0, y: 0, width, height }}
          onRoomClick={(id) => handleObjectClick({ kind: 'room', room: floorGeometry.rooms.find((r) => r.id === id)! })}
        />
      </Layer>

      {/* Layer 3: Walls */}
      <Layer>
        <WallLayer
          walls={floorGeometry.walls}
          selectedId={selectedWallId}
          imageRect={imageRect ?? { x: 0, y: 0, width, height }}
          onWallClick={(id) => handleObjectClick({ kind: 'wall', wall: floorGeometry.walls.find((w) => w.id === id)! })}
        />
        {/* Active wall preview */}
        {wallPreviewLine && (
          <Line
            points={wallPreviewLine}
            stroke={PREVIEW_STROKE}
            strokeWidth={2}
            dash={[6, 4]}
            lineCap="round"
            listening={false}
          />
        )}
        {/* Active room preview */}
        {roomPreviewPts && (
          <>
            <Line
              points={roomPreviewPts}
              stroke={PREVIEW_STROKE}
              strokeWidth={1.5}
              dash={[6, 4]}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />
            {roomPreviewStartDot && (
              <Line
                points={[...roomPreviewStartDot, ...roomPreviewStartDot]}
                stroke={PREVIEW_STROKE}
                strokeWidth={2}
                lineCap="round"
                listening={false}
              />
            )}
          </>
        )}
      </Layer>

      {/* Layer 4: Doors */}
      <Layer>
        <DoorLayer
          doors={floorGeometry.doors}
          selectedId={selectedDoorId}
          imageRect={imageRect ?? { x: 0, y: 0, width, height }}
          onDoorClick={(id) => handleObjectClick({ kind: 'door', door: floorGeometry.doors.find((d) => d.id === id)! })}
        />
      </Layer>

      {/* Layer 5: Labels */}
      <Layer>
        <LabelLayer
          labels={floorGeometry.labels}
          selectedId={selectedLabelId}
          imageRect={imageRect ?? { x: 0, y: 0, width, height }}
          onLabelClick={(id) => handleObjectClick({ kind: 'label', label: floorGeometry.labels.find((l) => l.id === id)! })}
        />
      </Layer>

      {/* Layer 6: Cursor dot */}
      <Layer listening={false}>
        {cursorDot && (
          <>
            <Line
              points={[cursorDot[0]! - 5, cursorDot[1]!, cursorDot[0]! + 5, cursorDot[1]!]}
              stroke="rgba(96,165,250,0.7)"
              strokeWidth={1}
              lineCap="round"
            />
            <Line
              points={[cursorDot[0]!, cursorDot[1]! - 5, cursorDot[0]!, cursorDot[1]! + 5]}
              stroke="rgba(96,165,250,0.7)"
              strokeWidth={1}
              lineCap="round"
            />
          </>
        )}
      </Layer>
    </Stage>
  )
}

// ── Geometry utilities (duplicated here to avoid circular imports) ─────────────

function pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1, dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - x1, py - y1)
  let t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

function pointInPolygon(x: number, y: number, polygon: { x: number; y: number }[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]!.x, yi = polygon[i]!.y
    const xj = polygon[j]!.x, yj = polygon[j]!.y
    if (((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}
