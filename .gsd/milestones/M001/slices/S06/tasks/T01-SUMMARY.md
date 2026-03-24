---
phase: 05.1-issues-needed-to-be-fixed
plan: 01
subsystem: canvas-interaction, graph-data
tags: [vaul, konva, pointer-events, campus-graph, coordinates, bug-fix]
dependency_graph:
  requires: [06-04-PLAN]
  provides: [FIX-01, FIX-02]
  affects: [DirectionsSheet, RouteLayer, FloorPlanCanvas]
tech_stack:
  added: [use-image@2.x (pre-existing dep, now properly installed)]
  patterns: [Drawer.Overlay pointer-events-none, corridor-aligned normalized coordinates]
key_files:
  modified:
    - src/client/components/DirectionsSheet.tsx
    - src/server/assets/campus-graph.json
    - package.json
    - package-lock.json
decisions:
  - "Drawer.Overlay pointer-events-none: add explicit Overlay element to suppress Vaul's auto-injected backdrop"
  - "Corridor-aligned coordinates: all junction/hallway nodes placed on y=0.5, x=0.32, x=0.68 centerlines"
  - "use-image install: pre-existing missing dep fixed as Rule 3 blocker to unblock tsc --noEmit"
metrics:
  duration: 4 min
  completed: 2026-02-20
  tasks_completed: 2
  files_modified: 4
---

# Phase 5.1 Plan 01: UAT Blocker Fixes — Vaul Backdrop & Graph Coordinates Summary

**One-liner:** Suppressed Vaul's pointer-capturing backdrop via `Drawer.Overlay pointer-events-none` and realigned all 25 campus-graph nodes to corridor centerlines (y=0.5, x=0.32, x=0.68).

## Objective

Fix two UAT blockers discovered during Phase 5+6 testing:
1. **FIX-01** — Vaul's `DirectionsSheet` backdrop (`[data-vaul-overlay]`) blocks all pointer events on the Konva canvas, making map unpannable while route sheet is open.
2. **FIX-02** — `campus-graph.json` node positions don't align with floor plan corridors, causing route lines to visually cut through walls.

## Changes Made

### Task 1: Fix Vaul backdrop blocking Konva canvas pan/drag

**File:** `src/client/components/DirectionsSheet.tsx`

Added `<Drawer.Overlay className="pointer-events-none" />` explicitly inside `Drawer.Portal`, immediately before `Drawer.Content`:

```tsx
<Drawer.Portal>
  {/* Suppress Vaul's auto-injected backdrop — it blocks Konva canvas pan/touch even at opacity:0 */}
  <Drawer.Overlay className="pointer-events-none" />
  {/* Issue 1 fix: pointer-events-none on wrapper, pointer-events-auto on visible content */}
  <Drawer.Content ...>
```

**Root cause:** Vaul 1.1.2 auto-injects a `[data-vaul-overlay]` element when using `Drawer.Portal`. With `snapPoints=[0.35, 0.92]`, Vaul's CSS renders this invisible (opacity:0) but it still covers the full screen and intercepts all pointer/touch events, blocking Konva drag handlers.

**Fix mechanism:** Providing an explicit `Drawer.Overlay` with `pointer-events-none` overrides Vaul's auto-injected backdrop, making it non-blocking while remaining visually invisible.

### Task 2: Realign campus-graph.json node coordinates

**File:** `src/server/assets/campus-graph.json`

Updated all 25 nodes' `x` and `y` fields to corridor-aligned positions. Key changes:

