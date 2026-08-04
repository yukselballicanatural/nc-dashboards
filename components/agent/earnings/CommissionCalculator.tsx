"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  monthlyCommission,
  quarterProgress,
  type MonthlyCommissionResult,
} from "@/lib/mock/commission";
import {
  AGENT_REGION,
  AGENT_TENURE_DAYS,
  AVG_DEAL_EUR,
  CURRENT_QUARTER,
  MONTH_TO_DATE,
  MONTHS_ELAPSED_IN_QUARTER,
  QUARTER_TO_DATE_EUR,
} from "@/lib/mock/agent-earnings";
import { formatCurrencyEUR, formatNumber, formatRatePct } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * PRİM HESAPLAYICI — "X kadar satarsam ne kazanırım / sonraki dilime kaç %
 * artış gerekiyor" sorusunu canlı simüle eder. Kaydırıcılar `commission.ts`
 * daki SAF kural fonksiyonlarını (monthlyCommission/quarterProgress)
 * doğrudan çağırır — gerçek prim motoruyla birebir aynı sonucu üretir,
 * ayrı/tahmini bir hesap değildir.
 */

const MONTH_SLIDER_MAX = 60_000;
const MONTH_SLIDER_STEP = 250;
const QUARTER_SLIDER_MAX = 55_000;
const QUARTER_SLIDER_STEP = 250;

const BAND_LABEL_TR: Record<MonthlyCommissionResult["band"], string> = {
  "new-hire": "Yeni işe alım",
  standard: "Standart",
  high: "Yüksek performans",
  "below-minimum": "Minimum altı",
};
const BAND_LABEL_EN: Record<MonthlyCommissionResult["band"], string> = {
  "new-hire": "New hire",
  standard: "Standard",
  high: "High performance",
  "below-minimum": "Below minimum",
};

function roundStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function MiniStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-control px-2.5 py-2",
        highlight ? "bg-brand/10" : "bg-elevated",
      )}
    >
      <span className="font-body text-[9.5px] font-semibold uppercase tracking-wide text-fg-muted">
        {label}
      </span>
      <span className={cn("font-mono text-[13px] font-bold", highlight ? "text-brand" : "text-fg")}>
        {value}
      </span>
    </div>
  );
}

