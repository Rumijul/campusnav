---
phase: 04-map-landmarks-location-display
plan: 03
subsystem: ui
tags: [vaul, bottom-sheet, landmark-detail, konva, react, drawer]

# Dependency graph
requires:
  - phase: 04-map-landmarks-location-display
    provides: selectedNode state in FloorPlanCanvas + LandmarkLayer marker tap → setSelectedNode
provides:
  - LandmarkSheet component — Vaul bottom sheet with snapPoints [0.15, 0.9] and modal=false
  - Complete landmark tap → detail flow: marker tap → peek → expand → dismiss
  - Google Maps-style peek-then-expand UX for all 18 visible landmark nodes
affects:
  - 04-04-location-search (LandmarkSheet will be reused for search result detail)
  - any future phase rendering landmark/location detail

# Tech tracking
tech-stack:
  added: [vaul@1.1.2]
  patterns:
    - "modal=false on Drawer.Root keeps Konva map interactive while sheet is peeked"
    - "key={node?.id} on Drawer.Root resets activeSnapPoint to peek for each new node"
    - "HTML overlay outside Konva Stage for sheet — same pattern as ZoomControls"
    - "Controlled activeSnapPoint state for predictable snap behavior"

key-files:
  created:
    - src/client/components/LandmarkSheet.tsx
  modified:
    - src/client/components/FloorPlanCanvas.tsx

key-decisions:
  - "modal=false on Vaul Drawer.Root — critical for map interactivity while sheet is peeked (no overlay blocks canvas)"
  - "key={node?.id ?? 'none'} on Drawer.Root forces remount on node change, resetting snap to peek automatically"
  - "No <Drawer.Overlay> when modal=false — omitting it keeps map fully interactive"
  - "Removed unused biome-ignore suppression comment from plan template (was for a useEffect that isn't needed)"

patterns-established:
  - "HTML overlay pattern for sheet: sibling div to Stage, not inside Konva tree"
  - "Vaul snap fractions: 0.15 = peek (name/type visible), 0.9 = expanded (full detail)"

requirements-completed: [ROUT-07]

# Metrics
duration: 1min
completed: 2026-02-19
---

# Phase 4 Plan 03: Landmark Bottom Sheet Summary

**Vaul bottom sheet (snapPoints 0.15/0.9, modal=false) wired to landmark marker taps — peek shows name/type, expand shows all 6 detail fields, map remains pannable/zoomable while peeked**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-02-19T03:38:03Z
- **Completed:** 2026-02-19T03:39:43Z
- **Tasks:** 2
- **Files modified:** 3 (LandmarkSheet.tsx created, FloorPlanCanvas.tsx + package.json/lock modified)

## Accomplishments

- Installed vaul@1.1.2 — Google Maps-style bottom sheet library
- LandmarkSheet component with controlled snap points [0.15, 0.9] and modal=false for non-blocking map interaction
- Peek state (15% height) shows landmark name + type; expanded state (90% height) shows room number, description, building, floor, and accessibility notes
- Three dismissal methods: close button, swipe-down, tap map background (Stage onClick)
- FloorPlanCanvas wired with LandmarkSheet as HTML sibling to ZoomControls outside Konva Stage

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Vaul and create LandmarkSheet component** - `b17484f` (feat)
2. **Task 2: Wire LandmarkSheet into FloorPlanCanvas** - `0888c0d` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/client/components/LandmarkSheet.tsx` — Vaul Drawer.Root with snapPoints, modal=false, peek + expanded detail views
- `src/client/components/FloorPlanCanvas.tsx` — Added LandmarkSheet import + render as sibling to ZoomControls
- `package.json` / `package-lock.json` — Added vaul@1.1.2 dependency

## Decisions Made

- **modal=false on Drawer.Root**: Critical decision from plan research — without this, Vaul's overlay would block the Konva canvas, making the map non-interactive while sheet is open. With `modal=false` and no `<Drawer.Overlay>`, the map remains fully pannable/zoomable at peek state.
- **key={node?.id} for snap reset**: Using React's key prop to remount Drawer.Root when a different node is selected automatically resets `activeSnapPoint` to 0.15 (peek) without any useEffect. Cleaner than imperative state reset.
- **Removed unused biome-ignore comment**: Plan template included a comment intended for a useEffect with exhaustive deps, but no such effect was needed. Removed to pass Biome lint cleanly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused biome-ignore lint suppression comment**
- **Found during:** Task 1 (Biome lint check after creating LandmarkSheet)
- **Issue:** Plan template included `// biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on node change` as a comment above the `return`. This comment was intended to suppress an exhaustive-deps warning for a useEffect, but no useEffect was present in the component. Biome flagged it as an unused suppression (warning).
- **Fix:** Replaced the 3-line comment block with a concise single comment explaining the key-based remount approach
- **Files modified:** src/client/components/LandmarkSheet.tsx
- **Verification:** `npx biome check src/client/components/LandmarkSheet.tsx` — clean, zero warnings
- **Committed in:** b17484f (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug/lint)
**Impact on plan:** Minor comment cleanup. No behavior changes. No scope creep.

## Issues Encountered

None — TypeScript compiled cleanly (only the pre-existing `use-image` type declaration gap from Phase 2, unrelated to this plan). Biome lint passed zero warnings on all modified files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Complete landmark tap → detail flow implemented end-to-end
- LandmarkSheet is ready to be reused by Phase 04-04 location search for showing search result details
- All success criteria met: vaul installed, snap points [0.15, 0.9], modal=false, 6 detail fields, 3 dismissal methods, map interaction not blocked
- No blockers

---
*Phase: 04-map-landmarks-location-display*
*Completed: 2026-02-19*

## Self-Check: PASSED

- ✅ `src/client/components/LandmarkSheet.tsx` — exists on disk
- ✅ `src/client/components/FloorPlanCanvas.tsx` — exists on disk
- ✅ `04-03-SUMMARY.md` — exists on disk
- ✅ Commit `b17484f` — verified in git log
- ✅ Commit `0888c0d` — verified in git log
