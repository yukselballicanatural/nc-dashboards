"use client";

import { useSyncExternalStore } from "react";

/**
 * Oturum açan kullanıcının kimliği (localStorage).
 * Giriş ekranı başarılı girişte buraya kimliği yazar; paneller (ProfileChip,
 * hero başlıkları) bu kimliği okur. Böylece admin panelinden oluşturulan bir
 * kullanıcı, kendi adıyla görünür — sabit demo kişisinin (ör. "Deniz Aksoy")
 * kimliğiyle DEĞİL. Veri kaynağı (seed/Excel) rolüne göre paylaşımlıdır ama
 * gösterilen KİMLİK oturuma özeldir.
 *
 * `useSyncExternalStore` ile hydration-güvenli okunur (SSR + ilk render null).
 */

const KEY = "nc_session_user_v1";
const EVENT = "nc-session-change";

export interface SessionUser {
  name: string;
  role: string;
  team: string;
  location: string;
}

let cache: { raw: string | null; value: SessionUser | null } = { raw: null, value: null };

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch (err) {
    console.error("session-store: localStorage okunamadı", err);
    return null;
  }
}

function getSnapshot(): SessionUser | null {
  const raw = readRaw();
  if (raw === cache.raw) return cache.value;
  let value: SessionUser | null = null;
  if (raw) {
    try {
      value = JSON.parse(raw) as SessionUser;
    } catch (err) {
      console.error("session-store: kimlik çözümlenemedi", err);
      value = null;
    }
  }
  cache = { raw, value };
  return value;
}

function getServerSnapshot(): SessionUser | null {
  return null;
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

export function setSessionUser(user: SessionUser): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(user));
    window.dispatchEvent(new Event(EVENT));
  } catch (err) {
    console.error("session-store: kimlik kaydedilemedi", err);
  }
}

export function clearSessionUser(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch (err) {
    console.error("session-store: kimlik temizlenemedi", err);
  }
}

/** Aktif oturum kimliği (yoksa null → panel varsayılan profili kullanır). */
export function useSessionUser(): SessionUser | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Oturum kimliği varsa onu, yoksa panelin varsayılan profilini döndürür. */
export function useIdentity(fallback: {
  name: string;
  role: string;
  team: string;
  location?: string;
}): SessionUser {
  return useSessionUser() ?? { ...fallback, location: fallback.location ?? "İstanbul" };
}
