# Phase 20: Deployment - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy CampusNav to free always-on hosting: Hono API server + built React SPA on Render, floor plan images on Cloudflare R2, database on Neon (already cloud from Phase 15). This phase deploys what's been built — no new features.

</domain>

<decisions>
## Implementation Decisions

### Image storage
- Move from local disk (`src/server/assets/`) to **Cloudflare R2** (free 10GB tier)
- API server proxies images from R2 — same endpoint paths (`/api/floor-plan/:buildingId/:floorNumber`, `/api/campus/image`) — no frontend changes
- Existing images (campus-map.png, floor-plan-*.png currently untracked in git) uploaded manually to R2 as a one-time setup step during initial deploy
- Future uploads via admin panel write directly to R2

### API hosting platform
- **Render** free tier (750 hrs/month web service)
- Production start: `tsx src/server/index.ts` (no separate TS compile step for server)
- Build command: `npm run build` (runs `tsc --noEmit && vite build` — produces `dist/client/`)
- One Render service serves both API and React SPA (via `serveStatic({ root: './dist/client' })`)
- Port fix required: change hardcoded `const port = 3001` to `const port = Number(process.env.PORT) || 3001`
- Render spins down after 15min idle (cold start ~30s) — acceptable for school demo use

### Frontend hosting strategy
- Same-origin deployment: frontend served by the Hono server from `dist/client/`
- No VITE_API_URL env var needed — client already uses relative `/api/*` paths (confirmed: no hardcoded localhost in `src/client/`)
- Default Render subdomain (e.g., `campusnav.onrender.com`) — no custom domain for now
- Vite dev proxy (`/api → localhost:3001`) is dev-only, no change needed

### Deployment workflow
- **Render auto-deploy**: connect GitHub repo, auto-builds and deploys on push to `main`
- **Environment variables**: secrets set in Render dashboard (never committed); `.env.example` committed to document required vars
- **render.yaml**: committed to git for reproducible Render service config (build command, start command, env var names)
- **Smoke test**: structured manual checklist as the final verification step (see below)

### Required environment variables (production)
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET` — secure random string for admin tokens
- `ADMIN_EMAIL` — admin login email
- `ADMIN_PASSWORD_HASH` — bcrypt hash of admin password
- `R2_ACCOUNT_ID` — Cloudflare account ID
- `R2_ACCESS_KEY_ID` — R2 S3-compatible access key
- `R2_SECRET_ACCESS_KEY` — R2 secret key
- `R2_BUCKET_NAME` — R2 bucket name
- `PORT` — set by Render automatically; app reads via `process.env.PORT`

### Smoke test checklist (post-deploy verification)
1. `GET /api/health` returns `{ status: 'ok' }`
2. Student map loads — floor plan image visible, landmarks clickable
3. Route computes between two rooms — animated path + directions sheet appear
4. Multi-floor route auto-switches floor tab
5. Admin login succeeds at `/admin`
6. Admin floor plan upload → image persists (visible after page reload = R2 write verified)
7. Admin graph save → route data survives server restart (DB write verified)

### Claude's Discretion
- S3-compatible SDK choice for R2 (aws-sdk v3 `@aws-sdk/client-s3` or `@cloudflare/r2-storage`)
- R2 bucket naming convention
- `.env.example` exact format and order
- render.yaml exact service name and region

</decisions>

<specifics>
## Specific Ideas

- No specific references — standard free-tier deployment for a school demo app
- Render chosen for simplicity (no Docker required, native Node.js, git-connected auto-deploy)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/server/index.ts`: All image read/write calls use `resolve(__dirname, 'assets', filename)` — all need to be swapped to R2 SDK calls. Five places: three read endpoints and two write endpoints (admin upload routes)
- `package.json` `"build"`: `tsc --noEmit && vite build` — outputs to `dist/client/`, correct for Render

### Established Patterns
- Images stored with deterministic filenames: `floor-plan-{buildingId}-{floorNumber}.{ext}`, `campus-map.{ext}` — same naming reused as R2 object keys
- `serveStatic({ root: './dist/client' })` + fallback HTML route already handles SPA routing — no change needed
- `postgres-js` already used (Phase 15) — Neon connection ready via `DATABASE_URL` env var

### Integration Points
- Port: `src/server/index.ts` line 463 — `const port = 3001` → must become `Number(process.env.PORT) || 3001`
- Image reads: `src/server/index.ts` — `readFile(filePath)` calls in 3 GET routes
- Image writes: `src/server/index.ts` — `writeFile(dest, buffer)` calls in 4 POST admin routes
- New files to add: `render.yaml`, `.env.example`

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 20-deployment*
*Context gathered: 2026-03-07*
