import {
  abilityLabels,
  coreAbilityKeys,
  getEffectiveAbsentTraits,
  isResistanceAbsent,
  requiresSpecializedSkillCost,
  resistanceKeys,
  resistanceLabels,
  type AttackEntry,
  type AbsentTraitKey,
  type AuditDecision,
  type CharacterSheet,
  type CoreAbilityKey,
  type PowerEffectEntry,
  type PowerEntry,
  type ResistanceKey,
  type SheetSummary,
  type SkillEntry,
  type TraitKey,
} from "./character";
import {
  findAdvantagePreset,
  findComplicationPreset,
  findEquipmentPreset,
  findFlatModifierPreset,
  findPowerConfigurationPreset,
  findPowerEffectPreset,
  findRankedModifierPreset,
  findSkillPreset,
  motivationCatalog,
  type PowerConfigurationPreset,
} from "./catalog";
import { applyPowerConfigurationPreset } from "./power-configurations";

export type RuleStatus = "pass" | "fail" | "attention" | "info";
export type RuleGroup =
  | "pl"
  | "points"
  | "powers"
  | "equipment"
  | "data";

export type RuleCheck = {
  key: string;
  label: string;
  status: RuleStatus;
  group: RuleGroup;
  detail: string;
  value?: number;
  limit?: number;
  valid: boolean;
  baseStatus?: "attention";
  reviewDecision?: "pending" | AuditDecision;
  reviewFingerprint?: string;
};

export type RuleAudit = {
  status: RuleStatus;
  checks: RuleCheck[];
  failures: number;
  attentions: number;
  approvals: number;
  rejections: number;
};

export type MotivationState = {
  present: boolean;
  complete: boolean;
  source: "identity" | "complication" | "none";
};

export function isMotivationComplication(
  complication: CharacterSheet["complications"][number],
) {
  const normalizedName = normalizeName(complication.name);
  const catalogMotivation = motivationCatalog.some(
    (entry) =>
      entry.id === complication.catalogKey ||
      normalizeName(entry.label) === normalizedName ||
      normalizeName(entry.canonical) === normalizedName,
  );
  return (
    normalizeName(complication.type) === "motivacao" ||
    catalogMotivation ||
    findComplicationPreset(
      complication.name,
      complication.catalogKey,
      complication.type,
    )?.category === "Motivação"
  );
}

export function getMotivationState(sheet: CharacterSheet): MotivationState {
  if (sheet.personality.trim()) {
    return { present: true, complete: true, source: "identity" };
  }

  const motivations = sheet.complications.filter(isMotivationComplication);

  const present = motivations.some(
    (complication) =>
      Boolean(complication.catalogKey) ||
      normalizeName(complication.name) !== "motivacao" ||
      Boolean(complication.description.trim()),
  );
  const complete = motivations.some((complication) =>
    Boolean(complication.description.trim()),
  );
  return {
    present,
    complete,
    source: present ? "complication" : "none",
  };
}

export function getRuleReviewFingerprint(
  check: Pick<RuleCheck, "key" | "label" | "group" | "detail" | "value" | "limit">,
) {
  return JSON.stringify([
    check.key,
    check.label,
    check.group,
    check.detail,
    check.value ?? null,
    check.limit ?? null,
  ]);
}

export type DerivedTraits = {
  abilities: Record<CoreAbilityKey, number>;
  attack: number;
  closeAttack: number;
  rangedAttack: number;
  defense: number;
  closeDefense: number;
  rangedDefense: number;
  initiative: number;
  resistances: Record<ResistanceKey, number>;
  powerBonuses: Record<TraitKey, number>;
  advantageBonuses: Record<TraitKey, number>;
  equipmentBonuses: Record<TraitKey, number>;
  absentTraits: ReadonlySet<AbsentTraitKey>;
  absentResistances: ReadonlySet<ResistanceKey>;
};

export type EffectCostSegment = {
  adjustedCostPerRank: number;
  ranks: number;
  cost: number;
  ratio: string;
};

export type EffectCostBreakdown = {
  total: number;
  rankedCost: number;
  featureCost: number;
  drawbackDiscount: number;
  minimumApplied: boolean;
  complete: boolean;
  segments: EffectCostSegment[];
};

export type PowerCostEntry = {
  powerId: string;
  configurationCost: number;
  chargedCost: number;
  removableDiscount: number;
  complete: boolean;
  arrayName: string;
  arrayRole: PowerEntry["arrayRole"];
};

export type ArrayCostSummary = {
  key: string;
  name: string;
  valid: boolean;
  basePowerId: string;
  baseConfigurationCost: number;
  featureCost: number;
  removableDiscount: number;
  total: number;
  issues: string[];
};

export type PowerPortfolio = {
  total: number;
  entries: PowerCostEntry[];
  arrays: ArrayCostSummary[];
};

export type PointBreakdown = {
  abilities: number;
  combat: number;
  resistances: number;
  skills: number;
  advantages: number;
  powers: number;
  adjustments: number;
  total: number;
  regularSkillRanks: number;
  specializedSkillRanks: number;
};

export type AttackCalculation = {
  key: string;
  name: string;
  sourceEffectId: string;
  range: AttackEntry["range"];
  attackBonus: number;
  effectRank: number;
  limitValue: number;
  limit: number;
  effectDc: number;
  complete: boolean;
  blockedReason: string;
  detail: string;
};

const emptyTraitBonuses = (): Record<TraitKey, number> => ({
  strength: 0,
  stamina: 0,
  agility: 0,
  intellect: 0,
  awareness: 0,
  presence: 0,
  attack: 0,
  closeAttack: 0,
  rangedAttack: 0,
  defense: 0,
  closeDefense: 0,
  rangedDefense: 0,
  initiative: 0,
  dodge: 0,
  fortitude: 0,
  toughness: 0,
  will: 0,
});

export function getPointBudget(sheet: CharacterSheet) {
  return sheet.budgetMode === "custom"
    ? finite(sheet.customPointBudget)
    : finite(sheet.powerLevel) * 15;
}

export function getDerivedTraits(sheet: CharacterSheet): DerivedTraits {
  const absentTraits = getEffectiveAbsentTraits(sheet);
  const absentResistances = new Set(
    resistanceKeys.filter((key) => isResistanceAbsent(sheet, key)),
  );
  const powerBonuses = getActivePowerBonuses(sheet);
  const advantageBonuses = getAdvantageBonuses(sheet);
  const equipmentBonuses = getEquipmentBonuses(sheet);
  const bonus = (key: TraitKey) =>
    powerBonuses[key] + advantageBonuses[key] + equipmentBonuses[key];
  const abilities = Object.fromEntries(
    coreAbilityKeys.map((key) => [
      key,
      absentTraits.has(key)
        ? 0
        : finite(sheet.abilities[key]) + bonus(key),
    ]),
  ) as Record<CoreAbilityKey, number>;

  const attack = absentTraits.has("attack")
    ? 0
    : finite(sheet.combat.attack) + bonus("attack");
  const defense = absentTraits.has("defense")
    ? 0
    : finite(sheet.combat.defense) + bonus("defense");
  const closeAttack =
    absentTraits.has("attack")
      ? 0
      : attack +
        finite(sheet.combat.closeAttack) +
        bonus("closeAttack");
  const rangedAttack =
    absentTraits.has("attack")
      ? 0
      : attack +
        finite(sheet.combat.rangedAttack) +
        bonus("rangedAttack");
  const closeDefense =
    absentTraits.has("defense")
      ? 0
      : defense +
        finite(sheet.combat.closeDefense) +
        bonus("closeDefense");
  const rangedDefense =
    absentTraits.has("defense")
      ? 0
      : defense +
        finite(sheet.combat.rangedDefense) +
        bonus("rangedDefense");
  const initiative =
    absentTraits.has("agility")
      ? 0
      : abilities.agility +
        finite(sheet.combat.initiativeBonus) +
        bonus("initiative");

  return {
    abilities,
    attack,
    closeAttack,
    rangedAttack,
    defense,
    closeDefense,
    rangedDefense,
    initiative,
    resistances: {
      dodge:
        abilities.agility +
        finite(sheet.resistanceAdjustments.dodge) +
        bonus("dodge"),
      fortitude:
        absentResistances.has("fortitude")
          ? 0
          : abilities.stamina +
            finite(sheet.resistanceAdjustments.fortitude) +
            bonus("fortitude"),
      toughness:
        abilities.stamina +
        finite(sheet.resistanceAdjustments.toughness) +
        bonus("toughness"),
      will:
        absentResistances.has("will")
          ? 0
          : abilities.awareness +
            finite(sheet.resistanceAdjustments.will) +
            bonus("will"),
    },
    powerBonuses,
    advantageBonuses,
    equipmentBonuses,
    absentTraits,
    absentResistances,
  };
}

export function getSkillTotal(
  skill: SkillEntry,
  derived: DerivedTraits,
  includeSpecialization = true,
) {
  return (
    derived.abilities[skill.ability] +
    finite(skill.rank) +
    (includeSpecialization ? finite(skill.specializationRank) : 0) +
    finite(skill.miscellaneousModifier)
  );
}

