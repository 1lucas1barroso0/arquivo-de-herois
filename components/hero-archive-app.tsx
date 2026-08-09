"use client";

import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Cloud,
  Download,
  Eye,
  FileJson,
  FileText,
  Filter,
  FolderArchive,
  ImagePlus,
  Import,
  LoaderCircle,
  Languages,
  Menu,
  MonitorCog,
  MoreVertical,
  Moon,
  Pencil,
  Plus,
  Printer,
  Save,
  Search,
  Share2,
  Sun,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createEmptySheet, normalizeSheet, type CharacterSheet, type SheetSummary } from "../lib/character";
import {
  listBrowserStorageKeys,
  readBrowserStorage,
  removeBrowserStorage,
  writeBrowserStorage,
} from "../lib/browser-storage";
import {
  getDeviceOwnerId,
  LEGACY_OPEN_CHARACTER_KEY,
  OPEN_CHARACTER_KEY,
} from "../lib/device-owner";
import {
  parsePortableSheet,
  plural,
  portableSheetToJson,
  portableSheetToText,
} from "../lib/portable";
import { parsePortableShare } from "../lib/portable-share";
import { translateRuleText } from "../lib/localization";
import { isLocalStorageFallbackResponse } from "../lib/storage-mode";
import {
  createSummary,
  getPointBudget,
  getRuleAudit,
  pointsSpent,
} from "../lib/rules";
import {
  applyGuidedAutomation,
  EDITING_MODE_KEY,
  LEGACY_EDITING_MODE_KEY,
  type EditingMode,
} from "../lib/guided";
import { PwaManager } from "./pwa-manager";
import { BrandMark } from "./brand-mark";
import { SheetViewModeToggle } from "./sheet-view-mode-toggle";
import { useSheetAuditVisibility } from "./use-sheet-audit-visibility";
import { useDialogFocus } from "./use-dialog-focus";
import { useLocale } from "./locale-provider";

const SheetEditor = lazy(async () => ({
  default: (await import("./sheet-editor")).SheetEditor,
}));
const SheetView = lazy(async () => ({
  default: (await import("./sheet-view")).SheetView,
}));
const ScaleGuide = lazy(async () => ({
  default: (await import("./scale-guide")).ScaleGuide,
}));

type Screen = "library" | "edit" | "view";
type SaveState = "idle" | "dirty" | "saving" | "saved" | "offline" | "error";
type ToastTone = "success" | "warning" | "error";
type ThemePreference = "system" | "light" | "dark";

const PENDING_SAVE_PREFIX = "arquivo-de-herois:salvamento-pendente:v2:";
const LEGACY_PENDING_SAVE_PREFIX = "mm4e-pending-save:v1:";
const THEME_KEY = "arquivo-de-herois:tema:v2";
const LEGACY_THEME_KEY = "mm4e-theme:v1";

