CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`campaign_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `campaigns_owner_updated_idx` ON `campaigns` (`owner_id`,`updated_at`);
--> statement-breakpoint
CREATE TABLE `character_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`label` text NOT NULL,
	`fingerprint` text NOT NULL,
	`sheet_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `character_revisions_character_created_idx` ON `character_revisions` (`character_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `character_revisions_owner_idx` ON `character_revisions` (`owner_id`);
