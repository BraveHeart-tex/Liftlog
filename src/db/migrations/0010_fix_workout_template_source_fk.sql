PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_workout_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`source_workout_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`source_workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_workout_templates`("id", "name", "source_workout_id", "created_at", "updated_at") SELECT "id", "name", "source_workout_id", "created_at", "updated_at" FROM `workout_templates`;--> statement-breakpoint
DROP TABLE `workout_templates`;--> statement-breakpoint
ALTER TABLE `__new_workout_templates` RENAME TO `workout_templates`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `workout_templates_source_workout_id_idx` ON `workout_templates` (`source_workout_id`);--> statement-breakpoint
CREATE INDEX `workout_templates_updated_at_idx` ON `workout_templates` (`updated_at`);--> statement-breakpoint
CREATE INDEX `workout_templates_name_idx` ON `workout_templates` (`name`);