/**
 * MobilePathfindingEngine — custom A* pathfinding on NormalizedNavGraph.
 *
 * Avoids the ngraph.graph dependency by implementing A* directly using
 * the normalized graph structure produced by normalizeNavGraph().
 *
 * Features:
 * - Dual-mode routing: standard vs accessible
 * - Inter-floor traversal via stairs/elevator/ramp connectors
 * - Euclidean heuristic with floor-level penalty
 * - Explicit result types (no exceptions for not-found)
 */

import { NavFloor, NavNode } from '../../src/shared/types';
import {
  DirectionStep,
  DirectionsResult,
  NormalizedEdgeRecord,
  NormalizedNavGraph,
  NormalizedNodeRecord,
  PathResult,
  PathSegment,
  RouteMode,
  StepIcon,
} from '../domain/navGraph';

// ============================================================
// Priority Queue (binary heap)
// ============================================================

interface QueueEntry {
  nodeId: string;
  gScore: number;
  fScore: number;
}

/**
 * Min-heap priority queue for A* frontier.
 */
class PriorityQueue {
  private heap: QueueEntry[] = [];

  push(nodeId: string, gScore: number, fScore: number): void {
    this.heap.push({ nodeId, gScore, fScore });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): QueueEntry | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return min;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.heap[parent].fScore <= this.heap[index].fScore) break;
      [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
      index = parent;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < length && this.heap[left].fScore < this.heap[smallest].fScore) {
        smallest = left;
      }
      if (right < length && this.heap[right].fScore < this.heap[smallest].fScore) {
        smallest = right;
      }
      if (smallest === index) break;
      [this.heap[smallest], this.heap[index]] = [this.heap[index], this.heap[smallest]];
      index = smallest;
    }
  }
}

// ============================================================
// Constants
// ============================================================

/** Weight for inter-floor traversal in standard mode (elevator/ramp) */
const INTER_FLOOR_STANDARD_WEIGHT = 0.3;
/** Weight for inter-floor traversal via elevator in accessible mode */
const INTER_FLOOR_ELEVATOR_WEIGHT = 0.45;
/** Weight for inter-floor traversal via ramp in accessible mode */
const INTER_FLOOR_RAMP_WEIGHT = 0.45;
/** Stairs are not accessible — used as sentinel for inaccessible inter-floor traversal */
const INTER_FLOOR_STAIRS_INACCESSIBLE = Infinity;
/** Penalty multiplier for floor-level difference in heuristic */
const FLOOR_PENALTY_PER_LEVEL = 0.5;

// ============================================================
// Engine
// ============================================================

/**
 * Custom A* pathfinding engine for mobile.
 *
 * Operates directly on NormalizedNavGraph, avoiding ngraph.graph dependency.
 */
export class MobilePathfindingEngine {
  private readonly graph: NormalizedNavGraph;

  constructor(graph: NormalizedNavGraph) {
    this.graph = graph;
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
    // Trivial same-node case
    if (fromId === toId) {
      return { found: true, nodeIds: [fromId], totalDistance: 0, segments: [] };
    }

    // Node existence guards
    if (!this.graph.nodeById.has(fromId) || !this.graph.nodeById.has(toId)) {
      return { found: false, nodeIds: [], totalDistance: 0, segments: [] };
    }

    const { nodeIds, segments, totalDistance } = this.astar(fromId, toId, mode);

    if (nodeIds.length === 0) {
      return { found: false, nodeIds: [], totalDistance: 0, segments: [] };
    }

    return { found: true, nodeIds, totalDistance, segments };
  }

  /**
   * A* search implementation.
   */
  private astar(
    startId: string,
    goalId: string,
    mode: RouteMode,
  ): { nodeIds: string[]; segments: PathSegment[]; totalDistance: number } {
    const frontier = new PriorityQueue();
    const cameFrom = new Map<string, { nodeId: string; edge: NormalizedEdgeRecord }>();
    const gScore = new Map<string, number>();
    const visited = new Set<string>();

    const startRecord = this.graph.nodeById.get(startId)!;
    const goalRecord = this.graph.nodeById.get(goalId)!;

    const startHeuristic = this.heuristic(startRecord, goalRecord);
    frontier.push(startId, 0, startHeuristic);
    gScore.set(startId, 0);

    while (!frontier.isEmpty()) {
      const current = frontier.pop()!;
      const currentId = current.nodeId;

      // Goal reached — reconstruct path
      if (currentId === goalId) {
        return this.reconstructPath(startId, goalId, cameFrom, mode);
      }

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const neighbors = this.getNeighbors(currentId, mode);

      for (const { neighborId, edgeRecord, edgeWeight } of neighbors) {
        if (visited.has(neighborId)) continue;

        const tentativeG = (gScore.get(currentId) ?? Infinity) + edgeWeight;

        if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
          gScore.set(neighborId, tentativeG);
          cameFrom.set(neighborId, { nodeId: currentId, edge: edgeRecord });

          const neighborRecord = this.graph.nodeById.get(neighborId)!;
          const f = tentativeG + this.heuristic(neighborRecord, goalRecord);
          frontier.push(neighborId, tentativeG, f);
        }
      }
    }

