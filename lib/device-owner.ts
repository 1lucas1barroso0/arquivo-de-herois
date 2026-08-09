import {
  readBrowserStorage,
  writeBrowserStorage,
} from "./browser-storage";

export const DEVICE_OWNER_KEY = "arquivo-de-herois:dispositivo:v2";
export const OPEN_CHARACTER_KEY = "arquivo-de-herois:abrir-personagem:v2";
export const LEGACY_OPEN_CHARACTER_KEY = "mm4e-open-character";
const LEGACY_DEVICE_OWNER_KEY = "mm4e-archive-owner";
let sessionOwnerId = "";

export function getDeviceOwnerId() {
  if (typeof window === "undefined") return "server";
  let value =
    readBrowserStorage(DEVICE_OWNER_KEY) ??
    readBrowserStorage(LEGACY_DEVICE_OWNER_KEY) ??
    sessionOwnerId;
  if (!value) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  sessionOwnerId = value;
  writeBrowserStorage(DEVICE_OWNER_KEY, value);
  return value;
}
