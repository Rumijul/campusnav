import Konva from 'konva'
import { useEffect, useMemo, useRef } from 'react'
import { Image } from 'react-konva'

interface FloorPlanImageProps {
  image: HTMLImageElement | undefined
  isFullLoaded: boolean
  viewportWidth: number
  viewportHeight: number
  onImageRectChange?: (rect: { x: number; y: number; width: number; height: number }) => void
}

/**
 * Renders the floor plan image on the Konva canvas with:
 * - Fit-to-screen with preserved aspect ratio (40px padding)
 * - Fade-in transition on image change
 * - Reports computed image rect for elastic bounds (Plan 02)
 */
export default function FloorPlanImage({
  image,
  isFullLoaded,
  viewportWidth,
  viewportHeight,
  onImageRectChange,
}: FloorPlanImageProps) {
  const imageRef = useRef<Konva.Image>(null)
  const tweenRef = useRef<Konva.Tween | null>(null)

  const rect = useMemo(() => {
    if (!image) return null
    const padding = 40
    const scale = Math.min(
      (viewportWidth - padding * 2) / image.naturalWidth,
      (viewportHeight - padding * 2) / image.naturalHeight,
    )
    const scaledWidth = image.naturalWidth * scale
    const scaledHeight = image.naturalHeight * scale
    const x = (viewportWidth - scaledWidth) / 2
    const y = (viewportHeight - scaledHeight) / 2
    return { x, y, width: scaledWidth, height: scaledHeight }
  }, [image, viewportWidth, viewportHeight])

  // Report image rect changes to parent (Plan 02 elastic bounds)
  useEffect(() => {
    if (rect) {
      onImageRectChange?.(rect)
    }
  }, [rect, onImageRectChange])

  // Fade-in transition when image changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — animate on each image swap
  useEffect(() => {
    const node = imageRef.current
    if (!node) return

    // Destroy previous tween (React strict mode safety)
    if (tweenRef.current) {
      tweenRef.current.destroy()
      tweenRef.current = null
    }

    node.opacity(0)
    const tween = new Konva.Tween({
      node,
      duration: 0.3,
      opacity: 1,
      easing: Konva.Easings.EaseInOut,
    })
    tween.play()
    tweenRef.current = tween

    return () => {
      tween.destroy()
    }
  }, [image, isFullLoaded])

  if (!rect) return null

  return (
    <Image
      ref={imageRef}
      image={image}
      x={rect.x}
      y={rect.y}
      width={rect.width}
      height={rect.height}
    />
  )
}
