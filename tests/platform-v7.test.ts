import assert from "node:assert/strict";
import test from "node:test";
import {
  archiveBackupToJson,
  createArchiveBackup,
  duplicateBackupForImport,
  parseArchiveBackup,
} from "../lib/backup";
import { addCatalogEntryToSheet } from "../lib/catalog-actions";
import {
  CURRENT_SCHEMA_VERSION,
  createEmptySheet,
  normalizeSheet,
} from "../lib/character";
import {
  analyzeEncounter,
  challengeLevelToPowerLevel,
  characterLevelToPowerLevel,
  getEncounterReferencePowerLevel,
  specialThreatPowerLevels,
  type EncounterDefinition,
  type EncounterParticipant,
} from "../lib/encounter";
import {
  addCharacterRevision,
  createCharacterRevision,
  MAX_CHARACTER_REVISIONS,
  restoreCharacterRevision,
  type CharacterRevision,
} from "../lib/history";
import { createNpcFromTemplate, npcTemplates } from "../lib/npc-templates";
import { parsePortableSheet, portableSheetToJson } from "../lib/portable";
import { getRuleAudit } from "../lib/rules";
import { searchEverything } from "../lib/search";
import { beginSession, resetSession } from "../lib/session";
import { createEmptyCampaign } from "../lib/workspace";

