"use client";

import { useCallback, useEffect, useState } from "react";

export const SHEET_AUDIT_VISIBILITY_KEY =
  "arquivo-herois-sheet-audit:v1";

export function useSheetAuditVisibility() {
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setShowAudit(
          window.localStorage.getItem(SHEET_AUDIT_VISIBILITY_KEY) ===
            "visible",
        );
      } catch {
        // The clean view remains the safe default when storage is unavailable.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const changeAuditVisibility = useCallback((visible: boolean) => {
    setShowAudit(visible);
    try {
      window.localStorage.setItem(
        SHEET_AUDIT_VISIBILITY_KEY,
        visible ? "visible" : "hidden",
      );
    } catch {
      // The choice still applies to the current page when storage is unavailable.
    }
  }, []);

  return [showAudit, changeAuditVisibility] as const;
}
