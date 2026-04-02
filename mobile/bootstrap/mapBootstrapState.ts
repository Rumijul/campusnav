import { NavFloor } from '../../src/shared/types';
import { NormalizedNavGraph } from '../domain/navGraph';
import { normalizeNavGraph } from '../domain/navGraph';
import {
  type FloorPlanTarget,
  type MapApiClient,
  type MapApiErrorReason,
  type MapApiResult,
  type MapImageContract,
  createMapApiClient,
} from '../data/mapApiClient';
import { validateApiBaseUrl } from './appBootstrap';

export type MapBootstrapFetchPhase = 'map' | 'image';
export type MapBootstrapErrorReason =
  | 'missing-api-base-url'
  | 'invalid-api-base-url'
  | MapApiErrorReason
  | 'normalization-failure'
  | 'empty-graph';
export type MapBootstrapState =
  | {
      phase: 'idle';
      authRequired: false;
    }
  | {
      phase: 'loading';
      authRequired: false;
      attempt: number;
      startedAtMs: number;
      currentPhase: MapBootstrapFetchPhase;
      endpoint: string;
    }
  | {
      phase: 'ready';
      authRequired: false;
      attempt: number;
      apiBaseUrl: string;
      graph: NormalizedNavGraph;
      image: MapImageContract | null;
      imageTarget: FloorPlanTarget;
    }
  | {
      phase: 'error';
      authRequired: false;
      attempt: number;
      reason: MapBootstrapErrorReason;
      message: string;
      failedPhase: 'config' | MapBootstrapFetchPhase;
      endpoint: string | null;
      recoverable: boolean;
      details?: string[];
    };
export interface MapBootstrapResult {
  state: MapBootstrapState;
  transitions: MapBootstrapState[];
}

export interface MapBootstrapOptions {
  env?: Record<string, string | undefined>;
  envUrl?: string;
  attempt?: number;
  now?: () => number;
  clientFactory?: (baseUrl: string) => MapApiClient;
}

const IDLE_STATE: MapBootstrapState = {
  phase: 'idle',
  authRequired: false,
};

export const IDLE_MAP_BOOTSTRAP_STATE = IDLE_STATE;

function loadingState(
  currentPhase: MapBootstrapFetchPhase,
  endpoint: string,
  attempt: number,
  now: () => number,
): MapBootstrapState {
  return {
    phase: 'loading',
    authRequired: false,
    attempt,
    startedAtMs: now(),
    currentPhase,
    endpoint,
  };
}

function toConfigError(reason: 'missing-api-base-url' | 'invalid-api-base-url', message: string, attempt: number): MapBootstrapState {
  return {
    phase: 'error',
    authRequired: false,
    attempt,
    reason,
    message,
    failedPhase: 'config',
    endpoint: null,
    recoverable: false,
  };
}

function toMapApiError(
  failedPhase: MapBootstrapFetchPhase,
  attempt: number,
  result: Extract<MapApiResult<unknown>, { ok: false }>,
): MapBootstrapState {
  const isRecoverable = result.error.reason !== 'contract-validation-error';

  return {
    phase: 'error',
    authRequired: false,
    attempt,
    reason: result.error.reason,
    message: result.error.message,
    failedPhase,
    endpoint: result.error.endpoint,
    recoverable: isRecoverable,
    ...(result.error.details ? { details: result.error.details } : {}),
  };
}

function toNormalizationError(
  attempt: number,
  endpoint: string,
  message: string,
  details?: string[],
): MapBootstrapState {
  return {
    phase: 'error',
    authRequired: false,
    attempt,
    reason: 'normalization-failure',
    message,
    failedPhase: 'map',
    endpoint,
    recoverable: false,
    ...(details && details.length > 0 ? { details } : {}),
  };
}

function toEmptyGraphError(attempt: number, endpoint: string): MapBootstrapState {
  return {
    phase: 'error',
    authRequired: false,
    attempt,
    reason: 'empty-graph',
    message: 'Map payload contained no floors to bootstrap.',
    failedPhase: 'map',
    endpoint,
    recoverable: false,
  };
}

