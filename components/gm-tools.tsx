"use client";

import { BookOpen, Plus, Shield, Users } from "lucide-react";
import { useState } from "react";
import { conditions, newId, type CharacterSheet, type SheetSummary } from "../lib/character";
import type { EncounterDefinition } from "../lib/encounter";
import { createNpcFromTemplate, npcTemplates } from "../lib/npc-templates";
import { EncounterEditor } from "./campaigns-workspace";
import { useLocale } from "./locale-provider";

export function GmTools({
  characters,
  onCreateNpc,
  onOpenReferences,
}: {
  characters: SheetSummary[];
  onCreateNpc: (sheet: CharacterSheet) => void;
  onOpenReferences: (query?: string) => void;
}) {
  const { language, m } = useLocale();
  const [powerLevel, setPowerLevel] = useState(10);
  const [encounter, setEncounter] = useState<EncounterDefinition>({
    id: newId("encounter"),
    name: m("gm.quickEncounter"),
    participants: [],
    referencePowerLevel: null,
    pressure: "standard",
    notes: "",
  });

  return (
    <div className="gm-page">
      <header className="gm-hero">
        <div><p className="eyebrow">{m("nav.gmTools")}</p><h1>{m("gm.title")}</h1><p>{m("gm.description")}</p></div>
      </header>

      <section className="gm-section">
        <header><div><Shield /><div><p className="eyebrow">NPC</p><h2>{m("gm.quickCreation")}</h2></div></div><label><span>{m("common.powerLevelShort")}</span><input type="number" min="0" value={powerLevel} onChange={(event) => setPowerLevel(Number(event.target.value))} /></label></header>
        <div className="npc-template-grid">
          {npcTemplates.map((template) => (
            <button key={template.id} type="button" onClick={() => onCreateNpc(createNpcFromTemplate(template.id, powerLevel))}>
              <Plus aria-hidden="true" /><span><strong>{language === "en" ? template.labelEn : template.labelPt}</strong><small>{language === "en" ? template.descriptionEn : template.descriptionPt}</small></span>
            </button>
          ))}
        </div>
      </section>

      <section className="gm-section gm-encounter-section">
        <header><div><Users /><div><p className="eyebrow">{m("encounter.estimate")}</p><h2>{m("encounter.title")}</h2></div></div></header>
        <EncounterEditor encounter={encounter} characters={characters} onChange={setEncounter} />
      </section>

      <section className="gm-section gm-condition-reference">
        <header><div><BookOpen /><div><p className="eyebrow">{m("nav.references")}</p><h2>{m("gm.conditions")}</h2></div></div><button type="button" onClick={() => onOpenReferences(language === "en" ? "conditions" : "condições")}>{m("gm.openReferences")}</button></header>
        <div>{conditions.slice(0, 16).map((condition) => <button type="button" key={condition} onClick={() => onOpenReferences(condition)}>{condition}</button>)}</div>
      </section>
    </div>
  );
}
