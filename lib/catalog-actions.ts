import {
  advantageCatalog,
  archetypeCatalog,
  complicationCatalog,
  equipmentCatalog,
  heroOriginCatalog,
  motivationCatalog,
  powerConfigurationCatalog,
  powerEffectCatalog,
  skillCatalog,
} from "./catalog";
import {
  createPower,
  createPowerEffect,
  newId,
  type AttackEntry,
  type CharacterSheet,
} from "./character";
import {
  applyPowerConfigurationPreset,
  applyPowerEffectPreset,
} from "./power-configurations";

export type CatalogActionResult = {
  sheet: CharacterSheet;
  changed: boolean;
  messagePt: string;
  messageEn: string;
};

export function addCatalogEntryToSheet(
  sheet: CharacterSheet,
  groupId: string,
  entryId: string,
): CatalogActionResult {
  if (groupId === "archetypes") {
    const preset = archetypeCatalog.find((entry) => entry.id === entryId);
    return preset
      ? changed({ ...sheet, archetype: preset.label }, "Arquétipo aplicado à identidade.", "Archetype applied to identity.")
      : unchanged(sheet);
  }
  if (groupId === "origins") {
    const preset = heroOriginCatalog.find((entry) => entry.id === entryId);
    return preset
      ? changed({ ...sheet, origin: append(sheet.origin, preset.label) }, "Origem adicionada à ficha.", "Origin added to the sheet.")
      : unchanged(sheet);
  }
  if (groupId === "motivations" || groupId === "complications") {
    const preset = (groupId === "motivations" ? motivationCatalog : complicationCatalog)
      .find((entry) => entry.id === entryId);
    if (!preset) return unchanged(sheet);
    return changed({
      ...sheet,
      complications: [...sheet.complications, {
        id: newId("complication"),
        catalogKey: preset.id,
        name: preset.label,
        type: preset.category,
        description: preset.summary,
      }],
    }, "Item adicionado às complicações.", "Item added to complications.");
  }
  if (groupId === "skills") {
    const preset = skillCatalog.find((entry) => entry.id === entryId);
    if (!preset) return unchanged(sheet);
    const existing = sheet.skills.find((entry) => entry.catalogKey === preset.id);
    if (existing) {
      return {
        sheet,
        changed: false,
        messagePt: "A perícia já está disponível na ficha; ajuste suas graduações.",
        messageEn: "The skill is already available on the sheet; adjust its ranks.",
      };
    }
    return changed({
      ...sheet,
      skills: [...sheet.skills, {
        id: newId("skill"), catalogKey: preset.id, name: preset.label,
        ability: preset.ability, rank: 0, specialization: "",
        specializationRank: 0, miscellaneousModifier: 0,
        miscellaneousModifierSource: "", costClass: preset.costClass,
        trainedOnly: preset.trainedOnly,
      }],
    }, "Perícia adicionada à ficha.", "Skill added to the sheet.");
  }
  if (groupId === "advantages") {
    const preset = advantageCatalog.find((entry) => entry.id === entryId);
    if (!preset) return unchanged(sheet);
    return changed({
      ...sheet,
      advantages: [...sheet.advantages, {
        id: newId("advantage"), catalogKey: preset.id, name: preset.label,
        rank: 1, categories: [...preset.categories], kind: preset.kind, notes: "",
      }],
    }, "Vantagem adicionada à ficha.", "Advantage added to the sheet.");
  }
  if (groupId === "effects" || groupId === "configurations") {
    const effect = groupId === "effects"
      ? (() => {
          const preset = powerEffectCatalog.find((entry) => entry.id === entryId);
          return preset ? applyPowerEffectPreset(createPowerEffect(), preset) : null;
        })()
      : (() => {
          const preset = powerConfigurationCatalog.find((entry) => entry.id === entryId);
          return preset ? applyPowerConfigurationPreset(preset) : null;
        })();
    if (!effect) return unchanged(sheet);
    const power = createPower();
    power.name = effect.name;
    power.effects = [effect];
    const attack = effect.isAttack ? attackFromEffect(effect.id, effect.name, effect.rank, effect.attackRange, effect.strengthBased, effect.resistance) : null;
    return changed({
      ...sheet,
      powers: [...sheet.powers, power],
      attacks: attack ? [...sheet.attacks, attack] : sheet.attacks,
    }, "Poder adicionado e custo recalculado.", "Power added and cost recalculated.");
  }
  if (groupId === "equipment") {
    const preset = equipmentCatalog.find((entry) => entry.id === entryId);
    if (!preset) return unchanged(sheet);
    const equipmentId = newId("equipment");
    const attack = preset.attack
      ? {
          ...attackFromEffect("", preset.label, preset.attack.effectRank, preset.attack.range === "ranged" ? "ranged" : "close", preset.attack.strengthBased, preset.attack.resistance),
          sourceEquipmentId: equipmentId,
          range: preset.attack.range,
          manualEffectSource: "equipment" as const,
        }
      : null;
    return changed({
      ...sheet,
      equipment: [...sheet.equipment, {
        id: equipmentId, catalogKey: preset.id, name: preset.label,
        type: preset.type, cost: preset.cost, active: true, details: preset.details,
      }],
      attacks: attack ? [...sheet.attacks, attack] : sheet.attacks,
    }, "Equipamento adicionado à ficha.", "Equipment added to the sheet.");
  }
  return {
    sheet,
    changed: false,
    messagePt: "Abra o construtor de poderes para aplicar este modificador ao efeito correto.",
    messageEn: "Open the power builder to apply this modifier to the correct effect.",
  };
}

function attackFromEffect(
  sourceEffectId: string,
  name: string,
  effectRank: number,
  range: "close" | "ranged",
  strengthBased: boolean,
  resistance: string,
): AttackEntry {
  return {
    id: newId("attack"), name, sourceEffectId, sourceEquipmentId: "", range,
    effectRank, strengthBased, manualEffectSource: "other",
    manualEffectSourceNote: "", specializationId: "",
    miscellaneousAttackBonus: 0, miscellaneousAttackSource: "", resistance,
    notes: "",
  };
}

function append(current: string, value: string) {
  if (!current.trim()) return value;
  if (current.toLocaleLowerCase("pt-BR").includes(value.toLocaleLowerCase("pt-BR"))) return current;
  return `${current}; ${value}`;
}

function changed(sheet: CharacterSheet, messagePt: string, messageEn: string): CatalogActionResult {
  return { sheet, changed: true, messagePt, messageEn };
}

function unchanged(sheet: CharacterSheet): CatalogActionResult {
  return { sheet, changed: false, messagePt: "Item não encontrado.", messageEn: "Item not found." };
}
