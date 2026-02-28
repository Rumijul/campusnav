---
phase: 14.1-node-selection-fixes-and-admin-room-number-edit
plan: "02"
subsystem: student-map-interaction
tags: [konva, route-selection, ux, pin-interaction]
dependency_graph:
  requires: [useRouteSelection.clearStart, useRouteSelection.clearDestination]
  provides: [tappable-A-pin, tappable-B-pin, FIX-04]
  affects: [SelectionMarkerLayer, FloorPlanCanvas]
tech_stack:
  added: []
  patterns: [cancelBubble-event-stop, konva-hitFunc-expanded-tap-target, optional-chaining-callbacks]
key_files:
  created: []
  modified:
    - src/client/components/SelectionMarkerLayer.tsx
    - src/client/components/FloorPlanCanvas.tsx
decisions:
  - "cancelBubble on pin Group click/tap prevents event bubbling to LandmarkLayer — tap clears pin without triggering handleLandmarkTap on the underlying node"
  - "hitFunc with PIN_RADIUS * 2.5 (30px) expands tap target well beyond visual 12px radius — improves mobile tappability"
  - "onClearStart and onClearDestination are optional props — backward compatible; SelectionMarkerLayer still renders without handlers"
  - "No additional clearing logic needed — existing useEffect on [routeSelection.start, routeSelection.destination] in FloorPlanCanvas already handles route/sheet teardown"
metrics:
  duration: "2 min"
  completed: "2026-02-27"
  tasks_completed: 2
  files_modified: 2
requirements: [FIX-04]
---

# Phase 14.1 Plan 02: Tappable A/B Selection Pins Summary

**One-liner:** Tappable A/B route pins with cancelBubble and expanded hitFunc so students can clear endpoints directly from the map canvas.

## What Was Built

Added click/tap interactivity to the A (start) and B (destination) selection pins in the student-facing floor plan. Previously display-only, the pins now call `onClearStart` and `onClearDestination` respectively when tapped, clearing the corresponding route endpoint.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add click/tap handlers to SelectionMarkerLayer A/B pins | 48e791e | src/client/components/SelectionMarkerLayer.tsx |
| 2 | Wire onClearStart/onClearDestination in FloorPlanCanvas | 89fd356 | src/client/components/FloorPlanCanvas.tsx |

## Must-Have Verification

| Truth | Status |
|-------|--------|
| Tapping A pin calls clearStart (start=null, activeField='start') | PASS — onClick/onTap on A Group calls onClearStart?.(); clearStart sets both |
| Tapping B pin calls clearDestination (dest=null, activeField='destination') | PASS — onClick/onTap on B Group calls onClearDestination?.(); clearDestination sets both |
| Clearing either pin clears route and closes sheet | PASS — existing useEffect on [routeSelection.start, routeSelection.destination] handles this |
| Pin tap does not bubble to LandmarkLayer | PASS — e.cancelBubble = true on both Group handlers |
| TypeScript passes | PASS — zero errors in modified files (pre-existing NodeDataTable error is out of scope) |
| Biome passes | PASS — zero violations in modified files |

## Key Design Decisions

1. **cancelBubble is mandatory:** A/B pins sit directly above LandmarkLayer nodes. Without `e.cancelBubble = true`, the tap would propagate and trigger `handleLandmarkTap` on the underlying node, re-assigning the cleared slot via `setFromTap`.

2. **hitFunc expands tap target:** `PIN_RADIUS * 2.5` (30px hit radius vs 12px visual radius) matches the LandmarkMarker pattern, making pins reliably tappable on small mobile screens.

3. **Optional props pattern:** Both callbacks are `?: () => void` — backward compatible and safe to use without handlers (current state for any future admin context that renders SelectionMarkerLayer without clear functionality).

4. **No new clearing logic:** The existing `useEffect` in FloorPlanCanvas already watches `[routeSelection.start, routeSelection.destination]` and calls `setRouteResult(null)`, `setSheetOpen(false)`, `setRouteVisible(false)` — no additional wiring needed.

## Deviations from Plan

None — plan executed exactly as written.

### Pre-existing Out-of-Scope Issue (not fixed, logged)

**File:** `src/client/components/admin/NodeDataTable.tsx` line 67
**Error:** TS2379 — `roomNumber: string | undefined` not assignable to `Partial<NavNode>` with `exactOptionalPropertyTypes: true`
**Status:** Pre-existing modification from plan 14.1-01 (admin room number edit) — out of scope for this plan. Will be resolved when 14.1-01 is committed as part of that plan's work.

## Self-Check: PASSED

- FOUND: src/client/components/SelectionMarkerLayer.tsx
- FOUND: src/client/components/FloorPlanCanvas.tsx
- FOUND: .planning/phases/14.1-node-selection-fixes-and-admin-room-number-edit/14.1-02-SUMMARY.md
- FOUND commit 48e791e: feat(14.1-02): add click/tap handlers to SelectionMarkerLayer A/B pins
- FOUND commit 89fd356: feat(14.1-02): wire onClearStart/onClearDestination in FloorPlanCanvas
