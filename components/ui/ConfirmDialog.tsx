"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { useLang } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/utils/cn";

/**
 * Genel onay modalı — yıkıcı bir işlemden (ör. kullanıcı silme) önce kullanıcıdan
 * onay alır. Portal + örtü + Escape/dışa tıkla ile kapanır. `tone="critical"`
 * onay butonunu kırmızı yapar.
 */
export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "critical" | "brand";
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = "critical",
}: ConfirmDialogProps) {
  const reduced = usePrefersReducedMotion();
  const { t } = useLang();
  const resolvedConfirmLabel = confirmLabel ?? t("Evet, sil", "Yes, delete");
  const resolvedCancelLabel = cancelLabel ?? t("Vazgeç", "Cancel");

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

  const isCritical = tone === "critical";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0a0e1a]/60 backdrop-blur-sm"
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: reduced ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-[380px] overflow-hidden rounded-card border border-border bg-surface shadow-elevated"
          >
            <div className="flex items-start gap-3 px-5 pt-5">
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-control",
                  isCritical ? "bg-critical/12 text-critical" : "bg-brand/12 text-brand",
                )}
              >
                <AlertTriangle size={19} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 className="font-display text-[15px] font-semibold text-fg">{title}</h2>
                <div className="font-body text-[12.5px] leading-relaxed text-fg-secondary">{message}</div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-elevated hover:text-fg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 items-center justify-center rounded-control border border-border px-4 font-body text-[13px] font-medium text-fg-secondary transition-colors hover:text-fg"
              >
                {resolvedCancelLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                autoFocus
                className={cn(
                  "flex h-10 items-center justify-center rounded-control px-4 font-body text-[13px] font-semibold text-white shadow-card transition-[filter] hover:brightness-110",
                  isCritical ? "bg-critical" : "bg-brand",
                )}
              >
                {resolvedConfirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
