"use client";

import { BookOpen, CheckCircle2, FileDown, Pencil, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { readBrowserStorage, writeBrowserStorage } from "../lib/browser-storage";
import { useDialogFocus } from "./use-dialog-focus";
import { useLocale } from "./locale-provider";

const ONBOARDING_KEY = "arquivo-de-herois:onboarding:v1";

export function Onboarding({ onCreate }: { onCreate: () => void }) {
  const { language, m } = useLocale();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (readBrowserStorage(ONBOARDING_KEY)) return;
    const timer = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(timer);
  }, []);

  function close() {
    writeBrowserStorage(ONBOARDING_KEY, "done");
    setOpen(false);
  }

  useDialogFocus(open, dialogRef, close);
  if (!open) return null;

  const steps = language === "en"
    ? [
        ["Create", "Choose New sheet or a quick NPC template."],
        ["Edit", "Quick, Guided, and Free modes always use the same data."],
        ["Check", "Green confirms; yellow calls for attention; red identifies an error; blue informs."],
        ["Look up", "Search rules and creation options without leaving the app."],
        ["Protect", "Autosave, history, exports, and full backups protect your work."],
      ]
    : [
        ["Crie", "Use Nova ficha ou um modelo rápido de NPC."],
        ["Edite", "Os modos Rápido, Guiado e Livre usam sempre os mesmos dados."],
        ["Confira", "Verde confirma; amarelo chama atenção; vermelho aponta erro; azul informa."],
        ["Consulte", "Busque regras e opções de criação sem sair do aplicativo."],
        ["Proteja", "Autosave, histórico, exportações e backup completo protegem seu trabalho."],
      ];
  const icons = [Plus, Pencil, CheckCircle2, BookOpen, FileDown];

  return (
    <div className="modal-backdrop onboarding-backdrop" role="presentation" onMouseDown={close}>
      <section className="onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="onboarding-title" ref={dialogRef} onMouseDown={(event) => event.stopPropagation()} tabIndex={-1}>
        <header><div><p className="eyebrow">Arquivo de Heróis</p><h2 id="onboarding-title">{m("onboarding.title")}</h2></div><button type="button" onClick={close} aria-label={m("onboarding.skip")}><X /></button></header>
        <ol>{steps.map(([title, detail], index) => { const Icon = icons[index]; return <li key={title}><span><Icon /></span><div><strong>{title}</strong><p>{detail}</p></div></li>; })}</ol>
        <footer><button className="button button-secondary" type="button" onClick={close}>{m("onboarding.skip")}</button><button className="button button-primary" type="button" onClick={() => { close(); onCreate(); }}><Plus /> {m("onboarding.createSheet")}</button></footer>
      </section>
    </div>
  );
}
