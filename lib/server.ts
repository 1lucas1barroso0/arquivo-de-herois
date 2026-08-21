import type { CharacterSheet } from "./character";
import { normalizeSheet } from "./character";
import {
  LOCAL_STORAGE_MODE,
  STORAGE_MODE_HEADER,
  StorageUnavailableError,
} from "./storage-mode";

const MAX_TEXT_LENGTH = 500_000;

export class PublicRequestError extends Error {}

export async function getOwnerId(request: Request) {
  const authenticatedEmail = request.headers.get("x-authenticated-user-email");
  const deviceId =
    request.headers.get("x-arquivo-owner-id") ??
    request.headers.get("x-mm-owner-id");
  const source = authenticatedEmail
    ? `account:${authenticatedEmail.trim().toLowerCase()}`
    : `device:${(deviceId || "guest").slice(0, 180)}`;

  const bytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const value = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `owner_${value.slice(0, 40)}`;
}

export function parseSheetPayload(payload: unknown): CharacterSheet {
  if (!payload || typeof payload !== "object") {
    throw new PublicRequestError("A ficha enviada é inválida.");
  }

  const serialized = JSON.stringify(payload);
  if (serialized.length > MAX_TEXT_LENGTH) {
    throw new PublicRequestError("A ficha excede o limite de tamanho.");
  }

  const sheet = normalizeSheet(payload as Partial<CharacterSheet>);
  sheet.heroName = String(sheet.heroName || "Herói sem nome").slice(0, 120);
  sheet.civilName = String(sheet.civilName || "").slice(0, 120);
  sheet.concept = String(sheet.concept || "").slice(0, 300);
  sheet.powerLevel = clampInteger(sheet.powerLevel, 0, 30);
  sheet.customPointBudget = clampInteger(
    sheet.customPointBudget,
    0,
    10_000,
  );
  sheet.imageUrl = String(sheet.imageUrl || "").slice(0, 500);
  sheet.accent = /^#[0-9a-f]{6}$/i.test(sheet.accent)
    ? sheet.accent
    : "#ffd400";
  return sheet;
}

export function clampInteger(value: unknown, min: number, max: number) {
  const numeric = Math.round(Number(value) || 0);
  return Math.min(max, Math.max(min, numeric));
}

export function apiError(error: unknown, fallback = "Não foi possível concluir a operação.") {
  const storageUnavailable = error instanceof StorageUnavailableError;
  const message = storageUnavailable
    ? "A conexão persistente está indisponível. Seus dados locais permanecem seguros."
    : error instanceof PublicRequestError
      ? error.message
      : fallback;
  return Response.json(
    { error: message },
    {
      status: storageUnavailable ? 503 : 500,
      headers: {
        "Cache-Control": "no-store",
        ...(storageUnavailable
          ? { [STORAGE_MODE_HEADER]: LOCAL_STORAGE_MODE }
          : {}),
      },
    },
  );
}
