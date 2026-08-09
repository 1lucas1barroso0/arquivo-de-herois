export type CheckResult = {
  die: number;
  modifier: number;
  circumstance: number;
  difficultyClass: number;
  addedAdjustment: -5 | 0 | 5;
  total: number;
  margin: number;
  success: boolean;
  degrees: number;
  label: string;
};

export function getCheckResult({
  die,
  modifier,
  circumstance = 0,
  difficultyClass,
  graded = true,
}: {
  die: number;
  modifier: number;
  circumstance?: number;
  difficultyClass: number;
  graded?: boolean;
}): CheckResult {
  const safeDie = clamp(integer(die), 1, 20);
  const safeModifier = integer(modifier);
  const safeCircumstance = integer(circumstance);
  const safeDifficulty = integer(difficultyClass);
  const addedAdjustment: -5 | 0 | 5 = graded
    ? safeDie === 20
      ? 5
      : safeDie === 1
        ? -5
        : 0
    : 0;
  const total = safeDie + safeModifier + safeCircumstance + addedAdjustment;
  const margin = total - safeDifficulty;
  const success = margin >= 0;
  const degrees = success
    ? 1 + Math.floor(margin / 5)
    : Math.max(1, Math.ceil(Math.abs(margin) / 5));

  return {
    die: safeDie,
    modifier: safeModifier,
    circumstance: safeCircumstance,
    difficultyClass: safeDifficulty,
    addedAdjustment,
    total,
    margin,
    success,
    degrees,
    label: `${degrees} ${degrees === 1 ? "grau" : "graus"} de ${success ? "sucesso" : "falha"}`,
  };
}

export function getRoutineCheckResult(
  modifier: number,
  circumstance = 0,
) {
  const safeModifier = integer(modifier);
  const safeCircumstance = integer(circumstance);
  return {
    modifier: safeModifier,
    circumstance: safeCircumstance,
    total: 10 + safeModifier + safeCircumstance,
  };
}

export type DamageResistanceResult = CheckResult & {
  effectRank: number;
  effectiveEffectRank: number;
  resistance: number;
  hits: number;
  effectiveModifier: number;
  resistanceDegree: DamageResistanceDegree;
  specialRank: number;
  bonusDie: number;
  usedDie: number;
  checkRequired: boolean;
  specialRule: string;
  conditions: string[];
  summary: string;
};

export type DamageResistanceDegree =
  | "normal"
  | "immunity"
  | "impervious"
  | "reduction"
  | "improved"
  | "susceptible"
  | "weakness";

