import type { DoorGeometry as DoorGeo, FloorLabel as FloorLbl, GeometryObject, RoomPolygon as RoomPoly, Wall as WallType } from './types'

interface GeometrySidePanelProps {
  selectedObject: GeometryObject | null
  onUpdateWall: (id: string, changes: Partial<WallType>) => void
  onUpdateRoom: (id: string, changes: Partial<RoomPoly>) => void
  onUpdateDoor: (id: string, changes: Partial<DoorGeo>) => void
  onUpdateLabel: (id: string, changes: Partial<FloorLbl>) => void
  onDeleteWall: (id: string) => void
  onDeleteRoom: (id: string) => void
  onDeleteDoor: (id: string) => void
  onDeleteLabel: (id: string) => void
  onClose: () => void
}

const WALL_TYPES: { value: WallType['type']; label: string }[] = [
  { value: 'exterior', label: 'Exterior' },
  { value: 'interior', label: 'Interior' },
  { value: 'glass', label: 'Glass' },
]

const ROOM_TYPES: { value: RoomPoly['type']; label: string }[] = [
  { value: 'classroom', label: 'Classroom' },
  { value: 'office', label: 'Office' },
  { value: 'restroom', label: 'Restroom' },
  { value: 'lab', label: 'Lab' },
  { value: 'stairs', label: 'Stairs' },
  { value: 'elevator', label: 'Elevator' },
  { value: 'corridor', label: 'Corridor' },
  { value: 'other', label: 'Other' },
]

const DOOR_TYPES: { value: DoorGeo['type']; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'sliding', label: 'Sliding' },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-gray-500 font-medium uppercase tracking-wide text-[10px]">{label}</span>
      {children}
    </label>
  )
}

function Input({ value, onChange, type = 'text', step, min, max }: {
  value: string | number
  onChange: (v: string) => void
  type?: string
  step?: string
  min?: string
  max?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      step={step}
      min={min}
      max={max}
      className="border rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
    />
  )
}

function Select({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export default function GeometrySidePanel({
  selectedObject,
  onUpdateWall,
  onUpdateRoom,
  onUpdateDoor,
  onUpdateLabel,
  onDeleteWall,
  onDeleteRoom,
  onDeleteDoor,
  onDeleteLabel,
  onClose,
}: GeometrySidePanelProps) {
  if (!selectedObject) {
    return (
      <div className="w-56 border-l border-gray-200 bg-white flex flex-col h-full">
        <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Properties</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-gray-400 text-center">Select an object to edit its properties</p>
        </div>
      </div>
    )
  }

  const wall = selectedObject.kind === 'wall' ? selectedObject.wall : null
  const room = selectedObject.kind === 'room' ? selectedObject.room : null
  const door = selectedObject.kind === 'door' ? selectedObject.door : null
  const label = selectedObject.kind === 'label' ? selectedObject.label : null

  const kindLabel = selectedObject.kind.charAt(0).toUpperCase() + selectedObject.kind.slice(1)

  return (
    <div className="w-56 border-l border-gray-200 bg-white flex flex-col h-full overflow-y-auto">
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Properties</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* Kind badge */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold uppercase tracking-wide">
            {kindLabel}
          </span>
          <span className="text-[10px] text-gray-400 font-mono">{selectedObject.kind === 'wall' ? wall?.id : selectedObject.kind === 'room' ? room?.id : selectedObject.kind === 'door' ? door?.id : label?.id}</span>
        </div>

        {/* Wall properties */}
        {wall && (
          <>
            <Field label="Type">
              <Select
                value={wall.type}
                onChange={(v) => onUpdateWall(wall.id, { type: v as WallType['type'] })}
                options={WALL_TYPES}
              />
            </Field>
            <Field label="Segments">
              <span className="text-sm text-gray-700 font-mono">{wall.segments.length} segment(s)</span>
            </Field>
            <button
              type="button"
              onClick={() => onDeleteWall(wall.id)}
              className="mt-1 w-full px-3 py-1.5 rounded border border-red-300 text-red-600 text-xs hover:bg-red-50 transition-colors"
            >
              Delete Wall
            </button>
          </>
        )}

        {/* Room properties */}
        {room && (
          <>
            <Field label="Label">
              <Input
                value={room.label}
                onChange={(v) => onUpdateRoom(room.id, { label: v })}
              />
            </Field>
            <Field label="Type">
              <Select
                value={room.type}
                onChange={(v) => onUpdateRoom(room.id, { type: v as RoomPoly['type'] })}
                options={ROOM_TYPES}
              />
            </Field>
            <Field label="Vertices">
              <span className="text-sm text-gray-700 font-mono">{room.polygon.length} point(s)</span>
            </Field>
            <button
              type="button"
              onClick={() => onDeleteRoom(room.id)}
              className="mt-1 w-full px-3 py-1.5 rounded border border-red-300 text-red-600 text-xs hover:bg-red-50 transition-colors"
            >
              Delete Room
            </button>
          </>
        )}

        {/* Door properties */}
        {door && (
          <>
            <Field label="Type">
              <Select
                value={door.type}
                onChange={(v) => onUpdateDoor(door.id, { type: v as DoorGeo['type'] })}
                options={DOOR_TYPES}
              />
            </Field>
            <Field label="Rotation">
              <Input
                value={door.rotation}
                onChange={(v) => onUpdateDoor(door.id, { rotation: Number(v) })}
                type="number"
                step="15"
                min="0"
                max="360"
              />
            </Field>
            <Field label="Position">
              <span className="text-sm text-gray-700 font-mono">
                ({door.x.toFixed(3)}, {door.y.toFixed(3)})
              </span>
            </Field>
            <button
              type="button"
              onClick={() => onDeleteDoor(door.id)}
              className="mt-1 w-full px-3 py-1.5 rounded border border-red-300 text-red-600 text-xs hover:bg-red-50 transition-colors"
            >
              Delete Door
            </button>
          </>
        )}

        {/* Label properties */}
        {label && (
          <>
            <Field label="Text">
              <Input
                value={label.text}
                onChange={(v) => onUpdateLabel(label.id, { text: v })}
              />
            </Field>
            <Field label="Font Size">
              <Input
                value={label.fontSize ?? 11}
                onChange={(v) => onUpdateLabel(label.id, { fontSize: Number(v) })}
                type="number"
                min="6"
                max="72"
              />
            </Field>
            <Field label="Rotation">
              <Input
                value={label.rotation ?? 0}
                onChange={(v) => onUpdateLabel(label.id, { rotation: Number(v) })}
                type="number"
                step="15"
                min="-180"
                max="180"
              />
            </Field>
            <Field label="Position">
              <span className="text-sm text-gray-700 font-mono">
                ({label.x.toFixed(3)}, {label.y.toFixed(3)})
              </span>
            </Field>
            <button
              type="button"
              onClick={() => onDeleteLabel(label.id)}
              className="mt-1 w-full px-3 py-1.5 rounded border border-red-300 text-red-600 text-xs hover:bg-red-50 transition-colors"
            >
              Delete Label
            </button>
          </>
        )}
      </div>
    </div>
  )
}
