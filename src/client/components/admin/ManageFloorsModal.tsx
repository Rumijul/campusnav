import { useEffect, useRef, useState } from 'react'
import type { NavFloor, NavFloorGpsBounds } from '@shared/types'
import {
  buildGpsBoundsRequestPayload,
  createGpsBoundsDraft,
  createGpsBoundsDraftByFloor,
  createGpsBoundsDraftMap,
  deriveGpsBoundsFormState,
  type FloorGpsBoundsUpdatePayload,
  type GpsBoundsDraftByFloorId,
  type GpsBoundsDraftValues,
} from './gpsBoundsForm'

/* ──────────────── Props ──────────────── */

interface ManageFloorsModalProps {
  isOpen: boolean
  buildingId: number
  floors: NavFloor[]
  isCampusMode?: boolean
  onClose: () => void
  onFloorAdded: (floor: NavFloor) => void
  onFloorDeleted: (floorId: number) => void
  onFloorImageReplaced: () => void
  onFloorGpsBoundsSaved: (floorId: number, gpsBounds: NavFloorGpsBounds | null) => void
}

interface FloorGpsBoundsSaveSuccessResponse {
  ok: true
  floorId: number
  gpsBounds: NavFloorGpsBounds | null
}

interface FloorGpsBoundsSaveErrorResponse {
  errorCode?: string
  error?: string
}

interface GpsBoundsRowUiState {
  validationError: string | null
  requestPayload: FloorGpsBoundsUpdatePayload | null
  isSaveDisabled: boolean
  hasChanges: boolean
}

