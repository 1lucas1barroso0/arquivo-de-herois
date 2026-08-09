"use client";

import { Download } from "lucide-react";
import type { CharacterSheet } from "../lib/character";
import { SharedSheetActions } from "./shared-sheet-actions";
import { SheetView } from "./sheet-view";
import { SheetViewModeToggle } from "./sheet-view-mode-toggle";
import { useSheetAuditVisibility } from "./use-sheet-audit-visibility";
import { useLocale } from "./locale-provider";

export function SharedSheetViewer({ sheet }: { sheet: CharacterSheet }) {
  const { t } = useLocale();
  const [showAudit, setShowAudit] = useSheetAuditVisibility();

  return (
    <>
      <div className="shared-banner">
        <Download aria-hidden="true" />
        <div>
          <strong>{t("Ficha compartilhada · link permanente")}</strong>
          <span>
            {t("Consulte, imprima, exporte ou salve uma cópia editável no seu arquivo.")}
          </span>
        </div>
        <div className="shared-banner-controls">
          <SheetViewModeToggle
            showAudit={showAudit}
            onChange={setShowAudit}
          />
          <SharedSheetActions sheet={sheet} />
        </div>
      </div>
      <div className="shared-document">
        <SheetView sheet={sheet} shared showAudit={showAudit} />
      </div>
    </>
  );
}
