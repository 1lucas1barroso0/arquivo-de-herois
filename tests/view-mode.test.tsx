import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SheetView } from "../components/sheet-view";
import { createExampleSheets } from "../lib/example-sheets";

test("the clean view hides diagnostics without removing sheet data", () => {
  const sheet = createExampleSheets()[1];
  const html = renderToStaticMarkup(
    <SheetView sheet={sheet} />,
  );

  assert.match(html, /aria-label="Ficha limpa do personagem"/);
  assert.doesNotMatch(html, /Auditoria das regras/);
  assert.doesNotMatch(html, /class="sheet-audit-pill/);
  assert.doesNotMatch(html, /<th>NP<\/th>/);
  assert.doesNotMatch(html, /<th>Limite<\/th>/);
  assert.match(html, /<span>03<\/span>[\s\S]*?<h2>Perícias<\/h2>/);
  assert.match(html, /Contabilidade calculada/);
  assert.match(html, /Sentinela Solar/);
});

test("the audited view exposes every rule diagnostic", () => {
  const sheet = createExampleSheets()[1];
  const html = renderToStaticMarkup(
    <SheetView sheet={sheet} showAudit />,
  );

  assert.match(html, /aria-label="Ficha do personagem com auditoria"/);
  assert.match(html, /Auditoria das regras/);
  assert.match(html, /class="sheet-audit-pill/);
  assert.match(html, /<th>NP<\/th>/);
  assert.match(html, /<th>Limite<\/th>/);
  assert.match(
    html,
    /<span>03<\/span>[\s\S]*?<h2>Auditoria das regras<\/h2>/,
  );
  assert.match(html, /<span>04<\/span>[\s\S]*?<h2>Perícias<\/h2>/);
});

test("view controls keep full-width touch targets on narrow screens", () => {
  const css = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const start = css.lastIndexOf("@media (max-width: 680px)");
  const end = css.indexOf("@media (prefers-reduced-motion", start);
  const mobileRules = css.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.match(
    mobileRules,
    /\.sheet-view-mode-toggle button\s*\{[\s\S]*?min-height: 44px/,
  );
  assert.match(
    mobileRules,
    /\.shared-banner-controls\s*\{[\s\S]*?flex-direction: column/,
  );
  assert.match(
    mobileRules,
    /\.sheet-view-options,[\s\S]*?\.sheet-view-mode-toggle\s*\{[\s\S]*?width: 100%/,
  );
});

test("references become a full-screen, touch-friendly workspace on phones", () => {
  const css = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(
    css,
    /@media \(max-width: 680px\)[\s\S]*?\.scale-dialog\s*\{[\s\S]*?width: 100%;[\s\S]*?height: 100dvh;/,
  );
  assert.match(
    css,
    /@media \(max-width: 680px\)[\s\S]*?\.compact-number-field input,[\s\S]*?min-height: 44px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 680px\)[\s\S]*?\.reference-rule-grid,[\s\S]*?\.reference-catalog-grid\s*\{[\s\S]*?grid-template-columns: 1fr;/,
  );
});
