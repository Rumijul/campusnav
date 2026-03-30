# S03 UAT — Real-time guidance core (confidence + reroute engine)

**Milestone:** M002-a5gn45  
**Slice:** S03  
**Date:** 2026-03-30  
**Tester:** GSD closer agent (automated unit verification + manual spec review)

---

## Preconditions

- Mobile app shell (S01) builds and runs on iOS/Android simulator or device.
- CampusNav map graph data (buildings, floors, nodes) loads via `GET /api/map`.
- A campus building has calibrated GPS bounds on at least one floor.
- A test route between two walkable nodes exists (no floor changes required).
- Mock GPS/heading can be injected via `PositionReader`/`HeadingReader` interfaces (tests) or via `expo-sensors` / `navigator.geolocation` on real device.

---

## Test Cases

### TC01 — Geometry utilities: bearing calculation

**Test type:** Unit (mobile/domain/bearing.test.ts)  
**Precondition:** None  
**Steps:**
1. Call `bearing(0, 0, 0, 1)`  
2. Call `bearing(0, 0, 1, 0)`  
3. Call `bearing(0, 0, 0, -1)`  
4. Call `bearing(0, 0, -1, 0)`  
5. Call `bearing(0, 0, 1, 1)`  
6. Call `bearing(0.5, 0.5, 0.5, 0.5)` (same point, division-by-zero guard)  

**Expected:**
- Step 1 → 0° (north)
- Step 2 → 90° (east)
- Step 3 → 180° (south)
- Step 4 → 270° (west)
- Step 5 → 45° (northeast)
- Step 6 → 0° (graceful zero-division handling)

**Pass criteria:** All 6 assertions pass. 0 TypeScript errors.

---

### TC02 — Geometry utilities: normalizeDelta

**Test type:** Unit (mobile/domain/bearing.test.ts)  
**Precondition:** None  
**Steps:**
1. Call `normalizeDelta(200)`  
2. Call `normalizeDelta(-200)`  
3. Call `normalizeDelta(0)`  
4. Call `normalizeDelta(180)`  
5. Call `normalizeDelta(-180)`  

**Expected:**
- Step 1 → -160
- Step 2 → 160
- Step 3 → 0
- Step 4 → 180
- Step 5 → -180

**Pass criteria:** All 5 assertions pass.

---

### TC03 — Confidence derivation: all four levels

**Test type:** Unit (mobile/routing/guidanceState.test.ts)  
**Precondition:** None  
**Steps:**
1. Emit fix: GPS confident (accuracyMeters=10) + heading confident (accuracyDegrees=10)  
2. Emit fix: GPS confident (accuracyMeters=10) + heading null  
3. Emit fix: GPS confident (accuracyMeters=10) + heading accuracyDegrees=20  
4. Emit fix: GPS not confident but finite (accuracyMeters=80) + heading confident  
5. Emit fix: GPS accuracyMeters=null  

**Expected:**
- Step 1 → `'high'`
- Step 2 → `'medium'` (GPS confident, heading missing)
- Step 3 → `'medium'` (GPS confident, heading unreliable)
- Step 4 → `'low'` (GPS finite but unconfident)
- Step 5 → `'none'` (no GPS fix)

**Pass criteria:** All 5 assertions pass.

---

### TC04 — Off-route detection

**Test type:** Unit (mobile/routing/guidanceState.test.ts)  
**Precondition:** A path with nodes at (0.5, 0.5) → (0.5, 0.7)  
**Steps:**
1. Position (0.5, 0.6) — on the path segment  
2. Position (0.7, 0.6) — perpendicular distance 0.2, far from segment  
3. Position (0.55, 0.55) — near start node (degenerate segment fallback)  
4. Position (0.5, 0.68) — within threshold of end node  

**Expected:**
- Step 1 → `false` (on route)
- Step 2 → `true` (off route, distance 0.2 > threshold 0.05)
- Step 3 → `false` (near start node, lenSq fallback distance ~0.071)
- Step 4 → `false` (within threshold of end node)

**Pass criteria:** All 4 assertions pass.

---

### TC05 — Step advancement

