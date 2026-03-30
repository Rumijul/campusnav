---
estimated_steps: 14
estimated_files: 1
skills_used: []
---

# T02: Convert all import type / export type to regular imports in mobile source + test tree (comprehensive)

Convert ALL TypeScript `import type` and `export type` statements to regular `import`/`export` across the entire mobile source and test tree. The @vitejs/plugin-react oxc parser in vitest 4.x worker processes cannot parse TypeScript `import type` syntax — it bypasses user plugins for transitive modules. The only fix is full removal across the entire dependency graph (60+ occurrences found across mobile/components, mobile/hooks, mobile/routing, mobile/map, mobile/domain, mobile/data, mobile/bootstrap, mobile/navigation, mobile/utils, mobile/types, mobile/src, and test files). In the mobile/ directory:

1. Convert ALL source and test files (.ts, .tsx) excluding node_modules:
   - `import type { X }` → `import { X }`
   - `import type X` → `import X`
   - `export type { X }` → `export { X }`
   - `export type X` → `export X`
   - `import { A, type B }` → `import { A, B }`
   - `export { type X }` → `export { X }`

2. Remove the esbuild-tsx plugin from vitest.config.ts (no longer needed after import type removal).

3. Verify no `import type` or `export type` remains:
   `grep -rn 'import type\|export type' mobile/ --include='*.ts' --include='*.tsx' | grep -v node_modules`
   Must return empty.

4. Verify tests pass: `npm test 2>&1 | tail -5` — must show 0 failed test files, all ~264 tests passing.

Use a script or sed to handle all files systematically. The T01 blocker task fixed only 4 files and proved the plugin workaround insufficient; this task fixes all files in one comprehensive pass.

## Inputs

- None specified.

## Expected Output

- `mobile/ (all .ts/.tsx files with import type removed)`

## Verification

grep -rn 'import type\|export type' mobile/ --include='*.ts' --include='*.tsx' | grep -v node_modules (must return empty) && npm test 2>&1 | tail -5 (must show 0 failed test files, all 264 tests passing)
