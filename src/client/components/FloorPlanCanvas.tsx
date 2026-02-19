import type Konva from 'konva'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Stage, Text } from 'react-konva'
import { useFloorPlanImage } from '../hooks/useFloorPlanImage'
import { useMapViewport } from '../hooks/useMapViewport'
import { useRouteSelection } from '../hooks/useRouteSelection'
import { useViewportSize } from '../hooks/useViewportSize'
import FloorPlanImage from './FloorPlanImage'
import GridBackground from './GridBackground'
import { LandmarkLayer } from './LandmarkLayer'
import { SelectionMarkerLayer } from './SelectionMarkerLayer'
import ZoomControls from './ZoomControls'

/**
 * Main floor plan canvas container.
 *
 * Full-viewport layout — the entire viewport is the map (no header).
 * Renders: grid background → floor plan image → loading/error overlays.
 * Interactive: pan (drag), zoom (scroll/buttons), pinch-zoom, rotation (mobile).
 */
export default function FloorPlanCanvas() {
  const { width, height } = useViewportSize()
  const { image, isLoading, isFailed, isFullLoaded } = useFloorPlanImage()
  const stageRef = useRef<Konva.Stage>(null)
  const [imageRect, setImageRect] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [stageScale, setStageScale] = useState<number>(1)

  const routeSelection = useRouteSelection()

  // Node IDs to hide from LandmarkLayer (replaced by A/B pins)
  const hiddenNodeIds = useMemo(() => {
    const ids: string[] = []
    if (routeSelection.start) ids.push(routeSelection.start.id)
    if (routeSelection.destination) ids.push(routeSelection.destination.id)
    return ids
  }, [routeSelection.start, routeSelection.destination])

  const { handleWheel, handleTouchMove, handleTouchEnd, handleDragEnd, zoomByButton, fitToScreen } =
    useMapViewport({ stageRef, imageRect, onScaleChange: setStageScale })

  // Re-fit floor plan when viewport size changes (e.g. orientation change)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — re-fit on viewport resize only when image is loaded
  useEffect(() => {
    if (image && imageRect) {
      fitToScreen(width, height, true)
    }
  }, [width, height])

  const interactionDisabled = isLoading || isFailed

  return (
    <div className="relative w-full h-full">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        draggable={!interactionDisabled}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDragEnd={handleDragEnd}
      >
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

        {/* Landmarks — markers above floor plan image */}
        <LandmarkLayer
          imageRect={imageRect}
          stageScale={stageScale}
          selectedNodeId={null}
          onSelectNode={routeSelection.setFromTap}
          hiddenNodeIds={hiddenNodeIds}
        />

        {/* Selection pins — A/B labeled markers above landmarks */}
        <SelectionMarkerLayer
          start={routeSelection.start}
          destination={routeSelection.destination}
          imageRect={imageRect}
          stageScale={stageScale}
        />

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

      <ZoomControls
        onZoomIn={() => zoomByButton(1)}
        onZoomOut={() => zoomByButton(-1)}
        disabled={interactionDisabled}
      />
    </div>
  )
}