export function HeroArchiveApp() {
  const { t } = useLocale();
  const [characters, setCharacters] = useState<SheetSummary[]>([]);
  const [activeSheet, setActiveSheet] = useState<CharacterSheet | null>(null);
  const [screen, setScreen] = useState<Screen>("library");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"updated" | "name" | "pl">("updated");
  const [loading, setLoading] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [deleteTarget, setDeleteTarget] = useState<SheetSummary | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false);
  const [editingMode, setEditingMode] =
    useState<EditingMode>("guided");
  const [themePreference, setThemePreference] =
    useState<ThemePreference>("light");
  const [showViewAudit, setShowViewAudit] =
    useSheetAuditVisibility();
  const deferredQuery = useDeferredValue(query);
  const railRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const deleteDialogRef = useRef<HTMLElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSheet = useRef<CharacterSheet | null>(null);
  const bootActionHandled = useRef(false);
  const automationNotice = useRef({ signature: "", time: 0 });
  const preferencesLoaded = useRef(false);
  const localStorageMode = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedMode =
        readBrowserStorage(EDITING_MODE_KEY) ??
        readBrowserStorage(LEGACY_EDITING_MODE_KEY);
      const storedTheme =
        readBrowserStorage(THEME_KEY) ??
        readBrowserStorage(LEGACY_THEME_KEY);
      preferencesLoaded.current = true;
      if (storedMode === "guided" || storedMode === "free") {
        setEditingMode(storedMode);
      }
      if (
        storedTheme === "system" ||
        storedTheme === "light" ||
        storedTheme === "dark"
      ) {
        setThemePreference(storedTheme);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const closeDeleteDialog = useCallback(() => setDeleteTarget(null), []);
  useDialogFocus(
    Boolean(deleteTarget),
    deleteDialogRef,
    closeDeleteDialog,
    '[data-initial-focus="true"]',
  );

  useEffect(() => {
    if (!preferencesLoaded.current) return;
    writeBrowserStorage(EDITING_MODE_KEY, editingMode);
  }, [editingMode]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const bootstrappedPreference =
      document.documentElement.dataset.themePreference;
    const appliedPreference =
      !preferencesLoaded.current &&
      (bootstrappedPreference === "system" ||
        bootstrappedPreference === "light" ||
        bootstrappedPreference === "dark")
        ? bootstrappedPreference
        : themePreference;
    const applyTheme = () => {
      const resolved =
        appliedPreference === "system"
          ? media.matches
            ? "dark"
            : "light"
          : appliedPreference;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.dataset.themePreference = appliedPreference;
      document
        .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
        .forEach((meta) =>
          meta.setAttribute(
            "content",
            resolved === "light" ? "#f5f7f4" : "#11171b",
          ),
        );
    };
    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [themePreference]);

  useEffect(() => {
    if (!preferencesLoaded.current) return;
    writeBrowserStorage(THEME_KEY, themePreference);
  }, [themePreference]);

  const apiFetch = useCallback(async (url: string, init: RequestInit = {}) => {
    if (localStorageMode.current) {
      const { localApiFetch } = await import("../lib/local-api");
      return localApiFetch(url, init);
    }
    const ownerId = getDeviceOwnerId();
    const headers = new Headers(init.headers);
    headers.set("x-arquivo-owner-id", ownerId);
    if (init.body && !(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    let response: Response;
    try {
      response = await fetch(url, { ...init, headers });
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      localStorageMode.current = true;
      const { localApiFetch } = await import("../lib/local-api");
      return localApiFetch(url, init);
    }
    if (isLocalStorageFallbackResponse(response)) {
      localStorageMode.current = true;
      const { localApiFetch } = await import("../lib/local-api");
      response = await localApiFetch(url, init);
    }
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || "A operação não pôde ser concluída.");
    }
    return response;
  }, []);

  const refreshList = useCallback(async () => {
    const response = await apiFetch("/api/characters");
    const payload = (await response.json()) as { characters: SheetSummary[] };
    setCharacters(payload.characters);
    return payload.characters;
  }, [apiFetch]);

  useEffect(() => {
    // External synchronization: hydrate the UI from the durable API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshList()
      .then(async (items) => {
        const requestedId =
          readBrowserStorage(OPEN_CHARACTER_KEY) ??
          readBrowserStorage(LEGACY_OPEN_CHARACTER_KEY);
        const target = items.find((item) => item.id === requestedId) || items[0];
        if (target) {
          const response = await apiFetch(`/api/characters/${target.id}`);
          const payload = (await response.json()) as { character: CharacterSheet };
          const pending = readPendingSheet(target.id);
          setActiveSheet(pending || normalizeSheet(payload.character));
          if (pending) setSaveState("offline");
          if (requestedId === target.id) {
            removeBrowserStorage(
              OPEN_CHARACTER_KEY,
              LEGACY_OPEN_CHARACTER_KEY,
            );
            setScreen("edit");
          }
        }
      })
      .catch((error) => showToast(error instanceof Error ? error.message : "Erro ao carregar.", "error"))
      .finally(() => setLoading(false));
  }, [apiFetch, refreshList]);

  useEffect(() => {
    if (loading || bootActionHandled.current) return;
    bootActionHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "new") void createSheet();
    if (params.get("action") === "import") window.setTimeout(() => setImportOpen(true), 0);
    window.history.replaceState({}, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    const synchronize = () => void syncPendingSaves(apiFetch, refreshList, showToast).then((count) => {
      const current = latestSheet.current;
      if (
        count &&
        current?.id &&
        !readBrowserStorage(`${PENDING_SAVE_PREFIX}${current.id}`)
      ) {
        setSaveState("saved");
      }
    });
    window.addEventListener("online", synchronize);
    if (navigator.onLine) synchronize();
    return () => window.removeEventListener("online", synchronize);
  }, [apiFetch, refreshList]);

  useEffect(() => {
    latestSheet.current = activeSheet;
  }, [activeSheet]);

  useEffect(() => {
    if (saveState !== "dirty" || !activeSheet?.id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistSheet(activeSheet);
    }, 850);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSheet, saveState]);

  const filteredCharacters = useMemo(() => {
    const normalized = deferredQuery.trim().toLocaleLowerCase("pt-BR");
    const items = characters.filter((item) => {
      if (!normalized) return true;
      return `${item.heroName} ${item.civilName} ${item.concept} ${item.powerLevel}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalized);
    });
    return [...items].sort((a, b) => {
      if (sort === "name") return a.heroName.localeCompare(b.heroName, "pt-BR");
      if (sort === "pl") return b.powerLevel - a.powerLevel;
      return String(b.updatedAt).localeCompare(String(a.updatedAt));
    });
  }, [characters, deferredQuery, sort]);

  async function loadSheet(id: string, nextScreen?: Screen) {
    if (activeSheet?.id === id) {
      if (nextScreen) setScreen(nextScreen);
      return activeSheet;
    }
    setLoadingSheet(true);
    try {
      const response = await apiFetch(`/api/characters/${id}`);
      const payload = (await response.json()) as { character: CharacterSheet };
      const sheet = normalizeSheet(payload.character);
      setActiveSheet(sheet);
      setSaveState("idle");
      if (nextScreen) setScreen(nextScreen);
      return sheet;
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível abrir a ficha.", "error");
      return null;
    } finally {
      setLoadingSheet(false);
    }
  }

  async function createSheet(template?: CharacterSheet) {
    try {
      let draft = template ? normalizeSheet(template) : createEmptySheet();
      if (editingMode === "guided") {
        draft = applyGuidedAutomation(draft).sheet;
      }
      draft.id = "";
      draft.shareEnabled = false;
      draft.shareToken = null;
      const response = await apiFetch("/api/characters", {
        method: "POST",
        body: JSON.stringify({ sheet: draft }),
      });
      const payload = (await response.json()) as { character: CharacterSheet };
      const sheet = normalizeSheet(payload.character);
      setActiveSheet(sheet);
      setCharacters((current) => [summaryFromSheet(sheet), ...current]);
      setSaveState("saved");
      setScreen("edit");
      showToast(template ? "Ficha importada com sucesso." : "Nova ficha criada.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível criar a ficha.", "error");
    }
  }

  async function persistSheet(sheet: CharacterSheet, silent = true) {
    if (!sheet.id) return false;
    setSaveState("saving");
    try {
      const response = await apiFetch(`/api/characters/${sheet.id}`, {
        method: "PUT",
        body: JSON.stringify({ sheet }),
      });
      const payload = (await response.json()) as { character: CharacterSheet };
      const saved = normalizeSheet(payload.character);
      const hasNewerChanges = latestSheet.current?.id === sheet.id && latestSheet.current !== sheet;
      if (latestSheet.current?.id === saved.id) {
        setActiveSheet((current) =>
          current?.id === saved.id ? { ...current, updatedAt: saved.updatedAt } : current,
        );
      }
      setCharacters((current) =>
        current
          .map((item) => {
            if (item.id !== saved.id) return item;
            const latest = latestSheet.current?.id === saved.id ? latestSheet.current : sheet;
            return summaryFromSheet({ ...latest, updatedAt: saved.updatedAt });
          })
          .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))),
      );
      setSaveState(hasNewerChanges ? "dirty" : "saved");
      removeBrowserStorage(
        `${PENDING_SAVE_PREFIX}${sheet.id}`,
        `${LEGACY_PENDING_SAVE_PREFIX}${sheet.id}`,
      );
      if (!silent) showToast("Ficha salva.");
      return !hasNewerChanges;
    } catch (error) {
      if (!navigator.onLine || error instanceof TypeError) {
        try {
          const stored = writeBrowserStorage(
            `${PENDING_SAVE_PREFIX}${sheet.id}`,
            JSON.stringify({
              version: 1,
              sheet,
              queuedAt: new Date().toISOString(),
            }),
          );
          if (!stored) throw new Error("O armazenamento local está indisponível.");
          setSaveState("offline");
          showToast("Sem conexão. As alterações ficaram guardadas neste dispositivo e serão sincronizadas automaticamente.", "warning");
        } catch {
          setSaveState("error");
          showToast("Sem conexão e sem espaço local. Exporte a ficha antes de fechar esta página.", "error");
        }
        return false;
      }
      setSaveState("error");
      showToast(error instanceof Error ? error.message : "Erro ao salvar.", "error");
      return false;
    }
  }

  function updateSheet(sheet: CharacterSheet) {
    const result =
      editingMode === "guided"
        ? applyGuidedAutomation(sheet)
        : { sheet, changes: [] };
    setActiveSheet(result.sheet);
    setSaveState("dirty");
    if (result.changes.length) {
      const signature = result.changes.join("|");
      const now = Date.now();
      if (
        automationNotice.current.signature !== signature ||
        now - automationNotice.current.time > 3500
      ) {
        automationNotice.current = { signature, time: now };
        showToast(`Modo assistido: ${result.changes[0]}`, "warning");
      }
    }
  }

  function changeEditingMode(mode: EditingMode) {
    setEditingMode(mode);
    if (mode !== "guided" || !activeSheet) return;
    const result = applyGuidedAutomation(activeSheet);
    if (result.changes.length) {
      setActiveSheet(result.sheet);
      setSaveState("dirty");
      showToast(
        `Proteção assistida aplicada: ${result.changes.join(" ")}`,
        "warning",
      );
    } else {
      showToast("Proteção assistida ativada.");
    }
  }

  async function removeCharacter() {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/characters/${deleteTarget.id}`, { method: "DELETE" });
      setCharacters((current) => current.filter((item) => item.id !== deleteTarget.id));
      if (activeSheet?.id === deleteTarget.id) {
        setActiveSheet(null);
        setScreen("library");
      }
      showToast("Ficha excluída.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível excluir.", "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function uploadImage(file: File) {
    if (!activeSheet) return;
    setImageUploading(true);
    try {
      const optimizedFile = await optimizePortrait(file);
      const form = new FormData();
      form.set("image", optimizedFile);
      const response = await apiFetch("/api/uploads", { method: "POST", body: form });
      const payload = (await response.json()) as { url: string };
      updateSheet({ ...activeSheet, imageUrl: payload.url });
      showToast("Imagem anexada.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Falha ao enviar a imagem.", "error");
    } finally {
      setImageUploading(false);
    }
  }

  async function shareSheet() {
    if (!activeSheet) return;
    if (editingMode === "guided") {
      const audit = getRuleAudit(activeSheet);
      if (audit.failures || audit.attentions) {
        setScreen("edit");
        window.setTimeout(
          () =>
            window.dispatchEvent(
              new CustomEvent("arquivo-de-herois:abrir-auditoria"),
            ),
          0,
        );
        showToast(
          "A ficha ainda tem erros ou avisos sem decisão. A auditoria foi aberta: corrija os erros e mantenha, aprove ou reprove cada aviso. O modo livre continua disponível para uma escolha consciente da mesa.",
          "error",
        );
        return;
      }
    }
    try {
      if (saveState === "dirty" || saveState === "offline") {
        const saved = await persistSheet(activeSheet);
        if (!saved) return;
      }
      const response = await apiFetch(`/api/characters/${activeSheet.id}/share`, {
        method: "POST",
        body: JSON.stringify({ enabled: true }),
      });
      const payload = (await response.json()) as {
        token?: string | null;
        path?: string;
        portableUrl?: string;
      };
      const url = payload.portableUrl
        ? payload.portableUrl
        : new URL(payload.path || "/", window.location.origin).toString();
      await copyToClipboard(url);
      const shareToken = payload.token || null;
      setActiveSheet({ ...activeSheet, shareEnabled: Boolean(shareToken), shareToken });
      setCharacters((current) =>
        current.map((item) =>
          item.id === activeSheet.id
            ? { ...item, shareEnabled: Boolean(shareToken), shareToken }
            : item,
        ),
      );
      showToast(
        payload.portableUrl
          ? "Link portátil criado e copiado. A ficha está contida no próprio endereço."
          : activeSheet.shareToken
            ? "Link permanente atualizado e copiado."
            : "Link permanente criado e copiado.",
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível compartilhar.", "error");
    }
  }

  function exportSheet(format: "json" | "txt") {
    if (!activeSheet) return;
    const content = format === "json" ? portableSheetToJson(activeSheet) : portableSheetToText(activeSheet);
    const type = format === "json" ? "application/json" : "text/plain";
    downloadText(content, `${slugify(activeSheet.heroName)}.arquivo-de-herois.${format}`, type);
    showToast(`Ficha exportada em ${format.toUpperCase()}.`);
  }

  async function importSheet(file: File) {
    try {
      const text = await file.text();
      await importFromText(text);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível importar esta ficha.", "error");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  }

  async function importFromText(text: string) {
    const portableShare = await parsePortableShare(text);
    if (portableShare) {
      await createSheet(portableShare);
      setImportOpen(false);
      return;
    }
    const shareToken = extractShareToken(text);
    if (shareToken) {
      const response = await apiFetch(`/api/shared/${encodeURIComponent(shareToken)}`);
      const payload = (await response.json().catch(() => ({}))) as { character?: CharacterSheet; error?: string };
      if (!response.ok || !payload.character) {
        throw new Error(payload.error || "O link compartilhado não pôde ser aberto.");
      }
      await createSheet(normalizeSheet(payload.character));
    } else {
      await createSheet(parsePortableSheet(text));
    }
    setImportOpen(false);
  }

  function showToast(message: string, tone: ToastTone = "success") {
    const next = { message, tone };
    setToast(next);
    window.setTimeout(
      () => setToast((current) => (current?.message === message ? null : current)),
      4200,
    );
  }

  if (loading) {
    return (
      <main className="app-loading">
        <BrandMark />
        <LoaderCircle className="spin" />
        <p>Abrindo o Arquivo de Heróis…</p>
      </main>
    );
  }

  return (
    <main className={`archive-app screen-${screen}`}>
      <Topbar
        screen={screen}
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
        onBack={() => setScreen("library")}
        onNew={() => void createSheet()}
        onImport={() => setImportOpen(true)}
        onInstall={() => window.dispatchEvent(new CustomEvent("arquivo-de-herois:instalar"))}
        onScales={() => setScaleOpen(true)}
        themePreference={themePreference}
        onThemePreference={setThemePreference}
      />

      <PwaManager hasUnsavedChanges={saveState === "dirty" || saveState === "saving" || saveState === "offline"} />

      <input
        className="sr-only"
        ref={importRef}
        type="file"
        aria-label="Selecionar arquivo de ficha"
        accept="application/json,text/plain,.json,.txt"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importSheet(file);
        }}
      />

      {screen === "library" && (
        <LibraryScreen
          characters={filteredCharacters}
          allCount={characters.length}
          activeSheet={activeSheet}
          query={query}
          sort={sort}
          railRef={railRef}
          loadingSheet={loadingSheet}
          onQuery={setQuery}
          onSort={setSort}
          onSelect={(id) => void loadSheet(id)}
          onEdit={(id) => void loadSheet(id, "edit")}
          onView={(id) => void loadSheet(id, "view")}
          onDelete={setDeleteTarget}
          onNew={() => void createSheet()}
          onRailScroll={(direction) =>
            railRef.current?.scrollBy({ left: direction * 420, behavior: "smooth" })
          }
        />
      )}

      {(screen === "edit" || screen === "view") && activeSheet && (
        <Workspace
          sheet={activeSheet}
          screen={screen}
          saveState={saveState}
          imageUploading={imageUploading}
          onScreen={setScreen}
          onSave={() => void persistSheet(activeSheet, false)}
          onChange={updateSheet}
          editingMode={editingMode}
          onEditingMode={changeEditingMode}
          showAudit={showViewAudit}
          onShowAudit={setShowViewAudit}
          onImageUpload={uploadImage}
          onShare={() => void shareSheet()}
          onExport={exportSheet}
          onDelete={() => {
            const summary = characters.find((item) => item.id === activeSheet.id);
            if (summary) setDeleteTarget(summary);
          }}
        />
      )}

      {importOpen && (
        <ImportDialog
          fileInputRef={importRef}
          onClose={() => setImportOpen(false)}
          onImportText={importFromText}
        />
      )}

      {scaleOpen && (
        <Suspense fallback={null}>
          <ScaleGuide
            initialPowerLevel={activeSheet?.powerLevel ?? 10}
            onClose={() => setScaleOpen(false)}
            open
          />
        </Suspense>
      )}

      {deleteTarget && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeDeleteDialog}>
          <section
            aria-labelledby="delete-title"
            aria-modal="true"
            className="confirm-modal"
            onMouseDown={(event) => event.stopPropagation()}
            ref={deleteDialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="modal-icon"><CircleAlert /></div>
            <p className="eyebrow">Excluir ficha</p>
            <h2 id="delete-title">{deleteTarget.heroName}</h2>
            <p>
              {deleteTarget.shareToken
                ? "A ficha editável será removida do seu arquivo. O link permanente já publicado continuará disponível."
                : "Esta ação remove permanentemente a ficha do seu arquivo."}
            </p>
            <div className="modal-actions">
              <button className="button button-secondary" data-initial-focus="true" type="button" onClick={closeDeleteDialog}>{t("Cancelar")}</button>
              <button className="button button-danger" type="button" onClick={() => void removeCharacter()}><Trash2 size={16} /> Excluir ficha</button>
            </div>
          </section>
        </div>
      )}

      {toast && (
        <div className={`toast tone-${toast.tone}`} role={toast.tone === "error" ? "alert" : "status"}>
          {toast.tone === "success" ? <BadgeCheck size={17} /> : <CircleAlert size={17} />}
          {toast.message}
        </div>
      )}
    </main>
  );
}

function Topbar({
  screen,
  mobileMenu,
  setMobileMenu,
  onBack,
  onNew,
  onImport,
  onInstall,
  onScales,
  themePreference,
  onThemePreference,
}: {
  screen: Screen;
  mobileMenu: boolean;
  setMobileMenu: (value: boolean) => void;
  onBack: () => void;
  onNew: () => void;
  onImport: () => void;
  onInstall: () => void;
  onScales: () => void;
  themePreference: ThemePreference;
  onThemePreference: (value: ThemePreference) => void;
}) {
  const { language, setLanguage, t } = useLocale();

  function run(action: () => void) {
    setMobileMenu(false);
    action();
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="mobile-menu-button" type="button" onClick={() => setMobileMenu(!mobileMenu)} aria-label={t(mobileMenu ? "Fechar menu" : "Abrir menu")} aria-expanded={mobileMenu}>
          {mobileMenu ? <X /> : <Menu />}
        </button>
        <button aria-label="Arquivo de Heróis" className="brand" type="button" onClick={() => run(onBack)}>
          <BrandMark />
          <span><strong>Arquivo de Heróis</strong></span>
        </button>
        <nav className={mobileMenu ? "is-open" : ""}>
          <button
            className="theme-button"
            type="button"
            onClick={() =>
              onThemePreference(nextThemePreference(themePreference))
            }
            title={t("Alternar entre tema do sistema, claro e escuro")}
          >
            <ThemeIcon preference={themePreference} />
            <span>{t(`Tema: ${themeLabel(themePreference)}`)}</span>
          </button>
          <button
            className="language-button"
            type="button"
            onClick={() => setLanguage(language === "pt" ? "en" : "pt")}
            aria-label={t("Idioma do site")}
            title={t("Idioma do site")}
          >
            <Languages size={16} aria-hidden="true" />
            <span>{language === "pt" ? "PT" : "EN"}</span>
          </button>
          <button type="button" onClick={() => run(onScales)}><BookOpen size={16} /> {t("Referências")}</button>
          {screen === "library" && (
            <>
              <button type="button" onClick={() => run(onImport)}><Import size={16} /> {t("Importar")}</button>
              <button type="button" onClick={() => run(onInstall)}><Download size={16} /> {t("Instalar app")}</button>
              <button className="topbar-cta" type="button" onClick={() => run(onNew)}><Plus size={16} /> {t("Nova ficha")}</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function LibraryScreen({
  characters,
  allCount,
  activeSheet,
  query,
  sort,
  railRef,
  loadingSheet,
  onQuery,
  onSort,
  onSelect,
  onEdit,
  onView,
  onDelete,
  onNew,
  onRailScroll,
}: {
  characters: SheetSummary[];
  allCount: number;
  activeSheet: CharacterSheet | null;
  query: string;
  sort: "updated" | "name" | "pl";
  railRef: React.RefObject<HTMLDivElement | null>;
  loadingSheet: boolean;
  onQuery: (value: string) => void;
  onSort: (value: "updated" | "name" | "pl") => void;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (sheet: SheetSummary) => void;
  onNew: () => void;
  onRailScroll: (direction: number) => void;
}) {
  const { language, t } = useLocale();
  return (
    <div className="library-page">
      <section className="hero-intro">
        <div>
          <p className="eyebrow">{t("Criação de personagens")}</p>
          <h1>{t("Suas fichas")}</h1>
          <p>{t("Crie, confira e compartilhe personagens com cálculos automáticos e liberdade para regras da campanha.")}</p>
        </div>
      </section>

      <div className="library-layout">
        <section className="library-panel">
          <header className="library-panel-head">
            <div>
              <FolderArchive size={19} />
              <strong>{allCount} {language === "en" ? (allCount === 1 ? "sheet" : "sheets") : (allCount === 1 ? "ficha" : "fichas")}</strong>
            </div>
            {allCount > 3 && (
              <div className="rail-controls">
                <button type="button" onClick={() => onRailScroll(-1)} aria-label={t("Fichas anteriores")}><ChevronLeft /></button>
                <button type="button" onClick={() => onRailScroll(1)} aria-label={t("Próximas fichas")}><ChevronRight /></button>
              </div>
            )}
          </header>
          <div className="library-tools">
            <label className="search-field">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                placeholder={t("Buscar por nome, identidade ou nível…")}
              />
              {query && <button type="button" onClick={() => onQuery("")} aria-label={t("Limpar busca")}><X size={15} /></button>}
            </label>
            <label className="sort-field">
              <Filter size={16} />
              <select value={sort} onChange={(event) => onSort(event.target.value as typeof sort)}>
                <option value="updated">{t("Mais recentes")}</option>
                <option value="name">{t("Nome A–Z")}</option>
                <option value="pl">{t("Maior NP")}</option>
              </select>
            </label>
          </div>

          {characters.length ? (
            <div className="character-rail" ref={railRef}>
              {characters.map((sheet) => (
                <CharacterCard
                  key={sheet.id}
                  sheet={sheet}
                  active={activeSheet?.id === sheet.id}
                  onSelect={() => onSelect(sheet.id)}
                  onEdit={() => onEdit(sheet.id)}
                  onView={() => onView(sheet.id)}
                  onDelete={() => onDelete(sheet)}
                />
              ))}
            </div>
          ) : (
            <div className="library-empty">
              <Search />
              <h2>{t("Nenhuma ficha encontrada")}</h2>
              <p>{t("Ajuste a busca ou crie uma nova ficha.")}</p>
              <button className="button button-primary" onClick={onNew} type="button"><Plus /> {t("Nova ficha")}</button>
            </div>
          )}
        </section>

        <LimitPanel sheet={activeSheet} loading={loadingSheet} onEdit={() => activeSheet && onEdit(activeSheet.id)} onView={() => activeSheet && onView(activeSheet.id)} />
      </div>
    </div>
  );
}

function CharacterCard({
  sheet,
  active,
  onSelect,
  onEdit,
  onView,
  onDelete,
}: {
  sheet: SheetSummary;
  active: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const { language, t } = useLocale();
  return (
    <article
      className={`character-card ${active ? "is-active" : ""}`}
      style={{ "--card-accent": sheet.accent } as React.CSSProperties}
    >
      <button className="card-select-hitbox" type="button" onClick={onSelect} aria-label={`${language === "en" ? "Select" : "Selecionar"} ${sheet.heroName}`} />
      <div className="character-image">
        {sheet.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sheet.imageUrl} alt="" />
        ) : (
          <div className="portrait-fallback"><ImagePlus /></div>
        )}
        <button
          className="card-menu-button"
          type="button"
          onClick={(event) => { event.stopPropagation(); setMenu(!menu); }}
          aria-label={`${language === "en" ? "Actions for" : "Ações de"} ${sheet.heroName}`}
        >
          <MoreVertical />
        </button>
        {menu && (
          <div className="card-menu">
            <button type="button" onClick={(event) => { event.stopPropagation(); onView(); setMenu(false); }}><Eye /> {t("Visualizar")}</button>
            <button type="button" onClick={(event) => { event.stopPropagation(); onEdit(); setMenu(false); }}><Pencil /> {t("Editar")}</button>
            <button className="is-danger" type="button" onClick={(event) => { event.stopPropagation(); onDelete(); setMenu(false); }}><Trash2 /> {t("Excluir")}</button>
          </div>
        )}
      </div>
      <div className="character-card-title">
        <div>
          <h2>{sheet.heroName}</h2>
          <p>{sheet.civilName || sheet.concept || t("Identidade reservada")}</p>
        </div>
        <span>NP {sheet.powerLevel}</span>
      </div>
      <footer>
        <span><FileText /> {sheet.pointsSpent}/{sheet.pointsTotal} PP</span>
        {sheet.shareEnabled && <span><Share2 /> {t("Link ativo")}</span>}
      </footer>
    </article>
  );
}

function LimitPanel({
  sheet,
  loading,
  onEdit,
  onView,
}: {
  sheet: CharacterSheet | null;
  loading: boolean;
  onEdit: () => void;
  onView: () => void;
}) {
  const { language, t } = useLocale();
  if (loading) {
    return <aside className="limit-panel panel-loading"><LoaderCircle className="spin" /> {t("Atualizando a ficha…")}</aside>;
  }
  if (!sheet) {
    return <aside className="limit-panel"><p>{t("Selecione uma ficha para ver seu diagnóstico.")}</p></aside>;
  }
  const audit = getRuleAudit(sheet);
  const checks = audit.checks.filter((check) => check.group === "pl");
  const spent = pointsSpent(sheet);
  const budget = getPointBudget(sheet);
  const percentage = Math.min(100, (spent / Math.max(1, budget)) * 100);
  const statusLabel =
    audit.status === "pass"
      ? "Tudo certo"
      : audit.status === "fail"
        ? plural(audit.failures, "Erro", "Erros")
        : audit.status === "attention"
          ? "Revisar"
          : "Narrador / NPC";
  return (
    <aside className="limit-panel">
      <header>
        <div>
          <p className="eyebrow">{t("Ficha selecionada")}</p>
          <h2>{sheet.heroName}</h2>
        </div>
        <span className={`status-${audit.status}`}>
          {audit.status === "pass" ? <BadgeCheck /> : <CircleAlert />}
          {t(statusLabel)}
        </span>
      </header>

      <section>
        <div className="panel-section-title"><i /> {t("Limites de NP")}</div>
        <div className="pl-hero-number">
          <strong>{sheet.powerLevel}</strong>
          <span>{t("Nível de Poder atual")}</span>
        </div>
        <div className="limit-list">
          {checks.slice(0, 5).map((check) => (
            <div
              key={check.key}
              className={`status-${check.status} ${check.status === "fail" ? "is-invalid" : ""}`}
            >
              <span>{translateRuleText(check.label, language)}</span>
              <strong>{check.value ?? "—"}/{check.limit ?? "—"}</strong>
              <i><b style={{ width: `${Math.min(100, ((check.value ?? 0) / Math.max(1, check.limit ?? 1)) * 100)}%` }} /></i>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="panel-section-title"><i /> {t("Progresso de pontos")}</div>
        <div className="points-progress">
          <div className="progress-ring" style={{ "--progress": `${percentage * 3.6}deg` } as React.CSSProperties}>
            <span>{Math.round(percentage)}%</span>
          </div>
          <div>
            <strong>{spent} <small>/ {budget} PP</small></strong>
            <span>{t("Pontos gastos")}</span>
            <p>{t("Saldo")}: {budget - spent} PP</p>
          </div>
        </div>
      </section>

      <div className="panel-actions">
        <button className="button button-primary" type="button" onClick={onEdit}><Pencil /> {t("Editar ficha")}</button>
        <button className="button button-secondary" type="button" onClick={onView}><Eye /> {t("Visualizar")}</button>
      </div>
    </aside>
  );
}

function Workspace({
  sheet,
  screen,
  saveState,
  imageUploading,
  onScreen,
  onSave,
  onChange,
  editingMode,
  onEditingMode,
  showAudit,
  onShowAudit,
  onImageUpload,
  onShare,
  onExport,
  onDelete,
}: {
  sheet: CharacterSheet;
  screen: "edit" | "view";
  saveState: SaveState;
  imageUploading: boolean;
  onScreen: (screen: Screen) => void;
  onSave: () => void;
  onChange: (sheet: CharacterSheet) => void;
  editingMode: EditingMode;
  onEditingMode: (mode: EditingMode) => void;
  showAudit: boolean;
  onShowAudit: (visible: boolean) => void;
  onImageUpload: (file: File) => Promise<void>;
  onShare: () => void;
  onExport: (format: "json" | "txt") => void;
  onDelete: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { t } = useLocale();
  return (
    <div className="workspace-page">
      <header className="workspace-toolbar">
        <div className="workspace-title">
          <button type="button" onClick={() => onScreen("library")} aria-label={t("Voltar à biblioteca")}><ArrowLeft /></button>
          <div>
            <p className="eyebrow">
              {screen === "edit"
                ? t("Editando a ficha")
                : showAudit
                  ? t("Visualização com auditoria")
                  : t("Visualização limpa")}
            </p>
            <h1>{sheet.heroName}</h1>
          </div>
        </div>
        <div className="workspace-tabs" role="tablist">
          <button className={screen === "edit" ? "is-active" : ""} type="button" onClick={() => onScreen("edit")}><Pencil /> {t("Editar")}</button>
          <button className={screen === "view" ? "is-active" : ""} type="button" onClick={() => onScreen("view")}><Eye /> {t("Visualizar")}</button>
        </div>
        <div className="workspace-actions">
          <SaveIndicator state={saveState} />
          {screen === "edit" && <button className="icon-button" type="button" onClick={onSave} aria-label={t("Salvar agora")}><Save /></button>}
          <button className="button button-secondary compact" type="button" onClick={onShare}><Share2 /> {t("Compartilhar")}</button>
          <div className="more-menu-wrap">
            <button className="icon-button" type="button" onClick={() => setMoreOpen(!moreOpen)} aria-label={t("Mais ações")}><MoreVertical /></button>
            {moreOpen && (
              <div className="more-menu">
                <button type="button" onClick={() => { onExport("json"); setMoreOpen(false); }}><FileJson /> {t("Exportar JSON")}</button>
                <button type="button" onClick={() => { onExport("txt"); setMoreOpen(false); }}><FileText /> {t("Exportar TXT")}</button>
                {screen === "view" && <button type="button" onClick={() => window.print()}><Printer /> {t("Imprimir / PDF")}</button>}
                {sheet.shareToken && <p className="more-menu-note">{t("O link desta ficha é permanente.")}</p>}
                <button className="is-danger" type="button" onClick={() => { onDelete(); setMoreOpen(false); }}><Trash2 /> {t("Excluir ficha")}</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={`workspace-content ${screen === "view" ? "is-preview" : ""}`}>
        {screen === "view" && (
          <div className="sheet-view-options">
            <SheetViewModeToggle
              showAudit={showAudit}
              onChange={onShowAudit}
            />
          </div>
        )}
        <Suspense fallback={<div className="workspace-loading"><LoaderCircle className="spin" /> {t("Preparando a ficha…")}</div>}>
          {screen === "edit" ? (
            <SheetEditor
              sheet={sheet}
              onChange={onChange}
              onImageUpload={onImageUpload}
              imageUploading={imageUploading}
              editingMode={editingMode}
              onEditingMode={onEditingMode}
            />
          ) : (
            <SheetView sheet={sheet} showAudit={showAudit} />
          )}
        </Suspense>
      </div>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const { t } = useLocale();
  const copy: Record<SaveState, string> = {
    idle: "Sincronizado",
    dirty: "Alterações pendentes",
    saving: "Salvando…",
    saved: "Salvo",
    offline: "Salvo neste dispositivo",
    error: "Erro ao salvar",
  };
  return (
    <span className={`save-indicator state-${state}`}>
      {state === "saving" ? <LoaderCircle className="spin" /> : state === "error" || state === "offline" ? <CircleAlert /> : <Cloud />}
      {t(copy[state])}
    </span>
  );
}

function ThemeIcon({ preference }: { preference: ThemePreference }) {
  if (preference === "light") return <Sun size={16} aria-hidden="true" />;
  if (preference === "dark") return <Moon size={16} aria-hidden="true" />;
  return <MonitorCog size={16} aria-hidden="true" />;
}

function themeLabel(preference: ThemePreference) {
  if (preference === "light") return "claro";
  if (preference === "dark") return "escuro";
  return "sistema";
}

function nextThemePreference(
  preference: ThemePreference,
): ThemePreference {
  if (preference === "system") return "light";
  if (preference === "light") return "dark";
  return "system";
}

function summaryFromSheet(sheet: CharacterSheet): SheetSummary {
  return createSummary(sheet);
}

function ImportDialog({
  fileInputRef,
  onClose,
  onImportText,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onImportText: (text: string) => Promise<void>;
}) {
  const { t } = useLocale();
  const dialogRef = useRef<HTMLElement>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  useDialogFocus(true, dialogRef, onClose, "textarea");

  async function submit(text: string) {
    if (!text.trim()) {
      setError("Cole um link ou os dados de uma ficha para continuar.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onImportText(text);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível importar esta ficha.");
      setBusy(false);
    }
  }

  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (!file) return;
    await submit(await file.text());
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="import-title"
        aria-modal="true"
        className="import-modal"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header>
          <div>
            <p className="eyebrow">{t("Importação universal")}</p>
            <h2 id="import-title">{t("Trazer uma ficha")}</h2>
          </div>
          <button className="icon-button modal-close" type="button" onClick={onClose} aria-label={t("Fechar importação")}><X /></button>
        </header>
        <p className="import-lead">{t("Use um arquivo JSON ou TXT do Arquivo de Heróis, cole os dados exportados ou informe qualquer link permanente de ficha.")}</p>
        <div
          className={`import-dropzone ${dragging ? "is-dragging" : ""}`}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => void handleDrop(event)}
        >
          <Upload />
          <strong>{t("Arraste o arquivo para cá")}</strong>
          <span>{t("Arquivos JSON ou TXT")}</span>
          <button className="button button-secondary compact" type="button" onClick={() => fileInputRef.current?.click()}>{t("Escolher arquivo")}</button>
        </div>
        <div className="import-divider"><span>{t("ou cole abaixo")}</span></div>
        <label className="import-paste-field">
          <span>{t("Link ou dados da ficha")}</span>
          <textarea
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={t("https://…/share/… ou o conteúdo exportado")}
            rows={5}
          />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <footer className="modal-actions">
          <button className="button button-secondary" type="button" onClick={onClose}>{t("Cancelar")}</button>
          <button className="button button-primary" disabled={busy} type="button" onClick={() => void submit(value)}>
            {busy ? <LoaderCircle className="spin" /> : <Import />}
            {t(busy ? "Importando…" : "Salvar como nova ficha")}
          </button>
        </footer>
      </section>
    </div>
  );
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

function readPendingSheet(id: string) {
  try {
    const stored =
      readBrowserStorage(`${PENDING_SAVE_PREFIX}${id}`) ??
      readBrowserStorage(`${LEGACY_PENDING_SAVE_PREFIX}${id}`);
    if (!stored) return null;
    const value = JSON.parse(stored) as { sheet?: CharacterSheet };
    return value.sheet ? normalizeSheet(value.sheet) : null;
  } catch {
    return null;
  }
}

async function syncPendingSaves(
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>,
  refreshList: () => Promise<SheetSummary[]>,
  notify: (message: string) => void,
) {
  const keys = listBrowserStorageKeys()
    .filter((key) =>
      Boolean(
        key?.startsWith(PENDING_SAVE_PREFIX) ||
        key?.startsWith(LEGACY_PENDING_SAVE_PREFIX),
      ),
    );
  if (!keys.length) return;
  let synchronized = 0;
  for (const key of keys) {
    try {
      const value = JSON.parse(readBrowserStorage(key) || "{}") as { sheet?: CharacterSheet };
      if (!value.sheet?.id) {
        // Preserve unreadable or legacy drafts for manual recovery. Pending
        // data is removed only after a confirmed save or explicit deletion.
        continue;
      }
      await apiFetch(`/api/characters/${value.sheet.id}`, {
        method: "PUT",
        body: JSON.stringify({ sheet: value.sheet }),
      });
      removeBrowserStorage(key);
      synchronized += 1;
    } catch {
      // Keep the latest local draft queued for the next `online` event.
    }
  }
  if (synchronized) {
    await refreshList();
    notify(plural(synchronized, "ficha sincronizada", "fichas sincronizadas"));
  }
  return synchronized;
}

function extractShareToken(value: string) {
  const trimmed = value.trim();
  if (/^[a-z0-9]{20,64}$/i.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/share\/([^/?#]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
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

async function optimizePortrait(file: File) {
  if (file.type === "image/gif" || file.size < 700_000) return file;

  const bitmap = await createImageBitmap(file);
  const maxEdge = 1_600;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.86),
  );
  if (!blob) return file;
  const baseName = file.name.replace(/\.[^.]+$/, "") || "retrato";
  return new File([blob], `${baseName}.webp`, { type: "image/webp" });
}
