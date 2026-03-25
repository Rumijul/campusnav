import Konva from 'konva'
import { type RefObject, useCallback, useRef } from 'react'

// CRITICAL: Enable hit detection during drag — without this, the second touch
// is swallowed during a pan gesture and pinch-zoom fails on mobile.
Konva.hitOnDragEnabled = true

/* ──────────────── Constants ──────────────── */

const MIN_SCALE = 0.3
const MAX_SCALE = 4
/** 10% per scroll tick — smooth incremental zoom */
const SCROLL_SCALE_BY = 1.1
/** 30% per button click — larger step for discoverability */
const BUTTON_SCALE_BY = 1.3

/* ──────────────── Helpers ──────────────── */

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}

function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
}

function getCenter(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): { x: number; y: number } {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
}

function getAngle(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x)
}

/* ──────────────── Exported gesture math helpers ──────────────── */

/**
 * Convert a container-relative screen point to stage-local coordinates using
 * Konva's absolute inverse transform. Correct at any rotation angle — unlike
 * the naive `(screenX - stage.x()) / stage.scaleX()` formula which fails when
 * the stage is rotated.
 */
export type StageForGesture = {
  getAbsoluteTransform: () => {
    copy: () => {
      invert: () => { point: (p: { x: number; y: number }) => { x: number; y: number } }
    }
  }
  container: () => { getBoundingClientRect: () => { left: number; top: number } }
}

export function toStageLocalFromScreen(
  stage: StageForGesture,
  screenPoint: { x: number; y: number },
): { x: number; y: number } {
  const rect = stage.container().getBoundingClientRect()
  const containerRelative = { x: screenPoint.x - rect.left, y: screenPoint.y - rect.top }
  return stage.getAbsoluteTransform().copy().invert().point(containerRelative)
}

/**
 * Compute the stage position that keeps a given stage-local anchor point fixed
 * under a given screen position after applying newScale and newRotationDeg.
 *
 * Uses a Konva.Transform forward projection: rotate → scale → subtract from
 * screenCenter to find the required stage translation.
 */
export function computePivotPosition(
  stageLocal: { x: number; y: number },
  screenCenter: { x: number; y: number },
  newScale: number,
  newRotationDeg: number,
): { x: number; y: number } {
  const t = new Konva.Transform()
  t.rotate((newRotationDeg * Math.PI) / 180)
  t.scale(newScale, newScale)
  const projected = t.point(stageLocal)
  return {
    x: screenCenter.x - projected.x,
    y: screenCenter.y - projected.y,
  }
}

/**
 * Returns true if the per-frame angular delta (in degrees) exceeds the 2-degree
 * jitter threshold, meaning the rotation should be applied. Strict greater-than:
 * exactly 2° returns false.
 */
export function applyRotationThreshold(angleDiffDeg: number): boolean {
  return Math.abs(angleDiffDeg) > 2
}

/**
 * Normalize an angular delta to the shortest signed path in [-180, 180).
 * Prevents huge frame jumps when atan2 crosses the +π/-π boundary.
 */
export function normalizeAngleDiffDeg(angleDiffDeg: number): number {
  return ((((angleDiffDeg + 180) % 360) + 360) % 360) - 180
}

export type StageForTwoTouchFrame = StageForGesture & {
  scaleX: () => number
  rotation: () => number
}

interface TwoTouchFrameTransformInput {
  stage: StageForTwoTouchFrame
  previousDistance: number
  currentDistance: number
  previousCenterScreen: { x: number; y: number }
  currentCenterScreen: { x: number; y: number }
  previousAngleRad: number | null
  currentAngleRad: number
}

/**
 * Compute one two-finger gesture frame the way mobile map apps behave:
 * - scale from distance ratio
 * - optional rotation (thresholded)
 * - translation anchored to previous midpoint, mapped to current midpoint
 *
 * Anchoring to the previous midpoint allows natural two-finger pan while pinching
 * (the grabbed map point follows the fingers) instead of slipping underneath them.
 */
export function computeTwoTouchFrameTransform({
  stage,
  previousDistance,
  currentDistance,
  previousCenterScreen,
  currentCenterScreen,
  previousAngleRad,
  currentAngleRad,
}: TwoTouchFrameTransformInput): {
  newScale: number
  newRotationDeg: number
  newPosition: { x: number; y: number }
} {
  const safeDistanceRatio = previousDistance > 0 ? currentDistance / previousDistance : 1
  const newScale = clamp(stage.scaleX() * safeDistanceRatio, MIN_SCALE, MAX_SCALE)

  const rawAngleDiffDeg =
    (currentAngleRad - (previousAngleRad ?? currentAngleRad)) * (180 / Math.PI)
  const angleDiffDeg = normalizeAngleDiffDeg(rawAngleDiffDeg)
  const newRotationDeg = applyRotationThreshold(angleDiffDeg)
    ? stage.rotation() + angleDiffDeg
    : stage.rotation()

  const stageAnchor = toStageLocalFromScreen(stage, previousCenterScreen)
  const rect = stage.container().getBoundingClientRect()
  const currentCenterContainer = {
    x: currentCenterScreen.x - rect.left,
    y: currentCenterScreen.y - rect.top,
  }

  const newPosition = computePivotPosition(
    stageAnchor,
    currentCenterContainer,
    newScale,
    newRotationDeg,
  )

  return {
    newScale,
    newRotationDeg,
    newPosition,
  }
}

