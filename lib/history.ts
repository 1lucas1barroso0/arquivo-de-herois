import { newId, normalizeSheet, type CharacterSheet } from "./character";

export const MAX_CHARACTER_REVISIONS = 30;

export type CharacterRevision = {
  id: string;
  characterId: string;
  createdAt: string;
  label: string;
  fingerprint: string;
  sheet: CharacterSheet;
};

export function createCharacterRevision(
  value: CharacterSheet,
  label = "Salvamento automático",
  now = new Date(),
): CharacterRevision {
  const sheet = normalizeSheet(value);
  return {
    id: newId("revision"),
    characterId: sheet.id,
    createdAt: now.toISOString(),
    label,
    fingerprint: getRevisionFingerprint(sheet),
    sheet,
  };
}

export function addCharacterRevision(
  revisions: readonly CharacterRevision[],
  next: CharacterRevision,
) {
  if (revisions[0]?.fingerprint === next.fingerprint) {
    return [...revisions];
  }
  return [next, ...revisions].slice(0, MAX_CHARACTER_REVISIONS);
}

export function restoreCharacterRevision(
  current: CharacterSheet,
  revision: CharacterRevision,
) {
  const restored = normalizeSheet(revision.sheet);
  return normalizeSheet({
    ...restored,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: current.updatedAt,
    shareEnabled: current.shareEnabled,
    shareToken: current.shareToken,
    shareMode: current.shareMode,
  });
}

export function getRevisionFingerprint(value: CharacterSheet) {
  const sheet = normalizeSheet(value);
  const comparable = {
    ...sheet,
    updatedAt: undefined,
    createdAt: undefined,
    shareEnabled: undefined,
    shareToken: undefined,
  };
  return hash(JSON.stringify(comparable));
}

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}
