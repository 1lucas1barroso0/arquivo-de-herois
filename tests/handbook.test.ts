import assert from "node:assert/strict";
import test from "node:test";
import { createEmptySheet, createPower, normalizeSheet, CURRENT_SCHEMA_VERSION } from "../lib/character";
import { equipmentCatalog, extraCatalog, featureCatalog, powerConfigurationCatalog, powerEffectCatalog, skillCatalog } from "../lib/catalog";
import { getEffectCostBreakdown, getPointBudget, getRuleAudit } from "../lib/rules";
import { applyPowerConfigurationPreset, applyPowerEffectPreset } from "../lib/power-configurations";
import { createPowerEffect } from "../lib/character";
import { CURRENT_RULESET, LEGACY_RULESET, isCurrentRuleset, rulesetLabel } from "../lib/ruleset";
import { parsePortableSheet, portableSheetToJson, PORTABLE_VERSION } from "../lib/portable";
import { ruleReferenceEntries, localizeRuleReference } from "../lib/rule-reference";
import { HANDBOOK_DOCUMENT, HANDBOOK_PAGE_COUNT } from "../lib/handbook-source";
import { getMeasurementRow } from "../lib/scales";

test("WIP v.05 is identified honestly and new exports protect against old clients", () => {
  const sheet = createEmptySheet();
  assert.equal(CURRENT_SCHEMA_VERSION, 9);
  assert.equal(PORTABLE_VERSION, 9);
  assert.deepEqual(sheet.ruleset, CURRENT_RULESET);
  assert.equal(sheet.ruleset.status, "wip");
  assert.match(rulesetLabel(sheet.ruleset, "pt"), /WIP v.05/);
  assert.equal(isCurrentRuleset({ ...sheet.ruleset, status: "final" }), false);
  assert.deepEqual(parsePortableSheet(portableSheetToJson(sheet)).ruleset, CURRENT_RULESET);
  assert.equal(getPointBudget(sheet), 150);
});

test("legacy import preserves original revision, custom values, links, and conditions", () => {
  const legacy = { ...createEmptySheet(), schemaVersion: 8, ruleset: undefined };
  legacy.notes = "Não sobrescrever";
  legacy.equipment = [{ id: "mail", catalogKey: "chain-mail", name: "Cota de Malha", cost: 7, active: true, type: "Armadura", details: "Minha armadura" }];
  legacy.resources.conditions = ["Alucinando (Hallucinating)"];
  const original = structuredClone(legacy);
  const migrated = normalizeSheet(legacy);
  assert.deepEqual(legacy, original);
  assert.deepEqual(migrated.ruleset, LEGACY_RULESET);
  assert.equal(migrated.equipment[0].cost, 7);
  assert.equal(migrated.equipment[0].id, "mail");
  assert.equal(migrated.notes, legacy.notes);
  assert.deepEqual(migrated.resources.conditions, legacy.resources.conditions);
  assert.equal(getRuleAudit(migrated).checks.find((check) => check.key === "ruleset-review")?.status, "attention");
  const restored = parsePortableSheet(portableSheetToJson(migrated));
  assert.deepEqual(restored.ruleset, LEGACY_RULESET);
  assert.equal(restored.equipment[0].cost, 7);
  assert.equal(normalizeSheet({ ...legacy, ruleset: {} }).ruleset.id, LEGACY_RULESET.id);
});

test("WIP equipment and power configuration corrections use the published values", () => {
  const expected: Record<string, number> = { "chain-mail": 4, "plate-mail": 7, "full-plate": 9, "fragmentation-grenade": 10, "smoke-grenade": 4, "flash-grenade": 8, flashbang: 12, "sleep-gas": 8, "tear-gas": 8, dynamite: 11, "plastic-explosive": 21 };
  for (const [id, cost] of Object.entries(expected)) assert.equal(equipmentCatalog.find((entry) => entry.id === id)?.cost, cost, id);
  const stock: Record<string, number> = { "hook-sword": 6, "javelin-close": 2, whip: 6, bolos: 4, car: 11, "police-cruiser": 14, limousine: 13, truck: 14, "armored-car": 22, tank: 48, apc: 45, bus: 19, semi: 20, "jet-ski": 9, cutter: 47, battleship: 71, "two-seater-plane": 21, "military-copter": 53, "fighter-jet": 72, bomber: 71, "space-cruiser": 93, "space-battleship": 98 };
  for (const [id, cost] of Object.entries(stock)) assert.equal(equipmentCatalog.find((entry) => entry.id === id)?.cost, cost, id);
  for (const [id, cost] of [["tremor-sense", 2], ["x-ray-vision", 5], ["personal-immunity", 1]] as const) {
    const effect = applyPowerConfigurationPreset(powerConfigurationCatalog.find((entry) => entry.id === id)!);
    assert.equal(getEffectCostBreakdown(effect).total, cost, id);
  }
  assert.equal(featureCatalog.find((entry) => entry.id === "indirect")?.maxRank, 4);
  assert.equal(featureCatalog.find((entry) => entry.id === "variable-descriptor")?.maxRank, 2);
  assert.equal(skillCatalog.find((entry) => entry.id === "perception")?.action, "Simples");
  const counter = powerEffectCatalog.find((entry) => entry.id === "counter")!;
  assert.equal(counter.range, "Perto");
  assert.equal(counter.requiresAttackCheck, false);
  assert.equal(getMeasurementRow(23).volume, "250.000 m³");
  assert.equal(getMeasurementRow(30).volume, "32 milhões m³");
  assert.equal(getMeasurementRow(31).volume, "≈ 64.000.000 m³");
});

test("Impervious costs +1 per rank and its prerequisites cannot receive false green", () => {
  assert.equal(extraCatalog.find((entry) => entry.id === "impervious-resistance")?.value, 1);
  const sheet = createEmptySheet();
  const effect = applyPowerEffectPreset(createPowerEffect(), powerEffectCatalog.find((entry) => entry.id === "enhanced-resistance")!);
  effect.rank = 5;
  effect.extras = [{ id: "impervious", name: "Impenetrável", value: 1, ranksApplied: 0 }];
  const power = createPower(); power.effects = [effect]; sheet.powers = [power];
  const checkKey = `impervious-prerequisite-${effect.id}`;
  assert.equal(getRuleAudit(sheet).checks.find((check) => check.key === checkKey)?.status, "attention");
  effect.extras.push({ id: "improved", name: "Aprimorada", value: 1, ranksApplied: 0 });
  assert.equal(getRuleAudit(sheet).checks.some((check) => check.key === checkKey), false);
  effect.rank = 11;
  assert.equal(getRuleAudit(sheet).checks.find((check) => check.key === checkKey)?.status, "attention");
});

test("current references fit the handbook and include revised action and condition rules", () => {
  for (const entry of ruleReferenceEntries) {
    assert.equal(entry.source.document, HANDBOOK_DOCUMENT);
    for (const page of entry.source.pages.match(/\d+/g) ?? []) assert.ok(Number(page) >= 1 && Number(page) <= HANDBOOK_PAGE_COUNT, entry.id);
  }
  const defend = localizeRuleReference(ruleReferenceEntries.find((entry) => entry.id === "action-defend")!, "en");
  assert.match(defend.summary, /penalty die/);
  const surprised = localizeRuleReference(ruleReferenceEntries.find((entry) => entry.id === "condition-surprised")!, "en");
  assert.match(surprised.summary, /only take free actions/);
  assert.equal(ruleReferenceEntries.some((entry) => entry.id === "condition-hallucinating"), false);
});
