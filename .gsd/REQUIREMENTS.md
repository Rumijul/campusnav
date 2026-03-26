# Requirements

This file is the explicit capability and coverage contract for the project.

Use it to track what is actively in scope, what has been validated by completed work, what is intentionally deferred, and what is explicitly out of scope.

## Active

### R023 — Native CampusNav app runs on iOS and Android using a React Native runtime.
- Class: core-capability
- Status: active
- Description: The product ships as installable iOS and Android apps, not only as a browser session.
- Why it matters: The project goal is an app version of CampusNav.
- Source: user
- Primary owning slice: M002-a5gn45/S01
- Supporting slices: M002-a5gn45/S05
- Validation: mapped
- Notes: Architecture direction locked to React Native rebuild path.

### R024 — Student navigation remains no-login in the mobile app.
- Class: primary-user-loop
- Status: active
- Description: Users can open the app and start routing without account creation/sign-in.
- Why it matters: Keeps onboarding friction low for visitors.
- Source: user
- Primary owning slice: M002-a5gn45/S01
- Supporting slices: M002-a5gn45/S04
- Validation: mapped
- Notes: Mirrors current web behavior.

### R025 — Mobile app supports current student-side CampusNav capabilities.
- Class: primary-user-loop
- Status: active
- Description: App can load map graph data, choose start/destination, and render route + steps across existing campus/building/floor model.
- Why it matters: “App version” implies continuity with what already works.
- Source: user
- Primary owning slice: M002-a5gn45/S02
- Supporting slices: M002-a5gn45/S04
- Validation: mapped
- Notes: Admin editing remains web-based (R034).

### R026 — Foreground real-time guidance works across outdoor and indoor route segments.
- Class: primary-user-loop
- Status: active
- Description: While app is open, guidance updates continuously through campus outdoor and indoor floor transitions in one journey.
- Why it matters: Core modernization target from static to live navigation.
- Source: user
- Primary owning slice: M002-a5gn45/S03
- Supporting slices: M002-a5gn45/S04
- Validation: mapped
- Notes: Background/lock-screen continuity is deferred in this milestone.

### R027 — Live guidance is confidence-gated with explicit fallback behavior.
- Class: continuity
- Status: active
- Description: App only auto-guides when position confidence is acceptable; otherwise it surfaces clear correction prompts instead of misleading motion.
- Why it matters: Preserves trust despite GPS+sensor indoor limits.
- Source: user
- Primary owning slice: M002-a5gn45/S03
- Supporting slices: M002-a5gn45/S04
- Validation: mapped
- Notes: Chosen accuracy contract.

### R028 — Off-route recovery reroutes within 5–10 seconds in normal foreground use.
- Class: quality-attribute
- Status: active
- Description: Drift from planned route is detected and guidance recovers on the stated SLA.
- Why it matters: Prevents dead-end user experiences during live navigation.
- Source: user
- Primary owning slice: M002-a5gn45/S03
- Supporting slices: M002-a5gn45/S05
- Validation: mapped
- Notes: SLA is a practical bar, not a hard real-time guarantee.

### R029 — Heading-aware map behavior is available during live guidance.
- Class: quality-attribute
- Status: active
- Description: Map orientation behavior reflects movement heading in guidance mode.
- Why it matters: Supports maps-like spatial orientation expectations.
- Source: user
- Primary owning slice: M002-a5gn45/S03
- Supporting slices: M002-a5gn45/S04
- Validation: mapped
- Notes: Includes anti-jitter constraints from prior web learnings.

### R030 — Floor transition guidance avoids wrong-floor instructions.
- Class: failure-visibility
- Status: active
- Description: Guidance handles floor changes with explicit, correct floor context and prevents silent floor mismatch.
- Why it matters: Wrong-floor directions are a hard trust failure.
- Source: user
- Primary owning slice: M002-a5gn45/S04
- Supporting slices: M002-a5gn45/S03
- Validation: mapped
- Notes: Uses confidence/floor-state checks before advancing step state.

### R031 — Real-time guidance parity exists for standard and wheelchair-accessible modes.
- Class: primary-user-loop
- Status: active
- Description: Both routing modes receive live progression and reroute behavior.
- Why it matters: Accessibility mode cannot be second-class.
- Source: user
- Primary owning slice: M002-a5gn45/S04
- Supporting slices: M002-a5gn45/S05
- Validation: mapped
- Notes: Must preserve existing accessibility semantics.

### R032 — Internal iOS and Android distributable builds are produced.
- Class: launchability
- Status: active
- Description: Milestone outputs installable internal builds (TestFlight/internal Android distribution channel).
- Why it matters: User explicitly wants app runtime proof but cannot do public store launch yet.
- Source: user
- Primary owning slice: M002-a5gn45/S05
- Supporting slices: none
- Validation: mapped
- Notes: Public store submission deferred.

### R033 — Visitor can complete one end-to-end guided trip including an off-route recovery.
- Class: primary-user-loop
- Status: active
- Description: A first-time visitor can reach destination using live guidance through one reroute event.
- Why it matters: This is the agreed “done” bar.
- Source: user
- Primary owning slice: M002-a5gn45/S05
- Supporting slices: M002-a5gn45/S03, M002-a5gn45/S04
- Validation: mapped
- Notes: Must be proven on real device runtime.

### R034 — Admin map editing remains web-based for this app initiative.
- Class: admin/support
- Status: active
- Description: Mobile milestone does not port full admin editor; backend/admin web remains source of truth.
- Why it matters: Controls scope and keeps app work focused on visitor/student guidance loop.
- Source: user
- Primary owning slice: M002-a5gn45/S02
- Supporting slices: none
- Validation: mapped
- Notes: Explicit user decision (“student app + web admin”).

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
| R023 | core-capability | active | M002-a5gn45/S01 | M002-a5gn45/S05 | mapped |
| R024 | primary-user-loop | active | M002-a5gn45/S01 | M002-a5gn45/S04 | mapped |
| R025 | primary-user-loop | active | M002-a5gn45/S02 | M002-a5gn45/S04 | mapped |
| R026 | primary-user-loop | active | M002-a5gn45/S03 | M002-a5gn45/S04 | mapped |
| R027 | continuity | active | M002-a5gn45/S03 | M002-a5gn45/S04 | mapped |
| R028 | quality-attribute | active | M002-a5gn45/S03 | M002-a5gn45/S05 | mapped |
| R029 | quality-attribute | active | M002-a5gn45/S03 | M002-a5gn45/S04 | mapped |
| R030 | failure-visibility | active | M002-a5gn45/S04 | M002-a5gn45/S03 | mapped |
| R031 | primary-user-loop | active | M002-a5gn45/S04 | M002-a5gn45/S05 | mapped |
| R032 | launchability | active | M002-a5gn45/S05 | none | mapped |
| R033 | primary-user-loop | active | M002-a5gn45/S05 | M002-a5gn45/S03, M002-a5gn45/S04 | mapped |
| R034 | admin/support | active | M002-a5gn45/S02 | none | mapped |
| R035 | differentiator | deferred | M004 (provisional) | none | unmapped |
| R036 | differentiator | deferred | M004 (provisional) | none | unmapped |
| R037 | launchability | deferred | M005 (provisional) | none | unmapped |
| R038 | constraint | out-of-scope | none | none | n/a |
| R039 | constraint | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 12
- Mapped to slices: 12
- Validated: 16
- Unmapped active requirements: 0
