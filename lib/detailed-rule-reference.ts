import type {
  RuleReferenceCoverage,
  RuleReferenceEntry,
  RuleReferenceKind,
  RuleReferenceSource,
} from "./rule-reference";

const document = "Compilação fornecida da 4E";

type DetailedRow = {
  id: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  formula?: string;
  formulaEn?: string;
  coverage?: RuleReferenceCoverage;
  tags?: string[];
  pages?: string;
};

function source(
  chapter: string,
  chapterEn: string,
  pages: string,
): RuleReferenceSource {
  return { document, chapter, chapterEn, pages };
}

function materialize(
  rows: DetailedRow[],
  options: {
    kind: RuleReferenceKind;
    category: string;
    categoryEn: string;
    chapter: string;
    chapterEn: string;
    pages: string;
    coverage?: RuleReferenceCoverage;
  },
): RuleReferenceEntry[] {
  return rows.map((row) => ({
    id: row.id,
    category: options.category,
    title: row.title,
    summary: row.summary,
    ...(row.formula ? { formula: row.formula } : {}),
    coverage: row.coverage ?? options.coverage ?? "reference",
    kind: options.kind,
    source: source(
      options.chapter,
      options.chapterEn,
      row.pages ?? options.pages,
    ),
    english: {
      category: options.categoryEn,
      title: row.titleEn,
      summary: row.summaryEn,
      ...(row.formula
        ? { formula: row.formulaEn ?? row.formula }
        : {}),
    },
    tags: [
      row.id.replaceAll("-", " "),
      row.title,
      row.titleEn,
      ...(row.tags ?? []),
    ],
  }));
}

const characteristicEntries = materialize(
  [
    {
      id: "trait-lowered",
      title: "Traço reduzido",
      titleEn: "Lowered trait",
      summary:
        "Reduzir um traço altera sua graduação e todos os valores derivados enquanto a condição durar. Em atributos, chegar abaixo de −5 provoca Debilitado.",
      summaryEn:
        "Lowering a trait changes its rank and every derived value while the condition lasts. An ability lowered below −5 becomes Debilitated.",
      pages: "114",
      tags: ["reduzido", "lowered", "atributo"],
    },
    {
      id: "trait-debilitated",
      title: "Traço debilitado",
      titleEn: "Debilitated trait",
      summary:
        "Um traço debilitado deixa de funcionar: testes dependentes falham automaticamente. A consequência específica depende do atributo, resistência, perícia, vantagem ou poder afetado.",
      summaryEn:
        "A Debilitated trait stops functioning and dependent checks automatically fail. The exact consequence depends on the affected ability, resistance, skill, advantage, or power.",
      pages: "114–115",
      tags: ["debilitado", "debilitated", "falha automática"],
    },
    {
      id: "trait-absent",
      title: "Traços ausentes",
      titleEn: "Absent traits",
      summary:
        "Um traço ausente é mostrado como travessão, custa −10 PP e faz falhar automaticamente os testes que o exigem. Ele não pode ser reduzido ou debilitado; Personagens do Jogador precisam de permissão do Narrador.",
      summaryEn:
        "An absent trait is shown as a dash, costs −10 PP, and automatically fails checks that require it. It cannot be Lowered or Debilitated; Player Characters need Narrator permission.",
      formula: "traço ausente = −10 PP",
      formulaEn: "absent trait = −10 PP",
      coverage: "automatic",
      pages: "115–116",
      tags: ["ausente", "absent ability", "construto", "construct"],
    },
    {
      id: "trait-absent-consequences",
      title: "Consequências da ausência",
      titleEn: "Consequences of absence",
      summary:
        "Sem Vigor não há Fortitude nem recuperação natural; sem Agilidade, o personagem fica Paralisado. Ausências mentais removem Vontade e concedem as imunidades indicadas; sem Consciência também não há Presença.",
      summaryEn:
        "No Stamina means no Fortitude or natural recovery; no Agility means Paralyzed. Absent mental traits remove Will and grant the stated immunities; no Awareness also means no Presence.",
      coverage: "automatic",
      pages: "115–116",
      tags: ["vigor", "fortitude", "consciência", "presença", "vontade"],
    },
    {
      id: "size-natural",
      title: "Tamanho natural, espaço e alcance",
      titleEn: "Natural size, space, and reach",
      summary:
        "Tamanho 0 é o padrão. Escolher outro tamanho natural não custa PP, é permanente e determina espaço e alcance conforme a tabela publicada de −5 a 5.",
      summaryEn:
        "Size 0 is the default. Choosing another natural size costs no PP, is permanent, and determines space and reach from the published −5 to 5 table.",
      formula: "alcance = 3/4 do espaço, arredondado; 0,5 arredonda para baixo",
      formulaEn: "reach = 3/4 of space, rounded; 0.5 rounds down",
      coverage: "automatic",
      pages: "116–117",
      tags: ["tamanho", "size", "espaço", "space", "alcance", "reach"],
    },
    {
      id: "size-traits-combat",
      title: "Tamanho, traços e combate",
      titleEn: "Size, traits, and combat",
      summary:
        "Ajustes de Ataque, Dano, Defesa, Robustez, Força, velocidade, Intimidação e Furtividade por tamanho são opcionais. Com diferença de 3+ tamanhos, ataques podem virar Área contra menores ou rotina contra maiores.",
      summaryEn:
        "Size-based Attack, Damage, Defense, Toughness, Strength, speed, Intimidation, and Stealth adjustments are optional. A 3+ size difference can make attacks Area against smaller targets or routine against larger ones.",
      pages: "117–118",
      tags: ["area", "rotina", "routine", "furtividade", "intimidação"],
    },
    {
      id: "size-grabbing",
      title: "Tamanho e agarrar",
      titleEn: "Size and grabbing",
      summary:
        "Agarrar alvos 3+ tamanhos menores concede benefícios equivalentes a Agarrar com Destreza e Imobilização Aprimorada. Contra alvos mais de um tamanho maiores, o sucesso fica limitado sem ajuda ou capacidade de envolvê-los.",
      summaryEn:
        "Grabbing a target 3+ sizes smaller grants the benefits of Grabbing Finesse and Improved Hold. Against targets more than one size larger, success is limited without help or a way to encompass them.",
      pages: "118",
      tags: ["agarrar", "grab", "equipe", "team check"],
    },
    {
      id: "size-movement-falling",
      title: "Tamanho, movimento e queda",
      titleEn: "Size, movement, and falling",
      summary:
        "Mover-se por uma passagem um tamanho menor causa Impedido sem Acrobacia. Em quedas, o material manda considerar tamanho e mantém o teto 18; como o exemplo publicado é ambíguo diante da regra geral, o aplicativo não inventa um cálculo combinado.",
      summaryEn:
        "Moving through a passage one size smaller causes Hindered without Acrobatics. For falls, the material says to account for size and keeps the rank-18 cap; because its example is ambiguous against the general rule, the app does not invent a combined calculation.",
      pages: "118–119",
      tags: ["queda", "falling", "movimento", "passagem"],
    },
    {
      id: "strength-lifting-throwing",
      title: "Erguer e arremessar",
      titleEn: "Lifting and throwing",
      summary:
        "A graduação de massa que o personagem ergue é sua Força para erguer. Para arremessar um objeto que pode levantar, subtraia a massa dessa graduação de Força.",
      summaryEn:
        "The mass rank a character can lift equals Lifting Strength. To throw an object they can lift, subtract its mass rank from that Strength rank.",
      formula: "distância de arremesso = Força para erguer − massa",
      formulaEn: "throwing distance = Lifting Strength − mass",
      coverage: "automatic",
      pages: "119",
      tags: ["força", "lifting", "massa", "arremesso", "throwing"],
    },
    {
      id: "movement-baselines",
      title: "Movimento básico",
      titleEn: "Basic movement",
      summary:
        "Caminhar usa velocidade 1, deslocar-se em cena usa 2 e correr usa 3. Escalar, rastejar e nadar normalmente usam velocidade 0, sujeitos aos testes correspondentes.",
      summaryEn:
        "Walking uses speed 1, action-scene movement uses 2, and running uses 3. Climbing, crawling, and swimming normally use speed 0 and their relevant checks.",
      pages: "119–121",
      tags: ["caminhar", "correr", "nadar", "escalar", "speed"],
    },
    {
      id: "senses-perception",
      title: "Sentidos, percepção e comunicação",
      titleEn: "Senses, perception, and communication",
      summary:
        "Visão é o sentido preciso padrão e audição é o sentido acurado padrão. Alcance, cobertura, ocultação, distância e comunicação modificam o que pode ser percebido e como.",
      summaryEn:
        "Vision is the default accurate sense and hearing is the default acute sense. Range, cover, concealment, distance, and communication change what can be perceived and how.",
      pages: "121–123",
      tags: ["sentidos", "senses", "percepção", "vision", "hearing"],
    },
  ],
  {
    kind: "rule",
    category: "Características",
    categoryEn: "Characteristics",
    chapter: "Capítulo 3 · Atributos",
    chapterEn: "Chapter 3 · Abilities",
    pages: "114–123",
    coverage: "reference",
  },
);

