"use client";

import { BookOpen, FolderKanban, Search, Shield, X } from "lucide-react";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import type { CharacterSheet } from "../lib/character";
import { searchEverything } from "../lib/search";
import type { Campaign } from "../lib/workspace";
import { useDialogFocus } from "./use-dialog-focus";
import { useLocale } from "./locale-provider";

export function UniversalSearch({
  characters,
  campaigns,
  onClose,
  onSheet,
  onCampaign,
  onReference,
}: {
  characters: CharacterSheet[];
  campaigns: Campaign[];
  onClose: () => void;
  onSheet: (id: string) => void;
  onCampaign: (id: string) => void;
  onReference: (query: string) => void;
}) {
  const { language, m } = useLocale();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const dialogRef = useRef<HTMLElement>(null);
  useDialogFocus(true, dialogRef, onClose, "input");
  const results = useMemo(
    () => searchEverything(deferredQuery, characters, campaigns, language),
    [campaigns, characters, deferredQuery, language],
  );

  function choose(result: (typeof results)[number]) {
    if (result.sheetId) onSheet(result.sheetId);
    else if (result.campaignId) onCampaign(result.campaignId);
    else onReference(result.title);
    onClose();
  }

  return (
    <div className="modal-backdrop search-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="universal-search" role="dialog" aria-modal="true" aria-labelledby="universal-search-title" ref={dialogRef} onMouseDown={(event) => event.stopPropagation()} tabIndex={-1}>
        <header>
          <Search aria-hidden="true" />
          <label className="sr-only" htmlFor="universal-search-input" id="universal-search-title">{m("search.label")}</label>
          <input id="universal-search-input" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={m("search.placeholder")} />
          <button type="button" onClick={onClose} aria-label={m("search.close")}><X /></button>
        </header>
        <div className="universal-results" aria-live="polite">
          {!query.trim() ? (
            <p className="universal-search-hint">{m("search.hint")}</p>
          ) : results.length ? results.map((result) => (
            <button key={result.id} type="button" onClick={() => choose(result)}>
              <span className="universal-result-icon">
                {result.kind === "character" ? <Shield /> : result.kind === "campaign" ? <FolderKanban /> : <BookOpen />}
              </span>
              <span><strong>{result.title}</strong><small>{result.subtitle}</small></span>
              <em>{result.kind === "character" ? m("search.kind.character") : result.kind === "campaign" ? m("search.kind.campaign") : m("search.kind.reference")}</em>
            </button>
          )) : <p className="universal-search-hint">{m("search.noResults")}</p>}
        </div>
      </section>
    </div>
  );
}
