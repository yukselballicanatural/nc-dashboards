"use client";

import { Check, Info } from "lucide-react";
import {
  AGENT_REGION,
  AGENT_TENURE_DAYS,
  AVG_DEAL_EUR,
  CURRENT_QUARTER,
  CURRENT_YEAR,
  DAILY_COMMISSION_ROWS,
  DAY_OF_MONTH,
  DAYS_IN_MONTH,
  MONTH_TO_DATE,
  MONTHLY_EARNINGS,
  QUARTER_EARNINGS,
  QUARTER_PROGRESS,
  YEAR_PROJECTION,
} from "@/lib/mock/agent-earnings";
import {
  MONTHLY_RULES,
  QUARTER_MONTHS,
  QUARTERLY_BANDS_Q123,
  QUARTERLY_BANDS_Q4,
  type QuarterKey,
} from "@/lib/mock/commission";
import { formatCurrencyEUR, formatNumber, formatRatePct, monthsFor } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SidePanel } from "@/components/ui/SidePanel";
import { cn } from "@/lib/utils/cn";
import { CommissionCalculator } from "./CommissionCalculator";

/**
 * PRİM DETAY SAYFASI — para bandına tıklanınca sağdan açılan Notion-tarzı
 * derinlemesine görünüm. Sayfadaki inline özet (günlük tablo/merdiven/yıl
 * grafiği) "şu an ne durumdayım" sorusuna cevap verir; bu panel "kurallar
 * TAM OLARAK nasıl işliyor, tüm ay/çeyrek/yıl boyunca ne oldu" sorusuna.
 * Bu yüzden içerik sayfadakini KOPYALAMAZ — referans tabloları, tüm ayın
 * ham dökümü ve 4 çeyreğin tam matrisi gibi sayfada yer almayan detayları
 * ekler.
 */
export interface EarningsDetailDrawerProps {
  open: boolean;
  onClose: () => void;
}

const REGION_LABEL_TR: Record<typeof AGENT_REGION, string> = {
  Istanbul: "İstanbul",
  Morocco: "Fas",
};
const REGION_LABEL_EN: Record<typeof AGENT_REGION, string> = {
  Istanbul: "Istanbul",
  Morocco: "Morocco",
};

