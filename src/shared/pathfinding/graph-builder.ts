/**
 * Graph construction from NavGraph JSON.
 *
 * Builds a typed ngraph.graph instance from a serialized NavGraph object,
 * handling bidirectional edge expansion. Also exports a Euclidean distance
 * utility used for edge weight calculation and A* heuristic.
 */

import type { NavEdge, NavEdgeData, NavGraph, NavNode, NavNodeData } from '@shared/types'
import type { Graph } from 'ngraph.graph'
import createGraph from 'ngraph.graph'

/**
 * Flattens a multi-floor NavGraph into a single list of nodes and edges.
 *
 * Phase 16 compatibility shim: the pathfinding engine was written for a flat
 * NavGraph. This function extracts all nodes and edges across all buildings and
 * floors so the existing engine continues to work for single-floor routing.
 *
 * Phase 17 will replace this shim with cross-floor routing logic that properly
 * handles floor connector nodes and inter-floor edges.
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
 * For each node: destructures `{ id, ...data }` and adds to graph.
 * For each edge: adds a directed link. If `bidirectional` is true,
 * also adds the reverse directed link so both `graph.getLink(a, b)`
 * and `graph.getLink(b, a)` return a link.
 *
 * Uses flattenNavGraph to extract a flat nodes/edges view from the nested
 * buildings → floors structure. The pathfinding engine uses only x, y, and
 * weight fields for routing; extra fields (floorId, connector IDs) are
 * stored as node data and ignored by the routing algorithm.
 */
export function buildGraph(navGraph: NavGraph): Graph<NavNodeData, NavEdgeData> {
  const graph = createGraph<NavNodeData, NavEdgeData>()
  const { nodes, edges } = flattenNavGraph(navGraph)

  for (const { id, ...data } of nodes) {
    graph.addNode(id, data)
  }

  for (const { id: _id, sourceId, targetId, ...data } of edges) {
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
