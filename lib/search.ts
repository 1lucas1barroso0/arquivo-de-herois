import { getCatalogName, getCatalogSummary, type CatalogLanguage } from "./catalog";
import type { CharacterSheet } from "./character";
import { referenceCatalogGroups } from "./reference-catalog";
import { localizeRuleReference, ruleReferenceEntries } from "./rule-reference";
import type { Campaign } from "./workspace";
import { translateMessage } from "./messages";

export type SearchResultKind =
  | "character"
  | "campaign"
  | "rule"
  | "catalog";

export type UniversalSearchResult = {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  searchable: string;
  score: number;
  sheetId?: string;
  campaignId?: string;
  referenceId?: string;
  catalogGroupId?: string;
};

export function searchEverything(
  query: string,
  characters: readonly CharacterSheet[],
  campaigns: readonly Campaign[],
  language: CatalogLanguage,
  limit = 40,
) {
  const wanted = normalizeSearchText(query);
  if (!wanted) return [];
  const results: UniversalSearchResult[] = [];

  for (const sheet of characters) {
    addResult(results, wanted, {
      id: `character:${sheet.id}`,
      kind: "character",
      title: sheet.heroName,
      subtitle:
        sheet.civilName ||
        sheet.concept ||
        `${translateMessage("common.powerLevelShort", language)} ${sheet.powerLevel}`,
      searchable: [
        "character personagem sheet ficha npc",
        sheet.heroName,
        sheet.civilName,
        sheet.codename,
        sheet.concept,
        sheet.campaign,
        sheet.origin,
        sheet.descriptors,
        sheet.notes,
        ...sheet.tags,
        ...sheet.powers.map((entry) => `${entry.name} ${entry.descriptors}`),
        ...sheet.advantages.map((entry) => entry.name),
        ...sheet.skills.map((entry) => `${entry.name} ${entry.specialization}`),
      ].join(" "),
      score: 0,
      sheetId: sheet.id,
    });
  }

  for (const campaign of campaigns) {
    addResult(results, wanted, {
      id: `campaign:${campaign.id}`,
      kind: "campaign",
      title: campaign.name,
      subtitle: campaign.description,
      searchable: [
        "campaign campanha",
        campaign.name,
        campaign.description,
        campaign.gameMaster,
        campaign.notes,
        ...campaign.members.map((entry) => entry.name),
        ...campaign.organizations.map((entry) => `${entry.name} ${entry.description}`),
        ...campaign.locations.map((entry) => `${entry.name} ${entry.description}`),
      ].join(" "),
      score: 0,
      campaignId: campaign.id,
    });
  }

  for (const rule of ruleReferenceEntries) {
    const localized = localizeRuleReference(rule, language);
    addResult(results, wanted, {
      id: `rule:${rule.id}`,
      kind: "rule",
      title: localized.title,
      subtitle: localized.category,
      searchable: [
        rule.title,
        rule.summary,
        rule.category,
        rule.formula,
        localized.title,
        localized.summary,
        localized.category,
        localized.formula,
        ...rule.tags,
      ].join(" "),
      score: 0,
      referenceId: rule.id,
    });
  }

  for (const group of referenceCatalogGroups) {
    for (const entry of group.items) {
      addResult(results, wanted, {
        id: `catalog:${group.id}:${entry.id}`,
        kind: "catalog",
        title: getCatalogName(entry, language),
        subtitle: language === "en" ? entry.category : group.label,
        searchable: [
          entry.label,
          entry.canonical,
          entry.category,
          entry.summary,
          getCatalogSummary(entry, "en"),
          ...(entry.aliases ?? []),
        ].join(" "),
        score: 0,
        referenceId: entry.id,
        catalogGroupId: group.id,
      });
    }
  }

  return results
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, limit);
}

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
}

function addResult(
  results: UniversalSearchResult[],
  query: string,
  candidate: UniversalSearchResult,
) {
  const title = normalizeSearchText(candidate.title);
  const searchable = normalizeSearchText(candidate.searchable);
  const queryTokens = query.split(" ");
  const words = searchable.split(" ");
  const tokenMatches = queryTokens.filter((token) =>
    words.some(
      (word) =>
        word.includes(token) || token.includes(word) || isSmallTypo(word, token),
    ),
  ).length;
  if (tokenMatches !== queryTokens.length) return;
  candidate.score =
    (title === query
      ? 100
      : title.startsWith(query)
        ? 70
        : isSmallTypo(title, query)
          ? 60
          : title.includes(query)
            ? 50
            : 0) +
    tokenMatches * 10;
  results.push(candidate);
}

function isSmallTypo(left: string, right: string) {
  if (left.length < 4 || right.length < 4) return false;
  if (Math.abs(left.length - right.length) > 1) return false;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[right.length] <= 1;
}
