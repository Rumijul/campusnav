---
status: resolved
trigger: "Two GET /api/map requests fire on page load instead of one. The fix that was supposed to eliminate the double-fetch didn't fully work."
created: 2026-02-21T00:00:00Z
updated: 2026-02-21T00:00:00Z
---

## Current Focus

hypothesis: React StrictMode double-invokes useEffect in development, causing two fetches from a single hook call
test: Checked main.tsx for StrictMode wrapper; confirmed single useGraphData call site
expecting: Removing StrictMode (or accepting dev-only behaviour) eliminates the double fetch
next_action: COMPLETE — root cause identified, no code fix required unless dev double-invoke is unacceptable

## Symptoms

expected: One GET /api/map request on page load
actual: Two GET /api/map requests fire on page load
errors: None — both requests succeed
reproduction: Load the app in development mode (Vite dev server)
started: Observed after the lift of useGraphData to FloorPlanCanvas; was assumed to be a two-call-site bug

## Eliminated

- hypothesis: LandmarkLayer still calls useGraphData internally
  evidence: LandmarkLayer.tsx has no import of useGraphData; it only receives `nodes: NavNode[]` as a prop
  timestamp: 2026-02-21

- hypothesis: App.tsx or another top-level component independently calls useGraphData
  evidence: App.tsx only renders <FloorPlanCanvas />; grep for useGraphData across all of src/ returns exactly two hits — the export declaration and the single call site in FloorPlanCanvas.tsx:57
  timestamp: 2026-02-21

- hypothesis: useGraphData is called in more than one component
  evidence: Confirmed only one import site: FloorPlanCanvas.tsx:9 / FloorPlanCanvas.tsx:57
  timestamp: 2026-02-21

## Evidence

- timestamp: 2026-02-21
  checked: src/client/main.tsx lines 1-13
  found: App is wrapped in <StrictMode> (line 10)
  implication: React StrictMode intentionally mounts → unmounts → remounts every component in development. This fires useEffect cleanup then re-runs the effect, producing two fetch calls from a single hook instance.

- timestamp: 2026-02-21
  checked: src/client/hooks/useGraphData.ts lines 34-49
  found: useEffect with empty dependency array `[]`; cleanup aborts the in-flight request via AbortController
  implication: On StrictMode's deliberate remount the first effect fires (fetch 1 starts), cleanup runs (fetch 1 aborted), second effect fires (fetch 2 starts and succeeds). Exactly matches the observed two-request pattern.

- timestamp: 2026-02-21
  checked: grep useGraphData across src/
  found: Only two lines reference the symbol — the export in useGraphData.ts and the call in FloorPlanCanvas.tsx:57
  implication: The double-fetch is NOT caused by two independent hook call sites. It is 100% a StrictMode dev behaviour.

## Resolution

root_cause: >
  React StrictMode (src/client/main.tsx line 10) deliberately double-invokes effects in
  development to surface cleanup bugs. useGraphData uses a useEffect with an empty
  dependency array and an AbortController for cleanup. StrictMode mounts the component,
  fires the effect (fetch #1 starts), immediately runs the cleanup (fetch #1 is aborted
  via controller.abort()), then remounts and fires the effect again (fetch #2 starts and
  succeeds). This is expected StrictMode behaviour — not a bug in the call-site count.
  In a production build StrictMode double-invocation does not occur, so only one request
  fires in production.

fix: >
  No code fix is required if the double-fetch is acceptable as a dev-only artefact.
  Options:
  1. Accept it — StrictMode double-invokes in dev only; production is unaffected.
  2. Remove <StrictMode> from main.tsx to stop the double-invoke in dev (loses StrictMode
     safety checks).
  3. Deduplicate at the network layer — a shared module-level cache/singleton that returns
     the same Promise for concurrent callers would absorb the second call without a second
     network request.

verification: >
  Verified by:
  - Confirmed useGraphData is imported and called only once (FloorPlanCanvas.tsx:57)
  - Confirmed LandmarkLayer receives nodes as a prop and has no hook import
  - Confirmed App.tsx adds no additional hook call
  - Confirmed StrictMode wrapper present in main.tsx:10
  - Cross-referenced hook cleanup path: AbortController.abort() in useEffect return
    exactly matches the pattern StrictMode exercises

files_changed: []
