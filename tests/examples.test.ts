import assert from "node:assert/strict";
import test from "node:test";
import { createEmptySheet } from "../lib/character";
import { createExampleSheets } from "../lib/example-sheets";
import { applyGuidedAutomation } from "../lib/guided";
import {
  getDerivedTraits,
  getAttackCalculation,
  getEquipmentTotals,
  getPointBreakdown,
  getRuleAudit,
} from "../lib/rules";

const expectedLedgers = {
  "Espectro Rubro": {
    abilities: 34,
    combat: 39,
    resistances: 13,
    skills: 24,
    advantages: 10,
    powers: 0,
    adjustments: 0,
    total: 120,
    regularSkillRanks: 44,
    specializedSkillRanks: 8,
  },
  "Sentinela Solar": {
    abilities: 24,
    combat: 29,
    resistances: 20,
    skills: 10,
    advantages: 5,
    powers: 62,
    adjustments: 0,
    total: 150,
    regularSkillRanks: 20,
    specializedSkillRanks: 0,
  },
  "Atlas Zero": {
    abilities: 26,
    combat: 28,
    resistances: 17,
    skills: 16,
    advantages: 19,
    powers: 74,
    adjustments: 0,
    total: 180,
    regularSkillRanks: 28,
    specializedSkillRanks: 8,
  },
} as const;

test("learning examples are exact, distinct NP 8, 10 and 12 heroes", () => {
  const examples = createExampleSheets();
  const expectedLevels = { "Espectro Rubro": 8, "Sentinela Solar": 10, "Atlas Zero": 12 } as const;
  assert.equal(examples.length, 3);
  for (const sheet of examples) {
    const points = getPointBreakdown(sheet);
    const audit = getRuleAudit(sheet);
    const level = expectedLevels[sheet.heroName as keyof typeof expectedLevels];
    assert.equal(sheet.powerLevel, level, `${sheet.heroName}: NP incorreto`);
    assert.equal(points.total, level * 15, `${sheet.heroName}: PP incorretos`);
    assert.deepEqual(
      points,
      expectedLedgers[sheet.heroName as keyof typeof expectedLedgers],
      `${sheet.heroName}: distribuição de PP alterada`,
    );
    assert.equal(
      audit.status,
      "pass",
      `${sheet.heroName}: ${audit.checks
        .filter((check) => check.status !== "pass")
        .map((check) => `${check.label} (${check.status})`)
        .join("; ")}`,
    );
    assert.equal(audit.failures, 0);
    assert.equal(audit.attentions, 0);
    assert.ok(sheet.complications.length >= 3);
    assert.ok(sheet.notes.includes("EXEMPLO DE APRENDIZADO V9"));
  }

  const crimeFighter = examples.find(
    (sheet) => sheet.heroName === "Espectro Rubro",
  )!;
  assert.deepEqual(getEquipmentTotals(crimeFighter), {
    used: 20,
    allowance: 20,
    remaining: 0,
  });

  const atlas = examples.find((sheet) => sheet.heroName === "Atlas Zero")!;
  assert.equal(getDerivedTraits(atlas).abilities.strength, 14);
  assert.equal(getDerivedTraits(atlas).resistances.toughness, 16);
  const atlasAttack = getAttackCalculation(atlas, atlas.attacks[0]);
  assert.equal(atlasAttack.limitValue, 24);
  assert.equal(atlasAttack.limit, 24);

  const sentinel = examples.find((sheet) => sheet.heroName === "Sentinela Solar")!;
  const blast = getAttackCalculation(sentinel, sentinel.attacks[0]);
  assert.equal(blast.limitValue, 20);
  assert.equal(blast.limit, 20);
});

test("guided automation repairs deterministic mistakes without deleting custom content", () => {
  const sheet = createEmptySheet();
  sheet.advantages = [
    {
      id: "equipment",
      catalogKey: "equipment",
      name: "Equipamento",
      rank: 1,
      categories: ["Fortuna"],
      kind: "standard",
      notes: "",
    },
  ];
  sheet.equipment = [
    {
      id: "pistol",
      catalogKey: "light-pistol",
      name: "Pistola Leve",
      type: "Arma",
      cost: 99,
      active: true,
      details: "Texto livre preservado.",
    },
  ];
  sheet.resources.heroicAdvantageUses = 9;
  sheet.resources.luckCurrent = 4;
  sheet.resources.luckMax = 4;

  const result = applyGuidedAutomation(sheet);
  const equipment = getEquipmentTotals(result.sheet);
  assert.deepEqual(equipment, { used: 6, allowance: 10, remaining: 4 });
  assert.equal(result.sheet.advantages[0].kind, "equipment");
  assert.deepEqual(result.sheet.advantages[0].categories, ["Geral"]);
  assert.equal(result.sheet.resources.heroicAdvantageUses, 0);
  assert.equal(result.sheet.resources.luckCurrent, 0);
  assert.equal(result.sheet.resources.luckMax, 0);
  assert.equal(result.sheet.equipment[0].details, "Texto livre preservado.");
  assert.ok(result.changes.length >= 3);
});
