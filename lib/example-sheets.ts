import {
  createEmptySheet,
  createPower,
  createPowerEffect,
  newId,
  type CharacterSheet,
  type PowerEffectEntry,
  type TraitKey,
} from "./character";
import { advantageCatalog, complicationCatalog, equipmentCatalog, findPowerConfigurationPreset, powerEffectCatalog } from "./catalog";
import { applyPowerConfigurationPreset, applyPowerEffectPreset } from "./power-configurations";

export const EXAMPLE_TEMPLATE_VERSION = 9;
export const EXAMPLE_SHEET_NAMES = ["Espectro Rubro", "Sentinela Solar", "Atlas Zero"] as const;

/** Each example uses exactly the same public creation structures as user sheets. */
export function createExampleSheets(): CharacterSheet[] {
  return [createCrimsonSpecterNp8(), createSolarSentinelNp10(), createAtlasZeroNp12()];
}

function createCrimsonSpecterNp8() {
  const sheet = exampleBase({
    heroName: "Espectro Rubro", civilName: "Caio Valença", imageUrl: "/demo/espectro-rubro.webp", accent: "#ef3f46",
    archetype: "Combatente do Crime", concept: "Investigador mascarado de escala urbana, treinado para infiltração, análise forense e combate com equipamento.",
    origin: "Treinamento", descriptors: "Treinamento · Tecnológica · Investigação · Moral", powerLevel: 8,
  });
  sheet.abilities = { strength: 2, stamina: 3, agility: 4, intellect: 4, awareness: 3, presence: 1 };
  sheet.combat = { attack: 6, closeAttack: 3, rangedAttack: 2, defense: 8, closeDefense: 2, rangedDefense: 2, initiativeBonus: 4 };
  sheet.resistanceAdjustments = { dodge: 6, fortitude: 3, toughness: 0, will: 4 };
  setSkill(sheet, "acrobatics", 4); setSkill(sheet, "athletics", 4); setSkill(sheet, "deception", 2); setSkill(sheet, "dexterity", 4);
  setSkill(sheet, "insight", 4); setSkill(sheet, "investigation", 6); setSkill(sheet, "perception", 6); setSkill(sheet, "stealth", 6);
  setSkill(sheet, "technology", 4); setSkill(sheet, "vehicles", 4); setSkill(sheet, "expertise", 0, "Ciência forense", 8);
  sheet.advantages = [advantage("equipment", 4), advantage("defensive-roll", 2), advantage("assessment"), advantage("contacts"), advantage("well-informed"), advantage("uncanny-dodge")];
  sheet.equipment = ["sword", "heavy-pistol", "leather-armor", "commlink", "evidence-kit", "first-aid-kit", "night-vision-goggles", "restraints", "flashlight", "multi-tool", "climbing-cable"].map(equipment);
  const swordSpecializationId = newId("specialization");
  sheet.attackSpecializations = [{ id: swordSpecializationId, name: "Espadas", rank: 2, range: "close" }];
  sheet.attacks = sheet.equipment.flatMap((item) => {
    const preset = equipmentCatalog.find((entry) => entry.id === item.catalogKey);
    if (!preset?.attack) return [];
    const attack = attackFromEquipment(item, preset);
    if (preset.id === "sword") attack.specializationId = swordSpecializationId;
    return [attack];
  });
  sheet.complications = [
    complication("justice", "Caio enfrenta criminosos poderosos porque acredita que ninguém deve estar acima da lei."),
    complication("identity", "A revelação de sua identidade colocaria testemunhas, colegas e familiares em risco."),
    complication("enemy", "O Consórcio Carmesim estuda seus métodos e prepara armadilhas específicas para neutralizá-lo."),
  ];
  sheet.personality = "Metódico e observador; tenta vencer primeiro com informação, terreno e preparo.";
  sheet.notes = "EXEMPLO DE APRENDIZADO V9 · NP 8 · 120 PP. Demonstra perícias, especializações, Rolamento Defensivo, equipamento e PE.";
  return sheet;
}