function pickInitialFloor(graph: NormalizedNavGraph): FloorPlanTarget | null {
  for (const building of graph.graph.buildings) {
    const floor = pickFirstFloor(building.floors);
    if (!floor) {
      continue;
    }

    return {
      buildingId: building.id,
      floorNumber: floor.floorNumber,
    };
  }

  return null;
}

function pickFirstFloor(floors: NavFloor[]): NavFloor | null {
  if (floors.length === 0) {
    return null;
  }

  const sortedFloors = [...floors].sort((a, b) => a.floorNumber - b.floorNumber);
  return sortedFloors[0] ?? null;
}

export async function runMapBootstrap(options: MapBootstrapOptions = {}): Promise<MapBootstrapResult> {
  const attempt = Math.max(1, options.attempt ?? 1);
  const env = options.env ?? process.env;
  const now = options.now ?? Date.now;

  // Read env var directly in this scope where Metro has inlined it
  // options.envUrl takes precedence (passed from App.tsx where it was read correctly)
  const envUrl = options.envUrl ?? (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_BASE_URL : undefined);

  const apiBase = validateApiBaseUrl(
    envUrl && envUrl !== 'undefined'
      ? envUrl
      : 'http://10.0.2.2:8080',
  );
  if (!apiBase.ok) {
    const configError = toConfigError(apiBase.reason, apiBase.message, attempt);
    return {
      state: configError,
      transitions: [configError],
    };
  }

  const client = options.clientFactory
    ? options.clientFactory(apiBase.normalizedUrl)
    : createMapApiClient({ baseUrl: apiBase.normalizedUrl });

  const transitions: MapBootstrapState[] = [];

  const mapLoading = loadingState('map', client.resolveMapUrl(), attempt, now);
  transitions.push(mapLoading);

  const mapResult = await client.fetchMapGraph();
  if (!mapResult.ok) {
    const mapError = toMapApiError('map', attempt, mapResult);
    transitions.push(mapError);
    return {
      state: mapError,
      transitions,
    };
  }

  const normalized = normalizeNavGraph(mapResult.data);
  if (!normalized.ok) {
    const normalizationError = toNormalizationError(
      attempt,
      mapResult.endpoint,
      normalized.error.message,
      [normalized.error.code],
    );
    transitions.push(normalizationError);
    return {
      state: normalizationError,
      transitions,
    };
  }

  const imageTarget = pickInitialFloor(normalized.data);
  if (!imageTarget) {
    const emptyGraphError = toEmptyGraphError(attempt, mapResult.endpoint);
    transitions.push(emptyGraphError);
    return {
      state: emptyGraphError,
      transitions,
    };
  }

  const imageLoading = loadingState(
    'image',
    client.resolveFloorPlanImageUrl(imageTarget),
    attempt,
    now,
  );
  transitions.push(imageLoading);

  const imageResult = await client.fetchFloorPlanImageContract(imageTarget);

  let floorPlanImage: MapImageContract | null = null;
  if (imageResult.ok) {
    floorPlanImage = imageResult.data ?? null;
  } else if (imageResult.error.reason === 'http-error' && imageResult.error.status === 404) {
    // Floor plan image not yet uploaded — skip gracefully, user sees empty floor plan
    console.warn('[mapBootstrap] Floor plan image not found, continuing without it');
  } else {
    const imageError = toMapApiError('image', attempt, imageResult);
    transitions.push(imageError);
    return {
      state: imageError,
      transitions,
    };
  }

  const readyState: MapBootstrapState = {
    phase: 'ready',
    authRequired: false,
    attempt,
    apiBaseUrl: apiBase.normalizedUrl,
    graph: normalized.data,
    image: floorPlanImage,
    imageTarget,
  };

  transitions.push(readyState);

  return {
    state: readyState,
    transitions,
  };
}
