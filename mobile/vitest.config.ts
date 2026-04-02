import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: [
      { find: '@shared', replacement: resolve(__dirname, '../src/shared') },
      { find: '@client', replacement: resolve(__dirname, '../src/client') },
      {
        find: /^react-native$/,
        replacement: resolve(__dirname, '__mocks__/react-native.js'),
      },
      {
        find: /^react-native-reanimated$/,
        replacement: resolve(__dirname, '__mocks__/react-native-reanimated.ts'),
      },
    ],
  },

  // Disable oxc — it cannot parse TypeScript `export type` syntax.
  // With oxc disabled, vitest falls back to esbuild for TypeScript.
  oxc: false,

  // Force esbuild for TypeScript transformation (supports export type syntax)
  esbuild: {
    ts: true,
    tsx: true,
  },

  test: {
    environment: 'jsdom',
    globals: true,
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/.git/**'],
    clearMocks: true,
    restoreMocks: true,
    pool: 'forks',
    coverage: {
      provider: 'v8',
    },
  },
});
