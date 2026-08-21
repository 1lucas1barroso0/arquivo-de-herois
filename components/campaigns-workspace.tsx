"use client";

import {
  Archive,
  CircleAlert,
  FolderKanban,
  LoaderCircle,
  MapPin,
  Plus,
  Save,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { newId, type SheetSummary } from "../lib/character";
import {
  analyzeEncounter,
  encounterPressures,
  type EncounterDefinition,
  type EncounterParticipant,
} from "../lib/encounter";
import {
  createEmptyCampaign,
  normalizeCampaign,
  type Campaign,
  type CampaignMemberRole,
  type CampaignSummary,
} from "../lib/workspace";
import { useLocale } from "./locale-provider";

type ApiFetch = (url: string, init?: RequestInit) => Promise<Response>;
type CampaignTab = "overview" | "people" | "world" | "encounters";

export function CampaignsWorkspace({
  summaries,
  characters,
  initialCampaignId,
  apiFetch,
  onRefresh,
  onOpenSheet,
  notify,
}: {
  summaries: CampaignSummary[];
  characters: SheetSummary[];
  initialCampaignId?: string | null;
  apiFetch: ApiFetch;
  onRefresh: () => Promise<CampaignSummary[]>;
  onOpenSheet: (id: string) => void;
  notify: (message: string, tone?: "success" | "warning" | "error") => void;
}) {
  const { m } = useLocale();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [tab, setTab] = useState<CampaignTab>("overview");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const target = initialCampaignId || summaries.find((entry) => !entry.archived)?.id;
    if (!target || campaign?.id === target) return;
    let active = true;
    // This effect synchronizes the selected campaign with durable storage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBusy(true);
    void apiFetch(`/api/campaigns/${encodeURIComponent(target)}`)
      .then((response) => response.json() as Promise<{ campaign: Campaign }>)
      .then((payload) => {
        if (active) {
          setCampaign(normalizeCampaign(payload.campaign));
          setDirty(false);
        }
      })
      .catch(() => notify(m("campaign.openError"), "error"))
      .finally(() => active && setBusy(false));
    return () => { active = false; };
  }, [apiFetch, campaign?.id, initialCampaignId, m, notify, summaries]);

  async function selectCampaign(id: string) {
    if (dirty && !window.confirm(m("campaign.discardConfirm"))) return;
    setBusy(true);
    try {
      const response = await apiFetch(`/api/campaigns/${encodeURIComponent(id)}`);
      const payload = (await response.json()) as { campaign: Campaign };
      setCampaign(normalizeCampaign(payload.campaign));
      setDirty(false);
    } catch {
      notify(m("campaign.openError"), "error");
    } finally {
      setBusy(false);
    }
  }

  async function createCampaign() {
    setBusy(true);
    try {
      const response = await apiFetch("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({ campaign: { ...createEmptyCampaign(), name: m("campaign.new") } }),
      });
      const payload = (await response.json()) as { campaign: Campaign };
      setCampaign(normalizeCampaign(payload.campaign));
      setDirty(false);
      await onRefresh();
      notify(m("campaign.created"));
    } catch {
      notify(m("campaign.createError"), "error");
    } finally {
      setBusy(false);
    }
  }

  async function saveCampaign() {
    if (!campaign?.id) return;
    setBusy(true);
    try {
      const response = await apiFetch(`/api/campaigns/${encodeURIComponent(campaign.id)}`, {
        method: "PUT",
        body: JSON.stringify({ campaign }),
      });
      const payload = (await response.json()) as { campaign: Campaign };
      setCampaign(normalizeCampaign(payload.campaign));
      setDirty(false);
      await onRefresh();
      notify(m("campaign.saved"));
    } catch {
      notify(m("campaign.saveError"), "error");
    } finally {
      setBusy(false);
    }
  }

  function change(next: Campaign) {
    setCampaign(next);
    setDirty(true);
  }

  return (
    <div className="campaigns-page">
      <aside className="campaign-list" aria-label={m("campaign.title")}>
        <header><div><FolderKanban /><strong>{m("campaign.title")}</strong></div><button type="button" onClick={() => void createCampaign()} aria-label={m("campaign.new")}><Plus /></button></header>
        {summaries.length ? summaries.map((entry) => (
          <button className={campaign?.id === entry.id ? "is-active" : ""} key={entry.id} type="button" onClick={() => void selectCampaign(entry.id)}>
            <span><strong>{entry.name}</strong><small>{entry.memberCount} · {entry.encounterCount}</small></span>
            {entry.archived ? <Archive /> : null}
          </button>
        )) : <p>{m("campaign.empty")}</p>}
      </aside>

      <main className="campaign-editor">
        {busy && !campaign ? <div className="workspace-loading"><LoaderCircle className="spin" /> {m("common.loading")}</div> : campaign ? (
          <>
            <header className="campaign-editor-head">
              <div><p className="eyebrow">{m("campaign.title")}</p><h1>{campaign.name}</h1></div>
              <div><span className={dirty ? "is-dirty" : ""}>{m(dirty ? "common.unsaved" : "common.saved")}</span><button className="button button-primary compact" disabled={busy || !dirty} type="button" onClick={() => void saveCampaign()}>{busy ? <LoaderCircle className="spin" /> : <Save />} {m("common.save")}</button></div>
            </header>
            <nav className="campaign-tabs" aria-label={m("campaign.sections")}>
              <button className={tab === "overview" ? "is-active" : ""} type="button" onClick={() => setTab("overview")}>{m("campaign.overview")}</button>
              <button className={tab === "people" ? "is-active" : ""} type="button" onClick={() => setTab("people")}>{m("campaign.members")}</button>
              <button className={tab === "world" ? "is-active" : ""} type="button" onClick={() => setTab("world")}>{m("campaign.context")}</button>
              <button className={tab === "encounters" ? "is-active" : ""} type="button" onClick={() => setTab("encounters")}>{m("campaign.encounters")}</button>
            </nav>
            {tab === "overview" ? <CampaignOverview campaign={campaign} onChange={change} /> : null}
            {tab === "people" ? <CampaignPeople campaign={campaign} characters={characters} onChange={change} onOpenSheet={onOpenSheet} /> : null}
            {tab === "world" ? <CampaignWorld campaign={campaign} onChange={change} /> : null}
            {tab === "encounters" ? <CampaignEncounters campaign={campaign} characters={characters} onChange={change} /> : null}
          </>
        ) : (
          <div className="campaign-empty-state"><FolderKanban /><h1>{m("campaign.title")}</h1><p>{m("campaign.empty")}</p><button className="button button-primary" type="button" onClick={() => void createCampaign()}><Plus /> {m("campaign.new")}</button></div>
        )}
      </main>
    </div>
  );
}

