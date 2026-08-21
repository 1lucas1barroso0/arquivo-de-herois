"use client";

import {
  Activity,
  ArrowDownUp,
  CircleAlert,
  History,
  Link2,
  LoaderCircle,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  conditions,
  newId,
  normalizeSheet,
  type CharacterSheet,
  type RelationshipKind,
  type SheetSummary,
} from "../lib/character";
import { getCharacterAnalysis } from "../lib/analysis";
import {
  restoreCharacterRevision,
  type CharacterRevision,
} from "../lib/history";
import { beginSession, resetSession } from "../lib/session";
import { relationshipKindLabel } from "../lib/localization";
import { useLocale } from "./locale-provider";

export type SheetTool = "analysis" | "session" | "relations" | "history" | "compare";
type ApiFetch = (url: string, init?: RequestInit) => Promise<Response>;

export function SheetToolsPanel({
  tool,
  sheet,
  characters,
  onChange,
  apiFetch,
  notify,
}: {
  tool: SheetTool;
  sheet: CharacterSheet;
  characters: SheetSummary[];
  onChange: (sheet: CharacterSheet) => void;
  apiFetch: ApiFetch;
  notify: (message: string, tone?: "success" | "warning" | "error") => void;
}) {
  if (tool === "analysis") return <AnalysisPanel sheet={sheet} />;
  if (tool === "session") return <SessionPanel sheet={sheet} onChange={onChange} />;
  if (tool === "relations") return <RelationsPanel sheet={sheet} characters={characters} onChange={onChange} />;
  if (tool === "history") return <HistoryPanel sheet={sheet} onChange={onChange} apiFetch={apiFetch} notify={notify} />;
  return <ComparisonPanel sheet={sheet} characters={characters} apiFetch={apiFetch} />;
}

function AnalysisPanel({ sheet }: { sheet: CharacterSheet }) {
  const { language, m } = useLocale();
  const analysis = useMemo(() => getCharacterAnalysis(sheet), [sheet]);
  const maximum = Math.max(1, ...analysis.points.distribution.map((entry) => Math.max(0, entry.value)));
  const labels: Record<string, [string, string]> = {
    abilities: ["Atributos", "Abilities"], combat: ["Combate", "Combat"], resistances: ["Resistências", "Resistances"], skills: ["Perícias", "Skills"], advantages: ["Vantagens", "Advantages"], powers: ["Poderes", "Powers"], adjustments: ["Ajustes", "Adjustments"],
  };
  return <section className="sheet-tool-page analysis-page" aria-labelledby="analysis-title">
    <header><div><p className="eyebrow">{m("common.powerLevelShort")} {analysis.powerLevel}</p><h1 id="analysis-title">{m("analysis.title")}</h1></div><div className="analysis-balance"><strong>{analysis.points.spent}</strong><span>/ {analysis.points.budget} PP</span><small>{m("common.balance")}: {analysis.points.remaining}</small></div></header>
    <section className="analysis-distribution"><h2>{m("analysis.distribution")}</h2><div>{analysis.points.distribution.map((entry) => <p key={entry.id}><span>{labels[entry.id]?.[language === "en" ? 1 : 0] ?? entry.id}</span><i><b style={{ width: `${Math.max(2, Math.max(0, entry.value) / maximum * 100)}%` }} /></i><strong>{entry.value}</strong></p>)}</div></section>
    <div className="analysis-metrics">
      <AnalysisMetric title={m("analysis.offense")} values={[[m("analysis.attacks"), analysis.offense.attacks], [m("analysis.highestBonus"), analysis.offense.highestAttackBonus ?? "—"], [m("analysis.highestEffect"), analysis.offense.highestEffectRank ?? "—"]]} />
      <AnalysisMetric title={m("analysis.defense")} values={[["Dodge", analysis.defense.dodge], [language === "en" ? "Parry" : "Aparar", analysis.defense.parry], ["Toughness", analysis.defense.toughness], ["Fortitude", analysis.defense.fortitude], ["Will", analysis.defense.will]]} />
      <AnalysisMetric title={m("analysis.mobility")} values={[[m("analysis.modes"), analysis.mobility.entries], [m("analysis.highestRank"), analysis.mobility.highestRank ?? "—"]]} />
      <AnalysisMetric title={m("analysis.utility")} values={[[m("analysis.trainedSkills"), analysis.skills.trained], [m("analysis.advantages"), analysis.utility.advantages], [m("analysis.powers"), analysis.utility.powers], [m("analysis.senses"), analysis.utility.senses], [m("analysis.equipment"), analysis.utility.equipment]]} />
    </div>
    <p className="analysis-note"><CircleAlert /> {m("analysis.noRating")}</p>
  </section>;
}

