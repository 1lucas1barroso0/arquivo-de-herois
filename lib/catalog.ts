import type {
  AdvantageCategory,
  CoreAbilityKey,
  PowerEntry,
  TraitKey,
} from "./character";

export const CUSTOM_CATALOG_KEY = "__custom__";
export const TERMINOLOGY_LANGUAGE_KEY = "arquivo-de-herois:idioma:v1";

export type CatalogEntry = {
  id: string;
  label: string;
  canonical: string;
  category: string;
  summary: string;
  aliases?: string[];
};

export type CatalogLanguage = "pt" | "en";

const englishCatalogSummaries: Record<string, string> = {
  battlesuit: "Armor that combines strength, protection, life support, flight, and ranged attacks.",
  blaster: "An energy specialist, usually equipped with flight, a force field, and a powerful blast.",
  construct: "A strong, durable nonliving being that ignores many biological needs.",
  "crime-fighter": "A versatile trained character who relies on skills, advantages, and equipment.",
  gadgeteer: "A technical specialist with varied devices and exceptional flexibility.",
  "martial-artist": "A close-combat specialist with extensive skills, advantages, and maneuvers.",
  mentalist: "Combines telepathy, telekinesis, illusions, and mental attacks.",
  metamorph: "Changes their own body and fighting style.",
  mystic: "A magic user with a broad repertoire and room for improvised effects.",
  paragon: "A classic icon: strong, tough, mobile, and well balanced.",
  powerhouse: "Concentrates power in strength, toughness, and physical endurance.",
  primal: "Animal-inspired powers focused on combat, movement, or senses.",
  speedster: "Overcomes challenges through extreme speed and mobility.",
  warrior: "A superhuman combatant balanced between strength, resilience, and technique.",
  "weapon-expert": "Masters a specific weapon through combat skills and advantages.",
  accident: "The character's powers emerged from an unforeseen event.",
  alien: "The character belongs to another species, world, or dimension.",
  endowment: "A force, entity, or organization granted the character's powers.",
  experiment: "The powers resulted from a deliberate procedure.",
  mutant: "The character was born with extraordinary potential.",
  training: "Exceptional study, discipline, or practice produced these capabilities.",
  acceptance: "Seeks confidence, belonging, or an ordinary life.",
  "doing-good": "Acts because doing good is simply the right thing to do.",
  greed: "Pursues profit or material reward through their actions.",
  justice: "Wants to protect innocent people and hold wrongdoers accountable.",
  patriotism: "Serves the ideals of their homeland or community.",
  recognition: "Seeks attention, respect, or fame.",
  responsibility: "Feels a duty to use their abilities responsibly.",
  thrills: "Seeks adventure, danger, and intense experiences.",
  "accident-complication": "The character causes or suffers troublesome accidents.",
  addiction: "A physical or psychological need creates complications.",
  disability: "A disability creates challenges that matter to the story.",
  enemy: "A person or organization actively tries to harm the character.",
  fame: "Public recognition attracts media attention, fans, and trouble.",
  hatred: "An intense aversion can override the character's better judgment.",
  honor: "A personal code restricts the character's choices and methods.",
  identity: "A double life or transformation creates recurring problems.",
  obsession: "One subject dominates the character's attention and priorities.",
  phobia: "An irrational fear can prevent the character from acting.",
  "power-loss": "Specific circumstances reduce or negate the character's powers.",
  prejudice: "The character faces hostility because they belong to a particular group.",
  quirk: "A habit or personality trait repeatedly causes problems.",
  relationship: "Important people become a source of risk or conflict.",
  reputation: "A negative reputation damages relationships and opportunities.",
  "responsibility-complication": "Personal or professional duties compete for time and attention.",
  rivalry: "Competition pushes the character into taking risks.",
  secret: "Dangerous or embarrassing information must remain hidden.",
  temper: "Specific triggers provoke impulsive reactions.",
  weakness: "Something unusual causes especially severe damage or effects.",
};

const englishCategoryParts: Record<string, string> = {
  "Acessório de arma": "Weapon accessory",
  Alteração: "Alteration",
  "Arma corpo a corpo": "Close-combat weapon",
  "Arma pesada": "Heavy weapon",
  "Arma à distância": "Ranged weapon",
  Armadura: "Armor",
  Arquétipo: "Archetype",
  Ataque: "Attack",
  Comando: "Command",
  Combate: "Combat",
  Complicação: "Complication",
  Configuração: "Configuration",
  Controle: "Control",
  Defesa: "Defense",
  Desvantagem: "Drawback",
  "Especialização de ataque": "Attack specialization",
  Explosivo: "Explosive",
  Extra: "Extra",
  "Extra de resistência": "Resistance extra",
  Falha: "Flaw",
  Fonte: "Source",
  Fortuna: "Fortune",
  Geral: "General",
  Heroica: "Heroic",
  Meio: "Medium",
  Motivação: "Motivation",
  Movimento: "Movement",
  Origem: "Origin",
  Perícia: "Skill",
  Reação: "Reaction",
  Recurso: "Feature",
  "Recurso de instalação": "Installation feature",
  "Recurso de veículo": "Vehicle feature",
  Resistência: "Resistance",
  Resultado: "Result",
  Sensorial: "Sensory",
  "Somente treinada": "Trained only",
  "Uso sem treinamento": "Usable untrained",
  "Utilidade de movimento": "Movement utility",
  "Utilidade defensiva": "Defensive utility",
  "Utilidade geral": "General utility",
  "Veículo aquático": "Water vehicle",
  "Veículo aéreo": "Air vehicle",
  "Veículo espacial": "Space vehicle",
  "Veículo exótico": "Exotic vehicle",
  "Veículo terrestre": "Ground vehicle",
};

export function getCatalogCategory(
  category: string,
  language: CatalogLanguage,
) {
  if (language === "pt") return category;
  return category
    .split(" · ")
    .map((part) => englishCategoryParts[part] ?? part)
    .join(" · ");
}

export function getCatalogSummary(
  entry: CatalogEntry,
  language: CatalogLanguage,
): string {
  if (language === "pt") return entry.summary;
  const exact = englishCatalogSummaries[entry.id];
  if (exact) return exact;

  if ("specializations" in entry) {
    const skillEntry = entry as SkillPreset;
    const count = skillEntry.specializations.length;
    return `${englishAction(skillEntry.action)}; ${count} suggested ${count === 1 ? "specialization" : "specializations"}.`;
  }
  if ("details" in entry) {
    return translateMechanicalDetails((entry as EquipmentPreset).details);
  }
  if (entry.category.startsWith("Configuração")) {
    return `A ready-to-use ${entry.canonical} configuration. Ranks, modifiers, cost, action, range, duration, and resistance remain editable.`;
  }
  if (entry.category === "Extra" || entry.category === "Falha" || entry.category === "Desvantagem" || entry.category === "Recurso") {
    return `${entry.canonical} is a ${getCatalogCategory(entry.category, "en").toLowerCase()} for a power. Its rank and cost are calculated while every detail remains editable.`;
  }
  if (entry.category === "Ataque" || entry.category === "Controle" || entry.category === "Defesa" || entry.category === "Geral" || entry.category === "Movimento" || entry.category === "Sensorial") {
    return `${entry.canonical} is a power effect. The editor calculates its base cost and supports action, range, duration, resistance, extras, and flaws.`;
  }
  return `${entry.canonical} is a ${getCatalogCategory(entry.category, "en").toLowerCase()} option. Its ranks, cost, validation, and editable choices remain linked to the sheet.`;
}

export function getCatalogName(
  entry: CatalogEntry,
  language: CatalogLanguage,
) {
  return language === "pt" ? entry.label : entry.canonical;
}

export function localizeCatalogSelection<T extends CatalogEntry>(
  entry: T,
  language: CatalogLanguage,
): T {
  if (language === "pt") return entry;
  return {
    ...entry,
    label: entry.canonical,
    summary: getCatalogSummary(entry, language),
  };
}

function englishAction(action: string) {
  const actions: Record<string, string> = {
    Livre: "Free action",
    Padrão: "Standard action",
    Simples: "Simple action",
    Varia: "Varies",
  };
  return actions[action] ?? action;
}

function translateMechanicalDetails(value: string) {
  return value
    .replaceAll("Tam.", "Size")
    .replace(/\bFor\b/g, "Str")
    .replace(/\bVel\b/g, "Speed")
    .replace(/\bRob\b/g, "Tou")
    .replaceAll("Dano", "Damage")
    .replaceAll("à distância", "ranged")
    .replaceAll("Penetrante", "Penetrating")
    .replaceAll("baseado em Força", "Strength-based")
    .replaceAll("Recurso configurável", "Configurable feature")
    .replaceAll("graduações adicionais podem ampliar o benefício", "additional ranks may extend the benefit")
    .replaceAll("por graduação", "per rank")
    .replaceAll("por rodada", "per round")
    .replaceAll("escolha", "choose")
    .replaceAll("Escolha", "Choose");
}

export type ArchetypePreset = CatalogEntry & {
  variants: string[];
};

export type SkillPreset = CatalogEntry & {
  ability: CoreAbilityKey;
  trainedOnly: boolean;
  costClass: "regular" | "specialized";
  action: string;
  specializations: string[];
};

export type AdvantagePreset = CatalogEntry & {
  categories: AdvantageCategory[];
  ranked: boolean;
  maxRank?: number;
  focused: boolean;
  kind: "standard" | "equipment";
};

export type PowerEffectPreset = CatalogEntry & {
  effectType: string;
  action: string;
  range: string;
  duration: string;
  check: string;
  resistance: string;
  baseCost: number;
  minBaseCost?: number;
  maxBaseCost?: number;
  isAttack: boolean;
  requiresAttackCheck: boolean;
  attackRange: "close" | "ranged";
  strengthBased: boolean;
  suggestedTrait?: string;
};

export type PowerConfigurationPreset = CatalogEntry & {
  primaryEffectId: string;
  defaultRank: number;
  costPerRank?: number;
  ranksPerPoint?: number;
  totalCost?: number;
  fixedCost?: number;
  fixedDiscount?: number;
  action?: string;
  range?: string;
  duration?: string;
  resistance?: string;
  isAttack?: boolean;
  requiresAttackCheck?: boolean;
  attackRange?: "close" | "ranged";
  strengthBased?: boolean;
  suggestedTrait?: TraitKey;
  traitLinks?: Array<{
    trait: TraitKey;
    mode: "per-rank" | "fixed" | "reference";
    value: number;
  }>;
  containerRemovable?: PowerEntry["removable"];
  requiresChoice?: boolean;
};

export type RankedModifierPreset = CatalogEntry & {
  value: number;
  maxValue?: number;
};

export type FlatModifierPreset = CatalogEntry & {
  rank: number;
  maxRank?: number;
  rule: "generic" | "accurate" | "inaccurate";
};

export type EquipmentPreset = CatalogEntry & {
  type: string;
  cost: number;
  variableCost?: boolean;
  details: string;
  traitBonuses?: Partial<
    Record<"defense" | "dodge" | "toughness", number>
  >;
  attack?: {
    range: "close" | "ranged" | "no-check";
    effectRank: number;
    strengthBased: boolean;
    resistance: string;
  };
};

export const archetypeCatalog: ArchetypePreset[] = [
  archetype("battlesuit", "Armadura de Combate", "Battlesuit", "Armadura que reúne força, proteção, suporte de vida, voo e ataque à distância."),
  archetype("blaster", "Disparador", "Blaster", "Especialista em energia, normalmente com voo, campo de força e rajada.", []),
  archetype("construct", "Construto", "Construct", "Ser não vivo resistente, forte e imune a muitas necessidades biológicas."),
  archetype("crime-fighter", "Combatente do Crime", "Crime-Fighter", "Herói versátil que depende de treinamento, vantagens e equipamento."),
  archetype("gadgeteer", "Inventor", "Gadgeteer", "Especialista técnico com dispositivos variados e grande flexibilidade."),
  archetype("martial-artist", "Artista Marcial", "Martial Artist", "Combatente corpo a corpo com muitas perícias, vantagens e manobras."),
  archetype("mentalist", "Mentalista", "Mentalist", "Combina telepatia, telecinese, ilusões e ataques mentais."),
  archetype("metamorph", "Metamorfo", "Metamorph", "Altera o próprio corpo e estilo de combate.", ["Elastimorfo", "Maximorfo", "Minimorfo"]),
  archetype("mystic", "Místico", "Mystic", "Usuário de magia com repertório amplo e efeitos improvisados."),
  archetype("paragon", "Ícone", "Paragon", "Herói clássico: forte, resistente, voador e equilibrado."),
  archetype("powerhouse", "Colosso", "Powerhouse", "Concentra poder em força, robustez e persistência física."),
  archetype("primal", "Primal", "Primal", "Poderes animais voltados a combate, mobilidade ou sentidos.", ["Fera", "Ave", "Inseto"]),
  archetype("speedster", "Velocista", "Speedster", "Vence desafios por mobilidade extrema e rapidez.", ["Corredor", "Voador", "Teleportador"]),
  archetype("warrior", "Guerreiro", "Warrior", "Combatente super-humano equilibrado entre força, resistência e técnica."),
  archetype("weapon-expert", "Especialista em Armas", "Weapon Expert", "Domina uma arma específica com perícias e vantagens de combate."),
];

