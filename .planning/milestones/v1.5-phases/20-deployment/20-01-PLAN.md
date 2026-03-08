---
phase: 20-deployment
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/server/r2.ts
  - src/server/index.ts
  - package.json
  - package-lock.json
autonomous: true
requirements:
  - DEPL-01
  - DEPL-02

must_haves:
  truths:
    - "npm run build passes with no TypeScript errors after changes"
    - "All image read routes use r2GetBuffer instead of readFile from local disk"
    - "All image write routes use r2PutBuffer instead of writeFile to local disk"
    - "Server binds to process.env.PORT in production (not hardcoded 3001)"
  artifacts:
    - path: "src/server/r2.ts"
      provides: "R2 S3Client singleton with r2GetBuffer and r2PutBuffer helpers"
      exports: ["r2", "BUCKET", "r2GetBuffer", "r2PutBuffer"]
    - path: "src/server/index.ts"
      provides: "Image routes wired to R2 instead of local disk"
      contains: "r2GetBuffer"
    - path: "package.json"
      provides: "@aws-sdk/client-s3 dependency"
      contains: "@aws-sdk/client-s3"
  key_links:
    - from: "src/server/index.ts"
      to: "src/server/r2.ts"
      via: "named import"
      pattern: "from.*r2"
    - from: "src/server/r2.ts"
      to: "@aws-sdk/client-s3"
      via: "npm package"
      pattern: "S3Client|GetObjectCommand|PutObjectCommand"
---

<objective>
Install @aws-sdk/client-s3, create the R2 client module, fix the hardcoded port, and swap all 7 local-disk image I/O calls in src/server/index.ts to use R2.

Purpose: Render's free tier has an ephemeral filesystem — images written to disk vanish on redeploy or idle spin-down. All image reads and writes must go through Cloudflare R2.
Output: src/server/r2.ts (new), src/server/index.ts (modified — 7 call sites + port fix), package.json updated.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/20-deployment/20-CONTEXT.md
@.planning/phases/20-deployment/20-RESEARCH.md

<interfaces>
<!-- Key types and contracts the executor needs. Extracted from src/server/index.ts. -->

From src/server/index.ts (current imports — readFile and writeFile will be removed):
```typescript
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
```

The 7 image I/O locations to swap (exact current code):

1. GET /api/floor-plan/:buildingId/:floorNumber (lines 57-58):
   BEFORE: const filePath = resolve(__dirname, 'assets', floorRow.imagePath)
           const buffer = await readFile(filePath)
   AFTER:  const buffer = await r2GetBuffer(floorRow.imagePath)

2. GET /api/floor-plan/image (lines 75-76):
   BEFORE: const filePath = resolve(__dirname, 'assets/floor-plan.png')
           const buffer = await readFile(filePath)
   AFTER:  const buffer = await r2GetBuffer('floor-plan.png')

3. GET /api/campus/image (lines 115-116):
   BEFORE: const filePath = resolve(__dirname, 'assets', campusFloor.imagePath)
           const buffer = await readFile(filePath)
   AFTER:  const buffer = await r2GetBuffer(campusFloor.imagePath)

4. POST /api/admin/floor-plan (lines 307-308):
   BEFORE: const dest = resolve(__dirname, 'assets/floor-plan.png')
           await writeFile(dest, buffer)
   AFTER:  await r2PutBuffer('floor-plan.png', buffer, file.type)

5. POST /api/admin/floors (lines 334-336):
   BEFORE: const dest = resolve(__dirname, 'assets', filename)
           const buffer = Buffer.from(await file.arrayBuffer())
           await writeFile(dest, buffer)
   AFTER:  const buffer = Buffer.from(await file.arrayBuffer())
           await r2PutBuffer(filename, buffer, file.type)

6. POST /api/admin/floor-plan/:buildingId/:floorNumber (lines 395-397):
   BEFORE: const dest = resolve(__dirname, 'assets', filename)
           const buffer = Buffer.from(await file.arrayBuffer())
           await writeFile(dest, buffer)
   AFTER:  const buffer = Buffer.from(await file.arrayBuffer())
           await r2PutBuffer(filename, buffer, file.type)

7. POST /api/admin/campus/image (lines 421-423):
   BEFORE: const dest = resolve(__dirname, 'assets', filename)
           const buffer = Buffer.from(await file.arrayBuffer())
           await writeFile(dest, buffer)
   AFTER:  const buffer = Buffer.from(await file.arrayBuffer())
           await r2PutBuffer(filename, buffer, file.type)

Port fix (line 463):
   BEFORE: const port = 3001
   AFTER:  const port = Number(process.env.PORT) || 3001
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create src/server/r2.ts and install @aws-sdk/client-s3</name>
  <files>src/server/r2.ts, package.json, package-lock.json</files>
  <action>
Run: npm install @aws-sdk/client-s3

Then create src/server/r2.ts with the following exact content:

