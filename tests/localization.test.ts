import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { hasUiTranslation, localizeConditionLabel, translateUi } from "../lib/localization";

test("condition labels never mix Portuguese and English", () => {
  assert.equal(localizeConditionLabel("Cego (Blind)", "pt"), "Cego");
  assert.equal(localizeConditionLabel("Cego (Blind)", "en"), "Blind");
});

test("reference calculators have complete English interface copy", () => {
  for (const text of ["Classes de Dificuldade", "Resolver um teste graduado", "Resolver resistência a dano", "Graduação de medida", "Ataque + efeito", "Defesa + Robustez", "Circunstância", "Impenetrável"]) {
    assert.equal(hasUiTranslation(text), true, `missing English translation: ${text}`);
    assert.notEqual(translateUi(text, "en"), text);
  }
});

test("analysis uses close defense and never the removed Parry label", () => {
  const analysis = readFileSync(new URL("../lib/analysis.ts", import.meta.url), "utf8");
  const panel = readFileSync(new URL("../components/sheet-tools-panel.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(analysis, /\bparry\b/i);
  assert.doesNotMatch(panel, /Parry|Aparar/);
  assert.match(panel, /closeDefense/);
});
