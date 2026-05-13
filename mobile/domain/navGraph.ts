import { NavBuilding, NavEdge, NavFloor, NavGraph, NavNode } from '../../src/shared/types';
import {
  type NavGraphContractValidationError,
  validateNavGraphPayload,
} from './navGraphSchema';
import { PathResult, PathSegment, RouteMode } from '../../src/shared/pathfinding/types';

// Re-export pathfinding types so routing module can import everything from domain/navGraph
export { PathResult, PathSegment, RouteMode };

/**
 * Direction generation types — turn-by-turn step generation.
 *
 * Used by mobile/routing/generateDirections.ts to convert computed paths
 * into human-readable walking instructions.
 */

/**
 * Icon types for direction step visualization.
 * Maps to icons in the mobile UI icon set.
 */
export type StepIcon =
  | 'straight'
  | 'turn-left'
  | 'turn-right'
  | 'sharp-left'
  | 'sharp-right'
  | 'arrive'
  | 'accessible'
  | 'stairs-up'
  | 'stairs-down'
  | 'elevator'
  | 'ramp';
export const StepIcon = undefined as unknown as StepIcon;

/**
 * A single turn-by-turn direction instruction.
 */
export interface DirectionStep {
  /** Human-readable instruction, e.g. "Turn left at the cafeteria" */
  instruction: string;
  icon: StepIcon;
  /** Segment distance in normalized units (0–1 coordinate space) */
  distanceM: number;
  /** Estimated seconds for this segment */
  durationSec: number;
  /** True if this segment passes through a ramp or elevator node */
  isAccessibleSegment: boolean;
  /** Floor ID where this instruction is presented */
  floorId: number;
  /** Resolved floor number for display/grouping; falls back to floorId when metadata is missing */
  floorNumber: number;
}

/**
 * Complete result of direction generation.
 */
export interface DirectionsResult {
  steps: DirectionStep[];
  /** Sum of all segment distances in normalized units */
  totalDistanceNorm: number;
  /** Sum of all step durations in seconds */
  totalDurationSec: number;
}

/**
 * A section of directions on a single floor.
 * Used by mobile/routing/directionSections.ts for floor-grouped display.
 */
export interface DirectionSection {
  floorId: number;
  floorNumber: number;
  steps: DirectionStep[];
}

export interface NormalizedFloorRecord {
  buildingId: number;
  buildingName: string;
  floor: NavFloor;
}

export interface NormalizedNodeRecord {
  buildingId: number;
  buildingName: string;
  floorId: number;
  floorNumber: number;
  node: NavNode;
}

export interface NormalizedEdgeRecord {
  buildingId: number;
  floorId: number;
  edge: NavEdge;
  effectiveAccessibleWeight: number;
}

export interface NormalizedNavGraph {
  graph: NavGraph;
  buildingById: Map<number, NavBuilding>;
  floorById: Map<number, NormalizedFloorRecord>;
  floorByBuildingAndNumber: Map<string, NormalizedFloorRecord>;
  nodeById: Map<string, NormalizedNodeRecord>;
  edgeById: Map<string, NormalizedEdgeRecord>;
  outgoingEdgesByNodeId: Map<string, NormalizedEdgeRecord[]>;
}

export type NavGraphNormalizationErrorCode =
  | 'duplicate-building-id'
  | 'duplicate-floor-id'
  | 'duplicate-floor-number-per-building'
  | 'duplicate-node-id'
  | 'duplicate-edge-id'
  | 'node-floor-mismatch'
  | 'edge-node-missing';
export const NavGraphNormalizationErrorCode = undefined as unknown as NavGraphNormalizationErrorCode;

export interface NavGraphNormalizationError {
  reason: 'normalization-failure';
  code: NavGraphNormalizationErrorCode;
  message: string;
}

export type NavGraphNormalizationResult =
  | { ok: true; data: NormalizedNavGraph }
  | { ok: false; error: NavGraphNormalizationError };
export const NavGraphNormalizationResult = undefined as unknown as NavGraphNormalizationResult;

export type NavGraphParseAndNormalizeResult =
  | { ok: true; data: NormalizedNavGraph }
  | { ok: false; error: NavGraphContractValidationError | NavGraphNormalizationError };
export const NavGraphParseAndNormalizeResult = undefined as unknown as NavGraphParseAndNormalizeResult;

function fail(
  code: NavGraphNormalizationErrorCode,
  message: string,
): { ok: false; error: NavGraphNormalizationError } {
  return {
    ok: false,
    error: {
      reason: 'normalization-failure',
      code,
      message,
    },
  };
}

export function floorLookupKey(buildingId: number, floorNumber: number): string {
  return `${buildingId}:${floorNumber}`;
}

export function getEffectiveAccessibleWeight(edge: Pick<NavEdge, 'accessible' | 'accessibleWeight'>): number {
  return edge.accessible ? edge.accessibleWeight : Number.POSITIVE_INFINITY;
}

