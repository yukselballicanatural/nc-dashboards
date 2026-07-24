"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { DEFAULT_LANG, LANG_STORAGE_KEY, type Lang } from "@/lib/i18n/core";

/**
 * Dil (TR/EN) state'i. Diğer depolarla (dataset/user/session) aynı desen:
 * localStorage tabanlı harici depo + `useSyncExternalStore`. Böylece hydration
 * güvenli (SSR + ilk render "tr", sonra kayıtlı tercih) ve efekt içinde setState
 * gerektirmez. Varsayılan Türkçe; seçim localStorage'a yazılır ve aynı/farklı
 * sekmelere event ile yayılır.
 */

const EVENT = "nc-lang-change";

function readLang(): Lang {
  try {
    const raw = window.localStorage.getItem(LANG_STORAGE_KEY);
    return raw === "en" || raw === "tr" ? raw : DEFAULT_LANG;
  } catch (err) {
    console.error("LanguageProvider: dil tercihi okunamadı", err);
    return DEFAULT_LANG;
  }
}

function getServerSnapshot(): Lang {
  return DEFAULT_LANG;
}

function subscribe(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function persistLang(lang: Lang): void {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    window.dispatchEvent(new Event(EVENT));
  } catch (err) {
    console.error("LanguageProvider: dil tercihi kaydedilemedi", err);
  }
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  /** Yerinde iki dilli metin — aktif dile göre birini döndürür. */
  t: (tr: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readLang, getServerSnapshot);

  // <html lang> özniteliğini güncel tut (erişilebilirlik/SEO).
  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => persistLang(next), []);
  const toggleLang = useCallback(() => persistLang(lang === "tr" ? "en" : "tr"), [lang]);
  const t = useCallback((tr: string, en: string) => (lang === "en" ? en : tr), [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, toggleLang, t }),
    [lang, setLang, toggleLang, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Dil state'ine erişim — LanguageProvider dışında çağrılırsa açık hata verir. */
export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLang, LanguageProvider içinde kullanılmalıdır.");
  }
  return ctx;
}
