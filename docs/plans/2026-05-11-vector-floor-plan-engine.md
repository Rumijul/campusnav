# Vector Floor Plan Engine — Implementation Plan

**Goal:** Replace inconsistent raster PNG floor plans with a metadata-driven vector rendering engine — Apple Maps / Google Maps style. Every building gets the same dark, polished visual language.

**Architecture:** Add a `geometry` JSONB column to `floors` table storing structured wall/room/door/label data in normalized (0–1) coordinates. Build a `<FloorPlanGeometryLayer>` Konva component that draws walls, rooms, doors, and labels from this data with a uniform dark Maps-inspired palette. Dual-mode: if geometry exists → render vector; else → fallback to raster PNG. Zero breaking changes.

**Tech Stack:** Drizzle ORM (PostgreSQL), Konva 10 + react-konva, Hono API, TypeScript, React 19, Tailwind CSS 4.

---

### Task 1: DB migration — add geometry column

**Objective:** Add `geometry` JSONB column to `floors` table

**Files:**
- Create: `drizzle/0004_floor_geometry.sql`
- Modify: `src/server/db/schema.ts` lines 9–19

**Step 1: Create migration file**

```sql
ALTER TABLE "floors" ADD COLUMN "geometry" jsonb;
```

**Step 2: Update Drizzle schema**
Add to `floors` table definition:
```ts
geometry: jsonb('geometry'),
```

Import `jsonb` from `drizzle-orm/pg-core`.

**Step 3: Verify** — server starts with `npm run dev` (migration runs on boot).

---

### Task 2: Add FloorPlanGeometry TypeScript types

**Objective:** Define geometry types in shared types

**Files:**
- Modify: `src/shared/types.ts`

**Add after NavFloorGpsBounds:**

```ts
export interface WallSegment {
  x1: number; y1: number; x2: number; y2: number
}

export interface Wall {
  id: string
  segments: WallSegment[]
  type: 'exterior' | 'interior' | 'glass'
}

export interface RoomPolygon {
  id: string
  polygon: { x: number; y: number }[]
  label: string
  type: 'classroom' | 'office' | 'restroom' | 'lab' | 'stairs' | 'elevator' | 'corridor' | 'other'
}

export interface DoorGeometry {
  id: string
  x: number; y: number
  rotation: number
  type: 'single' | 'double' | 'sliding'
}

export interface FloorLabel {
  id: string
  x: number; y: number
  text: string
  fontSize?: number
}

export interface FloorPlanGeometry {
  /** Logical pixel width of the floor plan (for fit-to-screen scaling) */
  logicalWidth: number
  /** Logical pixel height of the floor plan (for fit-to-screen scaling) */
  logicalHeight: number
  walls: Wall[]
  rooms: RoomPolygon[]
  doors: DoorGeometry[]
  labels: FloorLabel[]
}
```

**Add `geometry?: FloorPlanGeometry` to NavFloor interface.**

---

### Task 3: Server — include geometry in GET /api/map + admin endpoint

**Objective:** Serve geometry data and accept geometry uploads

**Files:**
- Modify: `src/server/index.ts`

**Step 1: GET /api/map** — add `geometry` to floor serialization:
```ts
...(f.geometry != null && { geometry: f.geometry }),
```

**Step 2: Add POST /api/admin/floors/:id/geometry** — accepts JSON body with FloorPlanGeometry:
```ts
app.post('/api/admin/floors/:id/geometry', async (c) => {
  const floorId = Number(c.req.param('id'))
  const body = await c.req.json()
  await db.update(floors)
    .set({ geometry: body, updatedAt: new Date().toISOString() })
    .where(eq(floors.id, floorId))
  return c.json({ ok: true })
})
```

Add `eq` to imports if not already present (it is).

---

### Task 4: Build FloorPlanGeometryLayer renderer

**Objective:** Konva component that draws walls, rooms, doors, labels from geometry

**Files:**
- Create: `src/client/components/FloorPlanGeometryLayer.tsx`

**Architecture:**
- Props: `geometry: FloorPlanGeometry`, `imageRect: {x,y,width,height}` (same as FloorPlanImage reports)
- Computes pixel coordinates from normalized (0–1) * imageRect dimensions
- Uses `Konva.Line` for walls, `Konva.Line` (closed) for room polygons, `Konva.Arc` for doors, `Konva.Text` for labels
- All in a single Konva `Group`

**Maps-inspired dark palette:**
```ts
const STYLE = {
  exteriorWall: { stroke: '#64748b', strokeWidth: 2.5 },
  interiorWall: { stroke: '#475569', strokeWidth: 1.5 },
  glassWall:     { stroke: '#38bdf8', strokeWidth: 1, opacity: 0.3, dash: [4, 4] },
  roomFill:      (type: string) => { /* type-based fills */ },
  corridorFill:  'transparent',
  doorArc:       { stroke: '#94a3b8', strokeWidth: 1, fill: '#1e293b' },
  labelText:     { fill: '#94a3b8', fontFamily: 'system-ui', fontSize: 11 },
  roomLabel:     { fill: '#64748b', fontFamily: 'system-ui', fontSize: 10 },
}
```