function AnalysisMetric({ title, values }: { title: string; values: Array<[string, string | number]> }) { return <section><h2>{title}</h2>{values.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}</section>; }

function SessionPanel({ sheet, onChange }: { sheet: CharacterSheet; onChange: (sheet: CharacterSheet) => void }) {
  const { m } = useLocale();
  const session = sheet.session;
  function patch(values: Partial<CharacterSheet["session"]>) { onChange({ ...sheet, session: { ...session, ...values } }); }
  function restore() { if (!window.confirm(m("session.resetConfirm"))) return; onChange(resetSession(sheet)); }
  return (
    <section className="sheet-tool-page session-page" aria-labelledby="session-title">
      <header>
        <div>
          <p className="eyebrow">{m("character.session")}</p>
          <h1 id="session-title">{m("session.title")}</h1>
          <p>{m("session.description")}</p>
        </div>
        {session.active ? (
          <button className="button button-secondary" type="button" onClick={restore}><RotateCcw /> {m("session.reset")}</button>
        ) : (
          <button className="button button-primary" type="button" onClick={() => onChange(beginSession(sheet))}><Activity /> {m("session.start")}</button>
        )}
      </header>
      <div className="session-core">
        <label><span>{m("session.damage")}</span><input type="number" min="0" value={session.damage} onChange={(event) => patch({ damage: Math.max(0, Number(event.target.value)) })} /></label>
        <label><span>{m("session.heroPoints")}</span><input type="number" min="0" value={session.heroPointsCurrent} onChange={(event) => patch({ heroPointsCurrent: Math.max(0, Number(event.target.value)) })} /></label>
        <label><span>{m("session.luck")}</span><input type="number" min="0" value={session.luckCurrent} onChange={(event) => patch({ luckCurrent: Math.max(0, Number(event.target.value)) })} /></label>
      </div>
      <section className="session-conditions">
        <h2>{m("session.conditions")}</h2>
        <div>{conditions.map((condition) => <label key={condition}><input type="checkbox" checked={session.conditions.includes(condition)} onChange={(event) => patch({ conditions: event.target.checked ? [...session.conditions, condition] : session.conditions.filter((entry) => entry !== condition) })} /><span>{condition}</span></label>)}</div>
      </section>
      <section className="session-active-powers">
        <h2>{m("session.sustained")}</h2>
        {sheet.powers.length ? <div>{sheet.powers.map((power) => <label key={power.id}><input type="checkbox" checked={session.sustainedPowerIds.includes(power.id)} onChange={(event) => patch({ sustainedPowerIds: event.target.checked ? [...session.sustainedPowerIds, power.id] : session.sustainedPowerIds.filter((entry) => entry !== power.id) })} /><span>{power.name || m("session.unnamedPower")}</span></label>)}</div> : <p>{m("session.noPowers")}</p>}
      </section>
      <section className="session-runtime-grid">
        <SessionPenalties sheet={sheet} onChange={onChange} />
        <SessionResources sheet={sheet} onChange={onChange} />
        <SessionActiveEffects sheet={sheet} onChange={onChange} />
      </section>
      <label className="session-notes"><span>{m("session.notes")}</span><textarea rows={5} value={session.notes} onChange={(event) => patch({ notes: event.target.value })} /></label>
    </section>
  );
}

