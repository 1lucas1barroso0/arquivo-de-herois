import type { CharacterSheet } from "./character";
import {
  createPortablePackage,
  unwrapPortableValue,
} from "./portable";

const GZIP_PREFIX = "g.";
const JSON_PREFIX = "j.";

export async function createPortableShareUrl(
  sheet: CharacterSheet,
  origin: string,
) {
  const payload = await encodePortableShare(sheet);
  return `${origin.replace(/\/$/, "")}/share#${payload}`;
}

export async function parsePortableShare(
  value: string,
): Promise<CharacterSheet | null> {
  const payload = extractPortableSharePayload(value);
  if (!payload) return null;
  const json = await decodePortablePayload(payload);
  return unwrapPortableValue(JSON.parse(json));
}

export function extractPortableSharePayload(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith(GZIP_PREFIX) || trimmed.startsWith(JSON_PREFIX)) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    const hash = decodeURIComponent(url.hash.slice(1));
    return hash.startsWith(GZIP_PREFIX) || hash.startsWith(JSON_PREFIX)
      ? hash
      : null;
  } catch {
    return null;
  }
}

async function encodePortableShare(sheet: CharacterSheet) {
  const json = JSON.stringify(createPortablePackage(sheet));
  const bytes = new TextEncoder().encode(json);
  if (typeof CompressionStream !== "undefined") {
    const compressed = await streamBytes(
      new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip")),
    );
    return `${GZIP_PREFIX}${bytesToBase64Url(compressed)}`;
  }
  return `${JSON_PREFIX}${bytesToBase64Url(bytes)}`;
}

async function decodePortablePayload(payload: string) {
  const encoded = payload.slice(2);
  const bytes = base64UrlToBytes(encoded);
  if (payload.startsWith(GZIP_PREFIX)) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("Este navegador não consegue abrir o link comprimido.");
    }
    const decompressed = await streamBytes(
      new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
    );
    return new TextDecoder().decode(decompressed);
  }
  return new TextDecoder().decode(bytes);
}

async function streamBytes(stream: ReadableStream<Uint8Array>) {
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(
    normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="),
  );
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
