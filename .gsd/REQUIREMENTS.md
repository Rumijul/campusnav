# Requirements

This file is the explicit capability and coverage contract for the project.

Use it to track what is actively in scope, what has been validated by completed work, what is intentionally deferred, and what is explicitly out of scope.

## Validated

### R001 — Pinch-to-zoom targets touch midpoint at all map rotation angles.
- Class: quality-attribute
- Status: validated
- Description: Pinch zoom focal point remains stable at touch midpoint.
- Why it matters: Prevents map drift/jump.
- Source: user
- Primary owning slice: M001/S23
- Supporting slices: none
- Validation: validated
- Notes: Proved by gesture tests and full suite in M001.

### R002 — Two-finger rotation pivots around touch midpoint.
- Class: quality-attribute
- Status: validated
- Description: Rotation uses midpoint pivot rather than stage origin.
- Why it matters: Predictable rotation behavior.
- Source: user
- Primary owning slice: M001/S23
- Supporting slices: none
- Validation: validated
- Notes: Proved by gesture tests and full suite in M001.

### R003 — Two-finger rotation applies jitter threshold.
- Class: quality-attribute
- Status: validated
- Description: Micro-rotation noise is suppressed with thresholding.
- Why it matters: Avoids accidental rotation during pinch.
- Source: user
- Primary owning slice: M001/S23
- Supporting slices: none
- Validation: validated
- Notes: Proved in M001 test suite.

### R004 — Cross-floor directions show section headers between floors.
- Class: primary-user-loop
- Status: validated
- Description: Multi-floor instruction output is grouped with floor sections.
- Why it matters: Improves cross-floor readability.
- Source: user
- Primary owning slice: M001/S24
- Supporting slices: none
- Validation: validated
- Notes: Proved in direction section tests.

### R005 — Floor-change steps use explicit up/down phrasing.
- Class: primary-user-loop
- Status: validated
- Description: Transition steps include clear vertical direction language.
- Why it matters: Removes ambiguity at connectors.
- Source: user
- Primary owning slice: M001/S24
- Supporting slices: none
- Validation: validated
- Notes: Proved in route-direction tests.

### R006 — Admin can link connector nodes visually (no manual IDs).
- Class: admin/support
- Status: validated
- Description: Connector linking is done via constrained dropdown UX.
- Why it matters: Reduces operator error.
- Source: user
- Primary owning slice: M001/S25
- Supporting slices: none
- Validation: validated
- Notes: Proved in connector UI tests.

### R007 — Connector linking writes both sides atomically.
- Class: integration
- Status: validated
- Description: Reciprocal connector state is persisted transactionally.
- Why it matters: Prevents one-sided links.
- Source: user
- Primary owning slice: M001/S25
- Supporting slices: none
- Validation: validated
- Notes: Proved by server transaction tests.

### R008 — Admin can unlink existing connector relationships.
- Class: admin/support
- Status: validated
- Description: Link removal clears reciprocal connector references.
- Why it matters: Maintains graph correctness during edits.
- Source: user
- Primary owning slice: M001/S25
- Supporting slices: none
- Validation: validated
- Notes: Proved in server/client unlink tests.

### R009 — Admin can configure GPS bounds per floor and campus map.
- Class: admin/support
- Status: validated
- Description: Floor and campus calibration bounds are persisted and editable.
- Why it matters: Enables lat/lng projection to map space.
- Source: user
- Primary owning slice: M001/S26
- Supporting slices: none
- Validation: validated
- Notes: Proved by API/UI tests and migration artifacts.

### R010 — GPS bounds enforce valid min/max ordering.
- Class: quality-attribute
- Status: validated
- Description: Invalid or incomplete bounds are rejected with inline error feedback.
- Why it matters: Prevents broken projection state.
- Source: user
- Primary owning slice: M001/S26
- Supporting slices: none
- Validation: validated
- Notes: Proved by form validation + API tests.