function createSolarSentinelNp10() {
  const sheet = exampleBase({
    heroName: "Sentinela Solar", civilName: "Helena Azevedo", imageUrl: "/demo/sentinela-solar.webp", accent: "#ffd400",
    archetype: "Disparador", concept: "Guardiã cósmica que converte luz estelar em rajadas, construtos, proteção e voo.",
    origin: "Concessão", descriptors: "Cósmica · Luz · Calor · Energia sólida", powerLevel: 10,
  });
  sheet.abilities = { strength: 0, stamina: 2, agility: 3, intellect: 2, awareness: 3, presence: 2 };
  sheet.combat = { attack: 4, closeAttack: 0, rangedAttack: 4, defense: 6, closeDefense: 2, rangedDefense: 2, initiativeBonus: 4 };
  sheet.resistanceAdjustments = { dodge: 5, fortitude: 5, toughness: 0, will: 10 };
  setSkill(sheet, "acrobatics", 2); setSkill(sheet, "athletics", 2); setSkill(sheet, "insight", 4); setSkill(sheet, "intimidation", 4); setSkill(sheet, "perception", 4); setSkill(sheet, "persuasion", 4);
  sheet.advantages = [advantage("extraordinary-effort"), advantage("improved-aim"), advantage("fearless"), advantage("luck", 2)];
  sheet.resources.luckCurrent = 2; sheet.resources.luckMax = 2;
  const arrayName = "Controle da Luz Solar";
  const blast = configuredEffect("blast", 12); const constructs = configuredEffect("force-constructs", 8); const stun = configuredEffect("stun", 12);
  sheet.powers = [
    power("Rajada Solar", blast, { arrayName, arrayRole: "base", active: true, descriptors: "Cósmica, luz e calor" }),
    power("Construtos de Luz", constructs, { arrayName, arrayRole: "alternate", active: false, descriptors: "Cósmica e energia sólida" }),
    power("Toque Atordoante", stun, { arrayName, arrayRole: "alternate", active: false, descriptors: "Luz e choque nervoso" }),
    power("Campo de Força Solar", configuredEffect("force-field", 10), { descriptors: "Cósmica e luz", notes: "Robustez +10 enquanto o campo sustentado estiver ativo." }),
    power("Voo Fotônico", catalogEffect("flight", 8), { descriptors: "Cósmica e luz" }),
    power("Fisiologia Estelar", catalogEffect("immunity", 5), { descriptors: "Cósmica", notes: "Imunidade 5: dano de radiação (descritor incomum)." }),
    power("Visão do Espectro Solar", catalogEffect("enhanced-senses", 5), { descriptors: "Cósmica e luz", notes: "Visão analítica 1 · Consciência cósmica 1 · Visão infravermelha 1 · Visão ultravioleta 1 · Visão estendida 1." }),
  ];
  sheet.attacks = [blast, constructs, stun].map(attackFromEffect);
  sheet.complications = [
    complication("responsibility", "A fonte estelar foi confiada a Helena para proteger quem não pode se defender."),
    complication("power-loss", "Ambientes sem energia luminosa suficiente reduzem sua capacidade de recarregar os poderes."),
    complication("rivalry", "Uma antiga candidata ao manto solar quer provar que Helena não merece a concessão."),
  ];
  sheet.personality = "Inspiradora e cuidadosa; mede o alcance destrutivo dos poderes antes de agir.";
  sheet.notes = "EXEMPLO DE APRENDIZADO V9 · NP 10 · 150 PP. Demonstra ataque à distância, matriz de efeitos alternativos, Campo de Força, sentidos e voo.";
  return sheet;
}

