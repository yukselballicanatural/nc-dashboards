"use client";

import { useSyncExternalStore } from "react";
import type { RegionTeamRecord } from "@/lib/mock/region-data";

/**
 * Yüklenen Excel veri setinin tarayıcı deposu (localStorage).
 * `useSyncExternalStore` ile okunur: SSR + ilk client render'da null döner
 * (seed'e düşülür), sonra localStorage'daki veriye geçilir — hydration
 * uyumsuzluğu olmaz. Değişiklik same-tab custom event + cross-tab storage
 * event ile yayılır.
 */

const KEY = "nc_dataset_v1";
const EVENT = "nc-dataset-change";

export interface StoredDataset {
  uploadedAt: number;
  fileName: string;
  stats: { teams: number; agents: number; leads: number };
  teams: RegionTeamRecord[];
}

// getSnapshot'ın kararlı referans döndürmesi için raw string'e göre önbellek.
let cache: { raw: string | null; value: StoredDataset | null } = { raw: null, value: null };

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch (err) {
    console.error("dataset-store: localStorage okunamadı", err);
    return null;
  }
}

function getSnapshot(): StoredDataset | null {
  const raw = readRaw();
  if (raw === cache.raw) return cache.value;
  let value: StoredDataset | null = null;
  if (raw) {
    try {
      value = JSON.parse(raw) as StoredDataset;
    } catch (err) {
      console.error("dataset-store: veri çözümlenemedi, seed'e düşülüyor", err);
      value = null;
    }
  }
  cache = { raw, value };
  return value;
}

function getServerSnapshot(): StoredDataset | null {
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

export function setDataset(payload: StoredDataset): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event(EVENT));
  } catch (err) {
    console.error("dataset-store: veri kaydedilemedi", err);
    throw new Error("Veri tarayıcı deposuna kaydedilemedi (dosya çok büyük olabilir).");
  }
}

export function clearDataset(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch (err) {
    console.error("dataset-store: veri silinemedi", err);
  }
}

/** Aktif yüklü veri seti (yoksa null → seed kullanılır). */
export function useDataset(): StoredDataset | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
