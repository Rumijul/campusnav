---
phase: 20-deployment
plan: "03"
subsystem: infra
tags: [render, backblaze-b2, neon, deployment, smoke-test, live-url]
dependency_graph:
  requires:
    - phase: 20-01
      provides: B2 image storage module, R2-compatible S3 client, port fix for Render
    - phase: 20-02
      provides: render.yaml with all 9 env var declarations, .env.example reference
  provides:
    - live-url-https://campusnav-hbm3.onrender.com
    - all-7-smoke-tests-passed
    - depl-01-depl-02-depl-03-satisfied
  affects: [future-deployments, end-users, milestone-v1.5-completion]
tech_stack:
  added: []
  patterns:
    - Backblaze B2 as S3-compatible drop-in for Cloudflare R2 (no credit card required)
    - Render Blueprint import with sync:false prompts for all secrets at deploy time
    - Neon PostgreSQL as persistent cloud database surviving server restarts and spin-downs
key_files:
  created: []
  modified: []
decisions:
  - "Switched from Cloudflare R2 to Backblaze B2 — no credit card required, fully S3-compatible; zero code change needed (same @aws-sdk/client-s3 client, different endpoint)"
  - "Render Blueprint deployed via GitHub connection — auto-deploys on push, all 9 env vars (DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH, B2_ACCOUNT_ID, B2_ACCESS_KEY_ID, B2_SECRET_ACCESS_KEY, B2_BUCKET_NAME, B2_ENDPOINT) set in Render service settings"
  - "All existing floor plan images uploaded to Backblaze B2 campusnav bucket as part of one-time setup"

requirements-completed:
  - DEPL-01
  - DEPL-02
  - DEPL-03

metrics:
  duration: "human-action (no automated execution time)"
  completed_date: "2026-03-08"
  tasks_completed: 2
  files_modified: 0
---

# Phase 20 Plan 03: Render Deployment + 7-Step Smoke Test Summary

**CampusNav deployed live at https://campusnav-hbm3.onrender.com — all 7 smoke tests passed with Backblaze B2 image storage and Neon PostgreSQL persistence confirmed.**

## Performance

- **Duration:** Human-action checkpoint (no automated task time)
- **Completed:** 2026-03-08
- **Tasks:** 2 (infrastructure setup + smoke test verification)
- **Files modified:** 0 (setup only — no code changes in this plan)

## Accomplishments

- Backblaze B2 bucket created (`campusnav`) and all 9 existing floor plan images uploaded
- Render Blueprint deployed from GitHub repo with all 9 environment variables configured
- Live URL confirmed working: https://campusnav-hbm3.onrender.com
- All 7 smoke test scenarios passed, completing DEPL-01, DEPL-02, and DEPL-03

## Task Commits

This plan was a human-action checkpoint with no automated code changes. No per-task commits were generated.

The infrastructure setup and smoke test verification were performed manually by the user. The decision to switch from Cloudflare R2 to Backblaze B2 was reflected in code changes committed prior to this plan (commit `5a927dd`).

## Files Created/Modified

None — this plan consisted entirely of manual infrastructure setup and live verification steps.

## Decisions Made

- **Cloudflare R2 → Backblaze B2:** User switched to Backblaze B2 during setup because it requires no credit card (Cloudflare R2 requires a credit card even for free tier). Backblaze B2 is S3-compatible and works as a drop-in replacement using the same `@aws-sdk/client-s3` client — zero code changes required beyond updating env var names (already handled in commit `5a927dd`).

- **9 env vars (not 8):** The B2 endpoint URL (not needed for Cloudflare R2) is required for Backblaze B2. The final set of env vars is: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `B2_ACCOUNT_ID`, `B2_ACCESS_KEY_ID`, `B2_SECRET_ACCESS_KEY`, `B2_BUCKET_NAME`, `B2_ENDPOINT`.

## Smoke Test Results

All 7 scenarios verified on https://campusnav-hbm3.onrender.com:

| # | Test | Result |
|---|------|--------|
| 1 | `GET /api/health` returns `{"status":"ok"}` | PASSED |
| 2 | Student map loads with visible floor plan image and landmark markers | PASSED |
| 3 | Same-floor route: animated dashed path + directions sheet | PASSED |
| 4 | Multi-floor route: floor tab auto-switches to show correct segment | PASSED |
| 5 | Admin login at `/admin` with configured credentials | PASSED |
| 6 | Admin floor plan upload persists after page reload (B2 write confirmed) | PASSED |
| 7 | Admin graph save survives server restart (Neon DB write confirmed) | PASSED |

## Requirements Satisfied

- **DEPL-01:** Live Render URL serves the React SPA — confirmed (browser loads app)
- **DEPL-02:** `/api/health` returns 200 — confirmed (curl verified)
- **DEPL-03:** Database writes survive server restart — confirmed (Neon PostgreSQL, smoke test 7)

## Deviations from Plan

### Provider Change

**[Deviation] Switched image storage provider from Cloudflare R2 to Backblaze B2**
- **Found during:** Task 1 (infrastructure setup)
- **Issue:** Cloudflare R2 requires a credit card even for the free tier; user chose not to provide one
- **Fix:** Created Backblaze B2 bucket instead; updated env var names from `R2_*` to `B2_*`; code already updated in commit `5a927dd` (prior to this plan's execution)
- **Impact:** Zero functional impact — Backblaze B2 is S3-compatible and uses the same AWS SDK client; all 7 smoke tests passed confirming full compatibility

## Issues Encountered

None — all 7 smoke tests passed on first run after infrastructure setup.

## User Setup Required

**Infrastructure setup was the entire purpose of this plan.** The following was completed by the user:

1. Created Backblaze B2 bucket `campusnav`
2. Uploaded all 9 floor plan images from `src/server/assets/` to the B2 bucket
3. Generated `JWT_SECRET` (32-byte random hex) and `ADMIN_PASSWORD_HASH` (bcrypt via `scripts/hash-password.ts`)
4. Connected GitHub repo to Render via Blueprint import
5. Set all 9 environment variables in Render service settings
6. Verified first deploy completed successfully

## Next Phase Readiness

Phase 20 (Deployment) is complete. v1.5 General Support Update milestone is complete.

All requirements have been satisfied:
- **INFR-01:** PostgreSQL (Neon) replaces SQLite — complete (Phase 15)
- **DEPL-01/02/03:** Live deployment on Render with Neon and Backblaze B2 — complete (Phase 20)
- Multi-floor data model, pathfinding, admin editor, student UI — complete (Phases 16–19)

The application is production-ready at https://campusnav-hbm3.onrender.com.

---
*Phase: 20-deployment*
*Completed: 2026-03-08*

## Self-Check: PASSED

- 20-03-SUMMARY.md: CREATED at .planning/phases/20-deployment/20-03-SUMMARY.md
- No task commits to verify (human-action plan, no code changes)
- All 7 smoke tests: user-confirmed PASSED
- Requirements DEPL-01, DEPL-02, DEPL-03: SATISFIED