export function EarningsDetailDrawer({ open, onClose }: EarningsDetailDrawerProps) {
  const { t, lang } = useLang();
  const months = monthsFor(lang);
  const rule = MONTHLY_RULES[AGENT_REGION];
  const q = QUARTER_PROGRESS;

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={<T tr="Prim Detayın" en="Your Commission in Detail" />}
      subtitle={t(
        `${REGION_LABEL_TR[AGENT_REGION]} komisyon tablosu · kıdem ${formatNumber(AGENT_TENURE_DAYS)} gün`,
        `${REGION_LABEL_EN[AGENT_REGION]} commission table · tenure ${formatNumber(AGENT_TENURE_DAYS)} days`,
      )}
    >
      {/* Özet şerit */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: t("Bu Ay Biriken", "Accrued This Month"),
            value: formatCurrencyEUR(MONTH_TO_DATE.commissionEUR),
          },
          {
            label: t("Aylık Oran", "Monthly Rate"),
            value: formatRatePct(MONTH_TO_DATE.ratePct),
          },
          {
            label: t(`${CURRENT_QUARTER} Dilim`, `${CURRENT_QUARTER} Tier`),
            value: formatRatePct(q.currentRatePct),
          },
          {
            label: t("Yıl Sonu Tahmini", "Year-End Estimate"),
            value: formatCurrencyEUR(YEAR_PROJECTION.totalEUR),
          },
        ].map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5 rounded-control border border-border bg-surface px-3 py-2.5">
            <span className="font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
              {item.label}
            </span>
            <span className="font-mono text-[15px] font-bold text-fg">{item.value}</span>
          </div>
        ))}
      </div>

      {/* 1 — Aylık kural referansı */}
      <Card className="flex flex-col gap-3">
        <SectionTitle>
          <T tr="Aylık Prim Kuralın" en="Your Monthly Commission Rule" />
        </SectionTitle>
        <p className="font-body text-[12px] leading-relaxed text-fg-secondary">
          <T
            tr={`İlk ${formatNumber(rule.newHireDays)} gün (yeni işe alım dönemi) sabit %${rule.newHireRatePct} oranla çalışırsın — minimum satış hedefi yok. Bu süre dolduktan sonra oran aylık satışına göre basamaklanır.`}
            en={`For your first ${formatNumber(rule.newHireDays)} days (new-hire period) you earn a flat ${rule.newHireRatePct}% — no minimum sales target. After that, the rate is tiered by your monthly sales.`}
          />
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                {[t("Aylık Satış", "Monthly Sales"), t("Oran", "Rate"), t("Durum", "Status")].map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      "px-2.5 py-2 font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted",
                      i === 0 ? "text-left" : "text-right",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  range: `< ${formatCurrencyEUR(rule.minimumSalesEUR)}`,
                  rate: 0,
                  active: MONTH_TO_DATE.band === "below-minimum",
                },
                {
                  range: `${formatCurrencyEUR(rule.minimumSalesEUR)} – ${formatCurrencyEUR(rule.highThresholdEUR - 0.01)}`,
                  rate: rule.standardRatePct,
                  active: MONTH_TO_DATE.band === "standard",
                },
                {
                  range: `${formatCurrencyEUR(rule.highThresholdEUR)}+`,
                  rate: rule.highRatePct,
                  active: MONTH_TO_DATE.band === "high",
                },
              ].map((row) => (
                <tr
                  key={row.range}
                  className={cn(
                    "border-b border-border last:border-0",
                    row.active && "bg-brand/8",
                  )}
                >
                  <td className="px-2.5 py-2 text-left font-mono text-[11.5px] text-fg">{row.range}</td>
                  <td className="px-2.5 py-2 text-right font-mono text-[11.5px] font-semibold text-fg">
                    {formatRatePct(row.rate)}
                  </td>
                  <td className="px-2.5 py-2 text-right">
                    {row.active && (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-brand/15 px-2 py-0.5 font-body text-[9.5px] font-semibold uppercase text-brand">
                        <Check size={10} aria-hidden />
                        {t("buradasın", "you are here")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 1.5 — Prim hesaplayıcı (interaktif senaryo) */}
      <CommissionCalculator />

      {/* 2 — Tüm ayın ham dökümü */}
      <Card className="flex flex-col gap-3">
        <SectionTitle
          hint={t(
            "Satış olmayan günler de dahil — ayın tamamı boyunca birikimli satış ve prim nasıl ilerledi.",
            "Includes days with no sales — how cumulative sales and commission progressed across the whole month.",
          )}
        >
          <T tr={`${months[MONTHLY_EARNINGS.find((m) => m.status === "current")?.monthIndex ?? 0]} Ayının Tam Dökümü`} en={`Full Breakdown of ${months[MONTHLY_EARNINGS.find((m) => m.status === "current")?.monthIndex ?? 0]}`} />
        </SectionTitle>
        <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-8">
          {Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1).map((day) => {
            const row = DAILY_COMMISSION_ROWS.find((r) => r.day === day);
            const future = day > DAY_OF_MONTH;
            return (
              <div
                key={day}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-control border px-1 py-1.5",
                  future
                    ? "border-dashed border-border bg-transparent opacity-50"
                    : row && row.salesEUR > 0
                      ? "border-brand/35 bg-brand/8"
                      : "border-border bg-surface",
                  row?.isToday && "ring-2 ring-brand-secondary",
                )}
                title={
                  row
                    ? `${day}: ${formatCurrencyEUR(row.salesEUR)} · ${t("birikim", "cumulative")} ${formatCurrencyEUR(row.cumulativeSalesEUR)}`
                    : undefined
                }
              >
                <span className="font-mono text-[9.5px] text-fg-muted">{day}</span>
                <span
                  className={cn(
                    "font-mono text-[9.5px] font-semibold",
                    row && row.salesEUR > 0 ? "text-brand" : "text-fg-muted",
                  )}
                >
                  {row && row.salesEUR > 0 ? `+${Math.round(row.salesEUR / 1000)}k` : "—"}
                </span>
              </div>
            );
          })}
        </div>
        <p className="font-body text-[11px] text-fg-muted">
          <T
            tr="Kesikli kutular henüz gelmemiş günler — bugüne kadarki tempo korunursa ay sonu satışı yukarıdaki 'Aylık Oran' kartında görünen değere ulaşır."
            en="Dashed boxes are days that haven't arrived yet — if today's pace holds, month-end sales reach the value shown in the 'Monthly Rate' card above."
          />
        </p>
      </Card>

      {/* 3 — Çeyreklik kural referansı: Q1-3 vs Q4 */}
      <Card className="flex flex-col gap-3">
        <SectionTitle
          hint={t(
            "Çeyreklik ekstra prim hedefleri Q4'te (Haziran-Temmuz-Ağustos) diğer üç çeyrekten farklıdır — Excel kaynak tablosundaki iki ayrı hedef seti burada.",
            "Quarterly extra commission targets differ for Q4 (June-July-August) from the other three quarters — the two separate target sets from the source table, side by side.",
          )}
        >
          <T tr="Çeyreklik Hedef Tabloları" en="Quarterly Target Tables" />
        </SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {([
            { key: "q123" as const, label: "Q1 / Q2 / Q3", bands: QUARTERLY_BANDS_Q123, active: CURRENT_QUARTER !== "Q4" },
            { key: "q4" as const, label: "Q4", bands: QUARTERLY_BANDS_Q4, active: CURRENT_QUARTER === "Q4" },
          ]).map((group) => (
            <div
              key={group.key}
              className={cn(
                "flex flex-col gap-1.5 rounded-control border px-3 py-2.5",
                group.active ? "border-brand/40 bg-brand/6" : "border-border bg-surface",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-body text-[11px] font-semibold text-fg">{group.label}</span>
                {group.active && (
                  <span className="rounded-pill bg-brand/15 px-2 py-0.5 font-body text-[9.5px] font-semibold uppercase text-brand">
                    {t("aktif", "active")}
                  </span>
                )}
              </div>
              <ul className="flex flex-col gap-0.5">
                {group.bands.map((b) => (
                  <li
                    key={b.monthlyAvgEUR}
                    className="flex items-center justify-between font-mono text-[11px] text-fg-secondary"
                  >
                    <span>{formatCurrencyEUR(b.monthlyAvgEUR)}+</span>
                    <span className="font-semibold text-fg">{formatRatePct(b.ratePct)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* 4 — 4 çeyreğin tam matrisi */}
      <Card className="flex flex-col gap-3">
        <SectionTitle
          hint={t(
            `${YEAR_PROJECTION.year} içinde ödemesi yapılan 4 çeyreğin ay bazlı satışı, aylık ortalaması ve ekstra primi.`,
            `Month-by-month sales, monthly average and extra commission for all 4 quarters paid within ${YEAR_PROJECTION.year}.`,
          )}
        >
          <T tr="4 Çeyreğin Tam Görünümü" en="Full View of All 4 Quarters" />
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                {[
                  t("Çeyrek", "Quarter"),
                  ...QUARTER_EARNINGS[0].months.map((_, i) => `${t("Ay", "Month")} ${i + 1}`),
                  t("Ort.", "Avg."),
                  t("Oran", "Rate"),
                  t("Ekstra Prim", "Extra Comm."),
                ].map((h, i) => (
                  <th
                    key={h + i}
                    className={cn(
                      "px-2.5 py-2 font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted",
                      i === 0 ? "text-left" : "text-right",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {QUARTER_EARNINGS.map((quarter) => (
                <tr
                  key={`${quarter.quarter}-${quarter.endYear}`}
                  className={cn(
                    "border-b border-border last:border-0",
                    quarter.quarter === CURRENT_QUARTER && !quarter.settled && "bg-brand/6",
                  )}
                >
                  <td className="px-2.5 py-2 text-left">
                    <span className="flex flex-col">
                      <span className="font-mono text-[11.5px] font-semibold text-fg">
                        {quarter.quarter}
                      </span>
                      <span className="font-body text-[9.5px] text-fg-muted">
                        {QUARTER_MONTHS[quarter.quarter as QuarterKey].map((m) => months[m]).join("·")}
                      </span>
                    </span>
                  </td>
                  {quarter.months.map((m) => (
                    <td
                      key={m.key}
                      className={cn(
                        "px-2.5 py-2 text-right font-mono text-[11px]",
                        m.status === "projected" ? "text-fg-muted" : "text-fg-secondary",
                      )}
                    >
                      {formatCurrencyEUR(m.salesEUR)}
                    </td>
                  ))}
                  <td className="px-2.5 py-2 text-right font-mono text-[11px] text-fg-secondary">
                    {formatCurrencyEUR(Math.round(quarter.monthlyAvgEUR))}
                  </td>
                  <td className="px-2.5 py-2 text-right font-mono text-[11px] font-semibold text-fg">
                    {formatRatePct(quarter.ratePct)}
                  </td>
                  <td className="px-2.5 py-2 text-right font-mono text-[12px] font-bold text-brand">
                    {formatCurrencyEUR(quarter.extraEUR)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5 — Yıl sonu hesabının formülü */}
      <Card className="flex flex-col gap-3">
        <SectionTitle>
          <T tr="Yıl Sonu Tahmini Nasıl Hesaplanıyor?" en="How the Year-End Estimate Is Calculated" />
        </SectionTitle>
        <div className="flex flex-col gap-2">
          {[
            {
              label: t("Kesinleşmiş aylık komisyon", "Settled monthly commission"),
              value: YEAR_PROJECTION.earnedMonthlyEUR,
              hint: t("geçmiş + bu ay", "past + current month"),
            },
            {
              label: t("Projeksiyon aylık komisyon", "Projected monthly commission"),
              value: YEAR_PROJECTION.remainingMonthlyEUR,
              hint: t("kalan aylar, mevcut tempoyla", "remaining months, at current pace"),
            },
            {
              label: t("Kesinleşmiş çeyreklik ekstra", "Settled quarterly extra"),
              value: YEAR_PROJECTION.settledQuarterExtraEUR,
              hint: t(`${CURRENT_YEAR} içinde tamamen kapanan çeyrekler`, `quarters fully closed within ${CURRENT_YEAR}`),
            },
            {
              label: t("Açık çeyreklik ekstra", "Open quarterly extra"),
              value: YEAR_PROJECTION.openQuarterExtraEUR,
              hint: t("süren/gelecek çeyrekler, mevcut tempoyla", "ongoing/future quarters, at current pace"),
            },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 rounded-control border border-border bg-surface px-3 py-2">
              <span className="flex flex-col">
                <span className="font-body text-[11.5px] text-fg">{row.label}</span>
                <span className="font-body text-[10px] text-fg-muted">{row.hint}</span>
              </span>
              <span className="shrink-0 font-mono text-[13px] font-semibold text-fg">
                {formatCurrencyEUR(row.value)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 rounded-control border border-brand/35 bg-brand/10 px-3 py-2.5">
            <span className="font-body text-[12px] font-semibold text-fg">
              <T tr="Toplam" en="Total" />
            </span>
            <span className="font-mono text-[16px] font-bold text-brand">
              {formatCurrencyEUR(YEAR_PROJECTION.totalEUR)}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-2.5 rounded-control border border-border bg-elevated px-3 py-2.5">
          <Info size={14} aria-hidden className="mt-0.5 shrink-0 text-indigo" />
          <p className="font-body text-[11px] leading-relaxed text-fg-secondary">
            <T
              tr={`Ortalama deal tutarın ${formatCurrencyEUR(AVG_DEAL_EUR)} — dilim merdivenindeki "≈N deal" tahminleri bu ortalamadan hesaplanır.`}
              en={`Your average deal size is ${formatCurrencyEUR(AVG_DEAL_EUR)} — the "≈N deals" estimates on the tier ladder are calculated from this average.`}
            />
          </p>
        </div>
      </Card>
    </SidePanel>
  );
}
