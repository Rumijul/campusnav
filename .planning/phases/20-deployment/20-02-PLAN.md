---
phase: 20-deployment
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - render.yaml
  - .env.example
autonomous: true
requirements:
  - DEPL-01
  - DEPL-02
  - DEPL-03

must_haves:
  truths:
    - "render.yaml declares all 8 secrets with sync: false so Render prompts for values on Blueprint import"
    - "render.yaml includes DATABASE_URL (currently missing) and all 4 R2 variables (currently missing)"
    - ".env.example documents all required environment variables including R2 vars"
    - "PORT is NOT declared in render.yaml (Render injects it automatically)"
  artifacts:
    - path: "render.yaml"
      provides: "Complete Render Blueprint with all env var declarations"
      contains: "DATABASE_URL"
    - path: ".env.example"
      provides: "Developer reference for required environment variables"
      contains: "R2_ACCOUNT_ID"
  key_links:
    - from: "render.yaml"
      to: "Render Dashboard"
      via: "Blueprint import — sync:false triggers prompt for secret values"
      pattern: "sync: false"
---

<objective>
Update render.yaml to add the missing DATABASE_URL and four R2 environment variable declarations. Update .env.example to add R2 variable documentation.

Purpose: The existing render.yaml is missing DATABASE_URL and all 4 R2 vars — Render will not prompt for them during Blueprint import, so the app will fail to connect to the database or serve images. The .env.example must also be updated so developers know what to set locally.
Output: render.yaml (modified — adds 5 missing env var entries), .env.example (modified — adds R2 section).
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/20-deployment/20-CONTEXT.md
@.planning/phases/20-deployment/20-RESEARCH.md

<interfaces>
<!-- Current state of both files — executor must update, not replace from scratch. -->

Current render.yaml (7 lines — missing DATABASE_URL + all R2 vars):
```yaml
services:
  - type: web
    name: campusnav
    runtime: node
    plan: free
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        sync: false
      - key: ADMIN_EMAIL
        sync: false
      - key: ADMIN_PASSWORD_HASH
        sync: false
    healthCheckPath: /api/health
```

Target render.yaml (complete — adds DATABASE_URL + 4 R2 vars):
- DATABASE_URL, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
- All with sync: false
- PORT must NOT be added (Render injects it automatically)

Current .env.example (missing R2 section):
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-jwt-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=your-bcrypt-hash
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update render.yaml with complete env var list</name>
  <files>render.yaml</files>
  <action>
Replace render.yaml with the complete version that includes all required environment variables. The structure must match exactly:

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

Key rules:
- PORT is NOT listed — Render sets it automatically; declaring it causes conflicts
- healthCheckPath moved above envVars for readability (both orderings are valid YAML for Render)
- All secrets use sync: false — values are entered via Render Dashboard, never committed
- NODE_ENV=production is the only non-secret value committed inline
  </action>
  <verify>
    <automated>grep -c "sync: false" render.yaml</automated>
  </verify>
  <done>render.yaml has 8 entries with sync: false (DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME). No PORT entry present.</done>
</task>

<task type="auto">
  <name>Task 2: Update .env.example with R2 variables</name>
  <files>.env.example</files>
  <action>
Replace .env.example with the complete version that includes the R2 section and a comment about how to generate the password hash:

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

Notes:
- PORT is not in .env.example — it is set by Render automatically; locally the server defaults to 3001
- R2_BUCKET_NAME example value is "campusnav" (recommended bucket name per Claude's discretion)
- The hash-password.ts comment tells developers how to generate ADMIN_PASSWORD_HASH
  </action>
  <verify>
    <automated>grep -c "R2_" .env.example</automated>
  </verify>
  <done>.env.example contains 4 R2_ variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME) and a comment explaining how to generate ADMIN_PASSWORD_HASH.</done>
</task>

</tasks>

<verification>
After both tasks:
- grep -c "sync: false" render.yaml returns 8
- grep "DATABASE_URL" render.yaml returns a result (was missing before)
- grep "R2_ACCOUNT_ID" render.yaml returns a result (was missing before)
- grep "PORT" render.yaml returns nothing (must not be present)
- grep -c "R2_" .env.example returns 4
</verification>

<success_criteria>
- render.yaml declares all 8 secrets with sync: false
- render.yaml does NOT declare PORT
- .env.example has DATABASE_URL section, Auth section, and Cloudflare R2 section with 4 vars
</success_criteria>

<output>
After completion, create `.planning/phases/20-deployment/20-02-SUMMARY.md`
</output>
