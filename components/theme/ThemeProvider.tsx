"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Geçiş sınıfının açık kalacağı süre — globals.css'teki 280ms ile eşleşir. */
const THEME_TRANSITION_MS = 280;

const KEY = "nc_theme_v1";
const EVENT = "nc-theme-change";

/**
 * Açık/koyu tema state'i — CLAUDE.md 3.1. Diğer depolarla (dil/oturum) aynı
 * desen: localStorage tabanlı harici depo + `useSyncExternalStore`. Böylece
 * seçim kalıcı (yeniden yükleme/sayfa geçişinde korunur — koyu tema ve beyaz
 * logo sabit kalır) ve hydration güvenli (SSR + ilk render "light", sonra
 * kayıtlı tercih). Tema değişiminde <html>'e geçici .theme-transition sınıfı
 * eklenir ki renk geçişleri 280ms yumuşak crossfade olsun.
 */
function readTheme(): Theme {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw === "dark" || raw === "light" ? raw : "light";
  } catch (err) {
    console.error("ThemeProvider: tema tercihi okunamadı", err);
    return "light";
  }
}

function getServerSnapshot(): Theme {
  return "light";
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

function persistTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(KEY, theme);
    window.dispatchEvent(new Event(EVENT));
  } catch (err) {
    console.error("ThemeProvider: tema tercihi kaydedilemedi", err);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerSnapshot);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tema değiştiğinde <html data-theme> güncelle.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const applyTransition = useCallback(() => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current);
    }
    transitionTimer.current = setTimeout(() => {
      root.classList.remove("theme-transition");
    }, THEME_TRANSITION_MS);
  }, []);

  // Bileşen kaldırılırken bekleyen timer'ı temizle.
  useEffect(() => {
    return () => {
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
      }
    };
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      applyTransition();
      persistTheme(next);
    },
    [applyTransition],
  );

  const toggleTheme = useCallback(() => {
    applyTransition();
    persistTheme(theme === "light" ? "dark" : "light");
  }, [applyTransition, theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Tema state'ine erişim — ThemeProvider dışında çağrılırsa açık hata verir. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme, ThemeProvider içinde kullanılmalıdır.");
  }
  return ctx;
}
