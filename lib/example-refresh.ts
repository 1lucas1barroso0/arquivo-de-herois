import {
  createPower,
  createPowerEffect,
  newId,
  normalizeSheet,
  type CharacterSheet,
  type PowerEffectEntry,
} from "./character";
import { advantageCatalog, powerEffectCatalog } from "./catalog";
import { createExampleSheets } from "./example-sheets";
import { applyPowerEffectPreset } from "./power-configurations";

/**
 * Previous WIP v.05 demonstrations are replaced ONLY if an exact semantic
 * comparison proves they were never customized. Random object IDs and private
 * storage timestamps do not count as customization; every other stored field
 * does, including powers, notes, relationships, and session state.
 */
export function isUntouchedLearningExampleV9(sheet: CharacterSheet) {
  if (sheet.shareEnabled || sheet.shareToken) return false;
  if (sheet.heroName !== "Sentinela Solar" && sheet.heroName !== "Atlas Zero") return false;
  const oldTemplate = previousLearningExampleV9(sheet.heroName);
  return comparableTemplate(sheet) === comparableTemplate(oldTemplate);
}

/** Frozen semantic recreation of the two example templates before the WIP v.05 correction. */
export function previousLearningExampleV9(name: "Sentinela Solar" | "Atlas Zero"): CharacterSheet {
  const sheet = createExampleSheets().find((example) => example.heroName === name);
  if (!sheet) throw new Error(`Exemplo didático não encontrado: ${name}`);
  sheet.movement = [];
  sheet.senses = [];
  if (name === "Sentinela Solar") return sheet;

  sheet.abilities.stamina = 4;
  sheet.absentTraits = [];

  for (const [from, to] of [["assessment", "great-endurance"], ["improved-evasion", "diehard"]] as const) {
    const index = sheet.advantages.findIndex((adv) => adv.catalogKey === from);
    if (index < 0) throw new Error(`Vantagem ausente do exemplo: ${from}`);
    const preset = advantageCatalog.find((adv) => adv.id === to)!;
    sheet.advantages[index] = {
      id: newId("advantage"), catalogKey: to, name: preset.label, rank: 1,
      categories: [...preset.categories], kind: preset.kind, notes: "",
    };
  }

  const stamina = catalogEffect("enhanced-trait", 8);
  stamina.baseCost = 2;
  stamina.traitLinks = [{
    id: newId("trait"), trait: "stamina", mode: "per-rank", value: 1,
  }];
  stamina.notes = "Vigor Aprimorado +8.";
  const staminaPower = createPower();
  Object.assign(staminaPower, {
    name: "Matriz de Vigor", descriptors: "Tecnológica e gravitacional",
    effects: [stamina],
  });
  sheet.powers[0] = staminaPower;

  const toughness = sheet.powers.find((p) => p.name === "Estrutura Reforçada")!.effects[0];
  toughness.rank = 4;
  toughness.notes = "Robustez Aprimorada +4.";

  const environmentalImmunity = catalogEffect("immunity", 10);
  const lifeSupport = createPower();
  Object.assign(lifeSupport, {
    name: "Suporte de Vida", descriptors: "Construto tecnológico",
    notes: "Imunidade Ambiental 10: todos os perigos ambientais.",
    effects: [environmentalImmunity],
  });
  const immuneIndex = sheet.powers.findIndex((p) => p.name === "Sistemas Inorgânicos");
  if (immuneIndex < 0) throw new Error("Imunidade do Atlas não encontrada");
  sheet.powers[immuneIndex] = lifeSupport;

  sheet.notes = "EXEMPLO DE APRENDIZADO V9 · NP 12 · 180 PP. Demonstra traços aprimorados, ataque baseado em Força, resistências equilibradas e capacidades de construto.";
  return sheet;
}

function catalogEffect(id: string, rank: number): PowerEffectEntry {
  const preset = powerEffectCatalog.find((item) => item.id === id);
  if (!preset) throw new Error(`Efeito ausente: ${id}`);
  const effect = applyPowerEffectPreset(createPowerEffect(), preset);
  effect.rank = rank;
  return effect;
}

function comparableTemplate(input: CharacterSheet): string {
  const sheet = structuredClone(normalizeSheet(input)) as CharacterSheet & {
    createdAt?: string; updatedAt?: string;
  };
  // Persistent identity and timestamps are not part of a demonstration.
  delete (sheet as Partial<CharacterSheet>).id;
  delete sheet.createdAt;
  delete sheet.updatedAt;
  delete sheet.shareToken;
  delete sheet.shareEnabled;

  const ids = new Map<string, string>();
  function collect(value: unknown): void {
    if (Array.isArray(value)) { value.forEach(collect); return; }
    if (!value || typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    if (typeof record.id === "string" && record.id && !ids.has(record.id)) {
      ids.set(record.id, `id-${ids.size + 1}`);
    }
    for (const key of Object.keys(record).sort()) collect(record[key]);
  }
  collect(sheet);

  function stable(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(stable);
    if (!value || typeof value !== "object") return value;
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort().map((key) => {
      const item = record[key];
      if (typeof item === "string" && ids.has(item) &&
          ["id", "sourceEffectId", "sourceEquipmentId", "specializationId", "targetSheetId", "organizationId"].includes(key)) {
        return [key, ids.get(item)];
      }
      return [key, stable(item)];
    }));
  }
  return JSON.stringify(stable(sheet));
}
