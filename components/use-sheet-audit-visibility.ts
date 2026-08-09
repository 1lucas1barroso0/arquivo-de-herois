"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readBrowserStorage,
  writeBrowserStorage,
} from "../lib/browser-storage";

export const SHEET_AUDIT_VISIBILITY_KEY =
  "arquivo-herois-sheet-audit:v1";

export function useSheetAuditVisibility() {
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowAudit(
        readBrowserStorage(SHEET_AUDIT_VISIBILITY_KEY) === "visible",
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const changeAuditVisibility = useCallback((visible: boolean) => {
    setShowAudit(visible);
    writeBrowserStorage(
      SHEET_AUDIT_VISIBILITY_KEY,
      visible ? "visible" : "hidden",
    );
  }, []);

  return [showAudit, changeAuditVisibility] as const;
}