const conditionEntries = materialize(
  [
    {
      id: "condition-blind",
      title: "Cego",
      titleEn: "Blind",
      summary:
        "Não enxerga: fica Impedido, Desatento para visão e Vulnerável, além de sofrer Prejudicado ou Desabilitado quando a visão importa. Um sentido preciso alternativo reduz essas consequências.",
      summaryEn:
        "Cannot see: Hindered, Vision Unaware, and Vulnerable, with Impaired or Disabled applied when vision matters. An alternate accurate sense reduces those consequences.",
    },
    {
      id: "condition-broken",
      title: "Quebrado",
      titleEn: "Broken",
      summary: "O objeto deixa de funcionar, inclusive como barreira quando isso for relevante.",
      summaryEn: "The object no longer functions, including as a barrier when relevant.",
    },
    {
      id: "condition-compelled",
      title: "Compelido",
      titleEn: "Compelled",
      summary:
        "Só pode realizar uma ação padrão escolhida pelo controlador, podendo trocá-la por uma simples. Reações exigem também a reação do controlador; Controlado substitui esta condição.",
      summaryEn:
        "Limited to one standard action chosen by the controller, which may be traded for a simple action. Reactions also cost the controller's reaction; Controlled supersedes this condition.",
    },
    {
      id: "condition-controlled",
      title: "Controlado",
      titleEn: "Controlled",
      summary: "Outro personagem decide todas as ações do alvo, que conserva suas capacidades e opções normais.",
      summaryEn: "Another character dictates all of the target's actions, while the target keeps their normal capabilities and options.",
    },
    {
      id: "condition-dazed",
      title: "Atordoado",
      titleEn: "Dazed",
      summary:
        "Fica limitado a ações livres e uma ação padrão por rodada, que pode virar simples; não pode reagir. Atônito substitui Atordoado.",
      summaryEn:
        "Limited to free actions and one standard action per round, which may become simple; cannot react. Stunned supersedes Dazed.",
    },
    {
      id: "condition-dead",
      title: "Morto",
      titleEn: "Dead",
      summary: "Fica Desamparado, Atônito e Desatento, sem recuperação normal; efeitos específicos ainda podem restaurá-lo.",
      summaryEn: "Helpless, Stunned, and Unaware, with no normal recovery; specific effects may still restore the character.",
    },
    {
      id: "condition-deaf",
      title: "Surdo",
      titleEn: "Deaf",
      summary: "Não ouve, fica Desatento para audição e pode sofrer Prejudicado ou Desabilitado em atividades dependentes de som.",
      summaryEn: "Cannot hear, is Hearing Unaware, and may be Impaired or Disabled for sound-dependent activities.",
    },
    {
      id: "condition-debilitated",
      title: "Debilitado",
      titleEn: "Debilitated",
      summary: "Perde efetivamente o uso do traço afetado e pode receber condições adicionais conforme o tipo desse traço.",
      summaryEn: "Effectively loses the affected trait and may gain additional conditions based on that trait's type.",
    },
    {
      id: "condition-defenseless",
      title: "Indefeso",
      titleEn: "Defenseless",
      summary:
        "Defesa e Esquiva caem para 0, e ataques contra o personagem podem ser rotina. Desamparado substitui Indefeso.",
      summaryEn:
        "Defense and Dodge become 0, and attacks against the character may be routine. Helpless supersedes Defenseless.",
    },
    {
      id: "condition-delusion",
      title: "Delírio",
      titleEn: "Delusion",
      summary: "Alucinação total que pode substituir todo o ambiente percebido; o alvo fica Desatento ao mundo real.",
      summaryEn: "A total hallucination that may replace the entire perceived environment; the target is Unaware of the real world.",
    },
    {
      id: "condition-destroyed",
      title: "Destruído",
      titleEn: "Destroyed",
      summary: "O objeto foi rompido completamente, reduzido a peças, fragmentos ou equivalente.",
      summaryEn: "The object has been completely broken apart into pieces, fragments, or an equivalent state.",
    },
    {
      id: "condition-disabled",
      title: "Desabilitado",
      titleEn: "Disabled",
      summary: "Sofre −5 nos testes de ação, inclusive de rotina; o nome indica os testes específicos quando o efeito não for geral.",
      summaryEn: "Takes −5 on action checks, including routine checks; the condition name identifies affected checks when it is not general.",
      formula: "testes de ação: −5",
      formulaEn: "action checks: −5",
    },
    {
      id: "condition-dying",
      title: "Morrendo",
      titleEn: "Dying",
      summary:
        "Fica Incapacitado e testa Vigor CD 10 ao adquirir a condição e no início de cada turno. Três graus acumulados de falha causam Morte; Medicina CD 15 estabiliza. Sem Vigor, vira Morto imediatamente.",
      summaryEn:
        "Incapacitated and checks Stamina DC 10 on gaining the condition and at each turn's start. Three total failure degrees cause Death; Medicine DC 15 stabilizes. No Stamina means immediate Death.",
      formula: "Vigor CD 10; Medicina CD 15 para estabilizar",
      formulaEn: "Stamina DC 10; Medicine DC 15 to stabilize",
    },
    {
      id: "condition-exhausted",
      title: "Exausto",
      titleEn: "Exhausted",
      summary: "Combina Prejudicado e Impedido. Quatro horas de descanso reduzem a condição para Fatigado.",
      summaryEn: "Combines Impaired and Hindered. Four hours of rest reduce the condition to Fatigued.",
    },
    {
      id: "condition-fatigued",
      title: "Fatigado",
      titleEn: "Fatigued",
      summary: "Fica Impedido e se recupera após uma hora de descanso. Exausto substitui Fatigado.",
      summaryEn: "Hindered and recovers after one hour of rest. Exhausted supersedes Fatigued.",
    },
    {
      id: "condition-figment",
      title: "Ilusão menor",
      titleEn: "Figment",
      summary: "Alucinação de grau leve que altera detalhes pequenos, aparências simples, cores, ruídos ou objetos discretos.",
      summaryEn: "A minor hallucination that changes small details, simple appearances, colors, noises, or unobtrusive objects.",
    },
    {
      id: "condition-frightened",
      title: "Amedrontado",
      titleEn: "Frightened",
      summary: "Sofre −5 em testes de ação ligados à fonte do medo e não pode se aproximar dela voluntariamente.",
      summaryEn: "Takes −5 on action checks related to the fear source and cannot willingly move closer to it.",
    },
    {
      id: "condition-hallucinating",
      title: "Alucinando",
      titleEn: "Hallucinating",
      summary: "Percebe impressões que não existem fora da própria mente; a extensão varia entre Ilusão menor, Fantasia e Delírio.",
      summaryEn: "Experiences impressions that exist only in the mind; the extent ranges from Figment to Phantasm and Delusion.",
    },
    {
      id: "condition-helpless",
      title: "Desamparado",
      titleEn: "Helpless",
      summary:
        "Defesa fica −5, Esquiva 0 e testes de Esquiva falham automaticamente. Ataques podem ser rotina; dano letal pode causar Morrendo ou Morto com falhas suficientes.",
      summaryEn:
        "Defense becomes −5, Dodge 0, and Dodge resistance automatically fails. Attacks may be routine; lethal damage can cause Dying or Dead with enough failure degrees.",
    },
    {
      id: "condition-hindered",
      title: "Impedido",
      titleEn: "Hindered",
      summary: "Reduz a velocidade de movimento em 1 graduação, ou no valor indicado. Abaixo de −5, o movimento fica Imóvel.",
      summaryEn: "Reduces movement speed by 1 rank, or by the listed value. Below −5, that movement becomes Immobile.",
      formula: "velocidade: −1 por condição",
      formulaEn: "speed: −1 per condition",
    },
    {
      id: "condition-hit",
      title: "Ferido",
      titleEn: "Hit",
      summary: "Cada Ferido aplica −1 aos próximos testes contra dano. Uma condição é removida por minuto de descanso; objetos não se recuperam sozinhos.",
      summaryEn: "Each Hit applies −1 to later damage resistance. One is removed per minute of rest; objects do not recover on their own.",
      formula: "resistência a dano: −1 por Ferido",
      formulaEn: "damage resistance: −1 per Hit",
    },
    {
      id: "condition-immobile",
      title: "Imóvel",
      titleEn: "Immobile",
      summary: "Não possui velocidade de movimento, mas ainda pode agir se nenhuma outra condição impedir.",
      summaryEn: "Has no movement speed but may still act unless another condition prevents it.",
    },
    {
      id: "condition-impaired",
      title: "Prejudicado",
      titleEn: "Impaired",
      summary: "Sofre −2 nos testes de ação, inclusive de rotina. Desabilitado substitui a condição quando afeta o mesmo traço.",
      summaryEn: "Takes −2 on action checks, including routine checks. Disabled supersedes it when affecting the same trait.",
      formula: "testes de ação: −2",
      formulaEn: "action checks: −2",
    },
    {
      id: "condition-incapacitated",
      title: "Incapacitado",
      titleEn: "Incapacitated",
      summary: "Combina Desamparado, Atônito e Desatento; normalmente também fica Caído. Em geral se recupera após um minuto.",
      summaryEn: "Combines Helpless, Stunned, and Unaware; usually also becomes Prone. Normally recovers after one minute.",
    },
    {
      id: "condition-lowered",
      title: "Reduzido",
      titleEn: "Lowered",
      summary: "O traço perde graduações, em geral −2 ou −5, e opera no novo valor. Traços a 0 deixam de funcionar, com exceções próprias para atributos.",
      summaryEn: "The trait loses ranks, usually −2 or −5, and operates at the new value. Traits at 0 stop functioning, with special rules for abilities.",
    },
    {
      id: "condition-normal",
      title: "Normal, sem condições",
      titleEn: "Normal",
      summary: "Não está afetado por qualquer outra condição.",
      summaryEn: "Unaffected by any other condition.",
    },
    {
      id: "condition-paralyzed",
      title: "Paralisado",
      titleEn: "Paralyzed",
      summary: "Combina Desamparado e Atônito fisicamente; continua consciente e pode realizar ações puramente mentais sem movimento físico.",
      summaryEn: "Combines Helpless with physical Stunned; remains aware and may take purely mental actions requiring no physical movement.",
    },
    {
      id: "condition-phantasm",
      title: "Fantasia",
      titleEn: "Phantasm",
      summary: "Alucinação de grau maior que acrescenta, remove ou transforma elementos grandes, complexos ou interativos da percepção.",
      summaryEn: "A major hallucination that adds, removes, or transforms large, complex, or interactive elements of perception.",
    },
    {
      id: "condition-prone",
      title: "Caído",
      titleEn: "Prone",
      summary:
        "Sofre −5 em ataques próximos; adjacentes recebem +5 para atacá-lo, enquanto ataques distantes enfrentam cobertura total (+5 Defesa). Move-se rastejando em velocidade 0 até Levantar.",
      summaryEn:
        "Takes −5 on close attacks; adjacent attackers gain +5, while distant attacks face Full Cover (+5 Defense). Crawls at speed 0 until taking Stand.",
    },
    {
      id: "condition-sleeping",
      title: "Dormindo",
      titleEn: "Sleeping",
      summary: "Combina Desamparado, Atônito e Desatento. Três graus em Percepção auditiva ou um estímulo perceptível acordam o personagem.",
      summaryEn: "Combines Helpless, Stunned, and Unaware. Three degrees on hearing Perception or a noticeable stimulus wakes the character.",
    },
    {
      id: "condition-staggered",
      title: "Cambaleante",
      titleEn: "Staggered",
      summary: "Fica Impedido; receber Cambaleante de novo causa Incapacitado. Sem outro dano, um minuto de descanso remove a condição.",
      summaryEn: "Hindered; gaining Staggered again causes Incapacitated. With no other damage, one minute of rest removes it.",
    },
    {
      id: "condition-stunned",
      title: "Atônito",
      titleEn: "Stunned",
      summary: "Não pode realizar qualquer ação, incluindo ações livres e reações.",
      summaryEn: "Cannot take any actions, including free actions and reactions.",
    },
    {
      id: "condition-surprised",
      title: "Surpreso",
      titleEn: "Surprised",
      summary: "Combina Atônito e Vulnerável; normalmente dura apenas uma rodada.",
      summaryEn: "Combines Stunned and Vulnerable; normally lasts only one round.",
    },
    {
      id: "condition-susceptible",
      title: "Suscetível",
      titleEn: "Susceptible",
      summary: "Aumenta em +5 a graduação do efeito antes de calcular a dificuldade do teste de resistência.",
      summaryEn: "Adds +5 to effect rank before determining the resistance check difficulty.",
      formula: "graduação efetiva: +5",
      formulaEn: "effective rank: +5",
    },
    {
      id: "condition-transformed",
      title: "Transformado",
      titleEn: "Transformed",
      summary: "Altera alguns ou todos os traços. Normalmente o total de PP não aumenta, embora possa diminuir durante a transformação.",
      summaryEn: "Changes some or all traits. Total PP normally cannot increase, although it may decrease during the transformation.",
    },
    {
      id: "condition-unaware",
      title: "Desatento",
      titleEn: "Unaware",
      summary: "Tudo tem ocultação total para os sentidos afetados e testes de Percepção dependentes deles falham. Desatenção completa também causa Indefeso e Desabilitado.",
      summaryEn: "Everything has Full Concealment from affected senses and dependent Perception checks fail. Complete Unaware also causes Defenseless and Disabled.",
    },
    {
      id: "condition-vulnerable",
      title: "Vulnerável",
      titleEn: "Vulnerable",
      summary: "Reduz Defesa e Esquiva em 5, até o mínimo 0. Indefeso substitui Vulnerável.",
      summaryEn: "Lowers Defense and Dodge by 5, to a minimum of 0. Defenseless supersedes Vulnerable.",
      formula: "Defesa e Esquiva: −5, mínimo 0",
      formulaEn: "Defense and Dodge: −5, minimum 0",
    },
    {
      id: "condition-weakness",
      title: "Fraqueza",
      titleEn: "Weakness",
      summary: "Aumenta a graduação do efeito em +5 e limita o melhor resultado possível da resistência a um grau de falha.",
      summaryEn: "Adds +5 to effect rank and caps the best possible resistance result at one degree of failure.",
      formula: "graduação efetiva +5; melhor resultado = 1 grau de falha",
      formulaEn: "effective rank +5; best result = 1 failure degree",
    },
  ],
  {
    kind: "condition",
    category: "Condições",
    categoryEn: "Conditions",
    chapter: "Capítulo 1 · O Básico",
    chapterEn: "Chapter 1 · The Basics",
    pages: "29–32",
  },
);

