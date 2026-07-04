ALTER TABLE `workouts` ADD `source_workout_id` text REFERENCES workouts(id);--> statement-breakpoint
CREATE INDEX `workouts_source_workout_id_idx` ON `workouts` (`source_workout_id`);