import type { NavGraph } from '../../src/shared/types';
import { describe, expect, it } from 'vitest';
import {
  floorLookupKey,
  getEffectiveAccessibleWeight,
  normalizeNavGraph,
  parseAndNormalizeNavGraph,
} from './navGraph';
import { validateNavGraphPayload } from './navGraphSchema';

function createValidGraph(): NavGraph {
  return {
    buildings: [
      {
        id: 1,
        name: 'Engineering',
        floors: [
          {
            id: 11,
            floorNumber: 1,
            imagePath: 'engineering-floor-1.png',
            updatedAt: '2026-01-01T00:00:00.000Z',
            nodes: [
              {
                id: 'entrance-1',
                x: 0.1,
                y: 0.2,
                label: 'Main Entrance',
                type: 'entrance',
                searchable: true,
                floorId: 11,
              },
              {
                id: 'stairs-1',
                x: 0.5,
                y: 0.4,
                label: 'Stairs',
                type: 'stairs',
                searchable: false,
                floorId: 11,
                connectsToFloorAboveId: 12,
                connectsToNodeAboveId: 'stairs-2',
              },
            ],
            edges: [
              {
                id: 'edge-1',
                sourceId: 'entrance-1',
                targetId: 'stairs-1',
                standardWeight: 0.3,
                accessibleWeight: 10000000000,
                accessible: false,
                bidirectional: true,
              },
            ],
          },
          {
            id: 12,
            floorNumber: 2,
            imagePath: 'engineering-floor-2.png',
            updatedAt: '2026-01-01T00:00:00.000Z',
            gpsBounds: {
              minLat: 10,
              maxLat: 11,
              minLng: 20,
              maxLng: 21,
            },
            nodes: [
              {
                id: 'stairs-2',
                x: 0.5,
                y: 0.4,
                label: 'Stairs (Floor 2)',
                type: 'stairs',
                searchable: false,
                floorId: 12,
                connectsToFloorBelowId: 11,
                connectsToNodeBelowId: 'stairs-1',
              },
            ],
            edges: [],
          },
        ],
      },
    ],
  };
}

