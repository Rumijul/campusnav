import type { NavBuilding, NavNode } from '@shared/types'

/** Elevator is the only connector type visible to students (stairs/ramp are routing-infrastructure only) */
const STUDENT_VISIBLE_CONNECTOR_TYPE = 'elevator' as const

/**
 * Filters nodes for display on the active floor canvas.
 * Returns active-floor nodes at full opacity + adjacent-floor elevator
 * connector nodes shown dimmed so students can locate them.
 *
 * Adjacency rule for dimmed connectors:
 * - Must be type 'elevator' (stairs/ramp remain hidden from students)
 * - Must NOT be on the active floor
 * - Must connect to the active floor (connectsToFloorAboveId or connectsToFloorBelowId === activeFloorId)
 */
export function filterNodesByActiveFloor(
  allNodes: NavNode[],
  activeFloorId: number,
): { nodes: NavNode[]; dimmedNodeIds: Set<string> } {
  const activeFloorNodes = allNodes.filter(n => n.floorId === activeFloorId)
  const dimmedConnectors = allNodes.filter(
    n =>
      n.type === STUDENT_VISIBLE_CONNECTOR_TYPE &&
      n.floorId !== activeFloorId &&
      (n.connectsToFloorAboveId === activeFloorId || n.connectsToFloorBelowId === activeFloorId),
  )
  const nodes = [...activeFloorNodes, ...dimmedConnectors]
  const dimmedNodeIds = new Set(dimmedConnectors.map(n => n.id))
  return { nodes, dimmedNodeIds }
}

/**
 * Filters a route's nodeIds to those belonging to the active floor.
 * Used to render only the active floor's route segment in RouteLayer.
 *
 * Returns [] when no nodeIds map to activeFloorId or nodeMap is empty.
 */
export function filterRouteSegmentByFloor(
  nodeIds: string[],
  nodeMap: Map<string, NavNode>,
  activeFloorId: number,
): string[] {
  return nodeIds.filter(id => nodeMap.get(id)?.floorId === activeFloorId)
}

/**
 * Total number of floors across all buildings.
 * Used to decide whether to show the FloorTabStrip at all.
 * Tab strip is hidden when totalFloorCount <= 1.
 *
 * Returns 0 for empty array, 1 for single-building single-floor campus.
 */
export function totalFloorCount(buildings: NavBuilding[]): number {
  return buildings.reduce((sum, b) => sum + b.floors.length, 0)
}
