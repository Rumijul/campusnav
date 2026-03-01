import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { boolean, integer, pgTable, real, serial, text } from 'drizzle-orm/pg-core'

export const buildings = pgTable('buildings', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
})

export const floors = pgTable('floors', {
  id: serial('id').primaryKey(),
  buildingId: integer('building_id').notNull().references(() => buildings.id),
  floorNumber: integer('floor_number').notNull(),
  imagePath: text('image_path').notNull(),
  updatedAt: text('updated_at').notNull(), // ISO 8601 string — matches project text convention
})

export const nodes = pgTable('nodes', {
  id: text('id').primaryKey(),
  x: real('x').notNull(),
  y: real('y').notNull(),
  label: text('label').notNull(),
  type: text('type').notNull(), // NavNodeType string enum
  searchable: boolean('searchable').notNull(),
  floorId: integer('floor_id').notNull().references(() => floors.id), // replaces: floor integer
  // buildingName column REMOVED — derived via floor → building join
  roomNumber: text('room_number'), // nullable
  description: text('description'), // nullable
  accessibilityNotes: text('accessibility_notes'), // nullable
  // Floor connector linkage — nullable on non-connector nodes (stairs/elevator/ramp only)
  connectsToFloorAboveId: integer('connects_to_floor_above_id').references(() => floors.id),
  connectsToFloorBelowId: integer('connects_to_floor_below_id').references(() => floors.id),
  connectsToNodeAboveId: text('connects_to_node_above_id').references((): AnyPgColumn => nodes.id),
  connectsToNodeBelowId: text('connects_to_node_below_id').references((): AnyPgColumn => nodes.id),
})

export const edges = pgTable('edges', {
  id: text('id').primaryKey(),
  sourceId: text('source_id').notNull(),
  targetId: text('target_id').notNull(),
  standardWeight: real('standard_weight').notNull(),
  accessibleWeight: real('accessible_weight').notNull(), // stored as 1e10 for non-accessible (never Infinity — JSON cannot serialize Infinity)
  accessible: boolean('accessible').notNull(),
  bidirectional: boolean('bidirectional').notNull(),
  accessibilityNotes: text('accessibility_notes'), // nullable
})

// graphMetadata table REMOVED — replaced by floors.updated_at
