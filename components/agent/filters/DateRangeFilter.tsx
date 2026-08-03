"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarRange,
  Check,
  ChevronDown,
  Sparkles,
  X,
} from "lucide-react";
import { useDateRange, type RangeKey } from "./DateRangeContext";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { useLang } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/utils/cn";

/**
 * Şık tarih aralığı filtresi — segmented pill kontrol + gelişmiş "Özel"
 * popover (gradient başlık, hızlı kısayollar, canlı gün sayacı, framer-motion
 * geçişi). Global context'i sürer; seçim tüm sayfalarda kalıcıdır.
 */

const PRESETS: Array<{ key: Exclude<RangeKey, "custom">; labelTr: string; labelEn: string }> = [
  { key: "today", labelTr: "Bugün", labelEn: "Today" },
  { key: "7d", labelTr: "7 Gün", labelEn: "7 Days" },
  { key: "30d", labelTr: "30 Gün", labelEn: "30 Days" },
  { key: "90d", labelTr: "90 Gün", labelEn: "90 Days" },
];

const DAY_MS = 86_400_000;

/** Popover içi hızlı kısayollar — bugünden geriye N gün. */
const QUICK_SHORTCUTS = [
  { labelTr: "Son 14 gün", labelEn: "Last 14 days", days: 14 },
  { labelTr: "Son 60 gün", labelEn: "Last 60 days", days: 60 },
  { labelTr: "Bu yıl (YTD)", labelEn: "This year (YTD)", days: -1 }, // özel işaret: yıl başından bugüne
];

function toInputValue(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function DateRangeFilter() {
  const { rangeKey, customStart, customEnd, setPreset, setCustom, endMs } =
    useDateRange();
  const reduced = usePrefersReducedMotion();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(customStart);
  const [draftEnd, setDraftEnd] = useState(customEnd);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const dayCount = useMemo(() => {
    const s = Date.parse(draftStart);
    const e = Date.parse(draftEnd);
    if (Number.isNaN(s) || Number.isNaN(e) || e < s) return null;
    return Math.round((e - s) / DAY_MS) + 1;
  }, [draftStart, draftEnd]);

  const isValid = dayCount !== null && dayCount > 0;

  const applyCustom = () => {
    if (isValid) {
      setCustom(draftStart, draftEnd);
      setOpen(false);
    }
  };

  const applyShortcut = (days: number) => {
    const end = new Date(endMs);
    if (days === -1) {
      // Yıl başından bugüne
      setDraftStart(`${end.getUTCFullYear()}-01-01`);
      setDraftEnd(toInputValue(endMs));
      return;
    }
    setDraftStart(toInputValue(endMs - days * DAY_MS));
    setDraftEnd(toInputValue(endMs));
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1 rounded-control border border-border bg-surface p-1 shadow-soft">
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-brand/10 text-brand"
        >
          <CalendarRange size={15} />
        </span>

        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => setPreset(preset.key)}
            aria-pressed={rangeKey === preset.key}
            className={cn(
              "rounded-[8px] px-3 py-1.5 font-body text-[12px] font-medium transition-colors",
              rangeKey === preset.key
                ? "bg-brand text-white shadow-card"
                : "text-fg-secondary hover:bg-elevated hover:text-fg",
            )}
          >
            {t(preset.labelTr, preset.labelEn)}
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            setDraftStart(customStart);
            setDraftEnd(customEnd);
            setOpen((v) => !v);
          }}
          aria-pressed={rangeKey === "custom"}
          aria-expanded={open}
          className={cn(
            "flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 font-body text-[12px] font-medium transition-colors",
            rangeKey === "custom"
              ? "bg-brand text-white shadow-card"
              : "text-fg-secondary hover:bg-elevated hover:text-fg",
          )}
        >
          <Sparkles size={13} />
          {t("Özel", "Custom")}
          <ChevronDown
            size={12}
            className={cn("transition-transform duration-150", open && "rotate-180")}
          />
        </button>
      </div>

      {/* Özel aralık popover */}
      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              aria-hidden
              onClick={() => setOpen(false)}
            />
            <motion.div
              ref={popoverRef}
              role="dialog"
              aria-label={t("Özel tarih aralığı seç", "Select custom date range")}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: reduced ? 0 : 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 z-50 mt-2 w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-border bg-surface shadow-elevated"
            >
              {/* Gradient başlık */}
              <div
                className="relative flex items-center justify-between px-4 py-3.5"
                style={{
                  backgroundImage:
                    "linear-gradient(120deg, rgba(14,169,139,0.16) 0%, rgba(124,92,252,0.14) 100%)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-brand/15 text-brand">
                    <CalendarRange size={14} />
                  </span>
                  <p className="font-display text-[13.5px] font-semibold text-fg">
                    {t("Özel Tarih Aralığı", "Custom Date Range")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t("Kapat", "Close")}
                  className="flex h-6 w-6 items-center justify-center rounded-pill text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                >
                  <X size={13} />
                </button>
              </div>

              <div className="flex flex-col gap-4 p-4">
                {/* Hızlı kısayollar */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SHORTCUTS.map((shortcut) => (
                    <button
                      key={shortcut.days}
                      type="button"
                      onClick={() => applyShortcut(shortcut.days)}
                      className="rounded-pill border border-border bg-elevated px-2.5 py-1 font-body text-[11px] font-medium text-fg-secondary transition-colors hover:border-brand/40 hover:text-brand"
                    >
                      {t(shortcut.labelTr, shortcut.labelEn)}
                    </button>
                  ))}
                </div>

                {/* Tarih seçiciler */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted">
                      {t("Başlangıç", "Start")}
                    </span>
                    <input
                      type="date"
                      value={draftStart}
                      max={draftEnd}
                      onChange={(e) => setDraftStart(e.target.value)}
                      className="h-10 rounded-control border border-border bg-bg px-3 font-mono text-[12px] text-fg outline-none transition-colors focus:border-brand [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted">
                      {t("Bitiş", "End")}
                    </span>
                    <input
                      type="date"
                      value={draftEnd}
                      min={draftStart}
                      onChange={(e) => setDraftEnd(e.target.value)}
                      className="h-10 rounded-control border border-border bg-bg px-3 font-mono text-[12px] text-fg outline-none transition-colors focus:border-brand [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </label>
                </div>

                {/* Canlı gün sayacı */}
                <div
                  className={cn(
                    "flex items-center justify-between rounded-control border px-3 py-2",
                    isValid
                      ? "border-brand/25 bg-brand/8"
                      : "border-critical/25 bg-critical/8",
                  )}
                >
                  <span className="font-body text-[11.5px] text-fg-secondary">
                    {isValid ? t("Seçili aralık", "Selected range") : t("Geçersiz aralık", "Invalid range")}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[13px] font-semibold",
                      isValid ? "text-brand" : "text-critical",
                    )}
                  >
                    {isValid ? `${dayCount} ${t("gün", "days")}` : "—"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={applyCustom}
                  disabled={!isValid}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-control bg-brand font-body text-[12.5px] font-semibold text-white shadow-card transition-[filter,opacity] duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Check size={14} />
                  {t("Aralığı Uygula", "Apply Range")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
