/**
 * PathfindingEngine — dual-mode A* with accessibility filtering.
 *
 * Wraps ngraph.path's A* algorithm with the project's type system.
 * Takes a NavGraph, builds an internal ngraph.graph, and exposes
 * findRoute(fromId, toId, mode) for standard and accessible routing.
 *
 * Used by Phase 6 (route visualization) and Phase 7 (turn-by-turn).
 */

import { buildGraph, calculateWeight } from '@shared/pathfinding/graph-builder'
import type { PathResult, PathSegment, RouteMode } from '@shared/pathfinding/types'
import type { NavEdgeData, NavGraph, NavNodeData } from '@shared/types'
import type { Graph, Link, Node } from 'ngraph.graph'
import type { PathFinder } from 'ngraph.path'
import { aStar } from 'ngraph.path'

/** Not-found result constant — reused for all failure responses. */
const NOT_FOUND: PathResult = Object.freeze({
  found: false,
  nodeIds: [],
  totalDistance: 0,
  segments: [],
})

export class PathfindingEngine {
  private readonly graph: Graph<NavNodeData, NavEdgeData>
  private readonly standardFinder: PathFinder<NavNodeData>
  private readonly accessibleFinder: PathFinder<NavNodeData>

  constructor(navGraph: NavGraph) {
    this.graph = buildGraph(navGraph)

    // Standard finder: uses standardWeight, no edge blocking
    this.standardFinder = aStar<NavNodeData, NavEdgeData>(this.graph, {
      distance: (_from: Node<NavNodeData>, _to: Node<NavNodeData>, link: Link<NavEdgeData>) =>
        link.data.standardWeight,
      heuristic: (a: Node<NavNodeData>, b: Node<NavNodeData>) =>
        a.data.floorId !== b.data.floorId
          ? 0
          : calculateWeight(a.data.x, a.data.y, b.data.x, b.data.y),
    })

    // Accessible finder: uses accessibleWeight, blocks non-accessible edges
    this.accessibleFinder = aStar<NavNodeData, NavEdgeData>(this.graph, {
      distance: (_from: Node<NavNodeData>, _to: Node<NavNodeData>, link: Link<NavEdgeData>) =>
        link.data.accessibleWeight,
      heuristic: (a: Node<NavNodeData>, b: Node<NavNodeData>) =>
        a.data.floorId !== b.data.floorId
          ? 0
          : calculateWeight(a.data.x, a.data.y, b.data.x, b.data.y),
      blocked: (_from: Node<NavNodeData>, _to: Node<NavNodeData>, link: Link<NavEdgeData>) =>
        !link.data.accessible,
    })
  }

  /**
   * Find a route between two nodes.
   *
   * @param fromId - Source node ID
   * @param toId - Destination node ID
   * @param mode - 'standard' or 'accessible'
   * @returns PathResult with found status, ordered nodeIds, segments, and totalDistance
   */
  findRoute(fromId: string, toId: string, mode: RouteMode): PathResult {
    // Same start and destination: trivial path
    if (fromId === toId) {
      return { found: true, nodeIds: [fromId], totalDistance: 0, segments: [] }
    }

    // Validate node existence before calling finder (ngraph throws on missing nodes)
    if (!this.graph.hasNode(fromId) || !this.graph.hasNode(toId)) {
      return { ...NOT_FOUND }
    }

    const finder = mode === 'accessible' ? this.accessibleFinder : this.standardFinder

    const rawPath = finder.find(fromId, toId)

    // ngraph.path returns [targetNode] when all paths are blocked — not a valid path
    if (rawPath.length <= 1) {
      return { ...NOT_FOUND }
    }

    // ngraph.path returns destination-first — reverse to get source-first order
    const path = rawPath.reverse()

    const nodeIds: string[] = []
    const segments: PathSegment[] = []
    let totalDistance = 0

    for (let i = 0; i < path.length; i++) {
      const node = path[i]
      if (!node) continue
      const nodeId = node.id as string
      nodeIds.push(nodeId)

      if (i > 0) {
        const prevNode = path[i - 1]
        if (!prevNode) continue
        const prevId = prevNode.id as string
        const link = this.graph.getLink(prevId, nodeId)

        const distance =
          link != null
            ? mode === 'accessible'
              ? link.data.accessibleWeight
              : link.data.standardWeight
            : 0

        segments.push({ fromId: prevId, toId: nodeId, distance })
        totalDistance += distance
      }
    }

    return { found: true, nodeIds, totalDistance, segments }
  }
}
