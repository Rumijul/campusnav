import { describe, expect, it, vi } from "vitest";
import {
  createInitialAppBootstrapState,
  resolveApiBaseUrl,
  runAppBootstrap,
  type AppBootstrapState,
} from "./appBootstrap";

describe("app bootstrap", () => {
  it("starts in idle phase", () => {
    expect(createInitialAppBootstrapState()).toEqual({ phase: "idle" });
  });

  it("classifies missing API base URL as config-missing", () => {
    const resolved = resolveApiBaseUrl({ envApiBaseUrl: "   " });

    expect(resolved.ok).toBe(false);

    if (resolved.ok) {
      throw new Error("Expected resolveApiBaseUrl to fail for empty config.");
    }

    expect(resolved.error.reason).toBe("config-missing");
    expect(resolved.error.message).toContain("EXPO_PUBLIC_API_BASE_URL");
  });

  it("emits loading then ready when config is valid", async () => {
    const initialize = vi.fn().mockResolvedValue(undefined);
    const transitions: AppBootstrapState[] = [];

    const finalState = await runAppBootstrap({
      envApiBaseUrl: "http://localhost:3000",
      initialize,
      onTransition: (state) => transitions.push(state),
    });

    expect(initialize).toHaveBeenCalledWith("http://localhost:3000");
    expect(transitions.map((state) => state.phase)).toEqual(["loading", "ready"]);
    expect(finalState).toEqual({
      phase: "ready",
      apiBaseUrl: "http://localhost:3000",
    });
  });

  it("emits loading then error when initialization fails", async () => {
    const transitions: AppBootstrapState[] = [];

    const finalState = await runAppBootstrap({
      envApiBaseUrl: "http://localhost:3000",
      initialize: async () => {
        throw new Error("Map contract handshake failed");
      },
      onTransition: (state) => transitions.push(state),
    });

    expect(transitions.map((state) => state.phase)).toEqual(["loading", "error"]);
    expect(finalState.phase).toBe("error");

    if (finalState.phase !== "error") {
      throw new Error("Expected final bootstrap state to be error");
    }

    expect(finalState.error?.reason).toBe("bootstrap-failed");
    expect(finalState.error?.message).toContain("Map contract handshake failed");
  });

  it("emits loading then error when API base URL is missing", async () => {
    const transitions: AppBootstrapState[] = [];

    const finalState = await runAppBootstrap({
      envApiBaseUrl: undefined,
      onTransition: (state) => transitions.push(state),
    });

    expect(transitions.map((state) => state.phase)).toEqual(["loading", "error"]);
    expect(finalState.phase).toBe("error");

    if (finalState.phase !== "error") {
      throw new Error("Expected missing config to produce an error state");
    }

    expect(finalState.error?.reason).toBe("config-missing");
  });
});
