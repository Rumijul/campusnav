---
phase: 06-route-visualization-directions
plan: 06
type: execute
wave: 5
depends_on:
  - 06-04
  - 06-05
files_modified:
  - src/client/components/FloorPlanCanvas.tsx
  - src/client/hooks/useMapViewport.ts
autonomous: true
gap_closure: true
requirements:
  - ROUT-03
  - ROUT-05
  - ROUT-06

must_haves:
  truths:
    - "Tapping the back arrow (←) closes the sheet; the compact A→B strip reappears at top; the route line remains visible on the map"
    - "The canvas legend is visible on the map above the sheet while a route is displayed"
    - "Map can be panned freely after route computation"
  artifacts:
    - path: "src/client/components/FloorPlanCanvas.tsx"
      provides: "Fixed back arrow, fixed legend position, canvas pan unblocked"
  key_links:
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/components/DirectionsSheet.tsx"
      via: "onBack prop"
      pattern: "handleSheetBack"
---

<objective>
Fix three confirmed UAT gaps in FloorPlanCanvas:

1. **Back arrow (test 6)** — `handleSheetBack` calls `routeSelection.clearAll()` which nukes the entire route. Per UAT spec, back should close the sheet and return the compact A→B strip while keeping the route visible. Fix: change to `setSheetOpen(false)`.

2. **Legend position (test 5)** — Legend is at `bottom-40` (160px from bottom) which puts it behind the DirectionsSheet peek height of 260px. Fix: move legend above the sheet.

3. **Canvas pan after route (test 1 partial)** — Map panning is blocked after route selection. Diagnose and fix. Primary suspects: (a) `fitToBounds` Konva.Tween leaves Stage in a bad state, (b) RouteLayer's `Konva.Animation` conflicts with Stage drag handlers, (c) `useMapViewport` touch handlers are preventing default touch behavior.

Also: commit the uncommitted 05.1-02 working-tree changes (DirectionsSheet.tsx, SearchOverlay.tsx, FloorPlanCanvas.tsx custom sheet + clear button) which are already correct but never got a commit.
</objective>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Commit the uncommitted 05.1-02 changes</name>
  <files>
    src/client/components/DirectionsSheet.tsx
    src/client/components/SearchOverlay.tsx
    src/client/components/FloorPlanCanvas.tsx
  </files>
  <action>
The working tree has uncommitted changes from phase 05.1-02 (verified, human-approved):
- DirectionsSheet.tsx: Vaul removed, replaced with custom CSS bottom sheet
- SearchOverlay.tsx: clear (✕) button added, sheet-open pill collapse
- FloorPlanCanvas.tsx: handleSheetBack + sheetOpen prop

These are correct and should be committed before making further changes.

1. `git diff --stat` to confirm the three files are the only modified ones
2. `git add src/client/components/DirectionsSheet.tsx src/client/components/SearchOverlay.tsx src/client/components/FloorPlanCanvas.tsx`
3. Commit: `feat(05.1-02): replace Vaul with custom CSS sheet + UX fixes`
  </action>
  <verify>
`git log --oneline -1` shows the commit. `git status` shows working tree clean for these three files.
  </verify>
  <done>
05.1-02 changes committed.
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix back arrow — close sheet without clearing route</name>
  <files>src/client/components/FloorPlanCanvas.tsx</files>
  <action>
Current code (FloorPlanCanvas.tsx):
```ts
const handleSheetBack = useCallback(() => {
  routeSelection.clearAll()
  // sheetOpen and routeResult are cleared by the useEffect watcher above
}, [routeSelection])
```

This clears the entire route. Per UAT test 6, the back arrow should:
- Close the sheet (sheet disappears)
- Return the compact A→B strip (both selections still active)
- Keep the route line visible on the map

Fix:
```ts
const handleSheetBack = useCallback(() => {
  setSheetOpen(false)
}, [])
```

After this change:
- `sheetOpen = false` → DirectionsSheet renders null → sheet closes
- `routeResult` stays (route line remains visible since RouteLayer checks `visible={sheetOpen && ...}` — WAIT)

Check the RouteLayer visibility condition:
```tsx
<RouteLayer
  points={activeRoutePoints}
  color={activeRouteColor}
  visible={sheetOpen && activeRoutePoints.length >= 4}
/>
```

The route line visibility is tied to `sheetOpen`. When `sheetOpen=false`, the route line disappears.

UAT test 6 says "the route line remains visible on the map". So we also need to decouple route line visibility from `sheetOpen`.

Fix: introduce a separate `routeVisible` state:
- Set `routeVisible = true` when route is computed (alongside `setSheetOpen(true)`)
- Set `routeVisible = false` when `routeResult` is cleared (in the existing useEffect)
- Use `routeVisible` for RouteLayer visibility, not `sheetOpen`

Updated RouteLayer line:
```tsx
<RouteLayer
  points={activeRoutePoints}
  color={activeRouteColor}
  visible={routeVisible && activeRoutePoints.length >= 4}
/>
```

Also update the clear useEffect to set `setRouteVisible(false)` when `routeResult` is cleared.

And for `handleRouteTrigger`, add `setRouteVisible(true)` alongside `setSheetOpen(true)`.
  </action>
  <verify>
