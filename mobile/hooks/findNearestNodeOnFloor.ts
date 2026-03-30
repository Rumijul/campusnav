import { NormalizedNavGraph } from '../domain/navGraph';

/**
 * Find the nearest node on a given floor to a reference position.
 * Used when floor changes to snap user to nearest accessible node.
 */
export function findNearestNodeOnFloor(
  graph: NormalizedNavGraph,
  floorId: number,
  fromPosition: { x: number; y: number },
): string | null {
  let nearestId: string | null = null;
  let nearestDist = Infinity;

  for (const [nodeId, record] of graph.nodeById) {
    if (record.floorId !== floorId) continue;
    const dx = record.node.x - fromPosition.x;
    const dy = record.node.y - fromPosition.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestId = nodeId;
    }
  }

  return nearestId;
}
