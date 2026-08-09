import {
  abilityLabels,
  coreAbilityKeys,
  normalizeSheet,
  resistanceLabels,
  type CharacterSheet,
} from "./character";
import {
  getAttackCalculation,
  getDerivedTraits,
  getLuckCapacity,
  getPointBreakdown,
  getPointBudget,
  getPowerEntryCost,
  getRuleAudit,
  getSkillTotal,
} from "./rules";

export const PORTABLE_FORMAT = "arquivo-de-herois";
export const PORTABLE_VERSION = 6;
export const APPLICATION_NAME = "Arquivo de Heróis";
const TEXT_MARKER = "ARQUIVO-DE-HEROIS-DADOS:";
const LEGACY_TEXT_MARKERS = ["MM4E-DADOS-PORTATEIS:"];

export interface PortableSheetPackage {
  format: typeof PORTABLE_FORMAT;
  version: typeof PORTABLE_VERSION;
  application: typeof APPLICATION_NAME;
  exportedAt: string;
  sheet: CharacterSheet;
}

export function createPortablePackage(sheet: CharacterSheet): PortableSheetPackage {
  return {
    format: PORTABLE_FORMAT,
    version: PORTABLE_VERSION,
    application: APPLICATION_NAME,
    exportedAt: new Date().toISOString(),
    sheet: sanitizePortableSheet(sheet),
  };
}

export function portableSheetToJson(sheet: CharacterSheet) {
  return JSON.stringify(createPortablePackage(sheet), null, 2);
}

/**
 * Human-readable, printable and lossless: the last line carries the complete
 * normalized JSON payload, so a TXT export can be imported without omissions.
 */
export function portableSheetToText(sheet: CharacterSheet) {
  const portable = createPortablePackage(sheet);
  const clean = portable.sheet;
  const derived = getDerivedTraits(clean);
  const budget = getPointBudget(clean);
  const breakdown = getPointBreakdown(clean);
  const audit = getRuleAudit(clean);
  const lines = [
    "ARQUIVO DE HERÓIS",
    "FICHA DO PERSONAGEM",
    "",
    `Nome do personagem: ${clean.heroName}`,
    `Identidade civil: ${clean.civilName}`,
    `Codinome: ${clean.codename}`,
    `Jogador: ${clean.player}`,
    `Campanha: ${clean.campaign}`,
    `Tipo: ${clean.buildType === "npc" ? "NPC" : "Personagem do Jogador"}`,
    `Nível de Poder: ${clean.powerLevel}`,
    `Pontos de Poder: ${breakdown.total} / ${budget}`,
    `Auditoria: ${auditLabel(audit.status)} — ${plural(audit.failures, "erro", "erros")}, ${plural(audit.attentions, "aviso pendente", "avisos pendentes")} e ${plural(audit.approvals, "aviso aprovado", "avisos aprovados")}`,
    `Arquétipo: ${clean.archetype}`,
    `Conceito: ${clean.concept}`,
    `Origem: ${clean.origin}`,
    `Descritores: ${clean.descriptors}`,
    "",
    "ATRIBUTOS",
    ...coreAbilityKeys.map(
      (key) => `${abilityLabels[key]}: ${derived.abilities[key]} (base ${clean.abilities[key]})`,
    ),
    "",
    "COMBATE",
    `Ataque: ${derived.attack}`,
    `Ataque corpo a corpo: ${derived.closeAttack}`,
    `Ataque à distância: ${derived.rangedAttack}`,
    `Defesa: ${derived.defense}`,
    `Defesa corpo a corpo: ${derived.closeDefense}`,
    `Defesa à distância: ${derived.rangedDefense}`,
    `Iniciativa: ${derived.initiative}`,
    "",
    "RESISTÊNCIAS",
    ...Object.entries(derived.resistances).map(
      ([key, value]) => `${resistanceLabels[key as keyof typeof resistanceLabels]}: ${value}`,
    ),
    "",
    "PERÍCIAS",
    ...clean.skills
      .filter((item) => item.rank || item.specializationRank || item.miscellaneousModifier)
      .map(
        (item) =>
          `${item.name}${item.specialization ? ` (${item.specialization})` : ""}: ${getSkillTotal(item, derived)} total [grad. ${item.rank}; esp. ${item.specializationRank}; outros ${item.miscellaneousModifier}${item.miscellaneousModifierSource ? ` de ${item.miscellaneousModifierSource}` : ""}]`,
      ),
    "",
    "VANTAGENS",
    ...clean.advantages.map(
      (item) =>
        `${item.name} ${item.rank > 1 ? item.rank : ""} [${item.categories.join(", ")}]${item.kind === "equipment" ? " — 5 PE por graduação" : ""} — ${item.notes}`,
    ),
    "",
    "PODERES",
    ...clean.powers.flatMap((power) => {
      const entryCost = getPowerEntryCost(clean, power.id);
      return [
        `${power.name}: ${entryCost?.chargedCost ?? 0} PP${power.arrayRole !== "none" ? ` [${power.arrayRole}: ${power.arrayName}]` : ""}`,
        ...power.effects.map(
          (effect) =>
            `  - ${effect.name} ${effect.rank}; ${effect.action}; ${effect.range}; ${effect.duration}; resistência ${effect.resistance || "—"}.`,
        ),
      ];
    }),
    "",
    "ATAQUES",
    ...clean.attacks.map((item) => {
      const attack = getAttackCalculation(clean, item);
      return `${attack.name}: ataque ${attack.range === "no-check" ? "automático" : attack.attackBonus}, efeito ${attack.effectRank}, CD ${attack.effectDc}, limite ${attack.limitValue}/${attack.limit}, resistência ${item.resistance}. ${item.notes}`;
    }),
    "",
    "EQUIPAMENTOS",
    ...clean.equipment.map((item) => `${item.name} [${item.type}] ${item.cost} PE [${item.active ? "ativo" : "guardado"}] — ${item.details}`),
    "",
    "COMPLICAÇÕES",
    ...clean.complications.map((item) => `${item.name} [${item.type}] — ${item.description}`),
    "",
    "RECURSOS ATUAIS",
    `Pontos Heroicos: ${clean.resources.heroPoints}`,
    `Usos de vantagens heroicas: ${clean.resources.heroicAdvantageUses}/${Math.floor(clean.powerLevel / 2)}`,
    `Sorte disponível: ${clean.resources.luckCurrent}/${getLuckCapacity(clean)}`,
    `Fadiga: ${clean.resources.fatigue}`,
    `Condições: ${clean.resources.conditions.join(", ") || "nenhuma"}`,
    "",
    "CONTABILIDADE DE PP",
    `Atributos: ${breakdown.abilities}`,
    `Combate e iniciativa: ${breakdown.combat}`,
    `Resistências: ${breakdown.resistances}`,
    `Perícias: ${breakdown.skills}`,
    `Vantagens: ${breakdown.advantages}`,
    `Poderes: ${breakdown.powers}`,
    `Ajuste documentado: ${breakdown.adjustments}`,
    `TOTAL: ${breakdown.total} / ${budget}`,
    "",
    "AUDITORIA",
    ...audit.checks.map(
      (check) =>
        `[${check.status.toUpperCase()}] ${check.label}${typeof check.value === "number" ? `: ${check.value}${typeof check.limit === "number" ? `/${check.limit}` : ""}` : ""}${check.reviewDecision === "approved" ? " [AVISO APROVADO]" : check.reviewDecision === "rejected" ? " [AVISO REPROVADO]" : check.reviewDecision === "pending" ? " [DECISÃO PENDENTE]" : ""} — ${check.detail}`,
    ),
    "",
    "NOTAS",
    clean.notes,
    "",
    "DADOS COMPLETOS PARA REIMPORTAÇÃO (não altere a linha abaixo)",
    `${TEXT_MARKER}${encodeBase64Url(JSON.stringify(portable))}`,
  ];
  return lines.join("\n");
}

