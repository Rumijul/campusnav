// Re-export shared types so consumers can import from ./types
export type { DoorGeometry, FloorLabel, RoomPolygon, Wall, WallSegment } from '../../../../shared/types'
export type { FloorPlanGeometry } from '../../../../shared/types'

import type { DoorGeometry, FloorLabel, FloorPlanGeometry, RoomPolygon, Wall, WallSegment } from '../../../../shared/types'

// ── Tool Types ────────────────────────────────────────────────────────────────

export type GeometryTool = 'select' | 'wall' | 'room' | 'door' | 'label' | 'erase'

export type GeometryObject =
  | { kind: 'wall'; wall: Wall }
  | { kind: 'room'; room: RoomPolygon }
  | { kind: 'door'; door: DoorGeometry }
  | { kind: 'label'; label: FloorLabel }

// ── History for undo/redo ────────────────────────────────────────────────────

export interface GeometryHistoryEntry {
  walls: Wall[]
  rooms: RoomPolygon[]
  doors: DoorGeometry[]
  labels: FloorLabel[]
}

export interface GeometryState {
  walls: Wall[]
  rooms: RoomPolygon[]
  doors: DoorGeometry[]
  labels: FloorLabel[]
}

// ── Active drawing session ────────────────────────────────────────────────────

export type DrawSession =
  | { type: 'idle' }
  | { type: 'wall'; startX: number; startY: number; currentX: number; currentY: number }
  | { type: 'room'; points: { x: number; y: number }[]; currentX: number; currentY: number }
  | { type: 'door'; x: number; y: number; rotation: number }
  | { type: 'label'; x: number; y: number }

// ── Helpers ───────────────────────────────────────────────────────────────────

export function newWall(id: string, segments: WallSegment[], type: Wall['type'] = 'interior'): Wall {
  return { id, segments, type }
}

export function newRoom(id: string, polygon: { x: number; y: number }[], label: string, type: RoomPolygon['type'] = 'other'): RoomPolygon {
  return { id, polygon, label, type }
}

export function newDoor(id: string, x: number, y: number, rotation: number, type: DoorGeometry['type'] = 'single'): DoorGeometry {
  return { id, x, y, rotation, type }
}

export function newLabel(id: string, x: number, y: number, text: string, fontSize = 11): FloorLabel {
  return { id, x, y, text, fontSize }
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function snapToGrid(v: number, gridSize = 0.005): number {
  return Math.round(v / gridSize) * gridSize
}

// Convert FloorPlanGeometry → GeometryState (our mutable edit format)
export function geometryToState(g: FloorPlanGeometry): GeometryState {
  return { walls: g.walls, rooms: g.rooms, doors: g.doors, labels: g.labels }
}

// Convert GeometryState → FloorPlanGeometry
export function stateToGeometry(s: GeometryState, logicalWidth: number, logicalHeight: number): FloorPlanGeometry {
  return { logicalWidth, logicalHeight, ...s }
}

// Find object at a normalized position (within tolerance)
export function findObjectAt(
  state: GeometryState,
  normX: number,
  normY: number,
  tolerance = 0.01,
): GeometryObject | null {
  // Check walls (line proximity)
  for (const wall of [...state.walls].reverse()) {
    for (const seg of wall.segments) {
      const dist = pointToSegmentDist(normX, normY, seg.x1, seg.y1, seg.x2, seg.y2)
      if (dist <= tolerance) return { kind: 'wall', wall }
    }
  }

  // Check rooms (point in polygon)
  for (const room of [...state.rooms].reverse()) {
    if (pointInPolygon(normX, normY, room.polygon)) return { kind: 'room', room }
  }

  // Check doors
  for (const door of [...state.doors].reverse()) {
    const dist = Math.hypot(door.x - normX, door.y - normY)
    if (dist <= tolerance * 2) return { kind: 'door', door }
  }

  // Check labels
  for (const label of [...state.labels].reverse()) {
    const dist = Math.hypot(label.x - normX, label.y - normY)
    if (dist <= tolerance * 2) return { kind: 'label', label }
  }

  return null
}

function pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1, dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
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

// ── Default state ─────────────────────────────────────────────────────────────

export function emptyState(): GeometryState {
  return { walls: [], rooms: [], doors: [], labels: [] }
}

// ── Snap normalized coords to imageRect ──────────────────────────────────────

export function normToPixel(nx: number, ny: number, imageRect: { x: number; y: number; width: number; height: number }) {
  return {
    x: imageRect.x + nx * imageRect.width,
    y: imageRect.y + ny * imageRect.height,
  }
}

export function pixelToNorm(px: number, py: number, imageRect: { x: number; y: number; width: number; height: number }) {
  return {
    x: Math.max(0, Math.min(1, (px - imageRect.x) / imageRect.width)),
    y: Math.max(0, Math.min(1, (py - imageRect.y) / imageRect.height)),
  }
}
