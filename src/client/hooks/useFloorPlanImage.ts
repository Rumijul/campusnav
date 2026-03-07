import useImage from 'use-image'

/**
 * Target for floor plan image loading.
 * - `{ buildingId, floorNumber }` — load a specific building floor image
 * - `'campus'` — load the campus overhead image
 * - `undefined` (legacy) — load via thumbnail + full progressive path
 */
type FloorTarget = { buildingId: number; floorNumber: number } | 'campus'

/**
 * Progressive floor plan image loading with optional multi-floor target support.
 *
 * @param target - Optional target for the image to load:
 *   - `{ buildingId, floorNumber }`: loads `/api/floor-plan/{buildingId}/{floorNumber}`
 *   - `'campus'`: loads `/api/campus/image`
 *   - `undefined` (legacy): progressive thumbnail + full image for `/api/floor-plan/thumbnail` and `/api/floor-plan/image`
 *
 * All `useImage` hooks are called unconditionally (React rules of hooks).
 * Unused slots receive `''` (empty string) — `useImage('')` does not fetch.
 *
 * Returns shape unchanged: `{ image, isLoading, isFailed, isFullLoaded }`
 */
export function useFloorPlanImage(target?: FloorTarget) {
  // Multi-floor target URL (campus or specific floor)
  const targetUrl =
    target === 'campus'
      ? '/api/campus/image'
      : target
        ? `/api/floor-plan/${target.buildingId}/${target.floorNumber}`
        : ''

  // Legacy thumbnail URL — only used when target is undefined
  const thumbUrl = target ? '' : '/api/floor-plan/thumbnail'
  // Legacy full URL — only used when target is undefined
  const fullUrl = target ? '' : '/api/floor-plan/image'

  const [targetImg, targetStatus] = useImage(targetUrl)
  const [thumb, thumbStatus] = useImage(thumbUrl)
  const [full, fullStatus] = useImage(fullUrl)

  if (target) {
    // Multi-floor mode: single image, no progressive loading
    return {
      /** Single image for the specified floor or campus view */
      image: targetStatus === 'loaded' ? targetImg : undefined,
      /** True while the target image is loading */
      isLoading: targetStatus === 'loading',
      /** True if the target image failed to load */
      isFailed: targetStatus === 'failed',
      /** True once the target image has loaded */
      isFullLoaded: targetStatus === 'loaded',
    }
  }

  // Legacy mode: progressive thumbnail + full
  return {
    /** Best available image: full-res if loaded, else thumbnail, else undefined */
    image: fullStatus === 'loaded' ? full : thumbStatus === 'loaded' ? thumb : undefined,
    /** True while neither thumbnail nor full image has loaded yet */
    isLoading: thumbStatus === 'loading' && fullStatus !== 'loaded',
    /** True only when both thumbnail and full image failed to load */
    isFailed: thumbStatus === 'failed' && fullStatus === 'failed',
    /** True once the full-resolution image has loaded */
    isFullLoaded: fullStatus === 'loaded',
  }
}
