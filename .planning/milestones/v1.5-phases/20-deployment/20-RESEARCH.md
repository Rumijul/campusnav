# Phase 20: Deployment - Research

**Researched:** 2026-03-07
**Domain:** Node.js deployment (Render), object storage (Cloudflare R2 / AWS SDK v3), environment configuration
**Confidence:** HIGH

## Summary

Phase 20 deploys CampusNav to free, always-on hosting. The database (Neon PostgreSQL) is already cloud-ready from Phase 15. The two remaining tasks are (1) migrating image storage from local disk to Cloudflare R2, and (2) configuring the Render web service to build and run the existing Hono server + React SPA.

A `render.yaml` and `.env.example` already exist in the repo but are both incomplete: `render.yaml` is missing `DATABASE_URL` and all four R2 variables; `.env.example` is missing all five R2 variables. The port fix (`const port = 3001` → `Number(process.env.PORT) || 3001`) and all filesystem image calls also remain unimplemented. The research confirms the stack choices are sound — `@aws-sdk/client-s3` is the correct SDK for R2 with one critical configuration caveat (see Pitfall 1).

**Primary recommendation:** Use `@aws-sdk/client-s3` with `requestChecksumCalculation: 'WHEN_REQUIRED'` and `responseChecksumValidation: 'WHEN_REQUIRED'` — both required for correct R2 compatibility on SDK v3.729+. Scope all R2 operations to a single `src/server/r2.ts` module.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Image storage: Cloudflare R2 (free 10 GB tier); API server proxies from R2 — same endpoint paths, no frontend changes
- Existing images uploaded manually to R2 as one-time setup (currently untracked in git)
- Future admin uploads write directly to R2
- API hosting: Render free tier (750 hrs/month)
- Production start: `tsx src/server/index.ts` (no separate TS compile for server)
- Build command: `npm run build` (= `tsc --noEmit && vite build`)
- One Render service serves both API and SPA (same-origin via `serveStatic`)
- Port fix required: `const port = 3001` → `Number(process.env.PORT) || 3001`
- Render auto-deploy from GitHub on push to main
- Secrets set in Render dashboard — never committed; `.env.example` committed
- `render.yaml` committed for reproducible service config
- Smoke test: structured manual checklist as final verification

### Required environment variables
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET` — secure random string for admin tokens
- `ADMIN_EMAIL` — admin login email
- `ADMIN_PASSWORD_HASH` — bcrypt hash of admin password
- `R2_ACCOUNT_ID` — Cloudflare account ID
- `R2_ACCESS_KEY_ID` — R2 S3-compatible access key
- `R2_SECRET_ACCESS_KEY` — R2 secret key
- `R2_BUCKET_NAME` — R2 bucket name
- `PORT` — set by Render automatically

### Claude's Discretion
- S3-compatible SDK choice for R2 (aws-sdk v3 `@aws-sdk/client-s3` or `@cloudflare/r2-storage`)
- R2 bucket naming convention
- `.env.example` exact format and order
- `render.yaml` exact service name and region

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@aws-sdk/client-s3` | `^3.x` (latest) | R2 reads and writes via S3-compatible API | Official Cloudflare recommendation; native TS types; well-maintained |
| `tsx` | `^4.21.0` (already installed) | Run TypeScript server in production | Already in devDeps; no compile step needed; matches locked decision |
| `render.yaml` (Blueprint) | - | Reproducible Render service config | Render IaC; env var names declared without values for secrets |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `wrangler` CLI | latest (npx, no install) | One-time image upload to R2 bucket | Initial setup only — uploading existing `src/server/assets/*.png` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@aws-sdk/client-s3` | `@cloudflare/r2-storage` (unofficial) | `@cloudflare/r2-storage` is not an official Cloudflare package; `@aws-sdk/client-s3` is documented by Cloudflare |
| `@aws-sdk/client-s3` | AWS SDK v2 (`aws-sdk`) | v2 is in maintenance mode; v3 is the current standard |

**Installation:**
```bash
npm install @aws-sdk/client-s3
```

---

## Architecture Patterns

### Recommended Project Structure Addition
```
src/server/
├── r2.ts            # R2 S3 client + typed helper functions (getObject, putObject)
├── index.ts         # Swap readFile/writeFile for r2.ts calls
assets/              # Local disk (dev only) — unchanged
dist/client/         # Vite SPA output — served by serveStatic
render.yaml          # Root of repo — Render Blueprint
.env.example         # Root of repo — documents required vars
```

### Pattern 1: R2 Client Singleton Module
**What:** Create `src/server/r2.ts` with a single exported `S3Client` instance and typed helper functions. All image routes import from this module — never instantiate S3Client inline.
**When to use:** Any time code reads from or writes to R2.

```typescript
// src/server/r2.ts
// Source: https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  // REQUIRED for SDK v3.729+ compatibility with R2
  // Source: https://community.cloudflare.com/t/aws-sdk-client-s3-v3-729-0-breaks-uploadpart-and-putobject-r2-s3-api-compatibility/758637
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

