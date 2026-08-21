import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DashboardScreen } from "../components/dashboard-screen";
import { GmTools } from "../components/gm-tools";
import { SheetView } from "../components/sheet-view";
import { createEmptySheet } from "../lib/character";
import { humanizeError } from "../lib/errors";
import { messages, translateMessage } from "../lib/messages";
import { createSummary } from "../lib/rules";
import { apiError } from "../lib/server";

const noop = () => undefined;

test("optional sheet sections keep a unique, continuous visual sequence", () => {
  const sheet = createEmptySheet();
  sheet.heroName = "Ficha integral";
  sheet.notes = "Histórico preservado";
  sheet.movement = [{
    id: "move",
    typeId: "movement.flight",
    name: "Voo",
    rank: 5,
    sourceEffectId: "",
    notes: "",
  }];
  sheet.relationships = [{
    id: "relationship",
    targetSheetId: "ally",
    targetName: "Aliado",
    kind: "team-member",
    notes: "Equipe",
  }];
  sheet.session = { ...sheet.session, active: true };

  const html = renderToStaticMarkup(<SheetView sheet={sheet} showAudit />);
  const indices = [...html.matchAll(
    /<header class="section-heading"><span>(\d{2})<\/span>/g,
  )].map((match) => match[1]);

  assert.ok(indices.length >= 14);
  assert.deepEqual(
    indices,
    Array.from({ length: indices.length }, (_, index) =>
      String(index + 1).padStart(2, "0"),
    ),
  );
  assert.match(html, /Movimento e sentidos/);
  assert.match(html, /Membro de equipe/);
  assert.doesNotMatch(html, />team-member</);
});

test("the dashboard exposes RPG-focused empty states and actionable summaries", () => {
  const favorite = createEmptySheet();
  favorite.id = "favorite";
  favorite.heroName = "Favorito";
  favorite.favorite = true;
  const npc = createEmptySheet();
  npc.id = "npc";
  npc.heroName = "NPC";
  npc.buildType = "npc";

  const html = renderToStaticMarkup(
    <DashboardScreen
      characters={[createSummary(favorite), createSummary(npc)]}
      campaigns={[]}
      onOpenSheet={noop}
      onNewSheet={noop}
      onCharacters={noop}
      onCampaigns={noop}
      onGmTools={noop}
      onReferences={noop}
    />,
  );

  assert.match(html, /Edições recentes/);
  assert.match(html, /Favoritos/);
  assert.match(html, /Ferramentas do Narrador|Narrador/);
  assert.match(html, /Organize fichas e contexto de jogo/);
  assert.match(html, /fichas incompletas/);
  assert.doesNotMatch(html, /pedem revisão/);
});

test("GM tools present the optional estimate without naming an unofficial metric", () => {
  const html = renderToStaticMarkup(
    <GmTools
      characters={[]}
      onCreateNpc={noop}
      onOpenReferences={noop}
    />,
  );

  assert.match(html, /Estimativa mecânica/);
  assert.match(
    html,
    /ferramenta auxiliar opcional, não uma regra oficial de M&amp;M4e/,
  );
  assert.doesNotMatch(html, /\bCE\b|VTT/);
  assert.doesNotMatch(html, /resultado garantido|verdade absoluta/i);
});

test("campaigns expose deletion and translated navigation never breaks words", () => {
  const campaignSource = readFileSync("components/campaigns-workspace.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(campaignSource, /method: "DELETE"/);
  assert.match(campaignSource, /campaign\.deleteConfirm/);
  assert.match(css, /white-space:\s*nowrap/);
  assert.match(css, /word-break:\s*normal/);
});

test("every stable interface message has complete PT-BR and English text", () => {
  for (const key of Object.keys(messages) as Array<keyof typeof messages>) {
    assert.ok(translateMessage(key, "pt").trim(), `${key} has PT-BR text`);
    assert.ok(translateMessage(key, "en").trim(), `${key} has English text`);
  }
  assert.equal(translateMessage("encounter.referencePl", "pt"), "NP de referência");
  assert.equal(translateMessage("encounter.referencePl", "en"), "Reference PL");
});

test("technical exceptions are replaced with a human, data-safe message", () => {
  const message = humanizeError(
    new TypeError("can't access property \"length\", absentTraits is undefined"),
    "Não foi possível abrir a ficha.",
  );
  assert.doesNotMatch(message, /absentTraits|undefined|property/i);
  assert.match(message, /dados salvos continuam seguros/i);
});

test("API failures never expose database diagnostics to the browser", async () => {
  const response = apiError(
    new Error("D1_ERROR: no such table character_revisions at SQL statement"),
    "Não foi possível carregar o histórico da ficha.",
  );
  const payload = (await response.json()) as { error: string };
  assert.equal(payload.error, "Não foi possível carregar o histórico da ficha.");
  assert.doesNotMatch(payload.error, /D1|SQL|table/i);
});

test("PWA updates are user-controlled, data-safe, and never cache API data", () => {
  const serviceWorker = readFileSync(
    new URL("../public/sw.js", import.meta.url),
    "utf8",
  );
  const manager = readFileSync(
    new URL("../components/pwa-manager.tsx", import.meta.url),
    "utf8",
  );
  const localApi = readFileSync(
    new URL("../lib/local-api.ts", import.meta.url),
    "utf8",
  );

  assert.match(serviceWorker, /arquivo-herois-v17/);
  assert.match(serviceWorker, /if \(url\.pathname\.startsWith\("\/api\/"\)\) return/);
  assert.match(serviceWorker, /SKIP_WAITING/);
  assert.match(manager, /hasUnsavedChanges/);
  assert.match(manager, /controllerchange/);
  assert.match(manager, /updateReloadRequested/);
  assert.match(localApi, /const DATABASE_VERSION = 2/);
  assert.match(localApi, /objectStoreNames\.contains\(STORE_NAME\)/);
  assert.doesNotMatch(localApi, /deleteObjectStore|indexedDB\.deleteDatabase/);
});

test("responsive, reduced-motion, and print safeguards cover the new workspaces", () => {
  const css = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(css, /body\s*\{\s*overflow-x: hidden/);
  assert.match(
    css,
    /@media \(max-width: 680px\)[\s\S]*?\.universal-search\s*\{[\s\S]*?min-height: 100dvh/,
  );
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation-duration: \.01ms !important/,
  );
  assert.match(
    css,
    /@media print[\s\S]*?\.dashboard-page,[\s\S]*?\.gm-page,[\s\S]*?display: none !important/,
  );
});