function SessionPenalties({ sheet, onChange }: { sheet: CharacterSheet; onChange: (sheet: CharacterSheet) => void }) {
  const { language, m } = useLocale();
  const entries = sheet.session.penalties;
  function update(id: string, values: Partial<(typeof entries)[number]>) {
    onChange({ ...sheet, session: { ...sheet.session, penalties: entries.map((entry) => entry.id === id ? { ...entry, ...values } : entry) } });
  }
  return <section><header><h2>{m("session.penalties")}</h2><button type="button" aria-label={`${m("common.add")}: ${m("session.penalties")}`} onClick={() => onChange({ ...sheet, session: { ...sheet.session, penalties: [...entries, { id: newId("penalty"), label: m("session.penalty"), target: "other", value: 0 }] } })}><Plus /></button></header>{entries.map((entry) => <div className="session-runtime-row penalty-row" key={entry.id}><input aria-label={language === "en" ? "Penalty name" : "Nome da penalidade"} value={entry.label} onChange={(event) => update(entry.id, { label: event.target.value })} /><input aria-label={language === "en" ? "Affected value" : "Valor afetado"} value={entry.target} onChange={(event) => update(entry.id, { target: event.target.value })} /><input aria-label={language === "en" ? "Modifier" : "Modificador"} type="number" value={entry.value} onChange={(event) => update(entry.id, { value: Number(event.target.value) })} /><button type="button" aria-label={language === "en" ? "Remove penalty" : "Remover penalidade"} onClick={() => onChange({ ...sheet, session: { ...sheet.session, penalties: entries.filter((candidate) => candidate.id !== entry.id) } })}><Trash2 /></button></div>)}</section>;
}

function SessionResources({ sheet, onChange }: { sheet: CharacterSheet; onChange: (sheet: CharacterSheet) => void }) {
  const { language, m } = useLocale();
  const entries = sheet.session.temporaryResources;
  function update(id: string, values: Partial<(typeof entries)[number]>) {
    onChange({ ...sheet, session: { ...sheet.session, temporaryResources: entries.map((entry) => entry.id === id ? { ...entry, ...values } : entry) } });
  }
  return <section><header><h2>{m("session.resources")}</h2><button type="button" aria-label={`${m("common.add")}: ${m("session.resources")}`} onClick={() => onChange({ ...sheet, session: { ...sheet.session, temporaryResources: [...entries, { id: newId("resource"), name: m("session.resource"), current: 0, maximum: null }] } })}><Plus /></button></header>{entries.map((entry) => <div className="session-runtime-row resource-row" key={entry.id}><input aria-label={language === "en" ? "Resource name" : "Nome do recurso"} value={entry.name} onChange={(event) => update(entry.id, { name: event.target.value })} /><input aria-label={language === "en" ? "Current" : "Atual"} type="number" value={entry.current} onChange={(event) => update(entry.id, { current: Number(event.target.value) })} /><input aria-label={language === "en" ? "Maximum" : "Máximo"} type="number" value={entry.maximum ?? ""} placeholder="∞" onChange={(event) => update(entry.id, { maximum: event.target.value === "" ? null : Number(event.target.value) })} /><button type="button" aria-label={language === "en" ? "Remove resource" : "Remover recurso"} onClick={() => onChange({ ...sheet, session: { ...sheet.session, temporaryResources: entries.filter((candidate) => candidate.id !== entry.id) } })}><Trash2 /></button></div>)}</section>;
}