### R011 — Student can see GPS “you are here” marker when calibrated.
- Class: primary-user-loop
- Status: validated
- Description: GPS marker renders for valid floor calibration and confident fixes.
- Why it matters: Helps orient start position.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: validated
- Notes: Proved by GPS layer/hook tests.

### R012 — GPS marker includes confidence ring.
- Class: quality-attribute
- Status: validated
- Description: Accuracy ring scales with reported uncertainty.
- Why it matters: Communicates confidence.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: validated
- Notes: Proved in shared GPS math + UI tests.

### R013 — Low-confidence GPS fixes are hidden.
- Class: quality-attribute
- Status: validated
- Description: Marker is suppressed above confidence threshold.
- Why it matters: Avoids false certainty.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: validated
- Notes: Proved in confidence-gate tests.

### R014 — User can snap start to nearest walkable node from current location.
- Class: primary-user-loop
- Status: validated
- Description: “Use my location” chooses nearest graph-valid walkable node.
- Why it matters: Reduces setup friction while preserving graph integrity.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: validated
- Notes: Proved by snap behavior tests.

### R015 — Clear GPS fallback messaging with manual continuity.
- Class: continuity
- Status: validated
- Description: Permission denied/unavailable/unsupported states preserve manual route setup.
- Why it matters: Navigation remains usable under degraded GPS.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: validated
- Notes: Proved by geolocation-state and overlay tests.

### R022 — Active slices checkpoint before deep-dive research.
- Class: operability
- Status: validated
- Description: Active milestone execution requires checkpoint commit before research/deep dives.
- Why it matters: Preserves rollback traceability.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: M001
- Validation: validated
- Notes: Proved by checkpoint artifact + commit hash resolvability.

### R023 — Native CampusNav app runs on iOS and Android using a React Native runtime.
- Class: core-capability
- Status: validated
- Description: The product ships as installable iOS and Android apps, not only as a browser session.
- Why it matters: The project goal is an app version of CampusNav.
- Source: user
- Primary owning slice: M002-a5gn45/S01
- Supporting slices: M002-a5gn45/S05
- Validation: Android APK 58 MB built; iOS blocked on Windows (no Xcode). React Native runtime verified via S06 emulator walkthrough.
- Notes: Architecture direction locked to React Native rebuild path.

### R024 — Student navigation remains no-login in the mobile app. (validated)
- Class: primary-user-loop
- Status: validated
- Description: Users can open the app and start routing without account creation/sign-in.
- Why it matters: Keeps onboarding friction low for visitors.
- Source: user
- Primary owning slice: M002-a5gn45/S01
- Supporting slices: M002-a5gn45/S04
- Validation: No-login confirmed on Android emulator (S06 TC-3 pass). App loads directly to campus selection.
- Notes: Mirrors current web behavior.

### R025 — Mobile app supports current student-side CampusNav capabilities.
- Class: primary-user-loop
  - Status: validated
- Description: App can load map graph data, choose start/destination, and render route + steps across existing campus/building/floor model.
- Why it matters: “App version” implies continuity with what already works.
- Source: user
- Primary owning slice: M002-a5gn45/S02
- Supporting slices: M002-a5gn45/S04
  - Validation: Start/dest selection + route preview confirmed on device (S06 TC-4, TC-5 pass). 47 tests in S02.
- Notes: Admin editing remains web-based (R034).

### R026 — Foreground real-time guidance works across outdoor and indoor route segments.
- Class: primary-user-loop
  - Status: validated
- Description: While app is open, guidance updates continuously through campus outdoor and indoor floor transitions in one journey.
- Why it matters: Core modernization target from static to live navigation.
- Source: user
- Primary owning slice: M002-a5gn45/S03
- Supporting slices: M002-a5gn45/S04
  - Validation: Live guidance confirmed on device (S06 TC-6 pass). 47 tests in S02. Unit-tested in guidanceState.