1. Both selections made → sheet opens, route line appears → ✓
2. Back arrow tapped → sheet closes → compact A→B strip appears at top → route line still visible → ✓
3. X button in compact strip (clearAll) → route line disappears → sheet stays closed → ✓
  </verify>
  <done>
Back arrow closes sheet, route remains visible, compact strip shows.
  </done>
</task>

<task type="auto">
  <name>Task 3: Fix legend position — above the sheet</name>
  <files>src/client/components/FloorPlanCanvas.tsx</files>
  <action>
Current legend positioning:
```tsx
{sheetOpen && routeResult && ... && (
  <div className="absolute bottom-40 right-3 z-20 ...">
```

`bottom-40` = 160px from bottom. The DirectionsSheet peek height is 260px. The legend is hidden behind the sheet.

Fix: Position the legend above the sheet. Since PEEK_HEIGHT = 260 is a constant in DirectionsSheet.tsx, use inline style or a Tailwind class that clears the sheet height.

The legend should also show when `routeVisible` is true (not just `sheetOpen`), since after pressing back the route is still visible.

Updated:
```tsx
{routeVisible && routeResult && (routeResult.standard.found || routeResult.accessible.found) && (
  <div
    className="absolute right-3 z-20 bg-white/90 backdrop-blur-sm rounded-lg shadow px-3 py-2 flex flex-col gap-1.5 text-xs"
    style={{ bottom: sheetOpen ? '276px' : '16px' }}
  >
```

When sheet is open (peek=260px): legend at 276px (260 + 16px gap).
When sheet is closed: legend at 16px (just above bottom edge).

This keeps the legend visible in both states.
  </action>
  <verify>
1. Route computed → legend visible above the sheet (not hidden behind it) → ✓
2. Back arrow pressed → sheet closes → legend drops to bottom-right of map → ✓
  </verify>
  <done>
Legend visible above the sheet while route is displayed.
  </done>
</task>

<task type="auto">
  <name>Task 4: Investigate and fix canvas pan blocking after route</name>
  <files>
    src/client/hooks/useMapViewport.ts
    src/client/components/FloorPlanCanvas.tsx
  </files>
  <action>
Read `src/client/hooks/useMapViewport.ts` fully. Look for:

1. Does `handleDragEnd` or `handleTouchMove` call `stage.draggable(false)` or `e.evt.preventDefault()` in a way that prevents subsequent touches from being recognized as drags?

2. Does `fitToBounds` (in FloorPlanCanvas) use `Konva.Tween` on the Stage node? After a Tween completes, does Konva restore `draggable` to its previous value, or does it reset it?

3. Is there a CSS `touch-action` style on the Stage canvas element or any parent that overrides the default?

**Likely fix A (Tween + draggable):**
If `fitToBounds` uses a Tween, check if adding `onFinish: () => { stage.draggable(true); setStageScale(newScale) }` fixes the issue. The stage should explicitly re-enable draggable after the animation.

**Likely fix B (touch handlers):**
If `handleTouchMove` calls `e.evt.preventDefault()` for all touches (not just multi-touch), single-finger drag gets blocked. Fix: only call `preventDefault()` when `e.evt.touches.length > 1`.

**Likely fix C (RouteLayer Animation):**
The RouteLayer uses `Konva.Animation` which runs at 60fps. Konva Animations run on a layer. If the animation is on the same layer as where drag events are processed, there could be interference. Currently RouteLayer creates its own `<Layer>` — verify it's separate from the main content layer.

Apply whichever fix(es) are confirmed by reading the code. If the root cause cannot be determined from code review alone, add a `console.log` in the `Stage.onDragStart` to confirm whether drag events are firing after route computation. Document findings in the SUMMARY.
  </action>
  <verify>
After fix: select a route → sheet opens → attempt to pan canvas above the sheet → canvas pans smoothly → ✓
  </verify>
  <done>
Canvas pan works after route selection.
  </done>
</task>

<task type="auto">
  <name>Task 5: Quality checks and commit</name>
  <files></files>
  <action>
1. `npx tsc --noEmit` — zero TypeScript errors
2. `npx vitest run src/client/hooks/useRouteDirections.test.ts` — 23/23 pass
3. Commit: `fix(06-06): back arrow closes sheet without clearing route + fix legend position above sheet`
   Include: FloorPlanCanvas.tsx changes (routeVisible state, handleSheetBack, legend position, canvas pan fix)
  </action>
  <verify>
TypeScript clean. Tests pass. Commit present in git log.
  </verify>
  <done>
All checks pass, committed.
  </done>
</task>

</tasks>

<verification>
- Back arrow closes sheet, compact strip reappears, route line stays → UAT test 6 ✓
- Legend visible above sheet → UAT test 5 ✓
- Canvas pan works after route selection → UAT test 1 improvement ✓
- Route line visible even when sheet is closed → UAT test 7 (compact strip X still works to clear) ✓
</verification>

<success_criteria>
- handleSheetBack calls setSheetOpen(false) not clearAll()
- RouteLayer visibility decoupled from sheetOpen via routeVisible state
- Legend positioned above sheet (dynamic bottom based on sheetOpen)
- Canvas pan works after route selection
- TypeScript clean, tests pass
</success_criteria>

<output>
Create `.planning/phases/06-route-visualization-directions/06-06-SUMMARY.md` after completion.
Update STATE.md.
</output>