describe('navGraphSchema + navGraph normalization', () => {
  it('validates and normalizes graph payloads into lookup maps', () => {
    const graph = createValidGraph();
    const parsed = validateNavGraphPayload(graph);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      throw new Error('Expected graph payload to pass contract validation.');
    }

    const normalized = normalizeNavGraph(parsed.data);

    expect(normalized.ok).toBe(true);
    if (!normalized.ok) {
      throw new Error(`Expected normalization success. Received: ${normalized.error.message}`);
    }

    expect(normalized.data.buildingById.get(1)?.name).toBe('Engineering');
    expect(normalized.data.floorById.get(12)?.floor.gpsBounds?.maxLng).toBe(21);
    expect(normalized.data.floorByBuildingAndNumber.get(floorLookupKey(1, 2))?.floor.id).toBe(12);
    expect(normalized.data.nodeById.get('stairs-2')?.floorNumber).toBe(2);
    expect(normalized.data.outgoingEdgesByNodeId.get('entrance-1')?.length).toBe(1);
  });

  it('preserves optional connector omission for non-connector nodes', () => {
    const normalized = parseAndNormalizeNavGraph(createValidGraph());

    expect(normalized.ok).toBe(true);
    if (!normalized.ok) {
      throw new Error(`Expected parse+normalize success. Received: ${normalized.error.message}`);
    }

    const entrance = normalized.data.nodeById.get('entrance-1')?.node;
    expect(entrance).toBeDefined();
    expect(Object.prototype.hasOwnProperty.call(entrance, 'connectsToFloorAboveId')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(entrance, 'connectsToNodeAboveId')).toBe(false);
  });

  it('preserves non-accessible edge semantics via effective accessible weight', () => {
    const normalized = parseAndNormalizeNavGraph(createValidGraph());

    expect(normalized.ok).toBe(true);
    if (!normalized.ok) {
      throw new Error(`Expected parse+normalize success. Received: ${normalized.error.message}`);
    }

    const edgeRecord = normalized.data.edgeById.get('edge-1');
    expect(edgeRecord).toBeDefined();
    expect(edgeRecord?.edge.accessibleWeight).toBe(10000000000);
    expect(edgeRecord?.effectiveAccessibleWeight).toBe(Number.POSITIVE_INFINITY);
    expect(getEffectiveAccessibleWeight(edgeRecord!.edge)).toBe(Number.POSITIVE_INFINITY);
  });

  it('accepts empty building lists as a valid boundary case', () => {
    const parsed = validateNavGraphPayload({ buildings: [] });
    expect(parsed.ok).toBe(true);

    if (!parsed.ok) {
      throw new Error('Expected empty building list to validate.');
    }

    const normalized = normalizeNavGraph(parsed.data);
    expect(normalized.ok).toBe(true);

    if (!normalized.ok) {
      throw new Error('Expected empty graph to normalize.');
    }

    expect(normalized.data.buildingById.size).toBe(0);
    expect(normalized.data.nodeById.size).toBe(0);
  });

  it('reports malformed payloads with contract-validation-error details', () => {
    const malformedPayload = {
      buildings: [
        {
          id: 1,
          name: 'Engineering',
          floors: [
            {
              id: 11,
              floorNumber: 'one',
              imagePath: 'engineering-floor-1.png',
              updatedAt: '2026-01-01T00:00:00.000Z',
              nodes: [
                {
                  id: 'room-101',
                  x: '0.3',
                  y: 0.4,
                  label: 'Room 101',
                  type: 'room',
                  searchable: true,
                  floorId: 11,
                },
              ],
              edges: [],
            },
          ],
        },
      ],
    };

    const result = validateNavGraphPayload(malformedPayload);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected malformed payload validation failure.');
    }

    expect(result.error.reason).toBe('contract-validation-error');
    expect(result.error.issues.some((issue) => issue.includes('floorNumber'))).toBe(true);
    expect(result.error.issues.some((issue) => issue.includes('x'))).toBe(true);
  });

  it('fails normalization when duplicate node ids are present', () => {
    const duplicateNodeGraph = createValidGraph();
    duplicateNodeGraph.buildings[0]!.floors[1]!.nodes.push({
      id: 'entrance-1',
      x: 0.8,
      y: 0.8,
      label: 'Duplicate',
      type: 'junction',
      searchable: false,
      floorId: 12,
    });

    const result = parseAndNormalizeNavGraph(duplicateNodeGraph);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected duplicate-node-id failure.');
    }

    expect(result.error.reason).toBe('normalization-failure');
    if (result.error.reason !== 'normalization-failure') {
      throw new Error('Expected normalization failure error type.');
    }

    expect(result.error.code).toBe('duplicate-node-id');
  });

  it('fails normalization when an edge references a missing node', () => {
    const brokenGraph = createValidGraph();
    brokenGraph.buildings[0]!.floors[0]!.edges.push({
      id: 'edge-missing-node',
      sourceId: 'does-not-exist',
      targetId: 'stairs-1',
      standardWeight: 1,
      accessibleWeight: 1,
      accessible: true,
      bidirectional: false,
    });

    const result = parseAndNormalizeNavGraph(brokenGraph);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected edge-node-missing failure.');
    }

    expect(result.error.reason).toBe('normalization-failure');
    if (result.error.reason !== 'normalization-failure') {
      throw new Error('Expected normalization failure error type.');
    }

    expect(result.error.code).toBe('edge-node-missing');
  });

  it('rejects payloads missing buildings', () => {
    const result = validateNavGraphPayload({});

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected missing-buildings validation failure.');
    }

    expect(result.error.reason).toBe('contract-validation-error');
    expect(result.error.issues.some((issue) => issue.includes('buildings'))).toBe(true);
  });
});