export const BUCKET = process.env.R2_BUCKET_NAME!

/** Download an R2 object as a Node.js Buffer */
export async function r2GetBuffer(key: string): Promise<Buffer> {
  const result = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  if (!result.Body) throw new Error(`R2 object not found: ${key}`)
  // SDK v3: Body is a ReadableStream — use transformToByteArray()
  const bytes = await result.Body.transformToByteArray()
  return Buffer.from(bytes)
}

/** Upload a Buffer to R2 */
export async function r2PutBuffer(key: string, buffer: Buffer, contentType: string): Promise<void> {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))
}
```

### Pattern 2: Replacing readFile / writeFile Calls
**What:** Each `readFile(filePath)` call becomes `r2GetBuffer(key)`. Each `writeFile(dest, buffer)` call becomes `r2PutBuffer(key, buffer, contentType)`. The R2 object key is the same filename that was previously stored on disk (e.g., `floor-plan-2-2.png`, `campus-map.png`).

```typescript
// BEFORE (disk):
const buffer = await readFile(resolve(__dirname, 'assets', floorRow.imagePath))

// AFTER (R2):
const buffer = await r2GetBuffer(floorRow.imagePath)
```

**When to use:** All 5 image I/O locations in `src/server/index.ts`.

### Pattern 3: render.yaml with sync:false Secrets
**What:** Secrets declared with `sync: false` are NOT committed as values — Render prompts the user during initial Blueprint import. Non-secret values (NODE_ENV) are committed inline.

```yaml
# render.yaml  (committed to git)
services:
  - type: web
    name: campusnav
    runtime: node
    plan: free
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: ADMIN_EMAIL
        sync: false
      - key: ADMIN_PASSWORD_HASH
        sync: false
      - key: R2_ACCOUNT_ID
        sync: false
      - key: R2_ACCESS_KEY_ID
        sync: false
      - key: R2_SECRET_ACCESS_KEY
        sync: false
      - key: R2_BUCKET_NAME
        sync: false
```

Note: `PORT` is injected automatically by Render — do NOT declare it in `render.yaml`.

### Pattern 4: Port Fix
**What:** Render injects a dynamic `PORT` environment variable. The server must read it.

```typescript
// BEFORE (src/server/index.ts line 463):
const port = 3001

