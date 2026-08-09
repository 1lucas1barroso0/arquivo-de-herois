import { and, desc, eq } from "drizzle-orm";
import { ensureDatabase, getDb } from ".";
import { characters, sharedSheets } from "./schema";
import {
  normalizeSheet,
  type CharacterSheet,
  type SheetSummary,
} from "../lib/character";
import {
  createExampleSheets,
  EXAMPLE_SHEET_NAMES,
} from "../lib/example-sheets";
import {
  createSummary,
  getPointBreakdown,
  getPointBudget,
  pointsSpent,
} from "../lib/rules";

function parseRow(row: typeof characters.$inferSelect): CharacterSheet {
  const stored = JSON.parse(row.sheetJson) as Record<string, unknown>;
  const sheet = normalizeSheet({
    ...stored,
    pointsTotal: stored.pointsTotal ?? row.pointsTotal,
  });
  return {
    ...sheet,
    id: row.id,
    heroName: row.heroName,
    civilName: row.civilName,
    concept: row.concept,
    powerLevel: row.powerLevel,
    imageUrl: row.imageUrl,
    accent: row.accent,
    shareEnabled: row.shareEnabled,
    shareToken: row.shareToken,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toValues(sheet: CharacterSheet, ownerId: string) {
  const now = new Date().toISOString();
  return {
    id: sheet.id || randomId(),
    ownerId,
    heroName: sheet.heroName || "Herói sem nome",
    civilName: sheet.civilName || "",
    concept: sheet.concept || "",
    powerLevel: Number(sheet.powerLevel) || 0,
    pointsTotal: getPointBudget(sheet),
    pointsSpent: pointsSpent(sheet),
    imageUrl: sheet.imageUrl || "",
    accent: sheet.accent || "#ffd400",
    sheetJson: JSON.stringify(sheet),
    shareEnabled: Boolean(sheet.shareEnabled),
    // A token, once issued, is permanent. `shareEnabled` controls whether the
    // editable source keeps its public snapshot in sync, never URL validity.
    shareToken: sheet.shareToken || null,
    updatedAt: now,
  };
}

function toSummary(sheet: CharacterSheet): SheetSummary {
  return createSummary(sheet);
}

export async function listCharacters(ownerId: string) {
  await ensureDatabase();
  const db = await getDb();
  let rows = await db
    .select()
    .from(characters)
    .where(eq(characters.ownerId, ownerId))
    .orderBy(desc(characters.updatedAt));

  if (rows.length === 0) {
    await seedExampleCharacters(ownerId);
    rows = await db
      .select()
      .from(characters)
      .where(eq(characters.ownerId, ownerId))
      .orderBy(desc(characters.updatedAt));
  } else {
    const refreshed = await refreshLegacyExamples(rows, ownerId);
    if (refreshed) {
      rows = await db
        .select()
        .from(characters)
        .where(eq(characters.ownerId, ownerId))
        .orderBy(desc(characters.updatedAt));
    }
  }

  return rows.map((row) => toSummary(parseRow(row)));
}

export async function getCharacter(id: string, ownerId: string) {
  await ensureDatabase();
  const db = await getDb();
  const [row] = await db
    .select()
    .from(characters)
    .where(and(eq(characters.id, id), eq(characters.ownerId, ownerId)))
    .limit(1);
  return row ? parseRow(row) : null;
}

export async function createCharacter(sheet: CharacterSheet, ownerId: string) {
  await ensureDatabase();
  const db = await getDb();
  const values = toValues({
    ...sheet,
    id: sheet.id || randomId(),
    shareEnabled: false,
    shareToken: null,
  }, ownerId);
  const [row] = await db.insert(characters).values(values).returning();
  return parseRow(row);
}

export async function updateCharacter(
  id: string,
  sheet: CharacterSheet,
  ownerId: string,
) {
  await ensureDatabase();
  const db = await getDb();
  const [current] = await db
    .select({
      shareEnabled: characters.shareEnabled,
      shareToken: characters.shareToken,
    })
    .from(characters)
    .where(and(eq(characters.id, id), eq(characters.ownerId, ownerId)))
    .limit(1);
  if (!current) return null;
  const values = toValues({
    ...sheet,
    id,
    shareEnabled: current.shareEnabled,
    shareToken: current.shareToken,
  }, ownerId);
  const [row] = await db
    .update(characters)
    .set(values)
    .where(and(eq(characters.id, id), eq(characters.ownerId, ownerId)))
    .returning();
  if (!row) return null;
  const parsed = parseRow(row);
  if (parsed.shareToken && parsed.shareEnabled) {
    await upsertSharedSnapshot(parsed);
  }
  return parsed;
}

export async function deleteCharacter(id: string, ownerId: string) {
  await ensureDatabase();
  const db = await getDb();
  const deleted = await db
    .delete(characters)
    .where(and(eq(characters.id, id), eq(characters.ownerId, ownerId)))
    .returning({ id: characters.id });
  return deleted.length > 0;
}

export async function setCharacterSharing(
  id: string,
  ownerId: string,
  enabled: boolean,
) {
  await ensureDatabase();
  const db = await getDb();
  const existing = await getCharacter(id, ownerId);
  if (!existing) return null;
  const token = existing.shareToken || randomShareToken();
  const [row] = await db
    .update(characters)
    .set({
      shareEnabled: enabled,
      shareToken: token,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(characters.id, id), eq(characters.ownerId, ownerId)))
    .returning();
  if (!row) return null;
  const parsed = parseRow(row);
  if (enabled) await upsertSharedSnapshot(parsed);
  return parsed;
}

export async function getSharedCharacter(token: string) {
  if (!/^[a-z0-9]{20,64}$/i.test(token)) return null;
  await ensureDatabase();
  const db = await getDb();
  const [snapshot] = await db
    .select()
    .from(sharedSheets)
    .where(eq(sharedSheets.token, token))
    .limit(1);
  if (snapshot) {
    return normalizeSheet({
      ...(JSON.parse(snapshot.sheetJson) as Record<string, unknown>),
      id: "",
      shareEnabled: true,
      shareToken: snapshot.token,
      updatedAt: snapshot.updatedAt,
    });
  }

  // Lazy migration for links issued before durable snapshots existed.
  const [row] = await db
    .select()
    .from(characters)
    .where(eq(characters.shareToken, token))
    .limit(1);
  if (!row) return null;
  const sheet = parseRow(row);
  await upsertSharedSnapshot(sheet);
  return { ...sheet, id: "", shareEnabled: true, shareToken: token };
}

async function upsertSharedSnapshot(sheet: CharacterSheet) {
  if (!sheet.shareToken) return;
  const db = await getDb();
  const now = new Date().toISOString();
  const publicSheet = normalizeSheet({
    ...sheet,
    id: "",
    shareEnabled: true,
    shareToken: sheet.shareToken,
  });
  await db
    .insert(sharedSheets)
    .values({
      token: sheet.shareToken,
      sourceCharacterId: sheet.id,
      heroName: sheet.heroName || "Herói sem nome",
      sheetJson: JSON.stringify(publicSheet),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: sharedSheets.token,
      set: {
        sourceCharacterId: sheet.id,
        heroName: sheet.heroName || "Herói sem nome",
        sheetJson: JSON.stringify(publicSheet),
        updatedAt: now,
      },
    });
}

function randomShareToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes)
    .map((byte) => byte.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 28);
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

async function seedExampleCharacters(ownerId: string) {
  const db = await getDb();
  const demos = createExampleSheets();

  const now = Date.now();
  await db.insert(characters).values(
    demos.map((sheet, index) => ({
      ...toValues({ ...sheet, id: randomId() }, ownerId),
      createdAt: new Date(now - index * 1_000).toISOString(),
      updatedAt: new Date(now - index * 1_000).toISOString(),
    })),
  );
}

const legacyExampleConcepts: Record<string, string> = {
  "Sentinela Solar":
    "Guardião cósmico que converte luz estelar em força e proteção.",
  "Espectro Rubro":
    "Vigilante incorpóreo, mestre de infiltração e medo controlado.",
  "Atlas Zero":
    "Construto gravitacional criado para conter ameaças de escala planetária.",
};

async function refreshLegacyExamples(
  rows: (typeof characters.$inferSelect)[],
  ownerId: string,
) {
  const templates = new Map(
    createExampleSheets().map((sheet) => [sheet.heroName, sheet]),
  );
  const db = await getDb();
  let refreshed = false;

  for (const row of rows) {
    const current = parseRow(row);
    if (!isReplaceableLearningExample(current)) continue;
    const template = templates.get(current.heroName);
    if (!template) continue;
    const replacement: CharacterSheet = {
      ...template,
      id: current.id,
      shareEnabled: current.shareEnabled,
      shareToken: current.shareToken,
      createdAt: current.createdAt,
    };
    const values = toValues(replacement, ownerId);
    const [updated] = await db
      .update(characters)
      .set(values)
      .where(
        and(
          eq(characters.id, current.id),
          eq(characters.ownerId, ownerId),
        ),
      )
      .returning();
    if (updated) {
      refreshed = true;
      const parsed = parseRow(updated);
      if (parsed.shareEnabled && parsed.shareToken) {
        await upsertSharedSnapshot(parsed);
      }
    }
  }

  return refreshed;
}

function isUntouchedLegacyExample(sheet: CharacterSheet) {
  if (!EXAMPLE_SHEET_NAMES.includes(
    sheet.heroName as (typeof EXAMPLE_SHEET_NAMES)[number],
  )) {
    return false;
  }
  const expectedConcept = legacyExampleConcepts[sheet.heroName];
  return (
    sheet.concept === expectedConcept &&
    sheet.imageUrl ===
      `/demo/${sheet.heroName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR")
        .replace(/\s+/g, "-")}.png` &&
    sheet.player === "" &&
    sheet.advantages.length === 0 &&
    sheet.powers.length === 0 &&
    sheet.equipment.length === 0 &&
    sheet.attacks.length === 1
  );
}

const previousAuditedExamples: Record<string, {
  concept: string;
  notes: string;
  ledger: ReturnType<typeof getPointBreakdown>;
}> = {
  "Sentinela Solar": {
    concept: "Guardião cósmico que converte luz estelar em voo, proteção e controle de energia.",
    notes: "EXEMPLO AUDITADO · NP 10 · 150 PP. Demonstra ataque à distância, matriz de efeitos alternativos, Campo de Força e Voo.",
    ledger: { abilities: 22, combat: 24, resistances: 15, skills: 11, advantages: 3, powers: 75, adjustments: 0, total: 150, regularSkillRanks: 22, specializedSkillRanks: 0 },
  },
  "Espectro Rubro": {
    concept: "Detetive mascarado sem superpoderes, especializado em infiltração, investigação e preparo tático.",
    notes: "EXEMPLO AUDITADO · NP 10 · 150 PP. Demonstra perícias, vantagens, equipamento, PE e ataques de armas sem dupla cobrança.",
    ledger: { abilities: 42, combat: 45, resistances: 18, skills: 20, advantages: 25, powers: 0, adjustments: 0, total: 150, regularSkillRanks: 40, specializedSkillRanks: 0 },
  },
  "Atlas Zero": {
    concept: "Construto gravitacional criado para conter ameaças de escala planetária com força e resistência extremas.",
    notes: "EXEMPLO AUDITADO · NP 10 · 150 PP. Demonstra traços aprimorados, modificador aplicado à Robustez existente, regeneração e troca entre precisão e potência.",
    ledger: { abilities: 24, combat: 21, resistances: 10, skills: 12, advantages: 2, powers: 81, adjustments: 0, total: 150, regularSkillRanks: 20, specializedSkillRanks: 8 },
  },
};

function isReplaceableLearningExample(sheet: CharacterSheet) {
  if (isUntouchedLegacyExample(sheet)) return true;
  const previous = previousAuditedExamples[sheet.heroName];
  if (!previous) return false;
  return (
    sheet.powerLevel === 10 &&
    sheet.player === "Exemplo auditado" &&
    sheet.campaign === "Modelos de aprendizado" &&
    sheet.appearance === "Retrato demonstrativo incluído no aplicativo." &&
    sheet.concept === previous.concept &&
    sheet.notes === previous.notes &&
    JSON.stringify(getPointBreakdown(sheet)) === JSON.stringify(previous.ledger)
  );
}
