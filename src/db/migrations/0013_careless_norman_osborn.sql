ALTER TABLE `sets` ADD `source_set_id` text;--> statement-breakpoint
CREATE INDEX `sets_source_set_id_idx` ON `sets` (`source_set_id`);--> statement-breakpoint
ALTER TABLE `workout_exercises` ADD `source_workout_exercise_id` text;--> statement-breakpoint
CREATE INDEX `workout_exercises_source_workout_exercise_id_idx` ON `workout_exercises` (`source_workout_exercise_id`);--> statement-breakpoint
ALTER TABLE `workouts` ADD `source_snapshot` text;