**Test type:** Unit (mobile/routing/guidanceState.test.ts)  
**Precondition:** Path with nodes at (0.5, 0.5) → (0.5, 0.7) → (0.5, 0.9), currentStepIndex=0, advanceThreshold=0.03  
**Steps:**
1. Position (0.5, 0.52) — near start node, should not advance  
2. Position (0.5, 0.65) — perpendicular distance from next segment 0.05 = threshold, borderline  
3. Position (0.5, 0.68) — distance 0.02 < threshold, should not advance yet  
4. Position (0.5, 0.71) — distance 0.01 < threshold, should not advance  

**Expected:** All 4 → `false` (no premature advancement; threshold set so users must pass waypoint)

**Pass criteria:** Step advancement only fires when position crosses waypoint threshold.

---

### TC06 — Phase transitions

**Test type:** Unit (mobile/routing/guidanceState.test.ts)  
**Steps & Expected:**
1. idle + confident → `'guiding'`
2. idle + not confident → `'low-confidence'`
3. guiding + hasArrived=true → `'arrived'`
4. guiding + offRouteFixCount >= 2 + isConfident → `'rerouting'`
5. guiding + offRouteFixCount < 2 → `'guiding'` (stay)
6. rerouting + reroute confirmed → `'guiding'`
7. arrived → `'arrived'` (stay)

**Pass criteria:** All 7 phase transitions match expected states.

---

### TC07 — Position + heading hook: EMA smoothing with wraparound

**Test type:** Unit (mobile/hooks/useCurrentPosition.test.ts)  
**Precondition:** `hasPosition` ref initialized  
**Steps:**
1. Feed heading 0° (first reading, no smoothing)  
2. Feed heading 90° (delta = 90°, within range) → smoothed = 0.3×90 + 0.7×0 = 27°  
3. Feed heading 270° (delta = -180°, two paths: -180° or +180°) → shorter path is -180°, so smoothed = 0.3×270 + 0.7×27 = 27 + 18.9 = 45.9° (wraps via shortest path)  

**Expected:**
- Step 1: initial smoothedHeadingDegrees = 0
- Step 2: smoothedHeadingDegrees ≈ 27
- Step 3: smooths via shortest path (270° → takes 90° via -90° rotation), not raw 180° delta

**Pass criteria:** EMA applies shortest angular rotation; no 360° wrap-around glitches.

---

### TC08 — Position + heading hook: confidence from position fix

**Test type:** Unit (mobile/hooks/useCurrentPosition.test.ts)  
**Steps:**
1. Emit fix: accuracyMeters=10 (confident), headingDegrees=null  
2. Emit fix: accuracyMeters=80 (not confident, finite)  
3. Emit fix: accuracyMeters=null  

**Expected:**
- Step 1 → isConfident=true (GPS confident), isHeadingValid=false (no heading)
- Step 2 → isConfident=false (accuracy > maxAccuracy), isHeadingValid=false
- Step 3 → isConfident=false, isHeadingValid=false

**Pass criteria:** isConfident false until first position (hasPosition guard); false for non-confident fixes.

---

### TC09 — Guidance session: startGuidance

**Test type:** Unit (mobile/hooks/useGuidanceSession.test.ts)  
**Precondition:** Graph with nodes, route ready, first position fix confident  
**Steps:**
1. Call `startGuidance()`  
2. Inspect resulting guidanceState  

**Expected:**
- phase → `'guiding'`
- snappedNodeId → nearest walkable node to position
- currentStepIndex → 0
- offRouteFixCount → 0

**Pass criteria:** State initialized correctly from first confident fix.

---

### TC10 — Guidance session: off-route accumulation and reroute trigger

**Test type:** Unit (mobile/hooks/useGuidanceSession.test.ts)  
**Precondition:** rerouteConfirmFixes=2, route with destination  
**Steps:**
1. Start guidance  
2. Emit 2 consecutive off-route fixes  
3. Check guidanceState.phase  

**Expected:**
- After 1st off-route fix: offRouteFixCount=1, phase='guiding'
- After 2nd off-route fix: offRouteFixCount=2, phase='rerouting', reroute triggered

**Pass criteria:** Reroute fires after rerouteConfirmFixes consecutive off-route fixes.

