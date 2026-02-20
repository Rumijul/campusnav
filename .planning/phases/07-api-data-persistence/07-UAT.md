---
status: complete
phase: 07-api-data-persistence
source: 07-01-SUMMARY.md, 07-02-SUMMARY.md, 07-03-SUMMARY.md
started: 2026-02-21T00:00:00Z
updated: 2026-02-21T00:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. App loads map data from database
expected: Start the dev server (npm run dev) and open the app in the browser. The floor plan map renders correctly with campus nodes and edges visible — same as before, but now served from SQLite (not directly from the JSON file).
result: pass

### 2. Loading spinner appears on map
expected: On a fresh page load, a spinner/loading overlay is briefly visible on the map area while graph data is being fetched from the server. Once data loads, the spinner disappears and the map renders.
result: pass

### 3. Only one API request on load
expected: Open browser DevTools → Network tab, then refresh the page. You should see exactly ONE GET /api/map request — not two. The double-fetch has been eliminated.
result: issue
reported: "there are two maps"
severity: major

### 4. Error overlay after retries exhausted
expected: Stop the dev server, then reload the page. After a few seconds (3 retry attempts with ~1s between each), an error message overlay appears on the map area instead of the spinner.
result: pass

### 5. Idempotent server restarts
expected: Restart the dev server (Ctrl+C then npm run dev again). The app still loads correctly with the same map data — no duplicated nodes or edges. Server logs should show "[seed] Already seeded (25 nodes) — skipping".
result: pass

## Summary

total: 5
passed: 4
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Exactly one GET /api/map request fires on page load (double-fetch eliminated)"
  status: failed
  reason: "User reported: there are two maps"
  severity: major
  test: 3
  root_cause: "React StrictMode in src/client/main.tsx intentionally double-invokes useEffect in dev — mount→cleanup(abort)→remount causes 2 fetches. Only one call site exists (FloorPlanCanvas.tsx:57). Production builds are unaffected — only 1 fetch fires in prod."
  artifacts:
    - path: "src/client/main.tsx"
      issue: "StrictMode wraps App — causes double-invoke of effects in dev"
    - path: "src/client/hooks/useGraphData.ts"
      issue: "useEffect with AbortController cleanup is correct shape that StrictMode exercises"
  missing: []
  resolution: "Accepted — dev-only StrictMode behavior, no fix needed. Production unaffected."
  debug_session: ".planning/debug/double-fetch-api-map.md"
