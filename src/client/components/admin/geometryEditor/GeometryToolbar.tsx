import type { GeometryTool } from './types'

/* ── Inline SVG icon components (no emoji, no external library) ── */

function IconSelect({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 2L13 8L8 10L6 14L3 2Z" stroke={active ? 'white' : '#4b5563'} strokeWidth="1.5" strokeLinejoin="round" fill={active ? 'white' : 'none'} fillOpacity={active ? 0.2 : 0} />
    </svg>
  )
}

function IconWall({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="2" y1="14" x2="14" y2="2" stroke={active ? 'white' : '#4b5563'} strokeWidth="2" strokeLinecap="round" />
      <line x1="2" y1="8" x2="8" y2="14" stroke={active ? 'white' : '#4b5563'} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="2" x2="14" y2="8" stroke={active ? 'white' : '#4b5563'} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconRoom({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="10" height="10" rx="1" stroke={active ? 'white' : '#4b5563'} strokeWidth="1.5" fill={active ? 'white' : 'none'} fillOpacity={active ? 0.15 : 0} />
    </svg>
  )
}

function IconDoor({ active }: { active: boolean }) {
  // Door swing arc icon
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="5" width="5" height="8" rx="0.5" stroke={active ? 'white' : '#4b5563'} strokeWidth="1.5" fill={active ? 'white' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <path d="M9 9 Q13 9 13 6" stroke={active ? 'white' : '#4b5563'} strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function IconLabel({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3H10L14 8L8 14L2 9V3Z" stroke={active ? 'white' : '#4b5563'} strokeWidth="1.3" strokeLinejoin="round" fill={active ? 'white' : 'none'} fillOpacity={active ? 0.15 : 0} />
    </svg>
  )
}

function IconErase({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 13L13 3M6 10L9 7" stroke={active ? 'white' : '#4b5563'} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconUndo() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 7C3 4.79 4.79 3 7 3C9.21 3 11 4.79 11 7C11 9.21 9.21 11 7 11" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 4L1 7L3 10" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function IconRedo() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 7C11 4.79 9.21 3 7 3C4.79 3 3 4.79 3 7C3 9.21 4.79 11 7 11" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 4L13 7L11 10" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

interface GeometryToolbarProps {
  activeTool: GeometryTool
  onToolChange: (tool: GeometryTool) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onSave: () => void
  isDirty: boolean
  isSaving: boolean
}

const TOOLS: { id: GeometryTool; label: string; shortcut: string; Icon: React.FC<{ active: boolean }> }[] = [
  { id: 'select', label: 'Select', shortcut: 'V', Icon: IconSelect },
  { id: 'wall', label: 'Wall', shortcut: 'W', Icon: IconWall },
  { id: 'room', label: 'Room', shortcut: 'R', Icon: IconRoom },
  { id: 'door', label: 'Door', shortcut: 'D', Icon: IconDoor },
  { id: 'label', label: 'Label', shortcut: 'L', Icon: IconLabel },
  { id: 'erase', label: 'Erase', shortcut: 'E', Icon: IconErase },
]

export default function GeometryToolbar({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  isDirty,
  isSaving,
}: GeometryToolbarProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-slate-50 flex-wrap">
      {/* Tool group */}
      <div className="flex items-center gap-0.5 mr-3">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            title={`${tool.label} (${tool.shortcut})`}
            onClick={() => onToolChange(tool.id)}
            className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
              activeTool === tool.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <tool.Icon active={activeTool === tool.id} />
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5 mr-3">
        <button
          type="button"
          title="Undo (Ctrl+Z)"
          onClick={onUndo}
          disabled={!canUndo}
          className="w-8 h-8 rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200 flex items-center justify-center"
        >
          <IconUndo />
        </button>
        <button
          type="button"
          title="Redo (Ctrl+Y)"
          onClick={onRedo}
          disabled={!canRedo}
          className="w-8 h-8 rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200 flex items-center justify-center"
        >
          <IconRedo />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Save */}
      <button
        type="button"
        title="Save Geometry"
        onClick={onSave}
        disabled={!isDirty || isSaving}
        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
          isDirty
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        } disabled:cursor-not-allowed`}
      >
        {isSaving ? 'Saving…' : isDirty ? 'Save Geometry' : 'Saved'}
      </button>
    </div>
  )
}
