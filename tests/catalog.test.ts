import assert from "node:assert/strict";
import test from "node:test";
import {
  CUSTOM_CATALOG_KEY,
  advantageCatalog,
  catalogSearchMatches,
  archetypeCatalog,
  complicationCatalog,
  drawbackCatalog,
  equipmentCatalog,
  extraCatalog,
  featureCatalog,
  findAdvantagePreset,
  findComplicationPreset,
  findEquipmentPreset,
  findPowerEffectPreset,
  findSkillPreset,
  flawCatalog,
  getCatalogCategory,
  getCatalogName,
  getCatalogSummary,
  heroOriginCatalog,
  motivationCatalog,
  powerConfigurationCatalog,
  powerEffectCatalog,
  skillCatalog,
  type CatalogEntry,
} from "../lib/catalog";
import {
  createEmptySheet,
  createPower,
  newId,
  normalizeSheet,
  type CharacterSheet,
} from "../lib/character";
import {
  getAttackCalculation,
  getDerivedTraits,
  getEffectCostBreakdown,
  getLuckCapacity,
  getRuleAudit,
} from "../lib/rules";
import { applyPowerConfigurationPreset } from "../lib/power-configurations";

const catalogs: Record<string, CatalogEntry[]> = {
  arquétipos: archetypeCatalog,
  origens: heroOriginCatalog,
  motivações: motivationCatalog,
  complicações: complicationCatalog,
  perícias: skillCatalog,
  vantagens: advantageCatalog,
  efeitos: powerEffectCatalog,
  configurações: powerConfigurationCatalog,
  extras: extraCatalog,
  recursos: featureCatalog,
  falhas: flawCatalog,
  desvantagens: drawbackCatalog,
  equipamento: equipmentCatalog,
};

function addMotivation(sheet: CharacterSheet) {
  sheet.complications[0] = {
    ...sheet.complications[0],
    catalogKey: "justice",
    name: "Justiça",
    type: "Motivação",
    description: "Protege inocentes e responsabiliza culpados.",
  };
}

test("the preview catalogs are complete, addressable, and free of duplicate IDs", () => {
  assert.deepEqual(
    {
      archetypes: archetypeCatalog.length,
      origins: heroOriginCatalog.length,
      motivations: motivationCatalog.length,
      complications: complicationCatalog.length,
      skills: skillCatalog.length,
      advantages: advantageCatalog.length,
      effects: powerEffectCatalog.length,
      configurations: powerConfigurationCatalog.length,
      extras: extraCatalog.length,
      features: featureCatalog.length,
      flaws: flawCatalog.length,
      drawbacks: drawbackCatalog.length,
      equipment: equipmentCatalog.length,
    },
    {
      archetypes: 15,
      origins: 6,
      motivations: 8,
      complications: 28,
      skills: 18,
      advantages: 101,
      effects: 47,
      configurations: 110,
      extras: 22,
      features: 18,
      flaws: 17,
      drawbacks: 6,
      equipment: 182,
    },
  );

  for (const [name, entries] of Object.entries(catalogs)) {
    assert.equal(
      new Set(entries.map((entry) => entry.id)).size,
      entries.length,
      `${name} contém identificadores duplicados`,
    );
    for (const entry of entries) {
      assert.ok(entry.id.trim(), `${name}: identificador vazio`);
      assert.ok(entry.label.trim(), `${name}: nome vazio`);
      assert.ok(entry.canonical.trim(), `${name}: nome canônico vazio`);
      assert.ok(entry.category.trim(), `${name}: categoria vazia`);
      assert.ok(entry.summary.trim(), `${name}: resumo vazio`);
    }
  }

  for (const configuration of powerConfigurationCatalog) {
    assert.ok(
      findPowerEffectPreset("", configuration.primaryEffectId),
      `${configuration.label}: efeito-base inexistente`,
    );
    assert.ok(
      configuration.costPerRank !== undefined ||
        configuration.ranksPerPoint !== undefined ||
        configuration.totalCost !== undefined ||
        configuration.requiresChoice,
      `${configuration.label}: fórmula ausente`,
    );
  }

  assert.equal(
    equipmentCatalog.filter((entry) => entry.attack).length,
    58,
  );
  assert.deepEqual(findEquipmentPreset("Pistola Leve")?.attack, {
    range: "ranged",
    effectRank: 3,
    strengthBased: false,
    resistance: "Robustez",
  });
  assert.equal(
    findEquipmentPreset("Mangual")?.attack?.strengthBased,
    true,
  );
  assert.equal(
    findEquipmentPreset("Maçarico de Corte")?.attack?.effectRank,
    1,
  );
  assert.equal(
    findEquipmentPreset("Zarabatana")?.attack?.resistance,
    "Robustez",
  );
});

