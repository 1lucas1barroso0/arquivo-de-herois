import {
  newId,
  type CharacterSheet,
} from "./character";
import {
  findAdvantagePreset,
  findEquipmentPreset,
  findSkillPreset,
} from "./catalog";
import {
  getHeroicAdvantageCapacity,
  getLuckCapacity,
} from "./rules";

export type EditingMode = "quick" | "guided" | "free";

export const EDITING_MODE_KEY = "arquivo-de-herois:modo-de-edicao:v2";
export const LEGACY_EDITING_MODE_KEY = "mm4e-editing-mode:v1";

export type GuidedAutomationResult = {
  sheet: CharacterSheet;
  changes: string[];
};

/**
 * Applies only deterministic rules. It never chooses powers, spends leftover
 * PP, rewrites prose, or removes custom content on the user's behalf.
 */
export function applyGuidedAutomation(
  input: CharacterSheet,
): GuidedAutomationResult {
  const changes = new Set<string>();

  const skills = input.skills.map((skill) => {
    const preset = findSkillPreset(skill.name, skill.catalogKey);
    const rank = nonNegativeInteger(skill.rank);
    const specializationRank = nonNegativeInteger(
      skill.specializationRank,
    );
    const miscellaneousModifier = integer(skill.miscellaneousModifier);
    const normalized = {
      ...skill,
      ability: preset?.ability ?? skill.ability,
      costClass: preset?.costClass ?? skill.costClass,
      trainedOnly: preset?.trainedOnly ?? skill.trainedOnly,
      rank,
      specializationRank,
      miscellaneousModifier,
    };
    if (
      normalized.ability !== skill.ability ||
      normalized.costClass !== skill.costClass ||
      normalized.trainedOnly !== skill.trainedOnly ||
      normalized.rank !== skill.rank ||
      normalized.specializationRank !== skill.specializationRank ||
      normalized.miscellaneousModifier !== skill.miscellaneousModifier
    ) {
      changes.add("As perícias do catálogo foram ajustadas às regras correspondentes.");
    }
    return normalized;
  });

  let advantages = input.advantages.map((advantage) => {
    const preset = findAdvantagePreset(
      advantage.name,
      advantage.catalogKey,
    );
    if (!preset) return advantage;
    const maximum = preset.maxRank ?? Number.POSITIVE_INFINITY;
    const rank = preset.ranked
      ? Math.min(maximum, Math.max(1, integer(advantage.rank)))
      : 1;
    const normalized = {
      ...advantage,
      rank,
      categories: [...preset.categories],
      kind: preset.kind,
    };
    if (
      normalized.rank !== advantage.rank ||
      normalized.kind !== advantage.kind ||
      normalized.categories.join("|") !==
        advantage.categories.join("|")
    ) {
      changes.add("Os limites das vantagens do catálogo foram restaurados.");
    }
    return normalized;
  });

  const equipment = input.equipment.map((item) => {
    const preset = findEquipmentPreset(item.name, item.catalogKey);
    if (!preset || preset.variableCost) {
      return { ...item, cost: nonNegativeInteger(item.cost) };
    }
    if (item.cost !== preset.cost) {
      changes.add("Custos fixos de equipamento foram restaurados.");
    }
    return { ...item, cost: preset.cost };
  });

  if (equipment.length) {
    const equipmentPoints = equipment.reduce(
      (total, item) => total + nonNegativeInteger(item.cost),
      0,
    );
    const requiredRank = Math.ceil(equipmentPoints / 5);
    const equipmentEntries = advantages.filter(
      (entry) =>
        findAdvantagePreset(entry.name, entry.catalogKey)?.id ===
        "equipment",
    );
    const others = advantages.filter(
      (entry) =>
        findAdvantagePreset(entry.name, entry.catalogKey)?.id !==
        "equipment",
    );
    const current = equipmentEntries[0];
    advantages = [
      ...others,
      {
        id: current?.id ?? newId("advantage"),
        catalogKey: "equipment",
        name: "Equipamento",
        rank: requiredRank,
        categories: ["Geral"],
        kind: "equipment",
        notes:
          current?.notes ||
          "Graduação mantida automaticamente pelos PE configurados.",
      },
    ];
    if (
      equipmentEntries.length !== 1 ||
      current?.rank !== requiredRank
    ) {
      changes.add("A vantagem Equipamento passou a cobrir todos os PE.");
    }
  }

  const powers = enforceArrayExclusivity(input.powers, changes).map((power) => ({
    ...power,
    wideRanks: nonNegativeInteger(power.wideRanks),
    effects: power.effects.map((effect) => {
      const features = effect.features.map((item) => ({ ...item, rank: nonNegativeInteger(item.rank) }));
      const drawbacks = effect.drawbacks.map((item) => ({ ...item, rank: nonNegativeInteger(item.rank) }));
      const fixedCost = features.reduce((sum, item) => sum + item.rank, 0);
      return {
        ...effect,
        rank: effect.costMode === "structured" && nonNegativeInteger(effect.rank) === 0 && fixedCost === 0 ? 1 : nonNegativeInteger(effect.rank),
        baseCost: nonNegativeInteger(effect.baseCost),
        legacyCost: nonNegativeInteger(effect.legacyCost),
        extras: effect.extras.map((item) => ({ ...item, value: nonNegativeInteger(item.value), ranksApplied: nonNegativeInteger(item.ranksApplied) })),
        flaws: effect.flaws.map((item) => ({ ...item, value: nonNegativeInteger(item.value), ranksApplied: nonNegativeInteger(item.ranksApplied) })),
        features,
        drawbacks,
        traitLinks: effect.traitLinks.map((link) => ({ ...link, value: link.mode === "reference" ? 0 : integer(link.value) })),
      };
    }),
  }));
  if (JSON.stringify(powers) !== JSON.stringify(input.powers)) {
    changes.add("Graduações estruturais de poderes foram normalizadas.");
  }
  let sheet: CharacterSheet = {
    ...input,
    powerLevel: nonNegativeInteger(input.powerLevel),
    customPointBudget: nonNegativeInteger(input.customPointBudget),
    abilities: Object.fromEntries(
      Object.entries(input.abilities).map(([key, value]) => [key, Math.max(-5, integer(value))]),
    ) as CharacterSheet["abilities"],
    combat: {
      attack: Math.max(-5, integer(input.combat.attack)),
      closeAttack: nonNegativeInteger(input.combat.closeAttack),
      rangedAttack: nonNegativeInteger(input.combat.rangedAttack),
      defense: Math.max(-5, integer(input.combat.defense)),
      closeDefense: nonNegativeInteger(input.combat.closeDefense),
      rangedDefense: nonNegativeInteger(input.combat.rangedDefense),
      initiativeBonus: nonNegativeInteger(input.combat.initiativeBonus),
    },
    resistanceAdjustments: Object.fromEntries(
      Object.entries(input.resistanceAdjustments).map(([key, value]) => [key, integer(value)]),
    ) as CharacterSheet["resistanceAdjustments"],
    attackSpecializations: input.attackSpecializations.map((entry) => ({ ...entry, rank: nonNegativeInteger(entry.rank) })),
    attacks: input.attacks.map((entry) => ({ ...entry, effectRank: nonNegativeInteger(entry.effectRank), miscellaneousAttackBonus: integer(entry.miscellaneousAttackBonus) })),
    otherPointAdjustment: { ...input.otherPointAdjustment, value: integer(input.otherPointAdjustment.value) },
    skills,
    advantages,
    equipment,
    powers,
  };

  const heroicCapacity = getHeroicAdvantageCapacity(sheet);
  const heroicLimit = Math.min(
    Math.floor(sheet.powerLevel / 2),
    heroicCapacity,
  );
  const luckCapacity = getLuckCapacity(sheet);
  const resources = {
    ...sheet.resources,
    heroPoints: nonNegativeInteger(sheet.resources.heroPoints),
    heroicAdvantageUses: Math.min(
      heroicLimit,
      nonNegativeInteger(sheet.resources.heroicAdvantageUses),
    ),
    luckCurrent: Math.min(
      luckCapacity,
      nonNegativeInteger(sheet.resources.luckCurrent),
    ),
    luckMax: luckCapacity,
    conditions: [...new Set(sheet.resources.conditions)],
  };
  if (
    resources.heroicAdvantageUses !==
      sheet.resources.heroicAdvantageUses ||
    resources.luckCurrent !== sheet.resources.luckCurrent ||
    resources.luckMax !== sheet.resources.luckMax
  ) {
    changes.add("Usos heroicos e Sorte foram ajustados às capacidades reais.");
  }

  sheet = { ...sheet, resources };
  return { sheet, changes: [...changes] };
}

function enforceArrayExclusivity(
  powers: CharacterSheet["powers"],
  changes: Set<string>,
) {
  const activeByArray = new Set<string>();
  return powers.map((power) => {
    const key = normalize(power.arrayName);
    const dynamic =
      power.arrayRole === "dynamic" ||
      (power.arrayRole === "base" && power.baseDynamic);
    if (!key || !power.active || dynamic) return power;
    if (!activeByArray.has(key)) {
      activeByArray.add(key);
      return power;
    }
    changes.add("Matrizes não dinâmicas mantêm apenas uma configuração ativa.");
    return { ...power, active: false };
  });
}

function integer(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(
    -Number.MAX_SAFE_INTEGER,
    Math.min(Number.MAX_SAFE_INTEGER, Math.round(value)),
  );
}

function nonNegativeInteger(value: number) {
  return Math.max(0, integer(value));
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}