export function getEffectCostBreakdown(
  effect: PowerEffectEntry,
): EffectCostBreakdown {
  if (effect.costMode === "legacy") {
    const legacyCost = Math.max(0, integer(effect.legacyCost));
    return {
      total: legacyCost,
      rankedCost: legacyCost,
      featureCost: 0,
      drawbackDiscount: 0,
      minimumApplied: false,
      complete: false,
      segments: [],
    };
  }

  const ranks = Math.max(0, integer(effect.rank));
  const baseCost = finite(effect.baseCost);
  const costCounts = new Map<number, number>();
  const breakpoints = new Set([1, ranks + 1]);
  for (const modifier of [...effect.extras, ...effect.flaws]) {
    const applied = Math.max(0, integer(modifier.ranksApplied));
    if (applied > 0 && applied < ranks) breakpoints.add(applied + 1);
  }
  const ordered = [...breakpoints]
    .filter((value) => value >= 1 && value <= ranks + 1)
    .sort((a, b) => a - b);
  for (let index = 0; index < ordered.length - 1; index += 1) {
    const rank = ordered[index];
    const segmentRanks = ordered[index + 1] - rank;
    if (segmentRanks <= 0) continue;
    const extras = effect.extras.reduce(
      (total, modifier) =>
        total +
        (modifierApplies(modifier.ranksApplied, rank, ranks)
          ? finite(modifier.value)
          : 0),
      0,
    );
    const flaws = effect.flaws.reduce(
      (total, modifier) =>
        total +
        (modifierApplies(modifier.ranksApplied, rank, ranks)
          ? finite(modifier.value)
          : 0),
      0,
    );
    const adjusted = baseCost + extras - flaws;
    costCounts.set(adjusted, (costCounts.get(adjusted) ?? 0) + segmentRanks);
  }

  const segments: EffectCostSegment[] = [...costCounts.entries()]
    .sort(([a], [b]) => b - a)
    .map(([adjustedCostPerRank, segmentRanks]) => {
      if (adjustedCostPerRank >= 1) {
        return {
          adjustedCostPerRank,
          ranks: segmentRanks,
          cost: adjustedCostPerRank * segmentRanks,
          ratio: `${formatNumber(adjustedCostPerRank)}:1`,
        };
      }
      const ranksPerPoint = Math.max(1, 2 - adjustedCostPerRank);
      return {
        adjustedCostPerRank,
        ranks: segmentRanks,
        cost: Math.ceil(segmentRanks / ranksPerPoint),
        ratio: `1:${formatNumber(ranksPerPoint)}`,
      };
    });

  const rankedCost = segments.reduce((total, segment) => total + segment.cost, 0);
  const featureCost = effect.features.reduce(
    (total, feature) => total + Math.max(0, integer(feature.rank)),
    0,
  );
  const drawbackDiscount = effect.drawbacks.reduce(
    (total, drawback) => total + Math.max(0, integer(drawback.rank)),
    0,
  );
  const beforeMinimum = rankedCost + featureCost - drawbackDiscount;
  const hasPositiveConfiguration = ranks > 0 || featureCost > 0;
  const total = hasPositiveConfiguration ? Math.max(1, beforeMinimum) : 0;

  return {
    total,
    rankedCost,
    featureCost,
    drawbackDiscount,
    minimumApplied: hasPositiveConfiguration && beforeMinimum < 1,
    complete: true,
    segments,
  };
}

export function getPowerConfigurationCost(power: PowerEntry) {
  return power.effects.reduce(
    (total, effect) => total + getEffectCostBreakdown(effect).total,
    0,
  );
}

export function getPowerPortfolio(sheet: CharacterSheet): PowerPortfolio {
  const entries: PowerCostEntry[] = [];
  const arrays: ArrayCostSummary[] = [];
  const grouped = new Map<string, PowerEntry[]>();
  const groupedIds = new Set<string>();

  for (const power of sheet.powers) {
    const arrayName = power.arrayName.trim();
    if (power.arrayRole !== "none" && arrayName) {
      const key = normalizeName(arrayName);
      grouped.set(key, [...(grouped.get(key) ?? []), power]);
      groupedIds.add(power.id);
    }
  }

  for (const power of sheet.powers) {
    if (groupedIds.has(power.id)) continue;
    const configurationCost = getPowerConfigurationCost(power);
    const removableDiscount = getRemovableDiscount(
      configurationCost,
      power.removable,
    );
    const chargedCost = configurationCost
      ? Math.max(1, configurationCost - removableDiscount)
      : 0;
    entries.push({
      powerId: power.id,
      configurationCost,
      chargedCost,
      removableDiscount,
      complete: power.effects.every(
        (effect) => getEffectCostBreakdown(effect).complete,
      ),
      arrayName: power.arrayName,
      arrayRole: power.arrayRole,
    });
  }

  for (const [key, powers] of grouped) {
    const bases = powers.filter((power) => power.arrayRole === "base");
    const issues: string[] = [];
    const base = bases[0];

    if (bases.length !== 1) {
      issues.push(
        bases.length === 0
          ? "A matriz não possui uma configuração-base."
          : "A matriz possui mais de uma configuração-base.",
      );
    }

    if (!base) {
      let fallbackTotal = 0;
      for (const power of powers) {
        const configurationCost = getPowerConfigurationCost(power);
        const removableDiscount = getRemovableDiscount(
          configurationCost,
          power.removable,
        );
        const chargedCost = configurationCost
          ? Math.max(1, configurationCost - removableDiscount)
          : 0;
        fallbackTotal += chargedCost;
        entries.push({
          powerId: power.id,
          configurationCost,
          chargedCost,
          removableDiscount,
          complete: power.effects.every(
            (effect) => getEffectCostBreakdown(effect).complete,
          ),
          arrayName: power.arrayName,
          arrayRole: power.arrayRole,
        });
      }
      arrays.push({
        key,
        name: powers[0]?.arrayName ?? "Matriz",
        valid: false,
        basePowerId: "",
        baseConfigurationCost: 0,
        featureCost: 0,
        removableDiscount: 0,
        total: fallbackTotal,
        issues,
      });
      continue;
    }

    const baseConfigurationCost = getPowerConfigurationCost(base);
    const alternateFeatureCost = powers.reduce((total, power) => {
      if (power.id === base.id) return total;
      return total + (power.arrayRole === "dynamic" ? 2 : 1);
    }, 0);
    const featureCost =
      alternateFeatureCost +
      Math.max(0, integer(base.wideRanks)) +
      (base.baseDynamic ? 1 : 0);
    const preRemovable = baseConfigurationCost + featureCost;
    const removableDiscount = getRemovableDiscount(
      preRemovable,
      base.removable,
    );
    const total = preRemovable
      ? Math.max(1, preRemovable - removableDiscount)
      : 0;

    for (const power of powers) {
      const configurationCost = getPowerConfigurationCost(power);
      if (power.id !== base.id && configurationCost > baseConfigurationCost) {
        issues.push(
          `${power.name || "Efeito alternativo"} custa ${configurationCost} PP, acima dos ${baseConfigurationCost} PP da base.`,
        );
      }
      if (
        power.effects.some(
          (effect) =>
            normalizeName(effect.duration) === "permanente" ||
            normalizeName(effect.duration) === "permanent",
        )
      ) {
        issues.push(
          `${power.name || "Configuração"} contém efeito permanente, incompatível com uma matriz.`,
        );
      }
      if (power.id !== base.id && power.removable !== "none") {
        issues.push(
          `A condição Removível de ${power.name || "um alternativo"} deve ficar apenas na configuração-base.`,
        );
      }
      entries.push({
        powerId: power.id,
        configurationCost,
        chargedCost:
          power.id === base.id
            ? total
            : power.arrayRole === "dynamic"
              ? 2
              : 1,
        removableDiscount: power.id === base.id ? removableDiscount : 0,
        complete: power.effects.every(
          (effect) => getEffectCostBreakdown(effect).complete,
        ),
        arrayName: power.arrayName,
        arrayRole: power.arrayRole,
      });
    }

    arrays.push({
      key,
      name: base.arrayName,
      valid: issues.length === 0 && bases.length === 1,
      basePowerId: base.id,
      baseConfigurationCost,
      featureCost,
      removableDiscount,
      total,
      issues,
    });
  }

  return {
    total:
      entries
        .filter(
          (entry) =>
            entry.arrayRole === "none" ||
            !entry.arrayName.trim(),
        )
        .reduce((total, entry) => total + entry.chargedCost, 0) +
      arrays.reduce((total, array) => total + array.total, 0),
    entries,
    arrays,
  };
}

export function getPointBreakdown(sheet: CharacterSheet): PointBreakdown {
  const absentTraits = getEffectiveAbsentTraits(sheet);
  const abilities = coreAbilityKeys.reduce(
    (total, key) =>
      total +
      (absentTraits.has(key) ? -10 : finite(sheet.abilities[key]) * 2),
    0,
  );
  const specializationCost = sheet.attackSpecializations.reduce(
    (total, specialization) =>
      total + Math.ceil(Math.max(0, integer(specialization.rank)) / 2),
    0,
  );
  const combat =
    (absentTraits.has("attack") ? -10 : finite(sheet.combat.attack) * 2) +
    (absentTraits.has("defense") ? -10 : finite(sheet.combat.defense) * 2) +
    finite(sheet.combat.closeAttack) +
    finite(sheet.combat.rangedAttack) +
    finite(sheet.combat.closeDefense) +
    finite(sheet.combat.rangedDefense) +
    Math.ceil(Math.max(0, finite(sheet.combat.initiativeBonus)) / 4) +
    specializationCost;
  const resistances = resistanceKeys.reduce(
    (total, key) => total + finite(sheet.resistanceAdjustments[key]),
    0,
  );
  const regularSkillRanks = sheet.skills.reduce(
    (total, entry) =>
      total +
      (entry.costClass === "regular"
        ? Math.max(0, integer(entry.rank))
        : 0),
    0,
  );
  const specializedSkillRanks = sheet.skills.reduce(
    (total, entry) =>
      total +
      (entry.costClass === "specialized"
        ? Math.max(0, integer(entry.rank))
        : 0) +
      Math.max(0, integer(entry.specializationRank)),
    0,
  );
  const skills =
    Math.ceil(regularSkillRanks / 2) +
    Math.ceil(specializedSkillRanks / 4);
  const advantages = sheet.advantages.reduce(
    (total, entry) => total + Math.max(0, integer(entry.rank)),
    0,
  );
  const powers = getPowerPortfolio(sheet).total;
  const adjustments = finite(sheet.otherPointAdjustment.value);
  return {
    abilities,
    combat,
    resistances,
    skills,
    advantages,
    powers,
    adjustments,
    total:
      abilities +
      combat +
      resistances +
      skills +
      advantages +
      powers +
      adjustments,
    regularSkillRanks,
    specializedSkillRanks,
  };
}

