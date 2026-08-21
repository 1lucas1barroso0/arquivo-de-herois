import type { CharacterSheet } from "./character";
import {
  getAttackCalculation,
  getDerivedTraits,
  getPointBreakdown,
  getPointBudget,
  getRuleAudit,
} from "./rules";

export type CharacterAnalysis = {
  powerLevel: number;
  points: {
    budget: number;
    spent: number;
    remaining: number;
    distribution: Array<{ id: string; value: number }>;
  };
  offense: {
    attacks: number;
    highestAttackBonus: number | null;
    highestEffectRank: number | null;
  };
  defense: {
    defense: number;
    dodge: number;
    parry: number;
    toughness: number;
    fortitude: number;
    will: number;
  };
  mobility: {
    entries: number;
    highestRank: number | null;
  };
  skills: { trained: number; totalRanks: number };
  utility: {
    advantages: number;
    powers: number;
    senses: number;
    equipment: number;
  };
  alerts: { errors: number; warnings: number; information: number };
};

export function getCharacterAnalysis(sheet: CharacterSheet): CharacterAnalysis {
  const points = getPointBreakdown(sheet);
  const budget = getPointBudget(sheet);
  const derived = getDerivedTraits(sheet);
  const attacks = sheet.attacks.map((attack) =>
    getAttackCalculation(sheet, attack),
  );
  const completeAttacks = attacks.filter((attack) => attack.complete);
  const audit = getRuleAudit(sheet);
  const movementRanks = sheet.movement.map((entry) => entry.rank);

  return {
    powerLevel: sheet.powerLevel,
    points: {
      budget,
      spent: points.total,
      remaining: budget - points.total,
      distribution: [
        { id: "abilities", value: points.abilities },
        { id: "combat", value: points.combat },
        { id: "resistances", value: points.resistances },
        { id: "skills", value: points.skills },
        { id: "advantages", value: points.advantages },
        { id: "powers", value: points.powers },
        { id: "adjustments", value: points.adjustments },
      ],
    },
    offense: {
      attacks: attacks.length,
      highestAttackBonus: maximum(completeAttacks.map((entry) => entry.attackBonus)),
      highestEffectRank: maximum(completeAttacks.map((entry) => entry.effectRank)),
    },
    defense: {
      defense: derived.defense,
      dodge: derived.resistances.dodge,
      parry: derived.closeDefense,
      toughness: derived.resistances.toughness,
      fortitude: derived.resistances.fortitude,
      will: derived.resistances.will,
    },
    mobility: {
      entries: sheet.movement.length,
      highestRank: maximum(movementRanks),
    },
    skills: {
      trained: sheet.skills.filter(
        (entry) => entry.rank > 0 || entry.specializationRank > 0,
      ).length,
      totalRanks: sheet.skills.reduce(
        (total, entry) => total + entry.rank + entry.specializationRank,
        0,
      ),
    },
    utility: {
      advantages: sheet.advantages.length,
      powers: sheet.powers.length,
      senses: sheet.senses.length,
      equipment: sheet.equipment.length,
    },
    alerts: {
      errors: audit.failures,
      warnings: audit.attentions,
      information: audit.checks.filter((check) => check.status === "info").length,
    },
  };
}

function maximum(values: number[]) {
  if (!values.length) return null;
  return values.reduce((result, value) => Math.max(result, value), values[0]);
}
