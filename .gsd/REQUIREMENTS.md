# Requirements

Migrated and normalized from legacy `.planning/REQUIREMENTS.md`.

## Active

### R004 — Multi-floor direction section dividers
- Class: primary-user-loop
- Status: active
- Description: Multi-floor route directions display a floor-section header between steps on different floors.
- Why it matters: Students can follow cross-floor routes without losing context between floors.
- Source: user
- Primary owning slice: M001/S24
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from DIR-01.

### R005 — Floor-change direction includes up/down language
- Class: primary-user-loop
- Status: active
- Description: Floor-change direction steps include clear up/down directional language (e.g., “up to Floor 3”).
- Why it matters: Students need explicit movement guidance at connector transitions.
- Source: user
- Primary owning slice: M001/S24
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from DIR-02.

### R006 — Visual connector linking in admin
- Class: admin/support
- Status: active
- Description: Admin can link a floor-connector node to corresponding nodes above/below using dropdown UI (no manual node-ID entry).
- Why it matters: Reduces admin errors and speeds map maintenance.
- Source: user
- Primary owning slice: M001/S25
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from CONN-01.

### R007 — Connector links save bidirectionally and atomically
- Class: integration
- Status: active
- Description: Saving a connector link writes both sides atomically to avoid one-sided cross-floor links.
- Why it matters: Prevents asymmetric routing failures.
- Source: user
- Primary owning slice: M001/S25
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from CONN-02.

### R008 — Connector links removable in admin
- Class: admin/support
- Status: active
- Description: Admin can remove existing connector links between nodes.
- Why it matters: Supports correction workflows and map evolution.
- Source: user
- Primary owning slice: M001/S25
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from CONN-03.

### R009 — Admin GPS bounds per floor and campus map
- Class: admin/support
- Status: active
- Description: Admin can configure min/max latitude and longitude bounds per floor and for campus map.
- Why it matters: Required to transform GPS coordinates into map positions.
- Source: user
- Primary owning slice: M001/S26
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from GPS-01.

### R010 — GPS bounds validation in admin form
- Class: quality-attribute
- Status: active
- Description: Admin GPS bounds form enforces minLat < maxLat and minLng < maxLng with inline errors.
- Why it matters: Prevents invalid calibration data from breaking map projection.
- Source: user
- Primary owning slice: M001/S26
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from GPS-02.

### R011 — Student GPS dot display
- Class: primary-user-loop
- Status: active
- Description: Student sees a “you are here” GPS dot on map when valid bounds are configured.
- Why it matters: Improves start-point awareness and navigation confidence.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from GPS-03.

### R012 — GPS accuracy ring
- Class: quality-attribute
- Status: active
- Description: GPS dot displays an accuracy ring proportional to reported uncertainty.
- Why it matters: Communicates confidence level of location estimate.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from GPS-04.

### R013 — GPS dot hidden on low-accuracy readings
- Class: quality-attribute
- Status: active
- Description: GPS dot is hidden when reported accuracy exceeds 50 meters.
- Why it matters: Avoids showing misleading location in poor-signal conditions.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from GPS-05.

### R014 — Use-my-location nearest-node snap
- Class: primary-user-loop
- Status: active
- Description: Student can use current location as route start by snapping to nearest walkable node.
- Why it matters: Reduces friction for route setup and keeps routing graph-consistent.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from GPS-06.

### R015 — Graceful GPS fallback
- Class: continuity
- Status: active
- Description: If GPS is unavailable or denied, app shows clear fallback messaging and manual start selection remains fully functional.
- Why it matters: Core navigation remains usable for all users/devices.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from GPS-07.

## Validated

### R001 — Pinch-zoom focal point remains at touch midpoint
- Class: quality-attribute
- Status: validated
- Description: Pinch-to-zoom targets the midpoint between touches at all map rotation angles.
- Why it matters: Prevents map jump/drift on mobile gestures.
- Source: user
- Primary owning slice: M001/S23
- Supporting slices: none
- Validation: validated
- Notes: Migrated from TOUCH-01 (completed in Phase 21 / S23).