function CampaignOverview({ campaign, onChange }: CampaignSectionProps) {
  const { m } = useLocale();
  return (
    <section className="campaign-form campaign-overview">
      <label><span>{m("common.name")}</span><input value={campaign.name} onChange={(event) => onChange({ ...campaign, name: event.target.value })} /></label>
      <label><span>{m("campaign.gameMaster")}</span><input value={campaign.gameMaster} onChange={(event) => onChange({ ...campaign, gameMaster: event.target.value })} /></label>
      <label className="is-wide"><span>{m("common.description")}</span><textarea rows={4} value={campaign.description} onChange={(event) => onChange({ ...campaign, description: event.target.value })} /></label>
      <label className="is-wide"><span>{m("campaign.notes")}</span><textarea rows={8} value={campaign.notes} onChange={(event) => onChange({ ...campaign, notes: event.target.value })} /></label>
      <label className="campaign-checkbox"><input type="checkbox" checked={campaign.archived} onChange={(event) => onChange({ ...campaign, archived: event.target.checked })} /><span>{m("campaign.archived")}</span></label>
    </section>
  );
}

function CampaignPeople({ campaign, characters, onChange, onOpenSheet }: CampaignSectionProps & { characters: SheetSummary[]; onOpenSheet: (id: string) => void }) {
  const { m } = useLocale();
  const available = characters.filter((sheet) => !campaign.members.some((member) => member.sheetId === sheet.id));
  function add(sheetId: string) {
    const sheet = characters.find((entry) => entry.id === sheetId);
    if (!sheet) return;
    onChange({ ...campaign, members: [...campaign.members, { id: newId("member"), sheetId, name: sheet.heroName, role: sheet.buildType === "npc" ? "npc" : "player-character" }] });
  }
  function role(id: string, value: CampaignMemberRole) {
    onChange({ ...campaign, members: campaign.members.map((member) => member.id === id ? { ...member, role: value } : member) });
  }
  return (
    <section className="campaign-section-stack">
      <div className="campaign-add-row"><select aria-label={m("campaign.addSheet")} defaultValue="" onChange={(event) => { add(event.target.value); event.target.value = ""; }}><option value="" disabled>{m("campaign.addSheet")}</option>{available.map((sheet) => <option key={sheet.id} value={sheet.id}>{sheet.heroName} · {m("common.powerLevelShort")} {sheet.powerLevel}</option>)}</select></div>
      {campaign.members.length ? <div className="campaign-member-list">{campaign.members.map((member) => (
        <div key={member.id}><button type="button" onClick={() => onOpenSheet(member.sheetId)}><Shield /><span><strong>{member.name}</strong><small>{characters.find((sheet) => sheet.id === member.sheetId)?.powerLevel ? `${m("common.powerLevelShort")} ${characters.find((sheet) => sheet.id === member.sheetId)?.powerLevel}` : m("campaign.brokenLink")}</small></span></button><select value={member.role} onChange={(event) => role(member.id, event.target.value as CampaignMemberRole)}><option value="player-character">{m("campaign.playerCharacter")}</option><option value="npc">NPC</option><option value="villain">{m("campaign.villain")}</option><option value="ally">{m("campaign.ally")}</option></select><button type="button" aria-label={m("campaign.removeMember")} onClick={() => onChange({ ...campaign, members: campaign.members.filter((entry) => entry.id !== member.id) })}><Trash2 /></button></div>
      ))}</div> : <EmptyLine icon={<Users />} text={m("campaign.membersEmpty")} />}

      <CollectionEditor title={m("campaign.teams")} icon={<Users />} items={campaign.teams} onAdd={() => onChange({ ...campaign, teams: [...campaign.teams, { id: newId("team"), name: m("campaign.team"), memberIds: [], notes: "" }] })} onName={(id, name) => onChange({ ...campaign, teams: campaign.teams.map((entry) => entry.id === id ? { ...entry, name } : entry) })} onDetails={(id, notes) => onChange({ ...campaign, teams: campaign.teams.map((entry) => entry.id === id ? { ...entry, notes } : entry) })} onRemove={(id) => onChange({ ...campaign, teams: campaign.teams.filter((entry) => entry.id !== id) })} />
    </section>
  );
}

