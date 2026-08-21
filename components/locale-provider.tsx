"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  APP_LANGUAGE_KEY,
  LEGACY_LANGUAGE_KEY,
  translateUi,
  type AppLanguage,
} from "../lib/localization";
import {
  translateMessage,
  type MessageKey,
  type MessageVariables,
} from "../lib/messages";
import {
  readBrowserStorage,
  writeBrowserStorage,
} from "../lib/browser-storage";

type LocaleContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (value: string) => string;
  m: (key: MessageKey, variables?: MessageVariables) => string;
};

const LocaleContext = createContext<LocaleContextValue>({
  language: "pt",
  setLanguage: () => undefined,
  t: (value) => value,
  m: (key) => translateMessage(key, "pt"),
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("pt");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored =
        readBrowserStorage(APP_LANGUAGE_KEY) ??
        readBrowserStorage(LEGACY_LANGUAGE_KEY);
      if (stored === "en") setLanguageState("en");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "pt" ? "pt-BR" : "en";
    document.documentElement.dataset.language = language;
  }, [language]);

  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next);
    writeBrowserStorage(APP_LANGUAGE_KEY, next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      language,
      setLanguage,
      t: (text) => translateUi(text, language),
      m: (key, variables) => translateMessage(key, language, variables),
    }),
    [language, setLanguage],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
