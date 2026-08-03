"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  UserPlus,
  Save,
  ShieldCheck,
  Briefcase,
  UserRound,
  Building2,
  AlertTriangle,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  addUser,
  updateUser,
  generatePassword,
  ROLE_LABEL,
  roleLabel,
  ROLE_ROUTE,
  type UserRole,
  type ManagedUser,
} from "@/lib/data/user-store";
import { addLog } from "@/lib/data/log-store";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { useLang } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/utils/cn";

/**
 * Kullanıcı oluştur / düzenle modalı. Admin "Kullanıcı Ekle" butonuna ya da bir
 * satırın "Düzenle" butonuna basınca açılır. Düzenlemede ad/kullanıcı adı/şifre/
 * rol/takım değiştirilebilir; "Şifre Sıfırla" ile yeni geçici şifre üretilir.
 *
 * Form gövdesi ayrı, `key`li bir alt bileşendir (UserFormBody) — böylece her
 * açılışta/kayıt değişiminde useState başlangıç değerleri prop'lardan yeniden
 * kurulur; efekt içinde setState ile prop→state senkronu gerekmez.
 */

const ROLE_OPTIONS: Array<{ value: UserRole; icon: typeof ShieldCheck }> = [
  { value: "agent", icon: UserRound },
  { value: "leader", icon: Briefcase },
  { value: "region", icon: Building2 },
  { value: "admin", icon: ShieldCheck },
];

/** Organizasyondan gelen bir kişiye giriş yetkisi verirken formu ön-dolduran veri. */
export interface UserPrefill {
  name: string;
  username: string;
  password: string;
  team: string;
  role: UserRole;
  sourceId: string;
}

export interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  /** null → oluşturma modu; dolu → düzenleme modu. */
  editing: ManagedUser | null;
  /** editing null iken doluysa "giriş yetkisi ver" modu (form ön-doldurulur). */
  prefill?: UserPrefill | null;
  onSaved?: (user: ManagedUser, mode: "create" | "edit") => void;
}

const inputCls =
  "h-10 w-full rounded-control border border-border bg-bg px-3 font-body text-[13px] text-fg outline-none transition-colors placeholder:text-fg-muted focus:border-brand";

