# S05 Replan

**Milestone:** M002-a5gn45
**Slice:** S05
**Blocker Task:** T01
**Created:** 2026-03-30T14:30:55.370Z

## Blocker Description

vitest 4.x (Vite 6) applies @vitejs/plugin-react oxc parser to ALL transitive imports in worker processes, bypassing user plugins for non-entry modules. The esbuild-tsx plugin works for entry files only; the entire source dependency chain (guidanceState.ts, navGraph.ts, useGuidanceSession.ts, routeSessionState.ts, pathfindingEngine.ts, generateDirections.ts, App.tsx, and many more — 60+ occurrences across mobile/ directory) still contains `import type` / `export type` that the oxc parser cannot handle. The previous T01 attempt was too narrow (4 files) and the esbuild-tsx workaround was insufficient. Baseline failures (7 files / 45 tests) pre-exist the T01 changes.

## What Changed

Added T02 (comprehensive import type fix across entire mobile source tree, superseding T01's insufficient 4-file scope). The esbuild-tsx plugin workaround is removed as part of T02 since it's no longer needed after import type removal. Original T02-T06 are renumbered to T03-T07 to accommodate the new T02. T01 remains in the plan as a completed task (with blocker documented in its summary) — its approach was too narrow and the esbuild-tsx plugin cannot help the transitive module chain.
