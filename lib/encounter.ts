export type EncounterSide = "ally" | "threat";

export type EncounterParticipant = {
  id: string;
  sheetId: string;
  name: string;
  powerLevel: number;
  quantity: number;
  side: EncounterSide;
  role: string;
};

export type EncounterPressureId =
  | "secondary"
  | "low"
  | "standard"
  | "severe"
  | "extreme";

export type EncounterPressure = {
  id: EncounterPressureId;
  labelPt: string;
  labelEn: string;
  targetRatio: number;
  factor: number;
};

export type EncounterDefinition = {
  id: string;
  name: string;
  participants: EncounterParticipant[];
  referencePowerLevel: number | null;
  pressure: EncounterPressureId;
  notes: string;
};

export const encounterPressures: readonly EncounterPressure[] = [
  {
    id: "secondary",
    labelPt: "Secundária",
    labelEn: "Secondary",
    targetRatio: 0.5,
    factor: 0.5,
  },
  {
    id: "low",
    labelPt: "Baixa",
    labelEn: "Low",
    targetRatio: 0.75,
    factor: 0.75,
  },
  {
    id: "standard",
    labelPt: "Padrão",
    labelEn: "Standard",
    targetRatio: 1,
    factor: 1,
  },
  {
    id: "severe",
    labelPt: "Severa",
    labelEn: "Severe",
    targetRatio: 1.5,
    factor: 1.25,
  },
  {
    id: "extreme",
    labelPt: "Extrema",
    labelEn: "Extreme",
    targetRatio: 2,
    factor: 1.5,
  },
] as const;

/**
 * Optional encounter-estimate table recovered from the project's own
 * balance document. This is a project aid, not an official M&M rule.
 */
export const threatCeByDifference = new Map<number, number>([
  [-4, 10],
  [-3, 15],
  [-2, 20],
  [-1, 30],
  [0, 40],
  [1, 60],
  [2, 80],
  [3, 120],
  [4, 160],
  [5, 225],
  [6, 320],
  [7, 450],
]);

export const characterLevelToPowerLevel = [
  4, 4, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 11, 11,
] as const;

export const challengeLevelToPowerLevel = [
  6, 6, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12, 13, 13,
] as const;

export const specialThreatPowerLevels = {
  "1/4": { minimum: 2, maximum: 2 },
  "1/2": { minimum: 4, maximum: 4 },
  S: { minimum: 15, maximum: 15 },
  "S+": { minimum: 17, maximum: 18 },
  "S+ high": { minimum: 19, maximum: null },
} as const;

export type EncounterIssue = {
  participantId: string;
  message: string;
};

export type EncounterAnalysis = {
  referencePowerLevel: number;
  groupCapacity: number;
  baseThreatCe: number;
  effectiveThreatCe: number;
  ratio: number | null;
  estimatedPressure: EncounterPressure | null;
  selectedPressure: EncounterPressure;
  differenceFromTarget: number | null;
  issues: EncounterIssue[];
};

export function getEncounterReferencePowerLevel(
  participants: readonly EncounterParticipant[],
) {
  const values = participants
    .filter((entry) => entry.side === "ally" && entry.quantity > 0)
    .flatMap((entry) =>
      Array.from(
        { length: Math.max(0, Math.floor(entry.quantity)) },
        () => Math.round(entry.powerLevel),
      ),
    );
  if (!values.length) return 10;

  const frequency = new Map<number, number>();
  for (const value of values) {
    frequency.set(value, (frequency.get(value) ?? 0) + 1);
  }
  const maximumFrequency = Math.max(...frequency.values());
  const modes = [...frequency.entries()]
    .filter(([, count]) => count === maximumFrequency)
    .map(([value]) => value);
  if (modes.length === 1) return modes[0];

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

export function getCeForParticipant(
  participant: EncounterParticipant,
  referencePowerLevel: number,
) {
  const difference =
    Math.round(participant.powerLevel) - Math.round(referencePowerLevel);
  const threatCe = threatCeByDifference.get(difference);
  if (threatCe === undefined) return null;
  return participant.side === "ally" ? threatCe / 2 : threatCe;
}

export function analyzeEncounter(
  encounter: EncounterDefinition,
): EncounterAnalysis {
  const referencePowerLevel = Number.isFinite(encounter.referencePowerLevel)
    ? Math.round(encounter.referencePowerLevel as number)
    : getEncounterReferencePowerLevel(encounter.participants);
  const selectedPressure =
    encounterPressures.find((entry) => entry.id === encounter.pressure) ??
    encounterPressures[2];
  const issues: EncounterIssue[] = [];
  let groupCapacity = 0;
  let baseThreatCe = 0;

  for (const participant of encounter.participants) {
    const quantity = Math.max(0, Math.floor(participant.quantity));
    if (!quantity) continue;
    const unitCe = getCeForParticipant(participant, referencePowerLevel);
    if (unitCe === null) {
      issues.push({
        participantId: participant.id,
        message:
          "A diferença de NP está fora da faixa P−4 a P+7 documentada para esta estimativa não oficial.",
      });
      continue;
    }
    if (participant.side === "ally") {
      groupCapacity += unitCe * quantity;
    } else {
      baseThreatCe += unitCe * quantity;
    }
  }

  const effectiveThreatCe = roundCe(baseThreatCe * selectedPressure.factor);
  const ratio = groupCapacity > 0 ? effectiveThreatCe / groupCapacity : null;
  const estimatedPressure =
    ratio === null
      ? null
      : encounterPressures.reduce((closest, candidate) =>
          Math.abs(candidate.targetRatio - ratio) <
          Math.abs(closest.targetRatio - ratio)
            ? candidate
            : closest,
        );

  return {
    referencePowerLevel,
    groupCapacity: roundCe(groupCapacity),
    baseThreatCe: roundCe(baseThreatCe),
    effectiveThreatCe,
    ratio,
    estimatedPressure,
    selectedPressure,
    differenceFromTarget:
      ratio === null ? null : ratio - selectedPressure.targetRatio,
    issues,
  };
}

function roundCe(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
