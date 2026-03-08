---
phase: 19
slug: student-floor-tab-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (via `vite.config.ts`) |
| **Config file** | `vite.config.ts` (no dedicated vitest config) |
| **Quick run command** | `npx vitest run src/client/hooks/ src/shared/__tests__/ --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/client/hooks/ src/shared/__tests__/ --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 1 | MFLR-06 | unit | `npx vitest run src/client/hooks/ --reporter=verbose` | ❌ Wave 0 | ⬜ pending |
| 19-01-02 | 01 | 1 | MFLR-06 | unit | `npx vitest run src/client/hooks/ --reporter=verbose` | ❌ Wave 0 | ⬜ pending |
| 19-02-01 | 02 | 1 | MFLR-05 | unit | `npx vitest run src/shared/__tests__/ --reporter=verbose` | ❌ Wave 0 | ⬜ pending |
| 19-02-02 | 02 | 1 | CAMP-05 | unit | `npx vitest run src/shared/__tests__/ --reporter=verbose` | ✅ extend | ⬜ pending |
| 19-03-01 | 03 | 2 | MFLR-06 | manual | Scenario A, B, C | N/A | ⬜ pending |
| 19-03-02 | 03 | 2 | MFLR-05 | manual | Scenario D, E | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/client/hooks/useFloorFiltering.test.ts` — unit tests for floor filtering pure functions
  - `filterNodesByActiveFloor` — active floor nodes included, other floors excluded
  - `filterNodesByActiveFloor` — elevator nodes from adjacent floors included, dimmed=true
  - `filterNodesByActiveFloor` — stairs/ramp from adjacent floors NOT included
  - `filterRouteSegmentByFloor` — route filtered to active floor only
  - `filterRouteSegmentByFloor` — empty array when no route nodes on floor
  - `totalFloorCount` — returns 1 for single-floor campus (tab strip hides)
  - `totalFloorCount` — returns N for multi-building campus

*No framework install needed — Vitest already configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Default Floor 1 active on load | MFLR-06 | Browser state initialization | Scenario A: open app, verify floor 1 tab highlighted and correct image shown |
| Tab strip hidden when 1 total floor | MFLR-06 | Browser render check | Scenario G: single-floor campus shows zero new chrome |
| Building selector switches floor tabs | MFLR-06 | React event interaction | Scenario C: select different building, verify floor tabs update |
| Tab strip hidden when DirectionsSheet open | MFLR-06 | UI state interaction | Scenario D: compute route, verify tab strip disappears |
| Tab strip reappears on sheet close | MFLR-06 | UI state interaction | Scenario E: close sheet, verify tab strip reappears |
| Auto-switch to start floor on route | MFLR-06 | Route computation trigger | Scenario D step 4: route computed → active floor = start node's floor |
| Route segment per floor correct | MFLR-05 | Visual route rendering | Scenario D/E: only active floor's route segment visible |
| Dimmed connector tap auto-switches | MFLR-06 | Touch/click event | Scenario F: tap dimmed elevator, floor switches automatically |
| Campus building selector tab | CAMP-05 | Campus image rendering | Scenario C variant: select campus building, campus map shows |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
