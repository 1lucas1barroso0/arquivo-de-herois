import {
  CUSTOM_CATALOG_KEY,
  findPowerEffectPreset,
  type PowerConfigurationPreset,
  type PowerEffectPreset,
} from "./catalog";
import {
  createPowerEffect,
  newId,
  type PowerEffectEntry,
} from "./character";

export function applyPowerEffectPreset(
  effect: PowerEffectEntry,
  preset: PowerEffectPreset,
): PowerEffectEntry {
  const switchingCatalog =
    Boolean(effect.catalogKey) && effect.catalogKey !== preset.id;
  let traitLinks = switchingCatalog ? [] : effect.traitLinks;
  if (
    preset.suggestedTrait === "strength" &&
    !traitLinks.some((link) => link.trait === "strength")
  ) {
    traitLinks = [
      ...traitLinks,
      {
        id: newId("trait"),
        trait: "strength",
        mode: "per-rank",
        value: 1,
      },
    ];
  }
  return {
    ...effect,
    catalogKey: preset.id,
    configurationKey: "",
    name: preset.label,
    baseCost: preset.baseCost,
    costMode: "structured",
    action: preset.action,
    range: preset.range,
    duration: preset.duration,
    check: preset.check,
    resistance: preset.resistance,
    isAttack: preset.isAttack,
    requiresAttackCheck: preset.requiresAttackCheck,
    attackRange: preset.attackRange,
    strengthBased: preset.strengthBased,
    traitLinks,
  };
}

export function applyPowerConfigurationPreset(
  preset: PowerConfigurationPreset,
): PowerEffectEntry {
  const primary = findPowerEffectPreset("", preset.primaryEffectId);
  if (!primary) {
    throw new Error(
      `Configuração sem efeito-base: ${preset.primaryEffectId}`,
    );
  }

  let effect = applyPowerEffectPreset(createPowerEffect(), primary);
  const traitLinks = [...effect.traitLinks];
  if (
    preset.suggestedTrait &&
    !traitLinks.some((link) => link.trait === preset.suggestedTrait)
  ) {
    traitLinks.push({
      id: newId("trait"),
      trait: preset.suggestedTrait,
      mode: "per-rank",
      value: 1,
    });
  }
  for (const link of preset.traitLinks ?? []) {
    traitLinks.push({ id: newId("trait"), ...link });
  }

  effect = {
    ...effect,
    catalogKey: CUSTOM_CATALOG_KEY,
    configurationKey: preset.id,
    name: preset.label,
    rank: preset.defaultRank,
    baseCost: preset.costPerRank ?? effect.baseCost,
    action: preset.action ?? effect.action,
    range: preset.range ?? effect.range,
    duration: preset.duration ?? effect.duration,
    resistance: preset.resistance ?? effect.resistance,
    isAttack: preset.isAttack ?? effect.isAttack,
    requiresAttackCheck:
      preset.requiresAttackCheck ?? effect.requiresAttackCheck,
    attackRange: preset.attackRange ?? effect.attackRange,
    strengthBased: preset.strengthBased ?? effect.strengthBased,
    traitLinks,
    notes: `${preset.summary}${
      preset.requiresChoice
        ? " Esta configuração exige completar as escolhas indicadas."
        : ""
    }`,
  };

  if (preset.ranksPerPoint) {
    effect = {
      ...effect,
      baseCost: 1,
      flaws: [
        ...effect.flaws,
        {
          id: newId("modifier"),
          name: `Razão 1:${preset.ranksPerPoint} da configuração`,
          value: preset.ranksPerPoint - 1,
          ranksApplied: 0,
        },
      ],
    };
  }
  if (preset.totalCost !== undefined) {
    effect = {
      ...effect,
      rank: 0,
      features: [
        ...effect.features,
        {
          id: newId("modifier"),
          name: "Custo total da configuração",
          rank: preset.totalCost,
          rule: "generic",
        },
      ],
    };
  }
  if (preset.fixedCost) {
    effect = {
      ...effect,
      features: [
        ...effect.features,
        {
          id: newId("modifier"),
          name: "Componentes fixos da configuração",
          rank: preset.fixedCost,
          rule: "generic",
        },
      ],
    };
  }
  if (preset.fixedDiscount) {
    effect = {
      ...effect,
      drawbacks: [
        ...effect.drawbacks,
        {
          id: newId("modifier"),
          name: "Desconto fixo da configuração",
          rank: preset.fixedDiscount,
          rule: "generic",
        },
      ],
    };
  }
  return effect;
}