test("catalog search accepts English, accents, plurals and a nearby typo", () => {
  const damage = powerEffectCatalog.find((entry) => entry.id === "damage")!;
  assert.equal(catalogSearchMatches(damage, "Damage"), true);
  assert.equal(catalogSearchMatches(damage, "danos"), true);
  assert.equal(catalogSearchMatches(damage, "Damge"), true);
  const acrobatics = skillCatalog.find((entry) => entry.id === "acrobatics")!;
  assert.equal(catalogSearchMatches(acrobatics, "acrobácia"), true);
});

test("every catalog option exposes bilingual names, categories, and descriptions", () => {
  for (const entries of Object.values(catalogs)) {
    for (const entry of entries) {
      assert.equal(getCatalogName(entry, "pt"), entry.label);
      assert.equal(getCatalogName(entry, "en"), entry.canonical);
      assert.ok(getCatalogCategory(entry.category, "en").trim());
      assert.ok(getCatalogSummary(entry, "en").trim());
      assert.equal(catalogSearchMatches(entry, getCatalogName(entry, "en")), true);
    }
  }

  const justice = motivationCatalog.find((entry) => entry.id === "justice")!;
  assert.equal(getCatalogName(justice, "en"), "Justice");
  assert.match(getCatalogSummary(justice, "en"), /innocent people/i);
});

test("ready-made power configurations calculate formulas and dependent traits", () => {
  const findConfiguration = (id: string) => {
    const preset = powerConfigurationCatalog.find(
      (entry) => entry.id === id,
    );
    assert.ok(preset, `configuração ${id} ausente`);
    return preset;
  };

  const blast = applyPowerConfigurationPreset(
    findConfiguration("blast"),
  );
  blast.rank = 6;
  assert.equal(getEffectCostBreakdown(blast).total, 12);
  assert.equal(blast.range, "À distância");
  assert.equal(blast.attackRange, "ranged");
  const blastSheet = createEmptySheet();
  addMotivation(blastSheet);
  const blastPower = createPower();
  blastPower.effects = [blast];
  blastSheet.powers = [blastPower];
  assert.equal(
    getRuleAudit(blastSheet).checks.find(
      (check) => check.key === `power-configuration-${blast.id}`,
    )?.status,
    "pass",
  );
  blast.range = "Perto";
  assert.equal(
    getRuleAudit(blastSheet).checks.find(
      (check) => check.key === `power-configuration-${blast.id}`,
    )?.status,
    "attention",
  );

  const mentalResistance = applyPowerConfigurationPreset(
    findConfiguration("mental-resistance"),
  );
  mentalResistance.rank = 6;
  assert.equal(getEffectCostBreakdown(mentalResistance).total, 3);
  const resistanceSheet = createEmptySheet();
  const resistancePower = createPower();
  resistancePower.effects = [mentalResistance];
  resistanceSheet.powers = [resistancePower];
  assert.equal(getDerivedTraits(resistanceSheet).resistances.will, 6);

  const giant = applyPowerConfigurationPreset(
    findConfiguration("giant-size"),
  );
  assert.equal(getEffectCostBreakdown(giant).total, 78);
  const giantSheet = createEmptySheet();
  const giantPower = createPower();
  giantPower.effects = [giant];
  giantSheet.powers = [giantPower];
  const giantTraits = getDerivedTraits(giantSheet);
  assert.equal(giantTraits.abilities.strength, 11);
  assert.equal(giantTraits.abilities.stamina, 11);
  assert.equal(giantTraits.resistances.toughness, 23);
  assert.equal(giantTraits.rangedDefense, -1);

  const poltergeist = applyPowerConfigurationPreset(
    findConfiguration("poltergeist"),
  );
  poltergeist.rank = 2;
  assert.equal(getEffectCostBreakdown(poltergeist).total, 18);
});

test("catalog lookup accepts Portuguese, canonical English, accents, and focused suffixes", () => {
  assert.equal(findSkillPreset("Acrobacia")?.id, "acrobatics");
  assert.equal(findSkillPreset("acrobatics")?.id, "acrobatics");
  assert.equal(findPowerEffectPreset("pos cognicao")?.id, "postcognition");
  assert.equal(findEquipmentPreset("Chain Mail")?.id, "chain-mail");
  assert.equal(
    findAdvantagePreset("Crítico Aprimorado: Espadas")?.id,
    "improved-critical",
  );
  assert.equal(
    findComplicationPreset("Responsabilidade", "", "Motivação")?.id,
    "responsibility",
  );
  assert.equal(
    findComplicationPreset("Responsabilidade", "", "Outro")?.id,
    "responsibility-complication",
  );
});

