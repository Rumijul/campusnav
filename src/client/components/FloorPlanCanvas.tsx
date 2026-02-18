import type Konva from 'konva'
import { useRef, useState } from 'react'
import { Layer, Stage, Text } from 'react-konva'
import { useFloorPlanImage } from '../hooks/useFloorPlanImage'
import { useViewportSize } from '../hooks/useViewportSize'
import FloorPlanImage from './FloorPlanImage'
import GridBackground from './GridBackground'

/**
 * Main floor plan canvas container.
 *
 * Full-viewport layout — the entire viewport is the map (no header).
 * Renders: grid background → floor plan image → loading/error overlays.
 * Canvas is ready for Plan 02 to add interactive pan/zoom/rotation.
 */
export default function FloorPlanCanvas() {
  const { width, height } = useViewportSize()
  const { image, isLoading, isFailed, isFullLoaded } = useFloorPlanImage()
  const stageRef = useRef<Konva.Stage>(null)
  const [_imageRect, setImageRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })

  return (
    <div className="relative w-full h-full">
      <Stage ref={stageRef} width={width} height={height}>
        {/* Grid — static background, not transformed */}
        <Layer>
          <GridBackground width={width} height={height} />
        </Layer>

        {/* Content — floor plan image */}
        <Layer>
          {!isLoading && !isFailed && image && (
            <FloorPlanImage
              image={image}
              isFullLoaded={isFullLoaded}
              viewportWidth={width}
              viewportHeight={height}
              onImageRectChange={setImageRect}
            />
          )}
        </Layer>

        {/* UI overlay — loading/error states */}
        <Layer>
          {isLoading && (
            <Text
              x={width / 2 - 100}
              y={height / 2 - 10}
              width={200}
              align="center"
              text="Loading floor plan..."
              fontSize={18}
              fill="#64748b"
            />
          )}
          {isFailed && (
            <Text
              x={width / 2 - 130}
              y={height / 2 - 10}
              width={260}
              align="center"
              text="Failed to load floor plan"
              fontSize={18}
              fill="#ef4444"
            />
          )}
        </Layer>
      </Stage>
      {/* ZoomControls will be added here in Plan 02 */}
    </div>
  )
}
