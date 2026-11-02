"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "./locale-provider";

export function PwaManager({ hasUnsavedChanges }: { hasUnsavedChanges: boolean }) {
  const { t } = useLocale();
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [updateReady, setUpdateReady] = useState(false);
  const waitingWorker = useRef<ServiceWorker | null>(null);
  const updateReloadRequested = useRef(false);
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    // Installation stays under the browser's native controls. Do not intercept
    // beforeinstallprompt: there is no custom install button or dialog.
    const handleControllerChange = () => {
      if (!updateReloadRequested.current) return;
      updateReloadRequested.current = false;
      window.location.reload();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    navigator.serviceWorker?.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => {
        if (registration.waiting) {
          waitingWorker.current = registration.waiting;
          setUpdateReady(true);
        }
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              waitingWorker.current = registration.waiting;
              setUpdateReady(true);
            }
          });
        });
      }).catch(() => {
        // The app remains fully usable if a browser blocks service workers.
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker?.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
    };
  }, []);

  function applyUpdate() {
    if (hasUnsavedChanges) return;
    const worker = waitingWorker.current;
    if (!worker) return;
    updateReloadRequested.current = true;
    worker.postMessage({ type: "SKIP_WAITING" });
    window.setTimeout(() => {
      if (!updateReloadRequested.current) return;
      updateReloadRequested.current = false;
      window.location.reload();
    }, 4_000);
  }

  return (
    <>
      {!online && (
        <div className="connection-banner" role="status">
          <WifiOff />
          <span><strong>{t("Você está offline.")}</strong> {t("A ficha aberta continua disponível; mudanças pendentes serão sincronizadas ao reconectar.")}</span>
        </div>
      )}
      {online && updateReady && (
        <div className="pwa-update" role="status">
          <RefreshCw />
          <span>{t(hasUnsavedChanges ? "Salve ou sincronize as alterações antes de atualizar o app." : "Uma versão mais recente está pronta.")}</span>
          <button disabled={hasUnsavedChanges} type="button" onClick={applyUpdate}>{t("Atualizar")}</button>
        </div>
      )}
    </>
  );
}
