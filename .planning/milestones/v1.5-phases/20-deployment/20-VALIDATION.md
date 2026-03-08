---
phase: 20
slug: deployment
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-08
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual smoke testing (no automated tests — all verification is infrastructure) |
| **Config file** | none |
| **Quick run command** | `curl https://campusnav.onrender.com/api/health` |
| **Full suite command** | 7-step smoke test checklist (see Manual Verifications below) |
| **Estimated runtime** | ~5 minutes (human-driven) |

---

## Sampling Rate

- **After every task commit:** Verify local build passes (`npm run build`) and server starts with env vars
- **After every plan wave:** Wave 1 = code changes (build check); Wave 2 = deployed (run smoke test)
- **Before `/gsd:verify-work`:** Full 7-step smoke test must pass on live URL
- **Max feedback latency:** 5 minutes (manual check after deploy)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | DEPL-01 | build | `npm run build` | ✅ | ⬜ pending |
| 20-01-02 | 01 | 1 | DEPL-01 | build | `npm run build` | ✅ | ⬜ pending |
| 20-02-01 | 02 | 2 | DEPL-01 | smoke/manual | Load live URL in browser | N/A | ⬜ pending |
| 20-02-02 | 02 | 2 | DEPL-02 | smoke/manual | `curl https://campusnav.onrender.com/api/health` | N/A | ⬜ pending |
| 20-02-03 | 02 | 2 | DEPL-03 | smoke/manual | Route computes, data persists | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

*(This phase has no TDD requirements — all verification is deployment smoke testing. No Wave 0 test stubs needed.)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SPA loads on Render URL | DEPL-01 | Infrastructure deployment — no unit test possible | Open `https://campusnav.onrender.com` in browser; floor plan must be visible |
| `/api/health` returns `{ status: 'ok' }` | DEPL-02 | Live endpoint — requires actual deploy | `curl https://campusnav.onrender.com/api/health` |
| Route computes between rooms | DEPL-01 | Requires full stack live | Search for two rooms, confirm path + directions |
| Multi-floor route switches tab | DEPL-01 | Requires multi-floor data in Neon | Use rooms on different floors, confirm floor tab auto-switches |
| Admin login works | DEPL-02 | Auth flow on live server | Navigate to `/admin`, login with `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` creds |
| Floor plan upload persists | DEPL-02 | R2 write verification — requires live R2 | Upload an image via admin, reload page, confirm image still shows |
| Graph save survives restart | DEPL-03 | DB write via Neon — requires live DB | Save graph in admin, trigger redeploy or wait for spin-down, confirm data persists |

---

## Smoke Test Checklist (7 Steps)

Execute in order after first successful deploy:

1. `GET /api/health` returns `{ status: 'ok' }`
2. Student map loads — floor plan image visible, landmarks clickable
3. Route computes between two rooms — animated path + directions sheet appear
4. Multi-floor route auto-switches floor tab
5. Admin login succeeds at `/admin`
6. Admin floor plan upload → image persists (visible after page reload = R2 write verified)
7. Admin graph save → route data survives server restart (DB write verified)

---

## Validation Sign-Off

- [x] All tasks have `<automated>` build verify or manual smoke test
- [x] Wave 0: no test stubs needed (deployment phase — all manual)
- [x] No watch-mode flags
- [x] Feedback latency < 5 minutes
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
