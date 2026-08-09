import { drizzle } from "drizzle-orm/d1";
import { getWorkerEnv } from "../lib/cloudflare-runtime";
import { StorageUnavailableError } from "../lib/storage-mode";
import * as schema from "./schema";

let initialization: Promise<void> | null = null;

export async function getDb() {
  const env = await getWorkerEnv();
  if (!env.DB) {
    throw new StorageUnavailableError(
      "Cloudflare D1 binding `DB` is unavailable. Configure the runtime binding as `DB` before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}

export async function ensureDatabase() {
  if (initialization) return initialization;

  initialization = (async () => {
    const env = await getWorkerEnv();
    if (!env.DB) {
      throw new StorageUnavailableError(
        "A conexão persistente está indisponível.",
      );
    }

    await env.DB.batch([
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS characters (
          id TEXT PRIMARY KEY NOT NULL,
          owner_id TEXT NOT NULL,
          hero_name TEXT NOT NULL,
          civil_name TEXT NOT NULL DEFAULT '',
          concept TEXT NOT NULL DEFAULT '',
          power_level INTEGER NOT NULL DEFAULT 10,
          points_total INTEGER NOT NULL DEFAULT 150,
          points_spent INTEGER NOT NULL DEFAULT 0,
          image_url TEXT NOT NULL DEFAULT '',
          accent TEXT NOT NULL DEFAULT '#ffd400',
          sheet_json TEXT NOT NULL,
          share_enabled INTEGER NOT NULL DEFAULT 0,
          share_token TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `),
      env.DB.prepare(
        "CREATE INDEX IF NOT EXISTS characters_owner_updated_idx ON characters (owner_id, updated_at)",
      ),
      env.DB.prepare(
        "CREATE UNIQUE INDEX IF NOT EXISTS characters_share_token_idx ON characters (share_token)",
      ),
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS shared_sheets (
          token TEXT PRIMARY KEY NOT NULL,
          source_character_id TEXT,
          hero_name TEXT NOT NULL,
          sheet_json TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `),
      env.DB.prepare(
        "CREATE INDEX IF NOT EXISTS shared_sheets_source_idx ON shared_sheets (source_character_id)",
      ),
    ]);
  })().catch((error) => {
    initialization = null;
    throw error;
  });

  return initialization;
}
