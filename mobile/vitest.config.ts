import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@shared', replacement: resolve(__dirname, '../src/shared') },
      { find: '@client', replacement: resolve(__dirname, '../src/client') },
      {
        find: /^react-native$/,
        replacement: resolve(__dirname, '__mocks__/react-native.js'),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/.git/**'],
    clearMocks: true,
    restoreMocks: true,
  },
});
