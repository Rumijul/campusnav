---
phase: 20-deployment
plan: 03
type: execute
wave: 2
depends_on:
  - 20-01
  - 20-02
files_modified: []
autonomous: false
requirements:
  - DEPL-01
  - DEPL-02
  - DEPL-03

user_setup:
  - service: render
    why: "Host the Hono API server + React SPA"
    env_vars:
      - name: DATABASE_URL
        source: "Neon Dashboard -> Connection Details -> Connection string"
      - name: JWT_SECRET
        source: "Generate: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
      - name: ADMIN_EMAIL
        source: "Your chosen admin email address"
      - name: ADMIN_PASSWORD_HASH
        source: "Run: npx tsx scripts/hash-password.ts 'your-password'"
      - name: R2_ACCOUNT_ID
        source: "Cloudflare Dashboard -> right sidebar -> Account ID"
      - name: R2_ACCESS_KEY_ID
        source: "Cloudflare R2 -> Manage R2 API Tokens -> Create API Token"
      - name: R2_SECRET_ACCESS_KEY
        source: "Same R2 API Token creation (shown once)"
      - name: R2_BUCKET_NAME
        source: "Name of the R2 bucket you create (e.g., campusnav)"
    dashboard_config:
      - task: "Create a Cloudflare R2 bucket"
        location: "Cloudflare Dashboard -> R2 -> Create bucket"
      - task: "Upload existing floor plan images to R2 bucket"
        location: "Cloudflare R2 bucket -> Upload files"
      - task: "Connect GitHub repo and import render.yaml as Blueprint"
        location: "Render Dashboard -> New -> Blueprint"
      - task: "Set all 8 environment variable values in Render service settings"
        location: "Render Dashboard -> your service -> Environment"
  - service: cloudflare-r2
    why: "Store floor plan and campus map images persistently"
    env_vars: []
    dashboard_config:
      - task: "Create R2 bucket named 'campusnav' (or your chosen name)"
        location: "Cloudflare Dashboard -> R2 Object Storage -> Create bucket"
      - task: "Create R2 API token with Object Read & Write permissions"
        location: "Cloudflare Dashboard -> R2 -> Manage R2 API Tokens -> Create API Token"

must_haves:
  truths:
    - "https://campusnav.onrender.com (or your Render URL) loads the React SPA in browser"
    - "GET /api/health returns { status: 'ok' } on the live Render URL"
    - "Student map shows floor plan image (fetched from R2) with clickable landmarks"
    - "Route computes between two rooms — animated path and directions sheet appear"
    - "Admin login at /admin succeeds with configured credentials"
    - "Admin floor plan upload persists after page reload (R2 write confirmed)"
    - "Admin graph save survives server restart or spin-down (Neon DB write confirmed)"
  artifacts:
    - path: "https://campusnav.onrender.com"
      provides: "Live deployment accessible to users"
  key_links:
    - from: "Render service"
      to: "Neon PostgreSQL"
      via: "DATABASE_URL environment variable"
      pattern: "DEPL-03 satisfied"
    - from: "Render service"
      to: "Cloudflare R2"
      via: "R2_* environment variables + @aws-sdk/client-s3"
      pattern: "image routes return 200"
---

<objective>
Deploy CampusNav to Render and verify all 7 smoke test scenarios on the live URL. This is the final human-action checkpoint for Phase 20 — no code changes, only setup and verification.

Purpose: Confirm that the Wave 1 code changes (Plans 01 and 02) produce a working live deployment. Completes DEPL-01, DEPL-02, and DEPL-03.
Output: Live Render URL serving both the React SPA and the Hono API, with images on R2 and data on Neon.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/20-deployment/20-CONTEXT.md
@.planning/phases/20-deployment/20-VALIDATION.md
@.planning/phases/20-deployment/20-01-SUMMARY.md
@.planning/phases/20-deployment/20-02-SUMMARY.md
</context>

<tasks>

<task type="checkpoint:human-action" gate="blocking">
  <name>Task 1: One-time infrastructure setup (Cloudflare R2 + Render)</name>
  <instructions>
Complete these setup steps before deploying. They require dashboard access that Claude cannot automate.

**Step 1 — Cloudflare R2 bucket setup:**
1. Go to Cloudflare Dashboard -> R2 Object Storage -> Create bucket
2. Name the bucket `campusnav` (matches R2_BUCKET_NAME in .env.example)
3. Select any location or leave as default (auto-routing is fine for a school demo)
4. Go to R2 -> Manage R2 API Tokens -> Create API Token
5. Set permissions: Object Read & Write for the `campusnav` bucket
6. Save the Account ID, Access Key ID, and Secret Access Key — you need these in Step 3

**Step 2 — Upload existing floor plan images to R2:**

Upload all PNG/image files from `src/server/assets/` to the R2 bucket root.
These files are currently untracked in git (listed in git status):
- campus-map.png
- floor-plan-2-2.png, floor-plan-3-1.png, floor-plan-3-2.png
- floor-plan-4-2.png, floor-plan-5-2.png, floor-plan-6-2.png
- floor-plan-6-3.png, floor-plan-7-2.png