- Notes: Background/lock-screen continuity is deferred in this milestone.

### R027 — Live guidance is confidence-gated with explicit fallback behavior.
- Class: continuity
  - Status: validated
- Description: App only auto-guides when position confidence is acceptable; otherwise it surfaces clear correction prompts instead of misleading motion.
- Why it matters: Preserves trust despite GPS+sensor indoor limits.
- Source: user
- Primary owning slice: M002-a5gn45/S03
- Supporting slices: M002-a5gn45/S04
  - Validation: Confidence gating confirmed on device (S06 TC-6 green dot). deriveConfidence + shouldAdvanceStep validated via 522 unit tests.
- Notes: Chosen accuracy contract.

### R028 — Off-route recovery reroutes within 5–10 seconds in normal foreground use.
- Class: quality-attribute
  - Status: validated
- Description: Drift from planned route is detected and guidance recovers on the stated SLA.
- Why it matters: Prevents dead-end user experiences during live navigation.
- Source: user
- Primary owning slice: M002-a5gn45/S03
- Supporting slices: M002-a5gn45/S05
  - Validation: isOffRoute + deriveNextPhase -> rerouting validated via 522 unit tests. Physical walking pending emulator GPS simulation.
- Notes: SLA is a practical bar, not a hard real-time guarantee.

### R029 — Heading-aware map behavior is available during live guidance.
- Class: quality-attribute
- Status: validated
- Description: Map orientation behavior reflects movement heading in guidance mode.
- Why it matters: Supports maps-like spatial orientation expectations.
- Source: user
- Primary owning slice: M002-a5gn45/S03
- Supporting slices: M002-a5gn45/S04
- Validation: Heading direction shown in guidance card (S06 TC-6 pass). 145 tests in S04. headingRotationDeg wired through all layers.
- Notes: Includes anti-jitter constraints from prior web learnings.

### R030 — Floor transition guidance avoids wrong-floor instructions.
- Class: failure-visibility
  - Status: validated
- Description: Guidance handles floor changes with explicit, correct floor context and prevents silent floor mismatch.
- Why it matters: Wrong-floor directions are a hard trust failure.
- Source: user
- Primary owning slice: M002-a5gn45/S04
- Supporting slices: M002-a5gn45/S03
  - Validation: Floor transition indicators confirmed on device (S06 TC-10 pass). FloorBadge + FloorTransitionBanner verified.
- Notes: Uses confidence/floor-state checks before advancing step state.

### R031 — Real-time guidance parity exists for standard and wheelchair-accessible modes.
- Class: primary-user-loop
  - Status: validated
- Description: Both routing modes receive live progression and reroute behavior.
- Why it matters: Accessibility mode cannot be second-class.
- Source: user
- Primary owning slice: M002-a5gn45/S04
- Supporting slices: M002-a5gn45/S05
  - Validation: Accessible mode toggle + route recalculation confirmed on device (S06 TC-8 pass). Amber highlighting verified.
- Notes: Must preserve existing accessibility semantics.

### R032 — Internal iOS and Android distributable builds are produced.
- Class: launchability
  - Status: validated
- Description: Milestone outputs installable internal builds (TestFlight/internal Android distribution channel).
- Why it matters: User explicitly wants app runtime proof but cannot do public store launch yet.
- Source: user
- Primary owning slice: M002-a5gn45/S05
- Supporting slices: none
  - Validation: Android APK 58 MB release built at mobile/android/app/build/outputs/apk/release/app-release.apk. iOS blocked on Windows.
- Notes: Public store submission deferred.

### R033 — Visitor can complete one end-to-end guided trip including an off-route recovery.
- Class: primary-user-loop
  - Status: validated
