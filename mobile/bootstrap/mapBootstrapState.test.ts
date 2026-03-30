import { NavGraph } from '../../src/shared/types';
import { describe, expect, it, vi } from 'vitest';
import { MapApiClient, MapApiResult, MapImageContract } from '../data/mapApiClient';
import { runMapBootstrap } from './mapBootstrapState';

const BASE_URL = 'https://campusnav.example.com';

function createGraphFixture(): NavGraph {
  return {
    buildings: [
      {
        id: 7,
        name: 'Engineering',
        floors: [
          {
            id: 701,
            floorNumber: 1,
            imagePath: 'floor-plan-7-1.png',
            updatedAt: '2026-01-01T00:00:00.000Z',
            nodes: [
              {
                id: 'entrance-1',
                x: 0.1,
                y: 0.2,
                label: 'Main Entrance',
                type: 'entrance',
                searchable: true,
                floorId: 701,
              },
            ],
            edges: [],
          },
        ],
      },
    ],
  };
}

function mapOkResult(data: NavGraph): MapApiResult<NavGraph> {
  return {
    ok: true,
    endpoint: `${BASE_URL}/api/map`,
    status: 200,
    attempt: 1,
    data,
  };
}

function imageOkResult(): MapApiResult<MapImageContract> {
  return {
    ok: true,
    endpoint: `${BASE_URL}/api/floor-plan/7/1`,
    status: 200,
    attempt: 1,
    data: {
      endpoint: `${BASE_URL}/api/floor-plan/7/1`,
      contentType: 'image/png',
      cacheControl: 'public, max-age=60',
    },
  };
}

function createClient(overrides?: {
  mapResult?: MapApiResult<NavGraph>;
  imageResult?: MapApiResult<MapImageContract>;
}): MapApiClient {
  const mapResult = overrides?.mapResult ?? mapOkResult(createGraphFixture());
  const imageResult = overrides?.imageResult ?? imageOkResult();

  return {
    fetchMapGraph: vi.fn().mockResolvedValue(mapResult),
    fetchFloorPlanImageContract: vi.fn().mockResolvedValue(imageResult),
    fetchCampusImageContract: vi.fn().mockResolvedValue(imageResult),
    resolveMapUrl: () => `${BASE_URL}/api/map`,
    resolveFloorPlanImageUrl: (target) => `${BASE_URL}/api/floor-plan/${target.buildingId}/${target.floorNumber}`,
    resolveCampusImageUrl: () => `${BASE_URL}/api/campus/image`,
  };
}

describe('runMapBootstrap', () => {
  it('transitions loading(map) -> loading(image) -> ready for live graph + image contracts', async () => {
    const client = createClient();

    const result = await runMapBootstrap({
      env: { EXPO_PUBLIC_API_BASE_URL: BASE_URL },
      clientFactory: () => client,
      attempt: 1,
      now: () => 100,
    });

    expect(result.transitions.map((state) => state.phase)).toEqual(['loading', 'loading', 'ready']);
    expect(result.state.phase).toBe('ready');

    if (result.state.phase !== 'ready') {
      throw new Error('Expected ready bootstrap state.');
    }

    expect(result.state.imageTarget).toEqual({ buildingId: 7, floorNumber: 1 });
    expect(result.state.graph.graph.buildings[0]?.name).toBe('Engineering');
    expect(result.state.authRequired).toBe(false);
    expect(client.fetchMapGraph).toHaveBeenCalledTimes(1);
    expect(client.fetchFloorPlanImageContract).toHaveBeenCalledTimes(1);
  });

  it('transitions to map-phase error with endpoint diagnostics when map fetch fails', async () => {
    const client = createClient({
      mapResult: {
        ok: false,
        error: {
          endpoint: `${BASE_URL}/api/map`,
          status: 500,
          reason: 'http-error',
          attempt: 1,
          message: 'Request failed with HTTP 500.',
        },
      },
    });

    const result = await runMapBootstrap({
      env: { EXPO_PUBLIC_API_BASE_URL: BASE_URL },
      clientFactory: () => client,
    });

    expect(result.state.phase).toBe('error');

    if (result.state.phase !== 'error') {
      throw new Error('Expected map-phase bootstrap error.');
    }

    expect(result.state.failedPhase).toBe('map');
    expect(result.state.endpoint).toBe(`${BASE_URL}/api/map`);
    expect(result.state.reason).toBe('http-error');
  });

  it('transitions to image-phase error with timeout diagnostics when image contract fetch fails', async () => {
    const client = createClient({
      imageResult: {
        ok: false,
        error: {
          endpoint: `${BASE_URL}/api/floor-plan/7/1`,
          status: null,
          reason: 'timeout',
          attempt: 2,
          message: 'Request timed out after 2000ms.',
        },
      },
    });

    const result = await runMapBootstrap({
      env: { EXPO_PUBLIC_API_BASE_URL: BASE_URL },
      clientFactory: () => client,
    });

    expect(result.state.phase).toBe('error');

    if (result.state.phase !== 'error') {
      throw new Error('Expected image-phase bootstrap error.');
    }

    expect(result.state.failedPhase).toBe('image');
    expect(result.state.reason).toBe('timeout');
    expect(result.state.endpoint).toContain('/api/floor-plan/7/1');
  });

  it('treats malformed map contracts as unrecoverable bootstrap errors', async () => {
    const client = createClient({
      mapResult: {
        ok: false,
        error: {
          endpoint: `${BASE_URL}/api/map`,
          status: 200,
          reason: 'contract-validation-error',
          attempt: 1,
          message: 'Map payload failed contract validation.',
          details: ['buildings: Required'],
        },
      },
    });

    const result = await runMapBootstrap({
      env: { EXPO_PUBLIC_API_BASE_URL: BASE_URL },
      clientFactory: () => client,
      attempt: 1,
    });

    expect(result.state.phase).toBe('error');

    if (result.state.phase !== 'error') {
      throw new Error('Expected malformed-contract bootstrap error.');
    }

    expect(result.state.failedPhase).toBe('map');
    expect(result.state.reason).toBe('contract-validation-error');
    expect(result.state.recoverable).toBe(false);
  });

  it('supports idempotent restart from error to loading/ready with incremented attempts', async () => {
    const failingClient = createClient({
      mapResult: {
        ok: false,
        error: {
          endpoint: `${BASE_URL}/api/map`,
          status: null,
          reason: 'network-error',
          attempt: 1,
          message: 'Network request failed.',
        },
      },
    });

    const failed = await runMapBootstrap({
      env: { EXPO_PUBLIC_API_BASE_URL: BASE_URL },
      clientFactory: () => failingClient,
      attempt: 1,
      now: () => 1,
    });

    expect(failed.state.phase).toBe('error');

    const healthyClient = createClient();
    const recovered = await runMapBootstrap({
      env: { EXPO_PUBLIC_API_BASE_URL: BASE_URL },
      clientFactory: () => healthyClient,
      attempt: 2,
      now: () => 2,
    });

    expect(recovered.transitions[0]).toMatchObject({
      phase: 'loading',
      currentPhase: 'map',
      attempt: 2,
    });
    expect(recovered.state.phase).toBe('ready');

    if (recovered.state.phase !== 'ready') {
      throw new Error('Expected restart attempt to reach ready state.');
    }

    expect(recovered.state.attempt).toBe(2);
    expect(recovered.state.authRequired).toBe(false);
  });
});
