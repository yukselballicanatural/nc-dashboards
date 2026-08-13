"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Flag, Target } from "lucide-react";
import {
  CURRENT_QUARTER,
  CURRENT_QUARTER_MONTHS,
  MONTHS_ELAPSED_IN_QUARTER,
  QUARTER_PROGRESS,
  type QuarterMonthCell,
} from "@/lib/mock/agent-earnings";
import { AGENT_REGION } from "@/lib/mock/agent-earnings";
import { salesTargetProgress } from "@/lib/mock/commission";
import { DURATION, EASING } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import {
  formatCurrencyEUR,
  formatPercent,
  longMonthsFor,
  monthsFor,
} from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { cn } from "@/lib/utils/cn";

/**
 * QUARTER PERFORMANCE SLIDER — dergi/slayt deneyimi (kullanıcı talebi).
 *
 * Klasik dashboard grafiği DEĞİL: her ay tam sayfa bir "dergi kartı" olarak
 * gösterilir, aylar sağa/sola kaydırılarak gezilir (ok tuşları, sürükleme,
 * nokta göstergeleri ve klavye ← →).
 *
 * VERİ: Aktif çeyrek ve ayları otomatik belirlenir (CURRENT_QUARTER /
 * CURRENT_QUARTER_MONTHS). Geçmiş aylar kesinleşmiş tutarı, içinde bulunulan
 * ay ise CANLI tutarı gösterir — `salesByMonth` haritasında bu ayın değeri
 * ay başından bugüne tahsil edilen satışa eşitlenir (bkz. agent-earnings.ts
 * "salesByMonth.set(CURRENT_MONTH_KEY, monthSalesEUR)"), yani Dashboard'ın
 * geri kalanıyla aynı tek kaynaktan okunur.
 *
 * TARGET BAR: her ayın kendi satışına göre bir sonraki hedef seviyesi
 * `salesTargetProgress` ile hesaplanır (12.500 → 15.000 → 5.000'lik adımlar).
 */

/** Sürükleme bu eşiği geçerse slayt değişir (px). */
const DRAG_THRESHOLD = 60;

interface SlideData extends QuarterMonthCell {
  longName: string;
  shortName: string;
}

/** Ayın durum rozeti — kesinleşmiş / canlı / henüz başlamamış. */
function StatusChip({ status, reduced }: { status: QuarterMonthCell["status"]; reduced: boolean }) {
  const { t } = useLang();
  if (status === "current") {
    return (
      <span className="flex items-center gap-1.5 rounded-pill bg-critical/10 px-2.5 py-1">
        <span
          aria-hidden
          className={cn("h-1.5 w-1.5 rounded-pill bg-critical", !reduced && "live-dot")}
        />
        <span className="font-body text-[10px] font-bold uppercase tracking-wider text-critical">
          {t("bu ay · canlı", "this month · live")}
        </span>
      </span>
    );
  }
  if (status === "projected") {
    return (
      <span className="rounded-pill bg-neutral/12 px-2.5 py-1 font-body text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
        {t("henüz başlamadı", "not started")}
      </span>
    );
  }
  return (
    <span className="rounded-pill bg-success/12 px-2.5 py-1 font-body text-[10px] font-semibold uppercase tracking-wider text-success">
      {t("kesinleşti", "settled")}
    </span>
  );
}

/** Tek ayın hedef barı — o ayın satışına göre otomatik seviye. */
function MonthTargetBar({ salesEUR }: { salesEUR: number }) {
  const { t } = useLang();
  const target = salesTargetProgress(salesEUR, AGENT_REGION);
  const reached = target.remainingEUR === 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
          <T tr="Bu ayın hedefi" en="This month's target" />
        </span>
        <span className="font-mono text-[11.5px] font-semibold text-fg">
          {formatCurrencyEUR(salesEUR)}{" "}
          <span className="text-fg-muted">/ {formatCurrencyEUR(target.targetEUR)}</span>
        </span>
      </div>

      <div className="relative h-2.5 overflow-hidden rounded-pill bg-elevated">
        <div
          className={cn(
            "h-full rounded-pill transition-[width] duration-700 ease-out",
            reached ? "bg-success" : "bg-brand",
          )}
          style={{ width: `${Math.min(100, target.progressPct)}%` }}
        />
        {target.previousTargetEUR > 0 && (
          <span
            aria-hidden
            className="absolute inset-y-0 z-10 w-px bg-fg/45"
            style={{ left: `${(target.previousTargetEUR / target.targetEUR) * 100}%` }}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px]">
        <span className="text-fg-secondary">
          {reached ? (
            <span className="flex items-center gap-1 font-semibold text-success">
              <Flag size={10} aria-hidden />
              {t("hedef tamamlandı", "target reached")}
            </span>
          ) : (
            <>
              <span className="text-fg-muted">{t("kalan", "remaining")} </span>
              <span className="font-semibold text-brand-secondary">
                {formatCurrencyEUR(target.remainingEUR)}
              </span>
            </>
          )}
        </span>
        <span className={cn("font-semibold", reached ? "text-success" : "text-brand")}>
          {formatPercent(target.progressPct)}
        </span>
      </div>
    </div>
  );
}

