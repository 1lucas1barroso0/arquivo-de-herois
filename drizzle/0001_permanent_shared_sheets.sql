CREATE TABLE `shared_sheets` (
	`token` text PRIMARY KEY NOT NULL,
	`source_character_id` text,
	`hero_name` text NOT NULL,
	`sheet_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `shared_sheets_source_idx` ON `shared_sheets` (`source_character_id`);