Upload via Cloudflare R2 Dashboard -> bucket -> Upload, or use wrangler CLI:
```bash
cd src/server/assets
npx wrangler r2 object put campusnav/campus-map.png --file=campus-map.png --remote
npx wrangler r2 object put campusnav/floor-plan-2-2.png --file=floor-plan-2-2.png --remote
# Repeat for each file
```

**Step 3 — Generate admin credentials:**
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ADMIN_PASSWORD_HASH (replace 'your-password' with your chosen password)
npx tsx scripts/hash-password.ts 'your-password'
```
Save the outputs — you need them for Render environment variables.

**Step 4 — Connect Render to GitHub:**
1. Go to Render Dashboard -> New -> Blueprint
2. Connect your GitHub account if not already connected
3. Select the campusnav repository
4. Render will detect render.yaml and show the `campusnav` web service
5. Click "Apply" — Render will prompt for the 8 `sync: false` env var values

**Step 5 — Set all 8 environment variables in Render:**
In the Blueprint import dialog or Render service -> Environment, set:
- DATABASE_URL: Neon connection string (from Neon Dashboard -> Connection Details)
- JWT_SECRET: value from Step 3
- ADMIN_EMAIL: your admin email
- ADMIN_PASSWORD_HASH: bcrypt hash from Step 3
- R2_ACCOUNT_ID: Cloudflare Account ID (right sidebar in Cloudflare Dashboard)
- R2_ACCESS_KEY_ID: from R2 API Token (Step 1)
- R2_SECRET_ACCESS_KEY: from R2 API Token (Step 1)
- R2_BUCKET_NAME: campusnav

**Step 6 — Trigger first deploy:**
Render auto-deploys on Blueprint import. Watch the deploy logs — build should run `npm ci && npm run build` then start `npm start`. A healthy deploy shows the `/api/health` check passing in the logs.
  </instructions>
  <resume-signal>Type "deployed" when the Render service shows "Live" status and the deploy logs show no errors</resume-signal>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: 7-step smoke test on live Render URL</name>
  <what-built>Complete CampusNav deployment: Hono API + React SPA on Render, images on Cloudflare R2, database on Neon PostgreSQL</what-built>
  <how-to-verify>
Execute all 7 steps on the live Render URL (e.g., https://campusnav.onrender.com). The service may cold-start — wait up to 1 minute for first response.

**1. Health check:**
```bash
curl https://campusnav.onrender.com/api/health
```
Expected: `{"status":"ok","timestamp":"..."}`

**2. Student map loads:**
Open https://campusnav.onrender.com in a browser.
Expected: Floor plan image is visible, landmark markers appear, no console errors.

**3. Route computation:**
Search for two rooms on the same floor. Click "Get Directions".
Expected: Animated dashed path appears on the map AND the directions sheet slides up with step-by-step text.

**4. Multi-floor route:**
Search for two rooms on different floors (e.g., a room on floor 2 and a room on floor 3).
Expected: Route computes, floor tab automatically switches to show the correct floor segment.

**5. Admin login:**
Navigate to https://campusnav.onrender.com/admin
Enter the ADMIN_EMAIL and password you set.
Expected: Redirected to the admin map editor. No 401 error.

**6. Admin floor plan upload (R2 write verification):**
In the admin editor, select a floor and upload a new floor plan image (any PNG).
After upload completes, reload the page (Ctrl+R or Cmd+R).
Expected: The uploaded image is still visible after reload — confirms R2 write succeeded (not just in-memory).

**7. Admin graph save (Neon DB write verification):**
In the admin editor, move a node or change a label. Click Save.
Trigger a server restart: wait for Render to spin down after idle (up to 15 min) OR use the Render Dashboard -> Manual Deploy to force a redeploy.
After restart, reload the admin editor.
Expected: Your change persists — confirms the Neon database write survived the server restart.
  </how-to-verify>
  <resume-signal>Type "approved" if all 7 steps pass. Describe any failures if steps did not pass.</resume-signal>
</task>

</tasks>

<verification>
All 7 smoke test steps pass on the live Render URL:
1. /api/health returns { status: 'ok' }
2. SPA loads with visible floor plan and landmarks
3. Same-floor route: path + directions sheet
4. Multi-floor route: floor tab auto-switches
5. Admin login succeeds
6. Image upload persists after reload (R2 confirmed)
7. Graph save survives restart (Neon confirmed)
</verification>

<success_criteria>
- Live Render URL serves the React SPA (DEPL-01 satisfied)
- /api/health returns 200 (DEPL-02 satisfied)
- Database writes survive server restart (DEPL-03 satisfied — Neon PostgreSQL in use)
- Image uploads persist across redeploy (R2 storage confirmed working)
- All 7 smoke test scenarios pass
</success_criteria>

<output>
After completion, create `.planning/phases/20-deployment/20-03-SUMMARY.md`
</output>