/**
 * Calculate the bearing (angle) from point A to point B in screen-space coordinates.
 * 0° = north (positive y), 90° = east (positive x), 180° = south, 270° = west.
 * Returns value normalized to [0, 360).
 */
export function bearing(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;

  // Handle same-point case (division by zero)
  if (dx === 0 && dy === 0) {
    return 0;
  }

  // In screen-space: north = positive y, east = positive x.
  // atan2(y, x) gives angle from east axis (standard math convention).
  // Since east is +90° from north in our system, we rotate by +270° (same as -90°).
  // Use -dx instead of dx because screen x-axis points opposite to math x-axis.
  // Formula: atan2(dy, -dx) * (180/π) + 270, normalized to [0, 360).
  let angle = Math.atan2(dy, -dx) * (180 / Math.PI) + 270;

  // Normalize to [0, 360)
  if (angle < 0) {
    angle += 360;
  }
  angle = angle % 360;

  return angle;
}

/**
 * Normalize an angular delta to the range [-180, 180].
 * Used for calculating the shortest turn direction.
 */
export function normalizeDelta(delta: number): number {
  let result = delta % 360;
  if (result > 180) {
    result -= 360;
  } else if (result < -180) {
    result += 360;
  }
  return result;
}

export function normalizeNavGraph(graph: NavGraph): NavGraphNormalizationResult {
  const buildingById = new Map<number, NavBuilding>();
  const floorById = new Map<number, NormalizedFloorRecord>();
  const floorByBuildingAndNumber = new Map<string, NormalizedFloorRecord>();
  const nodeById = new Map<string, NormalizedNodeRecord>();
  const edgeById = new Map<string, NormalizedEdgeRecord>();
  const outgoingEdgesByNodeId = new Map<string, NormalizedEdgeRecord[]>();

  for (const building of graph.buildings) {
    if (buildingById.has(building.id)) {
      return fail('duplicate-building-id', `Duplicate building id detected: ${building.id}.`);
    }

    buildingById.set(building.id, building);

    for (const floor of building.floors) {
      if (floorById.has(floor.id)) {
        return fail('duplicate-floor-id', `Duplicate floor id detected: ${floor.id}.`);
      }

      const floorKey = floorLookupKey(building.id, floor.floorNumber);
      if (floorByBuildingAndNumber.has(floorKey)) {
        return fail(
          'duplicate-floor-number-per-building',
          `Duplicate floor number ${floor.floorNumber} for building ${building.id}.`,
        );
      }

      const floorRecord: NormalizedFloorRecord = {
        buildingId: building.id,
        buildingName: building.name,
        floor,
      };

      floorById.set(floor.id, floorRecord);
      floorByBuildingAndNumber.set(floorKey, floorRecord);

      for (const node of floor.nodes) {
        if (node.floorId !== floor.id) {
          return fail(
            'node-floor-mismatch',
            `Node ${node.id} reports floorId=${node.floorId}, expected ${floor.id}.`,
          );
        }

        if (nodeById.has(node.id)) {
          return fail('duplicate-node-id', `Duplicate node id detected: ${node.id}.`);
        }

        nodeById.set(node.id, {
          buildingId: building.id,
          buildingName: building.name,
          floorId: floor.id,
          floorNumber: floor.floorNumber,
          node,
        });
      }

      for (const edge of floor.edges) {
        if (edgeById.has(edge.id)) {
          return fail('duplicate-edge-id', `Duplicate edge id detected: ${edge.id}.`);
        }

        const edgeRecord: NormalizedEdgeRecord = {
          buildingId: building.id,
          floorId: floor.id,
          edge,
          effectiveAccessibleWeight: getEffectiveAccessibleWeight(edge),
        };

        edgeById.set(edge.id, edgeRecord);
      }
    }
  }

  for (const edgeRecord of edgeById.values()) {
    const source = nodeById.get(edgeRecord.edge.sourceId);
    const target = nodeById.get(edgeRecord.edge.targetId);

    if (!source || !target) {
      return fail(
        'edge-node-missing',
        `Edge ${edgeRecord.edge.id} references missing node(s): ${edgeRecord.edge.sourceId} -> ${edgeRecord.edge.targetId}.`,
      );
    }

    const currentOutgoing = outgoingEdgesByNodeId.get(source.node.id) ?? [];
    currentOutgoing.push(edgeRecord);
    outgoingEdgesByNodeId.set(source.node.id, currentOutgoing);
  }

  return {
    ok: true,
    data: {
      graph,
      buildingById,
      floorById,
      floorByBuildingAndNumber,
      nodeById,
      edgeById,
      outgoingEdgesByNodeId,
    },
  };
}

export function parseAndNormalizeNavGraph(payload: unknown): NavGraphParseAndNormalizeResult {
  const validated = validateNavGraphPayload(payload);
  if (!validated.ok) {
    return validated;
  }

  return normalizeNavGraph(validated.data);
}
