---
id: M001
title: CampusNav v1.6 GPS Integration & UX Refinements
status: complete
verification_result: needs-attention
completed_at: 2026-03-25
integration_branch: master
code_change_verification:
  compared_against: origin/master merge-base
  non_gsd_files_changed: 11
  evidence_command: git diff --stat $(git merge-base HEAD origin/master) HEAD -- ':!.gsd/'
success_criteria_verdict: pass
definition_of_done_verdict: needs-attention
requirement_outcomes:
  - id: R001
    from_status: active
    to_status: validated
    proof: S23 `useMapViewport` GREEN tests (TOUCH-01 midpoint zoom correctness).
  - id: R002
    from_status: active
    to_status: validated
    proof: S23 `useMapViewport` GREEN tests (TOUCH-02 midpoint rotation pivot).
  - id: R003
    from_status: active
    to_status: validated
    proof: S23 strict `> 2°` threshold tests including exact `2°` boundary.
  - id: R004
    from_status: active
    to_status: validated
    proof: S24 floor-section grouping + `directionSections.test.ts` pass.
  - id: R005
    from_status: active
    to_status: validated
    proof: S24 connector up/down wording + `useRouteDirections.test.ts` pass.
  - id: R006
    from_status: active
    to_status: validated
    proof: S25 dropdown connector-link UX tests (`connectorLinking.test.ts`, `EditorSidePanel.connector.test.tsx`).
  - id: R007
    from_status: active
    to_status: validated
    proof: S25 transactional reciprocal writes in `connectorLinking.test.ts`.
  - id: R008
    from_status: active
    to_status: validated
    proof: S25 unlink/relink cleanup behavior validated in server+client tests.
  - id: R009
    from_status: active
    to_status: validated
    proof: S26 migration + `floorGpsBounds.test.ts` + admin GPS UI tests.
  - id: R010
    from_status: active
    to_status: validated
    proof: S26 tuple completeness/range validation tests in server+form helpers.
  - id: R011
    from_status: active
    to_status: validated
    proof: S27 `GpsLocationLayer` + `FloorPlanCanvas` marker wiring tests.
  - id: R012
    from_status: active
    to_status: validated
    proof: S27 accuracy-ring scaling tests (`gps.test.ts`, `GpsLocationLayer.test.tsx`).
  - id: R013
    from_status: active
    to_status: validated
    proof: S27 confidence gate tests (hide marker when accuracy > 50m).
  - id: R014
    from_status: active
    to_status: validated
    proof: S27 nearest walkable-node snap + SearchOverlay “Use my location” tests.
  - id: R015
    from_status: active
    to_status: validated
    proof: S27 fallback-state derivation + manual-start continuity tests.
  - id: R022
    from_status: active
    to_status: validated
    proof: S27 checkpoint artifact + resolvable commit hash check.
key_decisions:
  - D001 floor-number-based up/down semantics for cross-floor direction wording.
  - D002 dedicated transactional connector-link endpoint (`POST /api/admin/connectors/link`).
  - D003 server-authoritative full-node patching for connector updates.
  - D004 floor-scoped GPS bounds write endpoint (`PUT /api/admin/floors/:id/gps-bounds`).
  - D005 pure helper validation for GPS bounds form and save readiness.
  - D006 checkpoint-before-research execution governance.
  - D007 centralized derived student GPS fallback/action state.
  - D008 pure geolocation watch lifecycle + calibrated/confident marker gates.
key_files:
  - src/client/hooks/useMapViewport.ts
  - src/client/hooks/useRouteDirections.ts
  - src/client/components/directionSections.ts
  - src/client/components/DirectionsSheet.tsx
  - src/server/connectorLinking.ts
  - src/client/components/admin/EditorSidePanel.tsx
  - src/server/floorGpsBounds.ts
  - src/client/components/admin/ManageFloorsModal.tsx
  - src/shared/gps.ts
  - src/client/hooks/useGeolocation.ts
  - src/client/gps/studentGpsState.ts
  - src/client/components/GpsLocationLayer.tsx
  - src/client/components/FloorPlanCanvas.tsx
  - src/client/components/SearchOverlay.tsx
