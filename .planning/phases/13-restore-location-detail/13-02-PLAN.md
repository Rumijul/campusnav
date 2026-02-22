---
phase: 13-restore-location-detail
plan: 02
type: execute
wave: 2
depends_on:
  - 13-01
files_modified:
  - src/client/components/FloorPlanCanvas.tsx
autonomous: true
requirements:
  - ROUT-07

must_haves:
  truths:
    - "Tapping a landmark opens LocationDetailSheet showing the node's details"
    - "Route selection (setFromTap) still works — A/B pins are placed on landmark tap"
    - "When a route is computed (both A and B set), the detail sheet closes automatically"
    - "The canvas legend bottom position accounts for detail sheet open state"
    - "LocationDetailSheet is rendered in FloorPlanCanvas below DirectionsSheet in DOM order"
  artifacts:
    - path: "src/client/components/FloorPlanCanvas.tsx"
      provides: "Wired detail sheet state and dual-action landmark tap handler"
      contains: "detailNode"
  key_links:
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/components/LocationDetailSheet.tsx"
      via: "import + JSX render with detailNode prop"
      pattern: "LocationDetailSheet"
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "routeSelection.setFromTap"
      via: "handleLandmarkTap combined handler"
      pattern: "handleLandmarkTap.*setDetailNode.*setFromTap|setFromTap.*setDetailNode"
---

<objective>
Wire LocationDetailSheet into FloorPlanCanvas.tsx: add detailNode state, create dual-action landmark tap handler, auto-close detail when route triggers, update legend bottom offset, and render the sheet.

Purpose: Connect the Plan 01 component into the existing tap flow. Phase 5's route selection must remain intact — tapping a landmark now does BOTH: shows details AND feeds the route selection.

Output: Modified FloorPlanCanvas.tsx with ROUT-07 fully wired
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@src/client/components/FloorPlanCanvas.tsx
@.planning/phases/13-restore-location-detail/13-01-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add detailNode state and dual-action tap handler to FloorPlanCanvas</name>
  <files>src/client/components/FloorPlanCanvas.tsx</files>
  <action>
Edit src/client/components/FloorPlanCanvas.tsx. Make the following targeted changes:

**1. Add import at top (after existing imports):**
```typescript
import { LocationDetailSheet } from './LocationDetailSheet'
```

**2. Add detailNode state after existing useState declarations (after the routeVisible state):**
```typescript
// detailNode — tracks which landmark is being viewed in the detail sheet
const [detailNode, setDetailNode] = useState<NavNode | null>(null)
```

**3. Add handleLandmarkTap callback (after the existing handleSheetBack callback):**
```typescript
/** Combined landmark tap handler: show detail sheet AND feed route selection */
const handleLandmarkTap = useCallback(
  (node: NavNode) => {
    setDetailNode(node)
    routeSelection.setFromTap(node)
  },
  [routeSelection],
)
```

**4. Add useEffect to auto-close detail sheet when a route is computed (after the existing useEffect that clears route on selection change):**
```typescript
// Close detail sheet when both endpoints are set and route is triggered
useEffect(() => {
  if (routeSelection.start !== null && routeSelection.destination !== null) {
    setDetailNode(null)
  }
}, [routeSelection.start, routeSelection.destination])
```

**5. Update LandmarkLayer onSelectNode prop** (currently line ~321):
Change:
```typescript
onSelectNode={routeSelection.setFromTap}
```
To:
```typescript
onSelectNode={handleLandmarkTap}
```

**6. Update the canvas legend bottom calculation** (currently around line ~384):
Change:
```typescript
style={{ bottom: sheetOpen ? '276px' : '16px' }}
```
To:
```typescript
style={{ bottom: sheetOpen ? '276px' : detailNode !== null ? '196px' : '16px' }}
```
(196 = PEEK_HEIGHT 180 + 16px gap)

**7. Add LocationDetailSheet render** — place it BEFORE the DirectionsSheet render so that DirectionsSheet (z-50) renders on top in DOM order. Insert before the `<DirectionsSheet` JSX:
```tsx
<LocationDetailSheet
  node={detailNode}
  onClose={() => setDetailNode(null)}
/>
```

Do not change any other logic. The `routeSelection.setFromTap` behavior is preserved via handleLandmarkTap. The existing useEffect that clears route when selections are removed (lines ~209-215) is unchanged.
  </action>
  <verify>
1. `npx biome check src/client/components/FloorPlanCanvas.tsx` — zero errors
2. `npx tsc --noEmit` — zero type errors
3. `npm run dev` starts without console errors
4. Verify in browser: tap a landmark → LocationDetailSheet peeks at bottom with landmark name visible
5. Verify: tap A location, tap B location → detail sheet closes, route computed, DirectionsSheet opens
  </verify>
  <done>
FloorPlanCanvas.tsx compiles cleanly. Landmark tap opens detail sheet AND assigns A/B route pin. When both A and B are set, detail sheet closes. Directions sheet renders on top of detail sheet when both are visible. Legend offset updates correctly.
  </done>
</task>

</tasks>

<verification>
1. `npx biome check src/client/components/FloorPlanCanvas.tsx` — exits 0
2. `npx tsc --noEmit` — exits 0
3. FloorPlanCanvas.tsx imports LocationDetailSheet
4. `grep -n "handleLandmarkTap" src/client/components/FloorPlanCanvas.tsx` — shows the combined handler and its use in LandmarkLayer
5. `grep -n "detailNode" src/client/components/FloorPlanCanvas.tsx` — shows state declaration, useEffect, legend calc, and JSX render
6. `grep -n "LocationDetailSheet" src/client/components/FloorPlanCanvas.tsx` — shows import and JSX render
</verification>

<success_criteria>
FloorPlanCanvas.tsx:
- Imports LocationDetailSheet from './LocationDetailSheet'
- Has `detailNode` useState initialized to null
- Has `handleLandmarkTap` useCallback that calls both setDetailNode and routeSelection.setFromTap
- Has useEffect that sets detailNode to null when both start and destination are non-null
- LandmarkLayer onSelectNode={handleLandmarkTap} (not routeSelection.setFromTap directly)
- LocationDetailSheet rendered with node={detailNode} and onClose={() => setDetailNode(null)}
- DirectionsSheet rendered after LocationDetailSheet (so it appears above in z-stack)
- Legend bottom: 276px when sheetOpen, 196px when detailNode open, 16px otherwise
- Zero Biome errors, zero TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/phases/13-restore-location-detail/13-02-SUMMARY.md`
</output>
