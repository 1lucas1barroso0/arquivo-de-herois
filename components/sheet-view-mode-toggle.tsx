"use client";

import { BadgeCheck, FileText } from "lucide-react";
import { useLocale } from "./locale-provider";

export function SheetViewModeToggle({
  showAudit,
  onChange,
}: {
  showAudit: boolean;
  onChange: (visible: boolean) => void;
}) {
  const { t } = useLocale();
  return (
    <div
      className="sheet-view-mode-toggle"
      role="group"
      aria-label={t("Conteúdo da visualização")}
    >
      <button
        className={!showAudit ? "is-active" : ""}
        type="button"
        aria-pressed={!showAudit}
        title={t("Oculta os indicadores de validação e mantém todos os dados da ficha")}
        onClick={() => onChange(false)}
      >
        <FileText aria-hidden="true" />
        {t("Ficha limpa")}
      </button>
      <button
        className={showAudit ? "is-active" : ""}
        type="button"
        aria-pressed={showAudit}
        title={t("Exibe o diagnóstico, os limites e as verificações das regras")}
        onClick={() => onChange(true)}
      >
        <BadgeCheck aria-hidden="true" />
        {t("Com auditoria")}
      </button>
    </div>
  );
}
