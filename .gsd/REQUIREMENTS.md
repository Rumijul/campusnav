# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R009 — Admin can configure min/max latitude and longitude bounds per floor and for campus map.
- Class: admin/support
- Status: active
- Description: Admin can configure min/max latitude and longitude bounds per floor and for campus map.
- Why it matters: Required to transform GPS coordinates into map positions.
- Source: user
- Primary owning slice: M001/S26
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from GPS-01.

### R010 — Admin GPS bounds form enforces minLat < maxLat and minLng < maxLng with inline errors.
- Class: quality-attribute
- Status: active
- Description: Admin GPS bounds form enforces minLat < maxLat and minLng < maxLng with inline errors.
- Why it matters: Prevents invalid calibration data from breaking map projection.
- Source: user
- Primary owning slice: M001/S26
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from GPS-02.

### R011 — Student sees a “you are here” GPS dot on map when valid bounds are configured.
- Class: primary-user-loop
- Status: active
- Description: Student sees a “you are here” GPS dot on map when valid bounds are configured.
- Why it matters: Improves start-point awareness and navigation confidence.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from GPS-03.

### R012 — GPS dot displays an accuracy ring proportional to reported uncertainty.
- Class: quality-attribute
- Status: active
- Description: GPS dot displays an accuracy ring proportional to reported uncertainty.
- Why it matters: Communicates confidence level of location estimate.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from GPS-04.

### R013 — GPS dot is hidden when reported accuracy exceeds 50 meters.
- Class: quality-attribute
- Status: active
- Description: GPS dot is hidden when reported accuracy exceeds 50 meters.
- Why it matters: Avoids showing misleading location in poor-signal conditions.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from GPS-05.

### R014 — Student can use current location as route start by snapping to nearest walkable node.
- Class: primary-user-loop
- Status: active
- Description: Student can use current location as route start by snapping to nearest walkable node.
- Why it matters: Reduces friction for route setup and keeps routing graph-consistent.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: mapped
- Notes: Migrated from GPS-06.

### R015 — If GPS is unavailable or denied, app shows clear fallback messaging and manual start selection remains fully functional.
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

### R001 — Pinch-to-zoom targets the midpoint between touches at all map rotation angles.
- Class: quality-attribute
- Status: validated
- Description: Pinch-to-zoom targets the midpoint between touches at all map rotation angles.
- Why it matters: Prevents map jump/drift on mobile gestures.
- Source: user
- Primary owning slice: M001/S23
- Supporting slices: none
- Validation: validated
- Notes: Migrated from TOUCH-01 (completed in Phase 21 / S23).

### R002 — Two-finger rotation pivots around the touch midpoint rather than stage origin.
- Class: quality-attribute
- Status: validated
- Description: Two-finger rotation pivots around the touch midpoint rather than stage origin.
- Why it matters: Makes map rotation predictable and usable.
- Source: user
- Primary owning slice: M001/S23
- Supporting slices: none
- Validation: validated
- Notes: Migrated from TOUCH-02 (completed in Phase 21 / S23).

### R003 — Two-finger gesture applies a 2-degree per-frame threshold to suppress micro-rotation jitter.
- Class: quality-attribute
- Status: validated
- Description: Two-finger gesture applies a 2-degree per-frame threshold to suppress micro-rotation jitter.
- Why it matters: Prevents accidental rotation during pure pinch gestures.
- Source: user
- Primary owning slice: M001/S23
- Supporting slices: none
- Validation: validated
- Notes: Migrated from TOUCH-03 (completed in Phase 21 / S23).

### R004 — Multi-floor route directions display a floor-section header between steps on different floors.
- Class: primary-user-loop
- Status: validated
- Description: Multi-floor route directions display a floor-section header between steps on different floors.
- Why it matters: Students can follow cross-floor routes without losing context between floors.
- Source: user
- Primary owning slice: M001/S24
- Supporting slices: none
- Validation: Validated in S24 by contiguous floor-section grouping + conditional headers in DirectionsSheet; proven by passing `npm test -- src/client/components/directionSections.test.ts` and full suite `npm test`.
- Notes: Migrated from DIR-01.

### R005 — Floor-change direction steps include clear up/down directional language (e.g., “up to Floor 3”).
- Class: primary-user-loop
- Status: validated
- Description: Floor-change direction steps include clear up/down directional language (e.g., “up to Floor 3”).
- Why it matters: Students need explicit movement guidance at connector transitions.
- Source: user
- Primary owning slice: M001/S24
- Supporting slices: none
- Validation: Validated in S24 by explicit up/down connector phrasing derived from resolved floor numbers; proven by passing `npm test -- src/client/hooks/useRouteDirections.test.ts`, diagnostic fallback test, and full suite `npm test`.
- Notes: Migrated from DIR-02.

### R006 — Admin can link a floor-connector node to corresponding nodes above/below using dropdown UI (no manual node-ID entry).
- Class: admin/support
- Status: validated
- Description: Admin can link a floor-connector node to corresponding nodes above/below using dropdown UI (no manual node-ID entry).
- Why it matters: Reduces admin errors and speeds map maintenance.
- Source: user
- Primary owning slice: M001/S25
- Supporting slices: none
- Validation: Validated in S25 by connector-only Above/Below dropdown controls in `EditorSidePanel` and candidate filtering in `deriveConnectorCandidates` (same building + adjacent floor + connector type, no manual node-ID entry). Proven by passing `npm test -- src/client/components/admin/connectorLinking.test.ts`, `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx`, and full suite `npm test`.
- Notes: Migrated from CONN-01.

