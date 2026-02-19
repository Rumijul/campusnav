import type Konva from 'konva'
import KonvaModule from 'konva'
import { useEffect, useRef } from 'react'
import { Layer, Line } from 'react-konva'

/* ──────────────── Constants ──────────────── */

const DASH_LENGTH = 16
const GAP_LENGTH = 10
const STROKE_WIDTH = 5
const DASH_SPEED = 40 // px/s — dashes move along path direction

/* ──────────────── Props ──────────────── */

export interface RouteLayerProps {
  points: number[] // flat [x1, y1, x2, y2, ...] pixel coords
  color: string // stroke color (#3b82f6 blue or #22c55e green)
  visible: boolean // whether to render the line at all
}

/* ──────────────── Component ──────────────── */

/**
 * Renders an animated dashed route line on the Konva canvas.
 *
 * - Animates dash offset via Konva.Animation (NOT React setState) to avoid 60fps re-renders
 * - Standard route: blue (#3b82f6), accessible route: green (#22c55e)
 * - tension={0} ensures straight segments through each node point (no spline interpolation)
 * - listening={false} prevents the line from intercepting pointer events
 * - Returns null when not visible or insufficient points (<4)
 * - Animation is stopped and cleaned up on unmount or visibility change
 */
export function RouteLayer({ points, color, visible }: RouteLayerProps) {
  const lineRef = useRef<Konva.Line>(null)
  const animRef = useRef<KonvaModule.Animation | null>(null)

  useEffect(() => {
    if (!visible || points.length < 4) {
      animRef.current?.stop()
      return
    }

    const node = lineRef.current
    if (!node) return

    const layer = node.getLayer()
    if (!layer) return

    // Stop any previously running animation before creating a new one
    animRef.current?.stop()

    animRef.current = new KonvaModule.Animation((frame) => {
      if (!frame) return
      node.dashOffset(node.dashOffset() - (frame.timeDiff / 1000) * DASH_SPEED)
    }, layer)
    animRef.current.start()

    return () => {
      animRef.current?.stop()
      animRef.current = null
    }
  }, [points, visible])

  if (!visible || points.length < 4) return null

  return (
    <Layer>
      <Line
        ref={lineRef}
        points={points}
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        lineCap="round"
        lineJoin="round"
        dash={[DASH_LENGTH, GAP_LENGTH]}
        dashOffset={0}
        listening={false}
        tension={0}
      />
    </Layer>
  )
}
