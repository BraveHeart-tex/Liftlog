CREATE TABLE `health_step_days` (
	`date_key` text PRIMARY KEY NOT NULL,
	`steps` integer DEFAULT 0 NOT NULL,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`synced_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `health_step_days_start_at_idx` ON `health_step_days` (`start_at`);--> statement-breakpoint
CREATE INDEX `health_step_days_synced_at_idx` ON `health_step_days` (`synced_at`);