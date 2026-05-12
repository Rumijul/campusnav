import type { GeometryTool } from './types'

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

const TOOLS: { id: GeometryTool; label: string; icon: string; shortcut: string }[] = [
  { id: 'select', label: 'Select', icon: '↖', shortcut: 'V' },
  { id: 'wall', label: 'Wall', icon: '▬', shortcut: 'W' },
  { id: 'room', label: 'Room', icon: '⬜', shortcut: 'R' },
  { id: 'door', label: 'Door', icon: '🚪', shortcut: 'D' },
  { id: 'label', label: 'Label', icon: 'T', shortcut: 'L' },
  { id: 'erase', label: 'Erase', icon: '✕', shortcut: 'E' },
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
            className={`w-8 h-8 rounded text-sm flex items-center justify-center transition-all ${
              activeTool === tool.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tool.icon}
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
          className="w-8 h-8 rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200 flex items-center justify-center text-sm"
        >
          ↩
        </button>
        <button
          type="button"
          title="Redo (Ctrl+Y)"
          onClick={onRedo}
          disabled={!canRedo}
          className="w-8 h-8 rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200 flex items-center justify-center text-sm"
        >
          ↪
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
