DROP TABLE `program_days`;--> statement-breakpoint
DROP TABLE `program_exercises`;--> statement-breakpoint
DROP TABLE `programs`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_workouts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`notes` text
);
--> statement-breakpoint
INSERT INTO `__new_workouts`("id", "name", "status", "started_at", "completed_at", "notes") SELECT "id", "name", "status", "started_at", "completed_at", "notes" FROM `workouts`;--> statement-breakpoint
DROP TABLE `workouts`;--> statement-breakpoint
ALTER TABLE `__new_workouts` RENAME TO `workouts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;