**Room type fills:**
```ts
function roomFill(type: string): string {
  switch (type) {
    case 'classroom': return 'rgba(59, 130, 246, 0.06)'    // blue tint
    case 'office':    return 'rgba(100, 116, 139, 0.05)'    // slate tint
    case 'restroom':  return 'rgba(37, 99, 235, 0.08)'     // stronger blue
    case 'lab':       return 'rgba(168, 85, 247, 0.06)'    // purple tint
    case 'stairs':    return 'rgba(245, 158, 11, 0.08)'    // amber tint
    case 'elevator':  return 'rgba(34, 197, 94, 0.08)'     // green tint
    case 'corridor':  return 'transparent'
    default:          return 'transparent'
  }
}
```

**Coordinate conversion helper:**
```ts
function toPixel(nx: number, ny: number, rect: { x: number; y: number; width: number; height: number }) {
  return { x: rect.x + nx * rect.width, y: rect.y + ny * rect.height }
}
```

---

### Task 5: Integrate into FloorPlanCanvas (dual mode)

**Objective:** Render FloorPlanGeometryLayer when geometry exists, fallback to FloorPlanImage

**Files:**
- Modify: `src/client/components/FloorPlanCanvas.tsx`

**Step 1: Import** FloorPlanGeometryLayer

**Step 2: Extract geometry** from active floor's data. The graph state already has `buildings[].floors[]` — find the active floor's geometry.

**Step 3: Replace Layer 2 logic:**
```tsx
<Layer>
  {!isLoading && !isFailed && image && !activeFloorGeometry && (
    <FloorPlanImage ... />
  )}
  {activeFloorGeometry && imageRect && (
    <FloorPlanGeometryLayer
      geometry={activeFloorGeometry}
      imageRect={imageRect}
    />
  )}
</Layer>
```

Wait — there's a problem. When rendering geometry, we don't need the `image` to be loaded at all. And we need to compute `imageRect` from the geometry's `logicalWidth`/`logicalHeight` instead of from `image.naturalWidth`/`image.naturalHeight`.

So the approach should be: if geometry exists, compute imageRect from logicalWidth/logicalHeight (same fit-to-screen math), render the geometry layer. If no geometry, load the image and render FloorPlanImage as before.

Let me refine:

```tsx
// Compute image rect from geometry logical dimensions
const geometryRect = useMemo(() => {
  if (!activeFloorGeometry) return null
  const padding = 40
  const scale = Math.min(
    (width - padding * 2) / activeFloorGeometry.logicalWidth,
    (height - padding * 2) / activeFloorGeometry.logicalHeight,
  )
  const scaledW = activeFloorGeometry.logicalWidth * scale
  const scaledH = activeFloorGeometry.logicalHeight * scale
  return {
    x: (width - scaledW) / 2,
    y: (height - scaledH) / 2,
    width: scaledW,
    height: scaledH,
  }
}, [activeFloorGeometry, width, height])

// imageRect = geometryRect || imageRect from FloorPlanImage
const effectiveRect = activeFloorGeometry ? geometryRect : imageRect

// In JSX Layer 2:
{activeFloorGeometry ? (
  <FloorPlanGeometryLayer geometry={activeFloorGeometry} imageRect={geometryRect!} />
) : (
  !isLoading && !isFailed && image && (
    <FloorPlanImage ... onImageRectChange={setImageRect} />
  )
)}
```

And pass `effectiveRect` to downstream layers that use `imageRect`.

---

### Task 6: Admin UI — geometry management in ManageFloorsModal

**Objective:** Let admins view/edit floor geometry JSON

**Files:**
- Modify: `src/client/components/admin/ManageFloorsModal.tsx`

**Add to each floor row:** A collapsible "Geometry" section with a textarea for the JSON. "Save Geometry" button that POSTs to `/api/admin/floors/:id/geometry`.

This is a textarea for now — the visual trace editor comes later.

---

### Task 7: Verification

**Verification checklist:**
- [ ] Server starts with migration `0004` applied
- [ ] `GET /api/map` includes `geometry` on floors that have it, omits it on floors that don't
- [ ] `POST /api/admin/floors/:id/geometry` accepts and stores geometry
- [ ] FloorPlanCanvas renders geometry when present
- [ ] FloorPlanCanvas renders PNG fallback when no geometry
- [ ] Walls, rooms, doors, labels render with correct colors
- [ ] Pan and zoom work identically in both modes
- [ ] Node/edge layers still render correctly on top of geometry
- [ ] No regressions on existing functionality
