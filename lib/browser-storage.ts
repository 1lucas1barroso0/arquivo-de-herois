function getBrowserStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readBrowserStorage(key: string) {
  try {
    return getBrowserStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeBrowserStorage(key: string, value: string) {
  try {
    const storage = getBrowserStorage();
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeBrowserStorage(...keys: string[]) {
  try {
    const storage = getBrowserStorage();
    if (!storage) return false;
    for (const key of keys) storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function listBrowserStorageKeys() {
  try {
    const storage = getBrowserStorage();
    if (!storage) return [];
    return Array.from(
      { length: storage.length },
      (_, index) => storage.key(index),
    ).filter((key): key is string => Boolean(key));
  } catch {
    return [];
  }
}
