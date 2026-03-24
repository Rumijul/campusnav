---
phase: 05.1-issues-needed-to-be-fixed
plan: 02
subsystem: canvas-interaction, search-ui
tags: [vaul-replacement, custom-sheet, ux-fix, pointer-events, back-button, clear-route]
dependency_graph:
  requires: [05.1-01-PLAN]
  provides: [CHECKPOINT-05.1-COMPLETE]
  affects: [DirectionsSheet, SearchOverlay, FloorPlanCanvas]
tech_stack:
  removed: [vaul (Drawer.Root/Portal/Content/Overlay)]
  patterns: [custom CSS bottom sheet, fixed positioning, height transition]
key_files:
  modified:
    - src/client/components/DirectionsSheet.tsx
    - src/client/components/SearchOverlay.tsx
    - src/client/components/FloorPlanCanvas.tsx
decisions:
  - "Replace Vaul entirely with custom CSS sheet — modal={false} + snapPoints was fundamentally broken; pointer-events-none fix broke Vaul's snap-point system"
  - "handleSheetBack calls routeSelection.clearAll() — back = exit route mode (implemented here; superseded in Phase 06-06 by setSheetOpen(false) — back = hide sheet only)"
  - "sheetOpen pill collapses SearchOverlay compact strip to minimal pill — avoids screen-space competition with sheet"
  - "Clear (✕) button in compact strip calls selection.clearAll() — user can discard route without expanding search"
metrics:
  duration: ~25 min
  completed: 2026-02-20
  tasks_completed: 3
  files_modified: 3
---

# Phase 5.1 Plan 02: Human Verification + UX Fixes Summary

**One-liner:** Replaced Vaul entirely with a custom CSS bottom sheet (zero pointer-event conflicts), then fixed three UX issues discovered during human verification: back button now clears the route instead of hiding the sheet, compact strip now has a clear (✕) button, and the strip collapses to a pill when the sheet is open.

## Objective

Human verification of the two UAT blockers fixed in Plan 01, plus resolution of three additional UX issues identified during that verification session.

## Changes Made

### Root Cause Discovery: Vaul v1.1.2 fundamentally broken for this use case

During human verification, two compounding bugs were found:

1. The Plan 01 fix (`Drawer.Overlay pointer-events-none`) did suppress the backdrop, but Vaul's snap-point CSS transform system still required pointer events on `Drawer.Content` to drive animations — making the first fix partially break snap behavior.
2. A second attempt using `handleOnly` + `Drawer.Handle` also failed.

**Decision:** Vaul was removed entirely. `DirectionsSheet.tsx` was rewritten as a custom CSS bottom sheet using `position: fixed; bottom: 0` with a CSS `height` transition between peek (260px) and expanded (92vh) states. This eliminates Vaul's Radix dialog infrastructure, all `[data-vaul-drawer]` touch-action overrides, and the invisible overlay entirely.

### Fix 1 — Back button exits route mode

**File:** `src/client/components/FloorPlanCanvas.tsx`

`handleSheetBack` previously called `setSheetOpen(false)`, hiding the sheet but leaving the route active with no way to reopen it.

Changed to:
```ts
const handleSheetBack = useCallback(() => {
  routeSelection.clearAll()
  // sheetOpen and routeResult are cleared by the useEffect watcher above
}, [routeSelection])
```

Pressing back now clears the route entirely (correct semantic). The sheet closes as a side-effect of the existing `useEffect` that sets `sheetOpen(false)` when `routeResult` becomes null.

> **Note (superseded):** This behavior was changed in Phase 06-06. `handleSheetBack` now calls `setSheetOpen(false)` — back closes the sheet while the route line stays visible. `routeSelection.clearAll()` was moved to the X (clear) button in the compact strip.

### Fix 2 — Clear button in compact strip

**File:** `src/client/components/SearchOverlay.tsx`

The compact strip (shown when both A and B are selected) previously had a Swap button and an Expand button. Replaced the Expand button with a `ClearIcon` (✕) button that calls `selection.clearAll()`.

This gives users a direct way to discard a route from the strip without having to enter the full search UI.

### Fix 3 — Strip collapses when sheet is open

**File:** `src/client/components/SearchOverlay.tsx`

Added `sheetOpen?: boolean` prop. When `isCompact && sheetOpen`, renders a minimal "Route active" pill anchored top-left instead of the full-width A→B strip, so it doesn't fight for screen space with the directions sheet.

When `sheetOpen` is false, the full A→B compact strip renders as before.

**File:** `src/client/components/FloorPlanCanvas.tsx`

Passes `sheetOpen={sheetOpen}` to `<SearchOverlay />`.

## Verification Results

| Check | Result |
|-------|--------|
| TypeScript (`tsc --noEmit`) | ✅ No errors |
| Biome lint (`biome check src/client/components/SearchOverlay.tsx FloorPlanCanvas.tsx`) | ✅ No errors |
| Human verification — canvas pan/zoom with sheet open | ✅ Approved |
| Human verification — back button clears route | ✅ Approved |
| Human verification — clear button in compact strip | ✅ Approved |
| Human verification — strip collapses when sheet open | ✅ Approved |

## Decisions Made

1. **Replace Vaul with custom sheet** — Vaul 1.1.2's `modal={false}` + `snapPoints` combination is broken for non-modal use cases layered over Konva. The custom CSS approach (`position: fixed; bottom: 0; height` transition) is simpler, zero-dependency, and fully avoids any pointer-event or touch-action interference.

2. **Back = clear route** — `handleSheetBack` semantically means "I am done with this route". Hiding the sheet while keeping the route active was an inconsistent half-state with no affordance to return.

3. **Collapsed pill** — When the directions sheet is showing, the A→B compact strip overlaps it visually on small screens. A minimal pill lets the user see "there's a route" and clear it, without obscuring the sheet content.

## Deviations from Plan

The plan expected to verify two fixes from Plan 01. Instead, three additional UX issues were identified and fixed during the verification session:
- Back button hidden-sheet bug (not in original plan)
- No clear-route affordance (not in original plan)
- Strip/sheet screen-space conflict (not in original plan)

Additionally, Vaul was replaced entirely (not planned) after discovering its snap-point system was incompatible with the pointer-events fix from Plan 01.

All deviations were improvements. Human approved the complete set.

## Self-Check

**Files modified:**
- [x] `src/client/components/DirectionsSheet.tsx` — Vaul removed, custom CSS sheet
- [x] `src/client/components/SearchOverlay.tsx` — clear button + sheetOpen collapse
- [x] `src/client/components/FloorPlanCanvas.tsx` — handleSheetBack + sheetOpen prop

## Self-Check: PASSED
