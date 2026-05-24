CREATE TABLE `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`tracking_type` text DEFAULT 'weight_reps' NOT NULL,
	`primary_muscles` text DEFAULT '[]' NOT NULL,
	`secondary_muscles` text DEFAULT '[]' NOT NULL,
	`is_custom` integer DEFAULT 0 NOT NULL,
	`is_archived` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `exercises_is_archived_name_idx` ON `exercises` (`is_archived`,`name`);--> statement-breakpoint
CREATE TABLE `personal_records` (
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
);
--> statement-breakpoint
CREATE INDEX `personal_records_exercise_id_achieved_at_idx` ON `personal_records` (`exercise_id`,`achieved_at`);--> statement-breakpoint
CREATE INDEX `personal_records_set_id_idx` ON `personal_records` (`set_id`);--> statement-breakpoint
CREATE TABLE `sets` (
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
);
--> statement-breakpoint
CREATE INDEX `sets_workout_exercise_id_status_order_idx` ON `sets` (`workout_exercise_id`,`status`,`order`);--> statement-breakpoint
CREATE TABLE `workout_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`order` integer NOT NULL,
	`notes` text,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `workout_exercises_workout_id_order_idx` ON `workout_exercises` (`workout_id`,`order`);--> statement-breakpoint
CREATE INDEX `workout_exercises_exercise_id_workout_id_idx` ON `workout_exercises` (`exercise_id`,`workout_id`);--> statement-breakpoint
CREATE TABLE `workout_template_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`order` integer NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `workout_templates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `workout_template_exercises_template_id_order_idx` ON `workout_template_exercises` (`template_id`,`order`);--> statement-breakpoint
CREATE INDEX `workout_template_exercises_exercise_id_template_id_idx` ON `workout_template_exercises` (`exercise_id`,`template_id`);--> statement-breakpoint
CREATE TABLE `workout_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `workout_templates_updated_at_idx` ON `workout_templates` (`updated_at`);--> statement-breakpoint
CREATE INDEX `workout_templates_name_idx` ON `workout_templates` (`name`);--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `workouts_status_started_at_idx` ON `workouts` (`status`,`started_at`);