lessons_learned:
  - Konva inverse-transform (`getAbsoluteTransform().copy().invert().point`) is the stable way to preserve touch midpoint behavior under rotation.
  - Connector link/unlink integrity requires server-authoritative full-node replacement, not optimistic partial merges.
  - GPS bounds must be an all-values tuple-or-clear contract to prevent partial calibration drift.
  - Missing slice-level summary artifacts block clean milestone verification even when functional tests pass.
follow_ups:
  - Backfill missing `S##-SUMMARY.md` files for S01-S22 to clear auditability gap.
  - Add HTTP-level integration tests for protected connector-link and GPS-bounds endpoints.
  - Capture browser UAT evidence for S24-S27 in a stable runtime environment.
deviations:
  - Repository has no `main` branch; closeout used `origin/master` merge-base for code-diff verification.
  - Functional delivery is complete, but milestone verification remains needs-attention due to missing S01-S22 slice-level summaries.
---

# Milestone M001 Summary

## One-line Outcome
v1.6 core scope is delivered and regression-green, but milestone verification is **needs-attention** because historical slice-level summary artifacts are missing for S01-S22.

## Narrative
M001 completed touch gesture correctness (S23), cross-floor direction readability (S24), admin connector visual linking with atomic reciprocity (S25), admin GPS calibration infrastructure (S26), and student geolocation assist with nearest-node route start + graceful fallback (S27).

Closeout verification confirmed real code delivery (`11` non-`.gsd/` files changed versus integration baseline) and passed full regression (`npm test`: **17 files / 144 tests passed**). All five milestone success criteria are satisfied with direct evidence.

The remaining gap is documentation completeness: S01-S22 are checked complete and have task summaries, but slice-level `S##-SUMMARY.md` files do not exist. This does not invalidate delivered behavior, but it does prevent a clean “passing verification” verdict for audit completeness.

## Success Criteria Results
1. ✅ **Cross-floor route readability with section dividers + directional floor-change language**
   - Evidence: S24 (`useRouteDirections.test.ts`, `directionSections.test.ts`, full `npm test`).
2. ✅ **Admin visual connector linking without manual node-ID entry**
   - Evidence: S25 (`connectorLinking.test.ts`, `EditorSidePanel.connector.test.tsx`, full `npm test`).
3. ✅ **Admin per-floor + campus GPS bounds configuration**
   - Evidence: S26 (`drizzle/0003_floor_gps_bounds.sql`, `floorGpsBounds.test.ts`, `ManageFloorsModal.gps.test.tsx`, full `npm test`).
4. ✅ **Student geolocation dot + nearest-node start + graceful fallback**
   - Evidence: S27 (`gps.test.ts`, `useGeolocation.test.ts`, `GpsLocationLayer.test.tsx`, `studentGpsState.test.ts`, `SearchOverlay.gps.test.tsx`, full `npm test`).
5. ✅ **Checkpoint commit before research/deep-dive for active slices**
   - Evidence: S27 checkpoint artifact + commit-hash resolvability check (`git cat-file -e <hash>^{commit}`).

## Definition of Done Verification
- ✅ All roadmap slices are checked `[x]`.
- ❌ All slice summaries exist: **not met** (`S01-SUMMARY.md` through `S22-SUMMARY.md` missing).
- ✅ Cross-slice integration points function correctly (S24→S25→S26→S27 boundaries covered by targeted tests and full regression).

**Definition-of-done verdict:** needs-attention.

## Requirement Status Transition Validation
Validated transitions confirmed in `.gsd/REQUIREMENTS.md` with slice-backed proof:
- **Active → Validated:** `R001-R015`, `R022`.
- No additional status transitions were required during closeout.

## Code Change Verification
- Requested command (main-based) could not run because repository has no `main` ref.
- Equivalent integration-branch verification run:
  - `git diff --stat $(git merge-base HEAD origin/master) HEAD -- ':!.gsd/'`
  - Result: non-`.gsd/` implementation changes exist (**11 files**, primarily S27 geolocation feature set).

## Final Verification Verdict
**Needs attention (not passing)** due to missing slice-level summary artifacts for S01-S22.
Functional milestone outcomes and test evidence are complete.
