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
  // Vite 8 uses oxc for TSX transform by default, which doesn't support TypeScript
  // `export type` syntax in worker processes. Use esbuild for TS instead.
  esbuild: {
    ts: true,
  },
  optimizeDeps: {
    // Force esbuild for TypeScript transpilation in both deps and workers
    ts: 'esbuild',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/.git/**'],
    clearMocks: true,
    restoreMocks: true,
    pool: 'forks',
    // Disable oxc in workers — use esbuild for TypeScript
    coverage: {
      provider: 'v8',
    },
  },
});
