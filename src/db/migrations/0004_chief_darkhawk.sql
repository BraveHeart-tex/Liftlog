PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_workouts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`started_at` integer NOT NULL,
	`date_key` text NOT NULL,
	`completed_at` integer,
	`notes` text
);
--> statement-breakpoint
INSERT INTO `__new_workouts`("id", "name", "status", "started_at", "date_key", "completed_at", "notes") SELECT "id", "name", "status", "started_at", "date_key", "completed_at", "notes" FROM `workouts`;--> statement-breakpoint
DROP TABLE `workouts`;--> statement-breakpoint
ALTER TABLE `__new_workouts` RENAME TO `workouts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `workouts_status_date_key_started_at_idx` ON `workouts` (`status`,`date_key`,`started_at`);--> statement-breakpoint
CREATE INDEX `workouts_status_started_at_idx` ON `workouts` (`status`,`started_at`);