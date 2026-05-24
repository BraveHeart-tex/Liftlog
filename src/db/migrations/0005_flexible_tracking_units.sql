ALTER TABLE `exercises` ADD `tracking_type` text DEFAULT 'weight_reps' NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_exercise_id` text NOT NULL,
	`order` integer NOT NULL,
	`weight_kg` real,
	`reps` integer,
	`distance_meters` real,
	`duration_seconds` integer,
	`rpe` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`workout_exercise_id`) REFERENCES `workout_exercises`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `__new_sets`(`id`, `workout_exercise_id`, `order`, `weight_kg`, `reps`, `rpe`, `status`, `completed_at`) SELECT `id`, `workout_exercise_id`, `order`, `weight_kg`, `reps`, `rpe`, `status`, `completed_at` FROM `sets`;--> statement-breakpoint
DROP TABLE `sets`;--> statement-breakpoint
ALTER TABLE `__new_sets` RENAME TO `sets`;--> statement-breakpoint
CREATE INDEX `sets_workout_exercise_id_status_order_idx` ON `sets` (`workout_exercise_id`,`status`,`order`);--> statement-breakpoint
CREATE TABLE `__new_personal_records` (
	`id` text PRIMARY KEY NOT NULL,
	`exercise_id` text NOT NULL,
	`set_id` text NOT NULL,
	`tracking_type` text DEFAULT 'weight_reps' NOT NULL,
	`score` real NOT NULL,
	`weight_kg` real,
	`reps` integer,
	`distance_meters` real,
	`duration_seconds` integer,
	`estimated_1rm` real NOT NULL,
	`achieved_at` integer NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`set_id`) REFERENCES `sets`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `__new_personal_records`(`id`, `exercise_id`, `set_id`, `tracking_type`, `score`, `weight_kg`, `reps`, `estimated_1rm`, `achieved_at`) SELECT `id`, `exercise_id`, `set_id`, 'weight_reps', `estimated_1rm`, `weight_kg`, `reps`, `estimated_1rm`, `achieved_at` FROM `personal_records`;--> statement-breakpoint
DROP TABLE `personal_records`;--> statement-breakpoint
ALTER TABLE `__new_personal_records` RENAME TO `personal_records`;--> statement-breakpoint
CREATE INDEX `personal_records_exercise_id_achieved_at_idx` ON `personal_records` (`exercise_id`,`achieved_at`);--> statement-breakpoint
CREATE INDEX `personal_records_set_id_idx` ON `personal_records` (`set_id`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
