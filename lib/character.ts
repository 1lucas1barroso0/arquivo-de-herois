import {
  CUSTOM_CATALOG_KEY,
  findAdvantagePreset,
  findComplicationPreset,
  findEquipmentPreset,
  findPowerConfigurationPreset,
  findPowerEffectPreset,
  findSkillPreset,
  skillCatalog,
} from "./catalog";

export const CURRENT_SCHEMA_VERSION = 7 as const;

export const coreAbilityKeys = [
  "strength",
  "stamina",
  "agility",
  "intellect",
  "awareness",
  "presence",
] as const;

export type CoreAbilityKey = (typeof coreAbilityKeys)[number];
export type AbilityKey = CoreAbilityKey;

export const absentTraitKeys = [
  ...coreAbilityKeys,
  "attack",
  "defense",
] as const;

export type AbsentTraitKey = (typeof absentTraitKeys)[number];

export const combatKeys = [
  "attack",
  "closeAttack",
  "rangedAttack",
  "defense",
  "closeDefense",
  "rangedDefense",
  "initiativeBonus",
] as const;

export type CombatKey = (typeof combatKeys)[number];

export const resistanceKeys = [
  "dodge",
  "fortitude",
  "toughness",
  "will",
] as const;

export type ResistanceKey = (typeof resistanceKeys)[number];

export type TraitKey =
  | CoreAbilityKey
  | Exclude<CombatKey, "initiativeBonus">
  | "initiative"
  | ResistanceKey;

export type BuildType = "hero" | "npc";
export type BudgetMode = "recommended" | "custom";
export type CreationMode = "quick" | "guided" | "free";
export type NpcRole =
  | "minion"
  | "ally"
  | "rival"
  | "villain"
  | "boss"
  | "recurring"
  | "creature"
  | "troop"
  | "entity"
  | "custom";
export type RelationshipKind =
  | "ally"
  | "enemy"
  | "rival"
  | "mentor"
  | "partner"
  | "team-member"
  | "subordinate"
  | "summoner"
  | "summon"
  | "alternate-identity"
  | "transformation"
  | "alternate-form"
  | "vehicle"
  | "base"
  | "construct"
  | "other";
export type AuditDecision = "approved" | "rejected";
export type AuditDecisionEntry = {
  decision: AuditDecision;
  fingerprint: string;
  decidedAt: string;
};
export type AdvantageCategory =
  | "Combate"
  | "Comando"
  | "Fortuna"
  | "Geral"
  | "Heroica"
  | "Reação"
  | "Perícia";

export type MovementEntry = {
  id: string;
  typeId: string;
  name: string;
  rank: number;
  sourceEffectId: string;
  notes: string;
};

export type SenseEntry = {
  id: string;
  senseId: string;
  name: string;
  rank: number;
  sourceEffectId: string;
  details: string;
};

export type OrganizationLink = {
  id: string;
  organizationId: string;
  name: string;
  role: string;
  notes: string;
};

export type SheetRelationship = {
  id: string;
  targetSheetId: string;
  targetName: string;
  kind: RelationshipKind;
  notes: string;
};

export type SessionPenalty = {
  id: string;
  label: string;
  target: string;
  value: number;
};

export type SessionResource = {
  id: string;
  name: string;
  current: number;
  maximum: number | null;
};

export type SessionState = {
  active: boolean;
  startedAt: string | null;
  damage: number;
  heroPointsCurrent: number;
  luckCurrent: number;
  conditions: string[];
  penalties: SessionPenalty[];
  temporaryResources: SessionResource[];
  activeEffects: string[];
  sustainedPowerIds: string[];
  notes: string;
};

export type CharacterSheet = {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  id: string;
  heroName: string;
  civilName: string;
  codename: string;
  player: string;
  campaign: string;
  archetype: string;
  concept: string;
  origin: string;
  descriptors: string;
  appearance: string;
  personality: string;
  sizeRank: number;
  absentTraits: AbsentTraitKey[];
  buildType: BuildType;
  creationMode: CreationMode;
  guidedStep: number;
  npcRole: NpcRole | null;
  favorite: boolean;
  archived: boolean;
  tags: string[];
  campaignIds: string[];
  powerLevel: number;
  budgetMode: BudgetMode;
  customPointBudget: number;
  imageUrl: string;
  accent: string;
  abilities: Record<CoreAbilityKey, number>;
  combat: Record<CombatKey, number>;
  resistanceAdjustments: Record<ResistanceKey, number>;
  attackSpecializations: AttackSpecializationEntry[];
  skills: SkillEntry[];
  advantages: AdvantageEntry[];
  powers: PowerEntry[];
  attacks: AttackEntry[];
  equipment: EquipmentEntry[];
  complications: ComplicationEntry[];
  movement: MovementEntry[];
  senses: SenseEntry[];
  organizations: OrganizationLink[];
  relationships: SheetRelationship[];
  resources: {
    heroPoints: number;
    heroicAdvantageUses: number;
    luckCurrent: number;
    luckMax: number;
    fatigue: "Nenhuma" | "Fatigado" | "Exausto" | "Incapacitado";
    conditions: string[];
  };
  session: SessionState;
  otherPointAdjustment: {
    value: number;
    reason: string;
  };
  auditDecisions: Record<string, AuditDecisionEntry>;
  notes: string;
  shareToken?: string | null;
  shareEnabled?: boolean;
  shareMode: "read-only" | "duplicable";
  createdAt?: string;
  updatedAt?: string;
};

