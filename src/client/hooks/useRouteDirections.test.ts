import type { PathResult } from '@shared/pathfinding/types'
import type { NavNode } from '@shared/types'
import { describe, expect, it } from 'vitest'
import { type DirectionStep, generateDirections, routesAreIdentical } from './useRouteDirections'

// ---------------------------------------------------------------------------
// Minimal test fixtures
// ---------------------------------------------------------------------------

/**
 * Build a NavNode with defaults — only override what each test needs.
 */
function makeNode(id: string, x: number, y: number, overrides: Partial<NavNode> = {}): NavNode {
  return {
    id,
    x,
    y,
    label: id,
    type: 'hallway',
    searchable: false,
    floorId: 1,
    ...overrides,
  }
}

function makeMap(nodes: NavNode[]): Map<string, NavNode> {
  return new Map(nodes.map((n) => [n.id, n]))
}

// ---------------------------------------------------------------------------
// generateDirections — edge cases (0 and 1 nodes)
// ---------------------------------------------------------------------------

describe('generateDirections — empty/single node paths', () => {
  const nodeMap = makeMap([makeNode('a', 0, 0)])

  it('returns empty result for 0 nodes', () => {
    const result = generateDirections([], nodeMap, 'standard')
    expect(result.steps).toEqual([])
    expect(result.totalDistanceNorm).toBe(0)
    expect(result.totalDurationSec).toBe(0)
  })

  it('returns empty result for 1 node', () => {
    const result = generateDirections(['a'], nodeMap, 'standard')
    expect(result.steps).toEqual([])
    expect(result.totalDistanceNorm).toBe(0)
    expect(result.totalDurationSec).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// generateDirections — 2-node path (single "arrive" step)
// ---------------------------------------------------------------------------

describe('generateDirections — 2-node path', () => {
  // a(0,0) → b(0.3,0)
  const a = makeNode('a', 0, 0)
  const b = makeNode('b', 0.3, 0, { label: 'Library', type: 'landmark', searchable: true })
  const nodeMap = makeMap([a, b])

  it('returns single arrive step', () => {
    const result = generateDirections(['a', 'b'], nodeMap, 'standard')
    expect(result.steps).toHaveLength(1)
    const step = result.steps[0] as DirectionStep
    expect(step.icon).toBe('arrive')
    expect(step.instruction).toContain('Library')
  })

  it('calculates correct durationSec for standard mode', () => {
    const WALKING_SPEED_STANDARD = 0.023
    const dist = 0.3 // Euclidean distance a→b
    const result = generateDirections(['a', 'b'], nodeMap, 'standard')
    const step = result.steps[0] as DirectionStep
    expect(step.durationSec).toBeCloseTo(dist / WALKING_SPEED_STANDARD, 2)
  })

  it('calculates correct durationSec for accessible mode', () => {
    const WALKING_SPEED_ACCESSIBLE = 0.013
    const dist = 0.3
    const result = generateDirections(['a', 'b'], nodeMap, 'accessible')
    const step = result.steps[0] as DirectionStep
    expect(step.durationSec).toBeCloseTo(dist / WALKING_SPEED_ACCESSIBLE, 2)
  })

  it('accumulates totalDistanceNorm and totalDurationSec', () => {
    const result = generateDirections(['a', 'b'], nodeMap, 'standard')
    expect(result.totalDistanceNorm).toBeCloseTo(0.3, 5)
    expect(result.totalDurationSec).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// generateDirections — 3-node straight path (collinear)
// ---------------------------------------------------------------------------

describe('generateDirections — straight path (3 collinear nodes)', () => {
  // a(0,0.5) → b(0.5,0.5) → c(1,0.5) — all on the same horizontal line
  const a = makeNode('a', 0, 0.5)
  const b = makeNode('b', 0.5, 0.5)
  const c = makeNode('c', 1, 0.5, { label: 'Exit', type: 'entrance', searchable: true })
  const nodeMap = makeMap([a, b, c])

  it('produces 2 steps total', () => {
    const result = generateDirections(['a', 'b', 'c'], nodeMap, 'standard')
    expect(result.steps).toHaveLength(2)
  })

  it('first step icon is straight', () => {
    const result = generateDirections(['a', 'b', 'c'], nodeMap, 'standard')
    const step = result.steps[0] as DirectionStep
    expect(step.icon).toBe('straight')
  })

  it('second step icon is arrive', () => {
    const result = generateDirections(['a', 'b', 'c'], nodeMap, 'standard')
    const step = result.steps[1] as DirectionStep
    expect(step.icon).toBe('arrive')
  })

  it('arrive step instruction includes landmark label', () => {
    const result = generateDirections(['a', 'b', 'c'], nodeMap, 'standard')
    const step = result.steps[1] as DirectionStep
    expect(step.instruction).toContain('Exit')
  })
})

// ---------------------------------------------------------------------------
// generateDirections — left turn (~90° left)
// ---------------------------------------------------------------------------

describe('generateDirections — left turn path', () => {
  // a(0,0) → b(0.5,0) → c(0.5,0.5)
  // Going right along x, then turning down (south)
  // bearing prev→curr = 90° (east), bearing curr→next = 180° (south)
  // delta = 180 - 90 = 90° → but sign determines left/right
  // With atan2 coords: east=90°, south=180°
  // delta = next_bearing - prev_bearing = 180 - 90 = 90° (right turn)
  // Use a left turn: a(0,0.5) → b(0.5,0.5) → c(0.5,0)
  // prev→curr bearing = east (90°)
  // curr→next bearing = north (0°)
  // delta = 0 - 90 = -90° → left turn
  const a = makeNode('a', 0, 0.5)
  const b = makeNode('b', 0.5, 0.5)
  const c = makeNode('c', 0.5, 0, { label: 'Office', type: 'room', searchable: true })
  const nodeMap = makeMap([a, b, c])

  it('first step icon is turn-left', () => {
    const result = generateDirections(['a', 'b', 'c'], nodeMap, 'standard')
    const step = result.steps[0] as DirectionStep
    expect(step.icon).toBe('turn-left')
  })

  it('turn-left step instruction mentions landmark at turn node', () => {
    // b is hallway/not searchable — no landmark reference
    const result = makeMap([
      a,
      makeNode('b', 0.5, 0.5, { label: 'Cafeteria', type: 'landmark', searchable: true }),
      c,
    ])
    const directions = generateDirections(['a', 'b', 'c'], result, 'standard')
    const step = directions.steps[0] as DirectionStep
    expect(step.instruction).toContain('Cafeteria')
  })
})

// ---------------------------------------------------------------------------
// generateDirections — right turn (~90° right)
// ---------------------------------------------------------------------------

describe('generateDirections — right turn path', () => {
  // a(0,0.5) → b(0.5,0.5) → c(0.5,1)
  // prev→curr bearing = east (90°)
  // curr→next bearing = south (180°)
  // delta = 180 - 90 = 90° → right turn
  const a = makeNode('a', 0, 0.5)
  const b = makeNode('b', 0.5, 0.5)
  const c = makeNode('c', 0.5, 1)
  const nodeMap = makeMap([a, b, c])

  it('first step icon is turn-right', () => {
    const result = generateDirections(['a', 'b', 'c'], nodeMap, 'standard')
    const step = result.steps[0] as DirectionStep
    expect(step.icon).toBe('turn-right')
  })
})

// ---------------------------------------------------------------------------
// generateDirections — sharp turns (≥120°)
// ---------------------------------------------------------------------------

describe('generateDirections — sharp turns', () => {
  it('sharp-right: bearing delta >= 120° positive', () => {
    // a(0,0.5) → b(0.5,0.5) → c(0.356,0.705)
    // prev→curr bearing = east (90°)
    // curr→next bearing ≈ 215° (SSW) → delta ≈ 125° → sharp-right
    const a = makeNode('a', 0, 0.5)
    const b = makeNode('b', 0.5, 0.5)
    const c = makeNode('c', 0.356, 0.705) // bearing from b ≈ 215°, delta ≈ 125°
    const nodeMap = makeMap([a, b, c])
    const result = generateDirections(['a', 'b', 'c'], nodeMap, 'standard')
    const step = result.steps[0] as DirectionStep
    expect(step.icon).toBe('sharp-right')
  })
})

// ---------------------------------------------------------------------------
// generateDirections — isAccessibleSegment
// ---------------------------------------------------------------------------

describe('generateDirections — isAccessibleSegment', () => {
  it('marks ramp node as accessible segment', () => {
    const a = makeNode('a', 0, 0)
    const b = makeNode('b', 0.5, 0, { type: 'ramp' })
    const c = makeNode('c', 1, 0)
    const nodeMap = makeMap([a, b, c])
    const result = generateDirections(['a', 'b', 'c'], nodeMap, 'standard')
    const step = result.steps[0] as DirectionStep
    expect(step.isAccessibleSegment).toBe(true)
  })

  it('marks elevator node as accessible segment', () => {
    const a = makeNode('a', 0, 0)
    const b = makeNode('b', 0.5, 0, { type: 'elevator' })
    const c = makeNode('c', 1, 0)
    const nodeMap = makeMap([a, b, c])
    const result = generateDirections(['a', 'b', 'c'], nodeMap, 'standard')
    const step = result.steps[0] as DirectionStep
    expect(step.isAccessibleSegment).toBe(true)
  })

  it('hallway node is not accessible segment', () => {
    const a = makeNode('a', 0, 0)
    const b = makeNode('b', 0.5, 0, { type: 'hallway' })
    const c = makeNode('c', 1, 0)
    const nodeMap = makeMap([a, b, c])
    const result = generateDirections(['a', 'b', 'c'], nodeMap, 'standard')
    const step = result.steps[0] as DirectionStep
    expect(step.isAccessibleSegment).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// routesAreIdentical
// ---------------------------------------------------------------------------

describe('routesAreIdentical', () => {
  const found = (nodeIds: string[]): PathResult => ({
    found: true,
    nodeIds,
    totalDistance: 1,
    segments: [],
  })

  const notFound: PathResult = {
    found: false,
    nodeIds: [],
    totalDistance: 0,
    segments: [],
  }

  it('returns true when both routes have same nodeIds', () => {
    expect(routesAreIdentical(found(['a', 'b', 'c']), found(['a', 'b', 'c']))).toBe(true)
  })

  it('returns false when nodeIds differ', () => {
    expect(routesAreIdentical(found(['a', 'b', 'c']), found(['a', 'b', 'd']))).toBe(false)
  })

  it('returns false when lengths differ', () => {
    expect(routesAreIdentical(found(['a', 'b']), found(['a', 'b', 'c']))).toBe(false)
  })

  it('returns false when first route not found', () => {
    expect(routesAreIdentical(notFound, found(['a', 'b']))).toBe(false)
  })

  it('returns false when second route not found', () => {
    expect(routesAreIdentical(found(['a', 'b']), notFound)).toBe(false)
  })

  it('returns false when both routes not found', () => {
    expect(routesAreIdentical(notFound, notFound)).toBe(false)
  })
})