export const heroOriginCatalog: CatalogEntry[] = [
  simple("accident", "Acidente", "Accident", "Origem", "Os poderes surgiram de um evento imprevisto."),
  simple("alien", "Alienígena", "Alien", "Origem", "O personagem pertence a outra espécie, mundo ou dimensão."),
  simple("endowment", "Concessão", "Endowment", "Origem", "Uma força, entidade ou organização concedeu os poderes."),
  simple("experiment", "Experimento", "Experiment", "Origem", "Os poderes resultaram de um procedimento deliberado."),
  simple("mutant", "Mutante", "Mutant", "Origem", "O personagem nasceu com potencial extraordinário."),
  simple("training", "Treinamento", "Training", "Origem", "Estudo, disciplina ou prática excepcional produziram as capacidades."),
];

export const motivationCatalog: CatalogEntry[] = [
  simple("acceptance", "Aceitação", "Acceptance", "Motivação", "Busca confiança, pertencimento ou uma vida normal."),
  simple("doing-good", "Fazer o Bem", "Doing Good", "Motivação", "Age porque acredita que é a coisa certa."),
  simple("greed", "Ganância", "Greed", "Motivação", "Persegue lucro ou retorno material por sua atuação."),
  simple("justice", "Justiça", "Justice", "Motivação", "Quer proteger inocentes e responsabilizar culpados."),
  simple("patriotism", "Patriotismo", "Patriotism", "Motivação", "Serve aos ideais de sua terra ou comunidade."),
  simple("recognition", "Reconhecimento", "Recognition", "Motivação", "Deseja atenção, respeito ou fama."),
  simple("responsibility", "Responsabilidade", "Responsibility", "Motivação", "Sente o dever de usar bem aquilo que possui."),
  simple("thrills", "Emoção", "Thrills", "Motivação", "Procura aventura, perigo e experiências intensas."),
];

export const complicationCatalog: CatalogEntry[] = [
  ...motivationCatalog,
  simple("accident-complication", "Acidente", "Accident", "Complicação", "O personagem causa ou sofre acidentes problemáticos."),
  simple("addiction", "Dependência", "Addiction", "Complicação", "Uma necessidade física ou psicológica cria dificuldades."),
  simple("disability", "Deficiência", "Disability", "Complicação", "Uma deficiência impõe desafios relevantes à história."),
  simple("enemy", "Inimigo", "Enemy", "Complicação", "Uma pessoa ou organização procura prejudicar o personagem."),
  simple("fame", "Fama", "Fame", "Complicação", "A notoriedade atrai mídia, fãs e problemas."),
  simple("hatred", "Ódio", "Hatred", "Complicação", "Uma aversão intensa supera o melhor julgamento."),
  simple("honor", "Honra", "Honor", "Complicação", "Um código pessoal restringe escolhas e métodos."),
  simple("identity", "Identidade", "Identity", "Complicação", "A vida dupla ou a transformação causa problemas."),
  simple("obsession", "Obsessão", "Obsession", "Complicação", "Um assunto domina a atenção e as prioridades."),
  simple("phobia", "Fobia", "Phobia", "Complicação", "Um medo irracional pode impedir o personagem de agir."),
  simple("power-loss", "Perda de Poder", "Power Loss", "Complicação", "Certas circunstâncias reduzem ou anulam poderes."),
  simple("prejudice", "Preconceito", "Prejudice", "Complicação", "O personagem enfrenta hostilidade por pertencer a um grupo."),
  simple("quirk", "Peculiaridade", "Quirk", "Complicação", "Um hábito ou traço de personalidade gera problemas."),
  simple("relationship", "Relacionamento", "Relationship", "Complicação", "Pessoas importantes tornam-se fonte de risco ou conflito."),
  simple("reputation", "Reputação", "Reputation", "Complicação", "Uma fama negativa prejudica relações e oportunidades."),
  simple("responsibility-complication", "Responsabilidade", "Responsibility", "Complicação", "Deveres pessoais ou profissionais disputam tempo e atenção."),
  simple("rivalry", "Rivalidade", "Rivalry", "Complicação", "A competição leva o personagem a assumir riscos."),
  simple("secret", "Segredo", "Secret", "Complicação", "Uma informação perigosa ou embaraçosa deve permanecer oculta."),
  simple("temper", "Temperamento", "Temper", "Complicação", "Gatilhos específicos provocam reações impulsivas."),
  simple("weakness", "Fraqueza", "Weakness", "Complicação", "Algo incomum causa dano ou efeitos especialmente graves."),
];

export const skillCatalog: SkillPreset[] = [
  skill("acrobatics", "Acrobacia", "Acrobatics", "agility", false, "regular", "Varia", ["Equilíbrio", "Contorção", "Manobras", "Levantar-se", "Rolamento"]),
  skill("athletics", "Atletismo", "Athletics", "strength", false, "regular", "Simples", ["Escalada", "Salto", "Corrida", "Natação"]),
  skill("deception", "Enganação", "Deception", "presence", false, "regular", "Padrão", ["Blefe", "Distração", "Imitação", "Insinuação", "Resistir", "Truque"]),
  skill("dexterity", "Destreza", "Dexterity", "agility", false, "regular", "Padrão", ["Apanhar", "Ocultar", "Escapar", "Plantar", "Prestidigitação", "Furtar"]),
  skill("expertise", "Especialidade (Expertise)", "Expertise", "intellect", true, "specialized", "Varia", ["Área de especialidade", "Lidar com animais", "Disfarce", "Montaria"]),
  skill("insight", "Intuição", "Insight", "awareness", false, "regular", "Livre", ["Evitar influência", "Detectar falsidade", "Detectar influência", "Avaliar", "Insinuação"]),
  skill("intimidation", "Intimidação", "Intimidation", "presence", false, "regular", "Padrão", ["Coagir", "Desmoralizar", "Resistir"]),
  skill("investigation", "Investigação", "Investigation", "intellect", true, "regular", "Varia", ["Analisar evidência", "Coletar evidência", "Obter informação", "Buscar", "Vigilância"]),
  skill("leadership", "Liderança", "Leadership", "presence", true, "regular", "Varia", ["Coordenar", "Contrapor", "Superar impressões", "Influenciar"]),
  skill("medicine", "Medicina", "Medicine", "intellect", true, "regular", "Padrão", ["Diagnóstico", "Doenças e toxinas", "Cuidados", "Reanimar", "Estabilizar", "Conhecimento médico"]),
  skill("magic", "Magia", "Magic", "intellect", true, "regular", "Varia", ["Construção", "Desativação", "Conhecimento mágico", "Reparo", "Técnica"]),
  skill("perception", "Percepção", "Perception", "awareness", false, "regular", "Livre", ["Visão", "Audição", "Olfato", "Tato", "Outro sentido específico"]),
  skill("performance", "Atuação", "Performance", "presence", true, "specialized", "Padrão", ["Interpretação", "Comédia", "Dança", "Teclado", "Oratória", "Percussão", "Poesia", "Canto", "Cordas", "Sopros"]),
  skill("persuasion", "Persuasão", "Persuasion", "presence", false, "regular", "Varia", ["Negociação", "Influência", "Grupo social", "Ambiente social"]),
  skill("stealth", "Furtividade", "Stealth", "agility", false, "regular", "Simples", ["Esconder-se", "Esgueirar-se", "Seguir", "Ambiente", "Terreno"]),
  skill("survival", "Sobrevivência", "Survival", "awareness", true, "regular", "Varia", ["Evitar perigos", "Forragear", "Navegação", "Construção simples", "Conhecimento de sobrevivência", "Rastrear", "Ambiente", "Terreno"]),
  skill("technology", "Tecnologia", "Technology", "intellect", true, "regular", "Varia", ["Computadores", "Construção", "Desativação", "Eletrônica", "Operação", "Mecânica", "Reparo", "Segurança", "Conhecimento tecnológico"]),
  skill("vehicles", "Veículos", "Vehicles", "agility", true, "regular", "Padrão", ["Condução", "Navegação", "Pilotagem", "Conhecimento de veículos"]),
];

type AdvantageRow = readonly [
  string,
  string,
  string,
  readonly AdvantageCategory[],
  boolean,
  number | undefined,
  boolean,
  string,
];