export type SkillEntry = {
  id: string;
  catalogKey: string;
  name: string;
  ability: CoreAbilityKey;
  rank: number;
  specialization: string;
  specializationRank: number;
  miscellaneousModifier: number;
  miscellaneousModifierSource: string;
  costClass: "regular" | "specialized";
  trainedOnly: boolean;
};

export type AdvantageEntry = {
  id: string;
  catalogKey: string;
  name: string;
  rank: number;
  categories: AdvantageCategory[];
  kind: "standard" | "equipment";
  notes: string;
};

export type RankedModifierEntry = {
  id: string;
  name: string;
  value: number;
  ranksApplied: number;
};

export type FlatModifierEntry = {
  id: string;
  name: string;
  rank: number;
  rule: "generic" | "accurate" | "inaccurate";
};

export type TraitLinkEntry = {
  id: string;
  trait: TraitKey;
  mode: "per-rank" | "fixed" | "reference";
  value: number;
};

export type PowerEffectEntry = {
  id: string;
  catalogKey: string;
  configurationKey: string;
  name: string;
  rank: number;
  baseCost: number;
  costMode: "structured" | "legacy";
  legacyCost: number;
  action: string;
  range: string;
  duration: string;
  check: string;
  resistance: string;
  isAttack: boolean;
  requiresAttackCheck: boolean;
  attackRange: "close" | "ranged";
  strengthBased: boolean;
  extras: RankedModifierEntry[];
  flaws: RankedModifierEntry[];
  features: FlatModifierEntry[];
  drawbacks: FlatModifierEntry[];
  traitLinks: TraitLinkEntry[];
  legacyText: {
    extras: string;
    features: string;
    flaws: string;
    drawbacks: string;
  };
  notes: string;
};

export type PowerEntry = {
  id: string;
  name: string;
  descriptors: string;
  active: boolean;
  arrayName: string;
  arrayRole: "none" | "base" | "alternate" | "dynamic";
  baseDynamic: boolean;
  wideRanks: number;
  removable: "none" | "removable" | "easily-removable" | "equipment";
  effects: PowerEffectEntry[];
  notes: string;
};

export type AttackSpecializationEntry = {
  id: string;
  name: string;
  rank: number;
  range: "close" | "ranged" | "either";
};

export type AttackEntry = {
  id: string;
  name: string;
  sourceEffectId: string;
  sourceEquipmentId: string;
  range: "close" | "ranged" | "no-check";
  effectRank: number;
  strengthBased: boolean;
  manualEffectSource: "strength" | "equipment" | "other";
  manualEffectSourceNote: string;
  specializationId: string;
  miscellaneousAttackBonus: number;
  miscellaneousAttackSource: string;
  resistance: string;
  notes: string;
};

export type EquipmentEntry = {
  id: string;
  catalogKey: string;
  name: string;
  type: string;
  cost: number;
  active: boolean;
  details: string;
};

export type ComplicationEntry = {
  id: string;
  catalogKey: string;
  name: string;
  type: string;
  description: string;
};

export type SummaryCombat = {
  attack: number;
  defense: number;
};

export type SummaryResistances = Record<ResistanceKey, number>;

export type SheetSummary = {
  id: string;
  heroName: string;
  civilName: string;
  concept: string;
  powerLevel: number;
  pointsTotal: number;
  pointsSpent: number;
  imageUrl: string;
  accent: string;
  abilities: Record<CoreAbilityKey, number>;
  combat: SummaryCombat;
  resistances: SummaryResistances;
  auditStatus: "pass" | "fail" | "attention" | "info";
  buildType: BuildType;
  favorite: boolean;
  archived: boolean;
  campaignIds: string[];
  completion: number;
  alertCount: number;
  shareEnabled?: boolean;
  shareToken?: string | null;
  updatedAt?: string;
};

export const abilityLabels: Record<CoreAbilityKey, string> = {
  strength: "Força",
  stamina: "Vigor",
  agility: "Agilidade",
  intellect: "Intelecto",
  awareness: "Consciência",
  presence: "Presença",
};

export const abilityAbbreviations: Record<CoreAbilityKey, string> = {
  strength: "STR",
  stamina: "STA",
  agility: "AGL",
  intellect: "INT",
  awareness: "AWE",
  presence: "PRE",
};

export const combatLabels: Record<CombatKey, string> = {
  attack: "Ataque",
  closeAttack: "Ataque Corpo a Corpo",
  rangedAttack: "Ataque à Distância",
  defense: "Defesa",
  closeDefense: "Defesa Corpo a Corpo",
  rangedDefense: "Defesa à Distância",
  initiativeBonus: "Bônus comprado de Iniciativa",
};

export const resistanceLabels: Record<ResistanceKey, string> = {
  dodge: "Esquiva",
  fortitude: "Fortitude",
  toughness: "Robustez",
  will: "Vontade",
};

export const traitLabels: Record<TraitKey, string> = {
  ...abilityLabels,
  attack: "Ataque",
  closeAttack: "Ataque Corpo a Corpo",
  rangedAttack: "Ataque à Distância",
  defense: "Defesa",
  closeDefense: "Defesa Corpo a Corpo",
  rangedDefense: "Defesa à Distância",
  initiative: "Iniciativa",
  dodge: "Esquiva",
  fortitude: "Fortitude",
  toughness: "Robustez",
  will: "Vontade",
};

export const advantageCategories: AdvantageCategory[] = [
  "Combate",
  "Comando",
  "Fortuna",
  "Geral",
  "Heroica",
  "Reação",
  "Perícia",
];

