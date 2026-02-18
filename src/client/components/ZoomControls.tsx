interface ZoomControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  disabled?: boolean
}

/**
 * HTML overlay with accessible +/- zoom buttons.
 * Positioned in the bottom-right corner, outside the Konva canvas.
 * Buttons remain stable during pan/zoom — they don't transform with the stage.
 */
export default function ZoomControls({ onZoomIn, onZoomOut, disabled = false }: ZoomControlsProps) {
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
      <button
        type="button"
        onClick={onZoomIn}
        disabled={disabled}
        aria-label="Zoom in"
        className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-xl font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none"
      >
        +
      </button>
      <button
        type="button"
        onClick={onZoomOut}
        disabled={disabled}
        aria-label="Zoom out"
        className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-xl font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none"
      >
        −
      </button>
    </div>
  )
}