const actionEntries = materialize(
  [
    { id: "action-aid", title: "Ajudar", titleEn: "Aid", summary: "Ação padrão. Teste de Ataque CD 10: um grau concede +2 e três ou mais concedem +5 ao Ataque ou à Defesa de um aliado.", summaryEn: "Standard action. Attack check DC 10: one degree grants +2 and three or more grant +5 to an ally's Attack or Defense." },
    { id: "action-aim", title: "Mirar", titleEn: "Aim", summary: "Ação padrão sem teste; concede um dado bônus no próximo teste de ataque.", summaryEn: "Standard action with no check; grants a bonus die on the next attack check." },
    { id: "action-attack", title: "Atacar", titleEn: "Attack", summary: "Ação padrão: Ataque contra Defesa. Um grau acerta; sucesso adicional produz crítico e +5 no efeito.", summaryEn: "Standard action: Attack versus Defense. One degree hits; added success produces a critical hit and +5 effect." },
    { id: "action-catch", title: "Aparar queda", titleEn: "Catch", summary: "Reação e teste de Agilidade CD 10 para apanhar um objeto em queda livre que esteja ao alcance.", summaryEn: "Reaction and Agility check DC 10 to catch a free-falling object within reach." },
    { id: "action-charge", title: "Investida", titleEn: "Charge", summary: "Ação padrão: mova sua velocidade e faça um ataque próximo com −2 no teste.", summaryEn: "Standard action: move your speed and make a close attack with −2 on the check." },
    { id: "action-command", title: "Comandar", titleEn: "Command", summary: "Ação simples sem teste para dar uma ordem a alguém sob sua direção.", summaryEn: "Simple action with no check to issue an order to someone under your direction." },
    { id: "action-concentrate", title: "Concentrar", titleEn: "Concentrate", summary: "Ação padrão sem teste para manter um efeito de duração concentração.", summaryEn: "Standard action with no check to maintain an effect with concentration duration." },
    { id: "action-counter", title: "Contrapor", titleEn: "Counter", summary: "Ação padrão; compare graduação contra graduação para neutralizar o efeito de outro traço.", summaryEn: "Standard action; compare rank against rank to neutralize another trait's effect." },
    { id: "action-defend", title: "Defender", titleEn: "Defend", summary: "Ação padrão sem teste que concede +2 à Defesa até o início do próximo turno.", summaryEn: "Standard action with no check that grants +2 Defense until the start of the next turn." },
    { id: "action-disarm", title: "Desarmar", titleEn: "Disarm", summary: "Ação padrão: Ataque −2 contra Defesa; depois Dano contra Força. Um grau remove o objeto da mão do defensor.", summaryEn: "Standard action: Attack −2 versus Defense, then Damage versus Strength. One degree removes the held object." },
    { id: "action-drop-prone", title: "Jogar-se no chão", titleEn: "Drop Prone", summary: "Ação livre sem teste; o personagem recebe a condição Caído.", summaryEn: "Free action with no check; the character gains Prone." },
    { id: "action-escape", title: "Escapar", titleEn: "Escape", summary: "Ação livre; Força, Esquiva ou Destreza contra a CD do efeito de agarrar. Sucesso encerra o agarrão.", summaryEn: "Free action; Strength, Dodge, or Dexterity against the grab effect DC. Success ends the grab." },
    { id: "action-evade", title: "Evadir", titleEn: "Evade", summary: "Reação sem teste que concede +2 à resistência de Esquiva contra efeitos de área.", summaryEn: "Reaction with no check that grants +2 Dodge resistance against area effects." },
    { id: "action-feint", title: "Fintar", titleEn: "Feint", summary: "Ação padrão; Ataque contra Ataque, Enganação ou Intuição. Um grau deixa o alvo Vulnerável ao próximo ataque.", summaryEn: "Standard action; Attack versus Attack, Deception, or Insight. One degree makes the target Vulnerable to the next attack." },
    { id: "action-grab", title: "Agarrar", titleEn: "Grab", summary: "Ação padrão: Ataque contra Defesa, depois Força contra Força ou Esquiva. Um grau segura parcialmente; dois ou mais, completamente.", summaryEn: "Standard action: Attack versus Defense, then Strength versus Strength or Dodge. One degree is a partial hold; two or more is complete." },
    { id: "action-impress", title: "Impressionar", titleEn: "Impress", summary: "Ação padrão; perícia de interação contra a mesma perícia, Intuição ou Vontade. Sucesso impõe as condições aplicáveis.", summaryEn: "Standard action; interaction skill versus the same skill, Insight, or Will. Success imposes the applicable conditions." },
    { id: "action-interpose", title: "Interpor", titleEn: "Interpose", summary: "Reação sem teste: mova-se entre aliado e ataque e torne-se o alvo Indefeso.", summaryEn: "Reaction with no check: move between an ally and an attack and become its Defenseless target." },
    { id: "action-move", title: "Mover", titleEn: "Move", summary: "Ação simples para percorrer sua velocidade normal. Atletismo CD 15 aumenta a velocidade em 1 nessa ação.", summaryEn: "Simple action to travel at normal speed. Athletics DC 15 increases speed by 1 for that action." },
    { id: "action-notice", title: "Notar", titleEn: "Notice", summary: "Não é uma ação; teste de Percepção para notar algo que já poderia ser percebido.", summaryEn: "Not an action; a Perception check to notice something that could already be perceived." },
    { id: "action-observe", title: "Observar", titleEn: "Observe", summary: "Ação simples e teste de Percepção para tentar perceber algo novo.", summaryEn: "Simple action and Perception check to try to perceive something new." },
    { id: "action-ready", title: "Preparar", titleEn: "Ready", summary: "Ação padrão sem teste que prepara outra ação para ocorrer depois de um gatilho definido.", summaryEn: "Standard action with no check that readies another action to occur after a defined trigger." },
    { id: "action-slam", title: "Colisão", titleEn: "Slam", summary: "Ação padrão: mova sua velocidade e ataque com −2. O dano recebe +1 ou usa a graduação da distância percorrida.", summaryEn: "Standard action: move your speed and attack at −2. Damage gains +1 or uses the distance rank moved." },
    { id: "action-smash", title: "Esmagar objeto", titleEn: "Smash", summary: "Ação padrão: Ataque −2, ou −5 contra objeto empunhado, para causar dano ao objeto.", summaryEn: "Standard action: Attack −2, or −5 against a held object, to damage that object." },
    { id: "action-stand", title: "Levantar", titleEn: "Stand", summary: "Ação livre; Acrobacia ou velocidade contra CD 20. Falha remove Caído, mas deixa Impedido até o próximo turno.", summaryEn: "Free action; Acrobatics or speed versus DC 20. Failure still ends Prone but leaves Hindered until the next turn." },
    { id: "action-sustain", title: "Sustentar", titleEn: "Sustain", summary: "Ação livre sem teste para manter um efeito de duração sustentada.", summaryEn: "Free action with no check to maintain an effect with sustained duration." },
    { id: "action-trick", title: "Enganar", titleEn: "Trick", summary: "Ação padrão; Enganação contra Enganação ou Intuição. Sucesso deixa o oponente alheio a um perigo ou risco.", summaryEn: "Standard action; Deception versus Deception or Insight. Success leaves the opponent heedless of a danger or risk." },
    { id: "action-trip", title: "Derrubar", titleEn: "Trip", summary: "Ação padrão: Ataque contra Defesa, seguido de Ataque ou Força contra Força ou Defesa. Um grau deixa o alvo Caído.", summaryEn: "Standard action: Attack versus Defense, then Attack or Strength versus Strength or Defense. One degree makes the target Prone." },
    { id: "action-tumble", title: "Amortecer queda", titleEn: "Tumble", summary: "Ação livre ou reação; Acrobacia CD 5 reduz o dano de queda em 1 graduação por grau de sucesso.", summaryEn: "Free action or reaction; Acrobatics DC 5 reduces falling damage by 1 rank per success degree." },
    { id: "action-use-effect", title: "Usar efeito", titleEn: "Use Effect", summary: "O tipo de ação e o teste variam conforme o efeito; use os parâmetros registrados na ficha e a descrição do efeito.", summaryEn: "Action type and check vary by effect; use the parameters recorded on the sheet and the effect description." },
  ],
  {
    kind: "action",
    category: "Ações",
    categoryEn: "Actions",
    chapter: "Apêndice · Ações",
    chapterEn: "Appendix · Actions",
    pages: "430–431",
  },
);