export function UserFormModal({ open, onClose, editing, prefill, onSaved }: UserFormModalProps) {
  const reduced = usePrefersReducedMotion();
  const { t } = useLang();

  // Escape ile kapat + body scroll kilidi.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Sunucuda document yok — portal yalnızca client'ta.
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          {/* Örtü */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0a0e1a]/60 backdrop-blur-sm"
          />

          {/* Kart */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={editing ? t("Kullanıcı düzenle", "Edit user") : t("Kullanıcı ekle", "Add user")}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: reduced ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 my-auto w-full max-w-[440px] overflow-hidden rounded-card border border-border bg-surface shadow-elevated"
          >
            <UserFormBody
              key={editing?.id ?? prefill?.sourceId ?? "new"}
              editing={editing}
              prefill={prefill ?? null}
              onClose={onClose}
              onSaved={onSaved}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function UserFormBody({
  editing,
  prefill,
  onClose,
  onSaved,
}: {
  editing: ManagedUser | null;
  prefill: UserPrefill | null;
  onClose: () => void;
  onSaved?: (user: ManagedUser, mode: "create" | "edit") => void;
}) {
  const { t, lang } = useLang();
  const isEdit = editing !== null;
  const isGrant = !isEdit && prefill !== null;
  const base = editing ?? prefill;

  const [name, setName] = useState(base?.name ?? "");
  const [username, setUsername] = useState(base?.username ?? "");
  const [password, setPassword] = useState(base?.password ?? "");
  const [team, setTeam] = useState(base?.team && base.team !== "—" ? base.team : "");
  const [role, setRole] = useState<UserRole>(base?.role ?? "agent");
  const [showPassword, setShowPassword] = useState(isGrant);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleReset = () => {
    const pwd = generatePassword();
    setPassword(pwd);
    setShowPassword(true);
    setNotice(t(`Yeni geçici şifre üretildi: ${pwd}. Kaydedip kullanıcıya iletin.`, `New temporary password generated: ${pwd}. Save it and share it with the user.`));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = { name, username, password, team, role, lang };
      if (isEdit && editing) {
        const user = updateUser(editing.id, payload);
        addLog("user-add", `Kullanıcı güncellendi: ${user.name} (@${user.username}) — ${ROLE_LABEL[user.role]}`);
        onSaved?.(user, "edit");
      } else {
        const user = addUser({ ...payload, sourceId: prefill?.sourceId });
        addLog(
          "user-add",
          isGrant
            ? `Giriş yetkisi verildi: ${user.name} (@${user.username}) — ${ROLE_LABEL[user.role]}`
            : `Yeni kullanıcı oluşturuldu: ${user.name} (@${user.username}) — ${ROLE_LABEL[user.role]}`,
        );
        onSaved?.(user, "create");
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Kullanıcı kaydedilemedi.", "Could not save user."));
    }
  };

  return (
    <>
      {/* Başlık */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-control bg-brand/12 text-brand">
            {isEdit ? <Save size={17} /> : isGrant ? <KeyRound size={17} /> : <UserPlus size={17} />}
          </span>
          <div className="flex flex-col">
            <h2 className="font-display text-[15px] font-semibold text-fg">
              {isEdit ? t("Kullanıcı Düzenle", "Edit User") : isGrant ? t("Giriş Yetkisi Ver", "Grant Login Access") : t("Yeni Kullanıcı Ekle", "Add New User")}
            </h2>
            <p className="font-body text-[11.5px] text-fg-muted">
              {isEdit
                ? t("Bilgileri güncelle veya şifre sıfırla", "Update details or reset the password")
                : isGrant
                  ? t("Bu kişiye kullanıcı adı/şifre atayarak giriş hesabı oluştur", "Create a login account for this person with a username/password")
                  : t("Giriş yetkili yeni kullanıcı oluştur", "Create a new user with login access")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Kapat", "Close")}
          className="flex h-8 w-8 items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-elevated hover:text-fg"
        >
          <X size={17} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 px-5 py-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-fg-muted">{t("Ad Soyad", "Full Name")}</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Örn. Deniz Yılmaz", "e.g. Deniz Yılmaz")} className={inputCls} autoComplete="off" autoFocus />
        </label>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-fg-muted">{t("Kullanıcı Adı", "Username")}</span>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="deniz.yilmaz" className={cn(inputCls, "font-mono")} autoComplete="off" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-fg-muted">{t("Şifre", "Password")}</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("en az 4 karakter", "at least 4 characters")}
                className={cn(inputCls, "pr-9 font-mono")}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? t("Şifreyi gizle", "Hide password") : t("Şifreyi göster", "Show password")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-muted transition-colors hover:text-fg"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>
        </div>

        {isEdit && (
          <button
            type="button"
            onClick={handleReset}
            className="flex w-fit items-center gap-1.5 rounded-control border border-border px-2.5 py-1.5 font-body text-[11.5px] font-medium text-fg-secondary transition-colors hover:border-amber/50 hover:text-amber"
          >
            <KeyRound size={13} />
            {t("Şifre Sıfırla", "Reset Password")}
          </button>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-fg-muted">{t("Takım / Kapsam", "Team / Scope")}</span>
          <input type="text" value={team} onChange={(e) => setTeam(e.target.value)} placeholder={t("Örn. Aamir Ali Team", "e.g. Aamir Ali Team")} className={inputCls} autoComplete="off" />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-fg-muted">{t("Rol", "Role")}</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ROLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-control border px-2 py-2 font-body text-[11px] font-medium transition-colors",
                    active ? "border-brand bg-brand/10 text-brand" : "border-border text-fg-secondary hover:bg-elevated hover:text-fg",
                  )}
                >
                  <Icon size={15} />
                  {roleLabel(opt.value, lang)}
                </button>
              );
            })}
          </div>
          <p className="font-body text-[11px] text-fg-muted">
            {t("Giriş sonrası panel:", "Panel after login:")} <span className="font-mono text-fg-secondary">{ROLE_ROUTE[role]}</span>
          </p>
        </div>

        {notice && (
          <p className="flex items-start gap-2 rounded-control border border-amber/40 bg-amber/10 px-3 py-2 font-body text-[11.5px] font-medium text-amber">
            <KeyRound size={13} className="mt-0.5 shrink-0" />
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-control border border-critical/40 bg-critical/10 px-3 py-2 font-body text-[12px] font-medium text-critical">
            <AlertTriangle size={14} className="shrink-0" />
            {error}
          </p>
        )}

        <div className="mt-1 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 items-center justify-center rounded-control border border-border px-4 font-body text-[13px] font-medium text-fg-secondary transition-colors hover:text-fg"
          >
            {t("İptal", "Cancel")}
          </button>
          <button
            type="submit"
            className="flex h-10 items-center justify-center gap-2 rounded-control bg-brand px-4 font-body text-[13px] font-semibold text-white shadow-card transition-[filter] hover:brightness-110"
          >
            {isEdit ? <Save size={15} /> : isGrant ? <KeyRound size={15} /> : <UserPlus size={15} />}
            {isEdit ? t("Değişiklikleri Kaydet", "Save Changes") : isGrant ? t("Giriş Yetkisi Ver", "Grant Login Access") : t("Kullanıcı Oluştur", "Create User")}
          </button>
        </div>
      </form>
    </>
  );
}