const advantageRows: readonly AdvantageRow[] = [
  ["alternate-feint", "Finta Alternativa", "Alternate Feint", ["Combate"], false, undefined, true, "Use outro traço para fintar."],
  ["alternate-initiative", "Iniciativa Alternativa", "Alternate Initiative", ["Combate"], false, undefined, true, "Baseie a iniciativa em um atributo mental."],
  ["assessment", "Avaliação", "Assessment", ["Geral"], true, undefined, false, "Use Intuição para analisar capacidades de combate."],
  ["beginners-luck", "Sorte de Principiante", "Beginner's Luck", ["Fortuna"], false, undefined, false, "Eleve temporariamente uma perícia pouco desenvolvida."],
  ["benefit", "Benefício", "Benefit", ["Geral"], true, undefined, true, "Adquira um privilégio ou recurso significativo."],
  ["blind-attack", "Ataque às Cegas", "Blind Attack", ["Combate"], false, undefined, true, "Ignore penalidades de ocultação para um tipo de ataque."],
  ["connections", "Conexões", "Connections", ["Perícia"], false, undefined, false, "Peça assistência por Persuasão ou Especialidade."],
  ["contacts", "Contatos", "Contacts", ["Perícia"], false, undefined, false, "Faça rapidamente a primeira busca de informação."],
  ["counterattack", "Contra-ataque", "Counterattack", ["Combate"], false, undefined, false, "Reaja contra quem atacou e saiu do seu alcance."],
  ["damaging-escape", "Fuga Danosa", "Damaging Escape", ["Combate", "Reação"], false, undefined, false, "Ataque imediatamente após escapar."],
  ["damaging-grab", "Agarrão Danoso", "Damaging Grab", ["Combate", "Reação"], false, undefined, false, "Cause dano ao agarrar com sucesso."],
  ["dazing-interaction", "Interação Desconcertante", "Dazing Interaction", ["Perícia"], false, undefined, true, "Use uma impressão para atordoar ou deixar pasmo."],
  ["defensive-grab", "Agarrão Defensivo", "Defensive Grab", ["Combate", "Reação"], false, undefined, false, "Agarre quem acabou de errar um ataque."],
  ["defensive-roll", "Rolamento Defensivo", "Defensive Roll", ["Combate"], true, undefined, false, "Concede +1 em Robustez por graduação."],
  ["defensive-throw", "Arremesso Defensivo", "Defensive Throw", ["Combate", "Reação"], false, undefined, false, "Derrube quem acabou de errar um ataque."],
  ["determination", "Determinação", "Determination", ["Heroica"], true, undefined, false, "Remova uma condição ou repita uma resistência."],
  ["diehard", "Duro de Matar", "Diehard", ["Geral"], false, undefined, false, "Estabilize-se enquanto estiver morrendo."],
  ["direct-action", "Ação Direcionada", "Direct Action", ["Comando"], false, undefined, false, "Permita que um aliado execute uma ação dirigida."],
  ["distracting-interaction", "Interação Distrativa", "Distracting Interaction", ["Perícia"], false, undefined, true, "Use outra perícia para distrair com uma impressão."],
  ["dive-for-cover", "Mergulho para Cobertura", "Dive for Cover", ["Comando", "Reação"], true, 2, false, "Ajude aliados a se jogarem no chão."],
  ["edit-scene", "Editar Cena", "Edit Scene", ["Heroica"], true, undefined, false, "Faça uma pequena alteração narrativa na cena."],
  ["eidetic-memory", "Memória Eidética", "Eidetic Memory", ["Geral"], false, undefined, false, "Recorde com precisão e melhore testes de memória."],
  ["elusive-target", "Alvo Esquivo", "Elusive Target", ["Combate"], true, undefined, false, "Ganhe cobertura contra ataques à distância em combate próximo."],
  ["encourage", "Encorajar", "Encourage", ["Comando", "Fortuna"], false, undefined, false, "Gaste um Ponto Heroico para apoiar um aliado."],
  ["equipment", "Equipamento", "Equipment", ["Geral"], true, undefined, false, "Cada graduação concede 5 Pontos de Equipamento."],
  ["extraordinary-effort", "Esforço Extraordinário", "Extraordinary Effort", ["Geral"], false, undefined, false, "Obtenha dois benefícios ao usar Esforço Extra."],
  ["fallen-inspiration", "Inspiração Derradeira", "Fallen Inspiration", ["Fortuna"], true, undefined, false, "Gere um Ponto Heroico adicional ao ficar incapacitado."],
  ["fascinating-interaction", "Interação Fascinante", "Fascinating Interaction", ["Perícia"], false, undefined, true, "Use interação para atordoar fora do combate."],
  ["fast-feint", "Finta Rápida", "Fast Feint", ["Combate", "Perícia"], false, undefined, false, "Faça uma finta como ação simples sem penalidade."],
  ["favored-environment", "Ambiente Favorito", "Favored Environment", ["Combate"], false, undefined, true, "Receba bônus de ataque ou defesa em um ambiente."],
  ["favored-foe", "Inimigo Favorito", "Favored Foe", ["Perícia"], true, 2, true, "Melhore perícias contra um tipo de oponente."],
  ["fearless", "Destemido", "Fearless", ["Geral"], true, 2, false, "Reduza ou ignore efeitos de medo."],
  ["fearsome-presence", "Presença Aterradora", "Fearsome Presence", ["Perícia"], false, undefined, false, "Intimide gratuitamente ao aparecer ou agir."],
  ["grabbing-block", "Bloqueio Agarrador", "Grabbing Block", ["Combate"], false, undefined, false, "Agarre depois de contrapor um ataque próximo."],
  ["grabbing-finesse", "Finesse de Agarrão", "Grabbing Finesse", ["Combate"], false, undefined, false, "Agarre usando apenas um braço."],
  ["grabbing-throw", "Arremesso de Agarrão", "Grabbing Throw", ["Combate", "Reação"], false, undefined, false, "Arremesse um alvo que você mantém agarrado."],
  ["great-endurance", "Grande Resistência", "Great Endurance", ["Geral"], false, undefined, false, "Melhore testes específicos de Vigor e Fortitude."],
  ["guidance", "Orientação", "Guidance", ["Heroica"], true, undefined, false, "Receba uma pista ou percepção decisiva."],
  ["hide-in-plain-sight", "Esconder-se à Vista", "Hide in Plain Sight", ["Perícia"], false, undefined, false, "Use Furtividade mesmo enquanto é observado."],
  ["holding-back", "Conter-se", "Holding Back", ["Fortuna"], true, undefined, false, "Aumente temporariamente PL ou traços mediante custo."],
  ["immediate-team-attack", "Ataque em Equipe Imediato", "Immediate Team Attack", ["Combate", "Comando", "Reação"], true, undefined, false, "Aliados entram em um ataque em equipe como reação."],
  ["impressive-superiority", "Superioridade Impressionante", "Impressive Superiority", ["Combate", "Reação", "Perícia"], false, undefined, false, "Impressione um inimigo que acabou de falhar."],
  ["improved-aim", "Mira Aprimorada", "Improved Aim", ["Combate"], false, undefined, false, "Ganhe Sorte no dado bônus de mirar."],
  ["improved-critical", "Crítico Aprimorado", "Improved Critical", ["Combate"], true, 4, true, "Amplie a margem de crítico de um ataque."],
  ["improved-defense", "Defesa Aprimorada", "Improved Defense", ["Combate"], false, undefined, false, "Receba +2 em Defesa ao defender."],
  ["improved-disarm", "Desarmar Aprimorado", "Improved Disarm", ["Combate"], true, 2, false, "Reduza ou elimine a penalidade para desarmar."],
  ["improved-evasion", "Evasão Aprimorada", "Improved Evasion", ["Combate", "Reação"], true, 2, false, "Melhore Esquiva contra áreas e escape delas."],
  ["improved-grab", "Agarrar Aprimorado", "Improved Grab", ["Combate"], false, undefined, false, "Escolha o traço usado para resistir ao agarrão."],
  ["improved-hold", "Imobilização Aprimorada", "Improved Hold", ["Combate"], false, undefined, false, "Imponha dado de penalidade em fugas."],
  ["improved-initiative", "Iniciativa Aprimorada", "Improved Initiative", ["Combate"], false, undefined, false, "Receba um dado bônus em iniciativa."],
  ["improved-interpose", "Interpor-se Aprimorado", "Improved Interpose", ["Combate", "Reação"], true, 2, false, "Amplie as opções e proteção ao se interpor."],
  ["improved-revive", "Reanimar Aprimorado", "Improved Revive", ["Perícia"], false, undefined, false, "Conceda benefícios adicionais ao reanimar com Medicina."],
  ["improved-smash", "Quebrar Aprimorado", "Improved Smash", ["Combate"], false, undefined, false, "Ignore a penalidade ao quebrar objetos."],
  ["improved-team-attack", "Ataque em Equipe Aprimorado", "Improved Team Attack", ["Combate"], true, undefined, false, "Contribua mesmo com diferença maior de graduação."],
  ["improved-trip", "Derrubar Aprimorado", "Improved Trip", ["Combate"], false, undefined, false, "Escolha o traço usado para resistir à derrubada."],
  ["improvised-effect", "Efeito Improvisado", "Improvised Effect", ["Perícia"], false, undefined, true, "Prepare um efeito usando uma perícia técnica."],
  ["improvised-tools", "Ferramentas Improvisadas", "Improvised Tools", ["Perícia"], false, undefined, false, "Ignore a penalidade por falta de ferramentas."],
  ["inspiration", "Inspiração", "Inspiration", ["Comando", "Fortuna"], true, 5, false, "Conceda bônus temporário aos aliados."],
  ["instant-up", "Levantar Instantâneo", "Instant Up", ["Geral"], false, undefined, false, "Levante-se sem os requisitos normais."],
  ["jack-of-all-trades", "Pau para Toda Obra", "Jack-of-All-Trades", ["Perícia"], false, undefined, false, "Use perícias não especializadas sem treinamento."],
  ["know-it-all", "Sabe-Tudo", "Know-It-All", ["Perícia"], false, undefined, false, "Use Especialidades de Intelecto sem treinamento."],
  ["luck", "Sorte", "Luck", ["Heroica"], true, undefined, false, "Repita uma rolagem uma vez por graduação."],
  ["menacing-attack", "Ataque Ameaçador", "Menacing Attack", ["Combate", "Reação"], false, undefined, false, "Intimide após incapacitar um inimigo."],
  ["minion", "Lacaio", "Minion", ["Geral"], true, undefined, true, "Adquira um seguidor com PP baseados na graduação."],
  ["multilingual", "Multilíngue", "Multilingual", ["Perícia"], false, undefined, false, "Conheça idiomas incomuns adicionais."],
  ["partner-bond", "Vínculo de Parceiros", "Partner Bond", ["Fortuna", "Heroica"], true, undefined, true, "Encoraje um parceiro escolhido uma vez por sessão."],
  ["precise-attack", "Ataque Preciso", "Precise Attack", ["Combate"], false, undefined, true, "Ignore parte das penalidades de cobertura."],
  ["prepared-effect", "Efeito Preparado", "Prepared Effect", ["Heroica"], true, undefined, false, "Mantenha efeitos improvisados preparados por sessão."],
  ["prone-fighting", "Combate Caído", "Prone Fighting", ["Combate"], false, undefined, false, "Lute sem penalidades enquanto estiver caído."],
  ["quick-counter", "Contraposição Rápida", "Quick Counter", ["Geral", "Reação"], false, undefined, true, "Contraponha um efeito escolhido como reação."],
  ["ranged-pin", "Imobilização à Distância", "Ranged Pin", ["Combate"], false, undefined, false, "Deixe o alvo imóvel e vulnerável à distância."],
  ["redirect", "Redirecionar", "Redirect", ["Combate", "Reação"], false, undefined, false, "Desvie um ataque errado para outro alvo."],
  ["reverse-hold", "Reverter Imobilização", "Reverse Hold", ["Combate", "Reação"], false, undefined, false, "Agarre o oponente depois de escapar."],
  ["reviving-team-attack", "Ataque em Equipe Revigorante", "Reviving Team Attack", ["Combate"], false, undefined, false, "Remova uma condição ao participar de um ataque em equipe."],
  ["ricochet-advantage", "Ricochete", "Ricochet", ["Combate"], true, undefined, true, "Faça um ataque à distância mudar de direção."],
  ["riposte", "Resposta", "Riposte", ["Combate", "Reação"], false, undefined, false, "Ataque corpo a corpo quem acabou de errar você."],
  ["rush-of-victory", "Ímpeto da Vitória", "Rush of Victory", ["Combate", "Comando", "Fortuna", "Reação"], false, undefined, false, "Ajude aliados ao incapacitar um inimigo."],
  ["seize-initiative", "Tomar a Iniciativa", "Seize Initiative", ["Fortuna"], false, undefined, false, "Gaste um Ponto Heroico para agir primeiro."],
  ["set-up", "Preparar", "Set-Up", ["Combate"], true, undefined, false, "Transfira benefícios de finta ou impressão a aliados."],
  ["sidekick", "Parceiro", "Sidekick", ["Geral"], true, undefined, false, "Adquira um parceiro com PP baseados na graduação."],
  ["skill-mastery", "Maestria em Perícia", "Skill Mastery", ["Perícia"], false, undefined, true, "Faça testes de rotina com uma perícia escolhida."],
  ["sleeper-hold", "Estrangulamento", "Sleeper Hold", ["Combate"], false, undefined, false, "Use um agarrão para incapacitar."],
  ["specialization-bonus", "Bônus de Especialização", "Specialization Bonus", ["Perícia"], false, undefined, true, "Ganhe dado bônus em uma especialização."],
  ["split-attack", "Ataque Dividido", "Split Attack", ["Combate"], true, undefined, true, "Divida um ataque entre alvos."],
  ["stunning-strike", "Golpe Atordoante", "Stunning Strike", ["Combate"], false, undefined, false, "Use ataque desarmado para pasmar ou atordoar."],
  ["tactical-advance", "Avanço Tático", "Tactical Advance", ["Combate", "Comando", "Reação"], false, undefined, false, "Aliados avançam quando você atordoa um alvo."],
  ["takedown", "Derrubar Lacaios", "Takedown", ["Combate"], true, 2, false, "Faça ataques extras após incapacitar um lacaio."],
  ["taunting-interaction", "Interação Provocadora", "Taunting Interaction", ["Perícia"], false, undefined, true, "Use impressão para prejudicar ou desabilitar."],
  ["team-code", "Código de Equipe", "Team Code", ["Perícia"], false, undefined, false, "Comunique táticas discretamente com a equipe."],
  ["teamwork", "Trabalho em Equipe", "Teamwork", ["Geral"], false, undefined, false, "Receba +5 em testes de equipe."],
  ["throwing-mastery", "Maestria em Arremesso", "Throwing Mastery", ["Combate"], true, undefined, false, "Aumente o dano com armas arremessadas."],
  ["trance", "Transe", "Trance", ["Geral"], false, undefined, false, "Entre em transe e reduza funções corporais."],
  ["ultimate-effort", "Esforço Supremo", "Ultimate Effort", ["Fortuna"], false, undefined, true, "Gaste um Ponto Heroico para obter resultado 20."],
  ["uncanny-dodge", "Esquiva Sobrenatural", "Uncanny Dodge", ["Combate"], false, undefined, false, "Evite ficar vulnerável ou surpreso quando desatento."],
  ["untapped-potential", "Potencial Inexplorado", "Untapped Potential", ["Heroica"], false, undefined, false, "Receba graduações extras com Esforço Extra."],
  ["up-and-at-em", "De Pé e à Luta", "Up and At 'Em", ["Combate", "Comando"], false, undefined, false, "Permita que aliados se levantem imediatamente."],
  ["variable-team-attack", "Ataque em Equipe Variável", "Variable Team Attack", ["Combate"], false, undefined, false, "Aplique descritor variável a um ataque em equipe."],
  ["weapon-bind", "Prender Arma", "Weapon Bind", ["Combate", "Reação"], false, undefined, false, "Desarme como reação quando erram você."],
  ["weapon-break", "Quebrar Arma", "Weapon Break", ["Combate", "Reação"], false, undefined, false, "Quebre uma arma como reação quando erram você."],
  ["well-equipped", "Bem Equipado", "Well-Equipped", ["Heroica"], true, undefined, false, "Produza um item ou 5 PE por uso."],
  ["well-informed", "Bem Informado", "Well-Informed", ["Perícia"], false, undefined, false, "Faça imediatamente um teste por informação disponível."],
];

export const advantageCatalog: AdvantagePreset[] = advantageRows.map(
  ([id, label, canonical, categories, ranked, maxRank, focused, summary]) => ({
    id,
    label,
    canonical,
    category: categories.join(" · "),
    summary,
    categories: [...categories],
    ranked,
    ...(maxRank ? { maxRank } : {}),
    focused,
    kind: id === "equipment" ? "equipment" : "standard",
  }),
);

type EffectRow = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  number,
  number | undefined,
  boolean,
  boolean,
  "close" | "ranged",
  boolean,
];

