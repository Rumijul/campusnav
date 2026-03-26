---
id: T01
parent: S01
milestone: M002-a5gn45
provides: []
requires: []
affects: []
key_files: ["mobile/package.json", "mobile/vitest.config.ts", ".gsd/KNOWLEDGE.md"]
key_decisions: ["Run mobile Vitest from repository root (`--root ..`) with `mobile/vitest.config.ts` and `mobile/**/*.test.ts` include scope so GSD verification commands using `mobile/...` filters resolve deterministically."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran task-level verification plus slice-level verification commands. Task checks passed: mobile typecheck and focused app bootstrap tests (8 passing). Slice-level typecheck chain also passed. Expected intermediate-task failures remained for checks tied to future task assets (`mapApiClient`/`navGraph`/`mapTransform`/`mapBootstrapState` tests) and for `npx hono request ...` because the installed `hono` package in this repo does not expose a CLI executable in this environment."
completed_at: 2026-03-26T11:44:08.373Z
blocker_discovered: false
---

# T01: Aligned mobile Vitest root/filter execution and validated the no-login Expo bootstrap harness for deterministic startup states.

> Aligned mobile Vitest root/filter execution and validated the no-login Expo bootstrap harness for deterministic startup states.

## What Happened
---
id: T01
parent: S01
milestone: M002-a5gn45
key_files:
  - mobile/package.json
  - mobile/vitest.config.ts
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Run mobile Vitest from repository root (`--root ..`) with `mobile/vitest.config.ts` and `mobile/**/*.test.ts` include scope so GSD verification commands using `mobile/...` filters resolve deterministically.
duration: ""
verification_result: mixed
completed_at: 2026-03-26T11:44:08.374Z
blocker_discovered: false
---

# T01: Aligned mobile Vitest root/filter execution and validated the no-login Expo bootstrap harness for deterministic startup states.

**Aligned mobile Vitest root/filter execution and validated the no-login Expo bootstrap harness for deterministic startup states.**

## What Happened

Verified that the T01 mobile scaffold already existed locally (Expo scripts, app metadata, env example, bootstrap shell, and startup tests). Identified and fixed a contract mismatch where planned commands passed `mobile/...` test filters but Vitest was rooted at `mobile/`, causing false 'No test files found' failures. Updated `mobile/package.json` to run Vitest with `--root .. --config mobile/vitest.config.ts` and constrained `mobile/vitest.config.ts` includes to `mobile/**/*.test.ts` to preserve mobile-only isolation. Confirmed bootstrap behaviors remain visitor-first with explicit loading/ready/error state transitions and config validation coverage via existing test suite. Added a non-obvious tooling gotcha entry to `.gsd/KNOWLEDGE.md` for downstream task reliability.

## Verification

Ran task-level verification plus slice-level verification commands. Task checks passed: mobile typecheck and focused app bootstrap tests (8 passing). Slice-level typecheck chain also passed. Expected intermediate-task failures remained for checks tied to future task assets (`mapApiClient`/`navGraph`/`mapTransform`/`mapBootstrapState` tests) and for `npx hono request ...` because the installed `hono` package in this repo does not expose a CLI executable in this environment.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm --prefix mobile run typecheck` | 0 | ✅ pass | 963ms |
| 2 | `npm --prefix mobile run test -- mobile/bootstrap/appBootstrap.test.ts` | 0 | ✅ pass | 1055ms |
| 3 | `npm --prefix mobile run test -- mobile/bootstrap/appBootstrap.test.ts mobile/data/mapApiClient.test.ts mobile/domain/navGraph.test.ts mobile/map/mapTransform.test.ts mobile/bootstrap/mapBootstrapState.test.ts` | 0 | ✅ pass | 708ms |
| 4 | `npm --prefix mobile run test -- mobile/data/mapApiClient.test.ts -t "returns endpoint and status when map request fails"` | 1 | ❌ fail | 539ms |
| 5 | `npx hono request src/server/index.ts -P /api/map > /dev/null && npx hono request src/server/index.ts -P /api/campus/image > /dev/null` | 1 | ❌ fail | 502ms |
| 6 | `npm --prefix mobile run typecheck && npm run typecheck` | 0 | ✅ pass | 3231ms |


## Deviations

The expected T01 scaffold files were already present before execution; implementation work was limited to test harness alignment and verification reliability fixes.

## Known Issues

`npx hono request src/server/index.ts ...` fails in this environment with `npm error could not determine executable to run` because no `hono` CLI binary is available from installed dependencies. Targeted slice checks for T02/T03 test files fail as those files are not implemented yet (expected at T01 stage).

## Files Created/Modified

- `mobile/package.json`
- `mobile/vitest.config.ts`
- `.gsd/KNOWLEDGE.md`


## Deviations
The expected T01 scaffold files were already present before execution; implementation work was limited to test harness alignment and verification reliability fixes.

## Known Issues
`npx hono request src/server/index.ts ...` fails in this environment with `npm error could not determine executable to run` because no `hono` CLI binary is available from installed dependencies. Targeted slice checks for T02/T03 test files fail as those files are not implemented yet (expected at T01 stage).
