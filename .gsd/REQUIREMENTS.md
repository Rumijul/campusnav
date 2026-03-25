# Requirements

This file is the explicit capability and coverage contract for the project.

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

### R009 — Admin can configure min/max latitude and longitude bounds per floor and for campus map.
- Class: admin/support
- Status: validated
- Description: Admin can configure min/max latitude and longitude bounds per floor and for campus map.
- Why it matters: Required to transform GPS coordinates into map positions.
- Source: user
- Primary owning slice: M001/S26
- Supporting slices: none
- Validation: Validated in S26 by floor-level GPS bounds persistence columns (`gpsMinLat/gpsMaxLat/gpsMinLng/gpsMaxLng`), protected mutation endpoint `PUT /api/admin/floors/:id/gps-bounds`, and admin Manage Floors row controls available in both building and campus mode. Proven by passing `test -f drizzle/0003_floor_gps_bounds.sql`, `npm test -- src/server/floorGpsBounds.test.ts`, `npm test -- src/client/components/admin/ManageFloorsModal.gps.test.tsx`, and `npm test`.
- Notes: S26 completed 2026-03-24; includes complete-only `GET /api/map` `gpsBounds` serialization contract for downstream student GPS projection in S27.

### R010 — Admin GPS bounds form enforces minLat < maxLat and minLng < maxLng with inline errors.
- Class: quality-attribute
- Status: validated
- Description: Admin GPS bounds form enforces minLat < maxLat and minLng < maxLng with inline errors.
- Why it matters: Prevents invalid calibration data from breaking map projection.
- Source: user
- Primary owning slice: M001/S26
- Supporting slices: none
- Validation: Validated in S26 by pure GPS bounds form validation (`deriveGpsBoundsFormState`) and row-level UI gating (`deriveGpsBoundsRowUiState`) enforcing complete tuple + strict ordering (`minLat < maxLat`, `minLng < maxLng`) with inline errors and blocked saves. Proven by passing `npm test -- src/client/components/admin/gpsBoundsForm.test.ts`, `npm test -- src/client/components/admin/ManageFloorsModal.gps.test.tsx -t "renders inline validation error and blocks save for partial gps tuple"`, server range guard check `npm test -- src/server/floorGpsBounds.test.ts -t "returns BOUNDS_RANGE_INVALID when min/max ordering is invalid"`, and full suite `npm test`.
- Notes: S26 completed 2026-03-24; validation is enforced in both pure helper logic and modal row UX before network mutation.

### R011 — Student sees a “you are here” GPS dot on map when valid bounds are configured.
- Class: primary-user-loop
- Status: validated
- Description: Student sees a “you are here” GPS dot on map when valid bounds are configured.
- Why it matters: Improves start-point awareness and navigation confidence.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: Validated in S27 by calibrated-floor geolocation projection wiring in `FloorPlanCanvas` + dedicated Konva marker layer rendering in `GpsLocationLayer`; proven by passing `npm test -- src/shared/gps.test.ts`, `npm test -- src/client/hooks/useGeolocation.test.ts`, `npm test -- src/client/components/GpsLocationLayer.test.tsx`, and full suite `npm test`.
- Notes: Migrated from GPS-03.

### R012 — GPS dot displays an accuracy ring proportional to reported uncertainty.
- Class: quality-attribute
- Status: validated
- Description: GPS dot displays an accuracy ring proportional to reported uncertainty.
- Why it matters: Communicates confidence level of location estimate.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: Validated in S27 by `accuracyMetersToMapPixelRadius` scaling and `GpsLocationLayer` accuracy-ring rendering (ring shown when radius > 0); proven by passing `npm test -- src/shared/gps.test.ts`, `npm test -- src/client/components/GpsLocationLayer.test.tsx`, and full suite `npm test`.
- Notes: Migrated from GPS-04.

