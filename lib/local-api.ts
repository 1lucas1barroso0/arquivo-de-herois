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

const DATABASE_NAME = "arquivo-de-herois";
const STORE_NAME = "personagens";
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

  const shareMatch = url.pathname.match(/^\/api\/characters\/([^/]+)\/share$/);
  if (shareMatch && method === "POST") {
    const character = await getCharacter(decodeURIComponent(shareMatch[1]));
    if (!character) return json({ error: "Ficha não encontrada." }, 404);
    const portableUrl = await createPortableShareUrl(
      character,
      window.location.origin,
    );
    return json({ portableUrl, path: portableUrl, token: null });
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
      await putCharacter(character);
      return json({ character });
    }
    if (method === "DELETE") {
      await deleteCharacter(id);
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
  if (typeof body !== "string") return {} as { sheet?: unknown };
  try {
    return JSON.parse(body) as { sheet?: unknown };
  } catch {
    return {} as { sheet?: unknown };
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
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).delete(id);
  await transactionDone(transaction);
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const open = indexedDB.open(DATABASE_NAME, 1);
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains(STORE_NAME)) {
        open.result.createObjectStore(STORE_NAME, { keyPath: "id" });
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
