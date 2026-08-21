import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const characters = sqliteTable(
  "characters",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    heroName: text("hero_name").notNull(),
    civilName: text("civil_name").notNull().default(""),
    concept: text("concept").notNull().default(""),
    powerLevel: integer("power_level").notNull().default(10),
    pointsTotal: integer("points_total").notNull().default(150),
    pointsSpent: integer("points_spent").notNull().default(0),
    imageUrl: text("image_url").notNull().default(""),
    accent: text("accent").notNull().default("#ffd400"),
    sheetJson: text("sheet_json").notNull(),
    shareEnabled: integer("share_enabled", { mode: "boolean" })
      .notNull()
      .default(false),
    shareToken: text("share_token"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("characters_owner_updated_idx").on(table.ownerId, table.updatedAt),
    uniqueIndex("characters_share_token_idx").on(table.shareToken),
  ],
);

/**
 * Public shares are durable snapshots, deliberately independent from the
 * owner's editable character. A published URL therefore keeps working even
 * when the source sheet is later renamed, unshared or deleted.
 */
export const sharedSheets = sqliteTable(
  "shared_sheets",
  {
    token: text("token").primaryKey(),
    sourceCharacterId: text("source_character_id"),
    heroName: text("hero_name").notNull(),
    sheetJson: text("sheet_json").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("shared_sheets_source_idx").on(table.sourceCharacterId),
  ],
);

export const campaigns = sqliteTable(
  "campaigns",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
    campaignJson: text("campaign_json").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("campaigns_owner_updated_idx").on(table.ownerId, table.updatedAt),
  ],
);

export const characterRevisions = sqliteTable(
  "character_revisions",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id").notNull(),
    ownerId: text("owner_id").notNull(),
    label: text("label").notNull(),
    fingerprint: text("fingerprint").notNull(),
    sheetJson: text("sheet_json").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("character_revisions_character_created_idx").on(
      table.characterId,
      table.createdAt,
    ),
    index("character_revisions_owner_idx").on(table.ownerId),
  ],
);