/* ──────────────── Hook ──────────────── */

interface UseMapViewportOptions {
  stageRef: RefObject<Konva.Stage | null>
  imageRect: { x: number; y: number; width: number; height: number } | null
  onScaleChange?: (scale: number) => void
}

export function useMapViewport({ stageRef, imageRect, onScaleChange }: UseMapViewportOptions): {
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void
  handleTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => void
  handleTouchEnd: (e: Konva.KonvaEventObject<TouchEvent>) => void
  handleDragEnd: () => void
  zoomByButton: (direction: 1 | -1) => void
  fitToScreen: (viewportWidth: number, viewportHeight: number, animate?: boolean) => void
} {
  const lastDist = useRef<number>(0)
  const lastCenter = useRef<{ x: number; y: number } | null>(null)
  const lastAngle = useRef<number | null>(null)
  const dragStoppedByMultiTouch = useRef(false)
  const activeTween = useRef<Konva.Tween | null>(null)

  /**
   * Pointer-centric zoom (INSTANT — no Tween).
   * Zooms toward cursor position like Google Maps.
   * Rapid scroll events must NOT create stacked animations.
   */
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      const stage = stageRef.current
      if (!stage) return

      e.evt.preventDefault()

      const pointer = stage.getPointerPosition()
      if (!pointer) return

      const oldScale = stage.scaleX()

      // The point in stage-local coordinates under the cursor
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      }

      // Determine direction: deltaY > 0 = scroll down = zoom out
      // ctrlKey is set for trackpad pinch gestures → invert
      let direction = e.evt.deltaY > 0 ? -1 : 1
      if (e.evt.ctrlKey) direction = -direction

      const newScale = clamp(
        direction > 0 ? oldScale * SCROLL_SCALE_BY : oldScale / SCROLL_SCALE_BY,
        MIN_SCALE,
        MAX_SCALE,
      )

      // Apply DIRECTLY to stage node — no React setState, no Tween
      stage.scale({ x: newScale, y: newScale })
      stage.position({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      })
      onScaleChange?.(newScale)
    },
    [stageRef, onScaleChange],
  )

  /**
   * Multi-touch pinch-zoom + rotation.
   * Single finger = pan (handled by Stage draggable).
   * Two fingers = pinch-zoom + optional rotation.
   */
  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      const stage = stageRef.current
      if (!stage) return

      const touches = e.evt.touches
      // Only prevent default for multi-touch (pinch/rotate) — single-finger
      // drag must reach Konva's draggable handler via native touch events
      if (touches.length >= 2) {
        e.evt.preventDefault()
      }

      // Hand off from two-finger pinch back to one-finger drag without forcing
      // users to lift and re-touch the screen.
      if (touches.length < 2) {
        if (touches.length === 1 && dragStoppedByMultiTouch.current && !stage.isDragging()) {
          stage.startDrag()
          dragStoppedByMultiTouch.current = false
        }
        return
      }

      // Hand off from single-finger drag to two-finger pinch
      if (stage.isDragging()) {
        stage.stopDrag()
        dragStoppedByMultiTouch.current = true
      }

      const t0 = touches[0]
      const t1 = touches[1]
      if (!t0 || !t1) return

      const p1 = { x: t0.clientX, y: t0.clientY }
      const p2 = { x: t1.clientX, y: t1.clientY }

      const dist = getDistance(p1, p2)
      const center = getCenter(p1, p2)
      const angle = getAngle(p1, p2)

      // First frame of gesture — store initial values
      if (lastDist.current === 0) {
        lastDist.current = dist
        lastCenter.current = center
        lastAngle.current = angle
        return
      }

      const previousCenter = lastCenter.current ?? center

      const { newScale, newRotationDeg, newPosition } = computeTwoTouchFrameTransform({
        stage,
        previousDistance: lastDist.current,
        currentDistance: dist,
        previousCenterScreen: previousCenter,
        currentCenterScreen: center,
        previousAngleRad: lastAngle.current,
        currentAngleRad: angle,
      })

      stage.scaleX(newScale)
      stage.scaleY(newScale)
      stage.rotation(newRotationDeg)
      stage.position(newPosition)
      onScaleChange?.(newScale)

      // Update refs for next frame
      lastDist.current = dist
      lastCenter.current = center
      lastAngle.current = angle
    },
    [stageRef, onScaleChange],
  )

  /**
   * Reset touch tracking refs when gesture ends.
   */
  const handleTouchEnd = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      const stage = stageRef.current
      const remainingTouches = e.evt.touches.length

      // If one finger remains after a pinch, resume native drag so panning
      // continues smoothly instead of feeling "stuck" or jumpy.
      if (
        remainingTouches === 1 &&
        dragStoppedByMultiTouch.current &&
        stage &&
        !stage.isDragging()
      ) {
        stage.startDrag()
        dragStoppedByMultiTouch.current = false
      }

      if (remainingTouches < 2) {
        lastDist.current = 0
        lastCenter.current = null
        lastAngle.current = null
      }

      if (remainingTouches === 0) {
        dragStoppedByMultiTouch.current = false
      }
    },
    [stageRef],
  )

  /**
   * Elastic snap-back: soft bounds that pull the floor plan back
   * when dragged too far off-screen.
   */
  const handleDragEnd = useCallback(() => {
    const stage = stageRef.current
    if (!stage || !imageRect) return

    const scale = stage.scaleX()
    const stagePos = stage.position()

    // Floor plan edges in viewport (screen) coordinates
    const left = imageRect.x * scale + stagePos.x
    const right = (imageRect.x + imageRect.width) * scale + stagePos.x
    const top = imageRect.y * scale + stagePos.y
    const bottom = (imageRect.y + imageRect.height) * scale + stagePos.y

    const margin = 100 // pixels of allowed overscroll
    let newX = stagePos.x
    let newY = stagePos.y
    let needsSnap = false

    // Horizontal bounds
    if (right < margin) {
      newX = margin - (imageRect.x + imageRect.width) * scale
      needsSnap = true
    } else if (left > stage.width() - margin) {
      newX = stage.width() - margin - imageRect.x * scale
      needsSnap = true
    }

    // Vertical bounds
    if (bottom < margin) {
      newY = margin - (imageRect.y + imageRect.height) * scale
      needsSnap = true
    } else if (top > stage.height() - margin) {
      newY = stage.height() - margin - imageRect.y * scale
      needsSnap = true
    }

    if (needsSnap) {
      if (activeTween.current) {
        activeTween.current.destroy()
        activeTween.current = null
      }
      const tween = new Konva.Tween({
        node: stage,
        duration: 0.3,
        x: newX,
        y: newY,
        easing: Konva.Easings.EaseInOut,
      })
      tween.play()
      activeTween.current = tween
    }
  }, [stageRef, imageRect])

  /**
   * Animated zoom toward viewport center (for +/- buttons).
   * Uses Konva.Tween for smooth eased transition.
   */
  const zoomByButton = useCallback(
    (direction: 1 | -1) => {
      const stage = stageRef.current
      if (!stage) return

      const oldScale = stage.scaleX()
      const newScale = clamp(
        direction > 0 ? oldScale * BUTTON_SCALE_BY : oldScale / BUTTON_SCALE_BY,
        MIN_SCALE,
        MAX_SCALE,
      )

      const center = { x: stage.width() / 2, y: stage.height() / 2 }
      const mousePointTo = {
        x: (center.x - stage.x()) / oldScale,
        y: (center.y - stage.y()) / oldScale,
      }
      const newPos = {
        x: center.x - mousePointTo.x * newScale,
        y: center.y - mousePointTo.y * newScale,
      }

      if (activeTween.current) {
        activeTween.current.destroy()
        activeTween.current = null
      }

      const tween = new Konva.Tween({
        node: stage,
        duration: 0.25,
        scaleX: newScale,
        scaleY: newScale,
        x: newPos.x,
        y: newPos.y,
        easing: Konva.Easings.EaseInOut,
        onFinish: () => onScaleChange?.(newScale),
      })
      tween.play()
      activeTween.current = tween
    },
    [stageRef, onScaleChange],
  )

  /**
   * Reset stage transform to identity (scale=1, pos=0, rotation=0).
   * FloorPlanImage handles the actual fit-to-screen calculation internally.
   */
  const fitToScreen = useCallback(
    (_viewportWidth: number, _viewportHeight: number, animate = false) => {
      const stage = stageRef.current
      if (!stage || !imageRect) return

      if (animate) {
        if (activeTween.current) {
          activeTween.current.destroy()
          activeTween.current = null
        }
        const tween = new Konva.Tween({
          node: stage,
          duration: 0.3,
          scaleX: 1,
          scaleY: 1,
          x: 0,
          y: 0,
          rotation: 0,
          easing: Konva.Easings.EaseInOut,
          onFinish: () => onScaleChange?.(1),
        })
        tween.play()
        activeTween.current = tween
      } else {
        stage.scale({ x: 1, y: 1 })
        stage.position({ x: 0, y: 0 })
        stage.rotation(0)
        onScaleChange?.(1)
      }
    },
    [stageRef, imageRect, onScaleChange],
  )

  return {
    handleWheel,
    handleTouchMove,
    handleTouchEnd,
    handleDragEnd,
    zoomByButton,
    fitToScreen,
  }
}
