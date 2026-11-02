import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DashboardScreen } from "../components/dashboard-screen";
import { createEmptySheet } from "../lib/character";
import { createSummary } from "../lib/rules";
import { createCampaignSummary, createEmptyCampaign } from "../lib/workspace";
import { translateMessage } from "../lib/messages";

const noop = () => undefined;

test("dashboard counts agree with zero, one and multiple visible records", () => {
  for (const count of [0, 1, 2]) {
    const characters = Array.from({ length: count }, (_, i) => ({
      ...createSummary(createEmptySheet()), id: `sheet-${i}`,
      buildType: "npc" as const, favorite: true, completion: 50, alertCount: 1,
    }));
    const campaigns = Array.from({ length: count }, (_, i) => ({
      ...createCampaignSummary(createEmptyCampaign()), id: `campaign-${i}`,
    }));
    const html = renderToStaticMarkup(<DashboardScreen
      characters={characters} campaigns={campaigns} onOpenSheet={noop}
      onNewSheet={noop} onCharacters={noop} onCampaigns={noop}
      onGmTools={noop} onReferences={noop}
    />);
    for (const label of count === 1
      ? ["Ficha", "Campanha", "NPC", "Ficha com alertas"]
      : ["Fichas", "Campanhas", "NPCs", "Fichas com alertas"]) {
      assert.ok(html.includes(`<strong>${count}</strong><span>${label}</span>`), `${count} ${label}`);
    }
  }
});

test("English counts and mixed backup quantities agree independently", () => {
  for (const [count, sheet, campaign, npc, alert] of [
    [0, "Sheets", "Campaigns", "NPCs", "Sheets with alerts"],
    [1, "Sheet", "Campaign", "NPC", "Sheet with alerts"],
    [2, "Sheets", "Campaigns", "NPCs", "Sheets with alerts"],
  ] as const) {
    for (const [key, expected] of [
      ["dashboard.sheets", sheet], ["dashboard.campaigns", campaign],
      ["dashboard.npcs", npc], ["dashboard.alerts", alert],
    ] as const) assert.equal(translateMessage(key, "en", { count }), expected);
  }
  for (const [language, expected] of [
    ["pt", "Backup importado como 1 nova ficha e 2 novas campanhas."],
    ["en", "Backup imported as 1 new sheet and 2 new campaigns."],
  ] as const) {
    assert.equal(translateMessage("backup.imported", language, {
      sheets: `1 ${translateMessage("backup.newSheets", language, { count: 1 })}`,
      campaigns: `2 ${translateMessage("backup.newCampaigns", language, { count: 2 })}`,
    }), expected);
  }
});

test("audit, synchronization, ranks, and their modifiers agree in both languages", async () => {
  const { formatMessageCount } = await import("../lib/messages");
  for (const [language, one, many, approved, synced, calculated] of [
    ["pt", "1 aviso pendente", "2 avisos pendentes", "1 aviso aprovado", "1 ficha sincronizada", "1 uso calculado pela vantagem Sorte"],
    ["en", "1 pending warning", "2 pending warnings", "1 approved warning", "1 sheet synchronized", "1 use calculated from the Luck advantage"],
  ] as const) {
    assert.equal(formatMessageCount("count.pendingWarnings", 1, language), one);
    assert.equal(formatMessageCount("count.pendingWarnings", 2, language), many);
    assert.equal(formatMessageCount("count.approvedWarnings", 1, language), approved);
    assert.equal(formatMessageCount("count.syncedSheets", 1, language), synced);
    assert.equal(formatMessageCount("count.calculatedLuck", 1, language), calculated);
  }
  assert.equal(formatMessageCount("count.errors", 0, "en"), "0 errors");
  assert.equal(formatMessageCount("count.ranks", 1, "pt"), "1 graduação");
  assert.equal(translateMessage("catalog.effectCount", "pt", { count: 1 }), "efeito com custo-base, ação, alcance, duração, teste e resistência preenchidos.");
  assert.equal(translateMessage("skills.completeCount", "en", { count: 1 }), "Complete 1 skill");
});

test("printed audit and numeric diagnostics remain grammatical without rewriting personal text", async () => {
  const { SheetView } = await import("../components/sheet-view");
  const { createExampleSheets } = await import("../lib/example-sheets");
  const { getRuleAudit } = await import("../lib/rules");
  const atlas = createExampleSheets()[2];
  atlas.heroName = "1 fichas — texto pessoal";
  const html = renderToStaticMarkup(<SheetView sheet={atlas} showAudit />);
  assert.match(html, /1 aviso pendente/);
  assert.doesNotMatch(html, /1 avisos pendentes/);
  assert.ok(html.includes("1 fichas — texto pessoal"));
  atlas.skills[0].rank = 1.5;
  assert.match(getRuleAudit(atlas).checks.find(c => c.key === "numeric-integrity")?.detail ?? "", /graduações: o valor deve ser inteiro/);
});
