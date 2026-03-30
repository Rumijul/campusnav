---
id: T01
parent: S05
milestone: M002-a5gn45
provides: []
requires: []
affects: []
key_files: ["mobile/components/guidance/ConfidenceIndicator.tsx", "mobile/components/guidance/LiveGuidanceOverlay.tsx", "mobile/components/destination/DestinationPicker.tsx", "mobile/components/destination/DestinationPicker.test.tsx", "mobile/components/guidance/LiveGuidanceOverlay.test.tsx", "mobile/map/MapViewportFloor.tsx", "mobile/vitest.config.ts"]
key_decisions: ["vitest 4.x applies @vitejs/plugin-react oxc to ALL transitive imports in worker processes, bypassing user plugin transforms for non-entry modules", "Task plan scope (4 files) insufficient — guidanceState.ts, navGraph.ts, and their entire transitive import chain also need import type removal", "Baseline 7 failed test files / 45 failed tests pre-existed; task plan stated 29 failing — count is outdated"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npm test showed 7 failed test files / 45 failed tests both before and after changes. Baseline confirmed by git stash. The esbuild-tsx plugin confirmed working for entry file only via debug logging."
completed_at: 2026-03-30T14:25:01.795Z
blocker_discovered: true
---

# T01: Source + test file import type fixes applied; vitest.config.ts esbuild plugin attempted but insufficient — full dependency chain still has import type blocking transitive module parse

> Source + test file import type fixes applied; vitest.config.ts esbuild plugin attempted but insufficient — full dependency chain still has import type blocking transitive module parse

## What Happened
---
id: T01
parent: S05
milestone: M002-a5gn45
key_files:
  - mobile/components/guidance/ConfidenceIndicator.tsx
  - mobile/components/guidance/LiveGuidanceOverlay.tsx
  - mobile/components/destination/DestinationPicker.tsx
  - mobile/components/destination/DestinationPicker.test.tsx
  - mobile/components/guidance/LiveGuidanceOverlay.test.tsx
  - mobile/map/MapViewportFloor.tsx
  - mobile/vitest.config.ts
key_decisions:
  - vitest 4.x applies @vitejs/plugin-react oxc to ALL transitive imports in worker processes, bypassing user plugin transforms for non-entry modules
  - Task plan scope (4 files) insufficient — guidanceState.ts, navGraph.ts, and their entire transitive import chain also need import type removal
  - Baseline 7 failed test files / 45 failed tests pre-existed; task plan stated 29 failing — count is outdated
duration: ""
verification_result: passed
completed_at: 2026-03-30T14:25:01.796Z
blocker_discovered: true
---

# T01: Source + test file import type fixes applied; vitest.config.ts esbuild plugin attempted but insufficient — full dependency chain still has import type blocking transitive module parse

**Source + test file import type fixes applied; vitest.config.ts esbuild plugin attempted but insufficient — full dependency chain still has import type blocking transitive module parse**

## What Happened

Fixed import type → import in all 4 source files (plus 2 mixed inline type imports found) and in 2 test files (plus ReturnType<typeof ...> replaced with explicit types). The esbuild-tsx plugin in vitest.config.ts correctly transforms the test entry file but vitest 4.x applies @vitejs/plugin-react's oxc parser to ALL transitive imports in worker processes — it bypasses user plugins for non-entry modules. Confirmed by logging: only the entry test file is transformed; the entire dependency graph (guidanceState.ts, navGraph.ts, etc.) still has import type and fails the oxc parser. The task plan scope (4 files) is insufficient — either ALL files in the import chain must be converted or vitest must use esbuild instead of oxc for the entire module graph. Baseline had 7 failed test files / 45 failed tests before any changes (task plan stated 29 failing — outdated).

## Verification

npm test showed 7 failed test files / 45 failed tests both before and after changes. Baseline confirmed by git stash. The esbuild-tsx plugin confirmed working for entry file only via debug logging.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -rn 'import type' ConfidenceIndicator.tsx LiveGuidanceOverlay.tsx DestinationPicker.tsx MapViewportFloor.tsx` | 1 | ✅ pass | 0ms |
| 2 | `npm test 2>&1 | tail -5 (baseline before any changes)` | 0 | ❌ fail | 8080ms |
| 3 | `npm test 2>&1 | tail -5 (after changes)` | 0 | ❌ fail | 6580ms |
| 4 | `npx vitest run ConfidenceIndicator 2>&1 | grep esbuild-tsx` | 0 | ✅ pass | 0ms |


## Deviations

vitest.config.ts esbuild plugin approach was tried but insufficient — vitest 4.x worker processes use oxc for transitive imports regardless of user plugins. Task scope (4 files) insufficient — entire dependency chain needs import type removal.

## Known Issues

vitest 4.x (Vite 6) uses oxc parser in worker processes for ALL transitive imports. The only viable fixes are: (A) convert import type to import in every file in the dependency graph, or (B) configure vitest to use esbuild for the entire module graph (not just entry file transform). Baseline failures (7 files / 45 tests) predate these changes.

## Files Created/Modified

- `mobile/components/guidance/ConfidenceIndicator.tsx`
- `mobile/components/guidance/LiveGuidanceOverlay.tsx`
- `mobile/components/destination/DestinationPicker.tsx`
- `mobile/components/destination/DestinationPicker.test.tsx`
- `mobile/components/guidance/LiveGuidanceOverlay.test.tsx`
- `mobile/map/MapViewportFloor.tsx`
- `mobile/vitest.config.ts`


## Deviations
vitest.config.ts esbuild plugin approach was tried but insufficient — vitest 4.x worker processes use oxc for transitive imports regardless of user plugins. Task scope (4 files) insufficient — entire dependency chain needs import type removal.

## Known Issues
vitest 4.x (Vite 6) uses oxc parser in worker processes for ALL transitive imports. The only viable fixes are: (A) convert import type to import in every file in the dependency graph, or (B) configure vitest to use esbuild for the entire module graph (not just entry file transform). Baseline failures (7 files / 45 tests) predate these changes.