```typescript
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

/**
 * Cloudflare R2 S3-compatible client.
 *
 * IMPORTANT: requestChecksumCalculation and responseChecksumValidation must be
 * set to 'WHEN_REQUIRED' for compatibility with R2 on AWS SDK v3.729+.
 * Without this, SDK adds x-amz-checksum-crc32 headers that R2 rejects with 400/501.
 * Source: https://community.cloudflare.com/t/aws-sdk-client-s3-v3-729-0-breaks-uploadpart-and-putobject-r2-s3-api-compatibility/758637
 */
export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

export const BUCKET = process.env.R2_BUCKET_NAME!

/**
 * Download an R2 object as a Node.js Buffer.
 * In AWS SDK v3, Body is a ReadableStream — use transformToByteArray().
 */
export async function r2GetBuffer(key: string): Promise<Buffer> {
  const result = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  if (!result.Body) throw new Error(`R2 object not found: ${key}`)
  const bytes = await result.Body.transformToByteArray()
  return Buffer.from(bytes)
}

/** Upload a Buffer to R2 with the given content type. */
export async function r2PutBuffer(key: string, buffer: Buffer, contentType: string): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )
}
```
  </action>
  <verify>
    <automated>npm run build 2>&1 | grep -E "error|Error" | head -20 || echo "BUILD OK"</automated>
  </verify>
  <done>src/server/r2.ts exists with exported r2 client, BUCKET constant, r2GetBuffer, and r2PutBuffer. @aws-sdk/client-s3 appears in package.json dependencies.</done>
</task>

<task type="auto">
  <name>Task 2: Swap 7 image I/O locations in src/server/index.ts and fix port</name>
  <files>src/server/index.ts</files>
  <action>
Modify src/server/index.ts with these exact changes. Make all changes in one edit pass.

1. Add import for r2GetBuffer and r2PutBuffer at the top of the file (after existing imports):
   ```typescript
   import { r2GetBuffer, r2PutBuffer } from './r2'
   ```

2. Remove `writeFile` from the `node:fs/promises` import (keep `readFile` for the SPA fallback at line 459). The import becomes:
   ```typescript
   import { readFile } from 'node:fs/promises'
   ```

3. Also remove `resolve` and `__dirname` usage from image routes (they are still needed for the migration client path at line 25 and the SPA fallback at line 459, so keep the path imports — do NOT remove `dirname`, `resolve`, `fileURLToPath`, or `__dirname`).

4. Swap the 7 image I/O call sites as specified in the interfaces section above.

5. Fix the port on line 463:
   BEFORE: const port = 3001
   AFTER:  const port = Number(process.env.PORT) || 3001

For the error handling in GET routes: the catch blocks currently check for ENOENT (NodeJS.ErrnoException). After the swap, R2 errors won't have `.code === 'ENOENT'`. Update each catch block in image GET routes to remove the ENOENT branch and return 404 on any error with a descriptive message. For example:

```typescript
// GET /api/floor-plan/:buildingId/:floorNumber catch:
} catch (_err) {
  return c.json({ error: 'Floor plan image not found' }, 404)
}

// GET /api/floor-plan/image catch:
} catch (_err) {
  return c.json({ error: 'Floor plan not found' }, 404)
}

// GET /api/campus/image catch:
} catch (_err) {
  return c.json({ error: 'Campus map image not found' }, 404)
}
```

Keep GET /api/floor-plan/thumbnail as-is but swap readFile to r2GetBuffer('floor-plan-thumb.jpg') — migrating legacy routes for correctness even if they are currently unused.

After changes, the file must still compile. The SPA fallback at line 459 (`readFile('./dist/client/index.html', 'utf-8')`) is NOT an R2 call — leave it unchanged.
  </action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <done>npm run build exits 0. src/server/index.ts contains r2GetBuffer and r2PutBuffer calls. No readFile/writeFile calls remain in image routes. Port line reads `Number(process.env.PORT) || 3001`.</done>
</task>

</tasks>

<verification>
After both tasks complete:
- npm run build exits 0 (tsc --noEmit passes, vite build produces dist/client/)
- grep "readFile\|writeFile" src/server/index.ts shows only the SPA fallback (readFile for index.html)
- grep "r2GetBuffer\|r2PutBuffer" src/server/index.ts shows 7+ matches
- grep "process.env.PORT" src/server/index.ts shows the port fix
- cat package.json | grep "@aws-sdk/client-s3" shows the dependency
</verification>

<success_criteria>
- src/server/r2.ts exists with r2 client, BUCKET, r2GetBuffer, r2PutBuffer
- src/server/index.ts: port reads process.env.PORT, all 7 image I/O calls use R2 helpers
- npm run build passes (TypeScript + Vite)
- No local disk image reads/writes remain in image-serving or image-upload routes
</success_criteria>

<output>
After completion, create `.planning/phases/20-deployment/20-01-SUMMARY.md`
</output>