### R013 — GPS dot is hidden when reported accuracy exceeds 50 meters.
- Class: quality-attribute
- Status: validated
- Description: GPS dot is hidden when reported accuracy exceeds 50 meters.
- Why it matters: Avoids showing misleading location in poor-signal conditions.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: Validated in S27 by confidence gate `isGpsFixConfident` (<=50m) and marker suppression in `FloorPlanCanvas`/`deriveStudentGpsState`; proven by passing `npm test -- src/shared/gps.test.ts -t "hides low-confidence fixes above 50m"`, `npm test -- src/client/gps/studentGpsState.test.ts`, and full suite `npm test`.
- Notes: Migrated from GPS-05.

### R014 — Student can use current location as route start by snapping to nearest walkable node.
- Class: primary-user-loop
- Status: validated
- Description: Student can use current location as route start by snapping to nearest walkable node.
- Why it matters: Reduces friction for route setup and keeps routing graph-consistent.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: Validated in S27 by nearest walkable-node snap helper `snapLatLngToNearestWalkableNode` and `FloorPlanCanvas` `handleUseMyLocation -> routeSelection.setStart(...)` wiring through `SearchOverlay`; proven by passing `npm test -- src/shared/gps.test.ts`, `npm test -- src/client/gps/studentGpsState.test.ts`, `npm test -- src/client/components/SearchOverlay.gps.test.tsx`, and full suite `npm test`.
- Notes: Migrated from GPS-06.

### R015 — If GPS is unavailable or denied, app shows clear fallback messaging and manual start selection remains fully functional.
- Class: continuity
- Status: validated
- Description: If GPS is unavailable or denied, app shows clear fallback messaging and manual start selection remains fully functional.
- Why it matters: Core navigation remains usable for all users/devices.
- Source: user
- Primary owning slice: M001/S27
- Supporting slices: none
- Validation: Validated in S27 by explicit fallback-state derivation (`deriveStudentGpsState`) for unsupported/permission-denied/unavailable/low-confidence/no-nearest cases and SearchOverlay manual-control continuity; proven by passing `npm test -- src/client/hooks/useGeolocation.test.ts -t "maps permission denied geolocation errors to explicit status"`, `npm test -- src/client/gps/studentGpsState.test.ts`, `npm test -- src/client/components/SearchOverlay.gps.test.tsx`, and full suite `npm test`.
- Notes: Migrated from GPS-07.

