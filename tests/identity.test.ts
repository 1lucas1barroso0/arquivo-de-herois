import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import manifest from "../app/manifest";
import {
  APPLICATION_NAME,
  createPortablePackage,
} from "../lib/portable";
import { createEmptySheet } from "../lib/character";

const readProjectFile = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

function sourceFiles(directory: string): string[] {
  const absolute = join(projectRoot, directory);
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(relative);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [relative] : [];
  });
}

test("every public application identity uses the exact name Arquivo de Heróis", () => {
  const pwa = manifest();
  const packageData = JSON.parse(readProjectFile("package.json")) as {
    displayName?: string;
  };
  const layoutSource = readProjectFile("app/layout.tsx");
  const appIcon = readProjectFile("public/icons/app-icon.svg");
  const favicon = readProjectFile("public/favicon.svg");
  const portable = createPortablePackage(createEmptySheet());

  assert.equal(APPLICATION_NAME, "Arquivo de Heróis");
  assert.equal(pwa.name, APPLICATION_NAME);
  assert.equal(pwa.short_name, APPLICATION_NAME);
  assert.equal(packageData.displayName, APPLICATION_NAME);
  assert.equal(portable.application, APPLICATION_NAME);
  assert.match(layoutSource, /title: "Arquivo de Heróis"/);
  assert.match(layoutSource, /applicationName: "Arquivo de Heróis"/);
  assert.match(appIcon, /<title>Arquivo de Heróis<\/title>/);
  assert.match(favicon, /<title>Arquivo de Heróis<\/title>/);
});

test("generic interface language defaults to o personagem", () => {
  const forbiddenArticle =
    /\b(?:a|da|desta|esta|uma|toda|nova) personagem\b|à personagem\b/iu;
  const forbiddenAgreement =
    /\bpersonagem (?:heroica|heróica|humana|ativa)\b/iu;

  for (const path of ["app", "components", "lib"].flatMap(sourceFiles)) {
    const source = readProjectFile(path);
    assert.doesNotMatch(source, forbiddenArticle, path);
    assert.doesNotMatch(source, forbiddenAgreement, path);
  }
});

test("public copy keeps the brand quiet and uses natural Portuguese", () => {
  const publicSources = ["app", "components"].flatMap(sourceFiles);
  const parentheticalPlural = /\b[\p{L}]+\((?:s|a|as|os)\)\b/iu;

  for (const path of publicSources) {
    const source = readProjectFile(path);
    assert.doesNotMatch(source, /M&M4e|M&amp;M4e/, path);
    assert.doesNotMatch(source, parentheticalPlural, path);
  }

  const navigation = readProjectFile("components/hero-archive-app.tsx");
  const references = readProjectFile("components/scale-guide.tsx");
  assert.match(navigation, /\{m\("nav\.references"\)\}<\/button>/);
  assert.match(references, /\{t\("Referências"\)\}<\/p>/);
  assert.doesNotMatch(navigation, /> Referência<\/button>/);
  assert.doesNotMatch(navigation, /JSON, TXT ou \.mm4e/);
  assert.match(navigation, /\.arquivo-de-herois\.\$\{format\}/);
});
