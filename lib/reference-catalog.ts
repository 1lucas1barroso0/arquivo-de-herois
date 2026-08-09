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

export type ReferenceCatalogGroup = {
  id: string;
  label: string;
  items: CatalogEntry[];
};

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
  { id: "archetypes", label: "Arquétipos", items: archetypeCatalog },
  { id: "origins", label: "Origens", items: heroOriginCatalog },
  { id: "motivations", label: "Motivações", items: motivationCatalog },
  { id: "complications", label: "Outras complicações", items: nonMotivationComplications },
  { id: "skills", label: "Perícias", items: skillCatalog },
  { id: "advantages", label: "Vantagens", items: advantageCatalog },
  { id: "effects", label: "Efeitos", items: powerEffectCatalog },
  { id: "configurations", label: "Configurações de poder", items: powerConfigurationCatalog },
  { id: "extras", label: "Extras", items: extraCatalog },
  { id: "features", label: "Recursos", items: featureCatalog },
  { id: "flaws", label: "Falhas", items: flawCatalog },
  { id: "drawbacks", label: "Desvantagens", items: drawbackCatalog },
  { id: "equipment", label: "Equipamento", items: equipmentCatalog },
  { id: "descriptors", label: "Descritores", items: descriptorEntries },
  {
    id: "attack-specializations",
    label: "Especializações de ataque",
    items: suggestionEntries("attack", "Especialização de ataque", attackSpecializationSuggestions),
  },
  {
    id: "resistances",
    label: "Resistências sugeridas",
    items: suggestionEntries("resistance", "Resistência", resistanceSuggestions),
  },
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