### R007 — Saving a connector link writes both sides atomically to avoid one-sided cross-floor links.
- Class: integration
- Status: validated
- Description: Saving a connector link writes both sides atomically to avoid one-sided cross-floor links.
- Why it matters: Prevents asymmetric routing failures.
- Source: user
- Primary owning slice: M001/S25
- Supporting slices: none
- Validation: Validated in S25 by transactional `linkConnectorNodes` write path and protected `POST /api/admin/connectors/link` endpoint that atomically writes source + reciprocal counterpart updates and stale-link cleanup. Proven by passing `npm test -- src/server/connectorLinking.test.ts`, targeted invalid-direction check `npm test -- src/server/connectorLinking.test.ts -t "returns LINK_VALIDATION_ERROR when direction/floor pairing is invalid"`, and full suite `npm test`.
- Notes: Migrated from CONN-02.

### R008 — Admin can remove existing connector links between nodes.
- Class: admin/support
- Status: validated
- Description: Admin can remove existing connector links between nodes.
- Why it matters: Supports correction workflows and map evolution.
- Source: user
- Primary owning slice: M001/S25
- Supporting slices: none
- Validation: Validated in S25 by unlink flows that clear both sides (`above/below` node/floor fields) and client patch application that reflects server `updatedNodes` without one-sided drift. Proven by passing `npm test -- src/server/connectorLinking.test.ts`, `npm test -- src/client/components/admin/connectorLinking.test.ts`, `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx`, and full suite `npm test`.
- Notes: Migrated from CONN-03.

## Deferred

### R016 — GPS bounds can be configured using map-click calibration helper instead of text input only.
- Class: admin/support
- Status: deferred
- Description: GPS bounds can be configured using map-click calibration helper instead of text input only.
- Why it matters: Would improve admin usability for calibration.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Migrated from GPS-V2-01.

### R017 — System infers current floor from sensor signals (e.g., altitude/barometric data).
- Class: differentiator
- Status: deferred
- Description: System infers current floor from sensor signals (e.g., altitude/barometric data).
- Why it matters: Reduces manual floor selection friction.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Migrated from GPS-V2-02.

### R018 — Device orientation can auto-rotate map to match heading.
- Class: differentiator
- Status: deferred
- Description: Device orientation can auto-rotate map to match heading.
- Why it matters: Could improve wayfinding orientation for some users.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Migrated from GPS-V2-03.

### R019 — Floor-transition instruction names specific connector landmark (e.g., “Take Staircase A to Floor 2”).
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

### R020 — Continuous high-confidence indoor live tracking.
- Class: anti-feature
- Status: out-of-scope
- Description: Continuous high-confidence indoor live tracking.
- Why it matters: Prevents overpromising with unreliable indoor GPS accuracy.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Explicitly excluded in legacy requirements.

### R021 — Integrating class schedules with route planning.
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
| R004 | primary-user-loop | validated | M001/S24 | none | Validated in S24 by contiguous floor-section grouping + conditional headers in DirectionsSheet; proven by passing `npm test -- src/client/components/directionSections.test.ts` and full suite `npm test`. |
| R005 | primary-user-loop | validated | M001/S24 | none | Validated in S24 by explicit up/down connector phrasing derived from resolved floor numbers; proven by passing `npm test -- src/client/hooks/useRouteDirections.test.ts`, diagnostic fallback test, and full suite `npm test`. |
| R006 | admin/support | validated | M001/S25 | none | Validated in S25 by connector-only Above/Below dropdown controls in `EditorSidePanel` and candidate filtering in `deriveConnectorCandidates` (same building + adjacent floor + connector type, no manual node-ID entry). Proven by passing `npm test -- src/client/components/admin/connectorLinking.test.ts`, `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx`, and full suite `npm test`. |
| R007 | integration | validated | M001/S25 | none | Validated in S25 by transactional `linkConnectorNodes` write path and protected `POST /api/admin/connectors/link` endpoint that atomically writes source + reciprocal counterpart updates and stale-link cleanup. Proven by passing `npm test -- src/server/connectorLinking.test.ts`, targeted invalid-direction check `npm test -- src/server/connectorLinking.test.ts -t "returns LINK_VALIDATION_ERROR when direction/floor pairing is invalid"`, and full suite `npm test`. |
| R008 | admin/support | validated | M001/S25 | none | Validated in S25 by unlink flows that clear both sides (`above/below` node/floor fields) and client patch application that reflects server `updatedNodes` without one-sided drift. Proven by passing `npm test -- src/server/connectorLinking.test.ts`, `npm test -- src/client/components/admin/connectorLinking.test.ts`, `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx`, and full suite `npm test`. |
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

- Active requirements: 7
- Mapped to slices: 7
- Validated: 8 (R001, R002, R003, R004, R005, R006, R007, R008)
- Unmapped active requirements: 0
