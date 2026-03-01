import type { EditorMode } from '../../hooks/useEditorState'

/* ──────────────── Props ──────────────── */

interface EditorToolbarProps {
  mode: EditorMode
  onModeChange: (mode: EditorMode) => void
  onUpload: () => void
  onSave: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  isDirty: boolean
  onLogout: () => void
  onManageFloors?: () => void
  isCampusActive?: boolean
}

/* ──────────────── Component ──────────────── */

export default function EditorToolbar({
  mode,
  onModeChange,
  onUpload,
  onSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isDirty,
  onLogout,
  onManageFloors,
  isCampusActive,
}: EditorToolbarProps) {
  const modeButtonClass = (m: EditorMode) =>
    m === mode
      ? 'bg-blue-600 text-white border border-blue-600 px-3 py-1 rounded text-sm font-medium'
      : 'bg-white text-gray-700 border border-gray-300 px-3 py-1 rounded text-sm font-medium hover:bg-gray-50'

  const disabledClass = 'opacity-50 cursor-not-allowed'

  return (
    <div className="relative w-full z-10 bg-white border-b shadow-sm px-4 py-2 flex items-center gap-2 flex-wrap">
      {/* Mode buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={modeButtonClass('select')}
          onClick={() => onModeChange('select')}
        >
          Select
        </button>
        <button
          type="button"
          className={modeButtonClass('add-node')}
          onClick={() => onModeChange('add-node')}
        >
          Add Node
        </button>
        <button
          type="button"
          className={modeButtonClass('add-edge')}
          onClick={() => onModeChange('add-edge')}
        >
          Add Edge
        </button>
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 mx-1" />

      {/* Upload and Save */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="bg-white text-gray-700 border border-gray-300 px-3 py-1 rounded text-sm font-medium hover:bg-gray-50"
          onClick={onUpload}
        >
          {isCampusActive ? 'Upload Campus Map' : 'Upload Floor Plan'}
        </button>
        {!isCampusActive && onManageFloors && (
          <button
            type="button"
            className="bg-white text-gray-700 border border-gray-300 px-3 py-1 rounded text-sm font-medium hover:bg-gray-50"
            onClick={onManageFloors}
          >
            Manage Floors
          </button>
        )}
        <button
          type="button"
          className={`px-3 py-1 rounded text-sm font-medium border ${
            isDirty
              ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
              : 'bg-gray-100 text-gray-400 border-gray-200'
          }`}
          onClick={onSave}
        >
          Save
        </button>
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 mx-1" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={`bg-white text-gray-700 border border-gray-300 px-3 py-1 rounded text-sm font-medium hover:bg-gray-50 ${!canUndo ? disabledClass : ''}`}
          onClick={onUndo}
          disabled={!canUndo}
        >
          Undo
        </button>
        <button
          type="button"
          className={`bg-white text-gray-700 border border-gray-300 px-3 py-1 rounded text-sm font-medium hover:bg-gray-50 ${!canRedo ? disabledClass : ''}`}
          onClick={onRedo}
          disabled={!canRedo}
        >
          Redo
        </button>
      </div>

      {/* Spacer to push logout to the right */}
      <div className="flex-1" />

      {/* Logout */}
      <button
        type="button"
        className="bg-red-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-600"
        onClick={onLogout}
      >
        Logout
      </button>
    </div>
  )
}
