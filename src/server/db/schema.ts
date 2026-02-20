import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const nodes = sqliteTable('nodes', {
  id: text('id').primaryKey(),
  x: real('x').notNull(),
  y: real('y').notNull(),
  label: text('label').notNull(),
  type: text('type').notNull(), // NavNodeType string enum
  searchable: integer('searchable', { mode: 'boolean' }).notNull(),
  floor: integer('floor').notNull(),
  roomNumber: text('room_number'), // nullable
  description: text('description'), // nullable
  buildingName: text('building_name'), // nullable
  accessibilityNotes: text('accessibility_notes'), // nullable
})

export const edges = sqliteTable('edges', {
  id: text('id').primaryKey(),
  sourceId: text('source_id').notNull(),
  targetId: text('target_id').notNull(),
  standardWeight: real('standard_weight').notNull(),
  accessibleWeight: real('accessible_weight').notNull(), // stored as 1e10 for non-accessible (never Infinity — JSON cannot serialize Infinity)
  accessible: integer('accessible', { mode: 'boolean' }).notNull(),
  bidirectional: integer('bidirectional', { mode: 'boolean' }).notNull(),
  accessibilityNotes: text('accessibility_notes'), // nullable
})

export const graphMetadata = sqliteTable('graph_metadata', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  buildingName: text('building_name').notNull(),
  floor: integer('floor').notNull(),
  lastUpdated: text('last_updated').notNull(), // ISO 8601 string
})