function CampaignWorld({ campaign, onChange }: CampaignSectionProps) {
  const { m } = useLocale();
  return <section className="campaign-section-stack">
    <CollectionEditor title={m("campaign.organizations")} icon={<Users />} items={campaign.organizations.map((entry) => ({ ...entry, notes: entry.description }))} onAdd={() => onChange({ ...campaign, organizations: [...campaign.organizations, { id: newId("organization"), name: m("campaign.organization"), description: "", memberIds: [] }] })} onName={(id, name) => onChange({ ...campaign, organizations: campaign.organizations.map((entry) => entry.id === id ? { ...entry, name } : entry) })} onDetails={(id, description) => onChange({ ...campaign, organizations: campaign.organizations.map((entry) => entry.id === id ? { ...entry, description } : entry) })} onRemove={(id) => onChange({ ...campaign, organizations: campaign.organizations.filter((entry) => entry.id !== id) })} />
    <CollectionEditor title={m("campaign.locations")} icon={<MapPin />} items={campaign.locations.map((entry) => ({ ...entry, notes: entry.description }))} onAdd={() => onChange({ ...campaign, locations: [...campaign.locations, { id: newId("location"), name: m("campaign.location"), description: "" }] })} onName={(id, name) => onChange({ ...campaign, locations: campaign.locations.map((entry) => entry.id === id ? { ...entry, name } : entry) })} onDetails={(id, description) => onChange({ ...campaign, locations: campaign.locations.map((entry) => entry.id === id ? { ...entry, description } : entry) })} onRemove={(id) => onChange({ ...campaign, locations: campaign.locations.filter((entry) => entry.id !== id) })} />
    <CollectionEditor title={m("campaign.resources")} icon={<Archive />} items={campaign.resources.map((entry) => ({ ...entry, notes: entry.details }))} onAdd={() => onChange({ ...campaign, resources: [...campaign.resources, { id: newId("campaign-resource"), name: m("campaign.resource"), details: "" }] })} onName={(id, name) => onChange({ ...campaign, resources: campaign.resources.map((entry) => entry.id === id ? { ...entry, name } : entry) })} onDetails={(id, details) => onChange({ ...campaign, resources: campaign.resources.map((entry) => entry.id === id ? { ...entry, details } : entry) })} onRemove={(id) => onChange({ ...campaign, resources: campaign.resources.filter((entry) => entry.id !== id) })} />
  </section>;
}

