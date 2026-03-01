import { boolean, integer, pgTable, real, serial, text } from 'drizzle-orm/pg-core'

export const nodes = pgTable('nodes', {
  id: text('id').primaryKey(),
  x: real('x').notNull(),
  y: real('y').notNull(),
  label: text('label').notNull(),
  type: text('type').notNull(), // NavNodeType string enum
  searchable: boolean('searchable').notNull(),
  floor: integer('floor').notNull(),
  roomNumber: text('room_number'), // nullable
  description: text('description'), // nullable
  buildingName: text('building_name'), // nullable
  accessibilityNotes: text('accessibility_notes'), // nullable
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

export const graphMetadata = pgTable('graph_metadata', {
  id: serial('id').primaryKey(),
  buildingName: text('building_name').notNull(),
  floor: integer('floor').notNull(),
  lastUpdated: text('last_updated').notNull(), // ISO 8601 string
})
