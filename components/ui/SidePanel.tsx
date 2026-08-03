"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

/**
 * Genel amaçlı yan panel (Notion tarzı "sayfa aç") — bir kartın/bandın
 * özetini tıklayınca sağdan kayarak açılan, kaydırılabilir DETAY sayfası.
 * ConfirmDialog ile aynı temel (portal + overlay + Escape/dışa tıkla), ama
 * ortalanmış küçük bir kutu değil, tam yükseklikte kayan bir panel.
 */
export interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Panel genişliği (desktop). Varsayılan 640px — yoğun tablo/grafik içerik için. */
  widthClassName?: string;
}

export function SidePanel({
  open,
  onClose,
  title,
  subtitle,
  children,
  widthClassName = "max-w-[680px]",
}: SidePanelProps) {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex justify-end">
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0a0e1a]/55 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            initial={reduced ? { opacity: 1 } : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduced ? { opacity: 0 } : { x: "100%" }}
            transition={{ duration: reduced ? 0 : 0.26, ease: [0.16, 1, 0.3, 1] }}
            className={`relative z-10 flex h-full w-full ${widthClassName} flex-col border-l border-border bg-bg shadow-elevated`}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border bg-surface px-6 py-5">
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="font-display text-[18px] font-bold leading-tight text-fg">
                  {title}
                </h2>
                {subtitle && (
                  <p className="font-body text-[12.5px] leading-snug text-fg-secondary">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-elevated hover:text-fg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex flex-col gap-5">{children}</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
