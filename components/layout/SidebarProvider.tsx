"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

interface SidebarContextValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
  /**
   * Mobil/tablet çekmecesi açık mı. Masaüstünde kenar çubuğu her zaman
   * görünür olduğu için bu değer yalnızca `lg` altındaki kırılımda anlam
   * taşır. KALICI DEĞİL (localStorage'a yazılmaz): menünün sayfa açılışında
   * kapalı olması beklenen davranıştır, aksi hâlde mobilde içeriği kapatarak
   * açılırdı.
   */
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  toggleMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const KEY = "nc_sidebar_collapsed_v1";
const EVENT = "nc-sidebar-collapse-change";

/**
 * Sol kenar çubuğu açık/kapalı state'i — ThemeProvider ile aynı desen
 * (localStorage tabanlı harici depo + useSyncExternalStore), böylece seçim
 * sayfa geçişlerinde ve yeniden yüklemede kalıcı olur.
 */
function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch (err) {
    console.error("SidebarProvider: kenar çubuğu tercihi okunamadı", err);
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
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

function persistCollapsed(value: boolean): void {
  try {
    window.localStorage.setItem(KEY, value ? "1" : "0");
    window.dispatchEvent(new Event(EVENT));
  } catch (err) {
    console.error("SidebarProvider: kenar çubuğu tercihi kaydedilemedi", err);
  }
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, getServerSnapshot);
  const [mobileOpen, setMobileOpen] = useState(false);

  const setCollapsed = useCallback((value: boolean) => {
    persistCollapsed(value);
  }, []);

  const toggleCollapsed = useCallback(() => {
    persistCollapsed(!collapsed);
  }, [collapsed]);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  return (
    <SidebarContext.Provider
      value={{ collapsed, toggleCollapsed, setCollapsed, mobileOpen, setMobileOpen, toggleMobile }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

/** Kenar çubuğu state'ine erişim — SidebarProvider dışında çağrılırsa açık hata verir. */
export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar, SidebarProvider içinde kullanılmalıdır.");
  }
  return ctx;
}