function createAtlasZeroNp12() {
  const sheet = exampleBase({
    heroName: "Atlas Zero", civilName: "Unidade AZ-0", imageUrl: "/demo/atlas-zero.webp", accent: "#00ddeb", archetype: "Colosso",
    concept: "Construto gravitacional veterano, criado para conter ameaças de grande escala com força, proteção e persistência extremas.",
    origin: "Experimento", descriptors: "Inventada · Tecnológica · Gravidade · Metal", powerLevel: 12,
  });
  sheet.abilities = { strength: 4, stamina: 4, agility: 1, intellect: 1, awareness: 2, presence: 1 };
  sheet.combat = { attack: 5, closeAttack: 1, rangedAttack: 0, defense: 6, closeDefense: 2, rangedDefense: 2, initiativeBonus: 0 };
  sheet.resistanceAdjustments = { dodge: 7, fortitude: 0, toughness: 0, will: 10 };
  setSkill(sheet, "athletics", 4); setSkill(sheet, "insight", 4); setSkill(sheet, "intimidation", 6); setSkill(sheet, "perception", 6);
  setSkill(sheet, "technology", 4); setSkill(sheet, "stealth", 2); setSkill(sheet, "persuasion", 2); setSkill(sheet, "expertise", 0, "Operações de contenção", 8);
  sheet.advantages = [advantage("improved-interpose", 2), advantage("great-endurance"), advantage("fearless", 2), advantage("extraordinary-effort"), advantage("improved-defense"), advantage("improved-grab"), advantage("improved-hold"), advantage("improved-smash"), advantage("takedown", 2), advantage("diehard"), advantage("teamwork"), advantage("instant-up"), advantage("uncanny-dodge"), advantage("determination", 2), advantage("luck")];
  sheet.resources.luckCurrent = 1; sheet.resources.luckMax = 1;
  const enhancedStamina = linkedTraitEffect("enhanced-trait", 8, "stamina", 2); enhancedStamina.notes = "Vigor Aprimorado +8.";
  const enhancedToughness = linkedTraitEffect("enhanced-resistance", 4, "toughness", 1); enhancedToughness.notes = "Robustez Aprimorada +4.";
  const strike = configuredEffect("strike", 2);
  sheet.powers = [
    power("Matriz de Vigor", enhancedStamina, { descriptors: "Tecnológica e gravitacional" }),
    power("Força Titânica", catalogEffect("enhanced-strength", 10), { descriptors: "Tecnológica e gravitacional" }),
    power("Estrutura Reforçada", enhancedToughness, { descriptors: "Tecnológica e metal" }),
    power("Golpe Gravitacional", strike, { descriptors: "Gravidade e impacto" }),
    power("Carga Máxima", catalogEffect("lifting", 4), { descriptors: "Tecnológica e gravitacional" }),
    power("Autorrecuperação", catalogEffect("regeneration", 5), { descriptors: "Tecnológica e nanomecânica" }),
    power("Suporte de Vida", catalogEffect("immunity", 10), { descriptors: "Construto tecnológico", notes: "Imunidade Ambiental 10: todos os perigos ambientais." }),
    power("Salto Gravitacional", catalogEffect("leaping", 6), { descriptors: "Gravidade" }),
    power("Passo Sísmico", catalogEffect("speed", 2), { descriptors: "Gravidade e força cinética" }),
  ];
  const specializationId = newId("specialization");
  sheet.attackSpecializations = [{ id: specializationId, name: "Desarmado", rank: 2, range: "close" }];
  const strikeAttack = attackFromEffect(strike); strikeAttack.name = "Golpe Gravitacional"; strikeAttack.specializationId = specializationId; sheet.attacks = [strikeAttack];
  sheet.complications = [
    complication("acceptance", "Atlas quer ser reconhecido como pessoa, não como arma ou propriedade de laboratório."),
    complication("prejudice", "Sua aparência artificial faz civis e autoridades presumirem que ele seja uma ameaça."),
    complication("relationship", "A cientista que despertou sua consciência é sua principal ligação com a humanidade."),
  ];
  sheet.personality = "Calmo e literal; usa força extrema com disciplina para minimizar danos colaterais.";
  sheet.notes = "EXEMPLO DE APRENDIZADO V9 · NP 12 · 180 PP. Demonstra traços aprimorados, ataque baseado em Força, resistências equilibradas e capacidades de construto.";
  return sheet;
}

