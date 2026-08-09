import assert from "node:assert/strict";
import test from "node:test";
import {
  getCheckResult,
  getDamageResistanceResult,
  getRoutineCheckResult,
} from "../lib/calculators";

test("graded checks calculate totals, boundaries, and added results", () => {
  assert.deepEqual(
    getCheckResult({ die: 10, modifier: 5, difficultyClass: 15 }),
    {
      die: 10,
      modifier: 5,
      circumstance: 0,
      difficultyClass: 15,
      addedAdjustment: 0,
      total: 15,
      margin: 0,
      success: true,
      degrees: 1,
      label: "1 grau de sucesso",
    },
  );
  assert.equal(
    getCheckResult({ die: 15, modifier: 10, difficultyClass: 20 }).degrees,
    2,
  );
  assert.equal(
    getCheckResult({ die: 5, modifier: 10, difficultyClass: 20 }).degrees,
    1,
  );
  assert.equal(
    getCheckResult({ die: 4, modifier: 10, difficultyClass: 20 }).degrees,
    2,
  );
  assert.equal(
    getCheckResult({ die: 20, modifier: 0, difficultyClass: 25 }).success,
    true,
  );
  assert.equal(
    getCheckResult({ die: 1, modifier: 19, difficultyClass: 20 }).total,
    15,
  );
  assert.equal(getRoutineCheckResult(7, -2).total, 15);
});

test("damage resistance returns cumulative fourth-edition conditions", () => {
  assert.equal(
    getDamageResistanceResult({ die: 20, resistance: 10, effectRank: 10 }).summary,
    "Nenhuma nova condição de dano",
  );
  assert.deepEqual(
    getDamageResistanceResult({ die: 10, resistance: 10, effectRank: 10 }).conditions,
    ["Ferido"],
  );
  assert.deepEqual(
    getDamageResistanceResult({ die: 4, resistance: 10, effectRank: 10 }).conditions,
    ["Ferido", "Atordoado ou Caído", "Cambaleante"],
  );
  assert.equal(
    getDamageResistanceResult({ die: 10, resistance: 10, effectRank: 10, hits: 3 }).effectiveModifier,
    7,
  );
  assert.equal(
    getDamageResistanceResult({ die: 1, resistance: 0, effectRank: 30, resistanceDegree: "immunity" }).checkRequired,
    false,
  );
  assert.equal(
    getDamageResistanceResult({ die: 1, resistance: 0, effectRank: 9, resistanceDegree: "impervious", specialRank: 9 }).checkRequired,
    false,
  );
  assert.equal(
    getDamageResistanceResult({ die: 10, resistance: 10, effectRank: 9, resistanceDegree: "reduction" }).difficultyClass,
    15,
  );
  assert.equal(
    getDamageResistanceResult({ die: 4, bonusDie: 17, resistance: 0, effectRank: 9, resistanceDegree: "improved", specialRank: 9 }).usedDie,
    17,
  );
  assert.equal(
    getDamageResistanceResult({ die: 10, resistance: 10, effectRank: 9, resistanceDegree: "susceptible" }).difficultyClass,
    24,
  );
  const weakness = getDamageResistanceResult({ die: 20, resistance: 20, effectRank: 1, resistanceDegree: "weakness" });
  assert.equal(weakness.success, false);
  assert.equal(weakness.degrees, 1);
});