export function getDamageResistanceResult({
  die,
  resistance,
  effectRank,
  hits = 0,
  circumstance = 0,
  resistanceDegree = "normal",
  specialRank = 0,
  bonusDie = 1,
}: {
  die: number;
  resistance: number;
  effectRank: number;
  hits?: number;
  circumstance?: number;
  resistanceDegree?: DamageResistanceDegree;
  specialRank?: number;
  bonusDie?: number;
}): DamageResistanceResult {
  const safeEffectRank = Math.max(0, integer(effectRank));
  const safeResistance = integer(resistance);
  const safeHits = Math.max(0, integer(hits));
  const safeSpecialRank = Math.max(0, integer(specialRank));
  const safeDie = clamp(integer(die), 1, 20);
  const safeBonusDie = clamp(integer(bonusDie), 1, 20);
  const effectiveModifier = safeResistance - safeHits;
  const effectiveEffectRank = resistanceDegree === "reduction"
    ? Math.ceil(safeEffectRank / 2)
    : resistanceDegree === "susceptible" || resistanceDegree === "weakness"
      ? safeEffectRank + 5
      : safeEffectRank;
  const imperviousApplies = resistanceDegree === "impervious" && safeEffectRank <= safeSpecialRank;
  const checkRequired = resistanceDegree !== "immunity" && !imperviousApplies;
  const improvedApplies = resistanceDegree === "improved" && safeEffectRank <= safeSpecialRank;
  const usedDie = improvedApplies ? Math.max(safeDie, safeBonusDie) : safeDie;

  if (!checkRequired) {
    const specialRule = resistanceDegree === "immunity"
      ? "Imunidade: o efeito não exige teste."
      : `Impenetrável ${safeSpecialRank}: a graduação ${safeEffectRank} não supera a resistência.`;
    return {
      die: safeDie,
      modifier: effectiveModifier,
      circumstance: integer(circumstance),
      difficultyClass: 10 + effectiveEffectRank,
      addedAdjustment: 0,
      total: 0,
      margin: 0,
      success: true,
      degrees: 0,
      label: "Sem teste",
      effectRank: safeEffectRank,
      effectiveEffectRank,
      resistance: safeResistance,
      hits: safeHits,
      effectiveModifier,
      resistanceDegree,
      specialRank: safeSpecialRank,
      bonusDie: safeBonusDie,
      usedDie,
      checkRequired,
      specialRule,
      conditions: [],
      summary: "Nenhuma nova condição de dano",
    };
  }

  let check = getCheckResult({
    die: usedDie,
    modifier: effectiveModifier,
    circumstance,
    difficultyClass: 10 + effectiveEffectRank,
  });
  if (resistanceDegree === "weakness" && check.success) {
    check = {
      ...check,
      success: false,
      degrees: 1,
      label: "1 grau de falha por Fraqueza",
    };
  }

  let conditions: string[];
  if (check.success && check.degrees >= 2) {
    conditions = [];
  } else if (check.success) {
    conditions = ["Ferido"];
  } else if (check.degrees === 1) {
    conditions = ["Ferido", "Atordoado ou Caído"];
  } else if (check.degrees === 2) {
    conditions = ["Ferido", "Atordoado ou Caído", "Cambaleante"];
  } else {
    conditions = [
      "Ferido",
      "Atordoado ou Caído",
      "Cambaleante",
      "Incapacitado",
    ];
  }

  return {
    ...check,
    effectRank: safeEffectRank,
    effectiveEffectRank,
    resistance: safeResistance,
    hits: safeHits,
    effectiveModifier,
    resistanceDegree,
    specialRank: safeSpecialRank,
    bonusDie: safeBonusDie,
    usedDie,
    checkRequired,
    specialRule: getDamageSpecialRule({
      resistanceDegree,
      improvedApplies,
      specialRank: safeSpecialRank,
      effectRank: safeEffectRank,
      effectiveEffectRank,
      die: safeDie,
      bonusDie: safeBonusDie,
    }),
    conditions,
    summary: conditions.length
      ? conditions.join(" · ")
      : "Nenhuma nova condição de dano",
  };
}

function getDamageSpecialRule({
  resistanceDegree,
  improvedApplies,
  specialRank,
  effectRank,
  effectiveEffectRank,
  die,
  bonusDie,
}: {
  resistanceDegree: DamageResistanceDegree;
  improvedApplies: boolean;
  specialRank: number;
  effectRank: number;
  effectiveEffectRank: number;
  die: number;
  bonusDie: number;
}) {
  if (resistanceDegree === "reduction") {
    return `Redução: graduação efetiva ${effectiveEffectRank}.`;
  }
  if (improvedApplies) {
    return `Aprimorada ${specialRank}: usado o maior resultado entre ${die} e ${bonusDie}.`;
  }
  if (resistanceDegree === "improved") {
    return `Aprimorada ${specialRank} não alcança a graduação ${effectRank}; o teste usa um dado.`;
  }
  if (resistanceDegree === "impervious") {
    return `Impenetrável ${specialRank} não alcança a graduação ${effectRank}; o teste é necessário.`;
  }
  if (resistanceDegree === "susceptible") {
    return `Suscetível: graduação efetiva ${effectiveEffectRank}.`;
  }
  if (resistanceDegree === "weakness") {
    return `Fraqueza: graduação efetiva ${effectiveEffectRank}; o melhor resultado possível é um grau de falha.`;
  }
  return "";
}

function integer(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.trunc(value);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
