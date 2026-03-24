import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { deriveStudentGpsState } from '../gps/studentGpsState'
import type { RouteSelection } from '../hooks/useRouteSelection'
import { SearchOverlay } from './SearchOverlay'

function createRouteSelection(): RouteSelection {
  return {
    start: null,
    destination: null,
    activeField: 'start',
    bothSelected: false,
    setStart: () => {},
    setDestination: () => {},
    setActiveField: () => {},
    setFromTap: () => {},
    swap: () => {},
    clearStart: () => {},
    clearDestination: () => {},
    clearAll: () => {},
  }
}

function renderOverlayMarkup(gpsState: ReturnType<typeof deriveStudentGpsState>) {
  return renderToStaticMarkup(
    <SearchOverlay
      selection={createRouteSelection()}
      nodes={[]}
      onRouteTrigger={() => {}}
      gpsState={gpsState}
      onUseMyLocation={() => {}}
    />,
  )
}

describe('SearchOverlay geolocation integration', () => {
  it('renders explicit permission-denied fallback copy and disables use-location action', () => {
    const gpsState = deriveStudentGpsState({
      hasFloorCalibration: true,
      geolocationStatus: 'permission-denied',
      accuracyMeters: null,
      nearestNodeId: null,
    })

    const markup = renderOverlayMarkup(gpsState)

    expect(markup).toContain('Use my location')
    expect(markup).toContain('Location permission is blocked')
    expect(markup).toContain('aria-label="Use my location"')
    expect(markup).toContain('disabled=""')
  })

  it('enables use-location action when GPS state is ready with a nearest node', () => {
    const gpsState = deriveStudentGpsState({
      hasFloorCalibration: true,
      geolocationStatus: 'ready',
      accuracyMeters: 8,
      nearestNodeId: 'node-ready',
    })

    const markup = renderOverlayMarkup(gpsState)

    expect(markup).toContain('Use my location')
    expect(markup).toContain('aria-label="Use my location"')
    expect(markup).not.toContain('disabled=""')
    expect(markup).not.toContain('Choose a start point manually')
  })

  it('keeps manual A/B search controls visible while fallback messaging is shown', () => {
    const gpsState = deriveStudentGpsState({
      hasFloorCalibration: true,
      geolocationStatus: 'ready',
      accuracyMeters: 80,
      nearestNodeId: null,
    })

    const markup = renderOverlayMarkup(gpsState)

    expect(markup).toContain('Search start location...')
    expect(markup).toContain('Search destination...')
    expect(markup).toContain('aria-label="Swap start and destination"')
    expect(markup).toContain('Location accuracy is currently above 50m')
  })
})
