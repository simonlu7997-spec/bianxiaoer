import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations, LANGS, DEFAULT_LANG, type Lang } from "./translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (code: Lang) => void;
  t: (path: string) => string;
  tr: (path: string) => unknown;
  isZh: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: () => "",
  tr: () => null,
  isZh: true,
});

const STORAGE_KEY = "@bianxiaoer/lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && LANGS.some((l) => l.code === saved)) setLangState(saved as Lang);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const setLang = useCallback((code: Lang) => {
    setLangState(code);
    AsyncStorage.setItem(STORAGE_KEY, code).catch(() => {});
  }, []);

  const t = useCallback(
    (path: string) => {
      const keys = path.split(".");
      let node: unknown = (translations as Record<string, unknown>)[lang];
      for (const k of keys) {
        if (node == null) return path;
        node = (node as Record<string, unknown>)[k];
      }
      return typeof node === "string" ? node : path;
    },
    [lang]
  );

  // tr: 返回原始值（用于数组等非字符串词条）
  const tr = useCallback(
    (path: string) => {
      const keys = path.split(".");
      let node: unknown = (translations as Record<string, unknown>)[lang];
      for (const k of keys) {
        if (node == null) return null;
        node = (node as Record<string, unknown>)[k];
      }
      return node ?? null;
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, t, tr, isZh: lang === "zh" }),
    [lang, setLang, t, tr]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
