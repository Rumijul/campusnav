---
phase: 13-restore-location-detail
plan: 01
subsystem: ui
tags: [react, typescript, bottom-sheet, tailwind, biome]

# Dependency graph
requires:
  - phase: 05.1-issues-needed-to-be-fixed
    provides: Custom CSS height-transition bottom sheet pattern (DirectionsSheet.tsx)
  - phase: 04-map-landmarks-location-display
    provides: NavNode type and LandmarkSheet detail field pattern
provides:
  - LocationDetailSheet component — custom CSS bottom sheet displaying nav node details
  - LocationDetailSheetProps interface — exported TypeScript interface
affects: [14-wire-location-detail, FloorPlanCanvas, student wayfinding flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Custom CSS height-transition bottom sheet (no Vaul) — pure fixed positioning, pointer-event safe
    - useEffect([nodeId]) pattern — reset sheet state on node identity change using derived primitive
    - Conditional field rendering — each optional field only rendered when value is present

key-files:
  created:
    - src/client/components/LocationDetailSheet.tsx
  modified: []

key-decisions:
  - "nodeId derived from node?.id used as useEffect dependency (not node object) — avoids Biome useExhaustiveDependencies false positive on object references"
  - "PEEK_HEIGHT=180px chosen (smaller than DirectionsSheet 260px) — location detail needs less vertical space than full route directions"
  - "z-40 (one below DirectionsSheet z-50) — directions sheet renders on top when both could theoretically coexist"
  - "biome-ignore comment on useEffect with nodeId dep — intentional reactive pattern, not a lint bypass"

patterns-established:
  - "LocationDetailSheet pattern: returns null when node=null (no DOM waste), resets to peek on node change via useEffect([nodeId])"
  - "Derived primitive dep pattern: extract node?.id to const nodeId, depend on nodeId in useEffect to avoid Biome object-ref false positive"

requirements-completed: [ROUT-07]

# Metrics
duration: 6min
completed: 2026-02-22
---

# Phase 13 Plan 01: Restore Location Detail Summary

**Custom CSS bottom sheet LocationDetailSheet.tsx with drag-to-expand, 180px peek, and conditional field rendering for NavNode details — no Vaul dependency**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-02-22T09:36:12Z
- **Completed:** 2026-02-22T09:38:07Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created LocationDetailSheet.tsx as a standalone custom CSS bottom sheet component
- Established PEEK_HEIGHT=180 / EXPANDED_MAX=0.75 sheet geometry matching the project's established pattern
- Implemented full drag-to-expand with onPointerDown/Move/Up/Cancel pattern copied from DirectionsSheet.tsx
- Conditionally renders roomNumber, description, buildingName, floor, accessibilityNotes fields
- Zero Biome errors, zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create LocationDetailSheet component** - `9fed918` (feat)

**Plan metadata:** (docs commit — pending)

## Files Created/Modified
- `src/client/components/LocationDetailSheet.tsx` - Custom CSS bottom sheet displaying NavNode detail fields; exports LocationDetailSheet and LocationDetailSheetProps

## Decisions Made
- Used `nodeId = node?.id` as a derived primitive for `useEffect` dependency instead of depending on `node` directly — Biome's `useExhaustiveDependencies` rule incorrectly flags object props as "outer scope" values when assigned to local `const`. The `nodeId` variable is reactive (changes when node changes) but is a primitive string. Added `biome-ignore` comment to document intent.
- PEEK_HEIGHT=180 (vs DirectionsSheet's 260) — location detail header is more compact than route summary header
- z-40 class chosen over z-50 — detail sheet sits below directions sheet in stacking order, consistent with plan spec

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Biome lint error on useEffect dependency**
- **Found during:** Task 1 (Create LocationDetailSheet component)
- **Issue:** Initial implementation used `useEffect(() => { setExpanded(false) }, [node])` as planned, but Biome's `useExhaustiveDependencies` rule flagged `node` (object) as an unnecessary dependency. Switched to `nodeId = node?.id` (primitive), but Biome still flagged the local const as "outer scope".
- **Fix:** Added `// biome-ignore lint/correctness/useExhaustiveDependencies: nodeId is derived from prop node — intentionally react to node identity changes` comment. The behavior is correct React — the effect intentionally runs when the node changes.
- **Files modified:** src/client/components/LocationDetailSheet.tsx
- **Verification:** `npx biome check` exits 0 with no errors
- **Committed in:** 9fed918 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — lint false positive on intentional pattern)
**Impact on plan:** Minor. The biome-ignore comment preserves the intended behavior while satisfying the linter. No scope creep.

## Issues Encountered
- Biome `useExhaustiveDependencies` does not track that a `const nodeId = prop?.id` assignment is reactive. Documented via ignore comment with rationale. This same pattern exists in FloorPlanImage.tsx and FloorPlanCanvas.tsx with the same biome-ignore approach.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- LocationDetailSheet is a self-contained UI component ready to be wired into FloorPlanCanvas
- Plan 02 will add the tap handler and state management in FloorPlanCanvas to show/hide this sheet
- No blockers

---
*Phase: 13-restore-location-detail*
*Completed: 2026-02-22*
