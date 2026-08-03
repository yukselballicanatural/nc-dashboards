"use client";

import { useState, useCallback } from "react";
import { UserPlus } from "lucide-react";
import { useLang } from "@/components/i18n/LanguageProvider";
import { UserDirectory, type GrantTarget } from "@/components/admin/users/UserDirectory";
import { UserFormModal, type UserPrefill } from "@/components/admin/users/UserFormModal";
import { generatePassword, type ManagedUser } from "@/lib/data/user-store";

/**
 * Kullanıcı yönetimi orkestratörü — "Kullanıcı Ekle" butonu + oluştur/düzenle/
 * giriş-yetkisi-ver modalı + birleşik kullanıcı dizini. Üç mod aynı modalı
 * kullanır: editing dolu → düzenle; prefill dolu → giriş yetkisi ver; ikisi de
 * boş → yeni kullanıcı.
 */

/** Ad Soyad → kullanıcı adı önerisi (Türkçe karakterler sadeleştirilir). */
function slugUsername(name: string): string {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u",
  };
  return name
    .trim()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, "")
    .trim()
    .replace(/\s+/g, ".");
}

export function UsersManager() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [prefill, setPrefill] = useState<UserPrefill | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setPrefill(null);
    setOpen(true);
  }, []);

  const openEdit = useCallback((user: ManagedUser) => {
    setPrefill(null);
    setEditing(user);
    setOpen(true);
  }, []);

  const openGrant = useCallback((target: GrantTarget) => {
    setEditing(null);
    setPrefill({
      name: target.name,
      username: slugUsername(target.name),
      password: generatePassword(),
      team: target.team,
      role: target.role,
      sourceId: target.sourceId,
    });
    setOpen(true);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="flex h-10 items-center justify-center gap-2 rounded-control bg-brand px-4 font-body text-[13px] font-semibold text-white shadow-card transition-[filter] hover:brightness-110"
        >
          <UserPlus size={16} />
          {t("Kullanıcı Ekle", "Add User")}
        </button>
      </div>

      <UserDirectory onEdit={openEdit} onGrant={openGrant} />

      <UserFormModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        prefill={prefill}
      />
    </div>
  );
}