test("schema 7 migrates older sheets without mutating or dropping content", () => {
  const legacy = structuredClone(createEmptySheet()) as unknown as Record<string, unknown>;
  legacy.schemaVersion = 6;
  legacy.heroName = "Legado preservado";
  legacy.notes = "Não apagar";
  delete legacy.creationMode;
  delete legacy.session;
  delete legacy.relationships;
  const original = structuredClone(legacy);

  const migrated = normalizeSheet(legacy);

  assert.deepEqual(legacy, original);
  assert.equal(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(migrated.heroName, "Legado preservado");
  assert.equal(migrated.notes, "Não apagar");
  assert.equal(migrated.creationMode, "guided");
  assert.equal(migrated.session.active, false);
  assert.deepEqual(migrated.relationships, []);
  assert.deepEqual(migrated.movement, []);
  assert.deepEqual(migrated.senses, []);
});

test("portable v7 exports preserve new sheet data and strip private identity", () => {
  const sheet = createEmptySheet();
  sheet.id = "private-sheet";
  sheet.creationMode = "free";
  sheet.favorite = true;
  sheet.tags = ["cósmico", "equipe"];
  sheet.movement.push({
    id: "move-1",
    typeId: "movement.flight",
    name: "Voo",
    rank: 6,
    sourceEffectId: "",
    notes: "",
  });
  sheet.relationships.push({
    id: "rel-1",
    targetSheetId: "other-sheet",
    targetName: "Aliado",
    kind: "ally",
    notes: "Equipe",
  });
  sheet.session = {
    ...sheet.session,
    active: true,
    damage: 2,
    activeEffects: ["Camuflagem"],
  };

  const imported = parsePortableSheet(portableSheetToJson(sheet));

  assert.equal(imported.id, "");
  assert.equal(imported.creationMode, "free");
  assert.equal(imported.favorite, true);
  assert.deepEqual(imported.tags, ["cósmico", "equipe"]);
  assert.equal(imported.movement[0].name, "Voo");
  assert.equal(imported.relationships[0].kind, "ally");
  assert.equal(imported.session.damage, 2);
  assert.deepEqual(imported.session.activeEffects, ["Camuflagem"]);
});

function participant(
  id: string,
  side: EncounterParticipant["side"],
  powerLevel: number,
  quantity = 1,
): EncounterParticipant {
  return { id, sheetId: id, name: id, powerLevel, quantity, side, role: side };
}

test("the optional CE encounter tool follows the recovered project tables exactly", () => {
  assert.deepEqual(characterLevelToPowerLevel, [4, 4, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 11, 11]);
  assert.deepEqual(challengeLevelToPowerLevel, [6, 6, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12, 13, 13]);
  assert.deepEqual(specialThreatPowerLevels["1/4"], { minimum: 2, maximum: 2 });
  assert.deepEqual(specialThreatPowerLevels["S+"], { minimum: 17, maximum: 18 });

  const participants = [
    participant("hero-a", "ally", 10, 2),
    participant("hero-b", "ally", 10, 2),
    participant("villains", "threat", 10, 2),
  ];
  const encounter: EncounterDefinition = {
    id: "encounter",
    name: "Teste",
    participants,
    referencePowerLevel: null,
    pressure: "standard",
    notes: "",
  };
  const result = analyzeEncounter(encounter);
  assert.equal(result.referencePowerLevel, 10);
  assert.equal(result.groupCapacity, 80);
  assert.equal(result.baseThreatCe, 80);
  assert.equal(result.effectiveThreatCe, 80);
  assert.equal(result.ratio, 1);
  assert.equal(result.estimatedPressure?.id, "standard");
  assert.equal(result.issues.length, 0);

  const outside = analyzeEncounter({
    ...encounter,
    participants: [...participants, participant("cosmic", "threat", 18)],
  });
  assert.equal(outside.issues[0].participantId, "cosmic");
  assert.equal(outside.baseThreatCe, 80, "the engine must not invent CE outside P−4…P+7");
});

test("encounter reference PL uses the mode and the median on a tie", () => {
  assert.equal(getEncounterReferencePowerLevel([
    participant("a", "ally", 8),
    participant("b", "ally", 10),
    participant("c", "ally", 12),
    participant("d", "ally", 12),
  ]), 12);
  assert.equal(getEncounterReferencePowerLevel([
    participant("a", "ally", 8),
    participant("b", "ally", 10),
  ]), 9);
});

test("history deduplicates snapshots, caps retention, and preserves share controls on restore", () => {
  const base = createEmptySheet();
  base.id = "current";
  let revisions: CharacterRevision[] = [];
  for (let index = 0; index < MAX_CHARACTER_REVISIONS + 5; index += 1) {
    revisions = addCharacterRevision(
      revisions,
      createCharacterRevision(
        { ...base, heroName: `Versão ${index}` },
        `Versão ${index}`,
        new Date(Date.UTC(2026, 0, index + 1)),
      ),
    );
  }
  assert.equal(revisions.length, MAX_CHARACTER_REVISIONS);
  assert.equal(revisions[0].sheet.heroName, `Versão ${MAX_CHARACTER_REVISIONS + 4}`);
  assert.equal(
    addCharacterRevision(revisions, structuredClone(revisions[0])).length,
    MAX_CHARACTER_REVISIONS,
  );

  const current = { ...base, shareEnabled: true, shareToken: "permanent", shareMode: "read-only" as const };
  const restored = restoreCharacterRevision(current, revisions.at(-1)!);
  assert.equal(restored.id, "current");
  assert.equal(restored.shareToken, "permanent");
  assert.equal(restored.shareMode, "read-only");
});

test("session state is isolated and can be restored without changing base resources", () => {
  const sheet = createEmptySheet();
  sheet.resources.heroPoints = 3;
  sheet.resources.luckCurrent = 2;
  const started = beginSession(sheet, new Date("2026-08-21T12:00:00.000Z"));
  started.session.damage = 4;
  started.session.conditions = ["Atordoado (Dazed)"];
  started.session.penalties.push({ id: "p", label: "Ferimento", target: "Ataque", value: -1 });

  const restored = resetSession(started);
  assert.equal(restored.session.active, false);
  assert.equal(restored.session.damage, 0);
  assert.deepEqual(restored.session.conditions, []);
  assert.deepEqual(restored.session.penalties, []);
  assert.equal(restored.session.heroPointsCurrent, 3);
  assert.equal(restored.resources.heroPoints, 3);
  assert.equal(restored.resources.luckCurrent, 2);
});

test("backup duplication remaps every internal relationship without replacing current data", () => {
  const first = createEmptySheet();
  first.id = "sheet-a";
  first.heroName = "A";
  first.campaignIds = ["campaign-a"];
  first.relationships = [{ id: "rel-a", targetSheetId: "sheet-b", targetName: "B", kind: "ally", notes: "" }];
  const second = createEmptySheet();
  second.id = "sheet-b";
  second.heroName = "B";
  const campaign = createEmptyCampaign();
  campaign.id = "campaign-a";
  campaign.members = [
    { id: "member-a", sheetId: "sheet-a", name: "A", role: "player-character" },
    { id: "member-b", sheetId: "sheet-b", name: "B", role: "ally" },
  ];
  campaign.teams = [{ id: "team-a", name: "Dupla", memberIds: ["member-a", "member-b"], notes: "" }];
  campaign.organizations = [{ id: "org-a", name: "Liga", description: "", memberIds: ["member-a"] }];

  const backup = createArchiveBackup([first, second], [campaign], new Date("2026-08-21T00:00:00.000Z"));
  const duplicated = duplicateBackupForImport(parseArchiveBackup(archiveBackupToJson(backup)));
  const importedA = duplicated.characters.find((entry) => entry.heroName === "A")!;
  const importedB = duplicated.characters.find((entry) => entry.heroName === "B")!;
  const importedCampaign = duplicated.campaigns[0];
  const memberIds = new Set(importedCampaign.members.map((entry) => entry.id));

  assert.notEqual(importedA.id, "sheet-a");
  assert.notEqual(importedB.id, "sheet-b");
  assert.equal(importedA.relationships[0].targetSheetId, importedB.id);
  assert.deepEqual(importedA.campaignIds, [importedCampaign.id]);
  assert.equal(importedCampaign.members[0].sheetId, importedA.id);
  assert.equal(importedCampaign.teams[0].memberIds.every((id) => memberIds.has(id)), true);
  assert.equal(importedCampaign.organizations[0].memberIds.every((id) => memberIds.has(id)), true);
  assert.equal(importedA.shareEnabled, false);
  assert.equal(importedA.shareToken, null);
});

test("backup validation rejects future versions and duplicate stable IDs before import", () => {
  const sheet = createEmptySheet();
  sheet.id = "stable";
  const backup = createArchiveBackup([sheet], []);
  assert.throws(
    () => parseArchiveBackup({ ...backup, version: 99 }),
    /versão mais nova/i,
  );
  assert.throws(
    () => parseArchiveBackup({ ...backup, characters: [sheet, sheet] }),
    /duplicados/i,
  );
});

test("universal search tolerates Portuguese accents, English terms, and one typo", () => {
  const sheet = createEmptySheet();
  sheet.id = "hero";
  sheet.heroName = "Guardião Cósmico";
  sheet.notes = "Protege a estação orbital";
  const campaign = createEmptyCampaign();
  campaign.id = "campaign";
  campaign.name = "Crise em Órion";

  assert.equal(searchEverything("guardiao", [sheet], [campaign], "pt")[0].sheetId, "hero");
  assert.equal(searchEverything("campanha órion", [sheet], [campaign], "pt").some((entry) => entry.campaignId === "campaign"), true);
  assert.equal(searchEverything("orion", [sheet], [campaign], "pt")[0].campaignId, "campaign");
  assert.equal(searchEverything("damge", [], [], "en").some((entry) => entry.title === "Damage"), true);
});

test("catalog actions create structured powers and attacks with stable references", () => {
  const sheet = createEmptySheet();
  const result = addCatalogEntryToSheet(sheet, "effects", "damage");
  assert.equal(result.changed, true);
  assert.equal(result.sheet.powers.length, 1);
  assert.equal(result.sheet.powers[0].effects[0].catalogKey, "damage");
  assert.equal(result.sheet.attacks.length, 1);
  assert.equal(result.sheet.attacks[0].sourceEffectId, result.sheet.powers[0].effects[0].id);
  assert.equal(getRuleAudit(result.sheet).checks.some((entry) => entry.key.includes("broken")), false);
});

test("NPC templates are editable shortcuts and never alter the central rule engine", () => {
  assert.equal(npcTemplates.length, 9);
  const boss = createNpcFromTemplate("boss", 14);
  assert.equal(boss.buildType, "npc");
  assert.equal(boss.npcRole, "boss");
  assert.equal(boss.creationMode, "quick");
  assert.equal(boss.powerLevel, 14);
  assert.equal(boss.customPointBudget, 210);
  assert.deepEqual(boss.powers, []);
  assert.deepEqual(boss.advantages, []);
});
