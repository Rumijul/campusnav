# S01: Native app runtime + backend graph contract bootstrap — UAT

**Milestone:** M002-a5gn45
**Written:** 2026-03-30T06:59:59.108Z

## Startup — No-Auth Entry
- TC-S01-01: App launches without login prompt — no auth UI, proceeds to loading.
- TC-S01-02: App transitions through loading→ready|error deterministically (no intermediate/auth-gated states).
- TC-S01-05: Repeated bootstrap invocation is idempotent (no auth accumulation).

## Startup — Config Validation
- TC-S01-03: Missing EXPO_PUBLIC_API_BASE_URL → error state with config diagnostic.
- TC-S01-04: Invalid URL in EXPO_PUBLIC_API_BASE_URL → error state with validation failure.

## Backend Contract — /api/map
- TC-S01-06: /api/map returns structured graph payload (buildings, nodes, edges, campus, connectors).
- TC-S01-07: Malformed /api/map response → MapApiError with reason='invalid-json'.
- TC-S01-08: HTTP 404 → MapApiError with reason='http-error', status=404.
- TC-S01-09: Network timeout → MapApiError with reason='timeout', endpoint, attempt=N.
- TC-S01-10: Aborted request → MapApiError with reason='aborted'.

## Backend Contract — Graph Normalization
- TC-S01-11: Duplicate node IDs → NavGraphValidationError with issue path.
- TC-S01-12: Edge with missing fromNodeId → NavGraphValidationError with issue path.
- TC-S01-13: Empty buildings list → valid empty NavGraph (not error).
- TC-S01-14: Optional connector fields absent → preserved as undefined.
- TC-S01-15: Non-accessible edge → accessible=false, effectiveAccessibleWeight=Infinity.
- TC-S01-16: Accessible edge with accessibleWeight=1.5 → effectiveAccessibleWeight=1.5 (preserved).

## Map Viewport — Transform Invariants
- TC-S01-17: Pan focal point stable across repeated pans (no drift).
- TC-S01-18: Pinch zoom focal point stable at touch midpoint at all rotation angles (R001/R002 parity).
- TC-S01-19: Rotation pivots around touch midpoint, not stage origin.
- TC-S01-20: NaN inputs rejected; state unchanged.
- TC-S01-21: Rotation wraps cleanly at ±180° without discontinuity jump.
- TC-S01-22: Zoom clamps to configured min/max bounds.

## Bootstrap State Orchestration
- TC-S01-23: Map+image succeed → ready state.
- TC-S01-24: Map fails → error state with phase='map', endpoint='/api/map'.
- TC-S01-25: Map succeeds, image fails → error state with phase='image'.
- TC-S01-26: Restart from error → loading→ready|error without auth gate.

## Render Integration
- TC-S01-27: Bootstrap ready → MapViewport visible.
- TC-S01-28: Bootstrap loading → loading overlay visible.
- TC-S01-29: Bootstrap error → error shown with phase and endpoint diagnostics.