// AFTER:
const port = Number(process.env.PORT) || 3001
```

### Anti-Patterns to Avoid
- **Reading `response.Body` directly as a Buffer in AWS SDK v3:** `Body` is a `Readable` stream, not a Buffer. Use `.transformToByteArray()` then `Buffer.from()`.
- **Instantiating `S3Client` per-request:** Singleton is correct — instantiation is expensive.
- **Committing secret values in render.yaml:** Always use `sync: false` for credentials — they are entered through the Render Dashboard UI, not stored in git.
- **Declaring `PORT` in render.yaml envVars:** Render sets `PORT` automatically; redeclaring it can cause conflicts.
- **Relying on `src/server/assets/` on Render:** Render free tier has ephemeral filesystem — files written to disk are lost on redeploy or spin-down. All images MUST go to R2.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| R2 upload/download | Custom HTTP client for S3 API | `@aws-sdk/client-s3` | SigV4 signing, retries, streaming, checksum compatibility — all handled |
| Password hashing for ADMIN_PASSWORD_HASH | Custom hash script | `scripts/hash-password.ts` (already exists) | Script already present: `npx tsx scripts/hash-password.ts 'password'` |
| Bulk image migration to R2 | Custom Node.js upload script | `wrangler r2 object put` loop or AWS CLI `s3 sync` | One-time operation; no need to write code for it |

**Key insight:** The filesystem-to-R2 migration is purely a code swap — same filenames, same routes, same DB records. No data model changes needed.

---

## Common Pitfalls

### Pitfall 1: AWS SDK v3.729+ Checksum Incompatibility with R2
**What goes wrong:** `PutObjectCommand` and `GetObjectCommand` fail with 400/501 errors. Requests include a `x-amz-checksum-crc32` header that R2 does not accept.
**Why it happens:** SDK v3.729.0 (released late 2024) changed default checksum behavior — it now sends checksums on every request. R2 does not support all checksum algorithms.
**How to avoid:** Always configure the S3Client with:
```typescript
requestChecksumCalculation: 'WHEN_REQUIRED',
responseChecksumValidation: 'WHEN_REQUIRED',
```
**Warning signs:** `SignatureDoesNotMatch` or `NotImplemented` errors from R2 after a clean npm install pulls a fresh SDK version.

### Pitfall 2: Render Free Tier Filesystem is Ephemeral
**What goes wrong:** Admin uploads a floor plan image during a session; after redeploy or idle spin-down, the image is gone.
**Why it happens:** Render free tier has no persistent disk. All filesystem writes are lost on restart.
**How to avoid:** Every image write must go to R2 — not to `src/server/assets/`. This is the entire purpose of the R2 migration.
**Warning signs:** Images work after upload but disappear after the next deploy.

### Pitfall 3: Hardcoded Port Blocks Render Binding
**What goes wrong:** Server starts but Render cannot route traffic to it; health check fails; deploy rolls back or service shows unhealthy.
**Why it happens:** Render assigns a dynamic port via `process.env.PORT`. If the server listens on hardcoded 3001, Render's load balancer cannot reach it.
**How to avoid:** `const port = Number(process.env.PORT) || 3001` (3001 is dev fallback only).

### Pitfall 4: `npm start` vs `tsx src/server/index.ts`
**What goes wrong:** `render.yaml` start command `npm start` works because `package.json` `"start": "tsx src/server/index.ts"` exists. If this script is removed or renamed, the deploy silently breaks.
**How to avoid:** Verify `package.json` has `"start": "tsx src/server/index.ts"` — it currently does (confirmed in research). Do not change it.

### Pitfall 5: R2 Credentials Not Set Before First Deploy
**What goes wrong:** Server starts, health check at `/api/health` passes (no R2 call), but any floor plan request crashes with a credentials error.
**Why it happens:** The R2 client is initialized lazily only when an image route is called. Missing env vars cause runtime errors.
**How to avoid:** Set all 4 R2 env vars (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`) in the Render Dashboard before triggering the first deploy. Upload images to R2 bucket before running the smoke test.

### Pitfall 6: Missing R2 Variables in render.yaml
**What goes wrong:** Existing `render.yaml` in repo only declares 3 secrets (`JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`) and is missing `DATABASE_URL` plus all 4 R2 variables. Render will not prompt for the missing ones during Blueprint import.
**How to avoid:** Update `render.yaml` to include all 8 `sync: false` secrets. Similarly, `.env.example` currently missing all R2 vars — must be updated.

---

## Current State: What Already Exists

This is critical context — avoid re-creating things that already exist.

| Item | Status | Notes |
|------|--------|-------|
| `render.yaml` | EXISTS but incomplete | Missing `DATABASE_URL`, all 4 R2 vars |
| `.env.example` | EXISTS but incomplete | Missing all 5 R2 vars + DATABASE_URL already set |
| `scripts/hash-password.ts` | EXISTS | `npx tsx scripts/hash-password.ts 'password'` |
| `npm start` script | EXISTS | `"start": "tsx src/server/index.ts"` in package.json |
| `npm run build` script | EXISTS | `"build": "tsc --noEmit && vite build"` |
| `healthCheckPath` | EXISTS in render.yaml | `/api/health` already declared |
| Port fix | NOT DONE | `src/server/index.ts` line 463: `const port = 3001` |
| R2 image module | NOT DONE | `src/server/r2.ts` does not exist |
| 5 readFile/writeFile swaps | NOT DONE | All 5 locations in `src/server/index.ts` use local disk |
| Images uploaded to R2 | NOT DONE | One-time manual setup step |