const effectRows: readonly EffectRow[] = [
  ["affliction", "Aflição", "Affliction", "Ataque", "Padrão", "Perto", "Instantânea", "Ataque vs. Defesa", "Escolha a resistência", 1, undefined, true, true, "close", false],
  ["burrowing", "Escavação", "Burrowing", "Movimento", "Livre", "Pessoal", "Sustentada", "", "", 1, undefined, false, false, "close", false],
  ["communication", "Comunicação", "Communication", "Sensorial", "Livre", "Graduação", "Sustentada", "", "", 2, undefined, false, false, "ranged", false],
  ["comprehend", "Compreensão", "Comprehend", "Sensorial", "Livre", "Pessoal", "Permanente", "", "", 2, undefined, false, false, "close", false],
  ["concealment", "Ocultação", "Concealment", "Sensorial", "Livre", "Pessoal", "Sustentada", "", "", 2, undefined, false, false, "close", false],
  ["counter", "Contrapor", "Counter", "Controle", "Padrão", "À distância", "Instantânea", "Ataque vs. Defesa", "Efeito vs. efeito", 1, undefined, true, true, "ranged", false],
  ["create", "Criação", "Create", "Controle", "Padrão", "À distância", "Sustentada", "Ataque vs. Defesa", "Defesa vs. efeito", 2, undefined, true, true, "ranged", false],
  ["damage", "Dano", "Damage", "Ataque", "Padrão", "Perto", "Instantânea", "Ataque vs. Defesa", "Robustez vs. efeito", 1, undefined, true, true, "close", false],
  ["dimensional-travel", "Viagem Dimensional", "Dimensional Travel", "Movimento", "Padrão", "Pessoal", "Instantânea", "", "", 2, undefined, false, false, "close", false],
  ["elongation", "Alongamento", "Elongation", "Alteração", "Livre", "Pessoal", "Sustentada", "", "", 1, undefined, false, false, "close", false],
  ["enhanced-movement", "Movimento Aprimorado", "Enhanced Movement", "Movimento", "Livre", "Pessoal", "Sustentada", "", "", 1, undefined, false, false, "close", false],
  ["enhanced-resistance", "Resistência Aprimorada", "Enhanced Resistance", "Defesa", "Nenhuma", "Pessoal", "Permanente", "", "", 1, undefined, false, false, "close", false],
  ["enhanced-senses", "Sentidos Aprimorados", "Enhanced Senses", "Sensorial", "Nenhuma", "Pessoal", "Permanente", "", "", 1, undefined, false, false, "close", false],
  ["enhanced-strength", "Força Aprimorada", "Enhanced Strength", "Geral", "Nenhuma", "Pessoal", "Permanente", "", "", 2, undefined, false, false, "close", false],
  ["enhanced-trait", "Traço Aprimorado", "Enhanced Trait", "Geral", "Nenhuma", "Pessoal", "Permanente", "", "", 1, 2, false, false, "close", false],
  ["environment", "Ambiente", "Environment", "Controle", "Livre", "Graduação", "Sustentada", "", "", 1, undefined, false, false, "ranged", false],
  ["extra-limbs", "Membros Extras", "Extra Limbs", "Alteração", "Nenhuma", "Pessoal", "Permanente", "", "", 1, undefined, false, false, "close", false],
  ["feature", "Recurso", "Feature", "Geral", "Nenhuma", "Pessoal", "Permanente", "", "", 1, undefined, false, false, "close", false],
  ["flight", "Voo", "Flight", "Movimento", "Livre", "Pessoal", "Sustentada", "", "", 2, undefined, false, false, "close", false],
  ["fortune-control", "Controle da Fortuna", "Fortune Control", "Controle", "Nenhuma", "Percepção", "Instantânea", "", "", 3, undefined, false, false, "ranged", false],
  ["growth", "Crescimento", "Growth", "Alteração", "Livre", "Pessoal", "Contínua", "", "", 1, undefined, false, false, "close", false],
  ["healing", "Cura", "Healing", "Geral", "Padrão", "Perto", "Instantânea", "Efeito vs. CD 10", "", 2, undefined, false, false, "close", false],
  ["illusion", "Ilusão", "Illusion", "Sensorial", "Padrão", "À distância", "Concentração", "", "Percepção vs. efeito", 1, 5, true, false, "ranged", false],
  ["immortality", "Imortalidade", "Immortality", "Defesa", "Nenhuma", "Pessoal", "Permanente", "", "", 1, undefined, false, false, "close", false],
  ["immunity", "Imunidade", "Immunity", "Defesa", "Nenhuma", "Pessoal", "Permanente", "", "", 1, undefined, false, false, "close", false],
  ["insubstantial", "Insubstancial", "Insubstantial", "Alteração", "Livre", "Pessoal", "Sustentada", "", "", 10, undefined, false, false, "close", false],
  ["leaping", "Salto", "Leaping", "Movimento", "Livre", "Pessoal", "Instantânea", "", "", 1, undefined, false, false, "close", false],
  ["lifting", "Erguer", "Lifting", "Geral", "Livre", "Pessoal", "Sustentada", "", "", 1, undefined, false, false, "close", false],
  ["mind-reading", "Leitura Mental", "Mind Reading", "Sensorial", "Padrão", "Percepção", "Sustentada", "Efeito vs. Vontade", "Vontade vs. efeito", 2, undefined, true, false, "ranged", false],
  ["morph", "Morfose", "Morph", "Alteração", "Livre", "Pessoal", "Sustentada", "", "", 5, undefined, false, false, "close", false],
  ["move-object", "Mover Objeto", "Move Object", "Controle", "Padrão", "À distância", "Sustentada", "Ataque vs. Defesa", "Força vs. efeito", 2, undefined, true, true, "ranged", false],
  ["obscure", "Obscurecer", "Obscure", "Sensorial", "Padrão", "À distância", "Sustentada", "", "", 1, 20, false, false, "ranged", false],
  ["permeate", "Permeação", "Permeate", "Movimento", "Livre", "Pessoal", "Sustentada", "", "", 3, undefined, false, false, "close", false],
  ["postcognition", "Pós-cognição", "Postcognition", "Sensorial", "Padrão", "Pessoal", "Concentração", "", "", 1, undefined, false, false, "close", false],
  ["precognition", "Precognição", "Precognition", "Sensorial", "Nenhuma", "Pessoal", "Permanente", "", "", 1, undefined, false, false, "close", false],
  ["quickness", "Rapidez", "Quickness", "Geral", "Livre", "Pessoal", "Sustentada", "", "", 1, undefined, false, false, "close", false],
  ["regeneration", "Regeneração", "Regeneration", "Defesa", "Nenhuma", "Pessoal", "Permanente", "", "", 2, undefined, false, false, "close", false],
  ["remote-sensing", "Sentidos Remotos", "Remote Sensing", "Sensorial", "Livre", "Graduação", "Sustentada", "", "", 5, 10, false, false, "ranged", false],
  ["shrinking", "Encolhimento", "Shrinking", "Alteração", "Livre", "Pessoal", "Contínua", "", "", 1, undefined, false, false, "close", false],
  ["space-travel", "Viagem Espacial", "Space Travel", "Movimento", "Livre", "Pessoal", "Sustentada", "", "", 2, undefined, false, false, "close", false],
  ["speed", "Velocidade", "Speed", "Movimento", "Livre", "Pessoal", "Sustentada", "", "", 1, undefined, false, false, "close", false],
  ["summon", "Invocação", "Summon", "Controle", "Padrão", "Perto", "Sustentada", "", "", 2, undefined, false, false, "close", false],
  ["swimming", "Natação", "Swimming", "Movimento", "Livre", "Pessoal", "Sustentada", "", "", 1, undefined, false, false, "close", false],
  ["swinging", "Balançar-se", "Swinging", "Movimento", "Livre", "Pessoal", "Sustentada", "", "", 1, undefined, false, false, "close", false],
  ["teleport", "Teleporte", "Teleport", "Movimento", "Simples", "Graduação", "Instantânea", "", "", 2, undefined, false, false, "ranged", false],
  ["transmute", "Transmutação", "Transmute", "Controle", "Padrão", "Perto", "Sustentada", "Ataque vs. Defesa", "Esquiva", 2, 5, true, true, "close", false],
  ["variable", "Variável", "Variable", "Geral", "Padrão", "Pessoal", "Contínua", "", "", 8, undefined, false, false, "close", false],
];

export const powerEffectCatalog: PowerEffectPreset[] = effectRows.map(
  ([id, label, canonical, effectType, action, range, duration, check, resistance, baseCost, maxBaseCost, isAttack, requiresAttackCheck, attackRange, strengthBased]) => ({
    id,
    label,
    canonical,
    category: effectType,
    summary: effectSummary(id),
    effectType,
    action,
    range,
    duration,
    check,
    resistance,
    baseCost,
    ...(id === "enhanced-resistance" ? { minBaseCost: 0 } : {}),
    ...(maxBaseCost ? { maxBaseCost } : {}),
    isAttack,
    requiresAttackCheck,
    attackRange,
    strengthBased,
    ...(id === "enhanced-strength" ? { suggestedTrait: "strength" } : {}),
  }),
);

