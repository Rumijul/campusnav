export const STARTUP_TIMEOUT_MS = 3_000;

export type BootstrapPhase = 'idle' | 'loading' | 'ready' | 'error';
export const BootstrapPhase = undefined as unknown as BootstrapPhase;

export type BootstrapErrorReason =
  | 'missing-api-base-url'
  | 'invalid-api-base-url'
  | 'startup-timeout'
  | 'startup-tooling-error'
  | 'invalid-startup-config';
export const BootstrapErrorReason = undefined as unknown as BootstrapErrorReason;

export type BootstrapState =
  | {
      phase: 'idle';
      authRequired: false;
    }
  | {
      phase: 'loading';
      authRequired: false;
      attempt: number;
      startedAtMs: number;
    }
  | {
      phase: 'ready';
      authRequired: false;
      attempt: number;
      apiBaseUrl: string;
    }
  | {
      phase: 'error';
      authRequired: false;
      attempt: number;
      reason: BootstrapErrorReason;
      message: string;
      failedPhase: 'loading';
      recoverable: boolean;
    };
export const BootstrapState = undefined as unknown as BootstrapState;

export interface BootstrapResult {
  state: BootstrapState;
  transitions: BootstrapState[];
}

export interface BootstrapOptions {
  env?: Record<string, string | undefined>;
  attempt?: number;
  timeoutMs?: number;
  now?: () => number;
  toolingCheck?: () => Promise<unknown>;
}

interface ValidUrlResult {
  ok: true;
  normalizedUrl: string;
}

interface InvalidUrlResult {
  ok: false;
  reason: Extract<BootstrapErrorReason, 'missing-api-base-url' | 'invalid-api-base-url'>;
  message: string;
}

const DEFAULT_IDLE_STATE: BootstrapState = {
  phase: 'idle',
  authRequired: false,
};

export const IDLE_BOOTSTRAP_STATE = DEFAULT_IDLE_STATE;

export function createLoadingState(attempt: number, now: () => number): BootstrapState {
  return {
    phase: 'loading',
    authRequired: false,
    attempt,
    startedAtMs: now(),
  };
}

export function validateApiBaseUrl(rawValue: string | undefined): ValidUrlResult | InvalidUrlResult {
  const value = rawValue?.trim();

  if (!value) {
    return {
      ok: false,
      reason: 'missing-api-base-url',
      message: 'EXPO_PUBLIC_API_BASE_URL is missing.',
    };
  }

  try {
    const parsed = new URL(value);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        ok: false,
        reason: 'invalid-api-base-url',
        message: 'EXPO_PUBLIC_API_BASE_URL must use http or https.',
      };
    }

    parsed.hash = '';

    return {
      ok: true,
      normalizedUrl: parsed.toString().replace(/\/$/, ''),
    };
  } catch {
    return {
      ok: false,
      reason: 'invalid-api-base-url',
      message: 'EXPO_PUBLIC_API_BASE_URL must be a valid absolute URL.',
    };
  }
}

function toBootstrapError(
  reason: BootstrapErrorReason,
  message: string,
  attempt: number,
  recoverable = true,
): BootstrapState {
  return {
    phase: 'error',
    authRequired: false,
    attempt,
    reason,
    message,
    failedPhase: 'loading',
    recoverable,
  };
}

function isValidStartupToolingResult(result: unknown): result is { status: 'ok' } {
  return !!result && typeof result === 'object' && (result as { status?: string }).status === 'ok';
}

async function defaultToolingCheck(): Promise<{ status: 'ok' }> {
  return { status: 'ok' };
}

async function runWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

export async function runAppBootstrap(options: BootstrapOptions = {}): Promise<BootstrapResult> {
  const now = options.now ?? Date.now;
  const attempt = Math.max(1, options.attempt ?? 1);
  const timeoutMs = options.timeoutMs ?? STARTUP_TIMEOUT_MS;
  const toolingCheck = options.toolingCheck ?? defaultToolingCheck;
  const env = options.env ?? process.env;

  const loadingState = createLoadingState(attempt, now);
  const transitions: BootstrapState[] = [loadingState];

  try {
    const toolingResult = await runWithTimeout(
      toolingCheck(),
      timeoutMs,
      'Startup tooling check timed out.',
    );

    if (!isValidStartupToolingResult(toolingResult)) {
      const malformedConfigState = toBootstrapError(
        'invalid-startup-config',
        'Startup tooling returned an invalid configuration shape.',
        attempt,
        false,
      );
      transitions.push(malformedConfigState);
      return {
        state: malformedConfigState,
        transitions,
      };
    }
  } catch (error) {
    const reason: BootstrapErrorReason =
      error instanceof Error && error.message === 'Startup tooling check timed out.'
        ? 'startup-timeout'
        : 'startup-tooling-error';

    const toolingErrorState = toBootstrapError(
      reason,
      error instanceof Error ? error.message : 'Startup tooling check failed.',
      attempt,
      true,
    );
    transitions.push(toolingErrorState);

    return {
      state: toolingErrorState,
      transitions,
    };
  }

  const apiValidation = validateApiBaseUrl(
    // Use ?? so only undefined triggers the Android emulator fallback (http://10.0.2.2:3001).
    // Empty string, 'undefined' literal, and other non-http(s) values reach validateApiBaseUrl.
    env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:3001',
  );

  if (!apiValidation.ok) {
    const configErrorState = toBootstrapError(
      apiValidation.reason,
      apiValidation.message,
      attempt,
      false,
    );
    transitions.push(configErrorState);

    return {
      state: configErrorState,
      transitions,
    };
  }

  const readyState: BootstrapState = {
    phase: 'ready',
    authRequired: false,
    attempt,
    apiBaseUrl: apiValidation.normalizedUrl,
  };
  transitions.push(readyState);

  return {
    state: readyState,
    transitions,
  };
}