---

## Code Examples

### GetObject Body to Buffer (SDK v3)
```typescript
// Source: https://transang.me/modern-fetch-and-how-to-get-buffer-output-from-aws-sdk-v3-getobjectcommand/
const result = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
const bytes = await result.Body!.transformToByteArray()
const buffer = Buffer.from(bytes)
```

### PutObject from Buffer
```typescript
// Source: https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/
await r2.send(new PutObjectCommand({
  Bucket: BUCKET,
  Key: filename,       // e.g., 'floor-plan-2-2.png'
  Body: buffer,
  ContentType: 'image/png',
}))
```

### Wrangler One-Time Image Upload
```bash
# Upload all existing floor plan images to R2 (one-time setup)
# Run from: src/server/assets/
npx wrangler r2 object put campusnav/campus-map.png --file=campus-map.png --remote
npx wrangler r2 object put campusnav/floor-plan-2-2.png --file=floor-plan-2-2.png --remote
# ... repeat for each file
```

Or using AWS CLI with R2 endpoint for bulk sync:
```bash
aws --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com \
  s3 sync src/server/assets/ s3://campusnav/ \
  --exclude "*.json" --exclude "*.sql"
```

### render.yaml (complete corrected version)
```yaml
services:
  - type: web
    name: campusnav
    runtime: node
    plan: free
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: ADMIN_EMAIL
        sync: false
      - key: ADMIN_PASSWORD_HASH
        sync: false
      - key: R2_ACCOUNT_ID
        sync: false
      - key: R2_ACCESS_KEY_ID
        sync: false
      - key: R2_SECRET_ACCESS_KEY
        sync: false
      - key: R2_BUCKET_NAME
        sync: false
```

### .env.example (complete version)
```
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Auth
JWT_SECRET=your-secure-random-string
ADMIN_EMAIL=admin@example.com
# Generate with: npx tsx scripts/hash-password.ts 'your-password'
ADMIN_PASSWORD_HASH=your-bcrypt-hash

# Cloudflare R2 image storage
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=campusnav
```

---

## Image Read/Write Locations (All 5)

Exact locations in `src/server/index.ts` that must be changed:

| Route | Current | Change To |
|-------|---------|-----------|
| `GET /api/floor-plan/:buildingId/:floorNumber` (line 57-58) | `readFile(resolve(__dirname, 'assets', floorRow.imagePath))` | `r2GetBuffer(floorRow.imagePath)` |
| `GET /api/floor-plan/image` (line 74-75) | `readFile(resolve(__dirname, 'assets/floor-plan.png'))` | `r2GetBuffer('floor-plan.png')` |
| `GET /api/campus/image` (line 115-116) | `readFile(resolve(__dirname, 'assets', campusFloor.imagePath))` | `r2GetBuffer(campusFloor.imagePath)` |
| `POST /api/admin/floor-plan` (line 307-308) | `writeFile(dest, buffer)` | `r2PutBuffer('floor-plan.png', buffer, contentType)` |
| `POST /api/admin/floors` (line 334-336) | `writeFile(dest, buffer)` | `r2PutBuffer(filename, buffer, contentType)` |
| `POST /api/admin/floor-plan/:buildingId/:floorNumber` (line 394-397) | `writeFile(dest, buffer)` | `r2PutBuffer(filename, buffer, contentType)` |
| `POST /api/admin/campus/image` (line 422-423) | `writeFile(dest, buffer)` | `r2PutBuffer(filename, buffer, contentType)` |

Note: The CONTEXT.md says "5 places" but the code inspection reveals 7 total (3 reads + 4 writes). The planner should address all 7.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| AWS SDK v2 (`aws-sdk`) | AWS SDK v3 (`@aws-sdk/client-s3`) | v3 is tree-shakable, ESM-native, required for new projects |
| `response.Body.read()` (SDK v2) | `response.Body.transformToByteArray()` (SDK v3) | Body is now a ReadableStream in v3 |
| `autoDeploy: true` in render.yaml | `autoDeployTrigger: commit` | `autoDeploy` is deprecated; omitting `autoDeployTrigger` defaults to commit-triggered deploys |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (installed, no config file — uses package.json `"test": "vitest"`) |
| Config file | none — Wave 0 gap |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEPL-01 | Frontend served from Render (SPA loads) | smoke/manual | Browser: load `https://campusnav.onrender.com` | N/A — manual |
| DEPL-02 | Backend API deployed and responding | smoke/manual | `curl https://campusnav.onrender.com/api/health` | N/A — manual |
| DEPL-03 | Database on Neon cloud PostgreSQL | smoke/manual | Already satisfied from Phase 15 — manual verify via DB connection | N/A — manual |

