import assert from "node:assert/strict";
import test from "node:test";
import { createEmptySheet } from "../lib/character";
import { CUSTOM_CATALOG_KEY } from "../lib/catalog";
import { getRuleAudit } from "../lib/rules";
import {
  parsePortableSheet,
  portableSheetToJson,
  portableSheetToText,
} from "../lib/portable";
import {
  createPortableShareUrl,
  parsePortableShare,
} from "../lib/portable-share";

function exampleSheet() {
  const sheet = createEmptySheet();
  sheet.id = "private-id";
  sheet.heroName = "Aurora Ômega";
  sheet.civilName = "Lívia Ação";
  sheet.concept = "Heroína cósmica — ciência & coragem";
  sheet.notes = "Texto com acentos: á, ç, ã e símbolos ⚡.";
  sheet.abilities.strength = 7;
  sheet.sizeRank = 2;
  sheet.absentTraits = ["stamina"];
  sheet.shareEnabled = true;
  sheet.shareToken = "private-token";
  return sheet;
}

test("portable JSON round-trips all sheet data without private identifiers", () => {
  const imported = parsePortableSheet(portableSheetToJson(exampleSheet()));
  assert.equal(imported.heroName, "Aurora Ômega");
  assert.equal(imported.notes, "Texto com acentos: á, ç, ã e símbolos ⚡.");
  assert.equal(imported.abilities.strength, 7);
  assert.equal(imported.sizeRank, 2);
  assert.deepEqual(imported.absentTraits, ["stamina"]);
  assert.equal(imported.id, "");
  assert.equal(imported.shareEnabled, false);
  assert.equal(imported.shareToken, null);
});

test("self-contained share links open without a server-side record", async () => {
  const url = await createPortableShareUrl(
    exampleSheet(),
    "https://arquivo-de-herois.example",
  );
  assert.match(url, /^https:\/\/arquivo-de-herois\.example\/share#[gj]\./);
  const imported = await parsePortableShare(url);
  assert.equal(imported?.heroName, "Aurora Ômega");
  assert.equal(imported?.id, "");
  assert.equal(imported?.shareToken, null);
});

test("human-readable TXT is lossless and reimportable", () => {
  const text = portableSheetToText(exampleSheet());
  assert.match(text, /ARQUIVO-DE-HEROIS-DADOS:/);
  assert.match(text, /Aurora Ômega/);
  const imported = parsePortableSheet(text);
  assert.equal(imported.heroName, "Aurora Ômega");
  assert.equal(imported.concept, "Heroína cósmica — ciência & coragem");
  assert.equal(imported.notes, "Texto com acentos: á, ç, ã e símbolos ⚡.");
});

test("portable copies preserve valid audit decisions", () => {
  const sheet = createEmptySheet();
  sheet.buildType = "npc";
  sheet.advantages.push({
    id: "portable-ruling",
    catalogKey: CUSTOM_CATALOG_KEY,
    name: "Vantagem aprovada",
    rank: 1,
    categories: ["Geral"],
    kind: "standard",
    notes: "Decisão da mesa.",
  });
  const key = "advantage-custom-portable-ruling";
  const warning = getRuleAudit(sheet).checks.find(
    (check) => check.key === key,
  )!;
  sheet.auditDecisions[key] = {
    decision: "approved",
    fingerprint: warning.reviewFingerprint!,
    decidedAt: "2026-08-02T00:00:00.000Z",
  };

  const imported = parsePortableSheet(portableSheetToText(sheet));
  const reviewed = getRuleAudit(imported).checks.find(
    (check) => check.key === key,
  );
  assert.equal(reviewed?.status, "pass");
  assert.equal(reviewed?.reviewDecision, "approved");
});

test("legacy JSON wrappers remain importable", () => {
  const sheet = exampleSheet();
  const imported = parsePortableSheet(JSON.stringify({ format: "mm4e-hero-sheet", version: 1, sheet }));
  assert.equal(imported.heroName, sheet.heroName);
  assert.equal(imported.id, "");
});
