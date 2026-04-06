CREATE TABLE `super_admins` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`must_change_credentials` integer DEFAULT true NOT NULL,
	`used_default_credentials` integer DEFAULT true NOT NULL,
	`last_login_at` text,
	`login_history` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `super_admins_username_idx` ON `super_admins` (`username`);