import { Circle, Layer } from 'react-konva'

const GPS_DOT_RADIUS_PX = 6
const GPS_DOT_STROKE_WIDTH_PX = 2
const GPS_RING_STROKE_WIDTH_PX = 2

interface GpsLocationLayerProps {
  visible: boolean
  centerX: number
  centerY: number
  accuracyRadiusPx: number
  stageScale: number
}

/**
 * Student GPS marker overlay.
 *
 * Renders:
 * - confidence ring (radius derived from accuracy-to-pixel projection)
 * - center dot for projected fix location
 */
export function GpsLocationLayer({
  visible,
  centerX,
  centerY,
  accuracyRadiusPx,
  stageScale,
}: GpsLocationLayerProps) {
  if (!visible) return null

  const safeScale = stageScale > 0 ? stageScale : 1
  const showAccuracyRing = accuracyRadiusPx > 0

  return (
    <Layer listening={false}>
      {showAccuracyRing && (
        <Circle
          name="gps-accuracy-ring"
          x={centerX}
          y={centerY}
          radius={accuracyRadiusPx}
          fill="rgba(59, 130, 246, 0.12)"
          stroke="rgba(59, 130, 246, 0.45)"
          strokeWidth={GPS_RING_STROKE_WIDTH_PX / safeScale}
        />
      )}

      <Circle
        name="gps-center-dot"
        x={centerX}
        y={centerY}
        radius={GPS_DOT_RADIUS_PX / safeScale}
        fill="#3b82f6"
        stroke="#ffffff"
        strokeWidth={GPS_DOT_STROKE_WIDTH_PX / safeScale}
      />
    </Layer>
  )
}
