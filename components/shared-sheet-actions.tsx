"use client";

import {
  Check,
  Copy,
  FileJson,
  FileText,
  LoaderCircle,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { writeBrowserStorage } from "../lib/browser-storage";
import type { CharacterSheet } from "../lib/character";
import { getDeviceOwnerId, OPEN_CHARACTER_KEY } from "../lib/device-owner";
import { isLocalStorageFallbackResponse } from "../lib/storage-mode";
import { useLocale } from "./locale-provider";

export function SharedSheetActions({ sheet }: { sheet: CharacterSheet }) {
  const { t } = useLocale();
  const [copying, setCopying] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState("");

  async function saveCopy() {
    setCopying(true);
    setError("");
    try {
      const request = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-arquivo-owner-id": getDeviceOwnerId(),
        },
        body: JSON.stringify({
          sheet: {
            ...sheet,
            id: "",
            shareEnabled: false,
            shareToken: null,
          },
        }),
      } satisfies RequestInit;
      let response: Response;
      try {
        response = await fetch("/api/characters", request);
      } catch (caught) {
        if (!(caught instanceof TypeError)) throw caught;
        const { localApiFetch } = await import("../lib/local-api");
        response = await localApiFetch("/api/characters", request);
      }
      if (isLocalStorageFallbackResponse(response)) {
        const { localApiFetch } = await import("../lib/local-api");
        response = await localApiFetch("/api/characters", request);
      }
      const payload = (await response.json().catch(() => ({}))) as {
        character?: CharacterSheet;
        error?: string;
      };
      if (!response.ok || !payload.character?.id) {
        throw new Error(payload.error || "Não foi possível salvar a cópia.");
      }
      writeBrowserStorage(OPEN_CHARACTER_KEY, payload.character.id);
      window.location.assign("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar a cópia.");
      setCopying(false);
    }
  }

  async function shareLink() {
    const data = {
      title: `${sheet.heroName} · Arquivo de Heróis`,
      text: `Ficha de ${sheet.heroName} no Arquivo de Heróis`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await copyToClipboard(data.url);
        setCopiedLink(true);
        window.setTimeout(() => setCopiedLink(false), 2200);
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError("Não foi possível compartilhar. Copie o endereço no navegador.");
    }
  }

  async function exportSheet(format: "json" | "txt") {
    const { portableSheetToJson, portableSheetToText } = await import("../lib/portable");
    const content = format === "json" ? portableSheetToJson(sheet) : portableSheetToText(sheet);
    downloadText(
      content,
      `${slugify(sheet.heroName)}.arquivo-de-herois.${format}`,
      format === "json" ? "application/json" : "text/plain;charset=utf-8",
    );
  }

  return (
    <div className="shared-actions" aria-label="Ações da ficha compartilhada">
      <button className="button button-primary compact" disabled={copying} type="button" onClick={() => void saveCopy()}>
        {copying ? <LoaderCircle className="spin" /> : <Copy />}
        {t(copying ? "Salvando…" : "Salvar uma cópia")}
      </button>
      <button className="button button-secondary compact" type="button" onClick={() => void shareLink()}>
        {copiedLink ? <Check /> : <Share2 />}
        {t(copiedLink ? "Link copiado" : "Compartilhar")}
      </button>
      <button className="icon-button" type="button" onClick={() => void exportSheet("json")} aria-label={t("Baixar ficha em JSON")}>
        <FileJson />
      </button>
      <button className="icon-button" type="button" onClick={() => void exportSheet("txt")} aria-label={t("Baixar ficha em TXT")}>
        <FileText />
      </button>
      {error && <p className="shared-action-error" role="alert">{error}</p>}
    </div>
  );
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "ficha";
}

function downloadText(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
