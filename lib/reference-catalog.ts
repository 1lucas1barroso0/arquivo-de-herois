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
import { handbookCatalogSource } from "./handbook-source";

export type ReferenceCatalogGroup = {
  id: string;
  label: string;
  items: CatalogEntry[];
  source: RuleReferenceSource;
};

function catalogGroup(
  id: string,
  label: string,
  items: CatalogEntry[],
): ReferenceCatalogGroup {
  return {
    id,
    label,
    items,
    source: handbookCatalogSource(id),
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
  catalogGroup("archetypes", "Arquétipos", archetypeCatalog),
  catalogGroup("origins", "Origens", heroOriginCatalog),
  catalogGroup("motivations", "Motivações", motivationCatalog),
  catalogGroup("complications", "Outras complicações", nonMotivationComplications),
  catalogGroup("skills", "Perícias", skillCatalog),
  catalogGroup("advantages", "Vantagens", advantageCatalog),
  catalogGroup("effects", "Efeitos", powerEffectCatalog),
  catalogGroup("configurations", "Configurações de poder", powerConfigurationCatalog),
  catalogGroup("extras", "Extras", extraCatalog),
  catalogGroup("features", "Recursos", featureCatalog),
  catalogGroup("flaws", "Falhas", flawCatalog),
  catalogGroup("drawbacks", "Desvantagens", drawbackCatalog),
  catalogGroup("equipment", "Equipamento", equipmentCatalog),
  catalogGroup("descriptors", "Descritores", descriptorEntries),
  catalogGroup("attack-specializations", "Especializações de ataque", suggestionEntries("attack", "Especialização de ataque", attackSpecializationSuggestions)),
  catalogGroup("resistances", "Resistências sugeridas", suggestionEntries("resistance", "Resistência", resistanceSuggestions)),
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
