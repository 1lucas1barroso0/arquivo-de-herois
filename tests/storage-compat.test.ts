import assert from "node:assert/strict";
import test from "node:test";
import {
  listBrowserStorageKeys,
  readBrowserStorage,
  removeBrowserStorage,
  writeBrowserStorage,
} from "../lib/browser-storage";
import {
  createEmptySheet,
  getEffectiveAbsentTraits,
  type CharacterSheet,
} from "../lib/character";
import { normalizeLocalCharacters } from "../lib/local-api";
import { createSummary, getRuleAudit } from "../lib/rules";
import { apiError } from "../lib/server";
import {
  isLocalStorageFallbackResponse,
  StorageUnavailableError,
} from "../lib/storage-mode";

test("legacy local sheets are read without mutation or data loss", () => {
  const legacy = structuredClone(createEmptySheet()) as unknown as Record<
    string,
    unknown
  >;
  legacy.schemaVersion = 5;
  legacy.heroName = "Ficha preservada";
  legacy.notes = "Conteúdo que não pode desaparecer.";
  delete legacy.absentTraits;
  legacy.absentAbilities = ["awareness", "not-a-trait"];
  const original = structuredClone(legacy);

  const [normalized] = normalizeLocalCharacters([legacy]);

  assert.deepEqual(legacy, original, "a leitura não deve reescrever o IndexedDB");
  assert.equal(normalized.heroName, "Ficha preservada");
  assert.equal(normalized.notes, "Conteúdo que não pode desaparecer.");
  assert.deepEqual(normalized.absentTraits, ["awareness"]);
  assert.equal(
    getEffectiveAbsentTraits(legacy as { absentAbilities?: unknown }).has(
      "presence",
    ),
    true,
  );
});

test("legacy sheets without any absence field remain auditable and summarizable", () => {
  const legacy = structuredClone(createEmptySheet()) as unknown as Record<
    string,
    unknown
  >;
  delete legacy.absentTraits;

  assert.doesNotThrow(() =>
    getRuleAudit(legacy as unknown as CharacterSheet),
  );
  const summary = createSummary(legacy as Partial<CharacterSheet>);
  assert.equal(summary.heroName, legacy.heroName);
  assert.equal(summary.auditStatus, getRuleAudit(createEmptySheet()).status);
});

test("only an explicit storage-unavailable response enables local fallback", () => {
  const unavailable = apiError(
    new StorageUnavailableError("A conexão persistente está indisponível."),
  );
  assert.equal(unavailable.status, 503);
  assert.equal(isLocalStorageFallbackResponse(unavailable), true);

  const unexpected = apiError(new Error("Falha inesperada."));
  assert.equal(unexpected.status, 500);
  assert.equal(isLocalStorageFallbackResponse(unexpected), false);
});

test("browser-storage helpers are safe when storage is unavailable", () => {
  assert.equal(readBrowserStorage("missing"), null);
  assert.equal(writeBrowserStorage("key", "value"), false);
  assert.equal(removeBrowserStorage("key"), false);
  assert.deepEqual(listBrowserStorageKeys(), []);
});
