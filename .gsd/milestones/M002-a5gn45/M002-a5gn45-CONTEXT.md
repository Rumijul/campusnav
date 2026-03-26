# M002-a5gn45: Native App Foundation + Foreground Real-Time Guidance — Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

## Project Description

Build an app version of CampusNav with a visitor-first navigation experience that feels user-friendly like Google Maps and Apple Maps, while preserving CampusNav’s current routing capabilities. This milestone focuses on native app runtime and foreground real-time navigation direction for iOS and Android, with confidence-gated behavior so guidance stays trustworthy when sensor certainty drops.

## Why This Milestone

Current CampusNav web delivery is functional and validated, but the user’s stated reason for this initiative is UX modernization: the experience should move from static route reading toward live turn guidance behavior. This milestone is first because it establishes whether the app can deliver a reliable real-time visitor loop under a GPS+sensor-only positioning strategy before expanding into deferred capabilities (voice/haptics/offline/public store launch).

## User-Visible Outcome

### When this milestone is complete, the user can:

- Install an internal iOS or Android app build, choose a destination, and follow live foreground guidance from current position to destination.
- Leave the planned path once and see guidance recover via reroute within the accepted responsiveness band.

### Entry point / environment

- Entry point: Native mobile app launch icon (internal iOS + Android distribution).
- Environment: Mobile runtime on physical devices (foreground guidance mode).
- Live dependencies involved: Existing CampusNav backend APIs + database-backed graph data.

## Completion Class

- Contract complete means: Shared requirement proofs exist for route progression state, confidence-gated decision logic, reroute trigger behavior, and standard/accessible parity.
- Integration complete means: Real device app runtime consumes live CampusNav graph data and executes end-to-end guidance across outdoor + indoor segments.
- Operational complete means: Internal distribution artifacts are produced and installable for both iOS and Android.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- A first-time visitor can complete a guided trip end-to-end in foreground app mode.
- During that trip, at least one off-route event reroutes and resumes guidance within 5–10 seconds.
- Guidance does not silently continue with low-confidence or wrong-floor state; it explicitly falls back when confidence is insufficient.

## Risks and Unknowns

- GPS+sensor-only indoor reliability may be insufficient in some buildings — this can cause jittery location/heading, wrong-floor guidance, or delayed reroute confidence.
- React Native map/gesture behavior must match existing CampusNav interaction quality — weak gesture fidelity would fail the “Google Maps / Apple Maps” UX expectation.
- Outdoor-to-indoor continuity under live progression can desync route state if transition confidence drops at connector boundaries.

## Existing Codebase / Prior Art

- `src/client/components/FloorPlanCanvas.tsx` — Current web map runtime, route rendering, GPS projection, and nearest-node “Use my location” behavior.
- `src/shared/pathfinding/engine.ts` and `src/shared/pathfinding/graph-builder.ts` — Existing route computation core and graph model.
- `src/shared/gps.ts` — Existing confidence gate and lat/lng projection math used in v1.6.
- `src/client/hooks/useRouteDirections.ts` — Existing direction semantics including cross-floor transition language.
- `src/server/index.ts` + `/api/map` — Existing backend contract the app should continue consuming.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R023 — Introduce iOS/Android native app runtime.
- R026 — Foreground real-time guidance across outdoor + indoor route segments.
- R027 — Confidence-gated guidance contract.
- R028 — Off-route reroute responsiveness target (5–10s).
- R030 — Wrong-floor guidance prevention.
- R031 — Standard + accessible real-time parity.
- R032 — Internal build delivery for both mobile platforms.
- R033 — Visitor complete-trip acceptance with reroute proof.
- R034 — Keep admin editing web-based in this milestone.

## Scope

### In Scope

- Native app foundation for iOS + Android via React Native.
- Student navigation flows (no-login) with existing graph-backed route capabilities.
- Foreground real-time progression, reroute, and confidence/fallback signaling.
- Heading-aware map behavior aligned to visitor guidance use.
- Internal distribution artifacts for both platforms.

### Out of Scope / Non-Goals

- Full admin editor port into mobile app.
- Public App Store / Google Play launch.
- Hardware-backed RTLS rollout (BLE/UWB/Wi-Fi RTT infrastructure).
- Full offline map-pack sync guarantee.
- Voice/haptics in this milestone (deferred to later milestone).

## Technical Constraints

- Positioning strategy is GPS + phone sensors only for this milestone (no new infrastructure).
- Guidance runtime target is foreground mode; full background lock-screen continuity is not required yet.
- Existing CampusNav backend API and graph schema are source-of-truth contracts.
- Existing accessibility routing semantics must remain intact in real-time mode.

## Integration Points

- CampusNav backend `/api/map` and related media endpoints — app must consume existing payload contracts.
- Existing route graph data (buildings/floors/nodes/edges) — app guidance state must map to this model.
- Internal distribution channels (TestFlight/internal Android distribution) — used for milestone operational proof.

## Open Questions

- Final React Native map rendering stack choice inside implementation phase (native maps overlay vs custom render path) — current plan is to choose by earliest reliable reroute + floor-accuracy proof.
- Whether sensor fusion tuning alone can maintain stable confidence in all target campus zones — to be retired by on-device integration proofs in milestone slices.