| Node | Before | After | Corridor |
|------|--------|-------|---------|
| junction-a | (0.50, 0.55) | (0.50, 0.50) | Main hallway center |
| junction-b | (0.50, 0.35) | (0.50, 0.32) | Main hallway north branch |
| junction-c | (0.25, 0.55) | (0.32, 0.50) | Left hallway meets main |
| hallway-1 | (0.50, 0.20) | (0.50, 0.22) | North T-junction |
| hallway-2 | (0.75, 0.55) | (0.68, 0.50) | Right hallway meets main |
| stairs-north | (0.08, 0.20) | (0.10, 0.22) | Upper-left off left hallway |
| ramp-west | (0.08, 0.78) | (0.10, 0.72) | Lower-left off left hallway |
| entrance-side | (0.92, 0.60) | (0.92, 0.50) | Right side, main hallway level |
| elevator-north | (0.20, 0.20) | (0.32, 0.18) | Left hallway upper end |
| elevator-south | (0.80, 0.20) | (0.68, 0.18) | Right hallway upper end |

All room, restroom, and landmark nodes also repositioned to doorway positions touching the nearest corridor.

**No edges were modified** — only x/y coordinates on nodes.

### Auto-fix (Rule 3): Install missing use-image dependency

**Files:** `package.json`, `package-lock.json`

`use-image` was referenced in `src/client/hooks/useFloorPlanImage.ts` but was not in `package.json`. This caused `tsc --noEmit` to fail with `error TS2307: Cannot find module 'use-image'`, blocking the plan's TypeScript verification step. Installed via `npm install use-image`.

## Verification Results

| Check | Command | Result |
|-------|---------|--------|
| TypeScript | `npx tsc --noEmit` | ✅ Exit 0, no errors |
| Biome lint | `npx biome check src/client/components/DirectionsSheet.tsx` | ✅ Exit 0 (1 pre-existing warning, not error) |
| JSON valid | `node -e "require('./src/server/assets/campus-graph.json')"` | ✅ Exit 0 |
| Node count | nodes: 25, edges: 30 | ✅ Correct |
| junction-a coords | (0.5, 0.5) | ✅ Correct |
| junction-c coords | (0.32, 0.5) | ✅ Correct |
| hallway-2 coords | (0.68, 0.5) | ✅ Correct |
| Drawer.Overlay | `pointer-events-none` present at line 361 | ✅ Confirmed |

## Decisions Made

1. **Drawer.Overlay explicit override** — Rather than patching CSS or using Vaul internals, adding an explicit `Drawer.Overlay` component is the supported Vaul API approach. It overrides the auto-injected backdrop cleanly and survives Vaul version upgrades.

2. **Corridor centerlines** — Navigation nodes (junctions, hallways) placed exactly on corridor centerlines (main: y=0.5, left: x=0.32, right: x=0.68). Room nodes placed at doorway positions (touching the nearest corridor) rather than room centers. This ensures route lines drawn with `tension=0` (straight segments) stay within hallways.

3. **Coordinates only** — Only `x` and `y` fields updated in campus-graph.json. All edge definitions, weights, accessibility flags, and node metadata left unchanged. This minimizes regression risk.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing `use-image` dependency**
- **Found during:** Task 1 verification (`npx tsc --noEmit`)
- **Issue:** `use-image` imported in `useFloorPlanImage.ts` but not listed in `package.json`. Caused TypeScript error TS2307 blocking the `tsc --noEmit` verification check.
- **Fix:** `npm install use-image`
- **Files modified:** `package.json`, `package-lock.json`
- **Commit:** 46f1b83
- **Note:** Per STATE.md, this was previously fixed in Phase 04-04 UAT but was evidently not committed to package.json at that time.

## Self-Check

**Files exist:**
- [x] `src/client/components/DirectionsSheet.tsx` — modified, `Drawer.Overlay` at line 361
- [x] `src/server/assets/campus-graph.json` — modified, 25 nodes with corrected coordinates
- [x] `package.json` — `use-image` added to dependencies

**Commits:**
- [x] d451f2a — fix(05.1-01): suppress Vaul backdrop blocking Konva canvas pan/drag
- [x] 36a5550 — fix(05.1-01): realign campus-graph.json nodes to floor plan corridors
- [x] 46f1b83 — chore(05.1-01): install missing use-image dependency

## Self-Check: PASSED
