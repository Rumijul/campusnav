---
estimated_steps: 4
estimated_files: 8
skills_used:
  - react-best-practices
  - test
---

# T01: Scaffold Expo mobile runtime with no-login bootstrap shell and task-local test harness

**Slice:** S01 — Native app runtime + backend graph contract bootstrap
**Milestone:** M002-a5gn45

## Description

Create the native runtime baseline so later tasks can implement contracts and interactions on top of a real, testable app shell.

## Steps

1. Create an Expo TypeScript package in `mobile/` with scripts for `start`, `ios`, `android`, `typecheck`, and `test`.
2. Add runtime env wiring for `EXPO_PUBLIC_API_BASE_URL` and document it in `mobile/.env.example`.
3. Implement `mobile/App.tsx` as a no-login visitor bootstrap shell with explicit loading/error placeholders.
4. Configure mobile-local Vitest (`mobile/vitest.config.ts`) and add a deterministic bootstrap test file.

## Must-Haves

- [ ] Native runtime scripts exist and execute from `mobile/package.json` without touching root web runtime scripts.
- [ ] App bootstrap path contains no authentication gate and exposes deterministic startup states (`loading`, `ready`, `error`).
- [ ] Mobile-local tests run in isolation and become the base verification surface for subsequent S01 tasks.

## Verification

- `npm --prefix mobile run typecheck`
- `npm --prefix mobile run test -- mobile/bootstrap/appBootstrap.test.ts`

## Observability Impact

- Signals added/changed: bootstrap phase state (`idle/loading/ready/error`) and config-missing error classification.
- How a future agent inspects this: run `npm --prefix mobile run test -- mobile/bootstrap/appBootstrap.test.ts` and inspect startup state rendering in `mobile/App.tsx`.
- Failure state exposed: startup failures are surfaced as explicit UI status, preventing silent blank-screen startup.

## Inputs

- `.gsd/REQUIREMENTS.md` — active S01 requirements (`R023`, `R024`) this task begins to satisfy.
- `.gsd/DECISIONS.md` — D009/D011 scope constraints (native student runtime, web-only admin).
- `.gsd/milestones/M002-a5gn45/slices/S01/S01-RESEARCH.md` — runtime/bootstrap strategy and tooling guidance.
- `package.json` — existing root scripts/tooling constraints.
- `.gitignore` — baseline ignore rules to extend for Expo build artifacts.

## Expected Output

- `mobile/package.json` — Expo runtime package with start/platform/type/test scripts.
- `mobile/app.json` — app metadata for iOS/Android shell bootstrap.
- `mobile/tsconfig.json` — TypeScript config for mobile package.
- `mobile/babel.config.js` — Expo/Babel runtime config.
- `mobile/App.tsx` — no-login bootstrap shell.
- `mobile/vitest.config.ts` — mobile test harness config.
- `mobile/bootstrap/appBootstrap.test.ts` — startup state verification tests.
- `mobile/.env.example` — `EXPO_PUBLIC_API_BASE_URL` documentation.
