ALTER TABLE `workouts` ADD `date_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `workouts_status_date_key_started_at_idx` ON `workouts` (`status`,`date_key`,`started_at`);