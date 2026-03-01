/**
 * Graph construction from NavGraph JSON.
 *
 * Builds a typed ngraph.graph instance from a serialized NavGraph object,
 * handling bidirectional edge expansion and cross-floor edge synthesis.
 * Also exports a Euclidean distance utility used for edge weight calculation
 * and A* heuristic.
 */

import type { NavEdge, NavEdgeData, NavGraph, NavNode, NavNodeData } from '@shared/types'
import type { Graph } from 'ngraph.graph'
import createGraph from 'ngraph.graph'

/**
 * Flattens a multi-floor NavGraph into a single list of nodes and edges.
 *
 * Retained for the admin map editor (MapEditorCanvas.tsx) which depends on
 * this function to flatten the NavGraph before editing and re-wrap it on save.
 * This function is NOT called inside buildGraph as of Phase 17.
 */
export function flattenNavGraph(navGraph: NavGraph): { nodes: NavNode[]; edges: NavEdge[] } {
  const nodes: NavNode[] = []
  const edges: NavEdge[] = []
  for (const building of navGraph.buildings) {
    for (const floor of building.floors) {
      nodes.push(...floor.nodes)
      edges.push(...floor.edges)
    }
  }
  return { nodes, edges }
}

/**
 * Constructs a live ngraph.graph from a serialized NavGraph JSON object.
 *
 * Phase 17 implementation: iterates buildings → floors directly (no longer
 * calls flattenNavGraph internally). After all nodes and intra-floor edges
 * are added, performs a second pass to synthesize bidirectional inter-floor
 * edges from connectsToNodeAboveId on stairs, elevator, and ramp nodes.
 *
 * Inter-floor edge weights:
 * - stairs: standardWeight=0.3, accessibleWeight=Infinity, accessible=false
 * - elevator/ramp: standardWeight=0.3, accessibleWeight=0.45, accessible=true
 *
 * For each node: destructures `{ id, ...data }` and adds to graph.
 * For each intra-floor edge: adds a directed link. If `bidirectional` is true,
 * also adds the reverse directed link so both `graph.getLink(a, b)`
 * and `graph.getLink(b, a)` return a link.
 *
 * The pathfinding engine uses x, y, and weight fields for routing; extra
 * fields (floorId, connector IDs) are stored as node data and passed through.
 */
export function buildGraph(navGraph: NavGraph): Graph<NavNodeData, NavEdgeData> {
  const graph = createGraph<NavNodeData, NavEdgeData>()

  // Pass 1: add all nodes and intra-floor edges from all buildings and floors.
  for (const building of navGraph.buildings) {
    for (const floor of building.floors) {
      for (const { id, ...data } of floor.nodes) {
        graph.addNode(id, data)
      }

      for (const { id: _id, sourceId, targetId, ...data } of floor.edges) {
        // Normalize accessibleWeight to Infinity for non-accessible edges.
        // JSON cannot represent Infinity, so the serialized form uses a large
        // finite number. The graph should carry the true semantic value.
        const edgeData: NavEdgeData = data.accessible
          ? data
          : { ...data, accessibleWeight: Number.POSITIVE_INFINITY }
        graph.addLink(sourceId, targetId, edgeData)
        if (edgeData.bidirectional) {
          graph.addLink(targetId, sourceId, edgeData)
        }
      }
    }
  }

  // Pass 2: synthesize bidirectional inter-floor edges from connector nodes.
  // Only process connectsToNodeAboveId to avoid adding each pair twice
  // (the counterpart node on the floor above has connectsToNodeBelowId pointing
  // back, which would duplicate the edge if we processed both directions here).
  const processedPairs = new Set<string>()

  graph.forEachNode((node) => {
    const data = node.data
    const nodeType = data.type

    if (
      (nodeType === 'stairs' || nodeType === 'elevator' || nodeType === 'ramp') &&
      data.connectsToNodeAboveId != null
    ) {
      const targetId = data.connectsToNodeAboveId
      if (!graph.hasNode(targetId)) return

      // Build a canonical pair key (sorted) to skip duplicates.
      const pairKey = [node.id, targetId].sort().join('|')
      if (processedPairs.has(pairKey)) return
      processedPairs.add(pairKey)

      // Skip if links already exist (e.g. JSON stored inter-floor edges).
      if (graph.hasLink(node.id, targetId) || graph.hasLink(targetId, node.id)) return

      const isAccessible = nodeType === 'elevator' || nodeType === 'ramp'
      const interFloorEdge: NavEdgeData = {
        standardWeight: 0.3,
        accessibleWeight: isAccessible ? 0.45 : Number.POSITIVE_INFINITY,
        accessible: isAccessible,
        bidirectional: true,
      }

      graph.addLink(node.id, targetId, interFloorEdge)
      graph.addLink(targetId, node.id, interFloorEdge)
    }
  })

  return graph
}

/**
 * Computes Euclidean distance between two points.
 *
 * Used by:
 * - Admin editor (Phase 9) to auto-compute edge weights from node coordinates
 * - Pathfinding engine (Plan 02) as the A* heuristic function
 *
 * @param ax - X coordinate of point A
 * @param ay - Y coordinate of point A
 * @param bx - X coordinate of point B
 * @param by - Y coordinate of point B
 * @returns Euclidean distance between the two points
 */
export function calculateWeight(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}
