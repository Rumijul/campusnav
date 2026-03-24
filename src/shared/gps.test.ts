import {
  accuracyMetersToMapPixelRadius,
  DEFAULT_MAX_GPS_ACCURACY_METERS,
  findNearestWalkableNode,
  isGpsFixConfident,
  isLatLngWithinBounds,
  projectLatLngToNormalizedPoint,
  snapLatLngToNearestWalkableNode,
} from '@shared/gps'
import type { NavEdge, NavFloorGpsBounds, NavNode } from '@shared/types'
import { describe, expect, it } from 'vitest'

const TEST_BOUNDS: NavFloorGpsBounds = {
  minLat: 14,
  maxLat: 15,
  minLng: 120,
  maxLng: 121,
}

describe('projectLatLngToNormalizedPoint', () => {
  it('projects bounds corners and inverts latitude for Y axis', () => {
    expect(projectLatLngToNormalizedPoint(15, 120, TEST_BOUNDS)).toEqual({ x: 0, y: 0 })
    expect(projectLatLngToNormalizedPoint(14, 121, TEST_BOUNDS)).toEqual({ x: 1, y: 1 })
    expect(projectLatLngToNormalizedPoint(14.5, 120.5, TEST_BOUNDS)).toEqual({ x: 0.5, y: 0.5 })
  })

  it('returns null for out-of-bounds coordinates', () => {
    expect(projectLatLngToNormalizedPoint(15.01, 120.5, TEST_BOUNDS)).toBeNull()
    expect(projectLatLngToNormalizedPoint(14.5, 119.99, TEST_BOUNDS)).toBeNull()
  })
})

describe('isLatLngWithinBounds', () => {
  it('treats edges as in-bounds and excludes external coordinates', () => {
    expect(isLatLngWithinBounds(14, 120, TEST_BOUNDS)).toBe(true)
    expect(isLatLngWithinBounds(15, 121, TEST_BOUNDS)).toBe(true)
    expect(isLatLngWithinBounds(13.9999, 120.2, TEST_BOUNDS)).toBe(false)
    expect(isLatLngWithinBounds(14.5, 121.0001, TEST_BOUNDS)).toBe(false)
  })
})

describe('isGpsFixConfident', () => {
  it('accepts fixes at or below the confidence threshold', () => {
    expect(isGpsFixConfident(0)).toBe(true)
    expect(isGpsFixConfident(DEFAULT_MAX_GPS_ACCURACY_METERS)).toBe(true)
  })

  it('hides low-confidence fixes above 50m', () => {
    expect(isGpsFixConfident(50.0001)).toBe(false)
    expect(isGpsFixConfident(120)).toBe(false)
  })
})

describe('accuracyMetersToMapPixelRadius', () => {
  it('scales linearly with reported accuracy for fixed map dimensions', () => {
    const radius10m = accuracyMetersToMapPixelRadius(10, TEST_BOUNDS, 1000, 800)
    const radius20m = accuracyMetersToMapPixelRadius(20, TEST_BOUNDS, 1000, 800)

    expect(radius10m).toBeGreaterThan(0)
    expect(radius20m).toBeCloseTo(radius10m * 2, 8)
  })

  it('returns 0 for invalid bounds or map dimensions', () => {
    expect(accuracyMetersToMapPixelRadius(10, null, 1000, 800)).toBe(0)
    expect(accuracyMetersToMapPixelRadius(10, TEST_BOUNDS, 0, 800)).toBe(0)
    expect(accuracyMetersToMapPixelRadius(-1, TEST_BOUNDS, 1000, 800)).toBe(0)
  })
})

describe('findNearestWalkableNode', () => {
  it('selects the nearest node among walkable graph-connected candidates only', () => {
    const nodeA = makeNode('node-a', 0.2, 0.5)
    const nodeB = makeNode('node-b', 0.8, 0.5)
    const nodeIsolated = makeNode('node-isolated', 0.51, 0.5)

    const match = findNearestWalkableNode(
      { x: 0.51, y: 0.5 },
      [nodeA, nodeB, nodeIsolated],
      [makeEdge('edge-ab', 'node-a', 'node-b')],
    )

    expect(match?.node.id).toBe('node-b')
    expect(match?.distance).toBeCloseTo(0.29, 8)
  })

  it('returns null when there are no walkable candidates', () => {
    const result = findNearestWalkableNode(
      { x: 0.5, y: 0.5 },
      [makeNode('solo', 0.5, 0.5)],
      [],
    )

    expect(result).toBeNull()
  })

  it('uses stable lexical node-id ordering to break equal-distance ties', () => {
    const nodeA = makeNode('node-a', 0.4, 0.5)
    const nodeB = makeNode('node-b', 0.6, 0.5)

    const match = findNearestWalkableNode(
      { x: 0.5, y: 0.5 },
      [nodeB, nodeA],
      [makeEdge('edge-ab', 'node-a', 'node-b')],
    )

    expect(match?.node.id).toBe('node-a')
    expect(match?.distance).toBeCloseTo(0.1, 8)
  })
})

describe('snapLatLngToNearestWalkableNode', () => {
  it('returns null when the incoming GPS fix is outside floor bounds', () => {
    const result = snapLatLngToNearestWalkableNode(
      15.2,
      120.5,
      TEST_BOUNDS,
      [makeNode('node-a', 0.25, 0.5), makeNode('node-b', 0.75, 0.5)],
      [makeEdge('edge-ab', 'node-a', 'node-b')],
    )

    expect(result).toBeNull()
  })

  it('returns projected point and nearest walkable node for in-bounds fixes', () => {
    const result = snapLatLngToNearestWalkableNode(
      14.5,
      120.75,
      TEST_BOUNDS,
      [makeNode('node-a', 0.25, 0.5), makeNode('node-b', 0.75, 0.5)],
      [makeEdge('edge-ab', 'node-a', 'node-b')],
    )

    expect(result?.projectedPoint).toEqual({ x: 0.75, y: 0.5 })
    expect(result?.node.id).toBe('node-b')
    expect(result?.distance).toBeCloseTo(0, 8)
  })
})

function makeNode(id: string, x: number, y: number): NavNode {
  return {
    id,
    x,
    y,
    label: id,
    type: 'hallway',
    searchable: false,
    floorId: 1,
  }
}

function makeEdge(id: string, sourceId: string, targetId: string): NavEdge {
  return {
    id,
    sourceId,
    targetId,
    standardWeight: 1,
    accessibleWeight: 1,
    accessible: true,
    bidirectional: true,
  }
}
