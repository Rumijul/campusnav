import { describe, expect, it } from 'vitest'
import { filterNodesByActiveFloor, filterRouteSegmentByFloor, totalFloorCount } from './useFloorFiltering'
import type { NavBuilding, NavNode } from '@shared/types'

// ---------------------------------------------------------------------------
// Minimal NavNode factory
// ---------------------------------------------------------------------------

function makeNode(overrides: Partial<NavNode> & { id: string; floorId: number }): NavNode {
  return {
    x: 0.5,
    y: 0.5,
    label: 'Test',
    type: 'room',
    searchable: true,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Test fixture: Two floors
// Floor 1: a room node + a stairs node (stairs are NOT shown from adjacent floors)
// Floor 2: an elevator node that connectsToFloorBelowId=1 (visible on floor 1 as dimmed)
// ---------------------------------------------------------------------------

const floorOneRoom = makeNode({ id: 'room-1', floorId: 1, type: 'room' })
const floorOneStairs = makeNode({ id: 'stairs-1', floorId: 1, type: 'stairs', connectsToFloorAboveId: 2 })
const floorTwoElevator = makeNode({
  id: 'elevator-2',
  floorId: 2,
  type: 'elevator',
  connectsToFloorBelowId: 1,
})

const allNodes: NavNode[] = [floorOneRoom, floorOneStairs, floorTwoElevator]

// ---------------------------------------------------------------------------
// filterNodesByActiveFloor
// ---------------------------------------------------------------------------

describe('filterNodesByActiveFloor', () => {
  it('Test 1: nodes on active floor are included', () => {
    const result = filterNodesByActiveFloor(allNodes, 1)
    const ids = result.nodes.map((n) => n.id)
    expect(ids).toContain('room-1')
    expect(ids).toContain('stairs-1')
  })

  it('Test 2: elevator nodes from adjacent floors are included and dimmed', () => {
    // Active floor is 1; elevator-2 is on floor 2 but connects to floor 1 below
    const result = filterNodesByActiveFloor(allNodes, 1)
    const ids = result.nodes.map((n) => n.id)
    expect(ids).toContain('elevator-2')
    expect(result.dimmedNodeIds.has('elevator-2')).toBe(true)
  })

  it('Test 3: stairs/ramp nodes from adjacent floors are NOT included', () => {
    // Active floor is 2; stairs-1 is on floor 1 (connects above to floor 2)
    // stairs nodes from adjacent floors should NOT appear on the active floor
    const result = filterNodesByActiveFloor(allNodes, 2)
    const ids = result.nodes.map((n) => n.id)
    expect(ids).not.toContain('stairs-1')
  })
})

// ---------------------------------------------------------------------------
// filterRouteSegmentByFloor
// ---------------------------------------------------------------------------

describe('filterRouteSegmentByFloor', () => {
  const nodeMap = new Map<string, NavNode>(allNodes.map((n) => [n.id, n]))

  it('Test 4: route nodeIds filtered to active floor only', () => {
    // Route passes through floor 1 room and floor 2 elevator
    const routeNodeIds = ['room-1', 'elevator-2']
    const result = filterRouteSegmentByFloor(routeNodeIds, nodeMap, 1)
    expect(result).toEqual(['room-1'])
    expect(result).not.toContain('elevator-2')
  })

  it('Test 5: returns empty array when no route nodes on active floor', () => {
    // Route only contains elevator-2 which is on floor 2; active floor is 1
    const routeNodeIds = ['elevator-2']
    const result = filterRouteSegmentByFloor(routeNodeIds, nodeMap, 1)
    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// totalFloorCount
// ---------------------------------------------------------------------------

describe('totalFloorCount', () => {
  it('Test 6: returns 1 for single-floor campus', () => {
    const singleFloorBuildings: NavBuilding[] = [
      {
        id: 1,
        name: 'Main Building',
        floors: [
          {
            id: 1,
            floorNumber: 1,
            imagePath: '/floor-plan-1-1.png',
            updatedAt: '2026-01-01T00:00:00Z',
            nodes: [],
            edges: [],
          },
        ],
      },
    ]
    expect(totalFloorCount(singleFloorBuildings)).toBe(1)
  })

  it('Test 7: returns N for multi-building campus', () => {
    const multiFloorBuildings: NavBuilding[] = [
      {
        id: 1,
        name: 'Building A',
        floors: [
          {
            id: 1,
            floorNumber: 1,
            imagePath: '/floor-plan-1-1.png',
            updatedAt: '2026-01-01T00:00:00Z',
            nodes: [],
            edges: [],
          },
          {
            id: 2,
            floorNumber: 2,
            imagePath: '/floor-plan-1-2.png',
            updatedAt: '2026-01-01T00:00:00Z',
            nodes: [],
            edges: [],
          },
        ],
      },
      {
        id: 2,
        name: 'Building B',
        floors: [
          {
            id: 3,
            floorNumber: 1,
            imagePath: '/floor-plan-2-1.png',
            updatedAt: '2026-01-01T00:00:00Z',
            nodes: [],
            edges: [],
          },
        ],
      },
    ]
    // 2 floors in Building A + 1 floor in Building B = 3 total
    expect(totalFloorCount(multiFloorBuildings)).toBe(3)
  })
})
