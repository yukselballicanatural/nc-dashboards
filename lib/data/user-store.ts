"use client";

import { useSyncExternalStore } from "react";

/**
 * Yönetilen kullanıcı deposu (localStorage).
 * Admin panelinden oluşturulan kullanıcı adı/şifre/rol kayıtları burada tutulur.
 * Giriş ekranı (LoginScreen) bu depoyu okuyup demo hesaplara ek olarak bu
 * hesaplarla da girişe izin verir. `useSyncExternalStore` ile hydration-güvenli.
 *
 * NOT: Bu bir mock/demo kimlik katmanıdır — şifreler tarayıcıda düz metin
 * saklanır. Gerçek üründe kimlik doğrulama backend'de yapılmalıdır.
 */

const KEY = "nc_users_v1";
const EVENT = "nc-users-change";

export type UserRole = "agent" | "leader" | "region" | "admin";

export interface ManagedUser {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  team: string;
  createdAt: number;
  /**
   * Dolu ise bu hesap organizasyondan (Excel/seed) türetilmiş bir kişiye
   * "giriş yetkisi verilerek" oluşturulmuştur. Değeri o kişinin dizin
   * kimliğidir; dizinde çifte kayıt olmaması için eşleştirmede kullanılır.
   */
  sourceId?: string;
}

/** Rol → yönlendirilecek panel yolu. */
export const ROLE_ROUTE: Record<UserRole, string> = {
  agent: "/agent",
  leader: "/team-leader",
  region: "/region-manager",
  admin: "/admin",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  agent: "Danışman",
  leader: "Takım Lideri",
  region: "Bölge Müdürü",
  admin: "Admin",
};

let cache: { raw: string | null; value: ManagedUser[] } = { raw: null, value: [] };
const EMPTY: ManagedUser[] = [];

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch (err) {
    console.error("user-store: localStorage okunamadı", err);
    return null;
  }
}

function readAll(): ManagedUser[] {
  const raw = readRaw();
  if (raw === cache.raw) return cache.value;
  let value: ManagedUser[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) value = parsed as ManagedUser[];
    } catch (err) {
      console.error("user-store: veri çözümlenemedi", err);
      value = [];
    }
  }
  cache = { raw, value };
  return value;
}

function getSnapshot(): ManagedUser[] {
  return readAll();
}

function getServerSnapshot(): ManagedUser[] {
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

function persist(list: ManagedUser[]): void {
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVENT));
}

function genId(): string {
  return `user-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** Rezerve demo kullanıcı adları — yeni kullanıcı bunları alamaz. */
export const RESERVED_USERNAMES = ["agent", "takımlideri", "bolgemuduru", "admin"];

export interface AddUserInput {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  team: string;
  /** Organizasyondan gelen bir kişiye giriş yetkisi verilirken o kişinin dizin kimliği. */
  sourceId?: string;
}

/**
 * Yeni kullanıcı ekler. Kullanıcı adı benzersiz olmalı (demo hesapları ve
 * mevcut kayıtlar dahil). Başarısızsa hata fırlatır.
 */
export function addUser(input: AddUserInput): ManagedUser {
  const username = input.username.trim().toLocaleLowerCase("tr-TR");
  const password = input.password.trim();
  const name = input.name.trim();
  const team = input.team.trim();

  if (!username || !password || !name) {
    throw new Error("Kullanıcı adı, şifre ve ad-soyad zorunludur.");
  }
  if (password.length < 4) {
    throw new Error("Şifre en az 4 karakter olmalıdır.");
  }
  if (RESERVED_USERNAMES.includes(username)) {
    throw new Error(`"${username}" demo hesabı için ayrılmış bir kullanıcı adı.`);
  }
  const existing = readAll();
  if (existing.some((u) => u.username === username)) {
    throw new Error(`"${username}" kullanıcı adı zaten kullanımda.`);
  }

  const user: ManagedUser = {
    id: genId(),
    username,
    password,
    name,
    role: input.role,
    team: team || "—",
    createdAt: Date.now(),
    sourceId: input.sourceId,
  };
  try {
    persist([user, ...existing]);
  } catch (err) {
    console.error("user-store: kullanıcı kaydedilemedi", err);
    throw new Error("Kullanıcı tarayıcı deposuna kaydedilemedi.");
  }
  return user;
}

export interface UpdateUserInput {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  team: string;
}

/**
 * Var olan kullanıcıyı günceller (ad, kullanıcı adı, şifre, rol, takım).
 * Kullanıcı adı benzersizliği kendisi hariç kontrol edilir. Başarısızsa hata
 * fırlatır.
 */
export function updateUser(id: string, input: UpdateUserInput): ManagedUser {
  const username = input.username.trim().toLocaleLowerCase("tr-TR");
  const password = input.password.trim();
  const name = input.name.trim();
  const team = input.team.trim();

  if (!username || !password || !name) {
    throw new Error("Kullanıcı adı, şifre ve ad-soyad zorunludur.");
  }
  if (password.length < 4) {
    throw new Error("Şifre en az 4 karakter olmalıdır.");
  }
  if (RESERVED_USERNAMES.includes(username)) {
    throw new Error(`"${username}" demo hesabı için ayrılmış bir kullanıcı adı.`);
  }
  const existing = readAll();
  const current = existing.find((u) => u.id === id);
  if (!current) {
    throw new Error("Güncellenecek kullanıcı bulunamadı.");
  }
  if (existing.some((u) => u.id !== id && u.username === username)) {
    throw new Error(`"${username}" kullanıcı adı zaten kullanımda.`);
  }

  const updated: ManagedUser = {
    ...current,
    username,
    password,
    name,
    role: input.role,
    team: team || "—",
  };
  try {
    persist(existing.map((u) => (u.id === id ? updated : u)));
  } catch (err) {
    console.error("user-store: kullanıcı güncellenemedi", err);
    throw new Error("Kullanıcı güncellenemedi.");
  }
  return updated;
}

/** Rastgele geçici şifre üretir (şifre sıfırlama için). */
export function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/** Kullanıcı siler. */
export function removeUser(id: string): void {
  try {
    persist(readAll().filter((u) => u.id !== id));
  } catch (err) {
    console.error("user-store: kullanıcı silinemedi", err);
  }
}

/**
 * Kullanıcı adı + şifre ile eşleşen yönetilen kullanıcıyı döndürür (giriş için).
 * Hook değil — LoginScreen submit anında senkron çağırır.
 */
export function findManagedUser(username: string, password: string): ManagedUser | null {
  const uname = username.trim().toLocaleLowerCase("tr-TR");
  try {
    return readAll().find((u) => u.username === uname && u.password === password) ?? null;
  } catch (err) {
    console.error("user-store: kullanıcı aranamadı", err);
    return null;
  }
}

/** Yönetilen kullanıcı listesi. */
export function useManagedUsers(): ManagedUser[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
