CREATE TABLE IF NOT EXISTS `farm_documents` (
  `farm_id` text PRIMARY KEY NOT NULL,
  `payload` text NOT NULL,
  `revision` integer DEFAULT 1 NOT NULL,
  `updated_at` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `farm_access_codes` (
  `farm_code` text PRIMARY KEY NOT NULL,
  `farm_id` text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `codes_farm`
  ON `farm_access_codes` (`farm_id`);

CREATE TABLE IF NOT EXISTS `auth_attempts` (
  `attempt_key` text PRIMARY KEY NOT NULL,
  `failures` integer NOT NULL,
  `reset_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `auth_sessions` (
  `token_hash` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `expires_at` integer NOT NULL
);

CREATE INDEX IF NOT EXISTS `sessions_user`
  ON `auth_sessions` (`user_id`);

CREATE TABLE IF NOT EXISTS `auth_users` (
  `id` text PRIMARY KEY NOT NULL,
  `farm_id` text NOT NULL,
  `username` text NOT NULL,
  `password_hash` text NOT NULL,
  `full_name` text NOT NULL,
  `role` text NOT NULL,
  `worker_id` text
);

CREATE UNIQUE INDEX IF NOT EXISTS `users_farm_username`
  ON `auth_users` (`farm_id`, `username`);

CREATE INDEX IF NOT EXISTS `users_worker`
  ON `auth_users` (`farm_id`, `worker_id`);