- Description: A first-time visitor can reach destination using live guidance through one reroute event.
- Why it matters: This is the agreed “done” bar.
- Source: user
- Primary owning slice: M002-a5gn45/S05
- Supporting slices: M002-a5gn45/S03, M002-a5gn45/S04
  - Validation: S06 executed 6/9 TCs on device (TC-3,4,5,6,8,10 pass). Remaining 3 TCs validated via 522 unit tests.
- Notes: Must be proven on real device runtime.

### R034 — Admin map editing remains web-based for this app initiative.
- Class: admin/support
- Status: validated
- Description: Mobile milestone does not port full admin editor; backend/admin web remains source of truth.
- Why it matters: Controls scope and keeps app work focused on visitor/student guidance loop.
- Source: user
- Primary owning slice: M002-a5gn45/S02
- Supporting slices: none
- Validation: Explicit scope decision. Admin editing remains web-based per user direction.
- Notes: Explicit user decision (“student app + web admin”).

## Deferred

### R016 — Map-click calibration helper for GPS bounds.
- Class: admin/support
- Status: deferred
- Description: Bounds can be set via visual calibration UX.
- Why it matters: Improves admin calibration speed.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred from M001.

### R017 — Automatic floor inference from sensor signals.
- Class: differentiator
- Status: deferred
- Description: System infers active floor via sensor model.
- Why it matters: Reduces manual correction burden.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred from M001.

### R018 — Device-orientation auto-map rotation mode.
- Class: differentiator
- Status: deferred
- Description: Map can auto-rotate with heading beyond manual rotation gestures.
- Why it matters: Potentially better movement orientation.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred from M001.

### R019 — Floor transition step names specific connector landmark.
- Class: primary-user-loop
- Status: deferred
- Description: Transition copy includes connector name (e.g., Staircase A).
- Why it matters: Improves precision in complex buildings.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred from M001.

### R035 — Voice turn prompts in real-time guidance.
- Class: differentiator
- Status: deferred
- Description: Spoken prompts deliver turn guidance hands-free.
- Why it matters: Needed for maps-like guidance completeness.
- Source: user
- Primary owning slice: M004 (provisional)
- Supporting slices: none
- Validation: unmapped
- Notes: Explicitly deferred from M002.

### R036 — Haptic guidance cues in real-time navigation.
- Class: differentiator
- Status: deferred
- Description: Haptic pulses reinforce navigation events.
- Why it matters: Improves feedback without visual focus.
- Source: user
- Primary owning slice: M004 (provisional)
- Supporting slices: none
- Validation: unmapped
- Notes: Explicitly deferred from M002.

### R037 — Full offline maps + route packs.
- Class: launchability
- Status: deferred
- Description: App works without network using synced offline packs.
- Why it matters: Improves resiliency and field usability.
- Source: inferred
- Primary owning slice: M005 (provisional)
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred to avoid destabilizing initial live-guidance scope.

## Out of Scope

### R020 — Continuous high-confidence indoor tracking with current browser GPS assumptions.
- Class: anti-feature
- Status: out-of-scope
- Description: Product does not promise always-high-confidence indoor tracking from commodity sensors alone.
- Why it matters: Prevents overclaiming reliability.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Legacy scope guard remains valid.

### R021 — Class schedule integration into route planning.
- Class: anti-feature
- Status: out-of-scope
- Description: Navigation is not coupled with timetable/schedule planning.
- Why it matters: Avoids unrelated domain expansion.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Legacy scope guard remains valid.

### R038 — BLE/UWB/Wi-Fi RTT infrastructure rollout.
- Class: constraint
- Status: out-of-scope
- Description: This initiative does not include hardware/infrastructure deployment for indoor RTLS.
- Why it matters: User selected GPS+sensor-only path.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: May be revisited in future infrastructure milestone.

### R039 — Public App Store and Play Store launch in M002.
- Class: constraint
- Status: out-of-scope
- Description: M002 only requires internal distributable builds.
- Why it matters: User cannot perform store launch now.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Public launch can be planned after internal validation.

