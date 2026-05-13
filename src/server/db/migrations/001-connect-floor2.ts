/**
 * 001-connect-floor2.ts
 *
 * Migration: Add inter-floor connector between Floor 1 (2nd Floor Ramp) and Floor 2 (5 - LSP).
 *
 * Topology:
 *   Floor 1: 2nd Floor Ramp  --connectsToFloorBelowId:F2, connectsToNodeBelowId:stairs-landing-->  (Floor 2 stairs)
 *   Floor 2: Stairs Landing  --connectsToFloorAboveId:F1, connectsToNodeAboveId:ramp----------->  (Floor 1 ramp)
 *              |
 *              |--edge(weight=0.015)--> 5 - LSP
 *
 * Run: npx tsx --env-file=../../.env src/server/db/migrations/001-connect-floor2.ts
 */
import { eq, and } from 'drizzle-orm';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema.js';

const isNeon = process.env.DATABASE_URL?.includes('neon.tech');
const raw = postgres(process.env.DATABASE_URL!, {
  ssl: isNeon ? 'require' : false,
  max: 1,
});
const db = drizzle(raw, { schema });

// ── Known IDs from the live database ────────────────────────────────────────
const FLOOR_1_ID = 38;
const FLOOR_2_ID = 37;
const RAMP_1_ID = 'room-new-node-1771678769152'; // Floor 1 — 2nd Floor Ramp
const LSP_2_ID   = 'room-new-node-1773061030915';  // Floor 2 — 5 - LSP

// 5-LSP coordinates on floor-plan-final.png
const LSP_X = 0.89923096;
const LSP_Y = 0.73387223;

// Place stairs landing node above the LSP in y (SVG y=0 is top)
const STAIRS_2_X = LSP_X;
const STAIRS_2_Y = Math.max(0.01, LSP_Y - 0.06);
const STAIRS_2_ID = `floor2-stairs-landing-${Date.now()}`;

// ── Migration ────────────────────────────────────────────────────────────────

async function migrate() {
  console.log('[migration] Starting Floor 2 connector migration...');

  // 1. Insert a stairs connector node on Floor 2 as the inter-floor landing
  const [stairsNode] = await db.insert(schema.nodes).values({
    id: STAIRS_2_ID,
    x: STAIRS_2_X,
    y: STAIRS_2_Y,
    label: '2nd Floor Stairs SOUTH',
    type: 'stairs',
    searchable: false,
    floorId: FLOOR_2_ID,
    roomNumber: null,
    description: null,
    accessibilityNotes: null,
    connectsToFloorAboveId: null,          // nothing above Floor 2
    connectsToFloorBelowId: FLOOR_1_ID,    // links down to Floor 1
    connectsToNodeAboveId: null,            // nothing above
    connectsToNodeBelowId: RAMP_1_ID,      // links down to Floor 1's ramp
    connectsToBuildingId: null,
  }).returning();

  if (!stairsNode) throw new Error(`Failed to insert stairs landing node`);
  console.log(`[migration] Inserted stairs landing node: ${stairsNode.id}`);

  // 2. Update Floor 1's 2nd Floor Ramp to link UP to Floor 2
  await db.update(schema.nodes)
    .set({ connectsToFloorAboveId: FLOOR_2_ID, connectsToNodeAboveId: STAIRS_2_ID })
    .where(and(eq(schema.nodes.id, RAMP_1_ID), eq(schema.nodes.floorId, FLOOR_1_ID)));
  console.log(`[migration] Linked Floor 1 ramp (${RAMP_1_ID}) → Floor 2`);

  // 3. Update 5-LSP to link DOWN to Floor 1 via the stairs landing
  await db.update(schema.nodes)
    .set({ connectsToFloorBelowId: FLOOR_1_ID, connectsToNodeBelowId: STAIRS_2_ID })
    .where(and(eq(schema.nodes.id, LSP_2_ID), eq(schema.nodes.floorId, FLOOR_2_ID)));
  console.log(`[migration] Linked 5-LSP (${LSP_2_ID}) → Floor 1`);

  // 4. Add intra-floor edge: stairs landing → 5-LSP on Floor 2
  const edgeId = `edge-${STAIRS_2_ID}-${LSP_2_ID}`;
  await db.insert(schema.edges).values({
    id: edgeId,
    sourceId: STAIRS_2_ID,
    targetId: LSP_2_ID,
    standardWeight: 0.015,
    accessibleWeight: 1e10,   // stairs — not accessible
    accessible: false,
    bidirectional: true,
    accessibilityNotes: null,
  });
  console.log(`[migration] Inserted floor-2 edge: ${edgeId}`);

  console.log('[migration] ✓ Migration complete.');
  await raw.end();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('[migration] FAILED:', err);
  raw.end();
  process.exit(1);
});