function SessionActiveEffects({ sheet, onChange }: { sheet: CharacterSheet; onChange: (sheet: CharacterSheet) => void }) {
  const { language, m } = useLocale();
  const entries = sheet.session.activeEffects;
  return <section><header><h2>{m("session.otherEffects")}</h2><button type="button" aria-label={`${m("common.add")}: ${m("session.otherEffects")}`} onClick={() => onChange({ ...sheet, session: { ...sheet.session, activeEffects: [...entries, m("session.activeEffect")] } })}><Plus /></button></header>{entries.map((entry, index) => <div className="session-runtime-row effect-row" key={`${index}:${entry}`}><input aria-label={m("session.activeEffect")} value={entry} onChange={(event) => onChange({ ...sheet, session: { ...sheet.session, activeEffects: entries.map((candidate, candidateIndex) => candidateIndex === index ? event.target.value : candidate) } })} /><button type="button" aria-label={language === "en" ? "Remove effect" : "Remover efeito"} onClick={() => onChange({ ...sheet, session: { ...sheet.session, activeEffects: entries.filter((_, candidateIndex) => candidateIndex !== index) } })}><Trash2 /></button></div>)}</section>;
}

const relationshipKinds: RelationshipKind[] = [
  "ally",
  "enemy",
  "rival",
  "mentor",
  "partner",
  "team-member",
  "subordinate",
  "summoner",
  "summon",
  "alternate-identity",
  "transformation",
  "alternate-form",
  "vehicle",
  "base",
  "construct",
  "other",
];

function RelationsPanel({
  sheet,
  characters,
  onChange,
}: {
  sheet: CharacterSheet;
  characters: SheetSummary[];
  onChange: (sheet: CharacterSheet) => void;
}) {
  const { language, m } = useLocale();
  const [targetId, setTargetId] = useState("");
  const [kind, setKind] = useState<RelationshipKind>("ally");
  const available = characters.filter((entry) => entry.id !== sheet.id);
  function addRelation() {
    const target = available.find((entry) => entry.id === targetId);
    if (!target) return;
    onChange({
      ...sheet,
      relationships: [
        ...sheet.relationships,
        {
          id: newId("relationship"),
          targetSheetId: target.id,
          targetName: target.heroName,
          kind,
          notes: "",
        },
      ],
    });
    setTargetId("");
  }
  return <section className="sheet-tool-page relations-page" aria-labelledby="relations-title">
    <header><div><p className="eyebrow">{m("relations.title")}</p><h1 id="relations-title">{sheet.heroName}</h1><p>{m("relations.empty")}</p></div></header>
    <section className="relation-section"><header><h2>{m("relations.linkedSheets")}</h2><div><select aria-label={m("relations.kind")} value={kind} onChange={(event) => setKind(event.target.value as RelationshipKind)}>{relationshipKinds.map((value) => <option key={value} value={value}>{relationshipKindLabel(value, language)}</option>)}</select><select aria-label={m("relations.chooseSheet")} value={targetId} onChange={(event) => setTargetId(event.target.value)}><option value="">{m("relations.chooseSheet")}</option>{available.map((entry) => <option key={entry.id} value={entry.id}>{entry.heroName} · {m("common.powerLevelShort")} {entry.powerLevel}</option>)}</select><button type="button" aria-label={m("common.add")} disabled={!targetId} onClick={addRelation}><Plus /></button></div></header>{sheet.relationships.length ? <div className="relation-list">{sheet.relationships.map((entry) => { const linked = characters.find((candidate) => candidate.id === entry.targetSheetId); return <div key={entry.id}><span><Link2 /><span><strong>{linked?.heroName || entry.targetName || m("relations.missingSheet")}</strong><small>{relationshipKindLabel(entry.kind, language)}{!linked && entry.targetSheetId ? ` · ${m("relations.brokenReference")}` : ""}</small></span></span><input aria-label={m("relations.notes")} value={entry.notes} onChange={(event) => onChange({ ...sheet, relationships: sheet.relationships.map((candidate) => candidate.id === entry.id ? { ...candidate, notes: event.target.value } : candidate) })} /><button type="button" aria-label={m("common.remove")} onClick={() => onChange({ ...sheet, relationships: sheet.relationships.filter((candidate) => candidate.id !== entry.id) })}><Trash2 /></button></div>; })}</div> : <p className="inline-empty">{m("relations.empty")}</p>}</section>
    <SimpleLinkedCollection title={m("relations.organizations")} items={sheet.organizations.map((entry) => ({ id: entry.id, name: entry.name, detail: entry.role, notes: entry.notes }))} onAdd={() => onChange({ ...sheet, organizations: [...sheet.organizations, { id: newId("organization"), organizationId: "", name: m("campaign.organization"), role: "", notes: "" }] })} onChange={(id, values) => onChange({ ...sheet, organizations: sheet.organizations.map((entry) => entry.id === id ? { ...entry, name: values.name, role: values.detail, notes: values.notes } : entry) })} onRemove={(id) => onChange({ ...sheet, organizations: sheet.organizations.filter((entry) => entry.id !== id) })} />
    <SimpleLinkedCollection title={m("relations.movement")} items={sheet.movement.map((entry) => ({ id: entry.id, name: entry.name, detail: String(entry.rank), notes: entry.notes }))} detailType="number" onAdd={() => onChange({ ...sheet, movement: [...sheet.movement, { id: newId("movement"), typeId: "movement.other", name: m("relations.movement"), rank: 0, sourceEffectId: "", notes: "" }] })} onChange={(id, values) => onChange({ ...sheet, movement: sheet.movement.map((entry) => entry.id === id ? { ...entry, name: values.name, rank: Number(values.detail), notes: values.notes } : entry) })} onRemove={(id) => onChange({ ...sheet, movement: sheet.movement.filter((entry) => entry.id !== id) })} />
    <SimpleLinkedCollection title={m("relations.senses")} items={sheet.senses.map((entry) => ({ id: entry.id, name: entry.name, detail: String(entry.rank), notes: entry.details }))} detailType="number" onAdd={() => onChange({ ...sheet, senses: [...sheet.senses, { id: newId("sense"), senseId: "sense.other", name: m("relations.senses"), rank: 0, sourceEffectId: "", details: "" }] })} onChange={(id, values) => onChange({ ...sheet, senses: sheet.senses.map((entry) => entry.id === id ? { ...entry, name: values.name, rank: Number(values.detail), details: values.notes } : entry) })} onRemove={(id) => onChange({ ...sheet, senses: sheet.senses.filter((entry) => entry.id !== id) })} />
  </section>;
}