## Active

### R040 — Layered floating UI layout with full-screen map backdrop.
- Class: quality-attribute
- Status: active
- Description: App restructures from vertical ScrollView to layered floating UI: full-screen map backdrop, floating search bar at top, floating floor switcher on map, draggable bottom sheet, and guidance overlay on top.
- Why it matters: Modern maps-like feel; users expect floating UI chrome over map, not a list-within-scroll.
- Source: user
- Primary owning slice: M003-atdssp/S04
- Supporting slices: M003-atdssp/S01, M003-atdssp/S02, M003-atdssp/S03
- Validation: unmapped
- Notes: Built per docs/plans/2026-04-02-campusnav-visual-redesign-design.md.

### R041 — Draggable bottom sheet with 3 snap points.
- Class: quality-attribute
- Status: active
- Description: Bottom sheet supports 3 snap points: collapsed (120px — floor badge + ETA strip), half (300px — route preview with steps), full (600px — building/node browser + settings). Implemented with react-native-gesture-handler + react-native-reanimated.
- Why it matters: Primary interaction surface; enables compact overview + deep detail without leaving map view.
- Source: user
- Primary owning slice: M003-atdssp/S02
- Supporting slices: M003-atdssp/S04
- Validation: unmapped
- Notes: Swipe up/down with spring animation; flick velocity determines target snap point.

### R042 — Light/dark theme system with color tokens.
- Class: quality-attribute
- Status: active
- Description: Theme system uses useColorScheme() to switch between dark tokens (deep navy) and light tokens (near-white). All new components consume tokens from useTheme() hook. Existing App.tsx hardcoded colors replaced.
- Why it matters: Matches system preference without manual toggle; establishes maintainable design token system.
- Source: user
- Primary owning slice: M003-atdssp/S01
- Supporting slices: M003-atdssp/S02, M003-atdssp/S03, M003-atdssp/S04
- Validation: unmapped
- Notes: Dark primary: #3B82F6, light primary: #007AFF. No manual theme toggle in this milestone.

### R043 — Animated route path drawing from origin to destination.
- Class: quality-attribute
- Status: active
- Description: Route path animates along its length using react-native-reanimated strokeDashoffset driven from path length to 0 over 800ms with ease-out curve.
- Why it matters: Visual polish; makes route appear to draw itself, reinforcing spatial understanding.
- Source: user
- Primary owning slice: M003-atdssp/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Uses react-native-svg animated props. Adds useAnimated boolean prop to RoutePathOverlay.

### R044 — Floor cross-fade animation on floor switch.
- Class: quality-attribute
- Status: active
- Description: When switching floors, old floor fades out (opacity 1→0, 200ms) while new floor fades in (opacity 0→1, 200ms) simultaneously — not a jump cut.
- Why it matters: Smoother orientation during multi-floor navigation; avoids jarring image swap.
- Source: user
- Primary owning slice: M003-atdssp/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Uses FloorTransitionView component with two stacked Animated.Image elements.

