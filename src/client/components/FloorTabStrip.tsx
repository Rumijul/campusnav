import type { NavBuilding, NavFloor } from '@shared/types'

/* ──────────────── Props ──────────────── */

interface FloorTabStripProps {
  /** Non-campus buildings for the building selector */
  buildings: NavBuilding[]
  /** Campus building if one exists (optional — may not be configured) */
  campusBuilding: NavBuilding | undefined
  /** Currently active building ID; 'campus' for the campus overhead view */
  activeBuildingId: number | 'campus' | null
  /** Currently active floor ID */
  activeFloorId: number | null
  /** Sorted floors of the active building (empty when campus is active) */
  sortedFloors: NavFloor[]
  /** Called when user selects a different building from the dropdown */
  onBuildingSwitch: (id: number | 'campus') => void
  /** Called when user taps a floor tab button */
  onFloorSwitch: (floor: NavFloor) => void
}

/* ──────────────── Component ──────────────── */

export function FloorTabStrip({
  buildings,
  campusBuilding,
  activeBuildingId,
  activeFloorId,
  sortedFloors,
  onBuildingSwitch,
  onFloorSwitch,
}: FloorTabStripProps) {
  const isCampusActive = activeBuildingId === 'campus'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-3 py-2 flex items-center gap-2 overflow-x-auto">
      {/* Building selector */}
      <select
        value={isCampusActive ? 'campus' : String(activeBuildingId ?? '')}
        onChange={(e) => {
          const val = e.target.value
          onBuildingSwitch(val === 'campus' ? 'campus' : Number(val))
        }}
        className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 shrink-0"
      >
        {campusBuilding && <option value="campus">Campus</option>}
        {buildings.map((b) => (
          <option key={b.id} value={String(b.id)}>{b.name}</option>
        ))}
      </select>

      {/* Floor tabs — hidden when campus is active (campus has no floor tabs) */}
      {!isCampusActive && sortedFloors.map((floor) => (
        <button
          key={floor.id}
          type="button"
          onClick={() => onFloorSwitch(floor)}
          className={`px-3 py-1 rounded text-sm font-medium shrink-0 ${
            floor.id === activeFloorId
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Floor {floor.floorNumber}
        </button>
      ))}
    </div>
  )
}