export function pointsSpent(sheet: CharacterSheet) {
  return getPointBreakdown(sheet).total;
}

export function getAttackCalculation(
  sheet: CharacterSheet,
  attack: AttackEntry,
): AttackCalculation {
  const source = findPowerEffect(sheet, attack.sourceEffectId);
  const equipmentSource = findEquipmentAttack(
    sheet,
    attack.sourceEquipmentId,
  );
  const range: AttackEntry["range"] = source
    ? source.effect.requiresAttackCheck
      ? source.effect.attackRange
      : "no-check"
    : equipmentSource
      ? equipmentSource.preset.attack!.range
    : attack.range;
  const strengthBased = source
    ? source.effect.strengthBased
    : equipmentSource
      ? equipmentSource.preset.attack!.strengthBased
    : attack.strengthBased;
  const scenario = getDerivedScenario(
    sheet,
    (derived) =>
      (range === "ranged"
        ? derived.rangedAttack
        : range === "close"
          ? derived.closeAttack
          : 0) +
      (strengthBased ? derived.abilities.strength : 0),
    "max",
    source?.power.id,
  );
  const derived = scenario.derived;
  const specialization = sheet.attackSpecializations.find(
    (entry) => entry.id === attack.specializationId,
  );
  const specializationApplies =
    specialization &&
    range !== "no-check" &&
    (specialization.range === "either" ||
      specialization.range === range);
  const accuracyModifier = source
    ? getPowerAccuracyModifier(source.effect)
    : 0;
  const baseAttack =
    range === "ranged"
      ? derived.rangedAttack
      : range === "close"
        ? derived.closeAttack
        : finite(sheet.powerLevel);
  const attackBonus =
    baseAttack +
    (specializationApplies ? finite(specialization.rank) : 0) +
    accuracyModifier +
    finite(attack.miscellaneousAttackBonus);
  const baseEffectRank = source
    ? finite(source.effect.rank)
    : equipmentSource
      ? finite(equipmentSource.preset.attack!.effectRank)
    : finite(attack.effectRank);
  const effectRank =
    baseEffectRank + (strengthBased ? derived.abilities.strength : 0);
  const limit = range === "no-check"
    ? finite(sheet.powerLevel)
    : finite(sheet.powerLevel) * 2;
  const limitValue =
    range === "no-check" ? effectRank : attackBonus + effectRank;
  const complete =
    (!attack.sourceEffectId || Boolean(source)) &&
    (!attack.sourceEquipmentId || Boolean(equipmentSource));
  const blockedReason =
    range !== "no-check" && derived.absentTraits.has("attack")
      ? "Ataque ausente faz testes de ataque falharem automaticamente."
      : strengthBased && derived.absentTraits.has("strength")
        ? "Força ausente não pode contribuir para um efeito baseado em Força."
        : "";
  return {
    key: attack.id,
    name:
      attack.name ||
      source?.effect.name ||
      source?.power.name ||
      equipmentSource?.item.name ||
      "Ataque",
    sourceEffectId: attack.sourceEffectId,
    range,
    attackBonus,
    effectRank,
    limitValue,
    limit,
    effectDc: 10 + effectRank,
    complete,
    blockedReason,
    detail:
      blockedReason || (range === "no-check"
        ? `Sem teste de ataque: a graduação do efeito não pode exceder o PL.`
        : `${signed(attackBonus)} de ataque + ${effectRank} de efeito.`),
  };
}

