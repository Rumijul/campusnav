# S22: Deployment — completed 2026 03 08

**Goal:** unit tests prove Deployment — completed 2026-03-08 works
**Demo:** unit tests prove Deployment — completed 2026-03-08 works

## Must-Haves


## Tasks

- [x] **T01: Install @aws-sdk/client-s3, create the R2 client module, fix the hardcoded port, and…**
  - Install @aws-sdk/client-s3, create the R2 client module, fix the hardcoded port, and swap all 7 local-disk image I/O calls in src/server/index.ts to use R2.
- [x] **T02: Update render.yaml to add the missing DATABASE_URL and four R2 environment variable…**
  - Update render.yaml to add the missing DATABASE_URL and four R2 environment variable declarations. Update .env.example to add R2 variable documentation.
- [x] **T03: Deploy CampusNav to Render and verify all 7 smoke test scenarios on…**
  - Deploy CampusNav to Render and verify all 7 smoke test scenarios on the live URL. This is the final human-action checkpoint for Phase 20 — no code changes, only setup and verification.

## Files Likely Touched

- `src/server/r2.ts`
- `src/server/index.ts`
- `package.json`
- `package-lock.json`
- `render.yaml`
- `.env.example`
