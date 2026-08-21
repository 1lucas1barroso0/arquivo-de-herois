import {
  createEmptySheet,
  type CharacterSheet,
  type NpcRole,
} from "./character";

export type NpcTemplate = {
  id: NpcRole;
  labelPt: string;
  labelEn: string;
  descriptionPt: string;
  descriptionEn: string;
};

export const npcTemplates: readonly NpcTemplate[] = [
  { id: "minion", labelPt: "Capanga", labelEn: "Minion", descriptionPt: "NPC criado rapidamente para atuar como capanga.", descriptionEn: "A quickly created NPC intended to act as a minion." },
  { id: "ally", labelPt: "Aliado", labelEn: "Ally", descriptionPt: "Personagem de apoio com ficha livremente editável.", descriptionEn: "A supporting character with a fully editable sheet." },
  { id: "rival", labelPt: "Rival", labelEn: "Rival", descriptionPt: "NPC recorrente ligado a uma ficha por rivalidade.", descriptionEn: "A recurring NPC connected to a sheet through rivalry." },
  { id: "villain", labelPt: "Vilão", labelEn: "Villain", descriptionPt: "Antagonista completo para uma campanha ou encontro.", descriptionEn: "A complete antagonist for a campaign or encounter." },
  { id: "boss", labelPt: "Chefe", labelEn: "Boss", descriptionPt: "Antagonista central; o modelo não altera regras nem limites.", descriptionEn: "A central antagonist; the template does not change rules or limits." },
  { id: "recurring", labelPt: "Personagem recorrente", labelEn: "Recurring character", descriptionPt: "NPC persistente que pode crescer com a campanha.", descriptionEn: "A persistent NPC that can grow with the campaign." },
  { id: "creature", labelPt: "Criatura", labelEn: "Creature", descriptionPt: "Ser não humano construído pela mesma ficha completa.", descriptionEn: "A nonhuman being built with the same complete sheet." },
  { id: "troop", labelPt: "Tropa / grupo", labelEn: "Troop / group", descriptionPt: "Atalho de organização para uma unidade ou grupo.", descriptionEn: "An organization shortcut for a unit or group." },
  { id: "entity", labelPt: "Entidade de alto nível", labelEn: "High-level entity", descriptionPt: "Ficha sem teto artificial para entidades de NP elevado.", descriptionEn: "A sheet without an artificial cap for high-PL entities." },
] as const;

export function createNpcFromTemplate(
  templateId: NpcRole,
  powerLevel = 10,
): CharacterSheet {
  const template = npcTemplates.find((entry) => entry.id === templateId);
  const sheet = createEmptySheet();
  return {
    ...sheet,
    heroName: template?.labelPt ?? "Novo NPC",
    buildType: "npc",
    npcRole: templateId,
    creationMode: "quick",
    powerLevel,
    customPointBudget: powerLevel * 15,
    concept: template?.descriptionPt ?? "",
  };
}
