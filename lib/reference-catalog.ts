import {
  advantageCatalog,
  archetypeCatalog,
  attackSpecializationSuggestions,
  complicationCatalog,
  descriptorCatalog,
  drawbackCatalog,
  equipmentCatalog,
  extraCatalog,
  featureCatalog,
  flawCatalog,
  heroOriginCatalog,
  motivationCatalog,
  powerConfigurationCatalog,
  powerEffectCatalog,
  resistanceSuggestions,
  skillCatalog,
  type CatalogEntry,
} from "./catalog";
import type { RuleReferenceSource } from "./rule-reference";

export type ReferenceCatalogGroup = {
  id: string;
  label: string;
  items: CatalogEntry[];
  source: RuleReferenceSource;
};

const previewDocument = "Compilação fornecida da 4E";

function catalogGroup(
  id: string,
  label: string,
  items: CatalogEntry[],
  chapter: string,
  chapterEn: string,
  pages: string,
): ReferenceCatalogGroup {
  return {
    id,
    label,
    items,
    source: { document: previewDocument, chapter, chapterEn, pages },
  };
}

const nonMotivationComplications = complicationCatalog.filter(
  (entry) => entry.category !== "Motivação",
);

const descriptorLabels = {
  origin: "Origem",
  source: "Fonte",
  medium: "Meio",
  result: "Resultado",
} as const;

const descriptorEntries: CatalogEntry[] = Object.entries(descriptorCatalog).flatMap(
  ([group, values]) =>
    values.map((value) => ({
      id: `${group}-${normalize(value).replaceAll(" ", "-")}`,
      label: value,
      canonical: value,
      category: descriptorLabels[group as keyof typeof descriptorLabels],
      summary: `Descritor sugerido de ${descriptorLabels[group as keyof typeof descriptorLabels].toLocaleLowerCase("pt-BR")}.`,
    })),
);

function suggestionEntries(
  prefix: string,
  category: string,
  values: readonly string[],
): CatalogEntry[] {
  return values.map((value) => ({
    id: `${prefix}-${normalize(value).replaceAll(" ", "-")}`,
    label: value,
    canonical: value,
    category,
    summary: `Sugestão de ${category.toLocaleLowerCase("pt-BR")}.`,
  }));
}

/** Todos os dados de criação pesquisáveis, inclusive sugestões sem custo. */
export const referenceCatalogGroups: ReferenceCatalogGroup[] = [
  catalogGroup("archetypes", "Arquétipos", archetypeCatalog, "Capítulo 2 · Criação de Heróis", "Chapter 2 · Hero Creation", "34–90"),
  catalogGroup("origins", "Origens", heroOriginCatalog, "Capítulo 2 · Criação de Heróis", "Chapter 2 · Hero Creation", "98–99"),
  catalogGroup("motivations", "Motivações", motivationCatalog, "Capítulo 2 · Criação de Heróis", "Chapter 2 · Hero Creation", "99–100"),
  catalogGroup("complications", "Outras complicações", nonMotivationComplications, "Capítulo 2 · Criação de Heróis", "Chapter 2 · Hero Creation", "97–105"),
  catalogGroup("skills", "Perícias", skillCatalog, "Capítulo 4 · Perícias", "Chapter 4 · Skills", "124–153"),
  catalogGroup("advantages", "Vantagens", advantageCatalog, "Capítulo 5 · Vantagens", "Chapter 5 · Advantages", "154–179"),
  catalogGroup("effects", "Efeitos", powerEffectCatalog, "Capítulo 6 · Poderes", "Chapter 6 · Powers", "180–271"),
  catalogGroup("configurations", "Configurações de poder", powerConfigurationCatalog, "Capítulo 6 · Poderes", "Chapter 6 · Powers", "183–271"),
  catalogGroup("extras", "Extras", extraCatalog, "Capítulo 6 · Poderes", "Chapter 6 · Powers", "272–297"),
  catalogGroup("features", "Recursos", featureCatalog, "Capítulo 6 · Poderes", "Chapter 6 · Powers", "272–297"),
  catalogGroup("flaws", "Falhas", flawCatalog, "Capítulo 6 · Poderes", "Chapter 6 · Powers", "272–297"),
  catalogGroup("drawbacks", "Desvantagens", drawbackCatalog, "Capítulo 6 · Poderes", "Chapter 6 · Powers", "272–297"),
  catalogGroup("equipment", "Equipamento", equipmentCatalog, "Capítulo 7 · Equipamento", "Chapter 7 · Equipment", "298–345"),
  catalogGroup("descriptors", "Descritores", descriptorEntries, "Capítulo 6 · Poderes", "Chapter 6 · Powers", "180–182"),
  catalogGroup("attack-specializations", "Especializações de ataque", suggestionEntries("attack", "Especialização de ataque", attackSpecializationSuggestions), "Capítulo 3 · Atributos", "Chapter 3 · Abilities", "107–123"),
  catalogGroup("resistances", "Resistências sugeridas", suggestionEntries("resistance", "Resistência", resistanceSuggestions), "Capítulo 3 · Atributos", "Chapter 3 · Abilities", "107–123"),
];

export const referenceCatalogTotal = referenceCatalogGroups.reduce(
  (total, group) => total + group.items.length,
  0,
);

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}