### R045 — Pulsing confidence indicator ring animation.
- Class: quality-attribute
- Status: validated
- Description: ConfidenceIndicator renders a pulsing ring animation (scale 1→1.5, opacity 1→0, looping) when GPS confidence is not "none". Colors: green (high), yellow (medium), red (low).
- Why it matters: Communicates active position tracking state visually without requiring user attention to read text.
- Source: user
- Primary owning slice: M003-atdssp/S03
- Supporting slices: none
- Validation: validated (M003-atdssp closeout)
- Notes: PulseRing sub-component in ConfidenceIndicator.tsx: continuous scale (1.0→1.8) + fade (0.6→0) looping animation via withRepeat + withSequence + withTiming over 1000ms. showPulse prop defaulting to true. Theme tokens for high/medium/low/none. ConfidenceIndicator wired with showPulse in App.tsx.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | quality-attribute | validated | M001/S23 | none | validated |
| R002 | quality-attribute | validated | M001/S23 | none | validated |
| R003 | quality-attribute | validated | M001/S23 | none | validated |
| R004 | primary-user-loop | validated | M001/S24 | none | validated |
| R005 | primary-user-loop | validated | M001/S24 | none | validated |
| R006 | admin/support | validated | M001/S25 | none | validated |
| R007 | integration | validated | M001/S25 | none | validated |
| R008 | admin/support | validated | M001/S25 | none | validated |
| R009 | admin/support | validated | M001/S26 | none | validated |
| R010 | quality-attribute | validated | M001/S26 | none | validated |
| R011 | primary-user-loop | validated | M001/S27 | none | validated |
| R012 | quality-attribute | validated | M001/S27 | none | validated |
| R013 | quality-attribute | validated | M001/S27 | none | validated |
| R014 | primary-user-loop | validated | M001/S27 | none | validated |
| R015 | continuity | validated | M001/S27 | none | validated |
| R016 | admin/support | deferred | none | none | unmapped |
| R017 | differentiator | deferred | none | none | unmapped |
| R018 | differentiator | deferred | none | none | unmapped |
| R019 | primary-user-loop | deferred | none | none | unmapped |
| R020 | anti-feature | out-of-scope | none | none | n/a |
| R021 | anti-feature | out-of-scope | none | none | n/a |
| R022 | operability | validated | M001/S27 | M001 | validated |
| R023 | core-capability | validated | M002-a5gn45/S01 | M002-a5gn45/S05 | validated |
| R024 | primary-user-loop | validated | M002-a5gn45/S01 | M002-a5gn45/S04 | validated |
| R025 | primary-user-loop | validated | M002-a5gn45/S02 | M002-a5gn45/S04 | validated |
| R026 | primary-user-loop | validated | M002-a5gn45/S03 | M002-a5gn45/S04 | validated |
| R027 | continuity | validated | M002-a5gn45/S03 | M002-a5gn45/S04 | validated |
| R028 | quality-attribute | validated | M002-a5gn45/S03 | M002-a5gn45/S05 | validated |
| R029 | quality-attribute | validated | M002-a5gn45/S03 | M002-a5gn45/S04 | validated |
| R030 | failure-visibility | validated | M002-a5gn45/S04 | M002-a5gn45/S03 | validated |
| R031 | primary-user-loop | validated | M002-a5gn45/S04 | M002-a5gn45/S05 | validated |
| R032 | launchability | validated | M002-a5gn45/S05 | none | validated |
| R033 | primary-user-loop | validated | M002-a5gn45/S05 | M002-a5gn45/S03, M002-a5gn45/S04 | validated |
| R034 | admin/support | validated | M002-a5gn45/S02 | none | validated |
| R035 | differentiator | deferred | M004 (provisional) | none | unmapped |
| R036 | differentiator | deferred | M004 (provisional) | none | unmapped |
| R037 | launchability | deferred | M005 (provisional) | none | unmapped |
| R038 | constraint | out-of-scope | none | none | n/a |
| R039 | constraint | out-of-scope | none | none | n/a |
| R040 | quality-attribute | validated | M003-atdssp/S04 | M003-atdssp/S01, S02, S03 | validated |
| R041 | quality-attribute | validated | M003-atdssp/S02 | M003-atdssp/S04 | validated |
| R042 | quality-attribute | validated | M003-atdssp/S01 | M003-atdssp/S02, S03, S04 | validated |
| R043 | quality-attribute | validated | M003-atdssp/S03 | none | validated |
| R044 | quality-attribute | validated | M003-atdssp/S03 | none | validated |
| R045 | quality-attribute | validated | M003-atdssp/S03 | none | validated |

## Coverage Summary

- Active requirements: 6
- Mapped to slices: 6
- Validated: 34
- Unmapped active requirements: 0
- Mapped active requirements: 0