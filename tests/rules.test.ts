import assert from "node:assert/strict";
import test from "node:test";
import {
  CURRENT_SCHEMA_VERSION,
  conditions,
  createEmptySheet,
  createPower,
  createPowerEffect,
  defaultSkills,
  newId,
  normalizeSheet,
} from "../lib/character";
import { CUSTOM_CATALOG_KEY } from "../lib/catalog";
import {
  getAttackCalculation,
  getDerivedTraits,
  getEffectCostBreakdown,
  getEquipmentTotals,
  getMotivationState,
  getPointBreakdown,
  getPowerPortfolio,
  getRuleAudit,
  getRuleReviewFingerprint,
  getSkillTotal,
} from "../lib/rules";

test("legacy schema migrates natural size and absent traits without losing data", () => {
  const legacy = createEmptySheet();
  const migrated = normalizeSheet({
    ...legacy,
    schemaVersion: 5,
    heroName: "Autômato legado",
    sizeRank: undefined,
    absentTraits: undefined,
    absentAbilities: ["stamina", "attack", "not-a-trait"],
  });

  assert.equal(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(migrated.heroName, "Autômato legado");
  assert.equal(migrated.sizeRank, 0);
  assert.deepEqual(migrated.absentTraits, ["stamina", "attack"]);
});

test("absent traits apply their costs, dependencies, and resistance consequences", () => {
  const sheet = createEmptySheet();
  sheet.absentTraits = ["stamina", "awareness"];
  sheet.resistanceAdjustments.toughness = 3;

  const derived = getDerivedTraits(sheet);
  const points = getPointBreakdown(sheet);

  assert.equal(derived.absentTraits.has("presence"), true);
  assert.equal(derived.absentResistances.has("fortitude"), true);
  assert.equal(derived.absentResistances.has("will"), true);
  assert.equal(derived.resistances.fortitude, 0);
  assert.equal(derived.resistances.will, 0);
  assert.equal(derived.resistances.toughness, 3);
  assert.equal(points.abilities, -30);
  assert.equal(points.resistances, 3);

  const permission = getRuleAudit(sheet).checks.find(
    (check) => check.key === "absent-traits-permission",
  );
  assert.equal(permission?.status, "attention");

  sheet.buildType = "npc";
  assert.equal(
    getRuleAudit(sheet).checks.find(
      (check) => check.key === "absent-traits-permission",
    )?.status,
    "info",
  );
});

test("absent Attack and Strength block attacks instead of producing false valid totals", () => {
  const sheet = createEmptySheet();
  const attack = {
    id: "absent-attack",
    name: "Golpe impossível",
    sourceEffectId: "",
    sourceEquipmentId: "",
    range: "close" as const,
    effectRank: 5,
    strengthBased: false,
    manualEffectSource: "other" as const,
    manualEffectSourceNote: "",
    specializationId: "",
    miscellaneousAttackBonus: 0,
    miscellaneousAttackSource: "",
    resistance: "Robustez",
    notes: "",
  };
  sheet.attacks = [attack];
  sheet.absentTraits = ["attack"];

  assert.match(
    getAttackCalculation(sheet, attack).blockedReason,
    /Ataque ausente/,
  );
  assert.equal(
    getRuleAudit(sheet).checks.some(
      (check) => check.key.startsWith("attack-absent-trait-") && check.status === "fail",
    ),
    true,
  );

  sheet.absentTraits = ["strength"];
  const strengthBased = { ...attack, strengthBased: true };
  assert.match(
    getAttackCalculation(sheet, strengthBased).blockedReason,
    /Força ausente/,
  );
});

test("natural size is persistent, free, and flags values beyond the published table", () => {
  const sheet = createEmptySheet();
  const baseline = getPointBreakdown(sheet).total;
  sheet.sizeRank = 5;
  assert.equal(getPointBreakdown(sheet).total, baseline);
  assert.equal(
    getRuleAudit(sheet).checks.some(
      (check) => check.key === "size-outside-published-table",
    ),
    false,
  );

  sheet.sizeRank = 6;
  assert.equal(
    getRuleAudit(sheet).checks.find(
      (check) => check.key === "size-outside-published-table",
    )?.status,
    "attention",
  );
});

test("motivation is recognized from identity text or a selected catalog option", () => {
  const identitySheet = createEmptySheet();
  identitySheet.personality = "Protege pessoas porque acredita em justiça.";
  assert.deepEqual(getMotivationState(identitySheet), {
    present: true,
    complete: true,
    source: "identity",
  });
  assert.equal(
    getRuleAudit(identitySheet).checks.find(
      (check) => check.key === "required-motivation",
    )?.status,
    "pass",
  );

  const selectedSheet = createEmptySheet();
  selectedSheet.complications[0] = {
    ...selectedSheet.complications[0],
    catalogKey: "justice",
    name: "Justice",
    type: "Motivation",
    description: "",
  };
  assert.deepEqual(getMotivationState(selectedSheet), {
    present: true,
    complete: false,
    source: "complication",
  });
  assert.equal(
    getRuleAudit(selectedSheet).checks.find(
      (check) => check.key === "required-motivation",
    )?.status,
    "attention",
  );

  selectedSheet.complications[0].description =
    "Protects innocent people and holds wrongdoers accountable.";
  assert.equal(getMotivationState(selectedSheet).complete, true);
  assert.equal(
    getRuleAudit(selectedSheet).checks.find(
      (check) => check.key === "required-motivation",
    )?.status,
    "pass",
  );
});

test("ability changes propagate to resistances, initiative, and skills", () => {
  const sheet = createEmptySheet();
  sheet.abilities.agility = 3;
  sheet.abilities.stamina = 2;
  sheet.abilities.awareness = 4;
  sheet.combat.initiativeBonus = 4;
  sheet.resistanceAdjustments = {
    dodge: 1,
    fortitude: 2,
    toughness: 3,
    will: 1,
  };
  const acrobatics = sheet.skills.find(
    (skill) => skill.name === "Acrobacia",
  )!;
  acrobatics.rank = 5;
  acrobatics.specialization = "Equilíbrio";
  acrobatics.specializationRank = 2;
  acrobatics.miscellaneousModifier = 1;

  const derived = getDerivedTraits(sheet);
  assert.deepEqual(derived.resistances, {
    dodge: 4,
    fortitude: 4,
    toughness: 5,
    will: 5,
  });
  assert.equal(derived.initiative, 7);
  assert.equal(getSkillTotal(acrobatics, derived), 11);

  sheet.abilities.agility = 5;
  const changed = getDerivedTraits(sheet);
  assert.equal(changed.resistances.dodge, 6);
  assert.equal(changed.initiative, 9);
  assert.equal(getSkillTotal(acrobatics, changed), 13);
});

test("point accounting uses atomic ranks and does not double-charge equipment", () => {
  const sheet = createEmptySheet();
  sheet.abilities.strength = 3;
  sheet.abilities.presence = -1;
  sheet.combat.attack = 4;
  sheet.combat.defense = 5;
  sheet.combat.closeAttack = 2;
  sheet.combat.initiativeBonus = 5;
  sheet.resistanceAdjustments.fortitude = 3;
  sheet.attackSpecializations.push({
    id: newId("spec"),
    name: "Espadas",
    rank: 3,
    range: "close",
  });
  sheet.skills[0].rank = 3;
  sheet.skills[1].rank = 2;
  sheet.skills[0].specialization = "Equilíbrio";
  sheet.skills[0].specializationRank = 3;
  sheet.advantages.push({
    id: newId("adv"),
    catalogKey: "equipment",
    name: "Equipamento",
    rank: 2,
    categories: ["Geral"],
    kind: "equipment",
    notes: "",
  });
  sheet.equipment.push({
    id: newId("equipment"),
    catalogKey: "",
    name: "Kit",
    type: "Equipamento",
    cost: 10,
    active: true,
    details: "",
  });

  const points = getPointBreakdown(sheet);
  assert.equal(points.abilities, 4);
  assert.equal(points.combat, 24);
  assert.equal(points.resistances, 3);
  assert.equal(points.skills, 4);
  assert.equal(points.advantages, 2);
  assert.equal(points.total, 37);
  assert.deepEqual(getEquipmentTotals(sheet), {
    used: 10,
    allowance: 10,
    remaining: 0,
  });
});

test("power cost matches the preview formula and fractional ratios", () => {
  const effect = createPowerEffect();
  effect.rank = 8;
  effect.baseCost = 2;
  effect.extras = [
    { id: "extra", name: "Extra", value: 1, ranksApplied: 0 },
  ];
  effect.flaws = [
    { id: "flaw", name: "Falha", value: 2, ranksApplied: 0 },
  ];
  effect.features = [
    { id: "feature", name: "Recurso", rank: 2, rule: "generic" },
  ];
  effect.drawbacks = [
    {
      id: "drawback",
      name: "Desvantagem",
      rank: 1,
      rule: "generic",
    },
  ];
  assert.equal(getEffectCostBreakdown(effect).total, 9);

  effect.baseCost = 1;
  effect.extras[0].value = 1;
  effect.flaws[0].value = 3;
  effect.features = [];
  effect.drawbacks = [];
  const fractional = getEffectCostBreakdown(effect);
  assert.equal(fractional.total, 3);
  assert.equal(fractional.segments[0].ratio, "1:3");

  effect.rank = 7;
  effect.baseCost = 2;
  effect.extras[0] = {
    id: "partial",
    name: "Área",
    value: 1,
    ranksApplied: 4,
  };
  effect.flaws = [];
  const partial = getEffectCostBreakdown(effect);
  assert.equal(partial.total, 18);
  assert.deepEqual(
    partial.segments.map((segment) => [
      segment.ranks,
      segment.adjustedCostPerRank,
      segment.cost,
    ]),
    [
      [4, 3, 12],
      [3, 2, 6],
    ],
  );

  effect.rank = 1;
  effect.baseCost = 1;
  effect.extras = [];
  effect.drawbacks = [
    {
      id: "large-drawback",
      name: "Desvantagem",
      rank: 20,
      rule: "generic",
    },
  ];
  const minimum = getEffectCostBreakdown(effect);
  assert.equal(minimum.total, 1);
  assert.equal(minimum.minimumApplied, true);
});

test("Removable and power arrays are charged at container level", () => {
  const sheet = createEmptySheet();
  const device = createPower();
  device.name = "Armadura";
  device.removable = "removable";
  device.effects[0].rank = 98;
  device.effects[0].baseCost = 1;
  sheet.powers = [device];
  assert.equal(getPowerPortfolio(sheet).total, 78);

  const base = createPower();
  base.name = "Rajada";
  base.arrayName = "Arsenal";
  base.arrayRole = "base";
  base.baseDynamic = true;
  base.wideRanks = 2;
  base.effects[0].rank = 20;
  const alternate = createPower();
  alternate.name = "Cegar";
  alternate.arrayName = "Arsenal";
  alternate.arrayRole = "alternate";
  alternate.effects[0].rank = 20;
  const dynamic = createPower();
  dynamic.name = "Laço";
  dynamic.arrayName = "Arsenal";
  dynamic.arrayRole = "dynamic";
  dynamic.effects[0].rank = 10;
  sheet.powers = [base, alternate, dynamic];
  const portfolio = getPowerPortfolio(sheet);
  assert.equal(portfolio.total, 26);
  assert.equal(portfolio.arrays[0].featureCost, 6);
  assert.equal(portfolio.arrays[0].valid, true);

  alternate.effects[0].rank = 21;
  assert.equal(getPowerPortfolio(sheet).arrays[0].valid, false);
});

test("PL checks distinguish objective failures from complete successes", () => {
  const sheet = createEmptySheet();
  sheet.powerLevel = 10;
  sheet.abilities.strength = 10;
  sheet.combat.attack = 10;
  sheet.combat.defense = 10;
  sheet.resistanceAdjustments = {
    dodge: 10,
    fortitude: 10,
    toughness: 10,
    will: 10,
  };
  sheet.complications[0] = {
    ...sheet.complications[0],
    catalogKey: "justice",
    name: "Justiça",
    type: "Motivação",
    description: "Protege inocentes e leva culpados à justiça.",
  };
  sheet.attacks = [
    {
      id: "unarmed",
      name: "Golpe",
      sourceEffectId: "",
      sourceEquipmentId: "",
      range: "close",
      effectRank: 0,
      strengthBased: true,
      manualEffectSource: "strength",
      manualEffectSourceNote: "Dano de Força",
      specializationId: "",
      miscellaneousAttackBonus: 0,
      miscellaneousAttackSource: "",
      resistance: "Robustez",
      notes: "",
    },
  ];
  assert.equal(getRuleAudit(sheet).status, "pass");

  sheet.attacks[0].effectRank = 1;
  sheet.attacks[0].manualEffectSource = "other";
  sheet.attacks[0].manualEffectSourceNote = "Efeito pago externamente";
  const failed = getRuleAudit(sheet);
  assert.equal(failed.status, "fail");
  assert.ok(
    failed.checks.some(
      (check) => check.key === "attack-unarmed" && check.status === "fail",
    ),
  );
});

test("effects without attack checks are capped at PL", () => {
  const sheet = createEmptySheet();
  const power = createPower();
  power.name = "Explosão mental";
  power.effects[0].name = "Dano";
  power.effects[0].rank = 11;
  power.effects[0].isAttack = true;
  power.effects[0].requiresAttackCheck = false;
  sheet.powers = [power];
  const audit = getRuleAudit(sheet);
  assert.ok(
    audit.checks.some(
      (check) =>
        check.key === `attack-effect-${power.effects[0].id}` &&
        check.status === "fail",
    ),
  );
});

test("PL validation considers powers that can be activated, not only the current toggle", () => {
  const sheet = createEmptySheet();
  const enhancement = createPower();
  enhancement.name = "Mira ampliada";
  enhancement.active = false;
  enhancement.effects[0].traitLinks = [
    {
      id: "attack-link",
      trait: "attack",
      mode: "fixed",
      value: 11,
    },
  ];
  sheet.powers = [enhancement];
  sheet.attacks = [
    {
      id: "potential-attack",
      name: "Disparo",
      sourceEffectId: "",
      sourceEquipmentId: "",
      range: "ranged",
      effectRank: 10,
      strengthBased: false,
      manualEffectSource: "other",
      manualEffectSourceNote: "Equipamento narrativo",
      specializationId: "",
      miscellaneousAttackBonus: 0,
      miscellaneousAttackSource: "",
      resistance: "Robustez",
      notes: "",
    },
  ];
  assert.equal(
    getRuleAudit(sheet).checks.find(
      (check) => check.key === "attack-potential-attack",
    )?.status,
    "fail",
  );
});

test("array roles without an array name cannot be falsely validated", () => {
  const sheet = createEmptySheet();
  const alternate = createPower();
  alternate.arrayRole = "alternate";
  alternate.arrayName = "";
  sheet.powers = [alternate];
  const audit = getRuleAudit(sheet);
  assert.equal(audit.status, "fail");
  assert.ok(
    audit.checks.some(
      (check) =>
        check.key === `array-name-${alternate.id}` &&
        check.status === "fail",
    ),
  );
});

test("heroic limit tracks uses during the adventure, not advantages owned", () => {
  const sheet = createEmptySheet();
  sheet.advantages = [
    {
      id: "determination",
      catalogKey: "determination",
      name: "Determinação",
      rank: 3,
      categories: ["Heroica"],
      kind: "standard",
      notes: "",
    },
    {
      id: "luck",
      catalogKey: "luck",
      name: "Sorte",
      rank: 3,
      categories: ["Heroica", "Fortuna"],
      kind: "standard",
      notes: "",
    },
  ];
  sheet.resources.heroicAdvantageUses = 4;
  let check = getRuleAudit(sheet).checks.find(
    (entry) => entry.key === "heroic-uses",
  )!;
  assert.equal(check.status, "pass");
  assert.equal(check.limit, 5);

  sheet.resources.heroicAdvantageUses = 6;
  check = getRuleAudit(sheet).checks.find(
    (entry) => entry.key === "heroic-uses",
  )!;
  assert.equal(check.status, "fail");

  sheet.resources.heroicAdvantageUses = 4;
  sheet.advantages[0].rank = 1;
  sheet.advantages[1].rank = 1;
  const capacityCheck = getRuleAudit(sheet).checks.find(
    (entry) => entry.key === "heroic-use-capacity",
  )!;
  assert.equal(capacityCheck.status, "fail");
  assert.equal(capacityCheck.limit, 2);
});

test("exceptional point adjustments always request narrator review", () => {
  const sheet = createEmptySheet();
  sheet.otherPointAdjustment = {
    value: -5,
    reason: "Regra própria documentada da campanha.",
  };
  const check = getRuleAudit(sheet).checks.find(
    (entry) => entry.key === "point-adjustment-reason",
  );
  assert.equal(check?.status, "attention");
  assert.match(check?.detail ?? "", /Narrador/);
});

test("NPCs receive informational PL and budget results", () => {
  const sheet = createEmptySheet();
  sheet.buildType = "npc";
  sheet.abilities.strength = 30;
  sheet.combat.attack = 30;
  sheet.attacks = [
    {
      id: "npc-attack",
      name: "Ataque de ameaça",
      sourceEffectId: "",
      sourceEquipmentId: "",
      range: "close",
      effectRank: 30,
      strengthBased: false,
      manualEffectSource: "other",
      manualEffectSourceNote: "Traço de NPC",
      specializationId: "",
      miscellaneousAttackBonus: 0,
      miscellaneousAttackSource: "",
      resistance: "Robustez",
      notes: "",
    },
  ];
  const audit = getRuleAudit(sheet);
  assert.equal(
    audit.checks.find((check) => check.key === "attack-npc-attack")
      ?.status,
    "info",
  );
  assert.equal(
    audit.checks.find((check) => check.key === "point-budget")?.status,
    "info",
  );
});

test("yellow warnings can stay pending, be approved, or be rejected safely", () => {
  const sheet = createEmptySheet();
  sheet.buildType = "npc";
  sheet.advantages.push({
    id: "table-ruling",
    catalogKey: CUSTOM_CATALOG_KEY,
    name: "Vantagem da mesa",
    rank: 1,
    categories: ["Geral"],
    kind: "standard",
    notes: "Regra própria da campanha.",
  });

  const key = "advantage-custom-table-ruling";
  let audit = getRuleAudit(sheet);
  let check = audit.checks.find((entry) => entry.key === key)!;
  assert.equal(check.status, "attention");
  assert.equal(check.baseStatus, "attention");
  assert.equal(check.reviewDecision, "pending");

  sheet.auditDecisions[key] = {
    decision: "approved",
    fingerprint: check.reviewFingerprint!,
    decidedAt: "2026-08-02T00:00:00.000Z",
  };
  audit = getRuleAudit(sheet);
  check = audit.checks.find((entry) => entry.key === key)!;
  assert.equal(check.status, "pass");
  assert.equal(check.reviewDecision, "approved");
  assert.equal(audit.attentions, 0);
  assert.equal(audit.approvals, 1);
  assert.equal(audit.status, "info");

  sheet.advantages[0].name = "Outra vantagem da mesa";
  audit = getRuleAudit(sheet);
  check = audit.checks.find((entry) => entry.key === key)!;
  assert.equal(check.status, "attention");
  assert.equal(check.reviewDecision, "pending");

  sheet.auditDecisions[key] = {
    decision: "rejected",
    fingerprint: check.reviewFingerprint!,
    decidedAt: "2026-08-02T00:01:00.000Z",
  };
  audit = getRuleAudit(sheet);
  check = audit.checks.find((entry) => entry.key === key)!;
  assert.equal(check.status, "fail");
  assert.equal(check.reviewDecision, "rejected");
  assert.equal(audit.rejections, 1);
  assert.equal(audit.status, "fail");
});

test("objective errors cannot be manually approved", () => {
  const sheet = createEmptySheet();
  sheet.abilities.strength = -6;
  const key = "ability-min-strength";
  const failure = getRuleAudit(sheet).checks.find(
    (check) => check.key === key,
  )!;
  sheet.auditDecisions[key] = {
    decision: "approved",
    fingerprint: getRuleReviewFingerprint(failure),
    decidedAt: "2026-08-02T00:00:00.000Z",
  };

  const reviewed = getRuleAudit(sheet).checks.find(
    (check) => check.key === key,
  );
  assert.equal(reviewed?.status, "fail");
  assert.equal(reviewed?.reviewDecision, undefined);
});

test("legacy sheets retain totals while exposing what still needs review", () => {
  const sheet = normalizeSheet({
    heroName: "Legado",
    powerLevel: 10,
    pointsTotal: 150,
    abilities: {
      strength: 1,
      stamina: 2,
      agility: 4,
      intellect: 0,
      awareness: 3,
      presence: 0,
      attack: 8,
      defense: 9,
      initiative: 8,
    },
    resistances: {
      dodge: 7,
      fortitude: 6,
      toughness: 8,
      will: 5,
    },
    powers: [
      {
        id: "legacy-power",
        name: "Raio",
        effect: "Dano",
        rank: 8,
        cost: 17,
        extras: "À distância",
      },
    ],
  });
  assert.equal(sheet.combat.attack, 8);
  assert.equal(sheet.combat.defense, 9);
  assert.equal(sheet.combat.initiativeBonus, 4);
  assert.deepEqual(sheet.resistanceAdjustments, {
    dodge: 3,
    fortitude: 4,
    toughness: 6,
    will: 2,
  });
  assert.equal(sheet.budgetMode, "recommended");
  assert.equal(getPointBreakdown(sheet).powers, 17);
  assert.ok(
    getRuleAudit(sheet).checks.some(
      (check) =>
        check.key.startsWith("power-legacy-") &&
        check.status === "attention",
    ),
  );
});

test("canonical skills and conditions have the required specialized costs and no gaps", () => {
  const performance = defaultSkills.find((skill) => skill.name === "Atuação");
  const expertise = defaultSkills.find((skill) =>
    skill.name.includes("Expertise"),
  );

  assert.ok(performance);
  assert.ok(expertise);
  assert.equal(performance?.costClass, "specialized");
  assert.equal(expertise?.costClass, "specialized");
  assert.equal(new Set(conditions).size, conditions.length);
  assert.equal(conditions.length, 38);
  assert.ok(conditions.includes("Normal (Normal)"));

  const migrated = normalizeSheet({
    ...createEmptySheet(),
    skills: [
      {
        ...performance,
        id: newId("skill"),
        costClass: "regular",
        trainedOnly: false,
      },
    ],
  });
  assert.equal(migrated.skills[0].costClass, "specialized");
  assert.equal(migrated.skills[0].trainedOnly, true);

  const migratedConditions = normalizeSheet({
    ...createEmptySheet(),
    resources: {
      ...createEmptySheet().resources,
      conditions: ["Debilitado", "Debilitated", "Normal"],
    },
  });
  assert.deepEqual(migratedConditions.resources.conditions, [
    "Debilitado (Debilitated)",
    "Normal (Normal)",
  ]);
});

test("fractional and out-of-range ranks cannot receive a false green status", () => {
  const sheet = createEmptySheet();
  sheet.skills[0].rank = 1.5;
  sheet.resources.luckMax = 1;
  sheet.resources.luckCurrent = 2;

  const audit = getRuleAudit(sheet);
  const integrity = audit.checks.find(
    (check) => check.key === "numeric-integrity",
  );

  assert.equal(audit.status, "fail");
  assert.equal(integrity?.status, "fail");
  assert.match(integrity?.detail ?? "", /deve ser inteiro/);
  assert.match(integrity?.detail ?? "", /Sorte atual/);
});

test("empty effects cost zero, fail audit, and huge ranks stay calculable", () => {
  const empty = createPowerEffect();
  empty.rank = 0;
  assert.equal(getEffectCostBreakdown(empty).total, 0);

  const sheet = createEmptySheet();
  const power = createPower();
  power.effects = [empty];
  sheet.powers = [power];
  assert.equal(getRuleAudit(sheet).status, "fail");

  const huge = createPowerEffect();
  huge.rank = 1_000_000;
  huge.baseCost = 2;
  huge.extras = [{ id: "partial", name: "Parcial", value: 1, ranksApplied: 10 }];
  const breakdown = getEffectCostBreakdown(huge);
  assert.equal(breakdown.total, 2_000_010);
  assert.equal(breakdown.segments.length, 2);
});