export function CommissionCalculator() {
  const { t } = useLang();

  const defaultMonthly = roundStep(MONTH_TO_DATE.salesEUR, MONTH_SLIDER_STEP);
  const defaultQuarterAvg = roundStep(
    QUARTER_TO_DATE_EUR / Math.max(1, MONTHS_ELAPSED_IN_QUARTER),
    QUARTER_SLIDER_STEP,
  );

  const [monthlySales, setMonthlySales] = useState(defaultMonthly);
  const [quarterAvg, setQuarterAvg] = useState(defaultQuarterAvg);

  const monthResult = useMemo(
    () =>
      monthlyCommission({
        region: AGENT_REGION,
        role: "Salesperson",
        tenureDays: AGENT_TENURE_DAYS,
        monthlySalesEUR: monthlySales,
      }),
    [monthlySales],
  );

  const monthGapEUR =
    monthResult.nextThresholdEUR !== null
      ? Math.max(0, monthResult.nextThresholdEUR - monthlySales)
      : 0;
  const monthGapPct =
    monthResult.nextThresholdEUR !== null && monthlySales > 0
      ? (monthGapEUR / monthlySales) * 100
      : null;
  const monthGapDeals = monthGapEUR > 0 ? Math.ceil(monthGapEUR / Math.max(1, AVG_DEAL_EUR)) : 0;
  const monthAtNextTier =
    monthResult.nextThresholdEUR !== null
      ? monthlyCommission({
          region: AGENT_REGION,
          role: "Salesperson",
          tenureDays: AGENT_TENURE_DAYS,
          monthlySalesEUR: monthResult.nextThresholdEUR,
        })
      : null;

  const quarterResult = useMemo(
    () =>
      quarterProgress({
        quarter: CURRENT_QUARTER,
        quarterTotalEUR: quarterAvg * MONTHS_ELAPSED_IN_QUARTER,
        monthsElapsed: MONTHS_ELAPSED_IN_QUARTER,
        avgDealEUR: AVG_DEAL_EUR,
      }),
    [quarterAvg],
  );

  const quarterGapPct =
    quarterResult.nextBand && quarterAvg > 0
      ? ((quarterResult.nextBand.monthlyAvgEUR - quarterAvg) / quarterAvg) * 100
      : null;

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle
        hint={t(
          "Kaydırıcıları hareket ettir — hesap gerçek prim motoruyla birebir aynı kuralları kullanır.",
          "Drag the sliders — the calculation uses the exact same rules as the real commission engine.",
        )}
      >
        <T tr="Prim Hesaplayıcı" en="Commission Calculator" />
      </SectionTitle>

      {/* Aylık senaryo */}
      <div className="flex flex-col gap-3 rounded-control border border-border bg-surface px-3.5 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-body text-[11.5px] font-semibold text-fg">
            <T tr="Bu ay ne kadar satarsan..." en="If you sell this much this month..." />
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[15px] font-bold text-brand">
              {formatCurrencyEUR(monthlySales)}
            </span>
            <button
              type="button"
              onClick={() => setMonthlySales(defaultMonthly)}
              aria-label={t("Şu anki satışına sıfırla", "Reset to your current sales")}
              title={t("Şu anki satışına sıfırla", "Reset to your current sales")}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-elevated hover:text-fg"
            >
              <RotateCcw size={12} aria-hidden />
            </button>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={MONTH_SLIDER_MAX}
          step={MONTH_SLIDER_STEP}
          value={monthlySales}
          onChange={(e) => setMonthlySales(Number(e.target.value))}
          className="w-full accent-brand"
          aria-label={t("Aylık satış senaryosu (€)", "Monthly sales scenario (€)")}
        />
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label={t("Oran", "Rate")} value={formatRatePct(monthResult.ratePct)} />
          <MiniStat
            label={t("Prim", "Commission")}
            value={formatCurrencyEUR(monthResult.commissionEUR)}
            highlight
          />
          <MiniStat
            label={t("Bant", "Band")}
            value={t(BAND_LABEL_TR[monthResult.band], BAND_LABEL_EN[monthResult.band])}
          />
        </div>
        {monthResult.nextThresholdEUR !== null && monthAtNextTier ? (
          <p className="rounded-control bg-brand/8 px-3 py-2 font-body text-[11.5px] leading-relaxed text-fg">
            <T
              tr={`${monthGapPct !== null ? `%${formatNumber(monthGapPct, 1)} daha satarsan ` : ""}(+${formatCurrencyEUR(monthGapEUR)}${monthGapDeals > 0 ? ` · ≈${formatNumber(monthGapDeals)} deal` : ""}) ${formatRatePct(monthResult.nextRatePct ?? 0)} dilimine geçersin — primin ${formatCurrencyEUR(monthAtNextTier.commissionEUR)} olur.`}
              en={`${monthGapPct !== null ? `Sell ${formatNumber(monthGapPct, 1)}% more ` : ""}(+${formatCurrencyEUR(monthGapEUR)}${monthGapDeals > 0 ? ` · ≈${formatNumber(monthGapDeals)} deals` : ""}) and you reach the ${formatRatePct(monthResult.nextRatePct ?? 0)} tier — your commission becomes ${formatCurrencyEUR(monthAtNextTier.commissionEUR)}.`}
            />
          </p>
        ) : monthResult.band === "high" ? (
          <p className="rounded-control bg-success/10 px-3 py-2 font-body text-[11.5px] text-success">
            <T tr="En yüksek aylık bandasın — üstünde dilim yok." en="You're at the top monthly band — no tier above this." />
          </p>
        ) : (
          <p className="rounded-control bg-elevated px-3 py-2 font-body text-[11.5px] text-fg-secondary">
            <T
              tr="Yeni işe alım döneminde oran satışa göre değişmez, kıdeme bağlıdır."
              en="During the new-hire period the rate doesn't depend on sales — it's tenure-based."
            />
          </p>
        )}
      </div>

      {/* Çeyreklik senaryo */}
      <div className="flex flex-col gap-3 rounded-control border border-border bg-surface px-3.5 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-body text-[11.5px] font-semibold text-fg">
            <T
              tr={`${CURRENT_QUARTER} çeyreğinde aylık ortalaman bu olursa...`}
              en={`If your monthly average in ${CURRENT_QUARTER} is this...`}
            />
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[15px] font-bold text-violet">
              {formatCurrencyEUR(quarterAvg)}
            </span>
            <button
              type="button"
              onClick={() => setQuarterAvg(defaultQuarterAvg)}
              aria-label={t("Şu anki ortalamana sıfırla", "Reset to your current average")}
              title={t("Şu anki ortalamana sıfırla", "Reset to your current average")}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-elevated hover:text-fg"
            >
              <RotateCcw size={12} aria-hidden />
            </button>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={QUARTER_SLIDER_MAX}
          step={QUARTER_SLIDER_STEP}
          value={quarterAvg}
          onChange={(e) => setQuarterAvg(Number(e.target.value))}
          className="w-full accent-violet"
          aria-label={t("Çeyreklik aylık ortalama senaryosu (€)", "Quarterly monthly average scenario (€)")}
        />
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label={t("Dilim", "Tier")} value={formatRatePct(quarterResult.currentRatePct)} />
          <MiniStat
            label={t("Çeyrek Ekstra", "Quarter Extra")}
            value={formatCurrencyEUR(quarterResult.extraEUR)}
            highlight
          />
          <MiniStat
            label={t("Çeyrek Toplam", "Quarter Total")}
            value={formatCurrencyEUR(quarterAvg * MONTHS_ELAPSED_IN_QUARTER)}
          />
        </div>
        {quarterResult.nextBand ? (
          <p className="rounded-control bg-violet/8 px-3 py-2 font-body text-[11.5px] leading-relaxed text-fg">
            <T
              tr={`${quarterGapPct !== null ? `Aylık ortalamanı %${formatNumber(quarterGapPct, 1)} artırırsan ` : ""}(${formatCurrencyEUR(quarterResult.nextBand.monthlyAvgEUR)}/ay) ${formatRatePct(quarterResult.nextBand.ratePct)} dilimine geçersin.`}
              en={`${quarterGapPct !== null ? `Raise your monthly average by ${formatNumber(quarterGapPct, 1)}% ` : ""}(to ${formatCurrencyEUR(quarterResult.nextBand.monthlyAvgEUR)}/mo) and you reach the ${formatRatePct(quarterResult.nextBand.ratePct)} tier.`}
            />
          </p>
        ) : (
          <p className="rounded-control bg-success/10 px-3 py-2 font-body text-[11.5px] text-success">
            <T tr="En yüksek çeyreklik dilimdesin — üstünde dilim yok." en="You're at the top quarterly tier — no tier above this." />
          </p>
        )}
      </div>
    </Card>
  );
}
