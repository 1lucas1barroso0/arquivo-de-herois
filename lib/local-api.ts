import {
  newId,
  normalizeSheet,
  type CharacterSheet,
} from "./character";
import {
  readBrowserStorage,
  writeBrowserStorage,
} from "./browser-storage";
import { createExampleSheets } from "./example-sheets";
import { createSummary } from "./rules";
import { createPortableShareUrl } from "./portable-share";
import {
  addCharacterRevision,
  createCharacterRevision,
  type CharacterRevision,
} from "./history";
import {
  createCampaignSummary,
  normalizeCampaign,
  type Campaign,
} from "./workspace";

const DATABASE_NAME = "arquivo-de-herois";
const STORE_NAME = "personagens";
const CAMPAIGN_STORE_NAME = "campanhas";
const REVISION_STORE_NAME = "revisoes";
const DATABASE_VERSION = 2;
const SEED_KEY = "arquivo-de-herois:exemplos-criados:v1";

export async function localApiFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = new URL(input, window.location.origin);
  const method = (init.method ?? "GET").toUpperCase();

  if (url.pathname === "/api/characters" && method === "GET") {
    const characters = await listCharacters();
    return json({ characters: characters.map(createSummary) });
  }

  if (url.pathname === "/api/characters" && method === "POST") {
    const body = parseJsonBody(init.body);
    const character = normalizeSheet(body.sheet);
    character.id = newId("character");
    character.shareEnabled = false;
    character.shareToken = null;
    const now = new Date().toISOString();
    character.createdAt = now;
    character.updatedAt = now;
    await putCharacter(character);
    return json({ character }, 201);
  }

  if (url.pathname === "/api/campaigns" && method === "GET") {
    const campaigns = await listCampaigns();
    return json({ campaigns: campaigns.map(createCampaignSummary) });
  }

  if (url.pathname === "/api/campaigns" && method === "POST") {
    const body = parseJsonBody(init.body) as { campaign?: unknown };
    const now = new Date().toISOString();
    const campaign = normalizeCampaign({
      ...normalizeCampaign(body.campaign),
      id: newId("campaign"),
      createdAt: now,
      updatedAt: now,
    });
    await putCampaign(campaign);
    return json({ campaign }, 201);
  }

  const campaignMatch = url.pathname.match(/^\/api\/campaigns\/([^/]+)$/);
  if (campaignMatch) {
    const id = decodeURIComponent(campaignMatch[1]);
    if (method === "GET") {
      const campaign = await getCampaign(id);
      return campaign
        ? json({ campaign })
        : json({ error: "Campanha não encontrada." }, 404);
    }
    if (method === "PUT") {
      const current = await getCampaign(id);
      if (!current) return json({ error: "Campanha não encontrada." }, 404);
      const body = parseJsonBody(init.body) as { campaign?: unknown };
      const campaign = normalizeCampaign({
        ...normalizeCampaign(body.campaign),
        id,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      });
      await putCampaign(campaign);
      return json({ campaign });
    }
    if (method === "DELETE") {
      await deleteStoredValue(CAMPAIGN_STORE_NAME, id);
      return new Response(null, { status: 204 });
    }
  }

  const revisionMatch = url.pathname.match(
    /^\/api\/characters\/([^/]+)\/history(?:\/([^/]+))?$/,
  );
  if (revisionMatch && method === "GET") {
    const characterId = decodeURIComponent(revisionMatch[1]);
    const revisionId = revisionMatch[2]
      ? decodeURIComponent(revisionMatch[2])
      : null;
    if (revisionId) {
      const revision = await getStoredValue<CharacterRevision>(
        REVISION_STORE_NAME,
        revisionId,
      );
      return revision?.characterId === characterId
        ? json({ revision })
        : json({ error: "Versão não encontrada." }, 404);
    }
    return json({
      revisions: (await listCharacterRevisions(characterId)).map((entry) => {
        const { sheet, ...summary } = entry;
        void sheet;
        return summary;
      }),
    });
  }

  const shareMatch = url.pathname.match(/^\/api\/characters\/([^/]+)\/share$/);
  if (shareMatch && method === "POST") {
    const character = await getCharacter(decodeURIComponent(shareMatch[1]));
    if (!character) return json({ error: "Ficha não encontrada." }, 404);
    const body = parseJsonBody(init.body) as {
      enabled?: boolean;
      mode?: "read-only" | "duplicable";
    };
    const shared = {
      ...character,
      shareMode: body.mode === "read-only" ? "read-only" as const : "duplicable" as const,
    };
    const portableUrl = await createPortableShareUrl(
      shared,
      window.location.origin,
    );
    return json({ portableUrl, path: portableUrl, token: null, mode: shared.shareMode });
  }

  const characterMatch = url.pathname.match(/^\/api\/characters\/([^/]+)$/);
  if (characterMatch) {
    const id = decodeURIComponent(characterMatch[1]);
    if (method === "GET") {
      const character = await getCharacter(id);
      return character
        ? json({ character })
        : json({ error: "Ficha não encontrada." }, 404);
    }
    if (method === "PUT") {
      const current = await getCharacter(id);
      if (!current) return json({ error: "Ficha não encontrada." }, 404);
      const body = parseJsonBody(init.body);
      const incoming =
        body.sheet && typeof body.sheet === "object"
          ? (body.sheet as Record<string, unknown>)
          : {};
      const character = normalizeSheet({
        ...incoming,
        id,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      });
      await recordLocalRevision(current);
      await putCharacter(character);
      return json({ character });
    }
    if (method === "DELETE") {
      await deleteCharacter(id);
      await deleteLocalRevisions(id);
      return new Response(null, { status: 204 });
    }
  }

  if (url.pathname === "/api/uploads" && method === "POST") {
    if (!(init.body instanceof FormData)) {
      return json({ error: "Selecione uma imagem." }, 400);
    }
    const file = init.body.get("image");
    if (!(file instanceof File)) {
      return json({ error: "Selecione uma imagem." }, 400);
    }
    return json({ url: await fileToDataUrl(file) }, 201);
  }

  return json({ error: "Operação local não reconhecida." }, 404);
}