/** Bir ay = bir dergi sayfası. */
function MonthSlide({
  slide,
  quarterAvgEUR,
  reduced,
}: {
  slide: SlideData;
  quarterAvgEUR: number;
  reduced: boolean;
}) {
  const { t } = useLang();
  const started = slide.status !== "projected";
  const diffEUR = Math.round(slide.salesEUR - quarterAvgEUR);
  const aboveAvg = diffEUR >= 0;

  return (
    <div className="w-full shrink-0 px-0.5">
      <div
        className={cn(
          "flex h-full flex-col gap-4 rounded-card border px-5 py-5",
          slide.status === "current"
            ? "border-brand/35 bg-brand/[0.05]"
            : "border-border bg-elevated",
        )}
      >
        {/* Dergi başlığı: büyük ay adı + durum */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="font-body text-[10.5px] uppercase tracking-[0.14em] text-fg-muted">
              {CURRENT_QUARTER} · {slide.year}
            </span>
            <span className="font-display text-[24px] font-bold leading-none text-fg">
              {slide.longName}
            </span>
          </div>
          <StatusChip status={slide.status} reduced={reduced} />
        </div>

        {/* Ana rakam */}
        <div className="flex flex-col gap-1">
          <span className="font-body text-[10.5px] uppercase tracking-wide text-fg-muted">
            <T tr="Satış" en="Sales" />
          </span>
          <span className="font-mono text-[34px] font-bold leading-none text-fg">
            {started ? formatCurrencyEUR(slide.salesEUR) : "—"}
          </span>
          {started ? (
            <span
              className={cn(
                "font-body text-[11px]",
                aboveAvg ? "text-success" : "text-critical",
              )}
            >
              <T
                tr={`Çeyrek ortalamasının ${formatCurrencyEUR(Math.abs(diffEUR))} ${aboveAvg ? "üstünde" : "altında"}`}
                en={`${formatCurrencyEUR(Math.abs(diffEUR))} ${aboveAvg ? "above" : "below"} the quarter average`}
              />
            </span>
          ) : (
            <span className="font-body text-[11px] text-fg-muted">
              {t("Bu ay henüz başlamadı.", "This month has not started yet.")}
            </span>
          )}
        </div>

        {/* O ayın hedef barı */}
        <div className="mt-auto">
          {started ? (
            <MonthTargetBar salesEUR={slide.salesEUR} />
          ) : (
            <p className="font-body text-[11px] text-fg-muted">
              {t(
                "Ay başladığında hedef barı otomatik oluşur.",
                "The target bar appears automatically once the month begins.",
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function QuarterSlider() {
  const { t, lang } = useLang();
  const reduced = usePrefersReducedMotion();
  const longMonths = longMonthsFor(lang);
  const shortMonths = monthsFor(lang);

  const slides: SlideData[] = CURRENT_QUARTER_MONTHS.map((cell) => ({
    ...cell,
    longName: longMonths[cell.monthIndex],
    shortName: shortMonths[cell.monthIndex],
  }));

  /**
   * Açılışta içinde bulunulan ay gösterilir — agent en çok onu merak eder.
   * Bulunamazsa (teorik) ilk aya düşer.
   */
  const currentIdx = Math.max(
    0,
    slides.findIndex((s) => s.status === "current"),
  );
  const [index, setIndex] = useState(currentIdx);
  const trackRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(slides.length - 1, next)));
    },
    [slides.length],
  );

  // Klavye ile gezinme (CLAUDE.md 7 — klavye erişilebilirliği).
  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(index + 1);
      }
    };
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [index, go]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -DRAG_THRESHOLD) go(index + 1);
    else if (info.offset.x > DRAG_THRESHOLD) go(index - 1);
  };

  /**
   * Çeyrek ortalaması = çeyrek toplamı ÷ BAŞLAMIŞ ay sayısı. Prim oranı da
   * aynı ortalamadan seçildiği için (bkz. commission.ts quarterProgress) tek
   * bir "ortalama" tanımı kullanılır; ekranda iki farklı ortalama çıkmaz.
   */
  const quarterAvgEUR = QUARTER_PROGRESS.monthlyAvgEUR;
  const quarterMonthsLabel = slides.map((s) => s.longName).join(" / ");

  return (
    <div className="flex flex-col gap-3">
      {/* Slider başlığı: aktif çeyrek + ayları + çeyrek ortalaması */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
            <T tr="Aktif Çeyrek" en="Active Quarter" />
          </span>
          <span className="truncate font-display text-[13px] font-semibold text-fg">
            {CURRENT_QUARTER} — {quarterMonthsLabel}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-0.5 rounded-control bg-brand/8 px-3 py-1.5">
            <span className="font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
              <T tr="Çeyrek Ortalaması" en="Quarter Average" />
            </span>
            <span className="font-mono text-[16px] font-bold leading-none text-brand">
              {formatCurrencyEUR(quarterAvgEUR)}
            </span>
          </div>

          {/* Sağ/sol gezinme */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              aria-label={t("Önceki ay", "Previous month")}
              className="flex h-8 w-8 items-center justify-center rounded-control border border-border bg-surface text-fg-secondary transition-colors hover:border-brand/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              disabled={index === slides.length - 1}
              aria-label={t("Sonraki ay", "Next month")}
              className="flex h-8 w-8 items-center justify-center rounded-control border border-border bg-surface text-fg-secondary transition-colors hover:border-brand/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {/* Kaydırılabilir şerit */}
      <div
        ref={trackRef}
        tabIndex={0}
        role="group"
        aria-roledescription={t("kaydırmalı galeri", "carousel")}
        aria-label={t(
          `${CURRENT_QUARTER} aylık satış performansı — ${slides.length} ay`,
          `${CURRENT_QUARTER} monthly sales performance — ${slides.length} months`,
        )}
        className="overflow-hidden rounded-card outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        <motion.div
          className="flex cursor-grab active:cursor-grabbing"
          animate={{ x: `-${index * 100}%` }}
          transition={reduced ? { duration: 0 } : { duration: DURATION.slide, ease: EASING.out }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={onDragEnd}
        >
          {slides.map((slide) => (
            <MonthSlide
              key={slide.key}
              slide={slide}
              quarterAvgEUR={quarterAvgEUR}
              reduced={reduced}
            />
          ))}
        </motion.div>
      </div>

      {/* Nokta göstergeleri — hem konum bilgisi hem doğrudan atlama */}
      <div className="flex items-center justify-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.key}
            type="button"
            onClick={() => go(i)}
            aria-label={t(`${slide.longName} ayını göster`, `Show ${slide.longName}`)}
            aria-current={i === index ? "true" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-pill px-2 py-1 font-mono text-[10.5px] font-semibold transition-colors",
              i === index
                ? "bg-brand/12 text-brand"
                : "text-fg-muted hover:bg-elevated hover:text-fg-secondary",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 rounded-pill",
                i === index ? "bg-brand" : "bg-neutral/45",
              )}
            />
            {slide.shortName}
          </button>
        ))}
      </div>

      <p className="flex items-start gap-2 font-body text-[10.5px] leading-snug text-fg-muted">
        <Target size={11} aria-hidden className="mt-0.5 shrink-0" />
        <T
          tr={`Aylar sağa/sola kaydırılabilir (sürükle, oklar veya ← → tuşları). Çeyrek ortalaması ${MONTHS_ELAPSED_IN_QUARTER} başlamış aya göre hesaplanır; içinde bulunulan ayın tutarı canlı veridir.`}
          en={`Swipe or use the arrows (or ← → keys) to move between months. The quarter average is calculated over ${MONTHS_ELAPSED_IN_QUARTER} started month(s); the current month's figure is live data.`}
        />
      </p>
    </div>
  );
}
