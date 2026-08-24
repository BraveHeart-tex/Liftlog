PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`equipment` text,
	`tracking_type` text DEFAULT 'weight_reps' NOT NULL,
	`primary_muscles` text,
	`secondary_muscles` text,
	`is_custom` integer DEFAULT 0 NOT NULL,
	`is_archived` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_exercises`("id", "name", "normalized_name", "equipment", "tracking_type", "primary_muscles", "secondary_muscles", "is_custom", "is_archived", "created_at") SELECT "id", "name", "normalized_name", "equipment", "tracking_type", "primary_muscles", "secondary_muscles", "is_custom", "is_archived", "created_at" FROM `exercises`;--> statement-breakpoint
DROP TABLE `exercises`;--> statement-breakpoint
ALTER TABLE `__new_exercises` RENAME TO `exercises`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `exercises_is_archived_name_idx` ON `exercises` (`is_archived`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `exercises_active_normalized_name_uidx` ON `exercises` (`normalized_name`) WHERE "exercises"."is_archived" = 0;