export const defaultSkills: Omit<SkillEntry, "id">[] = skillCatalog.map(
  (entry) => ({
    catalogKey: entry.id,
    name: entry.label,
    ability: entry.ability,
    rank: 0,
    specialization: "",
    specializationRank: 0,
    miscellaneousModifier: 0,
    miscellaneousModifierSource: "",
    costClass: entry.costClass,
    trainedOnly: entry.trainedOnly,
  }),
);

export const conditions = [
  "Cego (Blind)",
  "Quebrado (Broken)",
  "Compelido (Compelled)",
  "Controlado (Controlled)",
  "Atordoado (Dazed)",
  "Morto (Dead)",
  "Surdo (Deaf)",
  "Debilitado (Debilitated)",
  "Indefeso (Defenseless)",
  "Delírio (Delusion)",
  "Destruído (Destroyed)",
  "Desabilitado (Disabled)",
  "Morrendo (Dying)",
  "Exausto (Exhausted)",
  "Fatigado (Fatigued)",
  "Ilusão menor (Figment)",
  "Amedrontado (Frightened)",
  "Alucinando (Hallucinating)",
  "Desamparado (Helpless)",
  "Impedido (Hindered)",
  "Ferido (Hit)",
  "Imóvel (Immobile)",
  "Prejudicado (Impaired)",
  "Incapacitado (Incapacitated)",
  "Reduzido (Lowered)",
  "Normal (Normal)",
  "Paralisado (Paralyzed)",
  "Fantasia (Phantasm)",
  "Caído (Prone)",
  "Dormindo (Sleeping)",
  "Cambaleante (Staggered)",
  "Atônito (Stunned)",
  "Surpreso (Surprised)",
  "Suscetível (Susceptible)",
  "Transformado (Transformed)",
  "Desatento (Unaware)",
  "Vulnerável (Vulnerable)",
  "Fraqueza (Weakness)",
];