const sceneEntries = materialize(
  [
    { id: "scene-conflict", title: "Cena de conflito", titleEn: "Conflict scene", summary: "Uma luta ou batalha normalmente acompanhada em rodadas, iniciativa, turnos, ações, reações, ataques e resistências.", summaryEn: "A fight or battle normally tracked through rounds, initiative, turns, actions, reactions, attacks, and resistances.", pages: "352–370" },
    { id: "scene-challenge", title: "Cena de desafio", titleEn: "Challenge scene", summary: "Um obstáculo, fuga ou objetivo pode ser narrativo ou uma sequência com intervalo, testes permitidos, limiares de sucesso e falha e consequências.", summaryEn: "An obstacle, escape, or goal may be narrative or a sequence with intervals, allowed checks, success and failure thresholds, and consequences.", pages: "371–383" },
    { id: "scene-investigation", title: "Cena de investigação", titleEn: "Investigation scene", summary: "Os heróis seguem pistas, pesquisam e reúnem informação. Pode ser livre ou usar uma sequência; uma pista essencial não deve depender de um único teste.", summaryEn: "Heroes follow clues, research, and gather information. It may be freeform or use a sequence; an essential clue should not depend on one check.", pages: "384–387" },
    { id: "scene-interaction", title: "Cena de interação", titleEn: "Interaction scene", summary: "O foco é a relação social e a interpretação. Testes de interação podem alterar atitudes, impor condições sociais ou resolver disputas quando houver incerteza real.", summaryEn: "The focus is social relationships and roleplay. Interaction checks may shift attitudes, impose social conditions, or settle disputes when genuine uncertainty exists.", pages: "388–393" },
  ],
  {
    kind: "scene",
    category: "Tipos de cena",
    categoryEn: "Scene types",
    chapter: "Capítulo 8 · Ação e Aventura",
    chapterEn: "Chapter 8 · Action & Adventure",
    pages: "347–393",
  },
);

