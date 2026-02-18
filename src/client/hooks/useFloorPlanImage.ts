import useImage from 'use-image'

/**
 * Progressive floor plan image loading.
 *
 * Loads both the low-res thumbnail and full-resolution image concurrently.
 * Returns the best available image (full > thumbnail > undefined) along
 * with loading/error status flags.
 */
export function useFloorPlanImage() {
  const [thumb, thumbStatus] = useImage('/api/floor-plan/thumbnail')
  const [full, fullStatus] = useImage('/api/floor-plan/image')

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
