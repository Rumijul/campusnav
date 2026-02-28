---
status: complete
phase: 07-api-data-persistence
source: 07-01-SUMMARY.md, 07-02-SUMMARY.md, 07-03-SUMMARY.md
started: 2026-02-21T00:00:00Z
updated: 2026-02-21T00:06:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Student map loads from server (no login required)
expected: Open http://localhost:5173. The campus floor plan renders, landmarks appear on the map, and no login prompt or auth error is shown. The app works fully as a student without any authentication.
result: pass

### 2. GET /api/map returns data from SQLite
expected: Open DevTools → Network tab. Reload the page. A single GET request to /api/map (or http://localhost:3001/api/map) appears and returns 200 with JSON containing nodes and edges arrays. Only one request fires (no duplicate calls).
result: pass

### 3. Loading spinner appears during fetch
expected: While the page loads, a spinner or loading indicator briefly appears over the map area before the floor plan and landmarks render. (On fast machines this may be very brief — try throttling in DevTools → Network → Slow 3G to make it visible, or just confirm the map eventually renders correctly.)
result: pass

### 4. Landmarks appear correctly on the map
expected: After the page loads, tappable landmark markers (rooms, offices, classrooms) are visible on the floor plan. Tapping or clicking one shows its name/info. The data looks correct (matches what was seeded from campus-graph.json).
result: pass

### 5. Route calculation works end-to-end
expected: Select a start point and a destination (via tapping or search), then confirm a route draws on the map with a visual path line and step-by-step directions in the sheet below. The routing works the same as before (graph data is now DB-backed but pathfinding behavior unchanged).
result: pass

### 6. Server restart does not duplicate graph data
expected: Restart the dev server (Ctrl+C, then npm run dev again). Reload http://localhost:5173. The app loads normally — same number of landmarks, no duplicates. (Optionally: check the terminal logs for "[seed] Already seeded (25 nodes) — skipping".)
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