function parseJsonBody(body: BodyInit | null | undefined) {
  if (typeof body !== "string") return {} as {
    sheet?: unknown;
    campaign?: unknown;
    enabled?: boolean;
    mode?: "read-only" | "duplicable";
  };
  try {
    return JSON.parse(body) as {
      sheet?: unknown;
      campaign?: unknown;
      enabled?: boolean;
      mode?: "read-only" | "duplicable";
    };
  } catch {
    return {} as {
      sheet?: unknown;
      campaign?: unknown;
      enabled?: boolean;
      mode?: "read-only" | "duplicable";
    };
  }
}

async function listCharacters() {
  const database = await openDatabase();
  let characters = await request<unknown[]>(
    database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll(),
  );
  if (!characters.length && !readBrowserStorage(SEED_KEY)) {
    const now = new Date().toISOString();
    characters = createExampleSheets().map((sheet, index) =>
      normalizeSheet({
        ...sheet,
        id: `example-${index + 1}`,
        createdAt: now,
        updatedAt: now,
      }),
    );
    const transaction = database.transaction(STORE_NAME, "readwrite");
    for (const character of characters) {
      transaction.objectStore(STORE_NAME).put(character);
    }
    await transactionDone(transaction);
    writeBrowserStorage(SEED_KEY, "yes");
  }
  return normalizeLocalCharacters(characters);
}

export function normalizeLocalCharacters(
  characters: readonly unknown[],
): CharacterSheet[] {
  return characters.map((character) => normalizeSheet(character)).sort((left, right) =>
    String(right.updatedAt).localeCompare(String(left.updatedAt)),
  );
}

async function getCharacter(id: string) {
  const database = await openDatabase();
  const value = await request<CharacterSheet | undefined>(
    database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id),
  );
  return value ? normalizeSheet(value) : null;
}

async function putCharacter(character: CharacterSheet) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).put(character);
  await transactionDone(transaction);
}

async function deleteCharacter(id: string) {
  await deleteStoredValue(STORE_NAME, id);
}

async function listCampaigns() {
  const database = await openDatabase();
  const values = await request<unknown[]>(
    database
      .transaction(CAMPAIGN_STORE_NAME, "readonly")
      .objectStore(CAMPAIGN_STORE_NAME)
      .getAll(),
  );
  return values
    .map(normalizeCampaign)
    .sort((left, right) =>
      String(right.updatedAt).localeCompare(String(left.updatedAt)),
    );
}

async function getCampaign(id: string) {
  const value = await getStoredValue<Campaign>(CAMPAIGN_STORE_NAME, id);
  return value ? normalizeCampaign(value) : null;
}

async function putCampaign(campaign: Campaign) {
  await putStoredValue(CAMPAIGN_STORE_NAME, campaign);
}

async function recordLocalRevision(sheet: CharacterSheet) {
  const revisions = await listCharacterRevisions(sheet.id);
  const next = createCharacterRevision(sheet, "Versão anterior ao salvamento");
  const merged = addCharacterRevision(revisions, next);
  if (merged.length === revisions.length && merged[0]?.id === revisions[0]?.id) {
    return;
  }
  const database = await openDatabase();
  const transaction = database.transaction(REVISION_STORE_NAME, "readwrite");
  const store = transaction.objectStore(REVISION_STORE_NAME);
  store.put(next);
  const retained = new Set(merged.map((entry) => entry.id));
  for (const revision of revisions) {
    if (!retained.has(revision.id)) store.delete(revision.id);
  }
  await transactionDone(transaction);
}

async function listCharacterRevisions(characterId: string) {
  const database = await openDatabase();
  const values = await request<CharacterRevision[]>(
    database
      .transaction(REVISION_STORE_NAME, "readonly")
      .objectStore(REVISION_STORE_NAME)
      .getAll(),
  );
  return values
    .filter((entry) => entry.characterId === characterId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

async function deleteLocalRevisions(characterId: string) {
  const revisions = await listCharacterRevisions(characterId);
  if (!revisions.length) return;
  const database = await openDatabase();
  const transaction = database.transaction(REVISION_STORE_NAME, "readwrite");
  const store = transaction.objectStore(REVISION_STORE_NAME);
  for (const revision of revisions) store.delete(revision.id);
  await transactionDone(transaction);
}

async function getStoredValue<T>(storeName: string, id: string) {
  const database = await openDatabase();
  return request<T | undefined>(
    database.transaction(storeName, "readonly").objectStore(storeName).get(id),
  );
}

async function putStoredValue(storeName: string, value: unknown) {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, "readwrite");
  transaction.objectStore(storeName).put(value);
  await transactionDone(transaction);
}

async function deleteStoredValue(storeName: string, id: string) {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, "readwrite");
  transaction.objectStore(storeName).delete(id);
  await transactionDone(transaction);
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const open = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains(STORE_NAME)) {
        open.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!open.result.objectStoreNames.contains(CAMPAIGN_STORE_NAME)) {
        open.result.createObjectStore(CAMPAIGN_STORE_NAME, { keyPath: "id" });
      }
      if (!open.result.objectStoreNames.contains(REVISION_STORE_NAME)) {
        open.result.createObjectStore(REVISION_STORE_NAME, { keyPath: "id" });
      }
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
}

function request<T>(value: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error);
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function json(value: unknown, status = 200) {
  return Response.json(value, { status });
}
