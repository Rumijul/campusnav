import type { GeometryTool } from './types'

/* ── Inline SVG icon components (no emoji, no external library) ── */

function IconSelect({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 2L4 14L7.5 10.5L10 14L12.5 13L9.5 9L13 9L4 2Z"
        stroke={active ? '#ffffff' : '#6b7280'}
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill={active ? '#ffffff' : 'none'}
        fillOpacity={active ? 0.2 : 0}
      />
    </svg>
  )
}

function IconWall({ active }: { active: boolean }) {
  const s = active ? '#ffffff' : '#6b7280'
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="12" height="12" rx="1"
        stroke={s} strokeWidth="1.5" fill="none"
      />
      <line x1="2" y1="6" x2="14" y2="6"
        stroke={s} strokeWidth="1" strokeDasharray="2 1.5"
      />
      <line x1="2" y1="10" x2="14" y2="10"
        stroke={s} strokeWidth="1" strokeDasharray="2 1.5"
      />
      <line x1="6" y1="2" x2="6" y2="14"
        stroke={s} strokeWidth="0.8" strokeDasharray="1.5 1.5"
      />
      <line x1="10" y1="2" x2="10" y2="14"
        stroke={s} strokeWidth="0.8" strokeDasharray="1.5 1.5"
      />
    </svg>
  )
}

function IconRoom({ active }: { active: boolean }) {
  const s = active ? '#ffffff' : '#6b7280'
  const f = active ? '#ffffff' : 'none'
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="12" height="12" rx="1.5"
        stroke={s} strokeWidth="1.5"
        fill={f} fillOpacity={active ? 0.15 : 0}
      />
      <rect x="5" y="5" width="6" height="6" rx="0.5"
        stroke={s} strokeWidth="1" fill="none" opacity={0.5}
      />
    </svg>
  )
}

function IconDoor({ active }: { active: boolean }) {
  const s = active ? '#ffffff' : '#6b7280'
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="4" width="4" height="9" rx="0.5"
        stroke={s} strokeWidth="1.5" fill="none"
      />
      <circle cx="8.5" cy="8.5" r="0.6" fill={s} />
      <path d="M9 7.5 Q13 7 13 4" stroke={s} strokeWidth="1.2"
        strokeLinecap="round" fill="none"
        strokeDasharray="2 1.5"
      />
    </svg>
  )
}

function IconLabel({ active }: { active: boolean }) {
  const s = active ? '#ffffff' : '#6b7280'
  const f = active ? '#ffffff' : 'none'
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3H11L14.5 8.5L8 14L1.5 9.5V3Z"
        stroke={s} strokeWidth="1.4"
        strokeLinejoin="round"
        fill={f} fillOpacity={active ? 0.15 : 0}
      />
      <line x1="4.5" y1="6" x2="8.5" y2="6"
        stroke={s} strokeWidth="1" strokeLinecap="round"
      />
      <line x1="4.5" y1="8.5" x2="10.5" y2="8.5"
        stroke={s} strokeWidth="1" strokeLinecap="round"
      />
    </svg>
  )
}

function IconErase({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 14 L11 3 L14 6 L5 14 Z"
        stroke={active ? '#ffffff' : '#6b7280'}
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill={active ? '#ffffff' : 'none'}
        fillOpacity={active ? 0.2 : 0}
      />
      <line x1="9.5" y1="9.5" x2="13" y2="13"
        stroke={active ? '#ffffff' : '#6b7280'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconUndo() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 7C2.5 4.5 4.5 2.5 7 2.5C9.5 2.5 11.5 4.5 11.5 7C11.5 9.5 9.5 11.5 7 11.5"
        stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" fill="none"
      />
      <path d="M2.5 5L1 7L2.5 9.5"
        stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round"
        strokeLinejoin="round" fill="none"
      />
    </svg>
  )
}

function IconRedo() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.5 7C11.5 4.5 9.5 2.5 7 2.5C4.5 2.5 2.5 4.5 2.5 7C2.5 9.5 4.5 11.5 7 11.5"
        stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" fill="none"
      />
      <path d="M11.5 5L13 7L11.5 9.5"
        stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round"
        strokeLinejoin="round" fill="none"
      />
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
