import { useCallback, useEffect, useRef, useState } from 'react'
import type { DoorGeometry, FloorLabel, GeometryObject, GeometryState, GeometryTool, RoomPolygon, Wall } from './types'
import GeometryCanvas from './GeometryCanvas'
import GeometryToolbar from './GeometryToolbar'
import GeometrySidePanel from './GeometrySidePanel'

interface GeometryEditorProps {
  /** The floor's existing FloorPlanGeometry (may be undefined) */
  initialGeometry: GeometryState
  /** Logical dimensions for the floor plan image (used as logicalWidth/Height in saved geometry) */
  logicalWidth: number
  logicalHeight: number
  /** Floor plan image element (from useImage hook) */
  image: HTMLImageElement | undefined
  /** Image rect from FloorPlanImage component */
  imageRect: { x: number; y: number; width: number; height: number } | null
  /** Callback to save geometry to the server */
  onSave: (geometry: GeometryState) => Promise<void>
  canvasWidth: number
  canvasHeight: number
}

export default function GeometryEditor({
  initialGeometry,
  logicalWidth: _logicalWidth,
  logicalHeight: _logicalHeight,
  image,
  imageRect,
  onSave,
  canvasWidth,
  canvasHeight,
}: GeometryEditorProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [geometry, setGeometry] = useState<GeometryState>(initialGeometry)
  const [activeTool, setActiveTool] = useState<GeometryTool>('wall')
  const [selectedObject, setSelectedObject] = useState<GeometryObject | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // ── History ────────────────────────────────────────────────────────────────
  const historyRef = useRef<GeometryState[]>([initialGeometry])
  const historyIndexRef = useRef(0)

  const pushHistory = useCallback((state: GeometryState) => {
    // Trim future if we're not at the end
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1)
    newHistory.push(state)
    // Keep max 50 entries
    if (newHistory.length > 50) newHistory.shift()
    historyRef.current = newHistory
    historyIndexRef.current = newHistory.length - 1
    setIsDirty(historyIndexRef.current > 0)
  }, [])

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    const prev = historyRef.current[historyIndexRef.current]!
    setGeometry(prev)
    setSelectedObject(null)
    setIsDirty(historyIndexRef.current > 0)
  }, [])

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current += 1
    const next = historyRef.current[historyIndexRef.current]!
    setGeometry(next)
    setSelectedObject(null)
    setIsDirty(historyIndexRef.current > 0)
  }, [])

  const canUndo = historyIndexRef.current > 0
  const canRedo = historyIndexRef.current < historyRef.current.length - 1

  // ── Update geometry (with history) ─────────────────────────────────────────
  const updateGeometry = useCallback((newState: GeometryState) => {
    setGeometry(newState)
    pushHistory(newState)
  }, [pushHistory])

  // ── Object mutations ──────────────────────────────────────────────────────

  const handleUpdateWall = useCallback((id: string, changes: Partial<Wall>) => {
    const updated = geometry.walls.map((w) => w.id === id ? { ...w, ...changes } : w)
    updateGeometry({ ...geometry, walls: updated })
  }, [geometry, updateGeometry])

  const handleUpdateRoom = useCallback((id: string, changes: Partial<RoomPolygon>) => {
    const updated = geometry.rooms.map((r) => r.id === id ? { ...r, ...changes } : r)
    updateGeometry({ ...geometry, rooms: updated })
  }, [geometry, updateGeometry])

  const handleUpdateDoor = useCallback((id: string, changes: Partial<DoorGeometry>) => {
    const updated = geometry.doors.map((d) => d.id === id ? { ...d, ...changes } : d)
    updateGeometry({ ...geometry, doors: updated })
  }, [geometry, updateGeometry])

  const handleUpdateLabel = useCallback((id: string, changes: Partial<FloorLabel>) => {
    const updated = geometry.labels.map((l) => l.id === id ? { ...l, ...changes } : l)
    updateGeometry({ ...geometry, labels: updated })
  }, [geometry, updateGeometry])

  const handleDeleteWall = useCallback((id: string) => {
    updateGeometry({ ...geometry, walls: geometry.walls.filter((w) => w.id !== id) })
    setSelectedObject(null)
  }, [geometry, updateGeometry])

  const handleDeleteRoom = useCallback((id: string) => {
    updateGeometry({ ...geometry, rooms: geometry.rooms.filter((r) => r.id !== id) })
    setSelectedObject(null)
  }, [geometry, updateGeometry])

  const handleDeleteDoor = useCallback((id: string) => {
    updateGeometry({ ...geometry, doors: geometry.doors.filter((d) => d.id !== id) })
    setSelectedObject(null)
  }, [geometry, updateGeometry])

  const handleDeleteLabel = useCallback((id: string) => {
    updateGeometry({ ...geometry, labels: geometry.labels.filter((l) => l.id !== id) })
    setSelectedObject(null)
  }, [geometry, updateGeometry])

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      await onSave(geometry)
      // Reset dirty flag and history (saved state)
      setIsDirty(false)
      historyRef.current = [geometry]
      historyIndexRef.current = 0
    } finally {
      setIsSaving(false)
    }
  }, [geometry, onSave])

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
      else if (e.key === 'v' || e.key === 'V') setActiveTool('select')
      else if (e.key === 'w' || e.key === 'W') setActiveTool('wall')
      else if (e.key === 'r' || e.key === 'R') setActiveTool('room')
      else if (e.key === 'd' || e.key === 'D') setActiveTool('door')
      else if (e.key === 'l' || e.key === 'L') setActiveTool('label')
      else if (e.key === 'e' || e.key === 'E') setActiveTool('erase')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  // ── Handle canvas object selection ─────────────────────────────────────────

  const handleObjectSelect = useCallback((obj: GeometryObject | null) => {
    setSelectedObject(obj)
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Toolbar */}
      <GeometryToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onSave={handleSave}
        isDirty={isDirty}
        isSaving={isSaving}
      />

      {/* Canvas + Side panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <GeometryCanvas
            image={image}
            imageRect={imageRect}
            floorGeometry={geometry}
            activeTool={activeTool}
            onStateChange={updateGeometry}
            onObjectSelect={handleObjectSelect}
            selectedObject={selectedObject}
            width={canvasWidth}
            height={canvasHeight}
            imageDimmed={true}
          />

          {/* Tool hint overlay */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
              {activeTool === 'select'   && 'Click to select • Drag to pan'}
              {activeTool === 'wall'     && 'Click start point, then end point — keeps chaining (Esc to stop)'}
              {activeTool === 'room'    && 'Click to place vertices • Click near start to close room'}
              {activeTool === 'door'    && 'Click on a wall to place a door'}
              {activeTool === 'label'   && 'Click to place a label'}
              {activeTool === 'erase'   && 'Click any object to delete it'}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <GeometrySidePanel
          selectedObject={selectedObject}
          onUpdateWall={handleUpdateWall}
          onUpdateRoom={handleUpdateRoom}
          onUpdateDoor={handleUpdateDoor}
          onUpdateLabel={handleUpdateLabel}
          onDeleteWall={handleDeleteWall}
          onDeleteRoom={handleDeleteRoom}
          onDeleteDoor={handleDeleteDoor}
          onDeleteLabel={handleDeleteLabel}
          onClose={() => setSelectedObject(null)}
        />
      </div>
    </div>
  )
}
