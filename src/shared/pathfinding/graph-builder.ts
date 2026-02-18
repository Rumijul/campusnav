/**
 * Graph construction from NavGraph JSON.
 *
 * Builds a typed ngraph.graph instance from a serialized NavGraph object,
 * handling bidirectional edge expansion. Also exports a Euclidean distance
 * utility used for edge weight calculation and A* heuristic.
 */

import type { NavEdgeData, NavGraph, NavNodeData } from '@shared/types'
import type { Graph } from 'ngraph.graph'
import createGraph from 'ngraph.graph'

/**
 * Constructs a live ngraph.graph from a serialized NavGraph JSON object.
 *
 * For each node: destructures `{ id, ...data }` and adds to graph.
 * For each edge: adds a directed link. If `bidirectional` is true,
 * also adds the reverse directed link so both `graph.getLink(a, b)`
 * and `graph.getLink(b, a)` return a link.
 */
export function buildGraph(navGraph: NavGraph): Graph<NavNodeData, NavEdgeData> {
  const graph = createGraph<NavNodeData, NavEdgeData>()

  for (const { id, ...data } of navGraph.nodes) {
    graph.addNode(id, data)
  }

  for (const { id: _id, sourceId, targetId, ...data } of navGraph.edges) {
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