const hazardEntries = materialize(
  [
    { id: "hazard-chemicals", title: "Produtos químicos", titleEn: "Chemicals", summary: "Ácidos e substâncias corrosivas normalmente causam dano por contato e podem continuar agindo até serem removidos ou contrapostos; a graduação depende da concentração.", summaryEn: "Acids and corrosive substances normally deal contact damage and may continue until removed or countered; rank depends on concentration.", pages: "375" },
    { id: "hazard-collapses", title: "Desabamentos", titleEn: "Collapses", summary: "Quem está na área resiste ao dano da massa em queda e pode ficar soterrado. Cobertura, fuga, escavação e capacidade de erguer determinam resgate e consequências.", summaryEn: "Anyone in the area resists damage from falling mass and may be buried. Cover, escape, burrowing, and lifting capacity determine rescue and consequences.", pages: "375–376" },
    { id: "hazard-darkness", title: "Escuridão", titleEn: "Darkness", summary: "Escuridão oferece ocultação para visão; iluminação, visão no escuro e outros sentidos determinam se ela é parcial ou total para cada personagem.", summaryEn: "Darkness provides visual concealment; lighting, darkvision, and other senses determine whether it is partial or full for each character.", pages: "376" },
    { id: "hazard-deprivation", title: "Privação", titleEn: "Deprivation", summary: "Falta de alimento, água ou sono exige testes crescentes de Fortitude em intervalos definidos e progride por fadiga até Incapacitado ou pior.", summaryEn: "Lack of food, water, or sleep calls for escalating Fortitude checks at set intervals and progresses through fatigue to Incapacitated or worse.", pages: "376–377" },
    { id: "hazard-disease", title: "Doença", titleEn: "Disease", summary: "A exposição inicia um teste de Fortitude contra CD 10 + graduação; novos testes ocorrem no intervalo da doença e suas falhas aplicam o efeito descrito.", summaryEn: "Exposure starts a Fortitude check against DC 10 + rank; later checks occur at the disease interval and failures apply its listed effect.", formula: "CD = 10 + graduação", formulaEn: "DC = 10 + rank", pages: "377" },
    { id: "hazard-electricity", title: "Eletricidade", titleEn: "Electricity", summary: "Choque elétrico causa dano conforme a fonte, de aparelhos domésticos a raios e linhas de transmissão; contato ou condução define a exposição.", summaryEn: "Electrical shock deals damage based on the source, from household appliances to lightning and transmission lines; contact and conduction determine exposure.", pages: "377–378" },
    { id: "hazard-falling", title: "Queda", titleEn: "Falling", summary: "Uma queda causa dano igual ao dobro da graduação da distância, no máximo 18, antes dos ajustes de tamanho e Acrobacia.", summaryEn: "A fall deals damage equal to twice its distance rank, capped at 18, before size and Acrobatics adjustments.", formula: "dano = min(18, 2 × graduação da distância)", formulaEn: "damage = min(18, 2 × distance rank)", pages: "378" },
    { id: "hazard-fire", title: "Fogo", titleEn: "Fire", summary: "O fogo causa dano ao contato e no início de turnos em contato. Quem sofre condição de dano permanece em chamas com dano igual à metade da fonte, arredondada para cima, até apagar.", summaryEn: "Fire deals damage on contact and at the start of turns in contact. A target taking damage remains aflame at half the source rank, rounded up, until extinguished.", pages: "378–379" },
    { id: "hazard-fog", title: "Nevoeiro", titleEn: "Fog", summary: "Nevoeiro concede ocultação parcial a tudo dentro da área coberta.", summaryEn: "Fog grants Partial Concealment to everything within the covered area.", pages: "379" },
    { id: "hazard-free-fall", title: "Queda livre", titleEn: "Free-Fall", summary: "Sem gravidade, um impulso move em linha reta com velocidade 2 até encontrar obstáculo. Mover-se é perigoso e normalmente exige Acrobacia CD 15 ou maior.", summaryEn: "In free-fall, a push moves in a straight line at speed 2 until an obstacle. Movement is hazardous and normally requires Acrobatics DC 15 or higher.", pages: "379" },
    { id: "hazard-hazardous-movement", title: "Movimento perigoso", titleEn: "Hazardous Movement", summary: "Exige Acrobacia ou Atletismo. Um grau de falha impede progresso; dois ou mais também provocam queda, afundamento ou consequência equivalente.", summaryEn: "Requires Acrobatics or Athletics. One failure degree prevents progress; two or more also cause a fall, sinking, or an equivalent consequence.", pages: "379" },
    { id: "hazard-hindering-movement", title: "Movimento impeditivo", titleEn: "Hindering Movement", summary: "O terreno aplica Impedido, reduzindo cada modo de movimento em 1 graduação por condição; abaixo de −5, esse modo fica Imóvel.", summaryEn: "Terrain applies Hindered, reducing each movement mode by 1 rank per condition; below −5, that mode becomes Immobile.", pages: "379" },
    { id: "hazard-intoxication", title: "Intoxicação", titleEn: "Intoxication", summary: "Álcool ou drogas normalmente causam Prejudicado ou Desabilitado, embora outras condições sejam possíveis. Imunidade a Toxinas evita o efeito.", summaryEn: "Alcohol or drugs normally cause Impaired or Disabled, although other conditions are possible. Toxin Immunity prevents the effect.", pages: "379" },
    { id: "hazard-precipitation", title: "Precipitação", titleEn: "Precipitation", summary: "Chuva, neve e granizo alteram visibilidade e terreno. Chuva ou neve pesadas dão ocultação parcial; granizo afeta audição e, em casos intensos, pode causar dano.", summaryEn: "Rain, snow, and hail alter visibility and terrain. Heavy rain or snow grants Partial Concealment; hail affects hearing and may deal damage when severe.", pages: "379–380" },
    { id: "hazard-pressure", title: "Pressão", titleEn: "Pressure", summary: "Pressão elevada causa dano em intervalos que aumentam com a profundidade. Imunidade ignora; Redução divide a graduação do dano antes da resistência.", summaryEn: "High pressure deals damage at intervals that intensify with depth. Immunity ignores it; Reduction halves damage rank before resistance.", pages: "380" },
    { id: "hazard-quicksand", title: "Areia movediça", titleEn: "Quicksand", summary: "Percepção CD 15 detecta o perigo em velocidade normal. Presos testam Atletismo CD 10 para boiar ou CD 15 para mover; duas falhas fazem afundar e iniciar sufocamento.", summaryEn: "Perception DC 15 spots the hazard at normal speed. Trapped characters use Athletics DC 10 to tread or DC 15 to move; two failure degrees cause sinking and suffocation.", pages: "380" },
    { id: "hazard-radiation", title: "Radiação", titleEn: "Radiation", summary: "Pode gerar transformação ou complicação; mecanicamente pode funcionar como doença, com Fortitude contra CD 10 + graduação e novo teste diário, aplicando Reduzir Vigor ou dano.", summaryEn: "May cause transformation or a complication; mechanically it may work as a disease, with Fortitude against DC 10 + rank and a daily recheck, applying Lower Stamina or damage.", formula: "CD = 10 + graduação da radiação", formulaEn: "DC = 10 + radiation rank", pages: "380–381" },
    { id: "hazard-space", title: "Espaço sideral", titleEn: "Space", summary: "O espaço expõe simultaneamente a radiação e vácuo. Sobrevivência confiável exige proteção contra Sufocamento, Vácuo e Radiação, ou imunidade mais ampla.", summaryEn: "Outer space combines radiation and vacuum exposure. Reliable survival requires protection from Suffocation, Vacuum, and Radiation, or broader immunity.", pages: "381" },
    { id: "hazard-suffocation", title: "Sufocamento", titleEn: "Suffocation", summary: "Prende a respiração por graduação de tempo 3 mais duas rodadas por Vigor; depois testa Fortitude CD 10, +1 por rodada. Falha causa Incapacitado e, na rodada seguinte, Morrendo.", summaryEn: "Hold breath for time rank 3 plus two rounds per Stamina; then check Fortitude DC 10, +1 each round. Failure causes Incapacitated and Dying on the following round.", pages: "381" },
    { id: "hazard-temperature", title: "Temperatura extrema", titleEn: "Temperature", summary: "Calor ou frio exige Fortitude CD 10, +1 por teste anterior, em intervalos definidos pela intensidade. Falhas avançam de Fatigado para Exausto, Incapacitado e Morrendo.", summaryEn: "Heat or cold requires Fortitude DC 10, +1 per prior check, at intervals set by intensity. Failures progress from Fatigued to Exhausted, Incapacitated, and Dying.", pages: "381" },
    { id: "hazard-tidal-waves", title: "Maremotos", titleEn: "Tidal Waves", summary: "Trate a onda como desabamento de água, possivelmente com +1 a +4 no dano; em vez de soterrar, ela arrasta e exige Atletismo de natação muito difícil.", summaryEn: "Treat the wave as a water collapse, possibly with +1 to +4 damage; instead of burying, it sweeps targets away and demands very difficult swimming Athletics.", pages: "381–382" },
    { id: "hazard-toxins", title: "Toxinas", titleEn: "Toxins", summary: "Toxinas normalmente são resistidas por Fortitude e usam Aflição ou Dano conforme o agente. Imunidade evita, Redução melhora a resistência e Medicina pode ajudar.", summaryEn: "Toxins normally use Fortitude and an Affliction or Damage based on the agent. Immunity prevents, Reduction improves resistance, and Medicine may help.", pages: "382" },
    { id: "hazard-underwater", title: "Submerso", titleEn: "Underwater", summary: "Submersão altera movimento, ataques, ocultação, fogo, invisibilidade, percepção, temperatura e pressão. Ataques próximos e à distância através da água normalmente sofrem −2.", summaryEn: "Submersion changes movement, attacks, concealment, fire, invisibility, perception, temperature, and pressure. Close and ranged attacks through water normally take −2.", pages: "382–383" },
    { id: "hazard-vacuum", title: "Vácuo", titleEn: "Vacuum", summary: "Exige Fortitude CD 15 por rodada, +1 a cada rodada; falha causa Incapacitado. A partir da terceira rodada, outro teste de Fortitude CD 20 resiste à dor e condições cumulativas.", summaryEn: "Requires Fortitude DC 15 each round, +1 per round; failure causes Incapacitated. From round three, another Fortitude DC 20 check resists pain and cumulative conditions.", pages: "383" },
    { id: "hazard-wind", title: "Vento", titleEn: "Wind", summary: "A intensidade define Contrapor contra fogo e penalidades em ataques à distância e Percepção auditiva. Tornados ainda puxam personagens, causam dano e podem arremessá-los.", summaryEn: "Intensity sets Counter rank against fire and penalties to ranged attacks and hearing Perception. Tornadoes also pull characters, deal damage, and may throw them.", pages: "383" },
  ],
  {
    kind: "hazard",
    category: "Perigos ambientais",
    categoryEn: "Environmental hazards",
    chapter: "Capítulo 8 · Ação e Aventura",
    chapterEn: "Chapter 8 · Action & Adventure",
    pages: "375–383",
  },
);

export const detailedRuleReferenceEntries: RuleReferenceEntry[] = [
  ...characteristicEntries,
  ...conditionEntries,
  ...actionEntries,
  ...sceneEntries,
  ...hazardEntries,
];