export function parsePortableSheet(text: string): CharacterSheet {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("O arquivo está vazio.");

  try {
    return unwrapPortableValue(JSON.parse(trimmed));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Formato ")) throw error;
  }

  const marker = [TEXT_MARKER, ...LEGACY_TEXT_MARKERS]
    .map((candidate) => ({ candidate, index: trimmed.lastIndexOf(candidate) }))
    .sort((left, right) => right.index - left.index)[0];
  if (marker.index >= 0) {
    const encoded = trimmed.slice(marker.index + marker.candidate.length).split(/\s/, 1)[0];
    try {
      return unwrapPortableValue(JSON.parse(decodeBase64Url(encoded)));
    } catch {
      throw new Error("Os dados completos deste TXT estão corrompidos.");
    }
  }

  throw new Error(
    "Formato não reconhecido. Use um JSON ou TXT exportado pelo Arquivo de Heróis.",
  );
}

export function unwrapPortableValue(value: unknown): CharacterSheet {
  if (!value || typeof value !== "object") {
    throw new Error("Formato de ficha inválido.");
  }
  const record = value as Record<string, unknown>;
  const candidate = record.sheet && typeof record.sheet === "object" ? record.sheet : record;
  return sanitizePortableSheet(normalizeSheet(candidate as Partial<CharacterSheet>));
}

export function plural(value: number, singular: string, pluralForm: string) {
  return `${value} ${value === 1 ? singular : pluralForm}`;
}

function sanitizePortableSheet(sheet: CharacterSheet) {
  return normalizeSheet({
    ...sheet,
    id: "",
    shareEnabled: false,
    shareToken: null,
    createdAt: undefined,
    updatedAt: undefined,
  });
}

function auditLabel(status: ReturnType<typeof getRuleAudit>["status"]) {
  if (status === "pass") return "validada";
  if (status === "fail") return "com erros objetivos";
  if (status === "attention") return "requer revisão";
  return "regras liberais do Narrador e NPCs";
}

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