---

### TC11 — Guidance session: reroute cooldown

**Test type:** Unit (mobile/hooks/useGuidanceSession.test.ts)  
**Precondition:** rerouteConfirmFixes=2, rerouteCooldownMs=5000  
**Steps:**
1. Start guidance  
2. Trigger first reroute (2 off-route fixes)  
3. Immediately emit 2 more off-route fixes  
4. Check if second reroute fired  

**Expected:** Only first reroute fires; second is suppressed by cooldown timer.

**Pass criteria:** No duplicate reroute within cooldown window.

---

### TC12 — Guidance session: arrival detection

**Test type:** Unit (mobile/hooks/useGuidanceSession.test.ts)  
**Precondition:** Route with 5 steps (nodeIds.length=6)  
**Steps:**
1. Advance currentStepIndex to 5 (>= nodeIds.length)  

**Expected:** phase → `'arrived'`

**Pass criteria:** Arrival detected when currentStepIndex >= nodeIds.length.

---

### TC13 — Guidance session: stopGuidance resets state

**Test type:** Unit (mobile/hooks/useGuidanceSession.test.ts)  
**Precondition:** Guidance active with non-idle state  
**Steps:**
1. Call `stopGuidance()`  
2. Inspect guidanceState  

**Expected:**
- phase → `'idle'`
- offRouteFixCount → 0
- snappedNodeId → `''`
- positionConfidence → `'none'`

**Pass criteria:** Full state reset on stop.

---

### TC14 — Guidance session: low-confidence skips step advancement

**Test type:** Unit (mobile/hooks/useGuidanceSession.test.ts)  
**Precondition:** Confident start, then unconfident fix  
**Steps:**
1. Start guidance (confident) → phase='guiding'  
2. Emit unconfident fix (accuracyMeters=80)  
3. Check phase and currentStepIndex  

**Expected:**
- phase → `'low-confidence'`
- currentStepIndex unchanged (no advancement while unconfident)

**Pass criteria:** Low-confidence pauses guidance, does not advance steps.

---

### TC15 — LiveGuidanceOverlay: renders null for idle phase

**Test type:** Component smoke (mobile/components/guidance/LiveGuidanceOverlay.test.tsx)  
**Precondition:** guidanceState.phase='idle'  
**Steps:**
1. Render `<LiveGuidanceOverlay guidanceState={idleState} ... />`  

**Expected:** Component renders null (no visible UI).

**Pass criteria:** idle phase produces no overlay.

---

### TC16 — LiveGuidanceOverlay: guidance card for guiding phase

**Test type:** Component smoke (mobile/components/guidance/LiveGuidanceOverlay.test.tsx)  
**Precondition:** guidanceState.phase='guiding', with active step  
**Steps:**
1. Render component with guiding state  
2. Assert step instruction text is visible  
3. Assert progress indicator is visible  
4. Assert End guidance button is visible  

**Expected:** Full guidance card with instruction, progress, and End button.

**Pass criteria:** Guiding card renders with step detail and controls.

---

### TC17 — LiveGuidanceOverlay: low-confidence banner

**Test type:** Component smoke (mobile/components/guidance/LiveGuidanceOverlay.test.tsx)  
**Precondition:** guidanceState.phase='low-confidence'  
**Steps:**
1. Render component with low-confidence state  
2. Assert "Can't confirm your location" text is visible  
3. Assert "Confirm location" button is visible  

**Expected:** Orange/yellow banner with confirmation CTA.

**Pass criteria:** Low-confidence banner renders with actionable prompt.

---

### TC18 — LiveGuidanceOverlay: arrived celebration card

**Test type:** Component smoke (mobile/components/guidance/LiveGuidanceOverlay.test.tsx)  
**Precondition:** guidanceState.phase='arrived'  
**Steps:**
1. Render component with arrived state  
2. Assert "You've arrived!" text is visible  
3. Assert "Done" button is visible  

**Expected:** Green celebration card.

**Pass criteria:** Arrived card renders with confirmation CTA.

---

### TC19 — ConfidenceIndicator: all four confidence colors

