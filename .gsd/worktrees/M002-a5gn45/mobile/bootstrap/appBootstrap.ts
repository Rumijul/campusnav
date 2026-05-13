export type BootstrapPhase = "idle" | "loading" | "ready" | "error";

export type AppBootstrapErrorReason = "config-missing" | "bootstrap-failed";

export interface AppBootstrapError {
  reason: AppBootstrapErrorReason;
  message: string;
}

export interface AppBootstrapState {
  phase: BootstrapPhase;
  apiBaseUrl?: string;
  error?: AppBootstrapError;
}

export interface AppBootstrapConfig {
  envApiBaseUrl?: string;
}

export interface BootstrapDependencies extends AppBootstrapConfig {
  initialize?: (apiBaseUrl: string) => Promise<void>;
  onTransition?: (state: AppBootstrapState) => void;
}

export function createInitialAppBootstrapState(): AppBootstrapState {
  return { phase: "idle" };
}

export function resolveApiBaseUrl(config: AppBootstrapConfig):
  | { ok: true; apiBaseUrl: string }
  | { ok: false; error: AppBootstrapError } {
  const value = config.envApiBaseUrl?.trim();

  if (!value) {
    return {
      ok: false,
      error: {
        reason: "config-missing",
        message:
          "Missing EXPO_PUBLIC_API_BASE_URL. Add it to mobile/.env and restart Expo.",
      },
    };
  }

  return { ok: true, apiBaseUrl: value };
}

export async function runAppBootstrap(
  dependencies: BootstrapDependencies,
): Promise<AppBootstrapState> {
  const emit = (state: AppBootstrapState) => {
    dependencies.onTransition?.(state);
    return state;
  };

  emit({ phase: "loading" });

  const configResult = resolveApiBaseUrl({
    envApiBaseUrl: dependencies.envApiBaseUrl,
  });

  if (!configResult.ok) {
    return emit({
      phase: "error",
      error: configResult.error,
    });
  }

  try {
    await dependencies.initialize?.(configResult.apiBaseUrl);

    return emit({
      phase: "ready",
      apiBaseUrl: configResult.apiBaseUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected bootstrap failure.";

    return emit({
      phase: "error",
      error: {
        reason: "bootstrap-failed",
        message,
      },
    });
  }
}
