--> statement-breakpoint
-- Step 1: Create buildings table
CREATE TABLE "buildings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint

-- Step 2: Create floors table
CREATE TABLE "floors" (
	"id" serial PRIMARY KEY NOT NULL,
	"building_id" integer NOT NULL,
	"floor_number" integer NOT NULL,
	"image_path" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "floors" ADD CONSTRAINT "floors_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Step 3: Insert initial seed data (before FK constraints on nodes are added)
INSERT INTO "buildings" ("name") VALUES ('Main Building');
--> statement-breakpoint
INSERT INTO "floors" ("building_id", "floor_number", "image_path", "updated_at")
  VALUES (1, 1, 'floor-plan.png', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
--> statement-breakpoint

-- Step 4: Add new columns to nodes (nullable first, for back-fill)
ALTER TABLE "nodes"
  ADD COLUMN "floor_id" integer,
  ADD COLUMN "connects_to_floor_above_id" integer,
  ADD COLUMN "connects_to_floor_below_id" integer,
  ADD COLUMN "connects_to_node_above_id" text,
  ADD COLUMN "connects_to_node_below_id" text;
--> statement-breakpoint

-- Step 5: Back-fill floor_id for all existing nodes (all belong to Floor 1)
UPDATE "nodes" SET "floor_id" = 1;
--> statement-breakpoint

-- Step 6: Apply NOT NULL constraint now that all rows are populated
ALTER TABLE "nodes" ALTER COLUMN "floor_id" SET NOT NULL;
--> statement-breakpoint

-- Step 7: Add FK constraints on nodes
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_floor_id_floors_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floors"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_connects_to_floor_above_id_floors_id_fk" FOREIGN KEY ("connects_to_floor_above_id") REFERENCES "public"."floors"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_connects_to_floor_below_id_floors_id_fk" FOREIGN KEY ("connects_to_floor_below_id") REFERENCES "public"."floors"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_connects_to_node_above_id_nodes_id_fk" FOREIGN KEY ("connects_to_node_above_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_connects_to_node_below_id_nodes_id_fk" FOREIGN KEY ("connects_to_node_below_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Step 8: Drop old columns from nodes
ALTER TABLE "nodes"
  DROP COLUMN "floor",
  DROP COLUMN "building_name";
--> statement-breakpoint

-- Step 9: Drop graphMetadata table (replaced by floors.updated_at)
DROP TABLE "graph_metadata";
