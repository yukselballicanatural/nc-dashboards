"use client";

import { useSyncExternalStore } from "react";

/**
 * Sistem aktivite log deposu (localStorage).
 * Admin panelinde yapılan kritik işlemler (Excel yayınla/sıfırla, kullanıcı
 * ekle/sil, giriş denemeleri) buraya yazılır. `useSyncExternalStore` ile
 * hydration-güvenli okunur: SSR + ilk render'da boş dizi, sonra localStorage.
 * Aynı sekmede custom event, sekmeler arası storage event ile yayılır.
 */

const KEY = "nc_logs_v1";
const EVENT = "nc-logs-change";
const MAX_ENTRIES = 300;

export type LogType =
  | "upload"
  | "reset"
  | "user-add"
  | "user-remove"
  | "login"
  | "auth-fail";

export interface LogEntry {
  id: string;
  ts: number;
  type: LogType;
  message: string;
  actor: string;
}

let cache: { raw: string | null; value: LogEntry[] } = { raw: null, value: [] };
const EMPTY: LogEntry[] = [];

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch (err) {
    console.error("log-store: localStorage okunamadı", err);
    return null;
  }
}

function readAll(): LogEntry[] {
  const raw = readRaw();
  if (raw === cache.raw) return cache.value;
  let value: LogEntry[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) value = parsed as LogEntry[];
    } catch (err) {
      console.error("log-store: veri çözümlenemedi", err);
      value = [];
    }
  }
  cache = { raw, value };
  return value;
}

function getSnapshot(): LogEntry[] {
  return readAll();
}

function getServerSnapshot(): LogEntry[] {
  return EMPTY;
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

function genId(): string {
  return `log-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** Yeni bir log kaydı ekler (en yeni başa). Client-only. */
export function addLog(type: LogType, message: string, actor = "Sistem Yöneticisi"): void {
  try {
    const entry: LogEntry = { id: genId(), ts: Date.now(), type, message, actor };
    const next = [entry, ...readAll()].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  } catch (err) {
    console.error("log-store: log eklenemedi", err);
  }
}

/** Tüm logları temizler. */
export function clearLogs(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch (err) {
    console.error("log-store: loglar temizlenemedi", err);
  }
}

/** Aktif log kayıtları (en yeni başta). */
export function useLogs(): LogEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
