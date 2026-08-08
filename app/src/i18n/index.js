import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, LANGS, DEFAULT_LANG } from './translations';

const LanguageContext = createContext({ lang: DEFAULT_LANG, setLang: () => {}, t: () => '', tr: () => null, isZh: true });

const STORAGE_KEY = '@bianxiaoer/lang';

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANG);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && LANGS.some((l) => l.code === saved)) setLangState(saved);
      } catch (e) {}
    })();
  }, []);

  const setLang = useCallback((code) => {
    setLangState(code);
    AsyncStorage.setItem(STORAGE_KEY, code).catch(() => {});
  }, []);

  const t = useCallback(
    (path) => {
      const keys = path.split('.');
      let node = translations[lang];
      for (const k of keys) {
        if (node == null) return path;
        node = node[k];
      }
      return typeof node === 'string' ? node : path;
    },
    [lang]
  );

  // tr: 返回原始值（用于数组等非字符串词条）
  const tr = useCallback((path) => {
    const keys = path.split('.');
    let node = translations[lang];
    for (const k of keys) {
      if (node == null) return null;
      node = node[k];
    }
    return node ?? null;
  }, [lang]);

  const value = { lang, setLang, t, tr, isZh: lang === 'zh' };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
