import type { RuleReferenceKind, RuleReferenceSource } from "./rule-reference";

export const HANDBOOK_DOCUMENT = "Hero’s Handbook · WIP v.05 · 2026-10-28";
export const HANDBOOK_SOURCE_URL = "https://drive.google.com/file/d/1Jx0wx_p0BsdladGqB9HC3AyAvm3nmif4/view?usp=drivesdk";
export const HANDBOOK_PAGE_COUNT = 270;

// Physical PDF pages, including the cover. Printed pagination is one less.
const chapters = [
  ["O Básico", "The Basics", "7–25"],
  ["Criação de Heróis", "Hero Creation", "26–66"],
  ["Atributos", "Abilities", "67–76"],
  ["Perícias", "Skills", "77–94"],
  ["Vantagens", "Advantages", "95–110"],
  ["Poderes", "Powers", "111–181"],
  ["Equipamento", "Equipment", "182–210"],
  ["Ação e Aventura", "Action & Adventure", "211–239"],
] as const;

export function handbookSource(chapter: number, pages?: string): RuleReferenceSource {
  const [pt, en, range] = chapters[chapter - 1];
  return { document: HANDBOOK_DOCUMENT, chapter: `Capítulo ${chapter} · ${pt}`, chapterEn: `Chapter ${chapter} · ${en}`, pages: pages ?? range };
}

const specific: Record<string, [number, string]> = {
  "creation-concept": [2, "26–30"], "creation-motivation": [2, "61–66"],
  "power-level": [2, "27–29"], "power-level-offense": [2, "28–29"], "power-level-defense": [2, "28–29"],
  "power-level-resistances": [2, "28–29"], "power-level-skills-initiative": [2, "28–29"], "point-budget": [2, "27–28"],
  "ability-cost": [3, "67–70"], "combat-cost": [3, "69–70"], "skill-cost": [4, "77–78"],
  "skill-checks": [1, "10–14"], "graded-checks": [1, "12–13"], "bonus-penalty-dice": [1, "10–11"],
  "opposed-team-group-checks": [1, "11–14"], "check-sequences": [1, "14"], "skill-specializations": [4, "77–78"],
  advantages: [5, "95–110"], "heroic-resources": [1, "19–21"], "extra-effort": [1, "19"],
  effects: [6, "111–121"], "effect-cost": [6, "111–112"], arrays: [6, "113–114"], removable: [6, "180–181"],
  attacks: [8, "215–218"], "damage-resistance": [8, "218–219"], "resistance-degrees": [1, "13"],
  maneuvers: [8, "216–217"], "reactions-teamwork": [8, "214–217"], minions: [1, "22"],
  "actions-initiative": [8, "213–214"], environments: [8, "228–233"], conditions: [1, "23–25"],
  measurements: [1, "15–17"], "measurement-relations": [1, "15–17"], "movement-senses": [3, "74–76"],
  equipment: [7, "182–210"], "custom-content": [2, "26–29"],
  "trait-lowered": [3, "70–71"], "trait-debilitated": [3, "71"], "trait-absent": [3, "71–72"],
  "trait-absent-consequences": [3, "71–72"], "size-natural": [3, "72–73"], "size-traits-combat": [3, "72–73"],
  "size-grabbing": [3, "73"], "size-movement-falling": [3, "73–74"], "strength-lifting-throwing": [3, "74"],
  "movement-baselines": [3, "74–75"], "senses-perception": [3, "76"],
  "scene-conflict": [8, "214–226"], "scene-challenge": [8, "226–228"], "scene-investigation": [8, "234–236"], "scene-interaction": [8, "236–239"],
};

export function handbookRuleSource(id: string, kind: RuleReferenceKind): RuleReferenceSource {
  const match = specific[id];
  if (match) return handbookSource(...match);
  if (kind === "condition") return handbookSource(1, "23–25");
  if (kind === "action") return handbookSource(8, "221–225");
  if (kind === "hazard") return handbookSource(8, "228–233");
  throw new Error(`Missing handbook source: ${id}`);
}

export function handbookCatalogSource(id: string): RuleReferenceSource {
  if (["archetypes", "origins", "motivations", "complications"].includes(id)) return handbookSource(2);
  if (id === "skills") return handbookSource(4);
  if (id === "advantages") return handbookSource(5);
  if (id === "equipment") return handbookSource(7);
  if (["attack-specializations", "resistances"].includes(id)) return handbookSource(3);
  return handbookSource(6);
}
