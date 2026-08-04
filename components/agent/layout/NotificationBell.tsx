"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  PhoneMissed,
  FileText,
  Trophy,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/utils/cn";

/**
 * Bildirim zili — açılır panel (CLAUDE.md 3.4/3.1 diline uygun).
 * Mock bildirimler veri katmanından değil, sabit örnek liste ile gösterilir
 * (gerçek bildirim akışı backend fazında bağlanacak).
 */

interface Notification {
  id: string;
  icon: LucideIcon;
  tone: "critical" | "warning" | "success" | "neutral";
  title: string;
  titleEn: string;
  detail: string;
  detailEn: string;
  time: string;
  timeEn: string;
  unread: boolean;
}

const NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    icon: PhoneMissed,
    tone: "critical",
    title: "5 lead henüz aranmadı",
    titleEn: "5 leads not yet called",
    detail: "15 dk SLA eşiği yaklaşıyor — hemen aksiyon al.",
    detailEn: "The 15 min SLA threshold is approaching — take action now.",
    time: "12 dk önce",
    timeEn: "12 min ago",
    unread: true,
  },
  {
    id: "n2",
    icon: FileText,
    tone: "warning",
    title: "Offer paylaşımı bekliyor",
    titleEn: "Offer awaiting sharing",
    detail: "Amelia Crawford için oluşturduğun teklif henüz paylaşılmadı.",
    detailEn: "The offer you created for Amelia Crawford has not been shared yet.",
    time: "1 sa önce",
    timeEn: "1 hr ago",
    unread: true,
  },
  {
    id: "n3",
    icon: Trophy,
    tone: "success",
    title: "Takım sıralaman yükseldi",
    titleEn: "Your team rank went up",
    detail: "Aamir Ali Team içinde 4. sıraya yükseldin. Tebrikler!",
    detailEn: "You moved up to 4th place in Aamir Ali Team. Congratulations!",
    time: "Dün",
    timeEn: "Yesterday",
    unread: false,
  },
  {
    id: "n4",
    icon: AlertTriangle,
    tone: "neutral",
    title: "Vardiya hatırlatması",
    titleEn: "Shift reminder",
    detail: "Yarınki vardiyan 09:00'da başlıyor.",
    detailEn: "Your shift tomorrow starts at 09:00.",
    time: "Dün",
    timeEn: "Yesterday",
    unread: false,
  },
];

const TONE_CHIP: Record<Notification["tone"], string> = {
  critical: "bg-critical/12 text-critical",
  warning: "bg-warning/16 text-warning",
  success: "bg-success/12 text-success",
  neutral: "bg-neutral/16 text-fg-secondary",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(NOTIFICATIONS);
  const { t } = useLang();
  const reduced = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const unreadCount = items.filter((n) => n.unread).length;

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

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("Bildirimler", "Notifications")}
        aria-expanded={open}
        title={t("Bildirimler", "Notifications")}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-control border shadow-soft transition-colors",
          open
            ? "border-brand/40 bg-brand/8 text-brand"
            : "border-border bg-surface text-fg-secondary hover:text-fg",
        )}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-critical px-1 font-mono text-[9px] font-bold text-white ring-2 ring-surface"
          >
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              aria-hidden
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-label={t("Bildirimler paneli", "Notifications panel")}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: reduced ? 0 : 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-0 left-full z-50 ml-2 w-80 max-h-[min(28rem,calc(100vh-2rem))] overflow-hidden rounded-card border border-border bg-surface shadow-elevated"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="font-display text-[13.5px] font-semibold text-fg">
                  <T tr="Bildirimler" en="Notifications" />
                </p>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex items-center gap-1 font-body text-[11px] font-medium text-brand transition-colors hover:text-brand/80"
                  >
                    <CheckCheck size={13} />
                    <T tr="Tümünü okundu işaretle" en="Mark all as read" />
                  </button>
                )}
              </div>

              <ul className="max-h-80 overflow-y-auto">
                {items.map((n) => {
                  const Icon = n.icon;
                  return (
                    <li
                      key={n.id}
                      className="flex gap-3 border-b border-border px-4 py-3 transition-colors last:border-0 hover:bg-elevated"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-control",
                          TONE_CHIP[n.tone],
                        )}
                      >
                        <Icon size={14} />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-body text-[12.5px] font-semibold text-fg">
                            {t(n.title, n.titleEn)}
                          </span>
                          {n.unread && (
                            <span
                              aria-hidden
                              className="h-1.5 w-1.5 shrink-0 rounded-pill bg-brand"
                            />
                          )}
                        </div>
                        <p className="font-body text-[11.5px] leading-snug text-fg-secondary">
                          {t(n.detail, n.detailEn)}
                        </p>
                        <span className="font-mono text-[10px] text-fg-muted">
                          {t(n.time, n.timeEn)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {items.length === 0 && (
                <p className="px-4 py-8 text-center font-body text-sm text-fg-muted">
                  <T tr="Henüz bildirim yok." en="No notifications yet." />
                </p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
