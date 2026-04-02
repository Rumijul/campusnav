# CampusNav

## What This Is

CampusNav is a campus wayfinding product that runs as a React Native mobile app (iOS + Android) and a web admin panel. It computes standard and wheelchair-accessible routes from a maintained campus graph, then renders map paths and step-by-step directions. Users navigate without login.

## Core Value

A first-time campus visitor can reliably get from current position to destination with clear, trustworthy guidance.

## Current State

- M001: Web platform shipped (v1.6) with multi-building/multi-floor routing, cross-floor directions, admin map editing, and GPS-assisted start snapping.
- M002: React Native mobile app with Expo runtime, typed backend graph contracts, real-time foreground guidance, confidence-gated GPS, heading-aware map rotation, and accessible routing mode. Android APK built.
- Visual design: current app uses a dark vertical `ScrollView`-based layout — functional but dated.
- New work (M003): Visual redesign — layered floating UI, bottom sheet, animations, light/dark theming.

## Architecture / Key Patterns

- Mobile stack: Expo + React Native 0.79, typed backend contracts from Hono API, NormalizedNavGraph domain, A* pathfinding.
- Routing: graph-based shortest path with standard + accessible modes; floor connectors and cross-building edges modeled.
- GPS model: confidence-gated geolocation with calibrated floor/campus bounds and nearest-walkable-node snapping.
- New (M003): theme system with light/dark tokens, `react-native-reanimated` + `react-native-gesture-handler` for animations/gestures.

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: CampusNav v1.6 GPS Integration & UX Refinements
- [x] M002-a5gn45: Native App Foundation + Foreground Real-Time Guidance
- [x] M003-atdssp: Visual Redesign — layered floating UI, bottom sheet, animations, light/dark theme
- [ ] M004: Reliability and Guidance Intelligence
- [ ] M005: Maps-Like Experience Expansion
- [ ] M006: Offline and Launch Hardening
floating UI, bottom sheet, animations, light/dark theme
- [ ] M004: Reliability and Guidance Intelligence
- [ ] M005: Maps-Like Experience Expansion
- [ ] M006: Offline and Launch Hardening
