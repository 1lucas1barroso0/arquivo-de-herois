export const CURRENT_RULESET_ID = "mm4e.playtest.origin.previews-1-9" as const;
export const CURRENT_RULESET_REVISION = "2026-08-21" as const;

export type RulesetStatus = "playtest" | "final";
export type RulesetReference = { id: string; revision: string; status: RulesetStatus };

export const CURRENT_RULESET: RulesetReference = {
  id: CURRENT_RULESET_ID,
  revision: CURRENT_RULESET_REVISION,
  status: "playtest",
};

export function createCurrentRulesetReference(): RulesetReference {
  return { ...CURRENT_RULESET };
}

export function normalizeRulesetReference(value: unknown): RulesetReference {
  if (!value || typeof value !== "object") return createCurrentRulesetReference();
  const record = value as Record<string, unknown>;
  return {
    id: typeof record.id === "string" && record.id.trim() ? record.id.trim().slice(0, 120) : CURRENT_RULESET_ID,
    revision: typeof record.revision === "string" && record.revision.trim() ? record.revision.trim().slice(0, 40) : CURRENT_RULESET_REVISION,
    status: record.status === "final" ? "final" : "playtest",
  };
}

export function rulesetLabel(reference: RulesetReference, language: "pt" | "en") {
  if (reference.id === CURRENT_RULESET_ID) {
    return language === "en"
      ? `M&M4e Origin playtest · previews 1–9 · ${reference.revision}`
      : `Playtest de origem de M&M4e · prévias 1–9 · ${reference.revision}`;
  }
  return `${reference.id} · ${reference.revision}`;
}
