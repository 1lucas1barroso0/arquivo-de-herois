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