test("current custom entries stay custom while legacy records gain catalog links", () => {
  const current = createEmptySheet();
  current.advantages = [
    {
      id: "custom-luck",
      catalogKey: CUSTOM_CATALOG_KEY,
      name: "Sorte",
      rank: 4,
      categories: ["Geral"],
      kind: "standard",
      notes: "Regra própria da campanha.",
    },
  ];
  const normalizedCurrent = normalizeSheet(current);
  assert.equal(
    normalizedCurrent.advantages[0].catalogKey,
    CUSTOM_CATALOG_KEY,
  );
  assert.equal(getLuckCapacity(normalizedCurrent), 0);

  const legacy = normalizeSheet({
    ...current,
    schemaVersion: 2,
    advantages: [
      {
        id: "legacy-luck",
        name: "Sorte",
        rank: 2,
        categories: ["Heroica"],
        kind: "standard",
        notes: "",
      },
    ],
  });
  assert.equal(legacy.advantages[0].catalogKey, "luck");
  assert.equal(getLuckCapacity(legacy), 2);
});

test("advantage and active equipment bonuses propagate to every dependent trait", () => {
  const sheet = createEmptySheet();
  sheet.abilities.stamina = 2;
  sheet.advantages = [
    {
      id: newId("advantage"),
      catalogKey: "defensive-roll",
      name: "Rolamento Defensivo",
      rank: 2,
      categories: ["Combate"],
      kind: "standard",
      notes: "",
    },
  ];
  sheet.equipment = [
    {
      id: "armor",
      catalogKey: "chain-mail",
      name: "Cota de Malha",
      type: "Armadura",
      cost: 7,
      active: true,
      details: "+3 Robustez e Aprimorada 1.",
    },
    {
      id: "shield",
      catalogKey: "small-shield",
      name: "Escudo Pequeno",
      type: "Armadura",
      cost: 3,
      active: true,
      details: "+1 Defesa e Esquiva.",
    },
  ];

  let derived = getDerivedTraits(sheet);
  assert.equal(derived.resistances.toughness, 7);
  assert.equal(derived.defense, 1);
  assert.equal(derived.closeDefense, 1);
  assert.equal(derived.rangedDefense, 1);
  assert.equal(derived.resistances.dodge, 1);

  sheet.equipment[0].active = false;
  derived = getDerivedTraits(sheet);
  assert.equal(derived.resistances.toughness, 4);
});

test("catalog weapons drive attack rank, strength dependency, and effect DC", () => {
  const sheet = createEmptySheet();
  sheet.powerLevel = 10;
  sheet.abilities.strength = 4;
  sheet.combat.attack = 5;
  sheet.equipment = [
    {
      id: "sword-item",
      catalogKey: "sword",
      name: "Espada",
      type: "Arma",
      cost: 3,
      active: true,
      details: "Dano 3 baseado em Força.",
    },
  ];
  const attack = {
    id: "sword-attack",
    name: "Espada",
    sourceEffectId: "",
    sourceEquipmentId: "sword-item",
    range: "close" as const,
    effectRank: 0,
    strengthBased: false,
    manualEffectSource: "equipment" as const,
    manualEffectSourceNote: "Espada",
    specializationId: "",
    miscellaneousAttackBonus: 0,
    miscellaneousAttackSource: "",
    resistance: "Robustez",
    notes: "",
  };
  sheet.attacks = [attack];

  const calculation = getAttackCalculation(sheet, attack);
  assert.equal(calculation.complete, true);
  assert.equal(calculation.attackBonus, 5);
  assert.equal(calculation.effectRank, 7);
  assert.equal(calculation.limitValue, 12);
  assert.equal(calculation.effectDc, 17);
});

test("canonical deviations fail or request review instead of receiving false green", () => {
  const sheet = createEmptySheet();
  addMotivation(sheet);
  const power = createPower();
  power.name = "Rajada";
  power.effects[0] = {
    ...power.effects[0],
    catalogKey: "damage",
    name: "Dano",
    rank: 5,
    baseCost: 3,
    action: "Padrão",
    range: "Perto",
    duration: "Instantânea",
    check: "Ataque vs. Defesa",
    resistance: "Robustez vs. efeito",
    isAttack: true,
    requiresAttackCheck: true,
    attackRange: "close",
  };
  sheet.powers = [power];

  const audit = getRuleAudit(sheet);
  assert.equal(
    audit.checks.find(
      (check) => check.key === `power-base-cost-${power.effects[0].id}`,
    )?.status,
    "fail",
  );

  sheet.advantages.push({
    id: "custom-advantage",
    catalogKey: CUSTOM_CATALOG_KEY,
    name: "Vantagem da campanha",
    rank: 1,
    categories: ["Geral"],
    kind: "standard",
    notes: "Aprovada pelo Narrador.",
  });
  assert.equal(
    getRuleAudit(sheet).checks.find(
      (check) => check.key === "advantage-custom-custom-advantage",
    )?.status,
    "attention",
  );
});
