import { describe, it, expect, vi } from 'vitest';
import {
  STARTUP_TIMEOUT_MS,
  validateApiBaseUrl,
  runAppBootstrap,
} from './appBootstrap';

describe('runAppBootstrap', () => {
  it('transitions from loading to ready when EXPO_PUBLIC_API_BASE_URL is valid', async () => {
    const result = await runAppBootstrap({
      env: {
        EXPO_PUBLIC_API_BASE_URL: 'https://campusnav.example.com/',
      },
      toolingCheck: async () => ({ status: 'ok' }),
    });

    expect(result.transitions.map((state) => state.phase)).toEqual(['loading', 'ready']);
    expect(result.state.phase).toBe('ready');

    if (result.state.phase !== 'ready') {
      throw new Error('Expected ready bootstrap state.');
    }

    expect(result.state.apiBaseUrl).toBe('https://campusnav.example.com');
    expect(result.state.authRequired).toBe(false);
  });

  it('transitions to error when EXPO_PUBLIC_API_BASE_URL is missing', async () => {
    const result = await runAppBootstrap({
      env: {},
      toolingCheck: async () => ({ status: 'ok' }),
    });

    expect(result.transitions.map((state) => state.phase)).toEqual(['loading', 'error']);
    expect(result.state.phase).toBe('error');

    if (result.state.phase !== 'error') {
      throw new Error('Expected error bootstrap state.');
    }

    expect(result.state.reason).toBe('missing-api-base-url');
    expect(result.state.failedPhase).toBe('loading');
    expect(result.state.authRequired).toBe(false);
  });

  it('transitions to error when EXPO_PUBLIC_API_BASE_URL is malformed', async () => {
    const result = await runAppBootstrap({
      env: {
        EXPO_PUBLIC_API_BASE_URL: 'not-a-url',
      },
      toolingCheck: async () => ({ status: 'ok' }),
    });

    expect(result.state.phase).toBe('error');

    if (result.state.phase !== 'error') {
      throw new Error('Expected error bootstrap state.');
    }

    expect(result.state.reason).toBe('invalid-api-base-url');
    expect(result.state.authRequired).toBe(false);
  });

  it('transitions to error on startup timeout with bounded wait', async () => {
    const result = await runAppBootstrap({
      env: {
        EXPO_PUBLIC_API_BASE_URL: 'https://campusnav.example.com',
      },
      timeoutMs: 15,
      toolingCheck: () => new Promise((resolve) => setTimeout(() => resolve({ status: 'ok' }), 30)),
    });

    expect(result.state.phase).toBe('error');

    if (result.state.phase !== 'error') {
      throw new Error('Expected error bootstrap state.');
    }

    expect(result.state.reason).toBe('startup-timeout');
    expect(result.state.message).toContain('timed out');
  });

  it('transitions to error when startup tooling returns malformed config shape', async () => {
    const result = await runAppBootstrap({
      env: {
        EXPO_PUBLIC_API_BASE_URL: 'https://campusnav.example.com',
      },
      toolingCheck: async () => ({ ok: true }),
    });

    expect(result.state.phase).toBe('error');

    if (result.state.phase !== 'error') {
      throw new Error('Expected error bootstrap state.');
    }

    expect(result.state.reason).toBe('invalid-startup-config');
  });

  it('is idempotent across repeated invocation and never regresses to auth-required state', async () => {
    const env = {
      EXPO_PUBLIC_API_BASE_URL: 'https://campusnav.example.com',
    };

    const first = await runAppBootstrap({
      env,
      attempt: 1,
      toolingCheck: async () => ({ status: 'ok' }),
    });

    const second = await runAppBootstrap({
      env,
      attempt: 2,
      toolingCheck: async () => ({ status: 'ok' }),
    });

    expect(first.state.phase).toBe('ready');
    expect(second.state.phase).toBe('ready');

    if (first.state.phase !== 'ready' || second.state.phase !== 'ready') {
      throw new Error('Expected repeated bootstrap calls to be ready.');
    }

    expect(first.state.apiBaseUrl).toBe(second.state.apiBaseUrl);
    expect(first.state.authRequired).toBe(false);
    expect(second.state.authRequired).toBe(false);
    expect(second.state.attempt).toBeGreaterThan(first.state.attempt);
  });
});

describe('validateApiBaseUrl', () => {
  it('requires a URL with http/https protocol', () => {
    const ftpResult = validateApiBaseUrl('ftp://example.com/path');
    expect(ftpResult.ok).toBe(false);

    if (ftpResult.ok) {
      throw new Error('Expected invalid result for unsupported protocol.');
    }

    expect(ftpResult.reason).toBe('invalid-api-base-url');
  });

  it('keeps startup timeout constant explicit and bounded', () => {
    expect(STARTUP_TIMEOUT_MS).toBeGreaterThan(0);
    expect(STARTUP_TIMEOUT_MS).toBeLessThanOrEqual(5_000);
  });
});