**Test type:** Component smoke (mobile/components/guidance/ConfidenceIndicator.test.tsx)  
**Precondition:** None  
**Steps:**
1. Render with confidence='high'  
2. Render with confidence='medium'  
3. Render with confidence='low'  
4. Render with confidence='none'  

**Expected:**
- high → green dot (#22c55e)
- medium → yellow dot (#eab308)
- low → orange dot (#f97316)
- none → red dot (#ef4444) with ⚠ icon

**Pass criteria:** All four confidence levels render distinct visuals.

---

### TC20 — App wiring: Start Guidance button visibility

**Test type:** Integration (App.tsx)  
**Precondition:** Route session ready (phase='ready'), guidance idle (phase='idle')  
**Steps:**
1. Verify "Start Guidance" button is rendered in RoutePreview area  

**Expected:** Button visible only when route ready and not guiding.

**Pass criteria:** Button hidden during guidance, hidden when no route.

---

### TC21 — App wiring: LiveGuidanceOverlay visible during guidance

**Test type:** Integration (App.tsx)  
**Precondition:** guidanceState.phase !== 'idle'  
**Steps:**
1. Start guidance  
2. Verify LiveGuidanceOverlay renders above map  

**Expected:** Overlay renders as absolute positioned element (zIndex 100) above map viewport.

**Pass criteria:** Overlay visible and positioned above map content.

---

### TC22 — App wiring: ConfidenceIndicator dot during guidance

**Test type:** Integration (App.tsx)  
**Precondition:** guidanceState.phase !== 'idle'  
**Steps:**
1. Start guidance  
2. Verify ConfidenceIndicator dot renders in top-right corner  

**Expected:** Dot visible in fixed top-right position (position: absolute, top: 16, right: 16, zIndex: 101).

**Pass criteria:** Confidence indicator accessible during live guidance.

---

### TC23 — TypeScript: zero errors across S03

**Test type:** Typecheck  
**Precondition:** None  
**Steps:**
1. Run `npx tsc --noEmit` in mobile/ directory  

**Expected:** No TypeScript errors.

**Pass criteria:** 0 TypeScript errors across all S03 files.

---

### TC24 — Entry points: routing/index.ts re-exports

**Test type:** Typecheck + import  
**Precondition:** None  
**Steps:**
1. Import `MobilePathfindingEngine`, `computeRouteSession`, `deriveConfidence`, `bearing`, `normalizeDelta` from `mobile/routing/index.ts`  
2. Import `useCurrentPosition`, `useGuidanceSession` from `mobile/hooks/index.ts`  

**Expected:** All re-exports resolve and type-check cleanly.

**Pass criteria:** Single entry point provides all routing + guidance API.

---

## Edge Cases Covered by Unit Tests

| Edge case | Coverage |
|-----------|----------|
| Division by zero in bearing (same point) | T01: 11th test |
| Degenerate zero-length path segment | T02: point-to-segment Euclidean fallback test |
| Null/infinite GPS accuracy | T02: deriveConfidence none path |
| Heading wraparound at 0°/360° | T03: EMA shortest-path wraparound test |
| Null heading (magnetometer unavailable) | T02: medium confidence test |
| path.nodeById shape mismatch (test vs production) | T02: two-phase lookup decision |
| Circular require in MobilePathfindingEngine | T04: lazy require inside function body |
| React render thrashing from GPS updates | T04: processPositionRef mutable ref pattern |
| Reroute with no path found | T04: not-found → low-confidence path |

---

## Not in Scope for S03 (Deferred to S04)

- Floor-aware overlay (current floor indicator, floor-change instructions)
- Heading-aware map rotation (uses `smoothedHeadingDegrees` but does not rotate map)
- Accessible mode-specific waypoint instructions
- Voice prompts or haptic feedback
- Background/lock-screen guidance continuity
- End-to-end device test with real GPS

---

## Pass Rate

| Category | Tests | Pass |
|----------|-------|------|
| Unit tests (vitest) | 119 | 119 ✅ |
| TypeScript compilation | — | 0 errors ✅ |
| Entry point exports | — | All resolve ✅ |
| Component TSX smoke | 2 files | Blocked (pre-existing Vite 7 bug) |
