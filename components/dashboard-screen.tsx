"use client";

import {
  BookOpen,
  CircleAlert,
  Heart,
  Plus,
  Shield,
  Users,
} from "lucide-react";
import type { SheetSummary } from "../lib/character";
import type { CampaignSummary } from "../lib/workspace";
import { useLocale } from "./locale-provider";

export function DashboardScreen({
  characters,
  campaigns,
  onOpenSheet,
  onNewSheet,
  onCharacters,
  onCampaigns,
  onGmTools,
  onReferences,
}: {
  characters: SheetSummary[];
  campaigns: CampaignSummary[];
  onOpenSheet: (id: string) => void;
  onNewSheet: () => void;
  onCharacters: () => void;
  onCampaigns: () => void;
  onGmTools: () => void;
  onReferences: () => void;
}) {
  const { m } = useLocale();
  const visible = characters.filter((entry) => !entry.archived);
  const favorites = visible.filter((entry) => entry.favorite);
  const alerts = visible.filter((entry) => entry.alertCount > 0);
  const incomplete = visible.filter((entry) => entry.completion < 100);
  const npcs = visible.filter((entry) => entry.buildType === "npc");
  const recent = visible.slice(0, 5);

  return (
    <div className="dashboard-page">
      <header className="dashboard-hero">
        <div>
          <p className="eyebrow">{m("dashboard.eyebrow")}</p>
          <h1>{m("dashboard.title")}</h1>
          <p>{m("dashboard.description")}</p>
        </div>
        <button className="button button-primary" type="button" onClick={onNewSheet}>
          <Plus aria-hidden="true" /> {m("creation.quick")}
        </button>
      </header>

      <section className="dashboard-stats" aria-label={m("dashboard.summary")}>
        <button type="button" onClick={onCharacters}>
          <strong>{visible.length}</strong><span>{m("dashboard.sheets")}</span>
        </button>
        <button type="button" onClick={onCampaigns}>
          <strong>{campaigns.filter((entry) => !entry.archived).length}</strong><span>{m("nav.campaigns")}</span>
        </button>
        <button type="button" onClick={onCharacters}>
          <strong>{npcs.length}</strong><span>{m("dashboard.npcs")}</span>
        </button>
        <button type="button" onClick={onCharacters}>
          <strong>{alerts.length}</strong><span>{m("dashboard.alerts")}</span>
        </button>
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-section dashboard-recent">
          <header><div><Shield aria-hidden="true" /><h2>{m("dashboard.recent")}</h2></div><button type="button" onClick={onCharacters}>{m("dashboard.viewAll")}</button></header>
          {recent.length ? (
            <div className="dashboard-sheet-list">
              {recent.map((sheet) => (
                <button key={sheet.id} type="button" onClick={() => onOpenSheet(sheet.id)}>
                  <span className="dashboard-avatar" style={{ "--dashboard-accent": sheet.accent } as React.CSSProperties}>
                    {/* User-selected images may be local data URLs and cannot use the image optimizer. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {sheet.imageUrl ? <img src={sheet.imageUrl} alt="" /> : sheet.heroName.slice(0, 1)}
                  </span>
                  <span><strong>{sheet.heroName}</strong><small>{m("common.powerLevelShort")} {sheet.powerLevel} · {sheet.pointsSpent}/{sheet.pointsTotal} PP</small></span>
                  <span className={`dashboard-status status-${sheet.auditStatus}`}>{sheet.alertCount ? sheet.alertCount : "✓"}</span>
                </button>
              ))}
            </div>
          ) : <p className="dashboard-empty">{m("dashboard.noRecent")}</p>}
        </section>

        <aside className="dashboard-side">
          <section className="dashboard-section">
            <header><div><Heart aria-hidden="true" /><h2>{m("dashboard.favorites")}</h2></div></header>
            <p><strong>{favorites.length}</strong> {m(favorites.length === 1 ? "dashboard.favoriteOne" : "dashboard.favoriteMany")}</p>
          </section>
          <section className="dashboard-section">
            <header><div><CircleAlert aria-hidden="true" /><h2>{m("dashboard.incomplete")}</h2></div></header>
            <p><strong>{incomplete.length}</strong> {m(incomplete.length === 1 ? "dashboard.reviewOne" : "dashboard.reviewMany")}</p>
          </section>
        </aside>
      </div>

      <section className="dashboard-shortcuts" aria-label={m("dashboard.shortcuts")}>
        <button type="button" onClick={onCampaigns}><Users aria-hidden="true" /><span><strong>{m("nav.campaigns")}</strong><small>{m("dashboard.campaignHelp")}</small></span></button>
        <button type="button" onClick={onGmTools}><Shield aria-hidden="true" /><span><strong>{m("nav.gmTools")}</strong><small>{m("dashboard.gmHelp")}</small></span></button>
        <button type="button" onClick={onReferences}><BookOpen aria-hidden="true" /><span><strong>{m("nav.references")}</strong><small>{m("dashboard.referenceHelp")}</small></span></button>
      </section>
    </div>
  );
}
