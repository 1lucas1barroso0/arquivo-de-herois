import {
  normalizeSheet,
  type CharacterSheet,
  type SessionState,
} from "./character";

export function createResetSessionState(sheet: CharacterSheet): SessionState {
  return {
    active: false,
    startedAt: null,
    damage: 0,
    heroPointsCurrent: Math.max(0, sheet.resources.heroPoints),
    luckCurrent: Math.max(0, sheet.resources.luckCurrent),
    conditions: [],
    penalties: [],
    temporaryResources: [],
    activeEffects: [],
    sustainedPowerIds: [],
    notes: "",
  };
}

export function beginSession(value: CharacterSheet, now = new Date()) {
  const sheet = normalizeSheet(value);
  return {
    ...sheet,
    session: {
      ...createResetSessionState(sheet),
      active: true,
      startedAt: now.toISOString(),
    },
  };
}

export function resetSession(value: CharacterSheet) {
  const sheet = normalizeSheet(value);
  return { ...sheet, session: createResetSessionState(sheet) };
}

export function getSessionConditionNames(sheet: CharacterSheet) {
  return [...new Set([...sheet.resources.conditions, ...sheet.session.conditions])];
}