function CampaignEncounters({ campaign, characters, onChange }: CampaignSectionProps & { characters: SheetSummary[] }) {
  const { m } = useLocale();
  const [activeId, setActiveId] = useState(campaign.encounters[0]?.id ?? "");
  const active = campaign.encounters.find((entry) => entry.id === activeId) ?? campaign.encounters[0];
  function addEncounter() {
    const encounter: EncounterDefinition = { id: newId("encounter"), name: m("campaign.newEncounter"), participants: [], referencePowerLevel: null, pressure: "standard", notes: "" };
    setActiveId(encounter.id);
    onChange({ ...campaign, encounters: [...campaign.encounters, encounter] });
  }
  function update(encounter: EncounterDefinition) { onChange({ ...campaign, encounters: campaign.encounters.map((entry) => entry.id === encounter.id ? encounter : entry) }); }
  return <section className="encounter-workspace">
    <aside><header><strong>{m("campaign.encounters")}</strong><button type="button" aria-label={m("campaign.newEncounter")} onClick={addEncounter}><Plus /></button></header>{campaign.encounters.map((entry) => <button className={entry.id === active?.id ? "is-active" : ""} key={entry.id} type="button" onClick={() => setActiveId(entry.id)}>{entry.name}</button>)}</aside>
    {active ? <EncounterEditor encounter={active} characters={characters} onChange={update} onDelete={() => { onChange({ ...campaign, encounters: campaign.encounters.filter((entry) => entry.id !== active.id) }); setActiveId(""); }} /> : <EmptyLine icon={<CircleAlert />} text={m("campaign.encounterEmpty")} />}
  </section>;
}