export const powerConfigurationCatalog: PowerConfigurationPreset[] = [
  configuration("affliction-aura", "Aura de Aflição", "Affliction Aura", "affliction", "Aflição em aura; 4 PP por graduação.", { costPerRank: 4, isAttack: true, requiresAttackCheck: false }),
  configuration("dazzle", "Ofuscar", "Dazzle", "affliction", "Aflição à distância contra um sentido; 2 PP por graduação.", { costPerRank: 2, range: "À distância", attackRange: "ranged" }),
  configuration("hallucination", "Alucinação", "Hallucination", "affliction", "Aflição com alcance Percepção; 3 PP por graduação.", { costPerRank: 3, range: "Percepção", requiresAttackCheck: false, attackRange: "ranged" }),
  configuration("lower-trait", "Reduzir Traço", "Lower [Trait]", "affliction", "Reduz um traço escolhido; 1 PP por graduação.", { costPerRank: 1, requiresChoice: true }),
  configuration("mind-control", "Controle Mental", "Mind Control", "affliction", "Aflição mental com alcance Percepção; 3 PP por graduação.", { costPerRank: 3, range: "Percepção", resistance: "Vontade", requiresAttackCheck: false, attackRange: "ranged" }),
  configuration("paralyze", "Paralisar", "Paralyze", "affliction", "Aflição que restringe movimento; 1 PP por graduação.", { costPerRank: 1 }),
  configuration("slip", "Escorregar", "Slip", "affliction", "Aflição à distância limitada a dois graus; 1 PP por graduação.", { costPerRank: 1, range: "À distância", attackRange: "ranged" }),
  configuration("snare", "Laço", "Snare", "affliction", "Aflição à distância com condição extra e grau limitado; 2 PP por graduação.", { costPerRank: 2, range: "À distância", attackRange: "ranged" }),
  configuration("stun", "Atordoar", "Stun", "affliction", "Aflição resistida por Fortitude; 1 PP por graduação.", { costPerRank: 1, resistance: "Fortitude" }),
  configuration("suffocation", "Sufocamento", "Suffocation", "affliction", "Aflição à distância e duração Concentração; 3 PP por graduação.", { costPerRank: 3, range: "À distância", duration: "Concentração", resistance: "Fortitude", attackRange: "ranged" }),
  configuration("toxin", "Toxina", "Toxin", "affliction", "Aflição por toxina; 1 PP por graduação.", { costPerRank: 1, resistance: "Fortitude" }),
  configuration("transform-affliction", "Transformar", "Transform", "affliction", "Aflição progressiva limitada ao terceiro grau; 1 PP por graduação.", { costPerRank: 1 }),
  configuration("interface", "Interface", "Interface", "communication", "Comunicação eletromagnética; 2 PP por graduação.", { costPerRank: 2 }),
  configuration("psychic-connection", "Conexão Psíquica", "Psychic Connection", "communication", "Comunicação mental limitada a uma pessoa; 1 PP por 2 graduações.", { ranksPerPoint: 2 }),
  configuration("telepathic-link", "Elo Telepático", "Telepathic Link", "communication", "Comunicação mental; 2 PP por graduação.", { costPerRank: 2 }),
  configuration("inaudibility", "Inaudibilidade", "Inaudibility", "concealment", "Ocultação contra audição; 2 PP.", { totalCost: 2, defaultRank: 1 }),
  configuration("invisibility", "Invisibilidade", "Invisibility", "concealment", "Ocultação visual 2; 4 PP.", { totalCost: 4, defaultRank: 2 }),
  configuration("banish", "Banimento", "Banish", "counter", "Contrapõe invocações mágicas em esfera à distância; 3 PP por graduação.", { costPerRank: 3, range: "À distância", isAttack: true, requiresAttackCheck: false, attackRange: "ranged" }),
  configuration("deflector-field", "Campo Defletor", "Deflector Field", "counter", "Contrapõe ataques com aura ampla; 5 PP por graduação.", { costPerRank: 5, isAttack: true, requiresAttackCheck: false }),
  configuration("power-nullification", "Nulificação de Poder", "Power Nullification", "counter", "Contrapõe poderes de modo amplo e simultâneo; 5 PP por graduação.", { costPerRank: 5, range: "À distância", attackRange: "ranged" }),
  configuration("reflection-field", "Campo de Reflexão", "Reflection Field", "counter", "Contrapõe e reflete ataques com aura; 6 PP por graduação.", { costPerRank: 6, isAttack: true, requiresAttackCheck: false }),
  configuration("force-constructs", "Construtos de Força", "Force Constructs", "create", "Criação móvel; 3 PP por graduação.", { costPerRank: 3 }),
  configuration("matter-shaping", "Modelar Matéria", "Matter Shaping", "create", "Criação permanente de objetos; 2 PP por graduação.", { costPerRank: 2, duration: "Permanente" }),
  configuration("blast", "Rajada", "Blast", "damage", "Dano à distância; 2 PP por graduação.", { costPerRank: 2, range: "À distância", attackRange: "ranged" }),
  configuration("damage-aura", "Aura de Dano", "Damage Aura", "damage", "Dano em aura; 4 PP por graduação.", { costPerRank: 4, isAttack: true, requiresAttackCheck: false }),
  configuration("mental-blast", "Rajada Mental", "Mental Blast", "damage", "Dano com alcance Percepção e resistência Vontade; 3 PP por graduação.", { costPerRank: 3, range: "Percepção", resistance: "Vontade", requiresAttackCheck: false, attackRange: "ranged" }),
  configuration("strike", "Golpe", "Strike", "damage", "Dano baseado em Força; 1 PP por graduação.", { costPerRank: 1, strengthBased: true }),
  configuration("weapon", "Arma", "Weapon", "damage", "Dano baseado em Força em um poder Removível.", { costPerRank: 1, strengthBased: true, containerRemovable: "removable" }),
  configuration("radar", "Radar", "Radar", "enhanced-senses", "Rádio acurado e perceptível; 2 PP.", { totalCost: 2 }),
  configuration("sonar", "Sonar", "Sonar", "enhanced-senses", "Audição acurada e ultrassônica; 2 PP.", { totalCost: 2 }),
  configuration("spatial-sense", "Sentido Espacial", "Spatial Sense", "enhanced-senses", "Tato à distância e Sutil 2; 3 PP.", { totalCost: 3 }),
  configuration("tremor-sense", "Sentido de Tremor", "Tremor Sense", "enhanced-senses", "Tato à distância, Sutil 2 e desvantagem; 1 PP.", { totalCost: 1 }),
  configuration("true-vision", "Visão Verdadeira", "True Vision", "enhanced-senses", "Visão que contrapõe ocultação e ilusão; 7 PP.", { totalCost: 7 }),
  configuration("x-ray-vision", "Visão de Raios X", "X-Ray Vision", "enhanced-senses", "Visão que penetra ocultação; 4 PP.", { totalCost: 4 }),
  configuration("armored-skin", "Pele Blindada", "Armored Skin", "enhanced-resistance", "Robustez aprimorada e perceptível; 1 PP por graduação, menos 1 PP.", { costPerRank: 1, fixedDiscount: 1, suggestedTrait: "toughness" }),
  configuration("force-field", "Campo de Força", "Force Field", "enhanced-resistance", "Robustez aprimorada sustentada; 1 PP por graduação.", { costPerRank: 1, duration: "Sustentada", suggestedTrait: "toughness" }),
  configuration("impervious-shield", "Escudo Impenetrável", "Impervious Shield", "enhanced-resistance", "Robustez aprimorada, impenetrável e sustentada; 3 PP por graduação.", { costPerRank: 3, duration: "Sustentada", suggestedTrait: "toughness" }),
  configuration("mental-resistance", "Resistência Mental", "Mental Resistance", "enhanced-resistance", "Vontade aprimorada limitada a poderes mentais; 1 PP por 2 graduações.", { ranksPerPoint: 2, suggestedTrait: "will" }),
  configuration("partial-armor", "Armadura Parcial", "Partial Armor", "enhanced-resistance", "Robustez aprimorada, removível e não confiável; 1 PP por 3 graduações.", { ranksPerPoint: 3, suggestedTrait: "toughness", containerRemovable: "removable" }),
  configuration("precognitive-reflexes", "Reflexos Precognitivos", "Precognitive Reflexes", "enhanced-resistance", "Esquiva aprimorada; 1 PP por graduação.", { costPerRank: 1, suggestedTrait: "dodge" }),
  configuration("berserker-rage", "Fúria Berserker", "Berserker Rage", "enhanced-trait", "Força sustentada com vantagens e redução de Defesa; 2 PP por graduação de Força.", { costPerRank: 2, duration: "Sustentada", suggestedTrait: "strength", traitLinks: [{ trait: "defense", mode: "fixed", value: -1 }] }),
  configuration("furious-strength", "Força Furiosa", "Furious Strength", "enhanced-trait", "Força limitada à raiva e crescimento gradual; custo variável a partir de 1 PP por 2 graduações.", { ranksPerPoint: 2, suggestedTrait: "strength", requiresChoice: true }),
  configuration("trait-boost", "Impulso de Traço", "Trait Boost", "enhanced-trait", "Traço aprimorado e decrescente; custo do traço menos 1 PP por graduação.", { costPerRank: 1, requiresChoice: true }),
  configuration("flashlight-power", "Lanterna", "Flashlight", "environment", "Iluminação em cone; 1 PP.", { totalCost: 1 }),
  configuration("mist", "Névoa", "Mist", "environment", "Ambiente de visibilidade em esfera; 1 PP por graduação.", { costPerRank: 1 }),
  configuration("weather-control", "Controle do Clima", "Weather Control", "environment", "Ambiente variável em esfera; 5 PP por graduação.", { costPerRank: 5 }),
  configuration("quadruped", "Quadrúpede", "Quadruped", "extra-limbs", "Dois membros extras; 2 PP.", { totalCost: 2 }),
  configuration("prehensile-hair", "Cabelo Preênsil", "Prehensile Hair", "extra-limbs", "Cinco membros extras e Alongamento 2 limitado ao cabelo; 6 PP.", { totalCost: 6 }),
  configuration("prehensile-tail", "Cauda Preênsil", "Prehensile Tail", "extra-limbs", "Um membro extra; 1 PP.", { totalCost: 1 }),
  ...[
    ["animal-harmony", "Harmonia Animal", "Animal Harmony"],
    ["battery", "Bateria", "Battery"],
    ["built-in-equipment", "Equipamento Integrado", "Built-in Equipment"],
    ["charmed-life", "Vida Afortunada", "Charmed Life"],
    ["chill", "Calafrio", "Chill"],
    ["dimensional-pocket", "Bolso Dimensional", "Dimensional Pocket"],
    ["display", "Exibição", "Display"],
    ["higher-guidance", "Orientação Superior", "Higher Guidance"],
    ["insulating-fur", "Pelagem Isolante", "Insulating Fur"],
    ["internal-compartment", "Compartimento Interno", "Internal Compartment"],
    ["iron-stomach", "Estômago de Ferro", "Iron Stomach"],
    ["light-sleeper", "Sono Leve", "Light Sleeper"],
    ["lucid-dreamer", "Sonhador Lúcido", "Lucid Dreamer"],
    ["massive", "Maciço", "Massive"],
    ["megaphone", "Megafone", "Megaphone"],
    ["mimicry", "Mimetismo", "Mimicry"],
    ["quick-change", "Troca Rápida", "Quick-Change"],
    ["remote", "Remoto", "Remote"],
    ["shade", "Sombra", "Shade"],
    ["special-effect", "Efeito Especial", "Special Effect"],
    ["temporal-inertia", "Inércia Temporal", "Temporal Inertia"],
    ["weatherproof", "À Prova de Intempéries", "Weatherproof"],
  ].map(([id, label, canonical]) =>
    configuration(id, label, canonical, "feature", "Recurso geral; 1 PP.", { totalCost: 1 }),
  ),
  configuration("wings", "Asas", "Wings", "flight", "Voo restringível; 1 PP por graduação.", { costPerRank: 1 }),
  configuration("master-planner", "Planejador Mestre", "Master Planner", "fortune-control", "Controle da Fortuna; 3 PP por graduação.", { costPerRank: 3 }),
  configuration("probability-control", "Controle de Probabilidade", "Probability Control", "fortune-control", "Controle da Fortuna como ação livre com teste de ataque; 1 PP por graduação.", { costPerRank: 1, action: "Livre", isAttack: true, requiresAttackCheck: true, attackRange: "ranged" }),
  configuration("giant-size", "Tamanho Gigante", "Giant-Size", "growth", "Configuração completa de crescimento; 78 PP.", { totalCost: 78, traitLinks: [{ trait: "strength", mode: "fixed", value: 11 }, { trait: "stamina", mode: "fixed", value: 11 }, { trait: "toughness", mode: "fixed", value: 12 }, { trait: "closeAttack", mode: "fixed", value: -1 }, { trait: "fortitude", mode: "fixed", value: -5 }, { trait: "rangedDefense", mode: "fixed", value: -1 }] }),
  configuration("absorption", "Absorção", "Absorption", "immunity", "Imunidade a um descritor de dano ligada a um traço aprimorado decrescente; custo depende das escolhas.", { requiresChoice: true }),
  configuration("ageless", "Sem Idade", "Ageless", "immunity", "Imunidade 1 ao envelhecimento; 1 PP.", { totalCost: 1 }),
  configuration("reduction-effect", "Redução de Efeito", "Reduction in [Effect]", "immunity", "Imunidade resistível; 1 PP por 2 graduações.", { ranksPerPoint: 2, requiresChoice: true }),
  configuration("environmental-immunity", "Imunidade Ambiental", "Environmental Immunity", "immunity", "Imunidade 10 a riscos ambientais; 10 PP.", { totalCost: 10 }),
  configuration("fortitude-immunity", "Imunidade de Fortitude", "Fortitude Immunity", "immunity", "Imunidade 30 a efeitos de Fortitude; 30 PP.", { totalCost: 30 }),
  configuration("interaction-immunity", "Imunidade a Interação", "Interaction Immunity", "immunity", "Imunidade 10 a interações; 10 PP.", { totalCost: 10 }),
  configuration("life-support-bubble", "Bolha de Suporte de Vida", "Life-Support Bubble", "immunity", "Imunidade 10 para outros em esfera, sustentada; 30 PP.", { totalCost: 30, duration: "Sustentada" }),
  configuration("mental-immunity", "Imunidade Mental", "Mental Immunity", "immunity", "Imunidade 10 a efeitos mentais; 10 PP.", { totalCost: 10 }),
  configuration("water-breathing", "Respirar na Água", "Water Breathing", "immunity", "Imunidade 1 a afogamento; 1 PP.", { totalCost: 1 }),
  configuration("will-immunity", "Imunidade de Vontade", "Will Immunity", "immunity", "Imunidade 30 a efeitos de Vontade; 30 PP.", { totalCost: 30 }),
  configuration("cyclone", "Ciclone", "Cyclone", "move-object", "Mover Objeto em cone e direção limitada; 2 PP por graduação.", { costPerRank: 2, requiresAttackCheck: false }),
  configuration("energy-tendrils", "Tentáculos de Energia", "Energy Tendrils", "move-object", "Mover Objeto; 2 PP por graduação.", { costPerRank: 2 }),
  configuration("gravity-field", "Campo Gravitacional", "Gravity Field", "move-object", "Mover Objeto em esfera e direção limitada; 2 PP por graduação.", { costPerRank: 2, requiresAttackCheck: false }),
  configuration("matter-moving", "Mover Matéria", "[Matter] Moving", "move-object", "Mover Objeto limitado a um material; 1 PP por graduação.", { costPerRank: 1, requiresChoice: true }),
  configuration("poltergeist", "Poltergeist", "Poltergeist", "move-object", "Mover Objeto por Percepção com sentidos auxiliares; 12 PP fixos + 3 PP por graduação.", { costPerRank: 3, fixedCost: 12, range: "Percepção", requiresAttackCheck: false, attackRange: "ranged" }),
  configuration("psychokinesis", "Psicocinese", "Psychokinesis", "move-object", "Mover Objeto por Percepção; 3 PP por graduação.", { costPerRank: 3, range: "Percepção", requiresAttackCheck: false, attackRange: "ranged" }),
  configuration("tether", "Amarra", "Tether", "move-object", "Mover Objeto em direção limitada; 1 PP por graduação.", { costPerRank: 1 }),
  configuration("darkness", "Escuridão", "Darkness", "obscure", "Obscurece visão normal em esfera; 2 PP por graduação.", { costPerRank: 2 }),
  configuration("silence", "Silêncio", "Silence", "obscure", "Obscurece audição normal em esfera; 1 PP por graduação.", { costPerRank: 1 }),
  configuration("static", "Estática", "Static", "obscure", "Obscurece rádio em esfera; 1 PP por graduação.", { costPerRank: 1 }),
  configuration("wards", "Proteções Místicas", "Wards", "obscure", "Obscurece detecção e sentidos remotos; 1 PP por graduação.", { costPerRank: 1 }),
  configuration("astral-projection", "Projeção Astral", "Astral Projection", "remote-sensing", "Sentidos remotos visuais, auditivos e mentais com efeito colateral; 6 PP por graduação.", { costPerRank: 6 }),
  configuration("scrying", "Vidência", "Scrying", "remote-sensing", "Sentidos remotos de visão e audição; 7 PP por graduação.", { costPerRank: 7 }),
  configuration("telepresence", "Telepresença", "Telepresence", "remote-sensing", "Sentidos remotos de visão e audição por tecnologia; 6 PP por graduação.", { costPerRank: 6 }),
  configuration("ant-size", "Tamanho de Formiga", "Ant-Size", "shrinking", "Configuração completa de encolhimento; 28 PP.", { totalCost: 28, traitLinks: [{ trait: "defense", mode: "fixed", value: 8 }] }),
  configuration("demon-summoning", "Invocação Demoníaca", "Demon Summoning", "summon", "Invoca demônios com tipo amplo, controle, horda e múltiplos; 5 PP por graduação.", { costPerRank: 5 }),
  configuration("duplication", "Duplicação", "Duplication", "summon", "Invoca uma duplicata; 2 PP por graduação.", { costPerRank: 2 }),
  configuration("aquatic", "Aquático", "Aquatic", "enhanced-movement", "Adaptação aquática, sentidos, imunidades e natação; 7 PP.", { totalCost: 7 }),
  configuration("animal-mimicry", "Mimetismo Animal", "Animal Mimicry", "variable", "Traços animais variáveis; 8 PP por graduação.", { costPerRank: 8 }),
  configuration("gadgets", "Gadgets", "Gadgets", "variable", "Dispositivos variáveis e lentos; 7 PP por graduação.", { costPerRank: 7 }),
  configuration("material-mimicry", "Mimetismo de Material", "Material Mimicry", "variable", "Traços de materiais tocados; 7 PP por graduação.", { costPerRank: 7 }),
  configuration("power-mimicry", "Mimetismo de Poder", "Power Mimicry", "variable", "Poderes de personagens tocados com teste de ataque; 6 PP por graduação.", { costPerRank: 6, isAttack: true, requiresAttackCheck: true }),
  configuration("power-theft", "Roubo de Poder", "Power Theft", "variable", "Poderes variáveis ligados à perda de poderes do alvo; escolha entre duas estruturas de ligação.", { costPerRank: 6, isAttack: true, requiresAttackCheck: true, requiresChoice: true }),
  configuration("shapeshift", "Metamorfose", "Shapeshift", "variable", "Traços de formas variáveis e sustentados; 7 PP por graduação.", { costPerRank: 7, duration: "Sustentada" }),
  configuration("skill-mimicry", "Mimetismo de Perícias", "Skill Mimicry", "variable", "Perícias e vantagens variáveis com traços limitados; 7 PP por graduação.", { costPerRank: 7 }),
];

