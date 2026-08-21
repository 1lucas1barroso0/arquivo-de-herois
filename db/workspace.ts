import { and, desc, eq, inArray } from "drizzle-orm";
import { ensureDatabase, getDb } from ".";
import { campaigns, characterRevisions } from "./schema";
import { normalizeSheet, type CharacterSheet } from "../lib/character";
import {
  getRevisionFingerprint,
  MAX_CHARACTER_REVISIONS,
  type CharacterRevision,
} from "../lib/history";
import {
  createCampaignSummary,
  normalizeCampaign,
  type Campaign,
} from "../lib/workspace";

function parseCampaign(row: typeof campaigns.$inferSelect): Campaign {
  return normalizeCampaign({
    ...(JSON.parse(row.campaignJson) as Record<string, unknown>),
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export async function listCampaigns(ownerId: string) {
  await ensureDatabase();
  const db = await getDb();
  const rows = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.ownerId, ownerId))
    .orderBy(desc(campaigns.updatedAt));
  return rows.map((row) => createCampaignSummary(parseCampaign(row)));
}

export async function getCampaign(id: string, ownerId: string) {
  await ensureDatabase();
  const db = await getDb();
  const [row] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.ownerId, ownerId)))
    .limit(1);
  return row ? parseCampaign(row) : null;
}

export async function createCampaign(value: Campaign, ownerId: string) {
  await ensureDatabase();
  const db = await getDb();
  const now = new Date().toISOString();
  const campaign = normalizeCampaign({
    ...value,
    id: randomId(),
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db
    .insert(campaigns)
    .values({
      id: campaign.id,
      ownerId,
      name: campaign.name,
      campaignJson: JSON.stringify(campaign),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return parseCampaign(row);
}

export async function updateCampaign(
  id: string,
  value: Campaign,
  ownerId: string,
) {
  const current = await getCampaign(id, ownerId);
  if (!current) return null;
  const campaign = normalizeCampaign({
    ...value,
    id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  });
  const db = await getDb();
  const [row] = await db
    .update(campaigns)
    .set({
      name: campaign.name,
      campaignJson: JSON.stringify(campaign),
      updatedAt: campaign.updatedAt,
    })
    .where(and(eq(campaigns.id, id), eq(campaigns.ownerId, ownerId)))
    .returning();
  return row ? parseCampaign(row) : null;
}

export async function deleteCampaign(id: string, ownerId: string) {
  await ensureDatabase();
  const db = await getDb();
  const deleted = await db
    .delete(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.ownerId, ownerId)))
    .returning({ id: campaigns.id });
  return deleted.length > 0;
}

export async function recordCharacterRevision(
  value: CharacterSheet,
  ownerId: string,
  label = "Salvamento automático",
) {
  const sheet = normalizeSheet(value);
  if (!sheet.id) return false;
  await ensureDatabase();
  const db = await getDb();
  const fingerprint = getRevisionFingerprint(sheet);
  const [latest] = await db
    .select({ fingerprint: characterRevisions.fingerprint })
    .from(characterRevisions)
    .where(
      and(
        eq(characterRevisions.characterId, sheet.id),
        eq(characterRevisions.ownerId, ownerId),
      ),
    )
    .orderBy(desc(characterRevisions.createdAt))
    .limit(1);
  if (latest?.fingerprint === fingerprint) return false;

  await db.insert(characterRevisions).values({
    id: randomId(),
    characterId: sheet.id,
    ownerId,
    label,
    fingerprint,
    sheetJson: JSON.stringify(sheet),
    createdAt: new Date().toISOString(),
  });
  const rows = await db
    .select({ id: characterRevisions.id })
    .from(characterRevisions)
    .where(
      and(
        eq(characterRevisions.characterId, sheet.id),
        eq(characterRevisions.ownerId, ownerId),
      ),
    )
    .orderBy(desc(characterRevisions.createdAt));
  const stale = rows.slice(MAX_CHARACTER_REVISIONS).map((entry) => entry.id);
  if (stale.length) {
    await db
      .delete(characterRevisions)
      .where(inArray(characterRevisions.id, stale));
  }
  return true;
}

export async function listCharacterRevisions(
  characterId: string,
  ownerId: string,
) {
  await ensureDatabase();
  const db = await getDb();
  return db
    .select({
      id: characterRevisions.id,
      characterId: characterRevisions.characterId,
      createdAt: characterRevisions.createdAt,
      label: characterRevisions.label,
      fingerprint: characterRevisions.fingerprint,
    })
    .from(characterRevisions)
    .where(
      and(
        eq(characterRevisions.characterId, characterId),
        eq(characterRevisions.ownerId, ownerId),
      ),
    )
    .orderBy(desc(characterRevisions.createdAt))
    .limit(MAX_CHARACTER_REVISIONS);
}

export async function getCharacterRevision(
  characterId: string,
  revisionId: string,
  ownerId: string,
): Promise<CharacterRevision | null> {
  await ensureDatabase();
  const db = await getDb();
  const [row] = await db
    .select()
    .from(characterRevisions)
    .where(
      and(
        eq(characterRevisions.id, revisionId),
        eq(characterRevisions.characterId, characterId),
        eq(characterRevisions.ownerId, ownerId),
      ),
    )
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    characterId: row.characterId,
    createdAt: row.createdAt,
    label: row.label,
    fingerprint: row.fingerprint,
    sheet: normalizeSheet(JSON.parse(row.sheetJson)),
  };
}

export async function deleteCharacterRevisions(
  characterId: string,
  ownerId: string,
) {
  await ensureDatabase();
  const db = await getDb();
  await db
    .delete(characterRevisions)
    .where(
      and(
        eq(characterRevisions.characterId, characterId),
        eq(characterRevisions.ownerId, ownerId),
      ),
    );
}

function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}
