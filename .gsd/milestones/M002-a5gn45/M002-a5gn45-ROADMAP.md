# M002-a5gn45: Native App Foundation + Foreground Real-Time Guidance

## Vision
Build an app version of CampusNav with visitor-first, maps-like foreground real-time navigation directions across outdoor and indoor routes, while preserving backend graph contracts and no-login student access.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Native app runtime + backend graph contract bootstrap | high | — | ✅ | After this: iOS and Android app shells launch on-device, load live CampusNav graph/image data, and support baseline map interaction primitives. |
| S02 | Visitor trip setup parity (student scope only) | medium | S01 | ✅ | After this: visitor can choose start/destination in app and preview route session context (outdoor + floor-aware) without logging in. |
| S03 | Real-time guidance core (confidence + reroute engine) | high | S02 | ✅ | After this: live foreground positioning advances guidance and triggers reroute when user deviates, with confidence-gated fallback behavior. |
| S04 | Visitor-first live UX + floor-safe accessible parity | medium | S03 | ⬜ | After this: a first-time visitor can follow clear heading-aware live guidance across outdoor/indoor transitions in both standard and accessible modes. |
| S05 | Integrated acceptance + internal build delivery | medium | S04 | ⬜ | After this: internal iOS and Android builds are installable, and a full visitor journey (with one reroute) is proven end-to-end on device. |
