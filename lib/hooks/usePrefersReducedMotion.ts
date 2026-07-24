"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void): () => void {
  const mediaQuery = window.matchMedia(QUERY);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

/** SSR'de animasyonlar varsayılan davranışta kalır (false). */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Kullanıcının "hareketi azalt" tercihini merkezi olarak okur — CLAUDE.md 3.4/7.
 * Bileşenler bu hook ile count-up, stagger, grafik çizim gibi JS tabanlı
 * animasyonları koşullar (true ise anında/sıfır süre).
 *
 * CSS tabanlı animasyonlar ayrıca globals.css'teki @media bloğuyla korunur;
 * bu hook JS ile kontrol edilen animasyonlar için gereklidir.
 * useSyncExternalStore: harici (tarayıcı) state'e abone olmanın React 19
 * idiomatik yolu — effect içinde setState gerektirmez.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