export const extraCatalog: RankedModifierPreset[] = [
  ranked("affects-corporeal", "Afeta Corpóreo", "Affects Corporeal", "Extra", 1, "Funciona no mundo corpóreo durante a insubstancialidade."),
  ranked("affects-objects", "Afeta Objetos", "Affects Objects", "Extra", 1, "Permite que efeitos apropriados funcionem em objetos."),
  ranked("affects-others", "Afeta Outros", "Affects Others", "Extra", 1, "Concede a outra pessoa um efeito pessoal sustentado."),
  ranked("area-effect", "Efeito de Área", "Area Effect", "Extra", 1, "Transforma um efeito de alvo único em área."),
  ranked("aura", "Aura", "Aura", "Extra", 3, "Mantém um efeito próximo ao redor do personagem."),
  ranked("contagious", "Contagioso", "Contagious", "Extra", 1, "Propaga o efeito por contato com o alvo."),
  ranked("improved-resistance", "Aprimorada", "Improved Resistance", "Extra de resistência", 1, "Concede um dado bônus ao resistir a efeitos até a graduação Aprimorada."),
  ranked("impervious-resistance", "Impenetrável", "Impervious Resistance", "Extra de resistência", 2, "Ignora automaticamente efeitos de graduação igual ou inferior à graduação Impenetrável."),
  ranked("impenetrable-resistance", "Intransponível", "Impenetrable Resistance", "Extra de resistência", 1, "Permite que uma resistência Aprimorada ou Impenetrável ignore efeitos Penetrantes."),
  ranked("increased-duration", "Duração Aumentada", "Increased Duration", "Extra", 1, "Avança a duração em uma etapa."),
  ranked("increased-range", "Alcance Aumentado", "Increased Range", "Extra", 1, "Avança o alcance em uma etapa."),
  ranked("linked", "Ligado", "Linked", "Extra", 0, "Faz efeitos operarem juntos como uma única utilização."),
  ranked("multiattack", "Multiataque", "Multiattack", "Extra", 1, "Permite atingir repetidamente ou vários alvos."),
  ranked("penetrating", "Penetrante", "Penetrating", "Extra", 1, "Supera Resistência Aprimorada ou Impenetrável."),
  ranked("permanent", "Permanente", "Permanent", "Extra", 0, "Torna permanente um efeito sustentado."),
  ranked("resisted-by", "Resistido por…", "Resisted by [Resistance]", "Extra", 1, "Altera a resistência usada contra o efeito."),
  ranked("secondary-effect", "Efeito Secundário", "Secondary Effect", "Extra", 1, "Repete um efeito instantâneo na rodada seguinte."),
  ranked("selective", "Seletivo", "Selective", "Extra", 1, "Permite excluir alvos de um efeito resistível."),
  ranked("sustained", "Sustentado", "Sustained", "Extra", 0, "Torna sustentado um efeito permanente."),
  ranked("targets-resistance", "Alvo: Resistência…", "Targets [Resistance]", "Extra", 1, "Altera o traço que determina a Defesa contra o efeito."),
  ranked("throw", "Arremesso", "Throw", "Extra", 0, "Permite arremessar uma vez um efeito de alcance próximo."),
  ranked("worst-resistance", "Pior Resistência", "Worst of Resistance", "Extra", 1, "Usa a menor entre duas resistências escolhidas."),
];

export const featureCatalog: FlatModifierPreset[] = [
  flat("accurate", "Preciso", "Accurate", "Recurso", 1, undefined, "accurate", "Concede +2 em ataques por graduação."),
  flat("affects-insubstantial", "Afeta Insubstancial", "Affects Insubstantial", "Recurso", 1, 2, "generic", "Funciona parcialmente ou totalmente em alvos insubstanciais."),
  flat("alternate-effect", "Efeito Alternativo", "Alternate Effect", "Recurso", 1, 2, "generic", "Adiciona configuração alternativa ou dinâmica."),
  flat("dimensional", "Dimensional", "Dimensional", "Recurso", 1, 3, "generic", "Alcança alvos em outras dimensões."),
  flat("extended-range", "Alcance Estendido", "Extended Range", "Recurso", 1, undefined, "generic", "Aumenta as distâncias curta, média e longa."),
  flat("feature", "Recurso", "Feature", "Recurso", 1, undefined, "generic", "Acrescenta uma utilidade menor ao efeito."),
  flat("homing", "Teleguiado", "Homing", "Recurso", 1, undefined, "generic", "Oferece novas tentativas após errar."),
  flat("increased-mass", "Massa Aumentada", "Increased Mass", "Recurso", 1, undefined, "generic", "Aumenta a massa que o efeito transporta."),
  flat("insidious", "Insidioso", "Insidious", "Recurso", 1, 1, "generic", "Dificulta perceber o resultado do efeito."),
  flat("precise", "Preciso em Controle", "Precise", "Recurso", 1, 1, "generic", "Permite controle delicado e tarefas finas."),
  flat("reach", "Alcance Corpo a Corpo", "Reach", "Recurso", 1, undefined, "generic", "Amplia o alcance de um efeito próximo."),
  flat("reaction", "Reação", "Reaction", "Recurso", 1, 1, "generic", "Ativa o efeito diante de um gatilho específico."),
  flat("reversible", "Reversível", "Reversible", "Recurso", 1, 1, "generic", "Remove livremente condições causadas pelo efeito."),
  flat("ricochet", "Ricochete", "Ricochet", "Recurso", 1, undefined, "generic", "Muda a direção do efeito em superfícies."),
  flat("split", "Dividir", "Split", "Recurso", 1, undefined, "generic", "Divide um ataque em efeitos menores."),
  flat("subtle", "Sutil", "Subtle", "Recurso", 1, 2, "generic", "Dificulta ou impede detectar o efeito."),
  flat("triggered", "Programado", "Triggered", "Recurso", 1, undefined, "generic", "Prepara ativação diante de uma circunstância."),
  flat("wide-array", "Matriz Ampla", "Wide Array", "Recurso", 1, undefined, "generic", "Adiciona PP distribuíveis a uma matriz."),
];

export const flawCatalog: RankedModifierPreset[] = [
  ranked("best-resistance", "Melhor Resistência", "Best of Resistance", "Falha", 1, "Usa a maior entre duas resistências escolhidas."),
  ranked("decreased-duration", "Duração Reduzida", "Decreased Duration", "Falha", 1, "Recua a duração em uma etapa."),
  ranked("decreased-range", "Alcance Reduzido", "Decreased Range", "Falha", 1, "Recua o alcance em uma etapa."),
  ranked("distracting", "Distrativo", "Distracting", "Falha", 1, "Deixa o personagem vulnerável ao usar o efeito."),
  ranked("fading", "Decrescente", "Fading", "Falha", 1, "Perde uma graduação a cada uso."),
  ranked("feedback", "Retorno", "Feedback", "Falha", 1, "Dano à manifestação causa um efeito colateral."),
  ranked("grab-based", "Baseado em Agarrão", "Grab-Based", "Falha", 1, "Exige agarrar o alvo antes do efeito."),
  ranked("increased-action", "Ação Aumentada", "Increased Action", "Falha", 1, "Aumenta a ação necessária em uma etapa."),
  ranked("independent", "Independente", "Independent", "Falha", 0, "Permanece por rodadas sem manutenção."),
  ranked("limited", "Limitado", "Limited", "Falha", 1, "Restringe quando ou sobre o que o efeito funciona."),
  ranked("resistible", "Resistível", "Resistible", "Falha", 1, "Concede um teste de resistência ao efeito."),
  ranked("sense-dependent", "Dependente de Sentido", "Sense-Dependent", "Falha", 1, "Exige que o alvo perceba a fonte."),
  ranked("short-term", "Curto Prazo", "Short-Term", "Falha", 1, "Limita o efeito a seis usos."),
  ranked("side-effect", "Efeito Colateral", "Side Effect", "Falha", 1, "Usar ou falhar provoca uma consequência problemática.", 2),
  ranked("tiring", "Cansativo", "Tiring", "Falha", 1, "Causa Fadiga ao usar."),
  ranked("uncontrolled", "Incontrolável", "Uncontrolled", "Falha", 1, "Retira o controle direto sobre o efeito."),
  ranked("unreliable", "Não Confiável", "Unreliable", "Falha", 1, "Funciona aproximadamente metade das vezes."),
];

export const drawbackCatalog: FlatModifierPreset[] = [
  flat("activation", "Ativação", "Activation", "Desvantagem", 1, 2, "generic", "Exige uma ação simples ou padrão para acessar."),
  flat("check-required", "Teste Necessário", "Check Required", "Desvantagem", 1, undefined, "generic", "Exige teste de ativação com CD por graduação."),
  flat("diminished-range", "Alcance Diminuído", "Diminished Range", "Desvantagem", 1, undefined, "generic", "Reduz as distâncias de um efeito à distância."),
  flat("drawback", "Desvantagem", "Drawback", "Desvantagem", 1, 3, "generic", "Acrescenta um incômodo ou limitação menor."),
  flat("inaccurate", "Impreciso", "Inaccurate", "Desvantagem", 1, undefined, "inaccurate", "Impõe -2 em ataques por graduação."),
  flat("noticeable", "Perceptível", "Noticeable", "Desvantagem", 1, 1, "generic", "Torna perceptível um efeito normalmente discreto."),
];

export const descriptorCatalog = {
  origin: ["Acidental", "Concedida", "Inerente", "Inventada", "Mutante", "Treinamento"],
  source: ["Biológica", "Cósmica", "Divina", "Extradimensional", "Mágica", "Moral", "Preternatural", "Psiônica", "Tecnológica"],
  medium: ["Ar", "Água", "Terra", "Metal", "Ácido", "Osso", "Sangue", "Eletricidade", "Luz", "Rádio", "Radiação", "Gravidade", "Cinética", "Energia exótica"],
  result: ["Laços de energia", "Teia adesiva", "Calor", "Frio", "Choque nervoso", "Névoa", "Transformação", "Transe"],
} as const;

export const attackSpecializationSuggestions = [
  "Poder específico",
  "Arremesso",
  "Desarmado",
  "Arma contundente",
  "Arcos",
  "Armas de fogo",
  "Espadas",
  "Facas",
  "Chicotes",
] as const;

export const resistanceSuggestions = [
  "Esquiva",
  "Fortitude",
  "Robustez",
  "Vontade",
  "Força",
  "Defesa",
  "Percepção",
  "Intuição",
  "Efeito vs. efeito",
] as const;

