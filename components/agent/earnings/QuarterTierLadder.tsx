"use client";

import { Check, Target } from "lucide-react";
import {
  CURRENT_QUARTER,
  CURRENT_QUARTER_MONTHS,
  MONTHS_ELAPSED_IN_QUARTER,
  QUARTER_PROGRESS,
  QUARTER_TO_DATE_EUR,
} from "@/lib/mock/agent-earnings";
import { QUARTER_MONTHS } from "@/lib/mock/commission";
import { formatCurrencyEUR, formatNumber, formatRatePct, monthsFor } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * ÇEYREKLİK PRİM DİLİMİ MERDİVENİ — v2 4.7.
 *
 * Excel kuralı: ekstra komisyon ORANI çeyreğin AYLIK ORTALAMA satışına göre
 * seçilir, ancak tutar çeyrek TOPLAMI üzerinden hesaplanır. Bu yüzden
 * merdivenin eşikleri "aylık ortalama" cinsindendir.
 *
 * Her adımda "bu dilime ulaşmak için ne kadar daha satmalıyım" hem € hem de
 * tahmini deal adedi olarak yazılır — agent'ın istediği motivasyon dili.
 */
export function QuarterTierLadder() {
  const { t, lang } = useLang();
  const q = QUARTER_PROGRESS;
  const months = monthsFor(lang);

  const quarterMonthLabels = QUARTER_MONTHS[CURRENT_QUARTER].map((m) => months[m]).join(" · ");

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle
        hint={t(
          "Çeyreklik ekstra prim oranı, çeyreğin AYLIK ORTALAMA satışına göre seçilir; tutar ise çeyreğin TOPLAM satışı üzerinden hesaplanır.",
          "The quarterly extra commission rate is set by your quarterly MONTHLY AVERAGE sales; the amount is then calculated on the quarter's TOTAL sales.",
        )}
        aside={
          <span className="shrink-0 rounded-pill bg-violet/12 px-2.5 py-1 font-mono text-[11px] font-semibold text-violet">
            {CURRENT_QUARTER}
          </span>
        }
      >
        <T tr="Çeyreklik Prim Dilimin" en="Your Quarterly Commission Tier" />
      </SectionTitle>

      {/* Motivasyon cümlesi — ekranın "ne yapmalıyım" cevabı */}
      <div
        className={cn(
          "flex items-start gap-2.5 rounded-card border px-4 py-3",
          q.nextBand
            ? "border-brand-secondary/35 bg-brand-secondary/10"
            : "border-success/35 bg-success/10",
        )}
      >
        <Target
          size={15}
          aria-hidden
          className={cn("mt-0.5 shrink-0", q.nextBand ? "text-brand-secondary" : "text-success")}
        />
        <p className="font-body text-[12.5px] leading-relaxed text-fg">
          {q.nextBand ? (
            <T
              tr={`Şu anda ${formatRatePct(q.currentRatePct)} dilimindesin. ${formatRatePct(q.nextBand.ratePct)} dilimine geçmek için çeyrek sonuna kadar ${formatCurrencyEUR(q.gapToNextEUR)} daha satman gerekiyor — ortalama deal tutarınla bu yaklaşık ${q.gapToNextDeals} deal. Geçersen çeyreklik ekstra primin ${formatCurrencyEUR(q.extraEUR)} yerine ${formatCurrencyEUR(q.nextExtraEUR)} olur.`}
              en={`You're currently in the ${q.currentRatePct}% tier. To reach the ${q.nextBand.ratePct}% tier you need ${formatCurrencyEUR(q.gapToNextEUR)} more in sales by quarter-end — about ${q.gapToNextDeals} deals at your average deal size. If you get there, your quarterly extra commission becomes ${formatCurrencyEUR(q.nextExtraEUR)} instead of ${formatCurrencyEUR(q.extraEUR)}.`}
            />
          ) : (
            <T
              tr={`En üst çeyrek prim dilimindesin (${formatRatePct(q.currentRatePct)}). Çeyrek toplamın üzerinden ${formatCurrencyEUR(q.extraEUR)} ekstra prim hak ediyorsun.`}
              en={`You're in the top quarterly tier (${q.currentRatePct}%). You've earned ${formatCurrencyEUR(q.extraEUR)} in extra commission on your quarter total.`}
            />
          )}
        </p>
      </div>

      {/* Çeyreğin ay kırılımı */}
      <div className="flex flex-col gap-2">
        <span className="font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted">
          {quarterMonthLabels}
        </span>
        <div className="grid grid-cols-3 gap-2">
          {CURRENT_QUARTER_MONTHS.map((cell) => (
            <div
              key={cell.key}
              className={cn(
                "flex flex-col gap-0.5 rounded-control border px-2.5 py-2",
                cell.status === "current"
                  ? "border-brand/40 bg-brand/8"
                  : cell.status === "projected"
                    ? "border-dashed border-border bg-transparent"
                    : "border-border bg-elevated",
              )}
            >
              <span className="font-body text-[10.5px] text-fg-muted">
                {months[cell.monthIndex]}
                {cell.status === "current" && ` · ${t("bu ay", "current")}`}
                {cell.status === "projected" && ` · ${t("tahmin", "est.")}`}
              </span>
              <span
                className={cn(
                  "font-mono text-[12.5px] font-semibold",
                  cell.status === "projected" ? "text-fg-muted" : "text-fg",
                )}
              >
                {formatCurrencyEUR(cell.salesEUR)}
              </span>
            </div>
          ))}
        </div>
        <p className="font-body text-[11px] text-fg-secondary">
          <T tr="Bugüne kadar çeyrek toplamı:" en="Quarter total so far:" />{" "}
          <span className="font-mono font-semibold text-fg">
            {formatCurrencyEUR(QUARTER_TO_DATE_EUR)}
          </span>{" "}
          ·{" "}
          <T tr="aylık ortalama:" en="monthly average:" />{" "}
          <span className="font-mono font-semibold text-fg">
            {formatCurrencyEUR(Math.round(q.monthlyAvgEUR))}
          </span>{" "}
          <span className="text-fg-muted">
            ({formatNumber(MONTHS_ELAPSED_IN_QUARTER)}/3 {t("ay", "months")})
          </span>
        </p>
      </div>

      {/* Merdiven */}
      <ol className="flex flex-col gap-1.5">
        {q.steps.map((step) => (
          <li
            key={step.monthlyAvgEUR}
            className={cn(
              "flex items-center justify-between gap-3 rounded-control border px-3 py-2 transition-colors",
              step.isCurrent
                ? "border-brand/45 bg-brand/10"
                : step.isNext
                  ? "border-brand-secondary/45 bg-brand-secondary/8"
                  : step.reached
                    ? "border-border bg-elevated"
                    : "border-border bg-transparent",
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-pill font-mono text-[10px] font-bold",
                  step.reached
                    ? "bg-success/20 text-success"
                    : step.isNext
                      ? "bg-brand-secondary/20 text-brand-secondary"
                      : "bg-neutral/15 text-fg-muted",
                )}
              >
                {step.reached ? <Check size={11} /> : formatRatePct(step.ratePct).replace("%", "")}
              </span>
              <span className="flex min-w-0 flex-col">
                <span
                  className={cn(
                    "font-mono text-[12.5px] font-semibold",
                    step.reached || step.isNext ? "text-fg" : "text-fg-secondary",
                  )}
                >
                  {formatRatePct(step.ratePct)}
                </span>
                <span className="truncate font-body text-[10.5px] text-fg-muted">
                  <T tr="aylık ortalama" en="monthly avg" />{" "}
                  {formatCurrencyEUR(step.monthlyAvgEUR)}+
                </span>
              </span>
            </span>

            <span className="shrink-0 text-right">
              {step.isCurrent ? (
                <span className="rounded-pill bg-brand/15 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-brand">
                  {t("buradasın", "you are here")}
                </span>
              ) : step.reached ? (
                <span className="font-body text-[10.5px] text-success">
                  {t("geçildi", "reached")}
                </span>
              ) : (
                <span className="flex flex-col">
                  <span
                    className={cn(
                      "font-mono text-[11.5px] font-semibold",
                      step.isNext ? "text-brand-secondary" : "text-fg-secondary",
                    )}
                  >
                    +{formatCurrencyEUR(step.gapEUR)}
                  </span>
                  <span className="font-body text-[10px] text-fg-muted">
                    ≈{formatNumber(step.gapDeals)} {t("deal", "deals")}
                  </span>
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
