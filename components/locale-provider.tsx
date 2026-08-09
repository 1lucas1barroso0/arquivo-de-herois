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

type LocaleContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (value: string) => string;
};

const LocaleContext = createContext<LocaleContextValue>({
  language: "pt",
  setLanguage: () => undefined,
  t: (value) => value,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("pt");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored =
        window.localStorage.getItem(APP_LANGUAGE_KEY) ??
        window.localStorage.getItem(LEGACY_LANGUAGE_KEY);
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
    window.localStorage.setItem(APP_LANGUAGE_KEY, next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      language,
      setLanguage,
      t: (text) => translateUi(text, language),
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
