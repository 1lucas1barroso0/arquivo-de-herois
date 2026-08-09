import assert from "node:assert/strict";
import test from "node:test";
import { getAbilityBenchmark, getMeasurementRow, getPowerLevelMetrics, getSkillBenchmark, getSpeedBenchmark, getThrowingDistance, getTravelDistance, getTravelTime } from "../lib/scales";

test("published scale anchors and open-ended formulas remain exact", () => {
  assert.equal(getAbilityBenchmark(0).label, "Média humana");
  assert.equal(getAbilityBenchmark(9).exact, false);
  assert.equal(getAbilityBenchmark(35).label, "Cósmico ou divino");
  assert.equal(getSkillBenchmark(10).routineResult, 20);
  assert.equal(getSkillBenchmark(10).difficulty, "Desafiador");
  assert.deepEqual(getPowerLevelMetrics(12), { powerLevel: 12, recommendedPoints: 180, pairedLimit: 24, skillLimit: 22, initiativeLimit: 24, heroicUses: 6 });
  assert.equal(getPowerLevelMetrics(40).recommendedPoints, 600);
  assert.equal(getMeasurementRow(23).volume, "500.000 m³");
  assert.equal(getMeasurementRow(31).exact, false);
  assert.equal(getMeasurementRow(31).distance, "≈ 4.000.000 km");
  assert.equal(getMeasurementRow(-6).mass, "≈ 375 g");
  assert.equal(getSpeedBenchmark(10).distancePerRound, "2 km");
  assert.deepEqual(getTravelDistance(2, 9), { speedRank: 2, timeRank: 9, rank: 11, value: "4 km", formula: "2 + 9 = 11" });
  assert.deepEqual(getTravelTime(18, 12), { distanceRank: 18, speedRank: 12, rank: 6, value: "8 min", formula: "18 − 12 = 6" });
  assert.deepEqual(getThrowingDistance(12, 7), { strengthRank: 12, massRank: 7, rank: 5, value: "64 m", formula: "12 − 7 = 5" });
});