const equipmentRows: readonly [string, string, string, string, number, string, boolean?][] = [
  ["antitoxin", "Antitoxina", "Antitoxin", "Utilidade defensiva", 1, "+5 contra toxinas específicas."],
  ["flare-goggles", "Óculos Anticlarão", "Flare Goggles", "Utilidade defensiva", 1, "Redução contra Ofuscar Visão."],
  ["fire-extinguisher", "Extintor", "Fire Extinguisher", "Utilidade defensiva", 1, "Apaga pequenos incêndios em dois usos."],
  ["gas-mask", "Máscara de Gás", "Gas Mask", "Utilidade defensiva", 1, "Imunidade a gases inalados e dirigidos ao rosto."],
  ["rebreather", "Respirador", "Rebreather", "Utilidade defensiva", 2, "Fornece alguns minutos de ar respirável."],
  ["binoculars", "Binóculos", "Binoculars", "Utilidade geral", 1, "Visão estendida para perceber a distância."],
  ["burglary-tools", "Ferramentas de Invasão", "Burglary Tools", "Utilidade geral", 1, "Remove penalidades em fechaduras e segurança."],
  ["commlink", "Comunicador", "Commlink", "Utilidade geral", 1, "Comunicação de rádio discreta e unidirecional."],
  ["cutting-torch", "Maçarico de Corte", "Cutting Torch", "Utilidade geral", 2, "Dano Penetrante 1 para cortar materiais."],
  ["evidence-kit", "Kit de Evidências", "Evidence Kit", "Utilidade geral", 1, "Ferramentas de investigação; laboratório portátil custa mais.", true],
  ["first-aid-kit", "Kit de Primeiros Socorros", "First-Aid Kit", "Utilidade geral", 1, "Ferramentas necessárias para Medicina."],
  ["flashlight", "Lanterna", "Flashlight", "Utilidade geral", 1, "Iluminação em área cônica."],
  ["mini-computer", "Minicomputador", "Mini-Computer", "Utilidade geral", 1, "Ferramentas para Computadores e acesso a sistemas."],
  ["multi-tool", "Multiferramenta", "Multi-Tool", "Utilidade geral", 1, "Reduz a penalidade por falta de ferramentas."],
  ["night-vision-goggles", "Óculos de Visão Noturna", "Night Vision Goggles", "Utilidade geral", 1, "Concede visão em baixa luminosidade."],
  ["restraints", "Algemas", "Restraints", "Utilidade geral", 1, "Prendem dois membros de alvo indefeso ou cooperativo."],
  ["tracer", "Rastreador", "Tracer", "Utilidade geral", 1, "Transmissor adesivo discreto para rastreamento."],
  ["climbing-cable", "Cabo de Escalada", "Climbing Cable", "Utilidade de movimento", 1, "Auxilia movimento vertical como andar em paredes."],
  ["climbing-gear", "Equipamento de Escalada", "Climbing Gear", "Utilidade de movimento", 1, "Dado bônus em Atletismo para escalar."],
  ["glider", "Planador", "Glider", "Utilidade de movimento", 6, "Voo 6 limitado a planar."],
  ["parachute", "Paraquedas", "Parachute", "Utilidade de movimento", 1, "Permite aterrissagem segura."],
  ["roller-skates", "Patins", "Roller Skates", "Utilidade de movimento", 1, "Dado bônus para mover-se em superfície adequada."],
  ["skateboard", "Skate", "Skateboard", "Utilidade de movimento", 1, "Dado bônus para mover-se em superfície adequada."],
  ["stealth-suit", "Traje de Furtividade", "Stealth Suit", "Utilidade de movimento", 1, "Dado bônus para permanecer sem ser visto."],
  ["swim-fins", "Nadadeiras", "Swim Fins", "Utilidade de movimento", 1, "Dado bônus em Atletismo para nadar."],
  ["swing-line", "Linha de Balanço", "Swing Line", "Utilidade de movimento", 2, "Concede Balançar-se 2."],
  ["battle-axe", "Machado de Batalha", "Battle Axe", "Arma corpo a corpo", 5, "Dano 3 baseado em Força; crítico e quebrar."],
  ["throwing-axe", "Machado de Arremesso", "Throwing Axe", "Arma corpo a corpo", 2, "Dano 2 baseado em Força; arremessável."],
  ["brass-knuckles", "Soco Inglês", "Brass Knuckles", "Arma corpo a corpo", 1, "Dano 1 baseado em Força."],
  ["chain", "Corrente", "Chain", "Arma corpo a corpo", 6, "Dano 2; agarrar, derrubar e alcance 2."],
  ["chainsaw", "Motosserra", "Chainsaw", "Arma corpo a corpo", 9, "Dano 6; crítico e Penetrante 2."],
  ["club", "Clava", "Club", "Arma corpo a corpo", 2, "Dano 2 baseado em Força."],
  ["dagger", "Adaga", "Dagger", "Arma corpo a corpo", 2, "Dano 1 baseado em Força; crítico."],
  ["flail", "Mangual", "Flail", "Arma corpo a corpo", 5, "Dano 2 baseado em Força; crítico, desarmar e alcance."],
  ["garrote", "Garrote", "Garrote", "Arma corpo a corpo", 1, "Concede estrangulamento especializado."],
  ["hammer", "Martelo", "Hammer", "Arma corpo a corpo", 4, "Dano 3 baseado em Força; quebrar."],
  ["hook-sword", "Espada Gancho", "Hook Sword", "Arma corpo a corpo", 7, "Dano 3 baseado em Força; desarmar, alcance/dividir e derrubar."],
  ["javelin-close", "Azagaia", "Javelin", "Arma corpo a corpo", 3, "Dano 1 baseado em Força; crítico e arremessável."],
  ["katar", "Katar", "Katar", "Arma corpo a corpo", 3, "Dano 2 baseado em Força; Penetrante 1."],
  ["mace", "Maça", "Mace", "Arma corpo a corpo", 3, "Dano 2 baseado em Força; crítico."],
  ["pepper-spray", "Spray de Pimenta", "Pepper Spray", "Arma corpo a corpo", 4, "Ofuscar Visão 4 em alcance próximo."],
  ["sai", "Sai", "Sai", "Arma corpo a corpo", 3, "Dano 1 baseado em Força; desarmar e prender arma."],
  ["sash", "Faixa", "Sash", "Arma corpo a corpo", 2, "Finesse de agarrão e alcance."],
  ["spear", "Lança", "Spear", "Arma corpo a corpo", 4, "Dano 2 baseado em Força; crítico, alcance e arremesso."],
  ["staff", "Bastão", "Staff", "Arma corpo a corpo", 3, "Dano 2 baseado em Força; dividir."],
  ["stun-gun", "Arma de Choque", "Stun Gun", "Arma corpo a corpo", 5, "Atordoar 5 elétrico."],
  ["sword", "Espada", "Sword", "Arma corpo a corpo", 3, "Dano 3 baseado em Força."],
  ["tonfa", "Tonfa", "Tonfa", "Arma corpo a corpo", 3, "Dano 2 baseado em Força; defensiva."],
  ["trident", "Tridente", "Trident", "Arma corpo a corpo", 6, "Dano 3 baseado em Força; crítico, desarmar e alcance."],
  ["war-fan", "Leque de Guerra", "War Fan", "Arma corpo a corpo", 3, "Dano 1 baseado em Força; ocultável e defensivo."],
  ["whip", "Chicote", "Whip", "Arma corpo a corpo", 5, "Dano 1; desarmar, agarrar e alcance 2."],
  ["holdout-pistol", "Pistola Ocultável", "Holdout Pistol", "Arma à distância", 5, "Dano à distância 2; ocultável."],
  ["light-pistol", "Pistola Leve", "Light Pistol", "Arma à distância", 6, "Dano à distância 3."],
  ["heavy-pistol", "Pistola Pesada", "Heavy Pistol", "Arma à distância", 8, "Dano à distância 4."],
  ["rifle", "Rifle", "Rifle", "Arma à distância", 8, "Dano à distância 4."],
  ["high-power-rifle", "Rifle de Alta Potência", "High-Power Rifle", "Arma à distância", 10, "Dano à distância 5."],
  ["assault-rifle", "Fuzil de Assalto", "Assault Rifle", "Arma à distância", 15, "Multiataque à distância com Dano 5."],
  ["sniper-rifle", "Rifle de Precisão", "Sniper Rifle", "Arma à distância", 11, "Dano 5 e alcance estendido."],
  ["shotgun", "Espingarda", "Shotgun", "Arma à distância", 10, "Dano à distância 5 com munições alternativas."],
  ["machine-pistol", "Pistola Automática", "Machine Pistol", "Arma à distância", 9, "Multiataque à distância com Dano 3."],
  ["submachine-gun", "Submetralhadora", "Submachine Gun", "Arma à distância", 12, "Multiataque à distância com Dano 4."],
  ["air-gun", "Arma de Ar", "Air Gun", "Arma à distância", 10, "Atordoar 5 à distância."],
  ["dart-gun", "Arma de Dardos", "Dart Gun", "Arma à distância", 5, "Toxina 5 à distância, resistível por Robustez."],
  ["flare-gun", "Sinalizador", "Flare Gun", "Arma à distância", 2, "Ambiente 2 para iluminação."],
  ["paintball-gun", "Marcador de Paintball", "Paintball Gun", "Arma à distância", 1, "Recurso ou Aflição à distância, conforme munição.", true],
  ["bow", "Arco", "Bow", "Arma à distância", 6, "Dano à distância 3."],
  ["crossbow", "Besta", "Crossbow", "Arma à distância", 7, "Dano à distância 3; crítico."],
  ["blowgun", "Zarabatana", "Blowgun", "Arma à distância", 4, "Toxina 5 com alcance diminuído, resistível por Robustez."],
  ["bolos", "Boleadeiras", "Bolos", "Arma à distância", 8, "Laço 4."],
  ["boomerang", "Bumerangue", "Boomerang", "Arma à distância", 2, "Dano à distância 1."],
  ["chakram", "Chakram", "Chakram", "Arma à distância", 7, "Dano à distância 3; crítico."],
  ["javelin-ranged", "Azagaia de Arremesso", "Javelin", "Arma à distância", 2, "Dano 2 baseado em Força; arremessável."],
  ["shuriken", "Shuriken", "Shuriken", "Arma à distância", 3, "Multiataque à distância com Dano 1."],
  ["blaster-pistol", "Pistola Blaster", "Blaster Pistol", "Arma à distância", 10, "Dano à distância 5."],
  ["blaster-rifle", "Rifle Blaster", "Blaster Rifle", "Arma à distância", 16, "Dano à distância 8."],
  ["taser", "Taser", "Taser", "Arma à distância", 10, "Atordoar 5 à distância."],
  ["flamethrower", "Lança-chamas", "Flamethrower", "Arma pesada", 13, "Dano 6 em cone ou linha."],
  ["grenade-launcher", "Lança-granadas", "Grenade Launcher", "Arma pesada", 15, "Dano 5 à distância em esfera."],
  ["machine-gun", "Metralhadora", "Machine Gun", "Arma pesada", 21, "Multiataque à distância com Dano 7."],
  ["rocket-launcher", "Lança-foguetes", "Rocket Launcher", "Arma pesada", 27, "Dano 10 à distância e área de Dano 7."],
  ["laser-sight", "Mira Laser", "Laser Sight", "Acessório de arma", 1, "Concede Preciso ao ataque."],
  ["stun-ammo", "Munição Não Letal", "Stun Ammo", "Acessório de arma", 1, "Alterna para dano não letal."],
  ["suppressor", "Supressor", "Suppressor", "Acessório de arma", 1, "Concede Sutil 1 a arma balística."],
  ["targeting-scope", "Luneta", "Targeting Scope", "Acessório de arma", 1, "Concede o benefício de Mira Aprimorada."],
  ["fragmentation-grenade", "Granada de Fragmentação", "Fragmentation Grenade", "Explosivo", 15, "Dano 5 em esfera."],
  ["smoke-grenade", "Granada de Fumaça", "Smoke Grenade", "Explosivo", 8, "Obscurecer Visão 4."],
  ["flash-grenade", "Granada de Clarão", "Flash Grenade", "Explosivo", 12, "Ofuscar Visão 4 em esfera."],
  ["flashbang", "Granada de Luz e Som", "Flash-Bang Grenade", "Explosivo", 16, "Ofuscar visão e audição 4 em esfera."],
  ["sleep-gas", "Granada de Gás Sonífero", "Sleep Gas Grenade", "Explosivo", 12, "Atordoar 4 em esfera com sono."],
  ["tear-gas", "Granada de Gás Lacrimogêneo", "Tear Gas Grenade", "Explosivo", 16, "Aflição 4 em esfera."],
  ["dynamite", "Dinamite", "Dynamite", "Explosivo", 15, "Dano 5 em esfera por bastão."],
  ["plastic-explosive", "Explosivo Plástico", "Plastic Explosive", "Explosivo", 30, "Dano 10 em esfera por bloco."],
  ["leather-armor", "Armadura de Couro", "Leather Armor", "Armadura", 1, "+1 Robustez."],
  ["chain-mail", "Cota de Malha", "Chain-Mail", "Armadura", 7, "+3 Robustez e Aprimorada 1."],
  ["plate-mail", "Armadura de Placas", "Plate-Mail", "Armadura", 12, "+5 Robustez e Aprimorada 2."],
  ["full-plate", "Armadura Completa", "Full-Plate", "Armadura", 15, "+6 Robustez e Aprimorada 3."],
  ["armor-cloth", "Tecido Blindado", "Armor Cloth", "Armadura", 1, "Robustez Aprimorada por graduação.", true],
  ["undercover-shirt", "Colete Discreto", "Undercover Shirt", "Armadura", 3, "+2 Robustez balística, Aprimorada 2 e Sutil."],
  ["bulletproof-vest", "Colete à Prova de Balas", "Bulletproof Vest", "Armadura", 5, "+4 Robustez balística, Aprimorada 4 e Sutil."],
  ["armored-costume", "Traje Blindado", "Armored Costume", "Armadura", 1, "+Robustez por graduação, talvez Aprimorada.", true],
  ["fire-resistant", "Proteção Contra Fogo", "Fire Resistant", "Armadura", 3, "Redução em dano de fogo."],
  ["small-shield", "Escudo Pequeno", "Small Shield", "Armadura", 3, "+1 Defesa e Esquiva."],
  ["medium-shield", "Escudo Médio", "Medium Shield", "Armadura", 6, "+2 Defesa e Esquiva."],
  ["large-shield", "Escudo Grande", "Large Shield", "Armadura", 9, "+3 Defesa e Esquiva."],
  ["motorcycle", "Motocicleta", "Motorcycle", "Veículo terrestre", 10, "Tam. 0; For 2; Vel 8; Def 0; Rob 7."],
  ["car", "Carro", "Car", "Veículo terrestre", 10, "Tam. 1; For 5; Vel 7; Def -1; Rob 8."],
  ["police-cruiser", "Viatura Policial", "Police Cruiser", "Veículo terrestre", 13, "Tam. 1; For 6; Vel 8; Def -1; Rob 9."],
  ["limousine", "Limusine", "Limousine", "Veículo terrestre", 14, "Tam. 2; For 8; Vel 7; Def -2; Rob 9."],
  ["truck", "Caminhão", "Truck", "Veículo terrestre", 15, "Tam. 2; For 9; Vel 7; Def -2; Rob 9."],
  ["armored-car", "Carro Blindado", "Armored Car", "Veículo terrestre", 23, "Tam. 2; For 8; Vel 7; Def -2; Rob 12."],
  ["tank", "Tanque", "Tank", "Veículo terrestre", 76, "Tam. 2; For 10; Vel 6; Def -2; Rob 12."],
  ["apc", "Blindado de Transporte", "APC", "Veículo terrestre", 46, "Tam. 2; For 12; Vel 6; Def -2; Rob 12."],
  ["bus", "Ônibus", "Bus", "Veículo terrestre", 17, "Tam. 3; For 12; Vel 7; Def -3; Rob 11."],
  ["semi", "Cavalo Mecânico", "Semi", "Veículo terrestre", 18, "Tam. 3; For 13; Vel 7; Def -3; Rob 11."],
  ["train-engine", "Locomotiva", "Train Engine", "Veículo terrestre", 16, "Tam. 2; For 10; Vel 7; Def -2; Rob 10."],
  ["jet-ski", "Jet Ski", "Jet-Ski", "Veículo aquático", 10, "Tam. 0; For 2; Vel 7; Def 0; Rob 7."],
  ["sailboat", "Veleiro", "Sailboat", "Veículo aquático", 6, "Tam. 2; For 6; Vel 5; Def -1; Rob 6."],
  ["speedboat", "Lancha", "Speedboat", "Veículo aquático", 12, "Tam. 1; For 6; Vel 8; Def -1; Rob 7."],
  ["yacht", "Iate", "Yacht", "Veículo aquático", 15, "Tam. 2; For 10; Vel 7; Def -2; Rob 9."],
  ["cutter", "Cúter", "Cutter", "Veículo aquático", 37, "Tam. 3; For 13; Vel 7; Def -3; Rob 12."],
  ["destroyer", "Contratorpedeiro", "Destroyer", "Veículo aquático", 50, "Tam. 4; For 16; Vel 7; Def -4; Rob 14."],
  ["cruise-ship", "Navio de Cruzeiro", "Cruise Ship", "Veículo aquático", 25, "Tam. 5; For 20; Vel 7; Def -5; Rob 15."],
  ["battleship", "Encouraçado", "Battleship", "Veículo aquático", 76, "Tam. 5; For 20; Vel 7; Def -5; Rob 16."],
  ["submarine", "Submarino", "Submarine", "Veículo aquático", 39, "Tam. 4; For 16; Vel 4; Def -4; Rob 13."],
  ["two-seater-plane", "Avião de Dois Lugares", "Two-Seater Plane", "Veículo aéreo", 13, "Tam. 1; For 6; Vel 8; Def -1; Rob 8."],
  ["helicopter", "Helicóptero", "Helicopter", "Veículo aéreo", 24, "Tam. 2; For 8; Vel 9; Def -2; Rob 9."],
  ["military-copter", "Helicóptero Militar", "Military Copter", "Veículo aéreo", 70, "Tam. 2; For 8; Vel 10; Def -2; Rob 11."],
  ["private-jet", "Jato Particular", "Private Jet", "Veículo aéreo", 30, "Tam. 3; For 12; Vel 10; Def -3; Rob 11."],
  ["jumbo-jet", "Jumbo", "Jumbo Jet", "Veículo aéreo", 32, "Tam. 4; For 16; Vel 9; Def -4; Rob 13."],
  ["fighter-jet", "Caça", "Fighter Jet", "Veículo aéreo", 89, "Tam. 3; For 10; Vel 14; Def -3; Rob 10."],
  ["bomber", "Bombardeiro", "Bomber", "Veículo aéreo", 87, "Tam. 4; For 13; Vel 11; Def -4; Rob 13."],
  ["space-shuttle", "Ônibus Espacial", "Space Shuttle", "Veículo espacial", 42, "Tam. 4; For 16; Vel 14; Def -4; Rob 13."],
  ["space-fighter", "Caça Espacial", "Space Fighter", "Veículo espacial", 60, "Tam. 3; For 10; Vel 16; Def -3; Rob 11."],
  ["space-cruiser", "Cruzador Espacial", "Space Cruiser", "Veículo espacial", 116, "Tam. 4; For 18; Vel 16; Def -4; Rob 15."],
  ["space-battleship", "Encouraçado Espacial", "Space Battleship", "Veículo espacial", 139, "Tam. 5; For 22; Vel 18; Def -5; Rob 18."],
  ["dimension-hopper", "Saltador Dimensional", "Dimension Hopper", "Veículo exótico", 6, "Custo-base mais movimento dimensional.", true],
  ["mole-machine", "Máquina Escavadora", "Mole Machine", "Veículo exótico", 18, "Tam. 2; For 11; Vel 6; Def -2; Rob 12."],
  ["time-machine", "Máquina do Tempo", "Time Machine", "Veículo exótico", 6, "Custo-base mais viagem temporal.", true],
  ...featureEquipmentRows("vehicle", "Recurso de veículo", ["Alarme", "Piloto Automático", "Espalhador de Pregos", "Comunicações", "Computador", "Tamanho Duplo", "Compartimentos Ocultos", "Sistema de Navegação", "Mancha de Óleo", "Controle Remoto", "Compartimentos Habitáveis"]),
  ...featureEquipmentRows("installation", "Recurso de instalação", ["Simulador de Combate", "Comunicações", "Sistema de Computador", "Oculta", "Sistema de Defesa", "Armadilhas", "Portal Dimensional", "Doca", "Tamanho Duplo", "Efeito", "Prevenção de Incêndio", "Garagem", "Terreno", "Academia", "Hangar", "Habitat", "Celas", "Enfermaria", "Inteligente", "Isolada", "Laboratório", "Biblioteca", "Alojamento", "Móvel", "Pessoal", "Sistema de Energia", "Recurso Remoto", "Selada", "Sistema de Segurança", "Autorreparação", "Bloqueio de Teleporte", "Sala de Troféus", "Oficina"]),
];

