CREATE TABLE `farm_access_codes` (
	`farm_code` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `codes_farm` ON `farm_access_codes` (`farm_id`);--> statement-breakpoint
CREATE TABLE `auth_attempts` (
	`attempt_key` text PRIMARY KEY NOT NULL,
	`failures` integer NOT NULL,
	`reset_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sessions_user` ON `auth_sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `auth_users` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`full_name` text NOT NULL,
	`role` text NOT NULL,
	`worker_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_farm_username` ON `auth_users` (`farm_id`,`username`);--> statement-breakpoint
CREATE INDEX `users_worker` ON `auth_users` (`farm_id`,`worker_id`);