"use client";

/**
 * Profil çipi — CLAUDE.md 4.1. Agent ve Team Leader panelleri ortak kullanır
 * (`profile` prop'u geçmezse varsayılan Agent profili).
 * Temsili avatar illüstrasyonu + isim + rol rozeti + takım adı. Tıklanınca
 * profil özetini ve "Çıkış Yap" aksiyonunu içeren bir popover açar
 * (NotificationBell/DateRangeFilter ile aynı açılır panel dili).
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, MapPin, Users } from "lucide-react";
import { AGENT_PROFILE } from "@/lib/mock/mock-data";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { AgentAvatar } from "@/components/ui/AgentAvatar";
import { useIdentity, clearSessionUser } from "@/lib/data/session-store";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils/cn";

interface ProfileChipProfile {
  name: string;
  role: string;
  team: string;
  location?: string;
}

export function ProfileChip({
  profile = AGENT_PROFILE,
}: {
  profile?: ProfileChipProfile;
} = {}) {
  // Oturum kimliği varsa onu göster (oluşturulan kullanıcı kendi adıyla görünür),
  // yoksa panelin varsayılan profili.
  const AGENT = useIdentity(profile);
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    clearSessionUser();
    router.push("/login");
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("Profil menüsü", "Profile menu")}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-3 rounded-pill border py-1.5 pl-2 pr-4 shadow-soft transition-colors",
          open ? "border-brand/40 bg-brand/8" : "border-border bg-surface hover:bg-elevated",
        )}
      >
        {/* Avatar — temsili illüstrasyon + online göstergesi */}
        <div className="relative shrink-0">
          <div className="overflow-hidden rounded-pill shadow-card">
            <AgentAvatar size={36} />
          </div>
          <span
            aria-hidden
            title={t("Çevrimiçi", "Online")}
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-pill border-2 border-surface bg-success"
          />
        </div>
        <div className="hidden flex-col items-start sm:flex">
          <div className="flex items-center gap-2">
            <span className="font-display text-[13px] font-semibold leading-tight text-fg">
              {AGENT.name}
            </span>
            <span className="rounded-pill bg-brand/12 px-2 py-0.5 font-body text-[10.5px] font-medium text-brand">
              {AGENT.role}
            </span>
          </div>
          <span className="font-body text-[11px] leading-tight text-fg-muted">
            {AGENT.team} · {AGENT.location}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={t("Profil menüsü", "Profile menu")}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: reduced ? 0 : 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-card border border-border bg-surface shadow-elevated"
          >
            <div
              className="flex items-center gap-3 px-4 py-3.5"
              style={{
                backgroundImage:
                  "linear-gradient(120deg, rgba(14,169,139,0.16) 0%, rgba(124,92,252,0.14) 100%)",
              }}
            >
              <div className="overflow-hidden rounded-pill shadow-card">
                <AgentAvatar size={40} />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-display text-[13.5px] font-semibold text-fg">
                  {AGENT.name}
                </span>
                <span className="font-body text-[11px] text-fg-secondary">
                  {AGENT.role}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 px-4 py-3 text-[11.5px] text-fg-secondary">
              <span className="flex items-center gap-1.5">
                <Users size={12} aria-hidden />
                {AGENT.team}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={12} aria-hidden />
                {AGENT.location}
              </span>
            </div>

            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-control px-2.5 py-2 font-body text-[12.5px] font-medium text-critical transition-colors hover:bg-critical/10"
              >
                <LogOut size={14} />
                <T tr="Çıkış Yap" en="Log out" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
