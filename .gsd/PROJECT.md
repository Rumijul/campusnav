# CampusNav

## What This Is

CampusNav is a campus wayfinding product that currently runs as a web app and helps users navigate between locations across campus outdoor segments and indoor floor maps. It computes standard and wheelchair-accessible routes from a maintained campus graph, then renders map paths and step-by-step directions.

## Core Value

A first-time campus visitor can reliably get from current position to destination with clear, trustworthy guidance.

## Current State

- Web platform is shipped (v1.6) with multi-building/multi-floor routing, cross-floor directions, admin map editing, and GPS-assisted start snapping.
- Student flow is no-login; admin editing is authenticated and remains web-based.
- Navigation currently behaves as a route planning + guided reading experience; continuous app-style real-time guidance is not yet shipped.
- New work begins at milestone `M002-a5gn45` to deliver native app runtime and foreground real-time guidance.

## Architecture / Key Patterns

- Existing production stack: React + Konva + Hono + Drizzle/Postgres with graph/pathfinding domain in shared TypeScript modules.
- Routing model: graph-based shortest path with standard + accessible modes; floor connectors and cross-building edges are already modeled.
- GPS model: confidence-gated (`<=50m`) geolocation with calibrated floor/campus bounds and nearest-walkable-node snapping.
- New program direction: React Native app runtime for iOS + Android, retaining backend graph APIs and preserving web admin as source of map truth.

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: CampusNav v1.6 GPS Integration & UX Refinements — shipped web gesture, connector, and GPS calibration improvements.
- [x] M002-a5gn45/S01: Native App Foundation — Expo mobile runtime, typed backend graph contracts, no-login bootstrap, gesture-capable MapViewport.
- [x] M002-a5gn45/S01: Native App Foundation — Expo mobile runtime, typed backend graph contracts, no-login bootstrap, gesture-capable MapViewport.
- [x] M002-a5gn45/S02: Visitor trip setup parity (student scope only) — route selection, floor-aware preview, no login required.
- [x] M002-a5gn45/S03: Real-time guidance core (confidence + reroute engine) — guidance state machine, GPS+heading subscription, session orchestrator, live UI overlay.
- [ ] M002-a5gn45/S04: Visitor-first live UX + floor-safe accessible parity — heading-aware map rotation, floor-aware overlays, accessible mode guidance.
- [ ] M002-a5gn45/S05: Integrated acceptance + internal build delivery — iOS/Android builds installable, end-to-end journey verified on device.
- [ ] M003: Reliability and Guidance Intelligence — strengthen confidence gating, floor correctness, and reroute robustness under real movement.
- [ ] M004: Maps-Like Experience Expansion — add voice prompts and haptic cues with polished turn guidance behavior.
- [ ] M005: Offline and Launch Hardening — add offline capability and release-level operational hardening.