function SimpleLinkedCollection({ title, items, detailType = "text", onAdd, onChange, onRemove }: { title: string; items: Array<{ id: string; name: string; detail: string; notes: string }>; detailType?: "text" | "number"; onAdd: () => void; onChange: (id: string, values: { name: string; detail: string; notes: string }) => void; onRemove: (id: string) => void }) { const { m } = useLocale(); return <section className="linked-collection"><header><h2>{title}</h2><button type="button" onClick={onAdd}><Plus /> {m("common.add")}</button></header>{items.map((entry) => <div key={entry.id}><input aria-label={`${title}: ${m("common.name")}`} value={entry.name} onChange={(event) => onChange(entry.id, { ...entry, name: event.target.value })} /><input aria-label={`${title}: ${m("common.details")}`} type={detailType} value={entry.detail} onChange={(event) => onChange(entry.id, { ...entry, detail: event.target.value })} /><input aria-label={`${title}: ${m("common.notes")}`} value={entry.notes} onChange={(event) => onChange(entry.id, { ...entry, notes: event.target.value })} /><button type="button" aria-label={m("common.remove")} onClick={() => onRemove(entry.id)}><Trash2 /></button></div>)}</section>; }

type RevisionSummary = Omit<CharacterRevision, "sheet">;

function HistoryPanel({ sheet, onChange, apiFetch, notify }: { sheet: CharacterSheet; onChange: (sheet: CharacterSheet) => void; apiFetch: ApiFetch; notify: (message: string, tone?: "success" | "warning" | "error") => void }) {
  const { language, m } = useLocale();
  const [revisions, setRevisions] = useState<RevisionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; void apiFetch(`/api/characters/${encodeURIComponent(sheet.id)}/history`).then((response) => response.json() as Promise<{ revisions: RevisionSummary[] }>).then((payload) => active && setRevisions(payload.revisions)).catch(() => notify(m("history.loadError"), "error")).finally(() => active && setLoading(false)); return () => { active = false; }; }, [apiFetch, m, notify, sheet.id]);
  async function restore(id: string) { if (!window.confirm(m("history.restoreConfirm"))) return; try { const response = await apiFetch(`/api/characters/${encodeURIComponent(sheet.id)}/history/${encodeURIComponent(id)}`); const payload = (await response.json()) as { revision: CharacterRevision }; onChange(restoreCharacterRevision(sheet, payload.revision)); notify(m("history.restored")); } catch { notify(m("history.restoreError"), "error"); } }
  return <section className="sheet-tool-page history-page"><header><div><p className="eyebrow">{m("history.title")}</p><h1>{sheet.heroName}</h1><p>{m("history.description")}</p></div></header>{loading ? <div className="workspace-loading"><LoaderCircle className="spin" /></div> : revisions.length ? <ol>{revisions.map((revision) => <li key={revision.id}><span><History /><span><strong>{revision.label}</strong><small>{new Intl.DateTimeFormat(language === "en" ? "en" : "pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(revision.createdAt))}</small></span></span><button type="button" onClick={() => void restore(revision.id)}>{m("history.restore")}</button></li>)}</ol> : <p className="inline-empty">{m("history.empty")}</p>}</section>;
}

function ComparisonPanel({ sheet, characters, apiFetch }: { sheet: CharacterSheet; characters: SheetSummary[]; apiFetch: ApiFetch }) {
  const { m } = useLocale();
  const [comparison, setComparison] = useState<CharacterSheet | null>(null);
  const [loading, setLoading] = useState(false);
  async function select(id: string) { if (!id) { setComparison(null); return; } setLoading(true); try { const response = await apiFetch(`/api/characters/${encodeURIComponent(id)}`); const payload = (await response.json()) as { character: CharacterSheet }; setComparison(normalizeSheet(payload.character)); } finally { setLoading(false); } }
  return <section className="sheet-tool-page comparison-page"><header><div><p className="eyebrow">{m("character.compare")}</p><h1>{sheet.heroName}</h1><p>{m("compare.description")}</p></div><select defaultValue="" onChange={(event) => void select(event.target.value)}><option value="">{m("compare.choose")}</option>{characters.filter((entry) => entry.id !== sheet.id).map((entry) => <option key={entry.id} value={entry.id}>{entry.heroName}</option>)}</select></header>{loading ? <div className="workspace-loading"><LoaderCircle className="spin" /></div> : comparison ? <ComparisonTable left={sheet} right={comparison} /> : <p className="inline-empty"><ArrowDownUp /> {m("compare.empty")}</p>}</section>;
}

function ComparisonTable({ left, right }: { left: CharacterSheet; right: CharacterSheet }) { const { language, m } = useLocale(); const a = getCharacterAnalysis(left); const b = getCharacterAnalysis(right); const rows: Array<[string, string | number, string | number]> = [["NP / PL", a.powerLevel, b.powerLevel], ["PP", `${a.points.spent}/${a.points.budget}`, `${b.points.spent}/${b.points.budget}`], [m("analysis.attacks"), a.offense.attacks, b.offense.attacks], ["Dodge", a.defense.dodge, b.defense.dodge], [language === "en" ? "Parry" : "Aparar", a.defense.parry, b.defense.parry], ["Toughness", a.defense.toughness, b.defense.toughness], ["Fortitude", a.defense.fortitude, b.defense.fortitude], ["Will", a.defense.will, b.defense.will], [m("analysis.trainedSkills"), a.skills.trained, b.skills.trained], [m("analysis.powers"), a.utility.powers, b.utility.powers]]; return <div className="comparison-table"><header><span>{m("compare.measure")}</span><strong>{left.heroName}</strong><strong>{right.heroName}</strong></header>{rows.map(([label, leftValue, rightValue]) => <p key={label}><span>{label}</span><strong>{leftValue}</strong><strong>{rightValue}</strong></p>)}</div>; }
