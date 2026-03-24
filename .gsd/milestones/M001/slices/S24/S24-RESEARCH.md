# S24 Research — Multi-Floor Direction Dividers

**Researched:** 2026-03-24  
**Scope depth:** Targeted (existing stack/patterns, moderate UI+logic integration)  
**Confidence:** High

## Active Requirements This Slice Owns

- **R004 — Multi-floor direction section dividers**
  - Multi-floor route directions must show floor section headers between steps on different floors.
- **R005 — Floor-change direction includes up/down language**
  - Floor-change steps must explicitly say up/down (example: “up to Floor 3”).

## Skills Discovered

- **Already installed and directly relevant**
  - `react-best-practices`
  - `test`
- **Skill-discovery commands run**
  - `npx skills find "konva"` → no dedicated Konva skill found.
  - `npx skills find "vitest"` → external skills found, but none needed because project already has matching test patterns + installed `test` skill.
- **New skills installed:** none.

### Skill rules applied to this slice

- From `react-best-practices`:
  - `rerender-derived-state-no-effect`: floor section grouping should be derived from `steps` (pure computation / `useMemo`), not stored via effect-driven state.
  - `js-index-maps`: keep floor lookups map-based (`Map`) and avoid repeated linear scans in render paths.
- From `test`:
  - Match existing test style and dependencies; do **not** introduce RTL/jsdom for this slice.

---

## Summary

This slice is mostly additive and localized to the client route-direction pipeline.

Current state:
- `useRouteDirections.ts` already emits floor-change steps, but instruction text is currently **"Take the X to Floor N"** (no up/down language).
- `DirectionsSheet.tsx` renders a **flat** step list (no floor grouping/headers).
- `FloorPlanCanvas.tsx` already builds `floorMap` and passes it into `useRouteDirections`, so no server/API/schema work is needed.

Key missing pieces for S24:
1. Direction-step data needs enough floor context for section rendering.
2. Floor-change instruction builder needs explicit up/down wording.
3. Directions UI needs deterministic grouping + header rendering only for multi-floor routes.

---

## Implementation Landscape (files that matter)

### 1) `src/client/hooks/useRouteDirections.ts` (primary logic seam)

- `DirectionStep` currently has no floor metadata (`instruction`, `icon`, `distanceM`, `durationSec`, `isAccessibleSegment`).
- Floor-change branch exists (`curr.floorId !== next.floorId`) and currently builds:
  - connector icon (`stairs-up/down`, `elevator`, `ramp`)
  - instruction `Take the ${connectorTypeName} to Floor ${floorNumber}`
- This is the best place to:
  - add per-step floor context for section headers (recommended: `floorId` + display-ready `floorNumber`)
  - change floor-change phrase to include **up/down** (R005)

**Important constraint:** `DirectionsSheet` does not have `floorMap`; if section headers need user-facing floor numbers, that display value should be computed here and carried in each step.

### 2) `src/client/components/DirectionsSheet.tsx` (primary UI seam)

- Currently renders `standardDirections.steps.map(...)` and `activeDirections.steps.map(...)` directly (flat list).
- Needs section grouping and floor header rows when route spans >1 floor.
- Should derive grouped sections from steps (pure derivation), not extra component state.

### 3) `src/client/components/FloorPlanCanvas.tsx` (already prepared)

- Already computes `floorMap` and passes it to `useRouteDirections` for both route modes.
- Likely no changes needed for S24 unless planner chooses to pass additional props to `DirectionsSheet` (not required if step carries floor metadata).

### 4) `src/client/hooks/useRouteDirections.test.ts` (main verification surface)

- Existing floor-change tests currently assert old text (`Take the stairs to Floor X`).
- This file should be expanded/updated first (RED) for R005 and floor metadata behavior.

### 5) (Recommended new test seam) section-grouping helper test

- There are currently no component tests in repo and no jsdom/RTL dependency.
- To verify R004 without new test tooling, add a **pure grouping helper** and unit-test it in node environment.
- Helper can live in `useRouteDirections.ts` or `DirectionsSheet.tsx` (exported) — whichever keeps tests simplest.

---

## Findings / Constraints That Affect Planning

1. **No DOM test stack installed** (`@testing-library/react` and `jsdom` are absent).  
   Planner should avoid UI-integration test tooling changes in this slice.

2. **Floor ID != floor number risk**  
   Headers/instructions should not display raw DB `floorId` where a floor number is expected. Use `floorMap` lookup with fallback.

3. **Current fallback behavior for non-connector cross-floor edges is misleading**  
   In `useRouteDirections.ts`, non-connector floor transitions currently fall back to a stairs-flavored instruction path. If touched, ensure this does not mislabel transitions.

4. **Existing baseline test status**  
   `npm test -- src/client/hooks/useRouteDirections.test.ts` currently passes (29 tests), so RED-first changes will be explicit and easy to review.

5. **Out-of-scope but discovered UI gap**  
   `StepIconComponent` has no render cases for `stairs-up`, `stairs-down`, `elevator`, `ramp` (returns `null` via default). This is pre-existing; decide explicitly whether to keep out-of-scope for S24.

---

## Recommended Build/Proof Order (for planner)

1. **R005 first (logic + tests):**
   - Update `useRouteDirections.test.ts` with failing expectations for up/down floor-change language.
   - Implement up/down wording in `generateDirections`.
   - Add/verify floor metadata on steps (needed by R004).

2. **R004 second (grouping + render):**
   - Add pure grouping helper (steps → floor sections).
   - Unit-test grouping helper in node env (no jsdom).
   - Update `DirectionsSheet.tsx` to render floor headers per section when >1 floor present.

3. **Regression pass:**
   - Ensure single-floor routes remain visually unchanged (no extra header noise).
   - Ensure both routes-identical and dual-route tabs use the same grouping behavior.

---

## Verification Plan

Use these commands as acceptance checks:

1. **Targeted directions logic tests**
   - `npm test -- src/client/hooks/useRouteDirections.test.ts`

2. **If helper test file is added**
   - `npm test -- <new helper test file>`

3. **Suite sanity**
   - `npm test`

Success criteria tied to requirements:
- **R005:** floor-change steps include explicit `up` / `down` wording.
- **R004:** multi-floor routes produce grouped sections with floor headers at floor boundaries; single-floor routes do not show extra section headers.
