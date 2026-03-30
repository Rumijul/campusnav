/**
 * In-memory location search over a NormalizedNavGraph.
 * Case-insensitive prefix match on label, roomNumber, description, buildingName.
 * Results grouped by building → floor, sorted alphabetically/numerically.
 */

import { useMemo } from 'react';
import type { NormalizedNavGraph } from '../domain/navGraph';
import type { NavNodeType } from '../../src/shared/types';

export interface SearchNode {
  node: import('../../src/shared/types').NavNode;
  buildingId: number;
  buildingName: string;
  floorId: number;
  floorNumber: number;
}
export interface SearchFloor { floorId: number; floorNumber: number; nodes: SearchNode[]; }
export interface SearchBuilding { buildingId: number; buildingName: string; floors: SearchFloor[]; }
export interface UseLocationSearchResult { buildings: SearchBuilding[]; totalMatches: number; }

function isPrefixMatch(query: string, target: string): boolean {
  return query.length === 0 || target.toLowerCase().startsWith(query.toLowerCase());
}

export function useLocationSearch(
  graph: NormalizedNavGraph,
  query: string,
  typeFilter?: Set<NavNodeType>,
): UseLocationSearchResult {
  return useMemo(() => {
    const trimmed = query.trim();
    const buildings: SearchBuilding[] = [];
    let totalMatches = 0;

    for (const building of graph.graph.buildings) {
      const matchedFloors: SearchFloor[] = [];

      for (const floor of building.floors) {
        const floorRec = graph.floorById.get(floor.id);
        const floorNumber = floorRec?.floor.floorNumber ?? floor.floorNumber;
        const matchedNodes: SearchNode[] = [];

        for (const node of floor.nodes) {
          if (!node.searchable) continue;
          if (typeFilter && !typeFilter.has(node.type)) continue;
          if (trimmed.length > 0) {
            const labelOk = isPrefixMatch(trimmed, node.label);
            const roomOk = node.roomNumber && isPrefixMatch(trimmed, node.roomNumber);
            const descOk = node.description && isPrefixMatch(trimmed, node.description);
            const bldOk = isPrefixMatch(trimmed, building.name);
            if (!labelOk && !roomOk && !descOk && !bldOk) continue;
          }
          matchedNodes.push({ node, buildingId: building.id, buildingName: building.name, floorId: floor.id, floorNumber });
        }

        if (matchedNodes.length > 0) {
          matchedNodes.sort((a, b) => a.node.label.localeCompare(b.node.label));
          matchedFloors.push({ floorId: floor.id, floorNumber, nodes: matchedNodes });
          totalMatches += matchedNodes.length;
        }
      }

      if (matchedFloors.length > 0) {
        matchedFloors.sort((a, b) => a.floorNumber - b.floorNumber);
        buildings.push({ buildingId: building.id, buildingName: building.name, floors: matchedFloors });
      }
    }

    buildings.sort((a, b) => a.buildingName.localeCompare(b.buildingName));
    return { buildings, totalMatches };
  }, [graph, query, typeFilter]);
}