### R002 — Two-finger rotation pivots around touch midpoint
- Class: quality-attribute
- Status: validated
- Description: Two-finger rotation pivots around the touch midpoint rather than stage origin.
- Why it matters: Makes map rotation predictable and usable.
- Source: user
- Primary owning slice: M001/S23
- Supporting slices: none
- Validation: validated
- Notes: Migrated from TOUCH-02 (completed in Phase 21 / S23).

### R003 — Rotation dead-zone prevents jitter
- Class: quality-attribute
- Status: validated
- Description: Two-finger gesture applies a 2-degree per-frame threshold to suppress micro-rotation jitter.
- Why it matters: Prevents accidental rotation during pure pinch gestures.
- Source: user
- Primary owning slice: M001/S23
- Supporting slices: none
- Validation: validated
- Notes: Migrated from TOUCH-03 (completed in Phase 21 / S23).

## Deferred

### R016 — Admin map-click GPS calibration helper
- Class: admin/support
- Status: deferred
- Description: GPS bounds can be configured using map-click calibration helper instead of text input only.
- Why it matters: Would improve admin usability for calibration.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Migrated from GPS-V2-01.

### R017 — GPS floor auto-detection
- Class: differentiator
- Status: deferred
- Description: System infers current floor from sensor signals (e.g., altitude/barometric data).
- Why it matters: Reduces manual floor selection friction.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Migrated from GPS-V2-02.

### R018 — Compass-based map auto-rotation
- Class: differentiator
- Status: deferred
- Description: Device orientation can auto-rotate map to match heading.
- Why it matters: Could improve wayfinding orientation for some users.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Migrated from GPS-V2-03.

### R019 — Connector landmark naming in floor transitions
- Class: primary-user-loop
- Status: deferred
- Description: Floor-transition instruction names specific connector landmark (e.g., “Take Staircase A to Floor 2”).
- Why it matters: Increases clarity in buildings with multiple connectors.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Migrated from DIR-V2-01.

## Out of Scope

### R020 — Real-time continuous indoor tracking
- Class: anti-feature
- Status: out-of-scope
- Description: Continuous high-confidence indoor live tracking.
- Why it matters: Prevents overpromising with unreliable indoor GPS accuracy.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Explicitly excluded in legacy requirements.

### R021 — Timetable/schedule integration
- Class: anti-feature
- Status: out-of-scope
- Description: Integrating class schedules with route planning.
- Why it matters: Keeps milestone scope focused on wayfinding core.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Explicitly excluded in project scope history.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | quality-attribute | validated | M001/S23 | none | validated |
| R002 | quality-attribute | validated | M001/S23 | none | validated |
| R003 | quality-attribute | validated | M001/S23 | none | validated |
| R004 | primary-user-loop | active | M001/S24 | none | mapped |
| R005 | primary-user-loop | active | M001/S24 | none | mapped |
| R006 | admin/support | active | M001/S25 | none | mapped |
| R007 | integration | active | M001/S25 | none | mapped |
| R008 | admin/support | active | M001/S25 | none | mapped |
| R009 | admin/support | active | M001/S26 | none | mapped |
| R010 | quality-attribute | active | M001/S26 | none | mapped |
| R011 | primary-user-loop | active | M001/S27 | none | mapped |
| R012 | quality-attribute | active | M001/S27 | none | mapped |
| R013 | quality-attribute | active | M001/S27 | none | mapped |
| R014 | primary-user-loop | active | M001/S27 | none | mapped |
| R015 | continuity | active | M001/S27 | none | mapped |
| R016 | admin/support | deferred | none | none | unmapped |
| R017 | differentiator | deferred | none | none | unmapped |
| R018 | differentiator | deferred | none | none | unmapped |
| R019 | primary-user-loop | deferred | none | none | unmapped |
| R020 | anti-feature | out-of-scope | none | none | n/a |
| R021 | anti-feature | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 12
- Mapped to slices: 12
- Validated: 3
- Unmapped active requirements: 0
