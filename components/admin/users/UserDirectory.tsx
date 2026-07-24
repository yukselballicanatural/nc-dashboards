"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck, Briefcase, Users, UserRound, Pencil, Trash2, KeyRound, UserPlus } from "lucide-react";
import { useActiveRegionRecords } from "@/lib/data/data-source";
import { useManagedUsers, removeUser, ROLE_LABEL, type ManagedUser, type UserRole } from "@/lib/data/user-store";
import { addLog } from "@/lib/data/log-store";
import { REGION_MANAGER_PROFILE } from "@/lib/mock/region-manager-profile";
import { formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/utils/cn";

/**
 * Kullanıcı dizini — Admin herkesi tek listede görür: organizasyondan türetilen
 * kişiler (Bölge Müdürü, Takım Liderleri, Danışmanlar) + admin panelinden
 * OLUŞTURULAN giriş yetkili kullanıcılar. Oluşturulan kullanıcılar "Giriş"
 * rozetiyle işaretlenir; satır içinden düzenle (kalem) / sil (çöp) yapılabilir.
 * Silmeden önce onay modalı çıkar.
 */

type RoleKind = "region" | "leader" | "agent" | "admin";
type RoleFilter = "all" | RoleKind;

interface DirectoryUser {
  id: string;
  name: string;
  role: string;
  roleKind: RoleKind;
  team: string;
  detail: string;
  /** Dolu ise admin panelinden oluşturulmuş giriş yetkili kullanıcı. */
  managed?: ManagedUser;
}

/** Organizasyondan gelen bir kişiye giriş yetkisi verirken taşınan hedef bilgisi. */
export interface GrantTarget {
  sourceId: string;
  name: string;
  team: string;
  role: UserRole;
}

const KIND_TO_GRANT_ROLE: Record<RoleKind, UserRole> = {
  region: "region",
  leader: "leader",
  agent: "agent",
  admin: "admin",
};

const ROLE_META: Record<RoleKind, { labelTr: string; labelEn: string; chip: string; icon: typeof Users }> = {
  region: { labelTr: "Bölge Müdürü", labelEn: "Region Manager", chip: "bg-brand/12 text-brand", icon: ShieldCheck },
  leader: { labelTr: "Takım Lideri", labelEn: "Team Leader", chip: "bg-indigo/12 text-indigo", icon: Briefcase },
  agent: { labelTr: "Danışman", labelEn: "Agent", chip: "bg-violet/12 text-violet", icon: UserRound },
  admin: { labelTr: "Admin", labelEn: "Admin", chip: "bg-amber/16 text-amber", icon: KeyRound },
};

const ROLE_TO_KIND: Record<UserRole, RoleKind> = {
  region: "region",
  leader: "leader",
  agent: "agent",
  admin: "admin",
};

const FILTERS: Array<{ key: RoleFilter; labelTr: string; labelEn: string }> = [
  { key: "all", labelTr: "Tümü", labelEn: "All" },
  { key: "region", labelTr: "Bölge Müdürü", labelEn: "Region Manager" },
  { key: "leader", labelTr: "Takım Liderleri", labelEn: "Team Leaders" },
  { key: "agent", labelTr: "Danışmanlar", labelEn: "Agents" },
  { key: "admin", labelTr: "Adminler", labelEn: "Admins" },
];

export function UserDirectory({
  onEdit,
  onGrant,
}: {
  onEdit?: (user: ManagedUser) => void;
  onGrant?: (target: GrantTarget) => void;
} = {}) {
  const { t } = useLang();
  const records = useActiveRegionRecords();
  const managed = useManagedUsers();
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<ManagedUser | null>(null);

  const users = useMemo<DirectoryUser[]>(() => {
    const list: DirectoryUser[] = [];
    // Giriş yetkisi verilmiş organizasyon kişilerinin kaynak kimlikleri — dizinde
    // çifte satır olmaması için org tarafında atlanır.
    const linkedSourceIds = new Set(managed.map((m) => m.sourceId).filter(Boolean));

    // 1) Oluşturulan (giriş yetkili) kullanıcılar — en üstte.
    for (const u of managed) {
      list.push({
        id: u.id,
        name: u.name,
        role: ROLE_LABEL[u.role],
        roleKind: ROLE_TO_KIND[u.role],
        team: u.team,
        detail: `@${u.username}`,
        managed: u,
      });
    }

    // 2) Organizasyondan türetilen kişiler (mock/Excel verisi). Giriş yetkisi
    //    verilmiş olanlar (linkedSourceIds) atlanır — üstte hesabı zaten var.
    if (!linkedSourceIds.has(REGION_MANAGER_PROFILE.id)) {
      list.push({
        id: REGION_MANAGER_PROFILE.id,
        name: REGION_MANAGER_PROFILE.name,
        role: REGION_MANAGER_PROFILE.role,
        roleKind: "region",
        team: REGION_MANAGER_PROFILE.team,
        detail: `${records.length} takım · ${records.reduce((s, t) => s + t.agents.length, 0)} danışman`,
      });
    }
    for (const team of records) {
      const leaderId = `leader-${team.teamId}`;
      if (!linkedSourceIds.has(leaderId)) {
        list.push({
          id: leaderId,
          name: team.teamLeaderName,
          role: "Takım Lideri",
          roleKind: "leader",
          team: team.teamName,
          detail: `${team.agents.length} danışman`,
        });
      }
      for (const agent of team.agents) {
        if (linkedSourceIds.has(agent.id)) continue;
        list.push({
          id: agent.id,
          name: agent.name,
          role: agent.role,
          roleKind: "agent",
          team: team.teamName,
          detail: `${formatNumber(agent.leads.length)} lead`,
        });
      }
    }
    return list;
  }, [records, managed]);

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    return users.filter((u) => {
      if (filter !== "all" && u.roleKind !== filter) return false;
      if (q && !u.name.toLocaleLowerCase("tr-TR").includes(q) && !u.team.toLocaleLowerCase("tr-TR").includes(q)) return false;
      return true;
    });
  }, [users, filter, query]);

  const confirmDelete = () => {
    if (!deleting) return;
    removeUser(deleting.id);
    addLog("user-remove", `Kullanıcı silindi: ${deleting.name} (@${deleting.username})`);
  };

  return (
    <Card className="flex flex-col gap-4">
      {/* Başlık */}
      <SectionTitle hint={t("Sistemdeki tüm kullanıcılar tek listede. 'Giriş' rozetli olanlar admin panelinden oluşturulmuş, giriş yapabilen hesaplardır; satır içinden düzenlenip silinebilir. Diğerleri organizasyon verisinden türetilir.", "All users in the system in a single list. Those with a 'Login' badge are accounts created from the admin panel that can log in; they can be edited and deleted inline. The rest are derived from organization data.")}>
        <T tr="Kullanıcılar" en="Users" />
      </SectionTitle>

      {/* Araç çubuğu — filtreler (gruplu) solda, arama sağda; taşarsa düzgün sarar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label={t("Role göre filtrele", "Filter by role")}
          className="inline-flex flex-wrap items-center gap-1 rounded-control border border-border bg-bg p-1"
        >
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              onClick={() => setFilter(f.key)}
              aria-selected={filter === f.key}
              className={cn(
                "rounded-[9px] px-3 py-1.5 font-body text-[12px] font-medium transition-colors",
                filter === f.key
                  ? "bg-brand text-white shadow-soft"
                  : "text-fg-secondary hover:bg-elevated hover:text-fg",
              )}
            >
              <T tr={f.labelTr} en={f.labelEn} />
            </button>
          ))}
        </div>

        <div className="relative shrink-0">
          <Search size={14} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("İsim veya takım ara...", "Search by name or team...")}
            aria-label={t("Kullanıcı ara", "Search users")}
            className="h-9 w-full rounded-control border border-border bg-bg pl-9 pr-3 font-body text-[12.5px] text-fg placeholder:text-fg-muted lg:w-64"
          />
        </div>
      </div>

      <p className="font-mono text-[11px] text-fg-muted">
        {formatNumber(rows.length)} {t("kullanıcı", "users")} · {formatNumber(managed.length)} {t("giriş yetkili", "with login access")}
      </p>

      {managed.length === 0 && (
        <div className="flex items-start gap-2 rounded-control border border-dashed border-border bg-bg px-3.5 py-2.5">
          <KeyRound size={15} className="mt-0.5 shrink-0 text-fg-muted" aria-hidden />
          <p className="font-body text-[12px] leading-relaxed text-fg-secondary">
            <T tr="Henüz giriş yetkili kullanıcı yok." en="No users with login access yet." />{" "}
            <span className="font-semibold text-fg"><T tr="Kullanıcı Ekle" en="Add User" /></span>{" "}
            <T
              tr="ile yeni hesap oluşturabilir ya da aşağıdaki organizasyon kişilerinin yanındaki"
              en="lets you create a new account, or next to the organization people below you can use"
            />{" "}
            <span className="font-semibold text-brand"><T tr="Giriş ver" en="Grant login" /></span>{" "}
            <T
              tr="ile onlara kullanıcı adı/şifre atayabilirsiniz. Giriş yetkili hesaplar listede"
              en="to assign them a username/password. Accounts with login access appear in the list with a"
            />{" "}
            <span className="font-semibold text-success"><T tr="Giriş" en="Login" /></span>{" "}
            <T tr="rozetiyle görünür ve yanlarında" en="badge and show" />{" "}
            <span className="font-semibold text-fg"><T tr="düzenle / sil" en="edit / delete" /></span>{" "}
            <T tr="ikonları çıkar." en="icons next to them." />
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {[
                { tr: "Ad", en: "Name" },
                { tr: "Rol", en: "Role" },
                { tr: "Takım / Kapsam", en: "Team / Scope" },
                { tr: "Detay", en: "Detail" },
              ].map((h) => (
                <th key={h.en} className="px-2.5 py-2 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted"><T tr={h.tr} en={h.en} /></th>
              ))}
              <th className="px-2.5 py-2 text-right font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted"><T tr="İşlem" en="Action" /></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const rm = ROLE_META[u.roleKind];
              const Icon = rm.icon;
              return (
                <tr
                  key={u.id}
                  className={cn(
                    "border-b border-border transition-colors last:border-0 hover:bg-elevated",
                    u.managed && "bg-brand/[0.04]",
                  )}
                >
                  <td className="px-2.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-[12.5px] font-medium text-fg">{u.name}</span>
                      {u.managed && (
                        <span className="rounded-pill bg-success/14 px-1.5 py-0.5 font-body text-[9.5px] font-semibold uppercase tracking-wide text-success"><T tr="Giriş" en="Login" /></span>
                      )}
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <span className={cn("inline-flex items-center gap-1 rounded-pill px-2 py-0.5 font-body text-[10.5px] font-medium", rm.chip)}>
                      <Icon size={11} aria-hidden />
                      {u.roleKind === "agent" && !u.managed ? u.role : <T tr={rm.labelTr} en={rm.labelEn} />}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5 font-body text-[11.5px] text-fg-secondary">{u.team}</td>
                  <td className="px-2.5 py-2.5 font-mono text-[11px] text-fg-muted">{u.detail}</td>
                  <td className="px-2.5 py-2.5">
                    {u.managed ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit?.(u.managed!)}
                          aria-label={t(`${u.name} düzenle`, `Edit ${u.name}`)}
                          title={t("Düzenle", "Edit")}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-border text-fg-secondary transition-colors hover:border-brand/50 hover:bg-brand/10 hover:text-brand"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(u.managed!)}
                          aria-label={t(`${u.name} sil`, `Delete ${u.name}`)}
                          title={t("Sil", "Delete")}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-border text-fg-secondary transition-colors hover:border-critical/50 hover:bg-critical/10 hover:text-critical"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : u.roleKind !== "admin" ? (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            onGrant?.({
                              sourceId: u.id,
                              name: u.name,
                              team: u.team,
                              role: KIND_TO_GRANT_ROLE[u.roleKind],
                            })
                          }
                          title={t("Giriş yetkisi ver", "Grant login access")}
                          className="inline-flex items-center gap-1.5 rounded-control border border-border px-2.5 py-1.5 font-body text-[11px] font-medium text-fg-secondary transition-colors hover:border-brand/50 hover:bg-brand/10 hover:text-brand"
                        >
                          <UserPlus size={13} />
                          <span className="hidden sm:inline"><T tr="Giriş ver" en="Grant login" /></span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <span className="font-body text-[10.5px] text-fg-muted">—</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={t("Kullanıcı silinsin mi?", "Delete user?")}
        message={
          deleting ? (
            <>
              <span className="font-semibold text-fg">{deleting.name}</span> (@{deleting.username}){" "}
              <T
                tr="kalıcı olarak silinecek ve bu kullanıcı artık giriş yapamayacak. Bu işlem geri alınamaz."
                en="will be permanently deleted and this user will no longer be able to log in. This action cannot be undone."
              />
            </>
          ) : null
        }
        confirmLabel={t("Evet, sil", "Yes, delete")}
        cancelLabel={t("Vazgeç", "Cancel")}
        tone="critical"
      />
    </Card>
  );
}
