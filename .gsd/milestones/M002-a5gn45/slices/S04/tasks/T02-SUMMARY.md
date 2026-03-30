---
id: T02
parent: S04
milestone: M002-a5gn45
provides: []
requires: []
affects: []
key_files: ["mobile/routing/guidanceState.ts", "mobile/hooks/useGuidanceSession.ts", "mobile/components/guidance/LiveGuidanceOverlay.tsx", "mobile/App.tsx", "mobile/routing/guidanceState.test.ts"]
key_decisions: ["currentFloorId initialized to null in idle state, updated on each position fix via snappedRecord.floorId", "previousFloorIdRef tracks prior floor ID; floor-transition log fires only on genuine crossings (both non-null and different)", "FloorTransitionBanner uses useRef inside the component body for prevFloorId tracking — state-free display updates", "stopGuidance resets currentFloorId to null to match idle semantics", "deriveFloorContext helper extracts floorId from GuidanceState snapshot for testability", "previousFloorIdRef pattern for detecting state boundary crossings in hooks"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "TypeScript: npx tsc --noEmit returned 0 errors. Targeted unit tests: npx vitest run mobile/routing/guidanceState.test.ts mobile/hooks/useGuidanceSession.test.ts mobile/map/mapTransform.test.ts returned 101 passed across 3 files. All gates pass."
completed_at: 2026-03-30T13:18:31.524Z
blocker_discovered: false
---

# T02: Floor-aware guidance state (currentFloorId) and overlay (FloorBadge, FloorTransitionBanner, floor context) wired across guidanceState, useGuidanceSession, LiveGuidanceOverlay, and App.tsx

> Floor-aware guidance state (currentFloorId) and overlay (FloorBadge, FloorTransitionBanner, floor context) wired across guidanceState, useGuidanceSession, LiveGuidanceOverlay, and App.tsx

## What Happened
---
id: T02
parent: S04
milestone: M002-a5gn45
key_files:
  - mobile/routing/guidanceState.ts
  - mobile/hooks/useGuidanceSession.ts
  - mobile/components/guidance/LiveGuidanceOverlay.tsx
  - mobile/App.tsx
  - mobile/routing/guidanceState.test.ts
key_decisions:
  - currentFloorId initialized to null in idle state, updated on each position fix via snappedRecord.floorId
  - previousFloorIdRef tracks prior floor ID; floor-transition log fires only on genuine crossings (both non-null and different)
  - FloorTransitionBanner uses useRef inside the component body for prevFloorId tracking — state-free display updates
  - stopGuidance resets currentFloorId to null to match idle semantics
  - deriveFloorContext helper extracts floorId from GuidanceState snapshot for testability
  - previousFloorIdRef pattern for detecting state boundary crossings in hooks
duration: ""
verification_result: passed
completed_at: 2026-03-30T13:18:31.524Z
blocker_discovered: false
---

# T02: Floor-aware guidance state (currentFloorId) and overlay (FloorBadge, FloorTransitionBanner, floor context) wired across guidanceState, useGuidanceSession, LiveGuidanceOverlay, and App.tsx

**Floor-aware guidance state (currentFloorId) and overlay (FloorBadge, FloorTransitionBanner, floor context) wired across guidanceState, useGuidanceSession, LiveGuidanceOverlay, and App.tsx**

## What Happened

Extended the guidance state machine with floor tracking and updated the live overlay with floor-aware UI components. Added `currentFloorId: number | null` to the `GuidanceState` interface and the `deriveFloorContext(state)` pure helper function in `guidanceState.ts`. Updated `useGuidanceSession` to derive `currentFloorId` from `snappedRecord.floorId` on each position fix, track the previous floor via `previousFloorIdRef`, and emit `console.log('[Guidance] floor-transition', { from, to })` on genuine floor crossings. The ref is initialized in `startGuidance` and `confirmPosition`, and reset to null in `stopGuidance`. Extended `LiveGuidanceOverlayProps` with optional `floorId` and `floorMap` props. Added `FloorBadge` sub-component (shows "Floor N" chip below the step row), `FloorTransitionBanner` (full-width blue toast shown for 2500 ms when floor changes), and floor context text in `LowConfidenceBanner`. Updated `App.tsx` to wire `floorId` and `floorMap` from `graph.floorById`. Added 6 new floor-tracker tests for `deriveFloorContext`.

## Verification

TypeScript: npx tsc --noEmit returned 0 errors. Targeted unit tests: npx vitest run mobile/routing/guidanceState.test.ts mobile/hooks/useGuidanceSession.test.ts mobile/map/mapTransform.test.ts returned 101 passed across 3 files. All gates pass.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 5000ms |
| 2 | `npx vitest run mobile/routing/guidanceState.test.ts mobile/hooks/useGuidanceSession.test.ts mobile/map/mapTransform.test.ts` | 0 | ✅ pass (101 tests, 3 files) | 247ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `mobile/routing/guidanceState.ts`
- `mobile/hooks/useGuidanceSession.ts`
- `mobile/components/guidance/LiveGuidanceOverlay.tsx`
- `mobile/App.tsx`
- `mobile/routing/guidanceState.test.ts`


## Deviations
None.

## Known Issues
None.
