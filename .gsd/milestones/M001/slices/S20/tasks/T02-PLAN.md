---
phase: 18-admin-multi-floor-editor
plan: 02
type: execute
wave: 2
depends_on: [18-01]
files_modified:
  - src/server/index.ts
autonomous: true
requirements:
  - MFLR-04
  - CAMP-02

must_haves:
  truths:
    - "POST /api/admin/floors creates a new floor row and uploads its image atomically"
    - "DELETE /api/admin/floors/:id deletes floor + its nodes + edges in FK-safe order"
    - "POST /api/admin/floor-plan/:buildingId/:floorNumber saves per-floor image files named floor-plan-{buildingId}-{floorNumber}.{ext}"
    - "POST /api/admin/campus/image creates Campus building+floor if missing, saves campus-map.{ext}"
    - "GET /api/campus/image serves the campus map image file"
  artifacts:
    - path: "src/server/index.ts"
      provides: "5 new admin routes for multi-floor and campus operations"
      contains: "POST /api/admin/floors"
  key_links:
    - from: "POST /api/admin/floors"
      to: "floors table"
      via: "db.transaction insert building+floor+image write"
      pattern: "tx.insert\\(floors\\)"
    - from: "DELETE /api/admin/floors/:id"
      to: "edges/nodes/floors tables"
      via: "FK-safe delete transaction"
      pattern: "tx.delete\\(edges\\)"
    - from: "POST /api/admin/campus/image"
      to: "buildings + floors tables"
      via: "upsert — create Campus building+floor row if not exists"
      pattern: "Campus"
---

<objective>
Add the five new server API routes that the multi-floor editor and campus editor require: floor CRUD (add/delete), per-floor image upload, campus image upload, and campus image serving.

Purpose: The client-side editor cannot manage floors or upload per-floor images without these endpoints. The campus editor cannot save or load its map without the campus image routes.

Output: src/server/index.ts extended with 5 new routes, all protected by the existing JWT admin guard.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/phases/18-admin-multi-floor-editor/18-CONTEXT.md
@.planning/phases/18-admin-multi-floor-editor/18-RESEARCH.md
@.planning/phases/18-admin-multi-floor-editor/18-01-SUMMARY.md

<interfaces>
<!-- Key patterns from existing server code. Executor needs these to match established style. -->

Existing multipart upload pattern (lines 271-289 of index.ts):
```typescript
app.post('/api/admin/floor-plan', async (c) => {
  const body = await c.req.parseBody()
  const file = body.image
  if (!file || !(file instanceof File)) return c.json({ error: 'No image file provided' }, 400)
  if (!file.type.startsWith('image/')) return c.json({ error: 'File must be an image' }, 400)
  const buffer = Buffer.from(await file.arrayBuffer())
  const dest = resolve(__dirname, 'assets/floor-plan.png')
  await writeFile(dest, buffer)
  return c.json({ ok: true })
})
```

Existing FK-safe transaction pattern (lines 211-257 of index.ts):
```typescript
await db.transaction(async (tx) => {
  await tx.delete(edges)
  await tx.delete(nodes)
  await tx.delete(floors)
  await tx.delete(buildings)
  // ... inserts
})
```

Existing per-floor image serving pattern (lines 41-70):
```typescript
app.get('/api/floor-plan/:buildingId/:floorNumber', async (c) => {
  const buildingId = Number(c.req.param('buildingId'))
  const floorNumber = Number(c.req.param('floorNumber'))
  const [floorRow] = await db.select({ imagePath: floors.imagePath })
    .from(floors)
    .where(and(eq(floors.buildingId, buildingId), eq(floors.floorNumber, floorNumber)))
    .limit(1)
  if (!floorRow) return c.json({ error: 'Floor not found' }, 404)
  const filePath = resolve(__dirname, 'assets', floorRow.imagePath)
  const buffer = await readFile(filePath)
  ...
})
```

Imports already present: readFile, writeFile, resolve, __dirname, db, buildings, edges, floors, nodes, and, eq, inArray (inArray may need to be added to import from drizzle-orm)

