"use client";

import {
  CheckCircle2,
  Download,
  RefreshCw,
  Share,
  Signal,
  WifiOff,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDialogFocus } from "./use-dialog-focus";
import { useLocale } from "./locale-provider";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaManager({ hasUnsavedChanges }: { hasUnsavedChanges: boolean }) {
  const { t } = useLocale();
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [installOpen, setInstallOpen] = useState(false);
  const [installed, setInstalled] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches,
  );
  const [updateReady, setUpdateReady] = useState(false);
  const installPrompt = useRef<InstallPromptEvent | null>(null);
  const waitingWorker = useRef<ServiceWorker | null>(null);
  const installDialogRef = useRef<HTMLElement>(null);
  const closeInstall = useCallback(() => setInstallOpen(false), []);
  useDialogFocus(
    installOpen,
    installDialogRef,
    closeInstall,
    '[data-initial-focus="true"]',
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      installPrompt.current = event as InstallPromptEvent;
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallOpen(false);
      installPrompt.current = null;
    };
    const handleRequest = () => void requestInstall();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("arquivo-de-herois:instalar", handleRequest);

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
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("arquivo-de-herois:instalar", handleRequest);
    };

    async function requestInstall() {
      if (installed || window.matchMedia("(display-mode: standalone)").matches) {
        setInstalled(true);
        setInstallOpen(true);
        return;
      }
      if (!installPrompt.current) {
        setInstallOpen(true);
        return;
      }
      await installPrompt.current.prompt();
      const choice = await installPrompt.current.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      installPrompt.current = null;
    }
  }, [installed]);

  function applyUpdate() {
    if (hasUnsavedChanges) return;
    waitingWorker.current?.postMessage({ type: "SKIP_WAITING" });
    window.setTimeout(() => window.location.reload(), 350);
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
      {installOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeInstall}>
          <section className="install-modal" ref={installDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="install-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="icon-button install-close modal-close" type="button" onClick={closeInstall} aria-label={t("Fechar")}><X /></button>
            <span className="install-hero-icon">{installed ? <CheckCircle2 /> : <Download />}</span>
            <p className="eyebrow">{t("Aplicativo instalável")}</p>
            <h2 id="install-title">{t(installed ? "Arquivo de Heróis instalado" : "Adicionar à tela inicial")}</h2>
            {installed ? (
              <p>{t("O Arquivo de Heróis já pode ser aberto como aplicativo, com os mesmos recursos e dados do site.")}</p>
            ) : isIos() ? (
              <ol className="install-steps">
                <li><Share /> No Safari, toque em <strong>Compartilhar</strong>.</li>
                <li><Download /> Escolha <strong>Adicionar à Tela de Início</strong>.</li>
                <li><CheckCircle2 /> Confirme em <strong>Adicionar</strong>.</li>
              </ol>
            ) : (
              <p>{t("Abra o menu do navegador e escolha Instalar app ou Adicionar à tela inicial. O atalho abre a mesma biblioteca e usa os mesmos dados do site.")}</p>
            )}
            <div className="install-assurance"><Signal /> {t("Suas fichas continuam sincronizadas. Instalar o aplicativo não cria uma biblioteca separada.")}</div>
            <button className="button button-primary" data-initial-focus="true" type="button" onClick={closeInstall}>{t("Entendi")}</button>
          </section>
        </div>
      )}
    </>
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