### R022 — For active milestone execution, create a checkpoint commit before any research/deep-dive activity begins.
- Class: process-governance
- Status: validated
- Description: For active milestone execution, create a checkpoint commit before any research/deep-dive activity begins.
- Why it matters: Preserves rollback safety, keeps exploratory diffs traceable, and prevents mixing uncheckpointed edits with research outcomes.
- Source: user override
- Primary owning slice: M001/S27
- Supporting slices: M001 (all remaining active slices)
- Validation: Validated in S27 by checkpoint artifact presence and resolvable commit hash prior to implementation deep-dive; proven by passing `test -f .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md` and `bash -lc 'hash=$(awk "/^checkpoint_commit:/ { print \$2 }" .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md); test -n "$hash" && git cat-file -e "${hash}^{commit}"'`.
- Notes: Added from override 2026-03-24; implemented via decision D006.

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
| R009 | admin/support | validated | M001/S26 | none | Validated in S26 by floor-level GPS bounds persistence columns (`gpsMinLat/gpsMaxLat/gpsMinLng/gpsMaxLng`), protected mutation endpoint `PUT /api/admin/floors/:id/gps-bounds`, and admin Manage Floors row controls available in both building and campus mode. Proven by passing `test -f drizzle/0003_floor_gps_bounds.sql`, `npm test -- src/server/floorGpsBounds.test.ts`, `npm test -- src/client/components/admin/ManageFloorsModal.gps.test.tsx`, and `npm test`. |
| R010 | quality-attribute | validated | M001/S26 | none | Validated in S26 by pure GPS bounds form validation (`deriveGpsBoundsFormState`) and row-level UI gating (`deriveGpsBoundsRowUiState`) enforcing complete tuple + strict ordering (`minLat < maxLat`, `minLng < maxLng`) with inline errors and blocked saves. Proven by passing `npm test -- src/client/components/admin/gpsBoundsForm.test.ts`, `npm test -- src/client/components/admin/ManageFloorsModal.gps.test.tsx -t "renders inline validation error and blocks save for partial gps tuple"`, server range guard check `npm test -- src/server/floorGpsBounds.test.ts -t "returns BOUNDS_RANGE_INVALID when min/max ordering is invalid"`, and full suite `npm test`. |
| R011 | primary-user-loop | validated | M001/S27 | none | Validated in S27 by calibrated-floor geolocation projection wiring in `FloorPlanCanvas` + dedicated Konva marker layer rendering in `GpsLocationLayer`; proven by passing `npm test -- src/shared/gps.test.ts`, `npm test -- src/client/hooks/useGeolocation.test.ts`, `npm test -- src/client/components/GpsLocationLayer.test.tsx`, and full suite `npm test`. |
| R012 | quality-attribute | validated | M001/S27 | none | Validated in S27 by `accuracyMetersToMapPixelRadius` scaling and `GpsLocationLayer` accuracy-ring rendering (ring shown when radius > 0); proven by passing `npm test -- src/shared/gps.test.ts`, `npm test -- src/client/components/GpsLocationLayer.test.tsx`, and full suite `npm test`. |
| R013 | quality-attribute | validated | M001/S27 | none | Validated in S27 by confidence gate `isGpsFixConfident` (<=50m) and marker suppression in `FloorPlanCanvas`/`deriveStudentGpsState`; proven by passing `npm test -- src/shared/gps.test.ts -t "hides low-confidence fixes above 50m"`, `npm test -- src/client/gps/studentGpsState.test.ts`, and full suite `npm test`. |
| R014 | primary-user-loop | validated | M001/S27 | none | Validated in S27 by nearest walkable-node snap helper `snapLatLngToNearestWalkableNode` and `FloorPlanCanvas` `handleUseMyLocation -> routeSelection.setStart(...)` wiring through `SearchOverlay`; proven by passing `npm test -- src/shared/gps.test.ts`, `npm test -- src/client/gps/studentGpsState.test.ts`, `npm test -- src/client/components/SearchOverlay.gps.test.tsx`, and full suite `npm test`. |
| R015 | continuity | validated | M001/S27 | none | Validated in S27 by explicit fallback-state derivation (`deriveStudentGpsState`) for unsupported/permission-denied/unavailable/low-confidence/no-nearest cases and SearchOverlay manual-control continuity; proven by passing `npm test -- src/client/hooks/useGeolocation.test.ts -t "maps permission denied geolocation errors to explicit status"`, `npm test -- src/client/gps/studentGpsState.test.ts`, `npm test -- src/client/components/SearchOverlay.gps.test.tsx`, and full suite `npm test`. |
| R016 | admin/support | deferred | none | none | unmapped |
| R017 | differentiator | deferred | none | none | unmapped |
| R018 | differentiator | deferred | none | none | unmapped |
| R019 | primary-user-loop | deferred | none | none | unmapped |
| R020 | anti-feature | out-of-scope | none | none | n/a |
| R021 | anti-feature | out-of-scope | none | none | n/a |
| R022 | process-governance | validated | M001/S27 | M001 (all remaining active slices) | Validated in S27 by checkpoint artifact presence and resolvable commit hash prior to implementation deep-dive; proven by passing `test -f .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md` and `bash -lc 'hash=$(awk "/^checkpoint_commit:/ { print \$2 }" .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md); test -n "$hash" && git cat-file -e "${hash}^{commit}"'`. |

## Coverage Summary

- Active requirements: 0
- Mapped to slices: 0
- Validated: 16 (R001, R002, R003, R004, R005, R006, R007, R008, R009, R010, R011, R012, R013, R014, R015, R022)
- Unmapped active requirements: 0

## Milestone Closeout Audit (2026-03-25)

- Verified milestone-level status transitions with evidence during M001 closeout.
- Confirmed `R001-R015` and `R022` remain **validated** with slice-backed proof.
- Re-ran full regression during closeout (`npm test` → 17 files / 144 tests passed) to confirm requirement proofs still hold end-to-end.
- No additional requirement status changes were introduced during closeout.
