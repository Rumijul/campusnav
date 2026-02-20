CREATE TABLE `edges` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`target_id` text NOT NULL,
	`standard_weight` real NOT NULL,
	`accessible_weight` real NOT NULL,
	`accessible` integer NOT NULL,
	`bidirectional` integer NOT NULL,
	`accessibility_notes` text
);
--> statement-breakpoint
CREATE TABLE `graph_metadata` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`building_name` text NOT NULL,
	`floor` integer NOT NULL,
	`last_updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`x` real NOT NULL,
	`y` real NOT NULL,
	`label` text NOT NULL,
	`type` text NOT NULL,
	`searchable` integer NOT NULL,
	`floor` integer NOT NULL,
	`room_number` text,
	`description` text,
	`building_name` text,
	`accessibility_notes` text
);
