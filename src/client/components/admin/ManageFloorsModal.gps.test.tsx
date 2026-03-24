import type { NavFloor } from '@shared/types'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ManageFloorsModal, { deriveGpsBoundsRowUiState } from './ManageFloorsModal'

function makeFloor(overrides: Partial<NavFloor> & { id: number; floorNumber: number }): NavFloor {
  return {
    id: overrides.id,
    floorNumber: overrides.floorNumber,
    imagePath: overrides.imagePath ?? `floor-plan-1-${overrides.floorNumber}.png`,
    updatedAt: overrides.updatedAt ?? '2026-03-24T00:00:00.000Z',
    gpsBounds: overrides.gpsBounds,
    nodes: overrides.nodes ?? [],
    edges: overrides.edges ?? [],
  }
}

const noop = () => {}

describe('ManageFloorsModal GPS helpers', () => {
  it('renders inline validation error and blocks save for partial gps tuple', () => {
    const rowUiState = deriveGpsBoundsRowUiState(
      {
        minLat: '14.552',
        maxLat: '',
        minLng: '121.012',
        maxLng: '121.016',
      },
      null,
      { isPending: false, isSaving: false },
    )

    expect(rowUiState.validationError).toContain('GPS_BOUNDS_INCOMPLETE')
    expect(rowUiState.requestPayload).toBeNull()
    expect(rowUiState.isSaveDisabled).toBe(true)
  })

  it('disables save while pending even when tuple is valid', () => {
    const rowUiState = deriveGpsBoundsRowUiState(
      {
        minLat: '14.552',
        maxLat: '14.553',
        minLng: '121.012',
        maxLng: '121.016',
      },
      null,
      { isPending: true, isSaving: false },
    )

    expect(rowUiState.validationError).toBeNull()
    expect(rowUiState.requestPayload).toEqual({
      minLat: 14.552,
      maxLat: 14.553,
      minLng: 121.012,
      maxLng: 121.016,
    })
    expect(rowUiState.isSaveDisabled).toBe(true)
  })
})

describe('ManageFloorsModal GPS rendering', () => {
  it('shows campus floor gps controls and hides add/replace/delete floor controls in campus mode', () => {
    const html = renderToStaticMarkup(
      <ManageFloorsModal
        isOpen
        buildingId={99}
        floors={[makeFloor({ id: 900, floorNumber: 0 })]}
        isCampusMode
        onClose={noop}
        onFloorAdded={noop}
        onFloorDeleted={noop}
        onFloorImageReplaced={noop}
        onFloorGpsBoundsSaved={noop}
      />,
    )

    expect(html).toContain('Campus Map')
    expect(html).toContain('Save GPS Bounds')
    expect(html).not.toContain('Add Floor')
    expect(html).not.toContain('Replace Image')
    expect(html).not.toContain('Delete')
  })

  it('keeps add floor controls available in building mode', () => {
    const html = renderToStaticMarkup(
      <ManageFloorsModal
        isOpen
        buildingId={1}
        floors={[
          makeFloor({
            id: 100,
            floorNumber: 1,
            gpsBounds: {
              minLat: 14.551,
              maxLat: 14.552,
              minLng: 121.01,
              maxLng: 121.011,
            },
          }),
        ]}
        onClose={noop}
        onFloorAdded={noop}
        onFloorDeleted={noop}
        onFloorImageReplaced={noop}
        onFloorGpsBoundsSaved={noop}
      />,
    )

    expect(html).toContain('Floor 1')
    expect(html).toContain('Add Floor')
    expect(html).toContain('Replace Image')
    expect(html).toContain('Delete')
  })
})
