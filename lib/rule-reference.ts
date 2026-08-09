export type RuleReferenceCoverage = "automatic" | "assisted" | "reference";

export type RuleReferenceEntry = {
  id: string;
  category: string;
  title: string;
  summary: string;
  formula?: string;
  coverage: RuleReferenceCoverage;
  tags: string[];
};

type RuleReferenceLanguage = "pt" | "en";

const englishRuleReferences: Record<
  string,
  Pick<RuleReferenceEntry, "category" | "title" | "summary"> & {
    formula?: string;
  }
> = {
  "creation-concept": {
    category: "Creation",
    title: "Concept, origin, and archetype",
    summary: "Concept, origin, and archetype guide choices without blocking combinations. Catalog options are suggestions, and every field accepts original content.",
  },
  "creation-motivation": {
    category: "Creation",
    title: "Motivation and complications",
    summary: "Player Characters need at least one identified and described motivation. Other complications record when the story creates meaningful difficulties.",
  },
  "power-level": {
    category: "Power Level",
    title: "Power Level",
    summary: "PL measures overall effectiveness. Common benchmarks run from 5 to 20 or higher, while the formulas accept any nonnegative PL without an artificial cap.",
    formula: "suggested PP = PL × 15",
  },
  "power-level-offense": {
    category: "Power Level",
    title: "Attack and effect",
    summary: "For an effect that requires an attack check, the highest applicable bonus and final effect rank form a pair. Effects without an attack check use their own rank as the limit.",
    formula: "attack + effect ≤ 2 × PL; no check: effect ≤ PL",
  },
  "power-level-defense": {
    category: "Power Level",
    title: "Defenses and Toughness",
    summary: "The audit considers the strongest possible power configuration and separately checks close defense, ranged defense, and Dodge when paired with Toughness.",
    formula: "defense + Toughness ≤ 2 × PL",
  },
  "power-level-resistances": {
    category: "Power Level",
    title: "Fortitude and Will",
    summary: "Fortitude and Will may trade emphasis as long as their total remains within the PL limit.",
    formula: "Fortitude + Will ≤ 2 × PL",
  },
  "power-level-skills-initiative": {
    category: "Power Level",
    title: "Skills, initiative, and heroic uses",
    summary: "The audit uses the highest possible skill total, derived initiative, and heroic uses actually marked during the adventure.",
    formula: "skill ≤ PL + 10; initiative ≤ 2 × PL; heroic uses ≤ ⌊PL ÷ 2⌋",
  },
  "point-budget": {
    category: "Power Points",
    title: "Budget and build type",
    summary: "Player Characters use the suggested budget or an explicit custom total. For NPCs, the budget and limits remain informative without blocking the build.",
    formula: "suggested budget = PL × 15 PP",
  },
  "ability-cost": {
    category: "Power Points",
    title: "Abilities",
    summary: "Each ability rank costs 2 PP. Negative ranks return points down to the normal minimum of −5, and derived values recalculate immediately.",
    formula: "cost = rank × 2 PP; minimum = −5",
  },
  "combat-cost": {
    category: "Power Points",
    title: "Combat, defenses, and resistances",
    summary: "General Attack and Defense cost 2 PP per rank. Specializations, range adjustments, purchased initiative, and resistances use their own formulas and update derived totals.",
    formula: "Attack and Defense: 2 PP/rank; range: 1 PP/rank; specialization: 1 PP/2 ranks; initiative: 1 PP/4 ranks; resistance: 1 PP/rank.",
  },
  "skill-cost": {
    category: "Skills",
    title: "Skill ranks",
    summary: "Regular skills cost 1 PP per 2 ranks. Expertise and Performance are trained only and combine broad and narrow specialization ranks at 1 PP per 4 ranks.",
    formula: "total = ability + ranks + specialization + others",
  },
  "skill-checks": {
    category: "Skills",
    title: "Checks and routine tasks",
    summary: "A check combines d20 and a modifier against a Difficulty Class. When routine is allowed, use 10 on the die; circumstances and opposition may still require a roll.",
    formula: "check = d20 + modifier; routine = 10 + modifier",
  },
  "graded-checks": {
    category: "Skills",
    title: "Degrees and added results",
    summary: "Meeting or exceeding the DC gives one degree of success. Each full 5 above improves success; each 5 below worsens failure. A 20 adds +5 and a 1 applies −5.",
    formula: "success: 1 + ⌊(total − DC) ÷ 5⌋; failure: ⌈(DC − total) ÷ 5⌉",
  },
  "bonus-penalty-dice": {
    category: "Skills",
    title: "Bonus dice, penalty dice, and Luck",
    summary: "Bonus dice keep the highest d20 and penalty dice keep the lowest; they cancel one for one. In routine checks they are worth ±5. Luck rerolls a die, adds 10 when the new result is 10 or less, and keeps the preferred result.",
  },
  "opposed-team-group-checks": {
    category: "Skills",
    title: "Opposed, team, and group checks",
    summary: "In opposition, the highest result wins; ties favor the highest modifier and then chance. In teamwork, each helper degree against DC 10 grants +1. A group succeeds when at least half pass.",
  },
  "skill-specializations": {
    category: "Skills",
    title: "Specializations and sequences",
    summary: "Specializations define a narrow application. Complex scenes can chain checks so one step changes the position, options, or difficulty of the next.",
  },
  "check-sequences": {
    category: "Skills",
    title: "Check sequences",
    summary: "A sequence accumulates success degrees toward its goal or failure degrees toward a Narrator-defined limit. Each step states timing, available checks, and consequences; a routine step grants only one degree.",
  },
  advantages: {
    category: "Advantages",
    title: "Advantages and ranks",
    summary: "Each rank costs 1 PP. The catalog records category, focus, whether ranks are allowed, and any limits. Custom options remain available and are flagged for review.",
    formula: "cost = ranks × 1 PP",
  },
  "heroic-resources": {
    category: "Heroic resources",
    title: "Hero Points, Luck, and heroic advantages",
    summary: "Hero Points and Luck track different resources. Heroic-advantage uses cannot exceed either purchased ranks or the adventure limit set by PL.",
  },
  "extra-effort": {
    category: "Heroic resources",
    title: "Extra Effort and power stunts",
    summary: "Extra Effort can briefly exceed normal performance; power stunts represent coherent alternate uses of effects and descriptors. Narrative cost and consequences belong to the scene.",
  },
  effects: {
    category: "Powers",
    title: "Effects, descriptors, and parameters",
    summary: "The effect defines mechanics while descriptors explain how it manifests. Action, range, duration, resistance, and attack check have dedicated, editable fields.",
  },
  "effect-cost": {
    category: "Powers",
    title: "Effect and modifier cost",
    summary: "Extras and flaws change cost per rank; fixed features and drawbacks apply afterward. A modifier covering only some ranks is calculated in separate segments without early rounding.",
    formula: "((base cost + extras − flaws) × ranks) + features − drawbacks",
  },
  arrays: {
    category: "Powers",
    title: "Arrays and alternate configurations",
    summary: "An array has one base configuration and alternatives with applicable restrictions. The audit checks the base, highest cost, permanent effects, Removable, and exclusivity of nondynamic configurations.",
  },
  removable: {
    category: "Powers",
    title: "Removable",
    summary: "The Removable discount is calculated on the relevant cost and, in an array, applies only to the base configuration so it is not counted twice.",
    formula: "discount per started 5 PP: −1 Removable; −2 Easily Removable; −4 Equipment rank",
  },
  attacks: {
    category: "Conflicts",
    title: "Attacks and resistance",
    summary: "Attacks link the best applicable accuracy to final effect rank. The sheet shows bonus, effect, resistance, effect DC, and PL limit; the d20 resolution happens at the table.",
    formula: "base effect DC = 10 + final rank",
  },
  "damage-resistance": {
    category: "Conflicts",
    title: "Damage resistance",
    summary: "Two or more success degrees avoid new conditions; one degree causes Hit. Failures cumulatively add Dazed or Prone, Staggered, and Incapacitated. Each Hit applies −1 to later damage resistance.",
    formula: "DC = 10 + damage rank; effective resistance = resistance − Hits",
  },
  "resistance-degrees": {
    category: "Conflicts",
    title: "Resistance degrees",
    summary: "Immunity skips the check. Impervious ignores effects at or below its rank; Reduction halves rank; Improved grants a bonus die; Susceptible adds 5 to effect rank; Weakness also caps the result at one failure degree.",
  },
  maneuvers: {
    category: "Conflicts",
    title: "Maneuvers, grabs, and threats",
    summary: "Grab, trip, feint, impress, and other maneuvers combine checks, defenses, and conditions. Recorded advantages and specializations adjust the available options.",
  },
  "reactions-teamwork": {
    category: "Conflicts",
    title: "Reactions, teamwork, and protection",
    summary: "Reactions happen when their trigger occurs. Team attacks, Counter, and Interpose depend on situation and coordination; related advantages remain searchable in the catalog.",
  },
  minions: {
    category: "Conflicts",
    title: "Minions and Takedown",
    summary: "Minions streamline large conflicts. Takedown and similar advantages can chain actions against suitable targets while respecting range, circumstances, and the advantage description.",
  },
  "actions-initiative": {
    category: "Scenes",
    title: "Rounds, actions, and initiative",
    summary: "Initiative derives from Agility, purchased bonuses, and powers. Action types, movement, and reactions structure the turn while the editor records effect parameters without imposing a narrative order.",
  },
  environments: {
    category: "Scenes",
    title: "Environments, hazards, and challenges",
    summary: "Environments and hazards define their own circumstances, DCs, resistances, and consequences. Use notes, conditions, and complications for scene-specific details.",
  },
  conditions: {
    category: "Conditions",
    title: "Conditions and recovery",
    summary: "The sheet keeps a bilingual condition list and allows any combination. Resistances, result degrees, treatment, and recovery resolve according to the effect and scene.",
  },
  measurements: {
    category: "Scales",
    title: "Ranks and measurements",
    summary: "Mass, time, distance, and volume use approximate values. Each rank increase doubles the measure, and values outside the table extrapolate using the same pattern.",
    formula: "+1 rank = ×2; −1 rank = ÷2",
  },
  "measurement-relations": {
    category: "Scales",
    title: "Travel, duration, and throwing",
    summary: "Ranks estimate distance traveled, travel duration, and throwing distance. Values remain approximate and extrapolate beyond the table with the same doubling pattern.",
    formula: "distance = time + speed; time = distance − speed; throw = Strength − mass",
  },
  "movement-senses": {
    category: "Scales",
    title: "Movement, senses, and range",
    summary: "Movement and sense ranks use the measurement scale as a reference, while descriptors, range, and environmental conditions determine concrete use.",
  },
  equipment: {
    category: "Equipment",
    title: "Equipment, weapons, and protection",
    summary: "Catalog items keep Equipment Point costs and mechanical links. Weapons create attacks; active armor and shields alter the corresponding defenses without counting a benefit twice.",
  },
  "custom-content": {
    category: "Freedom",
    title: "Custom content and campaign rules",
    summary: "Any option can become custom content. Free mode never blocks the sheet; the audit separates objective violations from decisions that only need Narrator confirmation.",
  },
};