export function getRuleAudit(sheet: CharacterSheet): RuleAudit {
  const checks: RuleCheck[] = [];
  const pl = finite(sheet.powerLevel);
  const npc = sheet.buildType === "npc";
  const absentTraits = getEffectiveAbsentTraits(sheet);
  const activePowerBonuses = getActivePowerBonuses(sheet);
  const advantageBonuses = getAdvantageBonuses(sheet);
  const equipmentBonuses = getEquipmentBonuses(sheet);
  const linkedBonus = (key: TraitKey) =>
    activePowerBonuses[key] + advantageBonuses[key] + equipmentBonuses[key];
  const add = (check: Omit<RuleCheck, "valid">) => {
    checks.push({
      ...check,
      valid: check.status === "pass" || check.status === "info",
    });
  };
  const plCheck = (
    key: string,
    label: string,
    value: number,
    limit: number,
    detail: string,
  ) =>
    add({
      key,
      label,
      value,
      limit,
      detail: npc
        ? `${detail} Para NPCs, este limite é apenas referência.`
        : detail,
      status: npc ? "info" : value <= limit ? "pass" : "fail",
      group: "pl",
    });

  if (sheet.absentTraits.length) {
    add({
      key: "absent-traits-permission",
      label: "Traços ausentes",
      status: npc ? "info" : "attention",
      group: "data",
      detail: npc
        ? "Traços ausentes estão registrados e seus efeitos derivados foram aplicados."
        : "Personagens do Jogador precisam da permissão do Narrador para possuir traços ausentes.",
    });
  }
  if (sheet.absentTraits.includes("awareness")) {
    add({
      key: "absent-awareness-presence",
      label: "Consciência ausente implica Presença ausente",
      status: "info",
      group: "data",
      detail: "Presença também é tratada como ausente e recebe custo de -10 PP enquanto Consciência estiver ausente.",
    });
  }
  for (const key of absentTraits) {
    if (linkedBonus(key) === 0) continue;
    add({
      key: `absent-trait-bonus-${key}`,
      label: `${abilityLabels[key as CoreAbilityKey] ?? (key === "attack" ? "Ataque" : "Defesa")}: bônus em traço ausente`,
      status: "attention",
      group: "data",
      detail: "O bônus vinculado foi preservado, mas não funciona enquanto o traço não existe. Se ele pertencer a uma forma alternativa, registre essa configuração separadamente.",
    });
  }
  if (
    absentTraits.has("stamina") &&
    (finite(sheet.resistanceAdjustments.fortitude) !== 0 ||
      linkedBonus("fortitude") !== 0)
  ) {
    add({
      key: "absent-stamina-fortitude",
      label: "Vigor ausente não possui Fortitude",
      status: "fail",
      group: "data",
      detail: "As graduações de Fortitude registradas não funcionam. Use Imunidade a Fortitude quando o conceito exigir proteção de construto.",
    });
  }
  if (
    isResistanceAbsent(sheet, "will") &&
    (finite(sheet.resistanceAdjustments.will) !== 0 ||
      linkedBonus("will") !== 0)
  ) {
    add({
      key: "absent-mental-will",
      label: "Traço mental ausente não possui Vontade",
      status: "fail",
      group: "data",
      detail: "As graduações de Vontade registradas não funcionam. A ausência de Intelecto, Consciência ou Presença concede Imunidade a Vontade em vez de uma resistência numérica.",
    });
  }
  if (
    absentTraits.has("attack") &&
    (finite(sheet.combat.closeAttack) !== 0 ||
      finite(sheet.combat.rangedAttack) !== 0 ||
      sheet.attackSpecializations.some((entry) => finite(entry.rank) !== 0))
  ) {
    add({
      key: "absent-attack-ranks",
      label: "Ataque ausente com graduações especializadas",
      status: "attention",
      group: "data",
      detail: "Ataque ausente falha automaticamente. As graduações específicas permanecem preservadas, mas não funcionam enquanto o traço estiver ausente.",
    });
  }
  if (
    absentTraits.has("defense") &&
    (finite(sheet.combat.closeDefense) !== 0 ||
      finite(sheet.combat.rangedDefense) !== 0)
  ) {
    add({
      key: "absent-defense-ranks",
      label: "Defesa ausente com graduações específicas",
      status: "attention",
      group: "data",
      detail: "Defesa ausente deixa o personagem Indefeso. As graduações específicas permanecem preservadas, mas não funcionam enquanto o traço estiver ausente.",
    });
  }

  const attackCalculations = sheet.attacks.map((attack) =>
    getAttackCalculation(sheet, attack),
  );
  const linkedEffects = new Set(
    sheet.attacks
      .map((attack) => attack.sourceEffectId)
      .filter(Boolean),
  );

  for (const calculation of attackCalculations) {
    if (!calculation.complete) {
      add({
        key: `attack-source-${calculation.key}`,
        label: calculation.name,
        status: "attention",
        group: "data",
        detail: "A origem vinculada não existe mais; selecione outro poder ou equipamento.",
      });
      continue;
    }
    if (calculation.blockedReason) {
      add({
        key: `attack-absent-trait-${calculation.key}`,
        label: `${calculation.name}: traço ausente`,
        status: "fail",
        group: "data",
        detail: calculation.blockedReason,
      });
      continue;
    }
    plCheck(
      `attack-${calculation.key}`,
      calculation.range === "no-check"
        ? `${calculation.name}: efeito sem ataque`
        : `${calculation.name}: ataque + efeito`,
      calculation.limitValue,
      calculation.limit,
      calculation.detail,
    );
  }

  for (const power of sheet.powers) {
    for (const effect of power.effects) {
      if (!effect.isAttack || linkedEffects.has(effect.id)) continue;
      const synthetic: AttackEntry = {
        id: `effect-${effect.id}`,
        name: effect.name || power.name,
        sourceEffectId: effect.id,
        sourceEquipmentId: "",
        range: effect.requiresAttackCheck ? effect.attackRange : "no-check",
        effectRank: effect.rank,
        strengthBased: effect.strengthBased,
        manualEffectSource: "other",
        manualEffectSourceNote: "",
        specializationId: "",
        miscellaneousAttackBonus: 0,
        miscellaneousAttackSource: "",
        resistance: effect.resistance,
        notes: "",
      };
      const calculation = getAttackCalculation(sheet, synthetic);
      if (calculation.blockedReason) {
        add({
          key: `attack-effect-absent-trait-${effect.id}`,
          label: `${calculation.name}: traço ausente`,
          status: "fail",
          group: "data",
          detail: calculation.blockedReason,
        });
        continue;
      }
      plCheck(
        `attack-effect-${effect.id}`,
        calculation.range === "no-check"
          ? `${calculation.name}: efeito sem ataque`
          : `${calculation.name}: ataque + efeito`,
        calculation.limitValue,
        calculation.limit,
        calculation.detail,
      );
    }
  }

  const closeDefenseToughness = getPotentialMetric(
    sheet,
    (derived) =>
      derived.closeDefense + derived.resistances.toughness,
  );
  const rangedDefenseToughness = getPotentialMetric(
    sheet,
    (derived) =>
      derived.rangedDefense + derived.resistances.toughness,
  );
  const dodgeToughness = getPotentialMetric(
    sheet,
    (derived) =>
      derived.resistances.dodge + derived.resistances.toughness,
  );
  const fortitudeWill = getPotentialMetric(
    sheet,
    (derived) =>
      derived.resistances.fortitude + derived.resistances.will,
  );
  const initiative = getPotentialMetric(
    sheet,
    (derived) => derived.initiative,
  );

  plCheck(
    "close-defense-toughness",
    "Defesa corpo a corpo + Robustez",
    closeDefenseToughness,
    pl * 2,
    "Considera a maior configuração possível dos poderes.",
  );
  plCheck(
    "ranged-defense-toughness",
    "Defesa à distância + Robustez",
    rangedDefenseToughness,
    pl * 2,
    "Considera a maior configuração possível dos poderes.",
  );
  plCheck(
    "dodge-toughness",
    "Esquiva + Robustez",
    dodgeToughness,
    pl * 2,
    "Considera a maior configuração possível dos poderes.",
  );
  plCheck(
    "fortitude-will",
    "Fortitude + Vontade",
    fortitudeWill,
    pl * 2,
    "Considera a maior configuração possível dos poderes.",
  );
  plCheck(
    "initiative",
    "Iniciativa",
    initiative,
    pl * 2,
    "Agilidade + bônus comprado + modificadores de poder.",
  );

  let highestSkill:
    | { skill: SkillEntry; total: number }
    | undefined;
  for (const skill of sheet.skills) {
    const preset = findSkillPreset(skill.name, skill.catalogKey);
    const total = getPotentialMetric(
      sheet,
      (derived) => getSkillTotal(skill, derived, true),
    );
    const unavailable = absentTraits.has(skill.ability);
    if (!unavailable && (!highestSkill || total > highestSkill.total)) {
      highestSkill = { skill, total };
    }
    if (
      unavailable &&
      (finite(skill.rank) !== 0 || finite(skill.specializationRank) !== 0)
    ) {
      add({
        key: `skill-absent-ability-${skill.id}`,
        label: `${skill.name}: atributo ausente`,
        status: "attention",
        group: "data",
        detail: "Testes que exigem um atributo ausente falham automaticamente. As graduações foram preservadas para formas alternativas ou decisões do Narrador.",
      });
    }
    if (
      finite(skill.specializationRank) > 0 &&
      !skill.specialization.trim()
    ) {
      add({
        key: `skill-specialization-${skill.id}`,
        label: `${skill.name}: especialização`,
        status: "attention",
        group: "data",
        detail: "Há graduações especializadas, mas a área estreita não foi identificada.",
      });
    }
    if (
      requiresSpecializedSkillCost(skill.name) &&
      (skill.costClass !== "specialized" || !skill.trainedOnly)
    ) {
      add({
        key: `skill-required-specialization-${skill.id}`,
        label: `${skill.name}: estrutura obrigatória`,
        status: "fail",
        group: "data",
        detail: "Expertise e Atuação são perícias somente treinadas e custam 1 PP por 4 graduações.",
      });
    }
    if (!preset && skill.name.trim()) {
      add({
        key: `skill-custom-${skill.id}`,
        label: `${skill.name}: perícia personalizada`,
        status: "attention",
        group: "data",
        detail:
          "A perícia não está vinculada ao catálogo; confirme o atributo, o custo e a exigência de treinamento com o Narrador.",
      });
    } else if (preset) {
      if (
        skill.costClass !== preset.costClass ||
        skill.trainedOnly !== preset.trainedOnly
      ) {
        add({
          key: `skill-structure-${skill.id}`,
          label: `${skill.name}: custo ou treinamento divergente`,
          status: "fail",
          group: "data",
          detail: `${preset.label} custa ${preset.costClass === "specialized" ? "1 PP por 4 graduações" : "1 PP por 2 graduações"}${preset.trainedOnly ? " e exige treinamento" : ""}.`,
        });
      }
      if (skill.ability !== preset.ability) {
        add({
          key: `skill-ability-${skill.id}`,
          label: `${skill.name}: atributo-base alterado`,
          status: "attention",
          group: "data",
          detail:
            "O atributo-base difere do catálogo. Isso pode ser uma decisão válida do Narrador, mas precisa de conferência.",
        });
      }
    }
    if (
      finite(skill.miscellaneousModifier) !== 0 &&
      !skill.miscellaneousModifierSource.trim()
    ) {
      add({
        key: `skill-modifier-source-${skill.id}`,
        label: `${skill.name}: modificador sem origem`,
        status: "attention",
        group: "data",
        detail:
          "Identifique a vantagem, o poder ou a circunstância que fornece o modificador adicional.",
      });
    }
  }
  plCheck(
    "skill-maximum",
    highestSkill
      ? `Maior perícia: ${highestSkill.skill.name}`
      : "Maior modificador de perícia",
    highestSkill?.total ?? 0,
    pl + 10,
    "Atributo + graduações + especialização + outros modificadores.",
  );

  for (const advantage of sheet.advantages) {
    const preset = findAdvantagePreset(
      advantage.name,
      advantage.catalogKey,
    );
    if (!advantage.name.trim()) {
      add({
        key: `advantage-name-${advantage.id}`,
        label: "Vantagem sem nome",
        status: "attention",
        group: "data",
        detail: "Escolha uma vantagem do catálogo ou descreva uma opção personalizada.",
      });
      continue;
    }
    if (!preset) {
      add({
        key: `advantage-custom-${advantage.id}`,
        label: `${advantage.name}: vantagem personalizada`,
        status: "attention",
        group: "data",
        detail:
          "A vantagem não está vinculada ao catálogo; o custo e as categorias precisam da confirmação do Narrador.",
      });
      continue;
    }
    if ((!preset.ranked && advantage.rank !== 1) ||
      (preset.maxRank !== undefined && advantage.rank > preset.maxRank)) {
      add({
        key: `advantage-rank-${advantage.id}`,
        label: `${advantage.name}: graduação inválida`,
        status: "fail",
        group: "data",
        detail: !preset.ranked
          ? "Esta vantagem não é graduada e deve ter exatamente 1 graduação."
          : `Esta vantagem permite no máximo ${preset.maxRank} ${preset.maxRank === 1 ? "graduação" : "graduações"}.`,
      });
    }
    const actualCategories = [...advantage.categories].sort().join("|");
    const expectedCategories = [...preset.categories].sort().join("|");
    if (
      actualCategories !== expectedCategories ||
      advantage.kind !== preset.kind
    ) {
      add({
        key: `advantage-metadata-${advantage.id}`,
        label: `${advantage.name}: metadados divergentes`,
        status: "fail",
        group: "data",
        detail:
          "As categorias e o custo desta vantagem são fixos; selecione-a novamente no catálogo ou crie uma opção personalizada.",
      });
    }
    if (
      preset.focused &&
      !/[:(]/.test(advantage.name) &&
      !advantage.notes.trim()
    ) {
      add({
        key: `advantage-focus-${advantage.id}`,
        label: `${advantage.name}: foco não definido`,
        status: "attention",
        group: "data",
        detail:
          "Esta vantagem exige um foco. Informe-o após o nome ou no campo de notas.",
      });
    }
  }

  const heroicUses = Math.max(
    0,
    integer(sheet.resources.heroicAdvantageUses),
  );
  plCheck(
    "heroic-uses",
    "Usos de vantagens heroicas",
    heroicUses,
    Math.floor(pl / 2),
    "Este é o total efetivamente usado na aventura, não a quantidade de vantagens possuídas.",
  );
  const heroicCapacity = getHeroicAdvantageCapacity(sheet);
  add({
    key: "heroic-use-capacity",
    label: "Usos heroicos comprados",
    value: heroicUses,
    limit: heroicCapacity,
    status:
      heroicUses <= heroicCapacity ? "pass" : "fail",
    group: "data",
    detail: `${heroicCapacity} ${heroicCapacity === 1 ? "uso disponível" : "usos disponíveis"}, conforme as graduações de vantagens heroicas da ficha.`,
  });

  for (const key of coreAbilityKeys) {
    if (
      !getEffectiveAbsentTraits(sheet).has(key) &&
      finite(sheet.abilities[key]) < -5
    ) {
      add({
        key: `ability-min-${key}`,
        label: `${abilityLabels[key]} abaixo de -5`,
        value: finite(sheet.abilities[key]),
        limit: -5,
        status: "fail",
        group: "data",
        detail: "Atributos não podem ser reduzidos abaixo de -5.",
      });
    }
  }
  for (const key of ["attack", "defense"] as const) {
    if (
      !getEffectiveAbsentTraits(sheet).has(key) &&
      finite(sheet.combat[key]) < -5
    ) {
      add({
        key: `combat-min-${key}`,
        label: `${key === "attack" ? "Ataque" : "Defesa"} abaixo de -5`,
        value: finite(sheet.combat[key]),
        limit: -5,
        status: "fail",
        group: "data",
        detail: "Atributos de combate não podem ser reduzidos abaixo de -5.",
      });
    }
  }
  for (const key of resistanceKeys) {
    const minimum = getMinimumMetric(
      sheet,
      (derived) => derived.resistances[key],
    );
    if (minimum < -5) {
      add({
        key: `resistance-min-${key}`,
        label: `${resistanceLabels[key]} abaixo de -5`,
        value: minimum,
        limit: -5,
        status: "fail",
        group: "data",
        detail: "Resistências não podem ser reduzidas abaixo de -5.",
      });
    }
  }

  if (absentTraits.has("agility") && sheet.combat.initiativeBonus !== 0) {
    add({
      key: "absent-agility-initiative",
      label: "Agilidade ausente com aumento de Iniciativa",
      status: "attention",
      group: "data",
      detail: "Agilidade ausente deixa o personagem Paralisado; o aumento de Iniciativa fica preservado, mas não funciona nesse estado.",
    });
  }
  if (sheet.sizeRank < -5 || sheet.sizeRank > 5) {
    add({
      key: "size-outside-published-table",
      label: "Tamanho fora da tabela publicada",
      status: "attention",
      group: "data",
      detail: "A prévia fornecida publica espaço e alcance apenas entre tamanho -5 e 5. O valor foi preservado sem inventar medidas; registre a decisão do Narrador.",
    });
  }

  const numericIssues: string[] = [];
  const requireInteger = (
    value: number,
    label: string,
    minimum?: number,
  ) => {
    if (!Number.isSafeInteger(value)) {
      numericIssues.push(`${label} deve ser inteiro`);
    } else if (minimum !== undefined && value < minimum) {
      numericIssues.push(`${label} não pode ser menor que ${minimum}`);
    }
  };

  requireInteger(sheet.powerLevel, "Nível de Poder", 0);
  requireInteger(sheet.sizeRank, "Tamanho");
  if (sheet.budgetMode === "custom") {
    requireInteger(sheet.customPointBudget, "Orçamento personalizado", 0);
  }
  for (const key of coreAbilityKeys) {
    requireInteger(sheet.abilities[key], abilityLabels[key]);
  }
  requireInteger(sheet.combat.attack, "Ataque");
  requireInteger(sheet.combat.defense, "Defesa");
  requireInteger(sheet.combat.closeAttack, "Ataque Corpo a Corpo", 0);
  requireInteger(sheet.combat.rangedAttack, "Ataque à Distância", 0);
  requireInteger(sheet.combat.closeDefense, "Defesa Corpo a Corpo", 0);
  requireInteger(sheet.combat.rangedDefense, "Defesa à Distância", 0);
  requireInteger(sheet.combat.initiativeBonus, "Aumento de Iniciativa", 0);
  for (const key of resistanceKeys) {
    requireInteger(
      sheet.resistanceAdjustments[key],
      `Ajuste de ${resistanceLabels[key]}`,
    );
  }
  for (const skill of sheet.skills) {
    requireInteger(skill.rank, `${skill.name}: graduações`, 0);
    requireInteger(
      skill.specializationRank,
      `${skill.name}: graduações especializadas`,
      0,
    );
    requireInteger(
      skill.miscellaneousModifier,
      `${skill.name}: outros modificadores`,
    );
  }
  for (const advantage of sheet.advantages) {
    requireInteger(
      advantage.rank,
      `${advantage.name || "Vantagem"}: graduação`,
      1,
    );
  }
  for (const specialization of sheet.attackSpecializations) {
    requireInteger(
      specialization.rank,
      `${specialization.name || "Especialização de ataque"}: graduação`,
      0,
    );
  }
  for (const power of sheet.powers) {
    requireInteger(
      power.wideRanks,
      `${power.name || "Poder"}: Matriz Ampla`,
      0,
    );
    for (const effect of power.effects) {
      const effectLabel = effect.name || power.name || "Efeito";
      requireInteger(effect.rank, `${effectLabel}: graduação`, 0);
      if (
        effect.costMode === "structured" &&
        getEffectCostBreakdown(effect).total === 0
      ) {
        numericIssues.push(
          `${effectLabel}: use ao menos 1 graduação ou um custo fixo estruturado`,
        );
      }
      requireInteger(effect.baseCost, `${effectLabel}: custo-base`, 0);
      if (effect.costMode === "legacy") {
        requireInteger(
          effect.legacyCost,
          `${effectLabel}: custo legado`,
          0,
        );
      }
      for (const modifier of [...effect.extras, ...effect.flaws]) {
        requireInteger(
          modifier.value,
          `${effectLabel}: magnitude de ${modifier.name || "modificador"}`,
          0,
        );
        requireInteger(
          modifier.ranksApplied,
          `${effectLabel}: graduações de ${modifier.name || "modificador"}`,
          0,
        );
      }
      for (const modifier of [...effect.features, ...effect.drawbacks]) {
        requireInteger(
          modifier.rank,
          `${effectLabel}: graduação de ${modifier.name || "modificador fixo"}`,
          0,
        );
      }
      for (const link of effect.traitLinks) {
        requireInteger(
          link.value,
          `${effectLabel}: vínculo de ${link.trait}`,
        );
      }
    }
  }
  for (const attack of sheet.attacks) {
    requireInteger(
      attack.effectRank,
      `${attack.name || "Ataque"}: graduação do efeito`,
      0,
    );
    requireInteger(
      attack.miscellaneousAttackBonus,
      `${attack.name || "Ataque"}: outro bônus`,
    );
  }
  for (const item of sheet.equipment) {
    requireInteger(
      item.cost,
      `${item.name || "Equipamento"}: custo em PE`,
      0,
    );
  }
  requireInteger(sheet.resources.heroPoints, "Pontos Heroicos", 0);
  requireInteger(
    sheet.resources.heroicAdvantageUses,
    "Usos de vantagens heroicas",
    0,
  );
  requireInteger(sheet.resources.luckCurrent, "Sorte atual", 0);
  requireInteger(sheet.resources.luckMax, "Sorte máxima", 0);
  requireInteger(
    sheet.otherPointAdjustment.value,
    "Ajuste excepcional de PP",
  );
  const luckCapacity = getLuckCapacity(sheet);
  if (sheet.resources.luckCurrent > luckCapacity) {
    numericIssues.push(
      `Sorte atual não pode exceder ${luckCapacity}, total calculado pela vantagem Sorte`,
    );
  }
  if (numericIssues.length) {
    const visibleIssues = numericIssues.slice(0, 8);
    add({
      key: "numeric-integrity",
      label: "Valores fora das faixas permitidas",
      status: "fail",
      group: "data",
      detail: `${visibleIssues.join("; ")}${numericIssues.length > visibleIssues.length ? `; e mais ${numericIssues.length - visibleIssues.length}` : ""}.`,
    });
  }

  const breakdown = getPointBreakdown(sheet);
  const budget = getPointBudget(sheet);
  add({
    key: "point-budget",
    label: "Pontos de Poder",
    value: breakdown.total,
    limit: budget,
    status: npc ? "info" : breakdown.total <= budget ? "pass" : "fail",
    group: "points",
    detail: npc
      ? "NPCs podem ser construídos com quantos PP o Narrador desejar."
      : `${breakdown.total} de ${budget} PP usados.`,
  });

  if (finite(sheet.otherPointAdjustment.value) !== 0) {
    const adjustmentReason = sheet.otherPointAdjustment.reason.trim();
    add({
      key: "point-adjustment-reason",
      label: adjustmentReason
        ? "Ajuste manual de PP requer validação"
        : "Ajuste manual de PP sem justificativa",
      status: "attention",
      group: "data",
      detail: adjustmentReason
        ? `Regra informada: ${adjustmentReason}. O Narrador deve confirmar este valor excepcional.`
        : "Documente a regra, permissão do Narrador ou correção coberta pelo ajuste.",
    });
  }

  const equipmentUsed = sheet.equipment.reduce(
    (total, item) => total + Math.max(0, finite(item.cost)),
    0,
  );
  const equipmentAllowance = sheet.advantages.reduce(
    (total, advantage) =>
      total +
      (advantage.kind === "equipment"
        ? Math.max(0, integer(advantage.rank)) * 5
        : 0),
    0,
  );
  add({
    key: "equipment-points",
    label: "Pontos de Equipamento",
    value: equipmentUsed,
    limit: equipmentAllowance,
    status:
      equipmentUsed <= equipmentAllowance ? "pass" : "fail",
    group: "equipment",
    detail: `Limite de ${equipmentAllowance} PE pela vantagem Equipamento; uso atual de ${equipmentUsed} PE.`,
  });

  for (const item of sheet.equipment) {
    const preset = findEquipmentPreset(item.name, item.catalogKey);
    if (!item.name.trim()) {
      add({
        key: `equipment-name-${item.id}`,
        label: "Equipamento sem nome",
        status: "attention",
        group: "equipment",
        detail:
          "Escolha um item do catálogo ou descreva um equipamento personalizado.",
      });
      continue;
    }
    if (!preset) {
      add({
        key: `equipment-custom-${item.id}`,
        label: `${item.name}: equipamento personalizado`,
        status: "attention",
        group: "equipment",
        detail:
          "O item não está vinculado ao catálogo; custo e efeitos precisam de confirmação do Narrador.",
      });
    } else if (!preset.variableCost && item.cost !== preset.cost) {
      add({
        key: `equipment-cost-${item.id}`,
        label: `${item.name}: custo alterado`,
        status: "attention",
        group: "equipment",
        detail: `O catálogo indica ${preset.cost} PE; o valor manual de ${item.cost} PE permanece salvo, mas requer conferência.`,
      });
    }
  }

  const motivation = getMotivationState(sheet);
  add({
    key: "required-motivation",
    label: "Motivação do personagem",
    status: npc
      ? "info"
      : motivation.complete
        ? "pass"
        : motivation.present
          ? "attention"
          : "fail",
    group: "data",
    detail: npc
      ? "Para NPCs, a motivação é uma referência narrativa opcional."
      : motivation.complete
        ? motivation.source === "identity"
          ? "A motivação está registrada em Personalidade e motivação."
          : "A motivação está identificada e descrita."
        : motivation.present
          ? "A motivação já foi identificada; acrescente uma descrição para deixá-la pronta para a mesa."
          : "Registre uma motivação em Personalidade e motivação ou na seção Complicações.",
  });

  for (const complication of sheet.complications) {
    if (!complication.name.trim() || !complication.description.trim()) {
      if (isMotivationComplication(complication)) {
        continue;
      }
      add({
        key: `complication-incomplete-${complication.id}`,
        label: `${complication.name || "Complicação"}: descrição incompleta`,
        status: "attention",
        group: "data",
        detail:
          "Explique quando a complicação cria um desafio para que ela seja útil ao Narrador.",
      });
    }
  }

  const portfolio = getPowerPortfolio(sheet);
  for (const array of portfolio.arrays) {
    add({
      key: `array-${array.key}`,
      label: `Matriz: ${array.name}`,
      value: array.total,
      status: array.valid ? "pass" : "fail",
      group: "powers",
      detail: array.valid
        ? `Base ${array.baseConfigurationCost} PP + ${array.featureCost} PP em recursos da matriz${array.removableDiscount ? ` - ${array.removableDiscount} PP por Removível` : ""}.`
        : array.issues.join(" "),
    });
  }

  for (const power of sheet.powers) {
    if (power.arrayRole !== "none" && !power.arrayName.trim()) {
      add({
        key: `array-name-${power.id}`,
        label: `${power.name || "Poder"}: matriz sem nome`,
        status: "fail",
        group: "powers",
        detail: "Configurações-base e efeitos alternativos precisam indicar a mesma matriz.",
      });
    }
    if (power.arrayRole === "none" && power.arrayName.trim()) {
      add({
        key: `array-orphan-name-${power.id}`,
        label: `${power.name || "Poder"}: nome de matriz sem função`,
        status: "attention",
        group: "powers",
        detail: "Selecione uma função na matriz ou remova o nome que ficou sem vínculo.",
      });
    }
    if (
      power.arrayRole !== "base" &&
      (power.baseDynamic || power.wideRanks > 0)
    ) {
      add({
        key: `array-base-options-${power.id}`,
        label: `${power.name || "Poder"}: opções exclusivas da base`,
        status: "fail",
        group: "powers",
        detail: "Base Dinâmica e Matriz Ampla só podem ser configuradas na configuração-base.",
      });
    }
    if (!power.effects.length) {
      add({
        key: `power-empty-${power.id}`,
        label: power.name || "Poder sem efeitos",
        status: "attention",
        group: "powers",
        detail: "Adicione ao menos um efeito para calcular o poder.",
      });
    }
    for (const effect of power.effects) {
      const cost = getEffectCostBreakdown(effect);
      if (!cost.complete) {
        add({
          key: `power-legacy-${effect.id}`,
          label: `${power.name || "Poder"}: custo legado`,
          value: cost.total,
          status: "attention",
          group: "powers",
          detail: "O total foi preservado, mas falta estruturar custo-base, extras, falhas, recursos e desvantagens para auditá-lo.",
        });
        continue;
      }

      const configuration = effect.configurationKey
        ? findPowerConfigurationPreset(
            effect.name,
            effect.configurationKey,
          )
        : undefined;
      const preset = findPowerEffectPreset(
        effect.name,
        effect.catalogKey,
      );
      const effectLabel = effect.name || power.name || "Efeito";
      if (!effect.name.trim()) {
        add({
          key: `power-name-${effect.id}`,
          label: `${power.name || "Poder"}: efeito sem nome`,
          status: "attention",
          group: "powers",
          detail:
            "Escolha um efeito do catálogo ou identifique e documente um efeito personalizado.",
        });
      } else if (configuration) {
        const matches = powerConfigurationMatches(
          effect,
          configuration,
        );
        const needsChoice =
          configuration.requiresChoice ||
          effect.resistance.startsWith("Escolha");
        add({
          key: `power-configuration-${effect.id}`,
          label: `${effectLabel}: configuração pronta`,
          status: !matches || needsChoice ? "attention" : "pass",
          group: "powers",
          detail: !matches
            ? "A configuração foi alterada. O total continua calculado, mas os parâmetros diferem do modelo escolhido."
            : needsChoice
              ? "A fórmula está aplicada; complete as escolhas indicadas para concluir a configuração."
              : "Fórmula, parâmetros e vínculos correspondem à configuração escolhida.",
        });
      } else if (!preset) {
        add({
          key: `power-custom-${effect.id}`,
          label: `${effectLabel}: efeito personalizado`,
          status: "attention",
          group: "powers",
          detail:
            "O efeito não está vinculado ao catálogo; os parâmetros e o custo-base precisam da confirmação do Narrador.",
        });
      } else {
        const minimum = preset.minBaseCost ?? preset.baseCost;
        const maximum = preset.maxBaseCost ?? preset.baseCost;
        if (
          effect.baseCost < minimum ||
          effect.baseCost > maximum
        ) {
          add({
            key: `power-base-cost-${effect.id}`,
            label: `${effectLabel}: custo-base inválido`,
            status: "fail",
            group: "powers",
            detail:
              maximum === minimum
                ? `O custo-base de ${preset.label} é ${preset.baseCost} PP por graduação.`
                : `O custo-base de ${preset.label} deve ficar entre ${minimum} e ${maximum} PP por graduação, conforme a configuração.`,
          });
        }

        const changedParameters: string[] = [];
        if (
          effect.action !== preset.action &&
          !effectHasParameterModifier(effect, "action")
        ) {
          changedParameters.push("ação");
        }
        if (
          effect.range !== preset.range &&
          !effectHasParameterModifier(effect, "range")
        ) {
          changedParameters.push("alcance");
        }
        if (
          effect.duration !== preset.duration &&
          !effectHasParameterModifier(effect, "duration")
        ) {
          changedParameters.push("duração");
        }
        if (changedParameters.length) {
          add({
            key: `power-parameters-${effect.id}`,
            label: `${effectLabel}: parâmetros personalizados`,
            status: "attention",
            group: "powers",
            detail: `Parâmetros alterados: ${changedParameters.join(", ")}. Não há um modificador reconhecido que explique a mudança.`,
          });
        }
        if (
          effect.isAttack !== preset.isAttack ||
          (effect.isAttack &&
            effect.requiresAttackCheck !== preset.requiresAttackCheck &&
            !effectHasParameterModifier(effect, "attack"))
        ) {
          add({
            key: `power-attack-mode-${effect.id}`,
            label: `${effectLabel}: modo ofensivo alterado`,
            status: "attention",
            group: "powers",
            detail:
              "A aplicação dos limites de ataque difere do padrão do catálogo; confira modificadores e a decisão do Narrador.",
          });
        }
        if (
          preset.resistance.startsWith("Escolha") &&
          (!effect.resistance.trim() ||
            effect.resistance.startsWith("Escolha"))
        ) {
          add({
            key: `power-resistance-${effect.id}`,
            label: `${effectLabel}: resistência não configurada`,
            status: "attention",
            group: "powers",
            detail:
              "Escolha a resistência usada contra o efeito para concluir a configuração.",
          });
        }
        if (
          (preset.id === "enhanced-strength" ||
            preset.id === "enhanced-resistance" ||
            preset.id === "enhanced-trait") &&
          !effect.traitLinks.length
        ) {
          add({
            key: `power-trait-link-${effect.id}`,
            label: `${effectLabel}: traço ainda não vinculado`,
            status: "attention",
            group: "powers",
            detail:
              "Vincule o traço aumentado para que todas as dependências sejam recalculadas.",
          });
        }
        const referenceLinks = effect.traitLinks.filter(
          (link) => link.mode === "reference",
        );
        const modifierOnlyResistance =
          preset.id === "enhanced-resistance" && effect.baseCost === 0;
        if (modifierOnlyResistance) {
          const invalidLinks = effect.traitLinks.filter(
            (link) =>
              link.mode !== "reference" ||
              !resistanceKeys.includes(
                link.trait as (typeof resistanceKeys)[number],
              ),
          );
          if (!referenceLinks.length || invalidLinks.length) {
            add({
              key: `power-resistance-reference-${effect.id}`,
              label: `${effectLabel}: alvo do modificador inválido`,
              status: "fail",
              group: "powers",
              detail:
                "Com custo-base 0, Resistência Aprimorada deve apenas referenciar Esquiva, Fortitude, Robustez ou Vontade já comprada.",
            });
          }
          if (!effect.extras.some((modifier) => modifier.value > 0)) {
            add({
              key: `power-resistance-modifier-${effect.id}`,
              label: `${effectLabel}: modificador não escolhido`,
              status: "attention",
              group: "powers",
              detail:
                "Escolha Aprimorada, Impenetrável ou outro extra aplicável às graduações de resistência existentes.",
            });
          }
        } else if (referenceLinks.length) {
          add({
            key: `power-reference-cost-${effect.id}`,
            label: `${effectLabel}: vínculo incompatível com o custo-base`,
            status: "fail",
            group: "powers",
            detail:
              "O modo de referência é exclusivo para modificadores aplicados a resistências existentes com custo-base 0.",
          });
        }
      }

      const unknownModifiers = configuration ? [] : [
        ...effect.extras
          .filter((entry) => !findRankedModifierPreset(entry.name, "extra"))
          .map((entry) => entry.name || "extra sem nome"),
        ...effect.flaws
          .filter((entry) => !findRankedModifierPreset(entry.name, "flaw"))
          .map((entry) => entry.name || "falha sem nome"),
        ...effect.features
          .filter((entry) => !findFlatModifierPreset(entry.name, "feature"))
          .map((entry) => entry.name || "recurso sem nome"),
        ...effect.drawbacks
          .filter((entry) => !findFlatModifierPreset(entry.name, "drawback"))
          .map((entry) => entry.name || "desvantagem sem nome"),
      ];
      if (unknownModifiers.length) {
        add({
          key: `power-custom-modifiers-${effect.id}`,
          label: `${effectLabel}: modificadores personalizados`,
          status: "attention",
          group: "powers",
          detail: `Confirme com o Narrador: ${unknownModifiers.slice(0, 4).join(", ")}${unknownModifiers.length > 4 ? " e outros" : ""}.`,
        });
      }
    }
  }

  for (const attack of sheet.attacks) {
    if (
      attack.miscellaneousAttackBonus !== 0 &&
      !attack.miscellaneousAttackSource.trim()
    ) {
      add({
        key: `attack-misc-${attack.id}`,
        label: `${attack.name || "Ataque"}: bônus sem origem`,
        status: "attention",
        group: "data",
        detail: "Identifique a vantagem, poder ou circunstância que fornece o modificador adicional.",
      });
    }
    if (
      !attack.sourceEffectId &&
      !attack.sourceEquipmentId &&
      attack.effectRank > 0 &&
      attack.manualEffectSource === "other" &&
      !attack.manualEffectSourceNote.trim()
    ) {
      add({
        key: `attack-effect-source-${attack.id}`,
        label: `${attack.name || "Ataque"}: efeito sem origem`,
        status: "attention",
        group: "data",
        detail: "Vincule um poder ou identifique onde o custo da graduação de efeito foi pago.",
      });
    }
  }

  for (const [key, powers] of groupArrayPowers(sheet)) {
    const active = powers.filter((power) => power.active);
    const concurrent = active.every(
      (power) =>
        power.arrayRole === "dynamic" ||
        (power.arrayRole === "base" && power.baseDynamic),
    );
    if (active.length > 1 && !concurrent) {
      add({
        key: `array-active-${key}`,
        label: `Matriz ${powers[0]?.arrayName}: configurações ativas`,
        status: "fail",
        group: "powers",
        detail: "Efeitos alternativos não dinâmicos são mutuamente exclusivos.",
      });
    }
    if (
      powers.some(
        (power) =>
          (power.arrayRole === "dynamic" || power.baseDynamic) &&
          power.effects.some((effect) => effect.traitLinks.length > 0),
      )
    ) {
      add({
        key: `array-dynamic-traits-${key}`,
        label: `Matriz ${powers[0]?.arrayName}: alocação dinâmica`,
        status: "attention",
        group: "powers",
        detail: "Vínculos de traços em configurações dinâmicas dependem dos PP alocados no turno; confira cada distribuição usada.",
      });
    }
  }

  const reviewedChecks = checks.map((check): RuleCheck => {
    if (check.status !== "attention") return check;

    const reviewFingerprint = getRuleReviewFingerprint(check);
    const storedDecision = sheet.auditDecisions?.[check.key];
    const reviewDecision =
      storedDecision?.fingerprint === reviewFingerprint
        ? storedDecision.decision
        : "pending";
    const status: RuleStatus =
      reviewDecision === "approved"
        ? "pass"
        : reviewDecision === "rejected"
          ? "fail"
          : "attention";

    return {
      ...check,
      status,
      valid: status === "pass",
      baseStatus: "attention",
      reviewDecision,
      reviewFingerprint,
    };
  });
  const failures = reviewedChecks.filter(
    (check) => check.status === "fail",
  ).length;
  const attentions = reviewedChecks.filter(
    (check) => check.status === "attention",
  ).length;
  const approvals = reviewedChecks.filter(
    (check) => check.reviewDecision === "approved",
  ).length;
  const rejections = reviewedChecks.filter(
    (check) => check.reviewDecision === "rejected",
  ).length;
  const status: RuleStatus = failures
    ? "fail"
    : attentions
      ? "attention"
      : npc
        ? "info"
        : "pass";
  return {
    status,
    checks: reviewedChecks,
    failures,
    attentions,
    approvals,
    rejections,
  };
}

export function getPlChecks(sheet: CharacterSheet) {
  return getRuleAudit(sheet).checks.filter(
    (check) => check.group === "pl",
  );
}

export function getEquipmentTotals(sheet: CharacterSheet) {
  const used = sheet.equipment.reduce(
    (total, item) => total + Math.max(0, finite(item.cost)),
    0,
  );
  const allowance = sheet.advantages.reduce(
    (total, advantage) =>
      total +
      (advantage.kind === "equipment"
        ? Math.max(0, integer(advantage.rank)) * 5
        : 0),
    0,
  );
  return { used, allowance, remaining: allowance - used };
}

export function getHeroicAdvantageCapacity(sheet: CharacterSheet) {
  return sheet.advantages.reduce(
    (total, advantage) =>
      total +
      (advantage.categories.includes("Heroica")
        ? Math.max(0, integer(advantage.rank))
        : 0),
    0,
  );
}

export function getLuckCapacity(sheet: CharacterSheet) {
  return sheet.advantages.reduce((total, advantage) => {
    const preset = findAdvantagePreset(
      advantage.name,
      advantage.catalogKey,
    );
    return total +
      (preset?.id === "luck"
        ? Math.max(0, integer(advantage.rank))
        : 0);
  }, 0);
}

export function getPowerEntryCost(
  sheet: CharacterSheet,
  powerId: string,
) {
  return getPowerPortfolio(sheet).entries.find(
    (entry) => entry.powerId === powerId,
  );
}

export function getPowerEffectOptions(sheet: CharacterSheet) {
  return sheet.powers.flatMap((power) =>
    power.effects.map((effect) => ({
      id: effect.id,
      label: `${power.name || "Poder"} · ${effect.name || "Efeito"}`,
      power,
      effect,
    })),
  );
}

export function createSummary(sheet: CharacterSheet): SheetSummary {
  const derived = getDerivedTraits(sheet);
  return {
    id: sheet.id,
    heroName: sheet.heroName,
    civilName: sheet.civilName,
    concept: sheet.concept,
    powerLevel: sheet.powerLevel,
    pointsTotal: getPointBudget(sheet),
    pointsSpent: pointsSpent(sheet),
    imageUrl: sheet.imageUrl,
    accent: sheet.accent,
    abilities: derived.abilities,
    combat: {
      attack: derived.attack,
      defense: derived.defense,
    },
    resistances: derived.resistances,
    auditStatus: getRuleAudit(sheet).status,
    shareEnabled: sheet.shareEnabled,
    shareToken: sheet.shareToken,
    updatedAt: sheet.updatedAt,
  };
}

function getActivePowerBonuses(
  sheet: CharacterSheet,
): Record<TraitKey, number> {
  const bonuses = emptyTraitBonuses();
  for (const power of sheet.powers) {
    if (!power.active) continue;
    for (const effect of power.effects) {
      for (const link of effect.traitLinks) {
        if (link.mode === "reference") continue;
        bonuses[link.trait] +=
          link.mode === "per-rank"
            ? finite(effect.rank) * finite(link.value)
            : finite(link.value);
      }
    }
  }
  return bonuses;
}

function getAdvantageBonuses(
  sheet: CharacterSheet,
): Record<TraitKey, number> {
  const bonuses = emptyTraitBonuses();
  for (const advantage of sheet.advantages) {
    const preset = findAdvantagePreset(
      advantage.name,
      advantage.catalogKey,
    );
    if (preset?.id === "defensive-roll") {
      bonuses.toughness += Math.max(0, integer(advantage.rank));
    }
  }
  return bonuses;
}

function getEquipmentBonuses(
  sheet: CharacterSheet,
): Record<TraitKey, number> {
  const bonuses = emptyTraitBonuses();
  for (const item of sheet.equipment) {
    if (!item.active) continue;
    const preset = findEquipmentPreset(item.name, item.catalogKey);
    if (!preset?.traitBonuses) continue;
    bonuses.defense += finite(preset.traitBonuses.defense ?? 0);
    bonuses.dodge += finite(preset.traitBonuses.dodge ?? 0);
    bonuses.toughness += finite(preset.traitBonuses.toughness ?? 0);
  }
  return bonuses;
}

function getPotentialMetric(
  sheet: CharacterSheet,
  selector: (derived: DerivedTraits) => number,
) {
  return getDerivedScenario(sheet, selector, "max").value;
}

function getMinimumMetric(
  sheet: CharacterSheet,
  selector: (derived: DerivedTraits) => number,
) {
  return getDerivedScenario(sheet, selector, "min").value;
}

function getDerivedScenario(
  sheet: CharacterSheet,
  selector: (derived: DerivedTraits) => number,
  mode: "max" | "min",
  requiredPowerId?: string,
) {
  const groups = groupArrayPowers(sheet);
  const arrayIds = new Set(
    [...groups.values()].flatMap((powers) =>
      powers.map((power) => power.id),
    ),
  );
  const requiredPower = requiredPowerId
    ? sheet.powers.find((power) => power.id === requiredPowerId)
    : undefined;
  const requiredGroupKey =
    requiredPower &&
    requiredPower.arrayRole !== "none" &&
    requiredPower.arrayName.trim()
      ? normalizeName(requiredPower.arrayName)
      : "";
  const selectedIds = new Set<string>();
  if (requiredGroupKey && requiredPower) {
    selectedIds.add(requiredPower.id);
  }
  const baselineSheet = {
    ...sheet,
    powers: sheet.powers.map((power) => ({
      ...power,
      active: arrayIds.has(power.id)
        ? selectedIds.has(power.id)
        : true,
    })),
  };
  const baselineDerived = getDerivedTraits(baselineSheet);
  const baseline = selector(baselineDerived);

  for (const [groupKey, powers] of groups) {
    if (groupKey === requiredGroupKey) continue;
    const groupIds = new Set(powers.map((power) => power.id));
    let selectedPowerId = "";
    let selectedValue = baseline;
    for (const candidate of powers) {
      const candidateValue = selector(
        getDerivedTraits({
          ...baselineSheet,
          powers: baselineSheet.powers.map((power) => ({
            ...power,
            active: groupIds.has(power.id)
              ? power.id === candidate.id
              : power.active,
          })),
        }),
      );
      if (
        (mode === "max" && candidateValue > selectedValue) ||
        (mode === "min" && candidateValue < selectedValue)
      ) {
        selectedValue = candidateValue;
        selectedPowerId = candidate.id;
      }
    }
    if (selectedPowerId) selectedIds.add(selectedPowerId);
  }

  const finalSheet = {
    ...sheet,
    powers: sheet.powers.map((power) => ({
      ...power,
      active: arrayIds.has(power.id)
        ? selectedIds.has(power.id)
        : true,
    })),
  };
  const derived = getDerivedTraits(finalSheet);
  return { derived, value: selector(derived) };
}

function groupArrayPowers(sheet: CharacterSheet) {
  const groups = new Map<string, PowerEntry[]>();
  for (const power of sheet.powers) {
    const key = normalizeName(power.arrayName);
    if (!key || power.arrayRole === "none") continue;
    groups.set(key, [...(groups.get(key) ?? []), power]);
  }
  return groups;
}

function findPowerEffect(sheet: CharacterSheet, effectId: string) {
  if (!effectId) return null;
  for (const power of sheet.powers) {
    const effect = power.effects.find((entry) => entry.id === effectId);
    if (effect) return { power, effect };
  }
  return null;
}

function findEquipmentAttack(
  sheet: CharacterSheet,
  equipmentId: string,
) {
  if (!equipmentId) return null;
  const item = sheet.equipment.find((entry) => entry.id === equipmentId);
  if (!item) return null;
  const preset = findEquipmentPreset(item.name, item.catalogKey);
  if (!preset?.attack) return null;
  return { item, preset };
}

function getPowerAccuracyModifier(effect: PowerEffectEntry) {
  const accurate = effect.features.reduce(
    (total, feature) =>
      total +
      (feature.rule === "accurate"
        ? Math.max(0, integer(feature.rank)) * 2
        : 0),
    0,
  );
  const inaccurate = effect.drawbacks.reduce(
    (total, drawback) =>
      total +
      (drawback.rule === "inaccurate"
        ? Math.max(0, integer(drawback.rank)) * 2
        : 0),
    0,
  );
  return accurate - inaccurate;
}

function powerConfigurationMatches(
  effect: PowerEffectEntry,
  preset: PowerConfigurationPreset,
) {
  const expected = applyPowerConfigurationPreset(preset);
  if (preset.totalCost === undefined) {
    expected.rank = effect.rank;
  }
  const rankedSignature = (
    items: PowerEffectEntry["extras"] | PowerEffectEntry["flaws"],
  ) =>
    items
      .map((item) => [
        normalizeName(item.name),
        finite(item.value),
        finite(item.ranksApplied),
      ])
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  const flatSignature = (
    items: PowerEffectEntry["features"] | PowerEffectEntry["drawbacks"],
  ) =>
    items
      .map((item) => [
        normalizeName(item.name),
        finite(item.rank),
        item.rule,
      ])
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  const linkSignature = (items: PowerEffectEntry["traitLinks"]) =>
    items
      .map((item) => [item.trait, item.mode, finite(item.value)])
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  const actualSignature = {
    name: normalizeName(effect.name),
    rank: finite(effect.rank),
    baseCost: finite(effect.baseCost),
    action: normalizeName(effect.action),
    range: normalizeName(effect.range),
    duration: normalizeName(effect.duration),
    check: normalizeName(effect.check),
    resistance: normalizeName(effect.resistance),
    isAttack: effect.isAttack,
    requiresAttackCheck: effect.requiresAttackCheck,
    attackRange: effect.attackRange,
    strengthBased: effect.strengthBased,
    extras: rankedSignature(effect.extras),
    flaws: rankedSignature(effect.flaws),
    features: flatSignature(effect.features),
    drawbacks: flatSignature(effect.drawbacks),
    traitLinks: linkSignature(effect.traitLinks),
  };
  const expectedSignature = {
    name: normalizeName(expected.name),
    rank: finite(expected.rank),
    baseCost: finite(expected.baseCost),
    action: normalizeName(expected.action),
    range: normalizeName(expected.range),
    duration: normalizeName(expected.duration),
    check: normalizeName(expected.check),
    resistance: normalizeName(expected.resistance),
    isAttack: expected.isAttack,
    requiresAttackCheck: expected.requiresAttackCheck,
    attackRange: expected.attackRange,
    strengthBased: expected.strengthBased,
    extras: rankedSignature(expected.extras),
    flaws: rankedSignature(expected.flaws),
    features: flatSignature(expected.features),
    drawbacks: flatSignature(expected.drawbacks),
    traitLinks: linkSignature(expected.traitLinks),
  };
  return JSON.stringify(actualSignature) === JSON.stringify(expectedSignature);
}

function effectHasParameterModifier(
  effect: PowerEffectEntry,
  parameter: "action" | "range" | "duration" | "attack",
) {
  const extras = new Set(
    effect.extras
      .map((entry) => findRankedModifierPreset(entry.name, "extra")?.id)
      .filter(Boolean),
  );
  const flaws = new Set(
    effect.flaws
      .map((entry) => findRankedModifierPreset(entry.name, "flaw")?.id)
      .filter(Boolean),
  );
  const features = new Set(
    effect.features
      .map((entry) => findFlatModifierPreset(entry.name, "feature")?.id)
      .filter(Boolean),
  );
  if (parameter === "action") {
    return flaws.has("increased-action") || features.has("reaction");
  }
  if (parameter === "range") {
    return (
      extras.has("increased-range") ||
      extras.has("affects-others") ||
      extras.has("throw") ||
      flaws.has("decreased-range") ||
      features.has("reach")
    );
  }
  if (parameter === "duration") {
    return (
      extras.has("increased-duration") ||
      extras.has("permanent") ||
      extras.has("sustained") ||
      flaws.has("decreased-duration") ||
      flaws.has("independent")
    );
  }
  return (
    extras.has("area-effect") ||
    extras.has("increased-range") ||
    flaws.has("decreased-range") ||
    flaws.has("grab-based") ||
    flaws.has("sense-dependent")
  );
}

function getRemovableDiscount(
  cost: number,
  removable: PowerEntry["removable"],
) {
  if (!cost || removable === "none") return 0;
  const factor =
    removable === "removable"
      ? 1
      : removable === "easily-removable"
        ? 2
        : 4;
  return Math.ceil(cost / 5) * factor;
}

function modifierApplies(
  ranksApplied: number,
  currentRank: number,
  totalRanks: number,
) {
  const applied = integer(ranksApplied);
  return applied <= 0 || currentRank <= Math.min(applied, totalRanks);
}

function finite(value: number) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function integer(value: number) {
  return Math.trunc(finite(value));
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value);
}