export function EncounterEditor({ encounter, characters, onChange, onDelete }: { encounter: EncounterDefinition; characters: SheetSummary[]; onChange: (encounter: EncounterDefinition) => void; onDelete?: () => void }) {
  const { language, m } = useLocale();
  const analysis = useMemo(() => analyzeEncounter(encounter), [encounter]);
  function add(side: EncounterParticipant["side"], sheetId: string) { const sheet = characters.find((entry) => entry.id === sheetId); if (!sheet) return; onChange({ ...encounter, participants: [...encounter.participants, { id: newId("participant"), sheetId, name: sheet.heroName, powerLevel: sheet.powerLevel, quantity: 1, side, role: sheet.buildType }] }); }
  function updateParticipant(id: string, values: Partial<EncounterParticipant>) { onChange({ ...encounter, participants: encounter.participants.map((entry) => entry.id === id ? { ...entry, ...values } : entry) }); }
  return <div className="encounter-editor">
    <header><label><span className="sr-only">{m("campaign.encounterName")}</span><input value={encounter.name} onChange={(event) => onChange({ ...encounter, name: event.target.value })} /></label>{onDelete ? <button type="button" onClick={onDelete} aria-label={m("campaign.deleteEncounter")}><Trash2 /></button> : null}</header>
    <div className="encounter-settings"><label><span>{m("encounter.referencePl")}</span><input type="number" placeholder={String(analysis.referencePowerLevel)} value={encounter.referencePowerLevel ?? ""} onChange={(event) => onChange({ ...encounter, referencePowerLevel: event.target.value === "" ? null : Number(event.target.value) })} /></label><label><span>{m("encounter.pressure")}</span><select value={encounter.pressure} onChange={(event) => onChange({ ...encounter, pressure: event.target.value as EncounterDefinition["pressure"] })}>{encounterPressures.map((entry) => <option key={entry.id} value={entry.id}>{language === "en" ? entry.labelEn : entry.labelPt} · {entry.targetRatio * 100}%</option>)}</select></label></div>
    <div className="encounter-sides">{(["ally", "threat"] as const).map((side) => <section key={side}><header><strong>{side === "ally" ? m("encounter.party") : m("encounter.opposition")}</strong><select aria-label={side === "ally" ? m("encounter.addAlly") : m("encounter.addThreat")} defaultValue="" onChange={(event) => { add(side, event.target.value); event.target.value = ""; }}><option value="" disabled>{side === "ally" ? m("encounter.addAlly") : m("encounter.addThreat")}</option>{characters.map((sheet) => <option key={sheet.id} value={sheet.id}>{sheet.heroName} · {m("common.powerLevelShort")} {sheet.powerLevel}</option>)}</select></header>{encounter.participants.filter((entry) => entry.side === side).map((entry) => <div className="encounter-participant" key={entry.id}><span><strong>{entry.name}</strong><small>{m("common.powerLevelShort")} {entry.powerLevel}</small></span><label><span className="sr-only">{m("encounter.quantity")}</span><input type="number" min="1" value={entry.quantity} onChange={(event) => updateParticipant(entry.id, { quantity: Number(event.target.value) })} /></label><button type="button" onClick={() => onChange({ ...encounter, participants: encounter.participants.filter((candidate) => candidate.id !== entry.id) })} aria-label={m("common.remove")}><Trash2 /></button></div>)}</section>)}</div>
    <section className="encounter-analysis" aria-label={m("encounter.estimate")}><header><div><p className="eyebrow">{m("encounter.estimate")}</p><h3>{analysis.estimatedPressure ? (language === "en" ? analysis.estimatedPressure.labelEn : analysis.estimatedPressure.labelPt) : "—"}</h3></div><span>{m("common.powerLevelShort")} {analysis.referencePowerLevel}</span></header><div><p><span>{m("encounter.capacity")}</span><strong>{analysis.groupCapacity} CE</strong></p><p><span>{m("encounter.threat")}</span><strong>{analysis.effectiveThreatCe} CE</strong></p><p><span>{m("encounter.difficulty")}</span><strong>{analysis.ratio === null ? "—" : `${Math.round(analysis.ratio * 100)}%`}</strong></p></div><small>{m("encounter.optionalNotice")}</small>{analysis.issues.map((issue) => <p className="encounter-issue" key={`${issue.participantId}:${issue.message}`}><CircleAlert /> {m("encounter.outsideRange")}</p>)}</section>
    <label className="encounter-notes"><span>{m("campaign.encounterNotes")}</span><textarea rows={4} value={encounter.notes} onChange={(event) => onChange({ ...encounter, notes: event.target.value })} /></label>
  </div>;
}

type CampaignSectionProps = { campaign: Campaign; onChange: (campaign: Campaign) => void };

function CollectionEditor({ title, icon, items, onAdd, onName, onDetails, onRemove }: { title: string; icon: React.ReactNode; items: Array<{ id: string; name: string; notes: string }>; onAdd: () => void; onName: (id: string, value: string) => void; onDetails: (id: string, value: string) => void; onRemove: (id: string) => void }) {
  const { m } = useLocale();
  return <section className="campaign-collection"><header><div>{icon}<h2>{title}</h2></div><button type="button" onClick={onAdd}><Plus /> {m("common.add")}</button></header>{items.length ? items.map((entry) => <div key={entry.id}><input aria-label={`${m("common.name")}: ${title}`} value={entry.name} onChange={(event) => onName(entry.id, event.target.value)} /><textarea aria-label={`${m("common.details")}: ${entry.name}`} rows={2} value={entry.notes} onChange={(event) => onDetails(entry.id, event.target.value)} /><button type="button" onClick={() => onRemove(entry.id)} aria-label={m("common.remove")}><Trash2 /></button></div>) : <p>{m("campaign.nothing")}</p>}</section>;
}

function EmptyLine({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="campaign-inline-empty">{icon}<p>{text}</p></div>; }
