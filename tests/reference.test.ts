import assert from "node:assert/strict";
import test from "node:test";
import {
  referenceCatalogGroups,
  referenceCatalogTotal,
} from "../lib/reference-catalog";
import {
  localizeRuleReference,
  ruleReferenceCategories,
  ruleReferenceEntries,
  searchRuleReference,
} from "../lib/rule-reference";

test("the reference center indexes every structured creation group", () => {
  assert.equal(referenceCatalogGroups.length, 16);
  assert.equal(referenceCatalogTotal, 625);

  const groupIds = referenceCatalogGroups.map((group) => group.id);
  assert.equal(new Set(groupIds).size, groupIds.length);

  for (const group of referenceCatalogGroups) {
    assert.ok(group.label.trim(), `${group.id}: rótulo ausente`);
    assert.ok(group.items.length, `${group.id}: grupo vazio`);
    assert.equal(
      new Set(group.items.map((entry) => entry.id)).size,
      group.items.length,
      `${group.id}: identificador duplicado`,
    );
  }

  const motivations = referenceCatalogGroups.find((group) => group.id === "motivations")!;
  const complications = referenceCatalogGroups.find((group) => group.id === "complications")!;
  assert.equal(
    complications.items.some((entry) => motivations.items.some((motivation) => motivation.id === entry.id)),
    false,
    "motivações não devem aparecer duas vezes na referência unificada",
  );
});

test("the rule index is complete, unique, searchable, and explicit about automation", () => {
  assert.ok(ruleReferenceEntries.length >= 28);
  assert.equal(
    new Set(ruleReferenceEntries.map((entry) => entry.id)).size,
    ruleReferenceEntries.length,
  );
  assert.ok(ruleReferenceCategories.includes("Nível de Poder"));
  assert.ok(ruleReferenceCategories.includes("Poderes"));
  assert.ok(ruleReferenceCategories.includes("Liberdade"));

  for (const entry of ruleReferenceEntries) {
    assert.ok(entry.category.trim(), `${entry.id}: categoria ausente`);
    assert.ok(entry.title.trim(), `${entry.id}: título ausente`);
    assert.ok(entry.summary.trim(), `${entry.id}: resumo ausente`);
    assert.ok(entry.tags.length, `${entry.id}: termos de pesquisa ausentes`);
    assert.ok(["automatic", "assisted", "reference"].includes(entry.coverage));
    const english = localizeRuleReference(entry, "en");
    assert.notEqual(english.title, entry.title, `${entry.id}: título em inglês ausente`);
    assert.notEqual(english.summary, entry.summary, `${entry.id}: resumo em inglês ausente`);
  }

  assert.ok(ruleReferenceEntries.some((entry) => searchRuleReference(entry, "robustez")));
  assert.ok(ruleReferenceEntries.some((entry) => searchRuleReference(entry, "power stunt")));
  assert.ok(ruleReferenceEntries.some((entry) => searchRuleReference(entry, "modo livre")));
  assert.ok(ruleReferenceEntries.some((entry) => searchRuleReference(entry, "damage resistance")));
});
