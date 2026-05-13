# M002-a5gn45: Native App Foundation + Foreground Real-Time Guidance

**Vision:** Build an app version of CampusNav with visitor-first, maps-like foreground real-time navigation directions across outdoor and indoor routes, while preserving backend graph contracts and no-login student access.

## Success Criteria

- Visitor can install internal app build on iOS/Android and complete a guided trip end-to-end.
- Live foreground guidance updates step progression through outdoor + indoor segments with explicit floor context.
- Off-route events recover via reroute within 5–10 seconds in normal conditions.
- Guidance uses confidence-gated behavior that surfaces explicit fallback prompts when reliability is low.
- Standard and accessible modes both provide real-time guidance behavior with visitor-usable clarity.

## Slices

- [ ] **S01: Native app runtime + backend graph contract bootstrap** `risk:high` `depends:[]`
  > After this: After this: iOS and Android app shells launch on-device, load live CampusNav graph/image data, and support baseline map interaction primitives.

- [ ] **S02: Visitor trip setup parity (student scope only)** `risk:medium` `depends:[S01]`
  > After this: After this: visitor can choose start/destination in app and preview route session context (outdoor + floor-aware) without logging in.

- [ ] **S03: Real-time guidance core (confidence + reroute engine)** `risk:high` `depends:[S02]`
  > After this: After this: live foreground positioning advances guidance and triggers reroute when user deviates, with confidence-gated fallback behavior.

- [ ] **S04: Visitor-first live UX + floor-safe accessible parity** `risk:medium` `depends:[S03]`
  > After this: After this: a first-time visitor can follow clear heading-aware live guidance across outdoor/indoor transitions in both standard and accessible modes.

- [ ] **S05: Integrated acceptance + internal build delivery** `risk:medium` `depends:[S04]`
  > After this: After this: internal iOS and Android builds are installable, and a full visitor journey (with one reroute) is proven end-to-end on device.

## Boundary Map

## Boundary Map

### S01 → S02
Produces:
- `mobile/data/mapApiClient.ts` → typed fetch contract for `/api/map` + floor-plan/campus image endpoints
- `mobile/domain/navGraph.ts` → normalized mobile graph shape aligned with existing `NavGraph` invariants
- `mobile/map/MapViewport.tsx` → device map viewport primitives (pan/zoom/rotate) with stable coordinate mapping

Consumes: nothing (first slice)

### S02 → S03
Produces:
- `mobile/guidance/routeSession.ts` → active route session state (start/destination/mode/segment)
- `mobile/guidance/stepProgression.ts` → deterministic step index progression contract from node traversal
- `mobile/guidance/floorContext.ts` → floor transition context model (current floor/next floor/connector)

Consumes from S01:
- `mapApiClient` and `navGraph` contracts for route/session initialization

### S03 → S04
Produces:
- `mobile/location/livePositionStream.ts` → foreground position stream with confidence metadata
- `mobile/location/confidenceGate.ts` → confidence states (`guided`, `fallback-prompted`) and transition rules
- `mobile/guidance/rerouteEngine.ts` → off-route detection + reroute trigger contract (5–10s target)

Consumes from S02:
- `routeSession` + `stepProgression` + `floorContext` contracts for live guidance updates

### S04 → S05
Produces:
- `mobile/ui/guidanceSheet.tsx` → visitor-first live instruction UI with heading-aware map coupling
- `mobile/ui/fallbackPrompts.tsx` → explicit low-confidence and floor-correction prompts
- `mobile/guidance/accessibleParity.ts` → mode parity guards for standard vs accessible live guidance

Consumes from S03:
- live position stream, confidence gate, and reroute events

### S05 → Milestone Acceptance
Produces:
- Internal iOS distribution artifact (TestFlight-ready build)
- Internal Android distribution artifact (internal install/testing channel build)
- End-to-end visitor acceptance evidence for one trip with one off-route recovery

Consumes from S01–S04:
- runtime, route-session, live positioning, reroute, and visitor UX contracts assembled end-to-end