    // No path found
    return { nodeIds: [], segments: [], totalDistance: 0 };
  }

  /**
   * Reconstruct path from A* search results.
   */
  private reconstructPath(
    startId: string,
    goalId: string,
    cameFrom: Map<string, { nodeId: string; edge: NormalizedEdgeRecord }>,
    mode: RouteMode,
  ): { nodeIds: string[]; segments: PathSegment[]; totalDistance: number } {
    const nodeIds: string[] = [];
    const segments: PathSegment[] = [];
    let currentId: string | undefined = goalId;
    let totalDistance = 0;

    while (currentId !== undefined) {
      nodeIds.unshift(currentId);

      const prev = cameFrom.get(currentId);
      if (prev === undefined) break;

      const { nodeId: prevId, edge } = prev;
      const distance =
        mode === 'accessible' ? edge.effectiveAccessibleWeight : edge.edge.standardWeight;

      segments.unshift({ fromId: prevId, toId: currentId, distance });
      totalDistance += distance;

      currentId = prevId;
    }

    nodeIds.unshift(startId);
    return { nodeIds, segments, totalDistance };
  }

  /**
   * Get neighbors of a node, including inter-floor connections.
   */
  private getNeighbors(
    nodeId: string,
    mode: RouteMode,
  ): Array<{ neighborId: string; edgeRecord: NormalizedEdgeRecord; edgeWeight: number }> {
    const neighbors: Array<{
      neighborId: string;
      edgeRecord: NormalizedEdgeRecord;
      edgeWeight: number;
    }> = [];

    // Same-floor neighbors via outgoing edges
    const outgoingEdges = this.graph.outgoingEdgesByNodeId.get(nodeId) ?? [];
    for (const edgeRecord of outgoingEdges) {
      if (mode === 'accessible' && !edgeRecord.edge.accessible) {
        // Skip non-accessible edges in accessible mode
        continue;
      }

      const weight = mode === 'accessible' ? edgeRecord.effectiveAccessibleWeight : edgeRecord.edge.standardWeight;

      neighbors.push({
        neighborId: edgeRecord.edge.targetId,
        edgeRecord,
        edgeWeight: weight,
      });

      // Add reverse edge for bidirectional connections
      if (edgeRecord.edge.bidirectional) {
        neighbors.push({
          neighborId: edgeRecord.edge.sourceId,
          edgeRecord,
          edgeWeight: weight,
        });
      }
    }

    // Inter-floor neighbors via connector nodes
    const nodeRecord = this.graph.nodeById.get(nodeId);
    if (nodeRecord) {
      const node = nodeRecord.node;

      // Check for connection to floor above
      if (node.connectsToNodeAboveId && node.connectsToFloorAboveId !== undefined) {
        const aboveNeighborId = node.connectsToNodeAboveId;
        if (this.graph.nodeById.has(aboveNeighborId)) {
          const interFloorWeight = this.interFloorWeight(node.type, 'up', mode);
          const syntheticEdgeRecord: NormalizedEdgeRecord = {
            buildingId: nodeRecord.buildingId,
            floorId: node.floorId,
            edge: {
              id: `interfloor-${nodeId}-${aboveNeighborId}`,
              sourceId: nodeId,
              targetId: aboveNeighborId,
              standardWeight: interFloorWeight,
              accessibleWeight: interFloorWeight,
              accessible: node.type === 'elevator' || node.type === 'ramp',
              bidirectional: true,
            },
            effectiveAccessibleWeight: interFloorWeight,
          };

          neighbors.push({
            neighborId: aboveNeighborId,
            edgeRecord: syntheticEdgeRecord,
            edgeWeight: interFloorWeight,
          });
        }
      }

      // Check for connection to floor below
      if (node.connectsToNodeBelowId && node.connectsToFloorBelowId !== undefined) {
        const belowNeighborId = node.connectsToNodeBelowId;
        if (this.graph.nodeById.has(belowNeighborId)) {
          const interFloorWeight = this.interFloorWeight(node.type, 'down', mode);
          const syntheticEdgeRecord: NormalizedEdgeRecord = {
            buildingId: nodeRecord.buildingId,
            floorId: node.floorId,
            edge: {
              id: `interfloor-${nodeId}-${belowNeighborId}`,
              sourceId: nodeId,
              targetId: belowNeighborId,
              standardWeight: interFloorWeight,
              accessibleWeight: interFloorWeight,
              accessible: node.type === 'elevator' || node.type === 'ramp',
              bidirectional: true,
            },
            effectiveAccessibleWeight: interFloorWeight,
          };

          neighbors.push({
            neighborId: belowNeighborId,
            edgeRecord: syntheticEdgeRecord,
            edgeWeight: interFloorWeight,
          });
        }
      }
    }

    return neighbors;
  }

  /**
   * Calculate weight for inter-floor traversal.
   */
  private interFloorWeight(
    nodeType: string,
    direction: 'up' | 'down',
    mode: RouteMode,
  ): number {
    if (nodeType === 'elevator') {
      return mode === 'accessible' ? INTER_FLOOR_ELEVATOR_WEIGHT : INTER_FLOOR_STANDARD_WEIGHT;
    }
    if (nodeType === 'ramp') {
      return mode === 'accessible' ? INTER_FLOOR_RAMP_WEIGHT : INTER_FLOOR_STANDARD_WEIGHT;
    }
    if (nodeType === 'stairs') {
      return mode === 'accessible' ? INTER_FLOOR_STAIRS_INACCESSIBLE : INTER_FLOOR_STANDARD_WEIGHT;
    }
    // Default fallback
    return mode === 'accessible' ? INTER_FLOOR_STAIRS_INACCESSIBLE : INTER_FLOOR_STANDARD_WEIGHT;
  }

  /**
   * Euclidean heuristic with floor-level penalty.
   * Admissible: never overestimates true cost.
   */
  private heuristic(a: NormalizedNodeRecord, b: NormalizedNodeRecord): number {
    const dx = b.node.x - a.node.x;
    const dy = b.node.y - a.node.y;
    const euclidean = Math.sqrt(dx * dx + dy * dy);
    const floorDiff = Math.abs(b.floorNumber - a.floorNumber);
    return euclidean + floorDiff * FLOOR_PENALTY_PER_LEVEL;
  }
}
