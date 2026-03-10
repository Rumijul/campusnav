---
phase: 21
slug: touch-gesture-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^4.0.18 |
| **Config file** | none — vitest picks up from vite.config.ts or package.json "test" script |
| **Quick run command** | `npx vitest run src/client/hooks/useMapViewport.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/client/hooks/useMapViewport.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 0 | TOUCH-01, TOUCH-02, TOUCH-03 | unit | `npx vitest run src/client/hooks/useMapViewport.test.ts` | ❌ W0 | ⬜ pending |
| 21-02-01 | 02 | 1 | TOUCH-01 | unit | `npx vitest run src/client/hooks/useMapViewport.test.ts` | ❌ W0 | ⬜ pending |
| 21-02-02 | 02 | 1 | TOUCH-01 | unit | `npx vitest run src/client/hooks/useMapViewport.test.ts` | ❌ W0 | ⬜ pending |
| 21-02-03 | 02 | 1 | TOUCH-01 | unit | `npx vitest run src/client/hooks/useMapViewport.test.ts` | ❌ W0 | ⬜ pending |
| 21-03-01 | 03 | 1 | TOUCH-02 | unit | `npx vitest run src/client/hooks/useMapViewport.test.ts` | ❌ W0 | ⬜ pending |
| 21-03-02 | 03 | 1 | TOUCH-02 | unit | `npx vitest run src/client/hooks/useMapViewport.test.ts` | ❌ W0 | ⬜ pending |
| 21-04-01 | 04 | 1 | TOUCH-03 | unit | `npx vitest run src/client/hooks/useMapViewport.test.ts` | ❌ W0 | ⬜ pending |
| 21-04-02 | 04 | 1 | TOUCH-03 | unit | `npx vitest run src/client/hooks/useMapViewport.test.ts` | ❌ W0 | ⬜ pending |
| 21-04-03 | 04 | 1 | TOUCH-03 | unit | `npx vitest run src/client/hooks/useMapViewport.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/client/hooks/useMapViewport.test.ts` — stubs for TOUCH-01, TOUCH-02, TOUCH-03
- [ ] If `toStageLocal` helper is extracted: test stubs for the helper function

*All tests target the gesture math functions. If math is inlined, tests cover the logic as pure formula tests (not full hook rendering).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Map does not jump during pinch-zoom on 45° rotated floor plan | TOUCH-01 | Requires physical touch device or emulator | Open any floor plan on a mobile device, rotate it ~45°, then slowly pinch-zoom — the map should stay stationary under both fingers |
| Rotation pivots visibly around finger midpoint | TOUCH-02 | Requires physical touch device or emulator | Place two fingers on a rotated floor plan and slowly rotate — the midpoint between fingers should not move on screen |
| Pure pinch gesture does not rotate the map | TOUCH-03 | Requires physical touch device or emulator | Perform a slow pinch-zoom with minimal finger rotation — the map rotation should not change (≤2° threshold) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