JWT guard: app.use('/api/admin/*', jwt({...})) — covers all /api/admin/* routes automatically
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Add POST /api/admin/floors and DELETE /api/admin/floors/:id</name>
  <files>src/server/index.ts</files>
  <action>
    Add these two routes to src/server/index.ts AFTER the existing `POST /api/admin/floor-plan` route (around line 289) and BEFORE the static file serving middleware.

    First, ensure `inArray` is imported from 'drizzle-orm' alongside the existing `and, eq` imports at line 9. Update the import:
    ```typescript
    import { and, eq, inArray } from 'drizzle-orm'
    ```

    **Route 1: POST /api/admin/floors**
    Accepts multipart form with fields: `buildingId` (number), `floorNumber` (number), `image` (File). Creates the floor record and saves the image atomically:

    ```typescript
    app.post('/api/admin/floors', async (c) => {
      try {
        const body = await c.req.parseBody()
        const buildingId = Number(body.buildingId)
        const floorNumber = Number(body.floorNumber)
        const file = body.image
        if (Number.isNaN(buildingId) || Number.isNaN(floorNumber)) {
          return c.json({ error: 'Invalid buildingId or floorNumber' }, 400)
        }
        if (!file || !(file instanceof File)) return c.json({ error: 'No image file provided' }, 400)
        if (!file.type.startsWith('image/')) return c.json({ error: 'File must be an image' }, 400)
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
        const filename = `floor-plan-${buildingId}-${floorNumber}.${ext}`
        const dest = resolve(__dirname, 'assets', filename)
        const buffer = Buffer.from(await file.arrayBuffer())
        await writeFile(dest, buffer)
        const floorRows = await db.insert(floors).values({
          buildingId,
          floorNumber,
          imagePath: filename,
          updatedAt: new Date().toISOString(),
        }).returning({ id: floors.id })
        if (floorRows.length === 0) throw new Error('Failed to insert floor')
        return c.json({ ok: true, floorId: floorRows[0]!.id })
      } catch (err) {
        console.error('Add floor failed:', err)
        return c.json({ error: 'Failed to add floor' }, 500)
      }
    })
    ```

    **Route 2: DELETE /api/admin/floors/:id**
    Deletes the floor and all its nodes + edges in FK-safe order (edges first, then nodes, then floor):

    ```typescript
    app.delete('/api/admin/floors/:id', async (c) => {
      try {
        const floorId = Number(c.req.param('id'))
        if (Number.isNaN(floorId)) return c.json({ error: 'Invalid floor id' }, 400)
        await db.transaction(async (tx) => {
          const floorNodeIds = await tx.select({ id: nodes.id }).from(nodes).where(eq(nodes.floorId, floorId))
          const ids = floorNodeIds.map(n => n.id)
          if (ids.length > 0) {
            await tx.delete(edges).where(inArray(edges.sourceId, ids))
            await tx.delete(edges).where(inArray(edges.targetId, ids))
            await tx.delete(nodes).where(eq(nodes.floorId, floorId))
          }
          await tx.delete(floors).where(eq(floors.id, floorId))
        })
        return c.json({ ok: true })
      } catch (err) {
        console.error('Delete floor failed:', err)
        return c.json({ error: 'Failed to delete floor' }, 500)
      }
    })
    ```
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>POST /api/admin/floors and DELETE /api/admin/floors/:id exist in index.ts; inArray imported; TypeScript compiles without errors</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Add POST /api/admin/floor-plan/:buildingId/:floorNumber, POST /api/admin/campus/image, and GET /api/campus/image</name>
  <files>src/server/index.ts</files>
  <action>
    Add three more routes after the two routes from Task 1.

    **Route 3: POST /api/admin/floor-plan/:buildingId/:floorNumber**
    Replaces the image for an existing floor (nodes preserved since coordinates are normalized). Saves file as `floor-plan-{buildingId}-{floorNumber}.{ext}` and updates `floors.imagePath`:

    ```typescript
    app.post('/api/admin/floor-plan/:buildingId/:floorNumber', async (c) => {
      try {
        const buildingId = Number(c.req.param('buildingId'))
        const floorNumber = Number(c.req.param('floorNumber'))
        if (Number.isNaN(buildingId) || Number.isNaN(floorNumber)) {
          return c.json({ error: 'Invalid building or floor number' }, 400)
        }
        const body = await c.req.parseBody()
        const file = body.image
        if (!file || !(file instanceof File)) return c.json({ error: 'No image file provided' }, 400)
        if (!file.type.startsWith('image/')) return c.json({ error: 'File must be an image' }, 400)
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
        const filename = `floor-plan-${buildingId}-${floorNumber}.${ext}`
        const dest = resolve(__dirname, 'assets', filename)
        const buffer = Buffer.from(await file.arrayBuffer())
        await writeFile(dest, buffer)
        await db.update(floors)
          .set({ imagePath: filename, updatedAt: new Date().toISOString() })
          .where(and(eq(floors.buildingId, buildingId), eq(floors.floorNumber, floorNumber)))
        return c.json({ ok: true })
      } catch (err) {
        console.error('Replace floor image failed:', err)
        return c.json({ error: 'Failed to replace floor image' }, 500)
      }
    })
    ```

    **Route 4: POST /api/admin/campus/image**
    Upsert pattern — creates Campus building+floor if they don't exist, then saves the image:

    ```typescript
    app.post('/api/admin/campus/image', async (c) => {
      try {
        const body = await c.req.parseBody()
        const file = body.image
        if (!file || !(file instanceof File)) return c.json({ error: 'No image file provided' }, 400)
        if (!file.type.startsWith('image/')) return c.json({ error: 'File must be an image' }, 400)
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
        const filename = `campus-map.${ext}`
        const dest = resolve(__dirname, 'assets', filename)
        const buffer = Buffer.from(await file.arrayBuffer())
        await writeFile(dest, buffer)
        // Upsert Campus building
        let [campusBuilding] = await db.select({ id: buildings.id }).from(buildings)
          .where(eq(buildings.name, 'Campus')).limit(1)
        if (!campusBuilding) {
          const rows = await db.insert(buildings).values({ name: 'Campus' }).returning({ id: buildings.id })
          if (rows.length === 0) throw new Error('Failed to create Campus building')
          campusBuilding = rows[0]!
        }
        // Upsert Campus floor (floorNumber = 0 is the sentinel)
        let [campusFloor] = await db.select({ id: floors.id }).from(floors)
          .where(and(eq(floors.buildingId, campusBuilding.id), eq(floors.floorNumber, 0))).limit(1)
        if (!campusFloor) {
          const rows = await db.insert(floors).values({
            buildingId: campusBuilding.id,
            floorNumber: 0,
            imagePath: filename,
            updatedAt: new Date().toISOString(),
          }).returning({ id: floors.id })
          if (rows.length === 0) throw new Error('Failed to create Campus floor')
          campusFloor = rows[0]!
        } else {
          await db.update(floors)
            .set({ imagePath: filename, updatedAt: new Date().toISOString() })
            .where(eq(floors.id, campusFloor.id))
        }
        return c.json({ ok: true, buildingId: campusBuilding.id, floorId: campusFloor.id })
      } catch (err) {
        console.error('Campus image upload failed:', err)
        return c.json({ error: 'Failed to upload campus image' }, 500)
      }
    })
    ```

    **Route 5: GET /api/campus/image** (PUBLIC — no JWT required, placed BEFORE the jwt guard app.use line)
    Wait — GET /api/campus/image is a public route (student view may need it), so it must be placed BEFORE the `app.use('/api/admin/*', jwt(...))` middleware line (line 193). Place it alongside the other public GET routes (after /api/floor-plan/thumbnail, before the auth routes).

    Actually review carefully: GET /api/campus/image does NOT start with /api/admin/, so it is NOT protected by the JWT guard regardless of position. Place it near the other floor-plan serving routes (around line 100-105) for logical grouping:

    ```typescript
    /** Serve the campus overhead map image. */
    app.get('/api/campus/image', async (c) => {
      try {
        const [campusBuilding] = await db.select({ id: buildings.id }).from(buildings)
          .where(eq(buildings.name, 'Campus')).limit(1)
        if (!campusBuilding) return c.json({ error: 'Campus map not found' }, 404)
        const [campusFloor] = await db.select({ imagePath: floors.imagePath }).from(floors)
          .where(and(eq(floors.buildingId, campusBuilding.id), eq(floors.floorNumber, 0))).limit(1)
        if (!campusFloor) return c.json({ error: 'Campus map not found' }, 404)
        const filePath = resolve(__dirname, 'assets', campusFloor.imagePath)
        const buffer = await readFile(filePath)
        const ext = campusFloor.imagePath.split('.').pop()?.toLowerCase()
        const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
        c.header('Content-Type', contentType)
        c.header('Cache-Control', 'public, max-age=3600')
        return c.body(buffer)
      } catch (err: unknown) {
        const code = (err as NodeJS.ErrnoException).code
        if (code === 'ENOENT') return c.json({ error: 'Campus map image not found' }, 404)
        return c.json({ error: 'Failed to read campus map' }, 500)
      }
    })
    ```
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>POST /api/admin/floor-plan/:buildingId/:floorNumber, POST /api/admin/campus/image, GET /api/campus/image all exist in index.ts; TypeScript compiles without errors</done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `npx tsc --noEmit` passes
2. `grep -c "api/admin/floors" src/server/index.ts` returns at least 2 (POST and DELETE)
3. `grep "api/campus/image" src/server/index.ts` returns matches for both GET and POST
4. `grep "inArray" src/server/index.ts` confirms import and usage
5. `grep "Campus" src/server/index.ts` confirms campus upsert logic
</verification>

<success_criteria>
- 5 new routes added to src/server/index.ts
- POST /api/admin/floors: accepts multipart (buildingId, floorNumber, image), creates floor row + writes file
- DELETE /api/admin/floors/:id: FK-safe transaction (edges → nodes → floor)
- POST /api/admin/floor-plan/:buildingId/:floorNumber: replaces per-floor image, updates floors.imagePath
- POST /api/admin/campus/image: upsert Campus building+floor, saves campus-map.{ext}
- GET /api/campus/image: serves campus map from DB path lookup
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/phases/18-admin-multi-floor-editor/18-02-SUMMARY.md`
</output>