All DEPL requirements are deployment/infrastructure requirements — they cannot be meaningfully unit-tested. They are verified by the smoke test checklist defined in CONTEXT.md (7 steps).

### Sampling Rate
- **Per task commit:** No automated tests — manual smoke test after full deploy
- **Per wave merge:** Same
- **Phase gate:** Complete 7-step smoke test checklist before marking phase done

### Wave 0 Gaps
- [ ] No vitest config file — `vitest.config.ts` needed if tests are added later
- [ ] No test files for image R2 module — consider adding a minimal smoke test for `r2GetBuffer`/`r2PutBuffer` with a mock in a future phase

*(For this phase, no automated tests are required — all verification is manual deployment smoke testing.)*

---

## Open Questions

1. **`GET /api/floor-plan/image` and `GET /api/floor-plan/thumbnail` usage**
   - What we know: These two routes (`/api/floor-plan/image` and `/api/floor-plan/thumbnail`) read `floor-plan.png` and `floor-plan-thumb.jpg` — v1.0 MVP-era routes, not used by the v1.5 multi-floor client
   - What's unclear: Are these routes still called by any client code, or are they dead code?
   - Recommendation: Migrate them to R2 anyway for correctness — cheap to do, risky to skip

2. **R2 bucket region selection**
   - What we know: R2 uses `region: 'auto'` in the SDK config regardless
   - What's unclear: Cloudflare lets you select a "location hint" at bucket creation time (e.g., EEUR, WNAM) — no user preference specified
   - Recommendation: Default bucket (no location hint) is fine for a school demo app; pick any name like `campusnav`

3. **Cold start ~1 minute vs ~30 seconds**
   - What we know: CONTEXT.md says "cold start ~30s"; official Render docs say "about one minute"
   - What's unclear: Actual cold start time varies by service size and current load
   - Recommendation: Both values indicate acceptable behavior for a school demo; document as "up to 1 minute" in smoke test notes

---

## Sources

### Primary (HIGH confidence)
- [Cloudflare R2 AWS SDK JS v3 docs](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/) — S3Client config, PutObject/GetObject usage
- [Render Blueprint YAML Reference](https://render.com/docs/blueprint-spec) — render.yaml format, sync:false, healthCheckPath, runtime field name (`node` not `nodejs`)
- [Render Free Tier docs](https://render.com/docs/free) — 750 hrs/month, ~1 min cold start, ephemeral filesystem

### Secondary (MEDIUM confidence)
- [Cloudflare Community: SDK v3.729+ checksum fix](https://community.cloudflare.com/t/aws-sdk-client-s3-v3-729-0-breaks-uploadpart-and-putobject-r2-s3-api-compatibility/758637) — `requestChecksumCalculation: 'WHEN_REQUIRED'` workaround; cross-referenced with Cloudflare official SDK docs
- [AWS SDK v3 GetObject Body transformToByteArray](https://transang.me/modern-fetch-and-how-to-get-buffer-output-from-aws-sdk-v3-getobjectcommand/) — stream-to-Buffer pattern; consistent with AWS official migration guide
- [Wrangler R2 CLI](https://developers.cloudflare.com/r2/get-started/cli/) — one-time upload commands

### Tertiary (LOW confidence)
- [Render TypeScript deploy guide](https://dev.to/allcodez/deploying-a-typescript-express-api-to-render-a-complete-journey-1fnb) — confirms `tsx` works for production on Render; single community source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed via Cloudflare official docs and Render official docs
- Architecture: HIGH — patterns derived from official sources and direct code inspection
- Pitfalls: HIGH (checksum pitfall MEDIUM) — most derived from official docs; checksum pitfall from community source cross-referenced with Cloudflare SDK docs

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (Render and R2 free tier specifics; SDK compatibility notes remain current)
