import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/**
 * esbuild-tsx — single-pass esbuild transform for TypeScript + JSX.
 *
 * Replaces @vitejs/plugin-react (oxc) because oxc cannot parse TypeScript
 * `import type` / `export type` or `typeof` in type positions.
 * esbuild handles both TypeScript stripping and JSX transform in one pass.
 */
function esbuildTsx(): Plugin {
  return {
    name: 'esbuild-tsx',
    enforce: 'pre' as const,
    async transform(code, id) {
      if (!id.match(/\.(tsx?|jsx?)$/)) return null;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const esbuild = require('esbuild') as typeof import('esbuild');
      console.error('[esbuild-tsx] transform:', id.replace(__dirname, '...'));
      const result = await esbuild.transform(code, {
        loader: id.endsWith('x') ? 'tsx' : 'ts',
        jsx: 'automatic', // automatic JSX runtime (jsx, jsxs, Fragment from react/jsx-runtime)
        target: 'node18',
        sourcemap: false,
        sourcesContent: false,
        legalComments: 'none',
      });
      return { code: result.code, map: result.map ?? undefined };
    },
  };
}

export default defineConfig({
  plugins: [esbuildTsx()],
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
    // Ensure all TSX modules use the same web transform pipeline as the test entry
    // This prevents worker processes from using a different (oxc) pipeline
    pool: 'forks',
  },
});