function exampleBase(input: { heroName: string; civilName: string; imageUrl: string; accent: string; archetype: string; concept: string; origin: string; descriptors: string; powerLevel: number }) {
  const sheet = createEmptySheet();
  return Object.assign(sheet, { ...input, player: "Exemplo auditado", campaign: "Modelos de aprendizado", appearance: "Retrato demonstrativo incluído no aplicativo.", budgetMode: "recommended" as const, customPointBudget: input.powerLevel * 15 });
}
function setSkill(sheet: CharacterSheet, catalogKey: string, rank: number, specialization = "", specializationRank = 0) { const skill = sheet.skills.find((entry) => entry.catalogKey === catalogKey); if (!skill) throw new Error(`Perícia ausente: ${catalogKey}`); Object.assign(skill, { rank, specialization, specializationRank }); }
function advantage(catalogKey: string, rank = 1) { const preset = advantageCatalog.find((entry) => entry.id === catalogKey); if (!preset) throw new Error(`Vantagem ausente: ${catalogKey}`); return { id: newId("advantage"), catalogKey: preset.id, name: preset.label, rank, categories: [...preset.categories], kind: preset.kind, notes: "" } satisfies CharacterSheet["advantages"][number]; }
function equipment(catalogKey: string) { const preset = equipmentCatalog.find((entry) => entry.id === catalogKey); if (!preset) throw new Error(`Equipamento ausente: ${catalogKey}`); return { id: newId("equipment"), catalogKey: preset.id, name: preset.label, type: preset.type, cost: preset.cost, active: true, details: preset.details } satisfies CharacterSheet["equipment"][number]; }
function complication(catalogKey: string, description: string) { const preset = complicationCatalog.find((entry) => entry.id === catalogKey); if (!preset) throw new Error(`Complicação ausente: ${catalogKey}`); return { id: newId("complication"), catalogKey: preset.id, name: preset.label, type: preset.category === "Motivação" ? "Motivação" : preset.label, description } satisfies CharacterSheet["complications"][number]; }
function catalogEffect(catalogKey: string, rank: number) { const preset = powerEffectCatalog.find((entry) => entry.id === catalogKey); if (!preset) throw new Error(`Efeito ausente: ${catalogKey}`); const effect = applyPowerEffectPreset(createPowerEffect(), preset); effect.rank = rank; return effect; }
function linkedTraitEffect(catalogKey: string, rank: number, trait: TraitKey, baseCost: number) { const effect = catalogEffect(catalogKey, rank); effect.baseCost = baseCost; effect.traitLinks = [{ id: newId("trait"), trait, mode: "per-rank", value: 1 }]; return effect; }
function configuredEffect(configurationKey: string, rank: number) { const preset = findPowerConfigurationPreset("", configurationKey); if (!preset) throw new Error(`Configuração ausente: ${configurationKey}`); const effect = applyPowerConfigurationPreset(preset); if (preset.totalCost === undefined) effect.rank = rank; return effect; }
function power(name: string, effect: PowerEffectEntry, options: Partial<CharacterSheet["powers"][number]> = {}) { return { ...createPower(), ...options, name, effects: [effect] } satisfies CharacterSheet["powers"][number]; }
function attackFromEffect(effect: PowerEffectEntry) { return { id: newId("attack"), name: effect.name, sourceEffectId: effect.id, sourceEquipmentId: "", range: effect.requiresAttackCheck ? effect.attackRange : "no-check", effectRank: effect.rank, strengthBased: effect.strengthBased, manualEffectSource: "other", manualEffectSourceNote: "", specializationId: "", miscellaneousAttackBonus: 0, miscellaneousAttackSource: "", resistance: effect.resistance, notes: "Gerado a partir do efeito vinculado." } satisfies CharacterSheet["attacks"][number]; }
function attackFromEquipment(item: CharacterSheet["equipment"][number], preset: (typeof equipmentCatalog)[number]) { const attack = preset.attack!; return { id: newId("attack"), name: item.name, sourceEffectId: "", sourceEquipmentId: item.id, range: attack.range, effectRank: attack.effectRank, strengthBased: attack.strengthBased, manualEffectSource: "equipment", manualEffectSourceNote: item.name, specializationId: "", miscellaneousAttackBonus: 0, miscellaneousAttackSource: "", resistance: attack.resistance, notes: "Gerado a partir do equipamento vinculado." } satisfies CharacterSheet["attacks"][number]; }
