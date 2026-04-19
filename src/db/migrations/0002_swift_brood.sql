CREATE INDEX `exercises_is_archived_name_idx` ON `exercises` (`is_archived`,`name`);--> statement-breakpoint
CREATE INDEX `personal_records_exercise_id_achieved_at_idx` ON `personal_records` (`exercise_id`,`achieved_at`);--> statement-breakpoint
CREATE INDEX `personal_records_set_id_idx` ON `personal_records` (`set_id`);--> statement-breakpoint
CREATE INDEX `sets_workout_exercise_id_status_order_idx` ON `sets` (`workout_exercise_id`,`status`,`order`);--> statement-breakpoint
CREATE INDEX `workout_exercises_workout_id_order_idx` ON `workout_exercises` (`workout_id`,`order`);--> statement-breakpoint
CREATE INDEX `workout_exercises_exercise_id_workout_id_idx` ON `workout_exercises` (`exercise_id`,`workout_id`);--> statement-breakpoint
CREATE INDEX `workouts_status_started_at_idx` ON `workouts` (`status`,`started_at`);