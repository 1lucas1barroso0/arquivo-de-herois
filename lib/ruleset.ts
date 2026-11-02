export const CURRENT_RULESET_ID = "mm4e.heros-handbook.wip05" as const;
export const CURRENT_RULESET_REVISION = "2026-10-28" as const;
export const LEGACY_RULESET: RulesetReference = { id: "mm4e.playtest.origin.previews-1-9", revision: "2026-08-21", status: "playtest" };

export type RulesetStatus = "playtest" | "wip" | "final";
export type RulesetReference = { id: string; revision: string; status: RulesetStatus };

export const CURRENT_RULESET: RulesetReference = {
  id: CURRENT_RULESET_ID,
  revision: CURRENT_RULESET_REVISION,
  status: "wip",
};

export function createCurrentRulesetReference(): RulesetReference {
  return { ...CURRENT_RULESET };
}

export function normalizeRulesetReference(value: unknown): RulesetReference {
  if (!value || typeof value !== "object") return { ...LEGACY_RULESET };
  const record = value as Record<string, unknown>;
  return {
    id: typeof record.id === "string" && record.id.trim() ? record.id.trim().slice(0, 120) : LEGACY_RULESET.id,
    revision: typeof record.revision === "string" && record.revision.trim() ? record.revision.trim().slice(0, 40) : LEGACY_RULESET.revision,
    status: record.status === "final" ? "final" : record.status === "wip" ? "wip" : "playtest",
  };
}

export function rulesetLabel(reference: RulesetReference, language: "pt" | "en") {
  if (reference.id === CURRENT_RULESET_ID) {
    return language === "en"
      ? `M&M4e Hero’s Handbook · WIP v.05 · ${reference.revision}`
      : `M&M4e Hero’s Handbook · WIP v.05 · ${reference.revision}`;
  }
  if (reference.id === LEGACY_RULESET.id) return language === "en"
    ? `M&M4e Origin playtest · previews 1–9 · ${reference.revision}`
    : `Playtest de origem de M&M4e · prévias 1–9 · ${reference.revision}`;
  return `${reference.id} · ${reference.revision}`;
}

export function isCurrentRuleset(reference: RulesetReference | undefined) {
  return reference?.id === CURRENT_RULESET_ID && reference.revision === CURRENT_RULESET_REVISION && reference.status === "wip";
}