export function localizeRuleReference(
  entry: RuleReferenceEntry,
  language: RuleReferenceLanguage,
): RuleReferenceEntry {
  if (language === "pt") return entry;
  const translated = englishRuleReferences[entry.id];
  return translated
    ? { ...entry, ...translated, tags: [...entry.tags, translated.title, translated.summary] }
    : entry;
}

/**
 * Índice curto e autoral das regras relacionadas à criação e à conferência de
 * fichas. Ele não reproduz o texto do livro: explica o que o aplicativo calcula,
 * o que o modo assistido mantém coerente e o que continua sendo uma decisão de
 * mesa. A distinção evita prometer automação onde o contexto narrativo é essencial.
 */
export const ruleReferenceEntries: RuleReferenceEntry[] = [
  {
    id: "creation-concept",
    category: "Criação",
    title: "Conceito, origem e arquétipo",
    summary:
      "Conceito, origem e arquétipo orientam as escolhas, mas não bloqueiam combinações. As opções do catálogo aparecem como sugestões, e todos os campos aceitam conteúdo próprio.",
    coverage: "assisted",
    tags: ["identidade", "conceito", "origem", "arquétipo", "liberdade"],
  },
  {
    id: "creation-motivation",
    category: "Criação",
    title: "Motivação e complicações",
    summary:
      "Personagens heroicos precisam de ao menos uma motivação identificada e descrita. Outras complicações registram quando a história cria dificuldades relevantes.",
    coverage: "automatic",
    tags: ["motivação", "complicação", "ponto heroico", "história"],
  },
  {
    id: "power-level",
    category: "Nível de Poder",
    title: "Nível de Poder",
    summary:
      "NP mede a eficácia geral do personagem. Os marcos mais comuns vão de 5 a 20 ou mais, mas as fórmulas aceitam qualquer NP não negativo, sem criar um teto artificial.",
    formula: "PP sugeridos = NP × 15",
    coverage: "automatic",
    tags: ["np", "pl", "nível", "pontos de poder", "pp"],
  },
  {
    id: "power-level-offense",
    category: "Nível de Poder",
    title: "Ataque e efeito",
    summary:
      "Para um efeito que exige teste de ataque, o maior bônus aplicável e a graduação final do efeito formam um par. Efeitos sem teste de ataque usam a própria graduação como limite.",
    formula: "ataque + efeito ≤ 2 × NP; sem teste: efeito ≤ NP",
    coverage: "automatic",
    tags: ["ataque", "efeito", "limite", "acerto", "trade-off"],
  },
  {
    id: "power-level-defense",
    category: "Nível de Poder",
    title: "Defesas e Robustez",
    summary:
      "A conferência considera a maior configuração possível dos poderes e verifica separadamente Defesa corpo a corpo, Defesa à distância e Esquiva quando combinadas com Robustez.",
    formula: "defesa + Robustez ≤ 2 × NP",
    coverage: "automatic",
    tags: ["defesa", "esquiva", "robustez", "toughness", "trade-off"],
  },
  {
    id: "power-level-resistances",
    category: "Nível de Poder",
    title: "Fortitude e Vontade",
    summary:
      "Fortitude e Vontade podem trocar ênfase entre si, desde que o total permaneça dentro do limite do NP.",
    formula: "Fortitude + Vontade ≤ 2 × NP",
    coverage: "automatic",
    tags: ["fortitude", "vontade", "will", "resistência"],
  },
  {
    id: "power-level-skills-initiative",
    category: "Nível de Poder",
    title: "Perícias, iniciativa e usos heroicos",
    summary:
      "A auditoria usa o maior total possível de perícia, a iniciativa derivada e os usos efetivamente marcados durante a aventura.",
    formula: "perícia ≤ NP + 10; iniciativa ≤ 2 × NP; usos heroicos ≤ ⌊NP ÷ 2⌋",
    coverage: "automatic",
    tags: ["perícia", "iniciativa", "heroico", "limite"],
  },
  {
    id: "point-budget",
    category: "Pontos de Poder",
    title: "Orçamento e tipo de construção",
    summary:
      "Personagens heroicos usam o orçamento sugerido ou um total personalizado explícito. Para NPCs, orçamento e limites aparecem como referência, sem impedir a construção.",
    formula: "orçamento sugerido = NP × 15 PP",
    coverage: "automatic",
    tags: ["orçamento", "npc", "personagem heroico", "pp"],
  },
  {
    id: "ability-cost",
    category: "Pontos de Poder",
    title: "Atributos",
    summary:
      "Cada graduação de atributo custa 2 PP. Graduações negativas devolvem pontos até o mínimo normal de −5; os valores derivados são recalculados imediatamente.",
    formula: "custo = graduação × 2 PP; mínimo = −5",
    coverage: "automatic",
    tags: ["habilidade", "atributo", "custo", "mínimo"],
  },
  {
    id: "combat-cost",
    category: "Pontos de Poder",
    title: "Combate, defesas e resistências",
    summary:
      "Ataque e Defesa gerais custam 2 PP por graduação. Especializações, ajustes de alcance, iniciativa comprada e resistências usam fórmulas próprias e atualizam os totais derivados.",
    formula: "Ataque e Defesa: 2 PP por graduação; alcance: 1 PP por graduação; especialização: 1 PP a cada 2 graduações; iniciativa: 1 PP a cada 4 graduações; resistência: 1 PP por graduação.",
    coverage: "automatic",
    tags: ["combate", "defesa", "resistência", "iniciativa", "custo"],
  },
  {
    id: "skill-cost",
    category: "Perícias",
    title: "Graduações de perícia",
    summary:
      "Perícias regulares custam 1 PP por 2 graduações. Especialidade e Atuação são somente treinadas e reúnem graduações e especialização estreita a 1 PP por 4 graduações.",
    formula: "total = atributo + graduações + especialização + outros",
    coverage: "automatic",
    tags: ["perícia", "especialidade", "atuação", "treinada", "custo"],
  },
  {
    id: "skill-checks",
    category: "Perícias",
    title: "Testes e tarefas de rotina",
    summary:
      "Um teste combina d20 e modificador contra uma Classe de Dificuldade. Quando a situação permite rotina, use 10 no dado; circunstâncias e oposição ainda podem exigir uma rolagem.",
    formula: "teste = d20 + modificador; rotina = 10 + modificador",
    coverage: "reference",
    tags: ["teste", "d20", "cd", "rotina", "dificuldade"],
  },
  {
    id: "graded-checks",
    category: "Perícias",
    title: "Graus e resultados adicionais",
    summary:
      "Em um teste graduado, igualar ou superar a CD gera um grau de sucesso. Cada faixa completa de 5 acima melhora o sucesso; abaixo da CD, cada faixa de 5 aumenta a falha. Um 20 acrescenta +5 e um 1 aplica −5 ao total.",
    formula: "sucesso: 1 + ⌊(total − CD) ÷ 5⌋; falha: ⌈(CD − total) ÷ 5⌉",
    coverage: "automatic",
    tags: ["grau", "sucesso", "falha", "20", "1", "resultado adicional"],
  },
  {
    id: "bonus-penalty-dice",
    category: "Perícias",
    title: "Dados bônus, dados de penalidade e Sorte",
    summary:
      "Cada dado bônus acrescenta um d20 e mantém o maior resultado; cada dado de penalidade mantém o menor. Eles se anulam um a um. Em rotina, um dado bônus vale +5 e um dado de penalidade vale −5. Sorte permite repetir um dado, somar 10 se o novo resultado for 10 ou menos e escolher entre o resultado original e o novo.",
    coverage: "reference",
    tags: ["dado bônus", "dado de penalidade", "sorte", "rerrolar", "repetir", "rotina"],
  },
  {
    id: "opposed-team-group-checks",
    category: "Perícias",
    title: "Testes opostos, de equipe e de grupo",
    summary:
      "Em oposição, o maior resultado vence; empate favorece o maior modificador e, se necessário, é decidido ao acaso. Em equipe, cada grau de sucesso dos ajudantes contra CD 10 concede +1. Em grupo, todos têm sucesso se ao menos metade passar.",
    coverage: "reference",
    tags: ["oposto", "equipe", "grupo", "ajuda", "empate", "cd 10"],
  },
  {
    id: "skill-specializations",
    category: "Perícias",
    title: "Especializações e sequências",
    summary:
      "Especializações definem uma aplicação estreita. Cenas complexas podem encadear testes; o resultado de uma etapa altera a posição, as opções ou a dificuldade da etapa seguinte.",
    coverage: "reference",
    tags: ["especialização", "sequência", "desafio", "cena"],
  },
  {
    id: "check-sequences",
    category: "Perícias",
    title: "Sequências de testes",
    summary:
      "Uma sequência acumula graus de sucesso até atingir seu objetivo ou graus de falha até atingir o limite definido pelo Narrador. Cada etapa informa o intervalo de tempo, os testes possíveis e as consequências; uma etapa de rotina concede apenas um grau de sucesso.",
    coverage: "reference",
    tags: ["sequência", "limiar", "graus acumulados", "desafio", "investigação", "perseguição"],
  },
  {
    id: "advantages",
    category: "Vantagens",
    title: "Vantagens e graduações",
    summary:
      "Cada graduação custa 1 PP. O catálogo informa categoria, foco, se a vantagem aceita graduações e seus limites. Opções personalizadas continuam disponíveis e aparecem para conferência.",
    formula: "custo = graduações × 1 PP",
    coverage: "automatic",
    tags: ["vantagem", "graduação", "foco", "custo"],
  },
  {
    id: "heroic-resources",
    category: "Recursos heroicos",
    title: "Pontos Heroicos, Sorte e vantagens heroicas",
    summary:
      "Pontos Heroicos e Sorte acompanham recursos diferentes. Usos de vantagens heroicas não podem exceder nem as graduações compradas nem o limite da aventura definido pelo NP.",
    coverage: "automatic",
    tags: ["ponto heroico", "sorte", "luck", "determinação", "uso"],
  },
  {
    id: "extra-effort",
    category: "Recursos heroicos",
    title: "Esforço Extra e façanhas de poder",
    summary:
      "Esforço Extra permite exceder momentaneamente o desempenho normal; façanhas de poder representam usos alternativos coerentes com efeitos e descritores. O custo narrativo e as consequências pertencem à cena.",
    coverage: "reference",
    tags: ["esforço extra", "façanha", "power stunt", "heroico"],
  },
  {
    id: "effects",
    category: "Poderes",
    title: "Efeitos, descritores e parâmetros",
    summary:
      "O efeito define a mecânica, enquanto os descritores explicam sua manifestação. Ação, alcance, duração, resistência e teste de ataque têm campos próprios e continuam editáveis conforme a campanha.",
    coverage: "automatic",
    tags: ["efeito", "descritor", "ação", "alcance", "duração"],
  },
  {
    id: "effect-cost",
    category: "Poderes",
    title: "Custo de efeitos e modificadores",
    summary:
      "Extras e falhas alteram o custo por graduação; recursos e desvantagens fixos entram depois. Quando um modificador abrange apenas parte das graduações, cada trecho é calculado separadamente, sem arredondamento antecipado.",
    formula: "((custo-base + extras − falhas) × graduações) + recursos − desvantagens",
    coverage: "automatic",
    tags: ["extra", "falha", "recurso", "custo fracionário", "efeito"],
  },
  {
    id: "arrays",
    category: "Poderes",
    title: "Matrizes e configurações alternativas",
    summary:
      "Uma matriz possui uma única configuração-base e alternativas com as restrições aplicáveis. A conferência verifica a base, o maior custo, efeitos permanentes, Removível e a exclusividade das configurações não dinâmicas.",
    coverage: "automatic",
    tags: ["matriz", "array", "alternativo", "dinâmica", "base"],
  },
  {
    id: "removable",
    category: "Poderes",
    title: "Removível",
    summary:
      "O desconto de Removível é calculado sobre o custo pertinente e, em uma matriz, fica apenas na configuração-base para não ser cobrado ou descontado duas vezes.",
    formula: "desconto por bloco iniciado de 5 PP: −1 Removível; −2 Facilmente Removível; −4 grau Equipamento",
    coverage: "automatic",
    tags: ["removível", "dispositivo", "desconto", "matriz"],
  },
  {
    id: "attacks",
    category: "Conflitos",
    title: "Ataques e resistência",
    summary:
      "Ataques vinculam a melhor precisão aplicável à graduação final do efeito. A ficha mostra bônus, efeito, resistência, CD do efeito e o limite de NP; a resolução do d20 acontece na mesa.",
    formula: "CD básica do efeito = 10 + graduação final",
    coverage: "automatic",
    tags: ["ataque", "resistência", "cd", "dano", "precisão"],
  },
  {
    id: "damage-resistance",
    category: "Conflitos",
    title: "Resistência a dano",
    summary:
      "Dois ou mais graus de sucesso evitam novas condições; um grau de sucesso causa Ferido. As falhas acrescentam, de forma cumulativa, Atordoado ou Caído, Cambaleante e Incapacitado. Cada Ferido aplica −1 às próximas resistências a dano.",
    formula: "CD = 10 + graduação do dano; resistência efetiva = resistência − Feridos",
    coverage: "automatic",
    tags: ["dano", "ferido", "atordoado", "caído", "cambaleante", "incapacitado"],
  },
  {
    id: "resistance-degrees",
    category: "Conflitos",
    title: "Graus de resistência",
    summary:
      "Imunidade dispensa o teste. Impenetrável ignora efeitos de graduação igual ou menor; Redução corta a graduação pela metade, arredondando para cima; Aprimorada concede dado bônus dentro de sua graduação; Suscetível acrescenta 5 à graduação; Fraqueza também impede qualquer resultado melhor que um grau de falha.",
    coverage: "automatic",
    tags: ["imunidade", "impenetrável", "redução", "aprimorada", "suscetível", "fraqueza", "dado bônus"],
  },
  {
    id: "maneuvers",
    category: "Conflitos",
    title: "Manobras, agarrões e ameaças",
    summary:
      "Agarrar, derrubar, fintar, impressionar e outras manobras combinam testes, defesas e condições. Vantagens e especializações registradas na ficha ajustam as opções disponíveis.",
    coverage: "reference",
    tags: ["agarrar", "trip", "derrubar", "impress", "ameaça", "menace"],
  },
  {
    id: "reactions-teamwork",
    category: "Conflitos",
    title: "Reações, equipe e proteção",
    summary:
      "Reações acontecem quando seu gatilho ocorre. Ataques em equipe, Contrapor e Interpor dependem da situação e da coordenação; vantagens relacionadas ficam pesquisáveis no catálogo.",
    coverage: "reference",
    tags: ["reação", "equipe", "team attack", "counter", "contrapor", "interpor"],
  },
  {
    id: "minions",
    category: "Conflitos",
    title: "Capangas e Derrubada",
    summary:
      "Capangas simplificam confrontos numerosos. Derrubada e outras vantagens podem encadear ações contra alvos adequados, respeitando alcance, circunstâncias e a descrição da vantagem.",
    coverage: "reference",
    tags: ["capanga", "minion", "derrubada", "takedown"],
  },
  {
    id: "actions-initiative",
    category: "Cenas",
    title: "Rodadas, ações e iniciativa",
    summary:
      "A iniciativa deriva de Agilidade, bônus comprado e poderes. Tipos de ação, movimento e reações organizam o turno; o editor registra os parâmetros de cada efeito sem impor uma ordem narrativa.",
    coverage: "automatic",
    tags: ["rodada", "ação", "movimento", "reação", "iniciativa"],
  },
  {
    id: "environments",
    category: "Cenas",
    title: "Ambientes, perigos e desafios",
    summary:
      "Ambientes e perigos definem circunstâncias, CDs, resistências e consequências próprias. Use notas, condições e complicações para registrar o que é específico da cena.",
    coverage: "reference",
    tags: ["ambiente", "perigo", "hazard", "circunstância", "doom room"],
  },
  {
    id: "conditions",
    category: "Condições",
    title: "Condições e recuperação",
    summary:
      "A ficha mantém a lista bilíngue de condições e permite marcar qualquer combinação. Resistências, graus de resultado, tratamento e recuperação são resolvidos conforme o efeito e a cena.",
    coverage: "assisted",
    tags: ["condição", "recuperação", "dano", "tratamento", "bilíngue"],
  },
  {
    id: "measurements",
    category: "Escalas",
    title: "Graduações e medidas",
    summary:
      "Massa, tempo, distância e volume usam valores aproximados. Cada aumento de uma graduação dobra a medida; valores fora da tabela são extrapolados pelo mesmo padrão.",
    formula: "+1 graduação = ×2; −1 graduação = ÷2",
    coverage: "reference",
    tags: ["massa", "tempo", "distância", "volume", "dobrar"],
  },
  {
    id: "measurement-relations",
    category: "Escalas",
    title: "Percurso, viagem e arremesso",
    summary:
      "As graduações permitem estimar quanto se percorre, quanto tempo uma viagem leva e a que distância um objeto pode ser arremessado. Os valores são aproximados e continuam válidos fora da tabela pelo mesmo padrão de duplicação.",
    formula: "distância = tempo + velocidade; tempo = distância − velocidade; arremesso = Força − massa",
    coverage: "automatic",
    tags: ["percurso", "viagem", "velocidade", "tempo", "arremesso", "força", "massa"],
  },
  {
    id: "movement-senses",
    category: "Escalas",
    title: "Movimento, sentidos e alcance",
    summary:
      "Graduações de movimento e sentidos usam a escala de medidas como referência, enquanto descritores, alcance e condições do ambiente determinam o uso concreto.",
    coverage: "reference",
    tags: ["movimento", "velocidade", "sentido", "alcance", "distância"],
  },
  {
    id: "equipment",
    category: "Equipamento",
    title: "Equipamento, armas e proteção",
    summary:
      "Itens do catálogo mantêm custo em Pontos de Equipamento e vínculos mecânicos. Armas criam ataques; armaduras e escudos ativos alteram as defesas correspondentes sem somar o mesmo benefício duas vezes.",
    coverage: "automatic",
    tags: ["equipamento", "pe", "arma", "armadura", "escudo"],
  },
  {
    id: "custom-content",
    category: "Liberdade",
    title: "Conteúdo personalizado e regras da campanha",
    summary:
      "Qualquer opção pode virar conteúdo personalizado. O modo livre nunca bloqueia a ficha; a auditoria separa violações objetivas de decisões que precisam apenas da confirmação do Narrador.",
    coverage: "assisted",
    tags: ["personalizado", "modo livre", "narrador", "house rule", "campanha"],
  },
];

export const ruleReferenceCategories = [
  ...new Set(ruleReferenceEntries.map((entry) => entry.category)),
];

export function searchRuleReference(entry: RuleReferenceEntry, query: string) {
  const normalized = normalizeReferenceText(query);
  if (!normalized) return true;
  const english = localizeRuleReference(entry, "en");
  return normalizeReferenceText(
    [
      entry.category,
      entry.title,
      entry.summary,
      entry.formula ?? "",
      ...entry.tags,
      english.category,
      english.title,
      english.summary,
      english.formula ?? "",
    ].join(" "),
  ).includes(normalized);
}

function normalizeReferenceText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}