export function requiresSpecializedSkillCost(name: string) {
  return /^(especializa(?:ção|cao|do|da)?|especialidade|expertise|atuação|atuacao|performance)(?:\b|\s|\()/i.test(
    name.trim(),
  );
}

export function newId(prefix = "item") {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const bytes = crypto.getRandomValues(new Uint8Array(10));
    return `${prefix}_${Array.from(bytes, (byte) =>
      byte.toString(36).padStart(2, "0"),
    ).join("")}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function createPowerEffect(): PowerEffectEntry {
  return {
    id: newId("effect"),
    catalogKey: "",
    configurationKey: "",
    name: "",
    rank: 1,
    baseCost: 1,
    costMode: "structured",
    legacyCost: 1,
    action: "Padrão",
    range: "Perto",
    duration: "Instantânea",
    check: "",
    resistance: "",
    isAttack: false,
    requiresAttackCheck: true,
    attackRange: "close",
    strengthBased: false,
    extras: [],
    flaws: [],
    features: [],
    drawbacks: [],
    traitLinks: [],
    legacyText: { extras: "", features: "", flaws: "", drawbacks: "" },
    notes: "",
  };
}

export function createPower(): PowerEntry {
  return {
    id: newId("power"),
    name: "",
    descriptors: "",
    active: true,
    arrayName: "",
    arrayRole: "none",
    baseDynamic: false,
    wideRanks: 0,
    removable: "none",
    effects: [createPowerEffect()],
    notes: "",
  };
}

export function createEmptySheet(): CharacterSheet {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: "",
    heroName: "Novo Herói",
    civilName: "",
    codename: "",
    player: "",
    campaign: "",
    archetype: "",
    concept: "",
    origin: "",
    descriptors: "",
    appearance: "",
    personality: "",
    sizeRank: 0,
    absentTraits: [],
    buildType: "hero",
    creationMode: "guided",
    guidedStep: 1,
    npcRole: null,
    favorite: false,
    archived: false,
    tags: [],
    campaignIds: [],
    powerLevel: 10,
    budgetMode: "recommended",
    customPointBudget: 150,
    imageUrl: "",
    accent: "#ffd400",
    abilities: {
      strength: 0,
      stamina: 0,
      agility: 0,
      intellect: 0,
      awareness: 0,
      presence: 0,
    },
    combat: {
      attack: 0,
      closeAttack: 0,
      rangedAttack: 0,
      defense: 0,
      closeDefense: 0,
      rangedDefense: 0,
      initiativeBonus: 0,
    },
    resistanceAdjustments: {
      dodge: 0,
      fortitude: 0,
      toughness: 0,
      will: 0,
    },
    attackSpecializations: [],
    skills: defaultSkills.map((entry) => ({ ...entry, id: newId("skill") })),
    advantages: [],
    powers: [],
    attacks: [],
    equipment: [],
    complications: [
      {
        id: newId("complication"),
        catalogKey: "",
        name: "Motivação",
        type: "Motivação",
        description: "",
      },
    ],
    movement: [],
    senses: [],
    organizations: [],
    relationships: [],
    resources: {
      heroPoints: 1,
      heroicAdvantageUses: 0,
      luckCurrent: 0,
      luckMax: 0,
      fatigue: "Nenhuma",
      conditions: [],
    },
    session: {
      active: false,
      startedAt: null,
      damage: 0,
      heroPointsCurrent: 1,
      luckCurrent: 0,
      conditions: [],
      penalties: [],
      temporaryResources: [],
      activeEffects: [],
      sustainedPowerIds: [],
      notes: "",
    },
    otherPointAdjustment: { value: 0, reason: "" },
    auditDecisions: {},
    notes: "",
    shareEnabled: false,
    shareToken: null,
    shareMode: "duplicable",
  };
}

export function normalizeSheet(value: unknown): CharacterSheet {
  const base = createEmptySheet();
  const raw = asRecord(value);
  const oldAbilities = asRecord(raw.abilities);
  const powerLevel = numberValue(raw.powerLevel, base.powerLevel);
  const isCurrent =
    raw.schemaVersion === CURRENT_SCHEMA_VERSION ||
    Boolean(raw.combat || raw.resistanceAdjustments);
  const inferCatalogLinks = raw.schemaVersion !== CURRENT_SCHEMA_VERSION;

  const abilities = Object.fromEntries(
    coreAbilityKeys.map((key) => [key, numberValue(oldAbilities[key], 0)]),
  ) as CharacterSheet["abilities"];

  const rawCombat = asRecord(raw.combat);
  const combat = {
    attack: numberValue(
      rawCombat.attack,
      isCurrent ? 0 : numberValue(oldAbilities.attack, 0),
    ),
    closeAttack: numberValue(rawCombat.closeAttack, 0),
    rangedAttack: numberValue(rawCombat.rangedAttack, 0),
    defense: numberValue(
      rawCombat.defense,
      isCurrent ? 0 : numberValue(oldAbilities.defense, 0),
    ),
    closeDefense: numberValue(rawCombat.closeDefense, 0),
    rangedDefense: numberValue(rawCombat.rangedDefense, 0),
    initiativeBonus: numberValue(
      rawCombat.initiativeBonus,
      isCurrent
        ? 0
        : Math.max(
            0,
            numberValue(oldAbilities.initiative, abilities.agility) -
              abilities.agility,
          ),
    ),
  };

  const oldResistances = asRecord(raw.resistances);
  const rawAdjustments = asRecord(raw.resistanceAdjustments);
  const resistanceAdjustments = {
    dodge: numberValue(
      rawAdjustments.dodge,
      isCurrent
        ? 0
        : numberValue(oldResistances.dodge, abilities.agility) -
            abilities.agility,
    ),
    fortitude: numberValue(
      rawAdjustments.fortitude,
      isCurrent
        ? 0
        : numberValue(oldResistances.fortitude, abilities.stamina) -
            abilities.stamina,
    ),
    toughness: numberValue(
      rawAdjustments.toughness,
      isCurrent
        ? 0
        : numberValue(oldResistances.toughness, abilities.stamina) -
            abilities.stamina,
    ),
    will: numberValue(
      rawAdjustments.will,
      isCurrent
        ? 0
        : numberValue(oldResistances.will, abilities.awareness) -
            abilities.awareness,
    ),
  };

  const legacyPointBudget = numberValue(raw.pointsTotal, powerLevel * 15);
  const budgetMode: BudgetMode =
    raw.budgetMode === "custom" ||
    (!isCurrent && legacyPointBudget !== powerLevel * 15)
      ? "custom"
      : "recommended";

  const resources = normalizeResources(raw.resources, base.resources);

  const skills = Array.isArray(raw.skills)
    ? raw.skills.map((entry) =>
        normalizeSkill(entry, inferCatalogLinks),
      )
    : base.skills;
  const powers = Array.isArray(raw.powers)
    ? raw.powers.map((entry) =>
        normalizePower(entry, inferCatalogLinks),
      )
    : [];

  const sheet: CharacterSheet = {
    ...base,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: stringValue(raw.id),
    heroName: stringValue(raw.heroName, base.heroName),
    civilName: stringValue(raw.civilName),
    codename: stringValue(raw.codename),
    player: stringValue(raw.player),
    campaign: stringValue(raw.campaign),
    archetype: stringValue(raw.archetype),
    concept: stringValue(raw.concept),
    origin: stringValue(raw.origin),
    descriptors: stringValue(raw.descriptors),
    appearance: stringValue(raw.appearance),
    personality: stringValue(raw.personality),
    sizeRank: numberValue(raw.sizeRank, 0),
    absentTraits: getStoredAbsentTraits(raw),
    buildType: raw.buildType === "npc" ? "npc" : "hero",
    creationMode: normalizeCreationMode(raw.creationMode),
    guidedStep: clampInteger(raw.guidedStep, 1, 10, 1),
    npcRole: normalizeNpcRole(raw.npcRole),
    favorite: Boolean(raw.favorite),
    archived: Boolean(raw.archived),
    tags: normalizeStringList(raw.tags, 40),
    campaignIds: normalizeStringList(raw.campaignIds, 100),
    powerLevel,
    budgetMode,
    customPointBudget: numberValue(
      raw.customPointBudget,
      legacyPointBudget,
    ),
    imageUrl: stringValue(raw.imageUrl),
    accent: stringValue(raw.accent, base.accent),
    abilities,
    combat,
    resistanceAdjustments,
    attackSpecializations: Array.isArray(raw.attackSpecializations)
      ? raw.attackSpecializations.map(normalizeAttackSpecialization)
      : [],
    skills,
    advantages: Array.isArray(raw.advantages)
      ? raw.advantages.map((entry) =>
          normalizeAdvantage(entry, inferCatalogLinks),
        )
      : [],
    powers,
    attacks: Array.isArray(raw.attacks)
      ? raw.attacks.map((entry) =>
          normalizeAttack(entry, combat.attack),
        )
      : [],
    equipment: Array.isArray(raw.equipment)
      ? raw.equipment.map((entry) =>
          normalizeEquipment(entry, inferCatalogLinks),
        )
      : [],
    complications: Array.isArray(raw.complications)
      ? raw.complications.map((entry) =>
          normalizeComplication(entry, inferCatalogLinks),
        )
      : base.complications,
    movement: Array.isArray(raw.movement)
      ? raw.movement.map(normalizeMovement)
      : [],
    senses: Array.isArray(raw.senses)
      ? raw.senses.map(normalizeSense)
      : [],
    organizations: Array.isArray(raw.organizations)
      ? raw.organizations.map(normalizeOrganizationLink)
      : [],
    relationships: Array.isArray(raw.relationships)
      ? raw.relationships.map(normalizeRelationship)
      : [],
    resources,
    session: normalizeSession(raw.session, resources),
    otherPointAdjustment: normalizeOtherAdjustment(raw.otherPointAdjustment),
    auditDecisions: normalizeAuditDecisions(raw.auditDecisions),
    notes: stringValue(raw.notes),
    shareEnabled: Boolean(raw.shareEnabled),
    shareMode: raw.shareMode === "read-only" ? "read-only" : "duplicable",
    shareToken:
      typeof raw.shareToken === "string" ? raw.shareToken : null,
    createdAt:
      typeof raw.createdAt === "string" ? raw.createdAt : undefined,
    updatedAt:
      typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
  };

  return sheet;
}

function normalizeSkill(
  value: unknown,
  inferCatalogLink = true,
): SkillEntry {
  const raw = asRecord(value);
  const name = stringValue(raw.name, "Perícia");
  const catalogKey = stringValue(raw.catalogKey);
  const preset =
    catalogKey || inferCatalogLink
      ? findSkillPreset(name, catalogKey)
      : undefined;
  const specializedCostRequired = requiresSpecializedSkillCost(name);
  return {
    id: stringValue(raw.id, newId("skill")),
    catalogKey: preset?.id ?? catalogKey,
    name,
    ability: normalizeAbility(raw.ability),
    rank: numberValue(raw.rank, 0),
    specialization: stringValue(raw.specialization),
    specializationRank: numberValue(raw.specializationRank, 0),
    miscellaneousModifier: numberValue(raw.miscellaneousModifier, 0),
    miscellaneousModifierSource: stringValue(
      raw.miscellaneousModifierSource,
    ),
    costClass:
      preset?.costClass === "specialized" ||
      raw.costClass === "specialized" ||
      specializedCostRequired
        ? "specialized"
        : "regular",
    trainedOnly:
      preset?.trainedOnly ||
      specializedCostRequired ||
      Boolean(raw.trainedOnly),
  };
}

function normalizeAdvantage(
  value: unknown,
  inferCatalogLink = true,
): AdvantageEntry {
  const raw = asRecord(value);
  const oldCategory = stringValue(raw.category);
  const categories: AdvantageCategory[] = Array.isArray(raw.categories)
    ? raw.categories.filter(isAdvantageCategory)
    : isAdvantageCategory(oldCategory)
      ? [oldCategory]
      : ["Geral"];
  const name = stringValue(raw.name);
  const catalogKey = stringValue(raw.catalogKey);
  const preset =
    catalogKey || inferCatalogLink
      ? findAdvantagePreset(name, catalogKey)
      : undefined;
  return {
    id: stringValue(raw.id, newId("advantage")),
    catalogKey: preset?.id ?? catalogKey,
    name,
    rank: numberValue(raw.rank, 1),
    categories: preset?.categories ?? (categories.length ? categories : ["Geral"]),
    kind:
      preset?.kind === "equipment" ||
      raw.kind === "equipment" ||
      /^(equipamento|equipment)$/i.test(name.trim())
        ? "equipment"
        : "standard",
    notes: stringValue(raw.notes),
  };
}

function normalizePower(
  value: unknown,
  inferCatalogLink = true,
): PowerEntry {
  const raw = asRecord(value);
  if (Array.isArray(raw.effects)) {
    return {
      id: stringValue(raw.id, newId("power")),
      name: stringValue(raw.name),
      descriptors: stringValue(raw.descriptors),
      active: raw.active !== false,
      arrayName: stringValue(raw.arrayName),
      arrayRole: isArrayRole(raw.arrayRole) ? raw.arrayRole : "none",
      baseDynamic: Boolean(raw.baseDynamic),
      wideRanks: numberValue(raw.wideRanks, 0),
      removable: isRemovable(raw.removable) ? raw.removable : "none",
      effects: raw.effects.map((entry) =>
        normalizePowerEffect(entry, inferCatalogLink),
      ),
      notes: stringValue(raw.notes),
    };
  }

  const effect = createPowerEffect();
  effect.name = stringValue(raw.effect, stringValue(raw.name));
  effect.rank = numberValue(raw.rank, 1);
  effect.costMode = "legacy";
  effect.legacyCost = numberValue(raw.cost, 1);
  effect.action = stringValue(raw.action, effect.action);
  effect.range = stringValue(raw.range, effect.range);
  effect.duration = stringValue(raw.duration, effect.duration);
  effect.check = stringValue(raw.check);
  effect.resistance = stringValue(raw.resistance);
  effect.legacyText = {
    extras: stringValue(raw.extras),
    features: stringValue(raw.features),
    flaws: stringValue(raw.flaws),
    drawbacks: stringValue(raw.drawbacks),
  };
  return {
    id: stringValue(raw.id, newId("power")),
    name: stringValue(raw.name),
    descriptors: stringValue(raw.descriptors),
    active: true,
    arrayName: "",
    arrayRole: "none",
    baseDynamic: false,
    wideRanks: 0,
    removable: "none",
    effects: [effect],
    notes: stringValue(raw.notes),
  };
}

function normalizePowerEffect(
  value: unknown,
  inferCatalogLink = true,
): PowerEffectEntry {
  const raw = asRecord(value);
  const base = createPowerEffect();
  const name = stringValue(raw.name);
  const catalogKey = stringValue(raw.catalogKey);
  const configurationKey = stringValue(raw.configurationKey);
  const configuration =
    configurationKey || inferCatalogLink
      ? findPowerConfigurationPreset(name, configurationKey)
      : undefined;
  const preset =
    !configuration && (catalogKey || inferCatalogLink)
      ? findPowerEffectPreset(name, catalogKey)
      : undefined;
  return {
    ...base,
    id: stringValue(raw.id, newId("effect")),
    catalogKey: configuration
      ? CUSTOM_CATALOG_KEY
      : preset?.id ?? catalogKey,
    configurationKey:
      configuration?.id ?? configurationKey,
    name,
    rank: numberValue(raw.rank, 1),
    baseCost: numberValue(raw.baseCost, 1),
    costMode: raw.costMode === "legacy" ? "legacy" : "structured",
    legacyCost: numberValue(raw.legacyCost, 1),
    action: stringValue(raw.action, base.action),
    range: stringValue(raw.range, base.range),
    duration: stringValue(raw.duration, base.duration),
    check: stringValue(raw.check),
    resistance: stringValue(raw.resistance),
    isAttack: Boolean(raw.isAttack),
    requiresAttackCheck: raw.requiresAttackCheck !== false,
    attackRange: raw.attackRange === "ranged" ? "ranged" : "close",
    strengthBased: Boolean(raw.strengthBased),
    extras: Array.isArray(raw.extras)
      ? raw.extras.map(normalizeRankedModifier)
      : [],
    flaws: Array.isArray(raw.flaws)
      ? raw.flaws.map(normalizeRankedModifier)
      : [],
    features: Array.isArray(raw.features)
      ? raw.features.map(normalizeFlatModifier)
      : [],
    drawbacks: Array.isArray(raw.drawbacks)
      ? raw.drawbacks.map(normalizeFlatModifier)
      : [],
    traitLinks: Array.isArray(raw.traitLinks)
      ? raw.traitLinks.map(normalizeTraitLink)
      : [],
    legacyText: normalizeLegacyText(raw.legacyText),
    notes: stringValue(raw.notes),
  };
}

function normalizeRankedModifier(value: unknown): RankedModifierEntry {
  const raw = asRecord(value);
  return {
    id: stringValue(raw.id, newId("modifier")),
    name: stringValue(raw.name),
    value: numberValue(raw.value, 1),
    ranksApplied: numberValue(raw.ranksApplied, 0),
  };
}

function normalizeFlatModifier(value: unknown): FlatModifierEntry {
  const raw = asRecord(value);
  const rule =
    raw.rule === "accurate" || raw.rule === "inaccurate"
      ? raw.rule
      : "generic";
  return {
    id: stringValue(raw.id, newId("modifier")),
    name: stringValue(raw.name),
    rank: numberValue(raw.rank, 1),
    rule,
  };
}

function normalizeTraitLink(value: unknown): TraitLinkEntry {
  const raw = asRecord(value);
  const mode =
    raw.mode === "fixed" || raw.mode === "reference"
      ? raw.mode
      : "per-rank";
  return {
    id: stringValue(raw.id, newId("trait")),
    trait: isTraitKey(raw.trait) ? raw.trait : "strength",
    mode,
    value: mode === "reference" ? 0 : numberValue(raw.value, 1),
  };
}

function normalizeAttackSpecialization(
  value: unknown,
): AttackSpecializationEntry {
  const raw = asRecord(value);
  return {
    id: stringValue(raw.id, newId("specialization")),
    name: stringValue(raw.name),
    rank: numberValue(raw.rank, 2),
    range:
      raw.range === "ranged" || raw.range === "either"
        ? raw.range
        : "close",
  };
}

function normalizeAttack(value: unknown, baseAttack: number): AttackEntry {
  const raw = asRecord(value);
  const isCurrent = "sourceEffectId" in raw || "effectRank" in raw;
  const oldBonus = numberValue(raw.bonus, baseAttack);
  return {
    id: stringValue(raw.id, newId("attack")),
    name: stringValue(raw.name),
    sourceEffectId: stringValue(raw.sourceEffectId),
    sourceEquipmentId: stringValue(raw.sourceEquipmentId),
    range:
      raw.range === "ranged" || raw.range === "no-check"
        ? raw.range
        : "close",
    effectRank: numberValue(raw.effectRank, numberValue(raw.effect, 0)),
    strengthBased: Boolean(raw.strengthBased),
    manualEffectSource:
      raw.manualEffectSource === "equipment" ||
      raw.manualEffectSource === "strength"
        ? raw.manualEffectSource
        : "other",
    manualEffectSourceNote: stringValue(raw.manualEffectSourceNote),
    specializationId: stringValue(raw.specializationId),
    miscellaneousAttackBonus: numberValue(
      raw.miscellaneousAttackBonus,
      isCurrent ? 0 : oldBonus - baseAttack,
    ),
    miscellaneousAttackSource: stringValue(
      raw.miscellaneousAttackSource,
      isCurrent || oldBonus === baseAttack
        ? ""
        : "Bônus migrado da ficha anterior",
    ),
    resistance: stringValue(raw.resistance),
    notes: stringValue(raw.notes),
  };
}

function normalizeEquipment(
  value: unknown,
  inferCatalogLink = true,
): EquipmentEntry {
  const raw = asRecord(value);
  const name = stringValue(raw.name);
  const catalogKey = stringValue(raw.catalogKey);
  const preset =
    catalogKey || inferCatalogLink
      ? findEquipmentPreset(name, catalogKey)
      : undefined;
  return {
    id: stringValue(raw.id, newId("equipment")),
    catalogKey: preset?.id ?? catalogKey,
    name,
    type: stringValue(raw.type, "Equipamento"),
    cost: numberValue(raw.cost, 0),
    active: raw.active !== false,
    details: stringValue(raw.details),
  };
}

function normalizeComplication(
  value: unknown,
  inferCatalogLink = true,
): ComplicationEntry {
  const raw = asRecord(value);
  const name = stringValue(raw.name);
  const catalogKey = stringValue(raw.catalogKey);
  const type = stringValue(raw.type, "Responsabilidade");
  const preset =
    catalogKey || inferCatalogLink
      ? findComplicationPreset(name, catalogKey, type)
      : undefined;
  return {
    id: stringValue(raw.id, newId("complication")),
    catalogKey: preset?.id ?? catalogKey,
    name,
    type,
    description: stringValue(raw.description),
  };
}

function normalizeResources(
  value: unknown,
  base: CharacterSheet["resources"],
): CharacterSheet["resources"] {
  const raw = asRecord(value);
  const fatigue =
    raw.fatigue === "Fatigado" ||
    raw.fatigue === "Exausto" ||
    raw.fatigue === "Incapacitado"
      ? raw.fatigue
      : "Nenhuma";
  return {
    heroPoints: numberValue(raw.heroPoints, base.heroPoints),
    heroicAdvantageUses: numberValue(raw.heroicAdvantageUses, 0),
    luckCurrent: numberValue(raw.luckCurrent, 0),
    luckMax: numberValue(raw.luckMax, 0),
    fatigue,
    conditions: Array.isArray(raw.conditions)
      ? [
          ...new Set(
            raw.conditions
              .filter(
                (entry): entry is string => typeof entry === "string",
              )
              .map(normalizeConditionName),
          ),
        ]
      : [],
  };
}

function normalizeConditionName(value: string) {
  const wanted = normalizedLookup(value);
  const canonical = conditions.find((condition) => {
    const [portuguese, english = ""] = condition.split(/[()]/);
    return [condition, portuguese, english]
      .map(normalizedLookup)
      .filter(Boolean)
      .includes(wanted);
  });
  return canonical ?? value;
}

function normalizeMovement(value: unknown): MovementEntry {
  const raw = asRecord(value);
  return {
    id: stringValue(raw.id, newId("movement")),
    typeId: stringValue(raw.typeId, "movement.other"),
    name: stringValue(raw.name, "Movimento"),
    rank: numberValue(raw.rank, 0),
    sourceEffectId: stringValue(raw.sourceEffectId),
    notes: stringValue(raw.notes),
  };
}

function normalizeSense(value: unknown): SenseEntry {
  const raw = asRecord(value);
  return {
    id: stringValue(raw.id, newId("sense")),
    senseId: stringValue(raw.senseId, "sense.other"),
    name: stringValue(raw.name, "Sentido"),
    rank: numberValue(raw.rank, 0),
    sourceEffectId: stringValue(raw.sourceEffectId),
    details: stringValue(raw.details),
  };
}

function normalizeOrganizationLink(value: unknown): OrganizationLink {
  const raw = asRecord(value);
  return {
    id: stringValue(raw.id, newId("organization")),
    organizationId: stringValue(raw.organizationId),
    name: stringValue(raw.name, "Organização"),
    role: stringValue(raw.role),
    notes: stringValue(raw.notes),
  };
}

function normalizeRelationship(value: unknown): SheetRelationship {
  const raw = asRecord(value);
  return {
    id: stringValue(raw.id, newId("relationship")),
    targetSheetId: stringValue(raw.targetSheetId),
    targetName: stringValue(raw.targetName),
    kind: isRelationshipKind(raw.kind) ? raw.kind : "other",
    notes: stringValue(raw.notes),
  };
}

function normalizeSession(
  value: unknown,
  resources: CharacterSheet["resources"],
): SessionState {
  const raw = asRecord(value);
  return {
    active: Boolean(raw.active),
    startedAt:
      typeof raw.startedAt === "string" && raw.startedAt
        ? raw.startedAt
        : null,
    damage: Math.max(0, numberValue(raw.damage, 0)),
    heroPointsCurrent: Math.max(
      0,
      numberValue(raw.heroPointsCurrent, resources.heroPoints),
    ),
    luckCurrent: Math.max(
      0,
      numberValue(raw.luckCurrent, resources.luckCurrent),
    ),
    conditions: Array.isArray(raw.conditions)
      ? normalizeStringList(raw.conditions, 100).map(normalizeConditionName)
      : [],
    penalties: Array.isArray(raw.penalties)
      ? raw.penalties.map((entry) => {
          const penalty = asRecord(entry);
          return {
            id: stringValue(penalty.id, newId("penalty")),
            label: stringValue(penalty.label, "Penalidade"),
            target: stringValue(penalty.target, "other"),
            value: numberValue(penalty.value, 0),
          };
        })
      : [],
    temporaryResources: Array.isArray(raw.temporaryResources)
      ? raw.temporaryResources.map((entry) => {
          const resource = asRecord(entry);
          return {
            id: stringValue(resource.id, newId("resource")),
            name: stringValue(resource.name, "Recurso"),
            current: numberValue(resource.current, 0),
            maximum:
              resource.maximum === null || resource.maximum === undefined
                ? null
                : numberValue(resource.maximum, 0),
          };
        })
      : [],
    activeEffects: normalizeStringList(raw.activeEffects, 200),
    sustainedPowerIds: normalizeStringList(raw.sustainedPowerIds, 200),
    notes: stringValue(raw.notes),
  };
}

function normalizeCreationMode(value: unknown): CreationMode {
  if (value === "quick" || value === "free") return value;
  return "guided";
}

function normalizeNpcRole(value: unknown): NpcRole | null {
  const roles: readonly NpcRole[] = [
    "minion",
    "ally",
    "rival",
    "villain",
    "boss",
    "recurring",
    "creature",
    "troop",
    "entity",
    "custom",
  ];
  return roles.includes(value as NpcRole) ? (value as NpcRole) : null;
}

function isRelationshipKind(value: unknown): value is RelationshipKind {
  const kinds: readonly RelationshipKind[] = [
    "ally",
    "enemy",
    "rival",
    "mentor",
    "partner",
    "team-member",
    "subordinate",
    "summoner",
    "summon",
    "alternate-identity",
    "transformation",
    "alternate-form",
    "vehicle",
    "base",
    "construct",
    "other",
  ];
  return kinds.includes(value as RelationshipKind);
}

function normalizeStringList(value: unknown, maximum: number) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .slice(0, maximum),
    ),
  ];
}

function clampInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
) {
  return Math.min(
    maximum,
    Math.max(minimum, Math.round(numberValue(value, fallback))),
  );
}

function normalizeOtherAdjustment(
  value: unknown,
): CharacterSheet["otherPointAdjustment"] {
  const raw = asRecord(value);
  return {
    value: numberValue(raw.value, 0),
    reason: stringValue(raw.reason),
  };
}

function normalizeAuditDecisions(
  value: unknown,
): CharacterSheet["auditDecisions"] {
  const raw = asRecord(value);
  const decisions: CharacterSheet["auditDecisions"] = {};

  for (const [key, candidate] of Object.entries(raw)) {
    if (!/^[a-z0-9_-]{1,200}$/i.test(key)) continue;
    const entry = asRecord(candidate);
    if (entry.decision !== "approved" && entry.decision !== "rejected") {
      continue;
    }
    const fingerprint = stringValue(entry.fingerprint);
    if (!fingerprint) continue;
    decisions[key] = {
      decision: entry.decision,
      fingerprint,
      decidedAt: stringValue(entry.decidedAt),
    };
  }

  return decisions;
}

function normalizeLegacyText(
  value: unknown,
): PowerEffectEntry["legacyText"] {
  const raw = asRecord(value);
  return {
    extras: stringValue(raw.extras),
    features: stringValue(raw.features),
    flaws: stringValue(raw.flaws),
    drawbacks: stringValue(raw.drawbacks),
  };
}

function normalizeAbility(value: unknown): CoreAbilityKey {
  if (isCoreAbilityKey(value)) return value;
  const normalized = stringValue(value).trim().toUpperCase();
  const aliases: Record<string, CoreAbilityKey> = {
    STR: "strength",
    FOR: "strength",
    STA: "stamina",
    VIG: "stamina",
    AGL: "agility",
    AGI: "agility",
    INT: "intellect",
    AWE: "awareness",
    CON: "awareness",
    PRE: "presence",
  };
  return aliases[normalized] ?? "intellect";
}

function isCoreAbilityKey(value: unknown): value is CoreAbilityKey {
  return coreAbilityKeys.includes(value as CoreAbilityKey);
}

function isAdvantageCategory(value: unknown): value is AdvantageCategory {
  return advantageCategories.includes(value as AdvantageCategory);
}

function isTraitKey(value: unknown): value is TraitKey {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(traitLabels, value)
  );
}

function normalizeAbsentTraits(value: readonly unknown[]): AbsentTraitKey[] {
  return absentTraitKeys.filter((key) => value.includes(key));
}

type AbsentTraitSource = {
  absentTraits?: unknown;
  absentAbilities?: unknown;
};

/**
 * Reads explicit absences defensively from current or legacy sheets. This is
 * intentionally non-mutating so opening an older IndexedDB record never
 * rewrites or discards its original payload.
 */
export function getStoredAbsentTraits(
  sheet: AbsentTraitSource,
): AbsentTraitKey[] {
  const value = Array.isArray(sheet.absentTraits)
    ? sheet.absentTraits
    : Array.isArray(sheet.absentAbilities)
      ? sheet.absentAbilities
      : [];
  return normalizeAbsentTraits(value);
}

/**
 * Awareness ausente implica Presence ausente. A função mantém essa dependência
 * fora dos dados persistidos para que desmarcar Awareness restaure a escolha
 * anterior do usuário sem apagar informação.
 */
export function getEffectiveAbsentTraits(
  sheet: AbsentTraitSource,
): ReadonlySet<AbsentTraitKey> {
  const absent = new Set(getStoredAbsentTraits(sheet));
  if (absent.has("awareness")) absent.add("presence");
  return absent;
}

export function isTraitAbsent(
  sheet: AbsentTraitSource,
  key: AbsentTraitKey,
) {
  return getEffectiveAbsentTraits(sheet).has(key);
}

export function isResistanceAbsent(
  sheet: AbsentTraitSource,
  key: ResistanceKey,
) {
  const absent = getEffectiveAbsentTraits(sheet);
  if (key === "fortitude") return absent.has("stamina");
  if (key === "will") {
    return (
      absent.has("intellect") ||
      absent.has("awareness") ||
      absent.has("presence")
    );
  }
  return false;
}

function isArrayRole(
  value: unknown,
): value is PowerEntry["arrayRole"] {
  return (
    value === "none" ||
    value === "base" ||
    value === "alternate" ||
    value === "dynamic"
  );
}

function isRemovable(
  value: unknown,
): value is PowerEntry["removable"] {
  return (
    value === "none" ||
    value === "removable" ||
    value === "easily-removable" ||
    value === "equipment"
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizedLookup(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}
