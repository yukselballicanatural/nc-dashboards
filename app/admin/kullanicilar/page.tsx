import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { UsersManager } from "@/components/admin/users/UsersManager";

export const metadata: Metadata = {
  title: "Natural Clinic — Kullanıcılar",
};

/**
 * Kullanıcılar — Admin "Kullanıcı Ekle" ile giriş yetkili kullanıcı oluşturur,
 * satır içinden düzenler/siler; oluşturulan kullanıcılar organizasyondaki
 * herkesle aynı listede görünür.
 */
export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-fg"><T tr="Kullanıcılar" en="Users" /></h1>
        <p className="font-body text-[13px] text-fg-secondary">
          <T
            tr="Giriş yetkili kullanıcılar oluştur, düzenle ve organizasyondaki herkesi tek listede gör."
            en="Create and edit users with login access, and see everyone in the organization in a single list."
          />
        </p>
      </div>

      <UsersManager />
    </div>
  );
}
