CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`hero_name` text NOT NULL,
	`civil_name` text DEFAULT '' NOT NULL,
	`concept` text DEFAULT '' NOT NULL,
	`power_level` integer DEFAULT 10 NOT NULL,
	`points_total` integer DEFAULT 150 NOT NULL,
	`points_spent` integer DEFAULT 0 NOT NULL,
	`image_url` text DEFAULT '' NOT NULL,
	`accent` text DEFAULT '#f2a93b' NOT NULL,
	`sheet_json` text NOT NULL,
	`share_enabled` integer DEFAULT false NOT NULL,
	`share_token` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `characters_owner_updated_idx` ON `characters` (`owner_id`,`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `characters_share_token_idx` ON `characters` (`share_token`);