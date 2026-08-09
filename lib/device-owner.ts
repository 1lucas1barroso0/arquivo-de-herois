export const DEVICE_OWNER_KEY = "arquivo-de-herois:dispositivo:v2";
export const OPEN_CHARACTER_KEY = "arquivo-de-herois:abrir-personagem:v2";
export const LEGACY_OPEN_CHARACTER_KEY = "mm4e-open-character";
const LEGACY_DEVICE_OWNER_KEY = "mm4e-archive-owner";

export function getDeviceOwnerId() {
  if (typeof window === "undefined") return "server";
  let value =
    window.localStorage.getItem(DEVICE_OWNER_KEY) ??
    window.localStorage.getItem(LEGACY_DEVICE_OWNER_KEY);
  if (!value) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  window.localStorage.setItem(DEVICE_OWNER_KEY, value);
  return value;
}
