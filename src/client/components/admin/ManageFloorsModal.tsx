import { useRef, useState } from 'react'
import type { NavFloor } from '@shared/types'

/* ──────────────── Props ──────────────── */

interface ManageFloorsModalProps {
  isOpen: boolean
  buildingId: number
  floors: NavFloor[]
  onClose: () => void
  onFloorAdded: (floor: NavFloor) => void
  onFloorDeleted: (floorId: number) => void
  onFloorImageReplaced: () => void
}

/* ──────────────── Component ──────────────── */

export default function ManageFloorsModal({
  isOpen,
  buildingId,
  floors,
  onClose,
  onFloorAdded,
  onFloorDeleted,
  onFloorImageReplaced,
}: ManageFloorsModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [newFloorNumber, setNewFloorNumber] = useState<string>('')
  const [newFloorFile, setNewFloorFile] = useState<File | null>(null)
  const newFloorFileInputRef = useRef<HTMLInputElement>(null)

  // Per-row replace-image file inputs (keyed by floor.id)
  const replaceInputRefs = useRef<Map<number, HTMLInputElement>>(new Map())

  if (!isOpen) return null

  const sortedFloors = [...floors].sort((a, b) => a.floorNumber - b.floorNumber)

  async function handleReplaceImage(floor: NavFloor, file: File) {
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      await fetch(`/api/admin/floor-plan/${buildingId}/${floor.floorNumber}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      onFloorImageReplaced()
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteFloor(floor: NavFloor) {
    if (floor.nodes.length > 0) {
      const confirmed = window.confirm(
        `Floor ${floor.floorNumber} has ${floor.nodes.length} nodes. Delete all?`,
      )
      if (!confirmed) return
    }
    setIsSaving(true)
    try {
      await fetch(`/api/admin/floors/${floor.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      onFloorDeleted(floor.id)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAddFloor(e: React.FormEvent) {
    e.preventDefault()
    if (!newFloorFile || !newFloorNumber) return
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('buildingId', String(buildingId))
      formData.append('floorNumber', newFloorNumber)
      formData.append('image', newFloorFile)
      const res = await fetch('/api/admin/floors', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const { floorId } = await res.json() as { ok: boolean; floorId: number }
      const ext = newFloorFile.name.split('.').pop()?.toLowerCase() ?? 'png'
      const newFloor: NavFloor = {
        id: floorId,
        floorNumber: Number(newFloorNumber),
        imagePath: `floor-plan-${buildingId}-${newFloorNumber}.${ext}`,
        updatedAt: new Date().toISOString(),
        nodes: [],
        edges: [],
      }
      setNewFloorNumber('')
      setNewFloorFile(null)
      if (newFloorFileInputRef.current) {
        newFloorFileInputRef.current.value = ''
      }
      onFloorAdded(newFloor)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-[480px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-800">Manage Floors</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl leading-none focus:outline-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Floor list */}
        <div className="overflow-y-auto flex-1 px-5 py-3 flex flex-col gap-2">
          {sortedFloors.length === 0 && (
            <p className="text-sm text-gray-500 py-2">No floors yet. Add one below.</p>
          )}
          {sortedFloors.map((floor) => (
            <div
              key={floor.id}
              className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0"
            >
              {/* Floor label */}
              <span className="text-sm font-medium text-gray-700 w-20 shrink-0">
                Floor {floor.floorNumber}
              </span>

              {/* Image preview */}
              <img
                src={`/api/floor-plan/${buildingId}/${floor.floorNumber}`}
                alt={`Floor ${floor.floorNumber} plan`}
                className="w-12 h-8 object-cover rounded border border-gray-200"
              />

              <div className="flex-1" />

              {/* Replace Image */}
              <input
                ref={(el) => {
                  if (el) replaceInputRefs.current.set(floor.id, el)
                  else replaceInputRefs.current.delete(floor.id)
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleReplaceImage(floor, file)
                }}
              />
              <button
                type="button"
                disabled={isSaving}
                onClick={() => replaceInputRefs.current.get(floor.id)?.click()}
                className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Replace Image
              </button>

              {/* Delete */}
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleDeleteFloor(floor)}
                className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {/* Add Floor form */}
        <form
          onSubmit={handleAddFloor}
          className="border-t px-5 py-4 flex flex-col gap-3 bg-gray-50"
        >
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Add Floor</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              step={1}
              placeholder="Floor #"
              value={newFloorNumber}
              onChange={(e) => setNewFloorNumber(e.target.value)}
              className="w-24 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              ref={newFloorFileInputRef}
              type="file"
              accept="image/*"
              className="text-sm text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50"
              onChange={(e) => setNewFloorFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <button
            type="submit"
            disabled={!newFloorNumber || !newFloorFile || isSaving}
            className="self-start px-4 py-1.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Floor
          </button>
        </form>
      </div>
    </div>
  )
}
