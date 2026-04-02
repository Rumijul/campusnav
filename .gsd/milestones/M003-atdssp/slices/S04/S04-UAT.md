# S04: App.tsx Integration + Final Wiring — UAT

**Milestone:** M003-atdssp
**Written:** 2026-04-02T13:38:41.252Z

## TC-1: Full layered UI renders on app load
- Expected: Full-screen map backdrop, floating search bar pill at top, floor switcher top-right, bottom sheet at bottom (~120px), no ScrollView, no telemetry text

## TC-2: Bottom sheet snaps between 3 points
- Drag up → snaps to half (~300px) and full (~600px) with spring animation
- Flick down → snaps to collapsed directly

## TC-3: Search renders results in bottom sheet
- Type partial name (e.g. "lib") → results grouped by building → floor, bottom sheet auto-snaps up

## TC-4: Route preview shows when start + destination selected
- Select start then destination → animated route path draws, step cards show with floor headers, Start Guidance visible

## TC-5: Guidance starts and confidence indicator appears
- Tap Start Guidance → pulsing ring top-right, LiveGuidanceOverlay shows current instruction

## TC-6: Floor switcher cross-fades floors
- Tap different floor → old floor fades out, new floor fades in (~200ms), path re-renders

## TC-7: Accessible mode toggle in full bottom sheet
- Toggle accessible mode → route recalculates, elevator path replaces stairs path

## TC-8: Theme applies (light/dark)
- Toggle system dark/light → all UI chrome uses matching theme tokens, no hardcoded colors

## TC-9: TypeScript typecheck
- `npx tsc --noEmit` → exit 0

## TC-10: Test suite
- `npm test` → 522/522 pass, 0 suites fail