export function deriveGpsBoundsRowUiState(
  draftValues: GpsBoundsDraftValues,
  persistedGpsBounds: NavFloorGpsBounds | null,
  options: { isPending: boolean; isSaving: boolean },
): GpsBoundsRowUiState {
  const gpsFormState = deriveGpsBoundsFormState(draftValues, persistedGpsBounds)

  return {
    validationError: gpsFormState.error,
    requestPayload: gpsFormState.payload,
    isSaveDisabled:
      options.isSaving
      || options.isPending
      || !gpsFormState.isValid
      || !gpsFormState.hasChanges,
    hasChanges: gpsFormState.hasChanges,
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNavFloorGpsBounds(value: unknown): value is NavFloorGpsBounds {
  if (!value || typeof value !== 'object') return false

  const maybe = value as Record<string, unknown>
  return (
    isFiniteNumber(maybe.minLat)
    && isFiniteNumber(maybe.maxLat)
    && isFiniteNumber(maybe.minLng)
    && isFiniteNumber(maybe.maxLng)
  )
}

function isFloorGpsBoundsSaveSuccessResponse(
  value: unknown,
): value is FloorGpsBoundsSaveSuccessResponse {
  if (!value || typeof value !== 'object') return false

  const maybe = value as Record<string, unknown>
  return (
    maybe.ok === true
    && Number.isInteger(maybe.floorId)
    && (maybe.gpsBounds === null || isNavFloorGpsBounds(maybe.gpsBounds))
  )
}

/* ──────────────── Component ──────────────── */

export default function ManageFloorsModal({
  isOpen,
  buildingId,
  floors,
  isCampusMode = false,
  onClose,
  onFloorAdded,
  onFloorDeleted,
  onFloorImageReplaced,
  onFloorGpsBoundsSaved,
}: ManageFloorsModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [newFloorNumber, setNewFloorNumber] = useState<string>('')
  const [newFloorFile, setNewFloorFile] = useState<File | null>(null)
  const [gpsDraftsByFloorId, setGpsDraftsByFloorId] = useState<GpsBoundsDraftByFloorId>(() =>
    createGpsBoundsDraftMap(floors),
  )
  const [gpsSaveErrorsByFloorId, setGpsSaveErrorsByFloorId] = useState<Record<number, string>>({})
  const [gpsPendingFloorIds, setGpsPendingFloorIds] = useState<Record<number, true>>({})

  const newFloorFileInputRef = useRef<HTMLInputElement>(null)

  // Per-row replace-image file inputs (keyed by floor.id)
  const replaceInputRefs = useRef<Map<number, HTMLInputElement>>(new Map())

  useEffect(() => {
    if (!isOpen) return

    setGpsDraftsByFloorId((previousDrafts) => {
      const baseDrafts = createGpsBoundsDraftMap(floors)
      const mergedDrafts: GpsBoundsDraftByFloorId = {}

      for (const floor of floors) {
        mergedDrafts[floor.id] = previousDrafts[floor.id] ?? baseDrafts[floor.id] ?? createGpsBoundsDraft()
      }

      return mergedDrafts
    })

    setGpsSaveErrorsByFloorId((previousErrors) => {
      const nextErrors: Record<number, string> = {}
      for (const floor of floors) {
        const existingError = previousErrors[floor.id]
        if (typeof existingError === 'string') {
          nextErrors[floor.id] = existingError
        }
      }
      return nextErrors
    })

    setGpsPendingFloorIds((previousPending) => {
      const nextPending: Record<number, true> = {}
      for (const floor of floors) {
        if (previousPending[floor.id]) {
          nextPending[floor.id] = true
        }
      }
      return nextPending
    })
  }, [floors, isOpen])

  if (!isOpen) return null

  const sortedFloors = [...floors].sort((a, b) => a.floorNumber - b.floorNumber)

  function setGpsSaveError(floorId: number, message: string | null) {
    setGpsSaveErrorsByFloorId((previous) => {
      const next = { ...previous }
      if (message) next[floorId] = message
      else delete next[floorId]
      return next
    })
  }

  function setGpsPending(floorId: number, isPending: boolean) {
    setGpsPendingFloorIds((previous) => {
      const next = { ...previous }
      if (isPending) next[floorId] = true
      else delete next[floorId]
      return next
    })
  }

  function getFloorLabel(floor: NavFloor): string {
    if (isCampusMode) return 'Campus Map'
    return `Floor ${floor.floorNumber}`
  }

  function getFloorPlanPreviewSrc(floor: NavFloor): string {
    if (isCampusMode) {
      return '/api/campus/image'
    }

    return `/api/floor-plan/${buildingId}/${floor.floorNumber}`
  }

  function updateGpsDraft(floorId: number, field: keyof GpsBoundsDraftValues, value: string) {
    setGpsDraftsByFloorId((previous) => {
      const current = previous[floorId] ?? createGpsBoundsDraft()
      return {
        ...previous,
        [floorId]: {
          ...current,
          [field]: value,
        },
      }
    })

    setGpsSaveError(floorId, null)
  }

  async function handleSaveGpsBounds(floor: NavFloor) {
    const draftValues = gpsDraftsByFloorId[floor.id] ?? createGpsBoundsDraftByFloor(floor)
    const rowUiState = deriveGpsBoundsRowUiState(draftValues, floor.gpsBounds ?? null, {
      isPending: Boolean(gpsPendingFloorIds[floor.id]),
      isSaving,
    })

    if (rowUiState.isSaveDisabled || !rowUiState.requestPayload) {
      return
    }

    const requestPayload =
      buildGpsBoundsRequestPayload(draftValues) ?? rowUiState.requestPayload

    setGpsSaveError(floor.id, null)
    setGpsPending(floor.id, true)

    try {
      const response = await fetch(`/api/admin/floors/${floor.id}/gps-bounds`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      })

      const payload =
        (await response
          .json()
          .catch(() => ({}))) as FloorGpsBoundsSaveSuccessResponse | FloorGpsBoundsSaveErrorResponse

      if (!response.ok) {
        const errorCode =
          typeof payload.errorCode === 'string' ? payload.errorCode : 'GPS_BOUNDS_SAVE_FAILED'
        const errorMessage =
          typeof payload.error === 'string' ? payload.error : 'Unable to save GPS bounds.'
        setGpsSaveError(floor.id, `${errorCode}: ${errorMessage}`)
        return
      }

      if (!isFloorGpsBoundsSaveSuccessResponse(payload)) {
        setGpsSaveError(
          floor.id,
          'INVALID_RESPONSE: GPS bounds save response was malformed.',
        )
        return
      }

      setGpsDraftsByFloorId((previous) => ({
        ...previous,
        [floor.id]: createGpsBoundsDraft(payload.gpsBounds),
      }))

      setGpsSaveError(floor.id, null)
      onFloorGpsBoundsSaved(payload.floorId, payload.gpsBounds)
    } catch {
      setGpsSaveError(floor.id, 'NETWORK_ERROR: Unable to save GPS bounds.')
    } finally {
      setGpsPending(floor.id, false)
    }
  }

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
      const { floorId } = (await res.json()) as { ok: boolean; floorId: number }
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
      <div className="bg-white rounded-lg shadow-xl w-[720px] max-h-[85vh] flex flex-col">
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
          {sortedFloors.map((floor) => {
            const draftValues = gpsDraftsByFloorId[floor.id] ?? createGpsBoundsDraftByFloor(floor)
            const isGpsPending = Boolean(gpsPendingFloorIds[floor.id])
            const rowUiState = deriveGpsBoundsRowUiState(draftValues, floor.gpsBounds ?? null, {
              isPending: isGpsPending,
              isSaving,
            })
            const saveError = gpsSaveErrorsByFloorId[floor.id]
            const floorLabel = getFloorLabel(floor)

            return (
              <div
                key={floor.id}
                className="py-3 border-b border-gray-100 last:border-b-0 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-28 shrink-0">
                    {floorLabel}
                  </span>

                  <img
                    src={getFloorPlanPreviewSrc(floor)}
                    alt={`${floorLabel} plan`}
                    className="w-14 h-10 object-cover rounded border border-gray-200"
                  />

                  <div className="flex-1" />

                  {!isCampusMode && (
                    <>
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
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <label className="text-xs text-gray-600 flex flex-col gap-1">
                    Min Lat
                    <input
                      type="text"
                      value={draftValues.minLat}
                      onChange={(e) => updateGpsDraft(floor.id, 'minLat', e.target.value)}
                      aria-label={`floor-${floor.id}-min-lat`}
                      placeholder="e.g. 14.5542"
                      className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </label>
                  <label className="text-xs text-gray-600 flex flex-col gap-1">
                    Max Lat
                    <input
                      type="text"
                      value={draftValues.maxLat}
                      onChange={(e) => updateGpsDraft(floor.id, 'maxLat', e.target.value)}
                      aria-label={`floor-${floor.id}-max-lat`}
                      placeholder="e.g. 14.5549"
                      className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </label>
                  <label className="text-xs text-gray-600 flex flex-col gap-1">
                    Min Lng
                    <input
                      type="text"
                      value={draftValues.minLng}
                      onChange={(e) => updateGpsDraft(floor.id, 'minLng', e.target.value)}
                      aria-label={`floor-${floor.id}-min-lng`}
                      placeholder="e.g. 121.0198"
                      className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </label>
                  <label className="text-xs text-gray-600 flex flex-col gap-1">
                    Max Lng
                    <input
                      type="text"
                      value={draftValues.maxLng}
                      onChange={(e) => updateGpsDraft(floor.id, 'maxLng', e.target.value)}
                      aria-label={`floor-${floor.id}-max-lng`}
                      placeholder="e.g. 121.0206"
                      className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSaveGpsBounds(floor)}
                    disabled={rowUiState.isSaveDisabled}
                    className="text-xs px-2.5 py-1.5 rounded border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGpsPending ? 'Saving GPS Bounds…' : 'Save GPS Bounds'}
                  </button>
                  {rowUiState.hasChanges && !rowUiState.validationError && (
                    <span className="text-xs text-amber-700">Unsaved GPS changes</span>
                  )}
                </div>

                {rowUiState.validationError && (
                  <p className="text-xs text-red-600" role="alert">
                    {rowUiState.validationError}
                  </p>
                )}

                {saveError && (
                  <p className="text-xs text-red-600" role="alert">
                    {saveError}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {!isCampusMode && (
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
        )}
      </div>
    </div>
  )
}
