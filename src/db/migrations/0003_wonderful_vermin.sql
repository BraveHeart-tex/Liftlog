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
CREATE INDEX `workout_templates_name_idx` ON `workout_templates` (`name`);