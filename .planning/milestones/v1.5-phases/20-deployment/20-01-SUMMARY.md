---
phase: 20-deployment
plan: 01
subsystem: infra
tags: [cloudflare-r2, aws-sdk, s3, image-storage, render, deployment]

# Dependency graph
requires:
  - phase: 19-student-floor-tab-ui
    provides: "Final feature UI before deployment phase"
provides:
  - "Cloudflare R2 S3-compatible client module (src/server/r2.ts)"
  - "All 7 server image I/O calls swapped from local disk to R2"
  - "Server port reads process.env.PORT for Render compatibility"
affects: [20-deployment, render-deploy]

# Tech tracking
tech-stack:
  added: ["@aws-sdk/client-s3 ^3.1004.0"]
  patterns:
    - "R2 client singleton in dedicated module (src/server/r2.ts)"
    - "requestChecksumCalculation/responseChecksumValidation WHEN_REQUIRED for R2 compatibility with AWS SDK v3.729+"
    - "r2GetBuffer returns Uint8Array<ArrayBuffer> (not Buffer) to satisfy Hono c.body() Data type constraint"

key-files:
  created:
    - "src/server/r2.ts"
  modified:
    - "src/server/index.ts"
    - "package.json"
    - "package-lock.json"

key-decisions:
  - "r2GetBuffer returns Uint8Array<ArrayBuffer> via bytes.slice() — transformToByteArray() returns Uint8Array<ArrayBufferLike> which Hono's Data type (Uint8Array<ArrayBuffer>) rejects; .slice() produces a concrete ArrayBuffer variant"
  - "requestChecksumCalculation and responseChecksumValidation set to WHEN_REQUIRED — AWS SDK v3.729+ adds x-amz-checksum-crc32 headers by default that R2 rejects with 400/501"
  - "ENOENT catch branches removed from image GET routes — R2 errors are not NodeJS.ErrnoException; all errors now return 404 with descriptive message"
  - "Thumbnail route (/api/floor-plan/thumbnail) also swapped to r2GetBuffer — legacy route migrated for consistency even if currently unused"

patterns-established:
  - "R2 module pattern: S3Client singleton + BUCKET constant + r2GetBuffer/r2PutBuffer helpers in isolated module"
  - "Image GET routes: catch any error and return 404 (not ENOENT-specific detection)"

requirements-completed: [DEPL-01, DEPL-02]

# Metrics
duration: 4min
completed: 2026-03-08
---

# Phase 20 Plan 01: R2 Image Storage and Port Fix Summary

**Cloudflare R2 image storage wired to all 7 server image I/O call sites via @aws-sdk/client-s3, replacing ephemeral local disk writes with permanent R2 bucket storage for Render deployment**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-07T16:28:12Z
- **Completed:** 2026-03-07T16:32:12Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `src/server/r2.ts` with Cloudflare R2 S3Client singleton and `r2GetBuffer`/`r2PutBuffer` helpers
- Swapped all 7 image I/O call sites in `src/server/index.ts` from local disk (`readFile`/`writeFile`) to R2 helpers
- Removed `writeFile` from imports; `readFile` kept only for SPA fallback (`./dist/client/index.html`)
- Fixed hardcoded `port = 3001` to `Number(process.env.PORT) || 3001` for Render compatibility
- Updated all image GET route catch blocks to return 404 on any error (removed ENOENT branch)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/server/r2.ts and install @aws-sdk/client-s3** - `4c8bfc3` (feat)
2. **Task 2: Swap 7 image I/O locations and fix port** - `56909c8` (feat)

## Files Created/Modified

- `src/server/r2.ts` - Cloudflare R2 S3Client singleton with r2GetBuffer and r2PutBuffer helpers
- `src/server/index.ts` - All 7 image I/O calls swapped to R2, port fixed, writeFile removed
- `package.json` - @aws-sdk/client-s3 ^3.1004.0 added to dependencies
- `package-lock.json` - Lockfile updated

## Decisions Made

- `r2GetBuffer` returns `Uint8Array<ArrayBuffer>` via `.slice()` instead of `Buffer` — Hono's `Data` type requires `Uint8Array<ArrayBuffer>` (concrete) but `transformToByteArray()` returns `Uint8Array<ArrayBufferLike>` (abstract); `.slice()` produces the concrete variant without copying data overhead
- `requestChecksumCalculation`/`responseChecksumValidation` set to `WHEN_REQUIRED` — required for AWS SDK v3.729+ compatibility with Cloudflare R2 (SDK adds x-amz-checksum-crc32 headers by default that R2 rejects)
- Thumbnail route also migrated to R2 for consistency with other image routes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type mismatch between r2GetBuffer return type and Hono c.body()**
- **Found during:** Task 2 (build verification)
- **Issue:** `Buffer.from(bytes)` returns `Buffer<ArrayBufferLike>` which TypeScript rejected as incompatible with Hono's `Data` type (`Uint8Array<ArrayBuffer>`). Caused 4 TypeScript errors on `c.body(buffer)` calls.
- **Fix:** Changed `r2GetBuffer` return type to `Promise<Uint8Array<ArrayBuffer>>` and used `bytes.slice()` to produce a concrete `ArrayBuffer`-backed Uint8Array
- **Files modified:** `src/server/r2.ts`
- **Verification:** `npm run build` exits 0, no TypeScript errors
- **Committed in:** `56909c8` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 type bug)
**Impact on plan:** Fix was necessary for TypeScript compilation; no scope creep. r2GetBuffer still returns binary image data correctly at runtime.

## Issues Encountered

- AWS SDK v3's `transformToByteArray()` returns `Uint8Array<ArrayBufferLike>` not `Uint8Array<ArrayBuffer>` — resolved by using `.slice()` which always returns a Uint8Array backed by a concrete ArrayBuffer

## User Setup Required

**External services require manual configuration.** Cloudflare R2 credentials must be provided as environment variables:

- `R2_ACCOUNT_ID` — Cloudflare account ID
- `R2_ACCESS_KEY_ID` — R2 API token access key
- `R2_SECRET_ACCESS_KEY` — R2 API token secret key
- `R2_BUCKET_NAME` — R2 bucket name
- `PORT` — Runtime port (Render sets this automatically)
- `DATABASE_URL` — Neon PostgreSQL connection string

## Next Phase Readiness

- R2 image storage module complete and wired to all routes
- Server port reads from environment — Render deployment ready
- Next: Configure Render service, Neon database URL, and R2 credentials in Render dashboard (Plan 02)

---
*Phase: 20-deployment*
*Completed: 2026-03-08*
