-- Performance indexes for the navigation graph hot path.
-- All use IF NOT EXISTS so the migration is safe to re-run.
--
-- Targets:
--   1. /api/map/skeleton fans out 4 SELECT * scans; these indexes keep
--      per-floor node filtering and edge grouping O(log N) instead of
--      sequential scan.
--   2. DELETE /api/admin/floors/:id cascades by edges.sourceId/targetId
--      — without these indexes the cascade is O(edges) per floor delete.
--   3. PathfindingEngine.getLink() in ngraph does source→target lookups
--      on every route computation; indexes speed it up measurably past
--      ~1k edges.
--
-- Cost: each B-tree index adds ~5–15% write overhead to /api/admin/graph
-- (admin-only, infrequent), negligible read benefit tradeoff.

CREATE INDEX IF NOT EXISTS "floors_building_id_idx" ON "floors" ("building_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nodes_floor_id_idx" ON "nodes" ("floor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "edges_source_id_idx" ON "edges" ("source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "edges_target_id_idx" ON "edges" ("target_id");