export const equipmentCatalog: EquipmentPreset[] = equipmentRows.map(
  ([id, label, canonical, category, cost, details, variableCost]) => {
    const automation = equipmentAutomation(id, category, details);
    return {
      id,
      label,
      canonical,
      category,
      summary: details,
      type: equipmentType(category),
      cost,
      ...(variableCost ? { variableCost: true } : {}),
      details,
      ...automation,
    };
  },
);

export function findSkillPreset(value: string, catalogKey = "") {
  return findPreset(skillCatalog, value, catalogKey);
}

export function findAdvantagePreset(value: string, catalogKey = "") {
  return findPreset(advantageCatalog, value, catalogKey, true);
}

export function findPowerEffectPreset(value: string, catalogKey = "") {
  return findPreset(powerEffectCatalog, value, catalogKey);
}

export function findPowerConfigurationPreset(
  value: string,
  configurationKey = "",
) {
  return findPreset(
    powerConfigurationCatalog,
    value,
    configurationKey,
  );
}

export function findEquipmentPreset(value: string, catalogKey = "") {
  return findPreset(equipmentCatalog, value, catalogKey);
}

export function findComplicationPreset(
  value: string,
  catalogKey = "",
  type = "",
) {
  const expectedCategory =
    normalizeCatalogText(type) === "motivacao"
      ? "Motivação"
      : type.trim()
        ? "Complicação"
        : "";
  const catalog = expectedCategory
    ? complicationCatalog.filter(
        (entry) => entry.category === expectedCategory,
      )
    : complicationCatalog;
  return findPreset(catalog, value, catalogKey, true);
}

export function findRankedModifierPreset(
  value: string,
  type: "extra" | "flaw",
) {
  return findPreset(type === "extra" ? extraCatalog : flawCatalog, value);
}

export function findFlatModifierPreset(
  value: string,
  type: "feature" | "drawback",
) {
  return findPreset(type === "feature" ? featureCatalog : drawbackCatalog, value);
}

export function normalizeCatalogText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

/** Accent-insensitive, bilingual and typo-tolerant catalog search. */
export function catalogSearchMatches(entry: CatalogEntry, query: string) {
  const wanted = normalizeCatalogText(query).split(" ").filter(Boolean);
  if (!wanted.length) return true;
  const haystack = normalizeCatalogText([
    entry.label,
    entry.canonical,
    entry.category,
    entry.summary,
    getCatalogCategory(entry.category, "en"),
    getCatalogSummary(entry, "en"),
    ...(entry.aliases ?? []),
  ].join(" "));
  const words = haystack.split(" ").filter(Boolean);
  return wanted.every((token) => {
    if (haystack.includes(token)) return true;
    const stems = token.length > 4 && token.endsWith("s") ? [token, token.slice(0, -1)] : [token];
    return stems.some((stem) => words.some((word) => {
      if (word.startsWith(stem) || stem.startsWith(word)) return true;
      return stem.length >= 5 && word.length >= 5 && Math.abs(stem.length - word.length) <= 1 && editDistanceAtMostOne(stem, word);
    }));
  });
}

function editDistanceAtMostOne(left: string, right: string) {
  if (left === right) return true;
  if (Math.abs(left.length - right.length) > 1) return false;
  let a = left;
  let b = right;
  if (a.length > b.length) [a, b] = [b, a];
  let differences = 0;
  for (let i = 0, j = 0; i < a.length && j < b.length; i += 1, j += 1) {
    if (a[i] === b[j]) continue;
    differences += 1;
    if (differences > 1) return false;
    if (a.length !== b.length) i -= 1;
  }
  return true;
}

function findPreset<T extends CatalogEntry>(
  catalog: T[],
  value: string,
  catalogKey = "",
  allowFocusSuffix = false,
) {
  if (catalogKey === CUSTOM_CATALOG_KEY) return undefined;
  if (catalogKey) {
    const keyed = catalog.find((entry) => entry.id === catalogKey);
    if (keyed) return keyed;
  }
  const normalized = normalizeCatalogText(value);
  if (!normalized) return undefined;
  return catalog.find((entry) => {
    const candidates = [entry.label, entry.canonical, ...(entry.aliases ?? [])]
      .map(normalizeCatalogText)
      .filter(Boolean);
    return candidates.some(
      (candidate) =>
        normalized === candidate ||
        (allowFocusSuffix && normalized.startsWith(`${candidate} `)),
    );
  });
}

function configuration(
  id: string,
  label: string,
  canonical: string,
  primaryEffectId: string,
  summary: string,
  options: Partial<
    Omit<
      PowerConfigurationPreset,
      | "id"
      | "label"
      | "canonical"
      | "category"
      | "summary"
      | "primaryEffectId"
    >
  > = {},
): PowerConfigurationPreset {
  const effect = powerEffectCatalog.find(
    (entry) => entry.id === primaryEffectId,
  );
  if (!effect) {
    throw new Error(
      `Configuração ${canonical} referencia efeito inexistente: ${primaryEffectId}`,
    );
  }
  return {
    id,
    label,
    canonical,
    category: `Configuração · ${effect.effectType}`,
    summary,
    primaryEffectId,
    defaultRank: options.defaultRank ?? 1,
    ...options,
  };
}

function simple(
  id: string,
  label: string,
  canonical: string,
  category: string,
  summary: string,
): CatalogEntry {
  return { id, label, canonical, category, summary };
}

function archetype(
  id: string,
  label: string,
  canonical: string,
  summary: string,
  variants: string[] = [],
): ArchetypePreset {
  return { id, label, canonical, category: "Arquétipo", summary, variants };
}

function skill(
  id: string,
  label: string,
  canonical: string,
  ability: CoreAbilityKey,
  trainedOnly: boolean,
  costClass: "regular" | "specialized",
  action: string,
  specializations: string[],
): SkillPreset {
  return {
    id,
    label,
    canonical,
    category: trainedOnly ? "Somente treinada" : "Uso sem treinamento",
    summary: `${action}; ${specializations.length} especializações sugeridas.`,
    ability,
    trainedOnly,
    costClass,
    action,
    specializations,
  };
}

function ranked(
  id: string,
  label: string,
  canonical: string,
  category: string,
  value: number,
  summary: string,
  maxValue?: number,
): RankedModifierPreset {
  return {
    id,
    label,
    canonical,
    category,
    summary,
    value,
    ...(maxValue ? { maxValue } : {}),
  };
}

function flat(
  id: string,
  label: string,
  canonical: string,
  category: string,
  rank: number,
  maxRank: number | undefined,
  rule: FlatModifierPreset["rule"],
  summary: string,
): FlatModifierPreset {
  return {
    id,
    label,
    canonical,
    category,
    summary,
    rank,
    ...(maxRank ? { maxRank } : {}),
    rule,
  };
}

function effectSummary(id: string) {
  const summaries: Record<string, string> = {
    affliction: "Impõe condições por graus de falha.",
    damage: "Causa condições de dano resistidas por Robustez.",
    "enhanced-trait": "Aumenta um traço escolhido.",
    "enhanced-resistance": "Aumenta uma resistência ou aplica modificadores às graduações já existentes.",
    variable: "Redistribui PP entre traços de um descritor limitado.",
  };
  return summaries[id] ?? "Parâmetros preenchidos automaticamente, com liberdade para editar a configuração.";
}

function featureEquipmentRows(
  prefix: string,
  category: string,
  labels: string[],
): [string, string, string, string, number, string][] {
  return labels.map((label) => [
    `${prefix}-feature-${normalizeCatalogText(label).replaceAll(" ", "-")}`,
    label,
    label,
    category,
    1,
    "Recurso configurável de 1 PE; graduações adicionais podem ampliar o benefício.",
  ]);
}

function equipmentType(category: string) {
  if (category.startsWith("Arma") || category === "Explosivo" || category === "Acessório de arma") return "Arma";
  if (category === "Armadura") return "Armadura";
  if (category.startsWith("Veículo")) return "Veículo";
  if (category === "Recurso de veículo") return "Recurso de veículo";
  if (category === "Recurso de instalação") return "Recurso de instalação";
  return "Equipamento";
}

function equipmentAutomation(
  id: string,
  category: string,
  details: string,
): Pick<EquipmentPreset, "traitBonuses" | "attack"> {
  const traitBonuses: Record<
    string,
    EquipmentPreset["traitBonuses"]
  > = {
    "leather-armor": { toughness: 1 },
    "chain-mail": { toughness: 3 },
    "plate-mail": { toughness: 5 },
    "full-plate": { toughness: 6 },
    "small-shield": { defense: 1, dodge: 1 },
    "medium-shield": { defense: 2, dodge: 2 },
    "large-shield": { defense: 3, dodge: 3 },
  };
  const effectMatch = details.match(
    /(Dano(?:\s+(?:à distância|Penetrante))?|Atordoar|Toxina|Aflição|Ofuscar(?:\s+visão(?:\s+e\s+audição)?)?|Laço)\s+(\d+)/i,
  );
  const area = /\b(?:esfera|cone|linha|área)\b/i.test(details);
  const ranged =
    category === "Arma à distância" ||
    category === "Arma pesada" ||
    category === "Explosivo";
  const effectName = normalizeCatalogText(effectMatch?.[1] ?? "");
  const resistance = effectName.startsWith("dano")
    ? "Robustez"
    : effectName === "laco"
      ? "Esquiva"
      : effectName === "toxina" && /Robustez/i.test(details)
        ? "Robustez"
        : "Fortitude";
  return {
    ...(traitBonuses[id] ? { traitBonuses: traitBonuses[id] } : {}),
    ...(effectMatch
      ? {
          attack: {
            range: area ? "no-check" : ranged ? "ranged" : "close",
            effectRank: Number(effectMatch[2]),
            strengthBased: /baseado em Força/i.test(details),
            resistance,
          },
        }
      : {}),
  };
}
