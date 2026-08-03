"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import {
  MONTHLY_EARNINGS,
  QUARTER_EARNINGS,
  YEAR_PROJECTION,
} from "@/lib/mock/agent-earnings";
import { DURATION } from "@/lib/motion";
import { formatCurrencyEUR, formatRatePct, monthsFor } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { InlineLegend, AXIS_TICK, TooltipFrame } from "@/components/ui/ChartBits";
import { cn } from "@/lib/utils/cn";

/**
 * YIL SONU PRİM PROJEKSİYONU — v2 4.7.
 *
 * Barlar: her ayın AYLIK komisyonu. Gerçekleşen aylar dolu marka renginde,
 * projeksiyon aylar soluk/nötr. Çeyreklik ekstra primler aylık komisyona
 * eklenmez (ayrı bir kalem oldukları için) — altta çeyrek bazlı olarak
 * kendi satırlarında listelenir ve yıl toplamına orada dahil edilir.
 */

interface ChartRow {
  label: string;
  commissionEUR: number;
  salesEUR: number;
  ratePct: number;
  projected: boolean;
  current: boolean;
}

function ChartTooltip({
  active,
  payload,
}: TooltipContentProps<ValueType, NameType>) {
  const { t } = useLang();
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as ChartRow | undefined;
  if (!row) return null;

  return (
    <TooltipFrame
      title={
        row.projected
          ? `${row.label} · ${t("projeksiyon", "projected")}`
          : row.current
            ? `${row.label} · ${t("bu ay", "current month")}`
            : row.label
      }
      rows={[
        {
          label: t("Aylık prim", "Monthly commission"),
          value: formatCurrencyEUR(row.commissionEUR),
          color: row.projected ? "var(--neutral)" : "var(--brand)",
        },
        { label: t("Satış", "Sales"), value: formatCurrencyEUR(row.salesEUR) },
        { label: t("Oran", "Rate"), value: formatRatePct(row.ratePct) },
      ]}
    />
  );
}

export function YearProjectionChart() {
  const { t, lang } = useLang();
  const months = monthsFor(lang);

  const data: ChartRow[] = MONTHLY_EARNINGS.map((row) => ({
    label: months[row.monthIndex] ?? row.key,
    commissionEUR: row.commissionEUR,
    salesEUR: row.salesEUR,
    ratePct: row.ratePct,
    projected: row.status === "projected",
    current: row.status === "current",
  }));

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={t(
          "Dolu barlar gerçekleşen aylık primin, soluk barlar mevcut satış temponla kalan aylar için projeksiyon. Çeyreklik ekstra primler aylık primden ayrı bir kalemdir; aşağıda çeyrek bazında listelenir.",
          "Solid bars are your realized monthly commission; faded bars project the remaining months at your current sales pace. Quarterly extra commission is a separate line item, listed by quarter below.",
        )}
        aside={
          <InlineLegend
            items={[
              { label: t("Gerçekleşen", "Realized"), color: "var(--brand)" },
              { label: t("Projeksiyon", "Projected"), color: "var(--neutral)" },
            ]}
          />
        }
      >
        <T tr="Yıl Sonu Prim Projeksiyonu" en="Year-End Commission Projection" />
      </SectionTitle>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <YAxis
              tickFormatter={(v: number) => `${Math.round(v)}`}
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
            />
            <Tooltip content={ChartTooltip} cursor={{ fill: "var(--elevated)" }} />
            <Bar
              dataKey="commissionEUR"
              radius={[3, 3, 0, 0]}
              maxBarSize={26}
              isAnimationActive={false}
              animationDuration={DURATION.chart * 1000}
            >
              {data.map((row) => (
                <Cell
                  key={row.label}
                  fill={row.projected ? "var(--neutral)" : "var(--brand)"}
                  fillOpacity={row.projected ? 0.45 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Çeyreklik ekstra primler */}
      <div className="flex flex-col gap-1.5">
        <span className="font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted">
          <T
            tr={`${YEAR_PROJECTION.year} içinde ödenen çeyreklik ekstra primler`}
            en={`Quarterly extra commission paid within ${YEAR_PROJECTION.year}`}
          />
        </span>
        {QUARTER_EARNINGS.map((q) => (
          <div
            key={`${q.quarter}-${q.endYear}`}
            className="flex items-center justify-between gap-3 rounded-control border border-border bg-elevated px-3 py-1.5"
          >
            <span className="flex items-center gap-2 font-body text-[11.5px] text-fg-secondary">
              <span className="font-mono font-semibold text-fg">{q.quarter}</span>
              <span className="text-fg-muted">
                {q.months.map((m) => months[m.monthIndex]).join("·")}
              </span>
              {!q.settled && (
                <span className="rounded-pill bg-neutral/15 px-1.5 py-0.5 font-body text-[9.5px] font-semibold uppercase text-fg-muted">
                  {t("açık", "open")}
                </span>
              )}
            </span>
            <span className="flex shrink-0 items-center gap-2.5">
              <span className="font-mono text-[11px] text-fg-muted">
                {formatRatePct(q.ratePct)}
              </span>
              <span
                className={cn(
                  "font-mono text-[12px] font-semibold",
                  q.settled ? "text-fg" : "text-fg-secondary",
                )}
              >
                {formatCurrencyEUR(q.extraEUR)}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Yıl toplamı */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-brand/30 bg-brand/8 px-4 py-3">
        <div className="flex flex-col">
          <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-fg-secondary">
            <T
              tr={`${YEAR_PROJECTION.year} Yıl Sonu Tahmini Toplam Prim`}
              en={`Projected Total Commission for ${YEAR_PROJECTION.year}`}
            />
          </span>
          <span className="font-body text-[10.5px] text-fg-muted">
            <T tr="aylık + çeyreklik ekstra" en="monthly + quarterly extra" />
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-mono text-[22px] font-bold leading-none text-brand">
            {formatCurrencyEUR(YEAR_PROJECTION.totalEUR)}
          </span>
          <span className="mt-1 font-body text-[10.5px] text-fg-muted">
            <T tr="kesinleşen" en="settled" />{" "}
            <span className="font-mono text-fg-secondary">
              {formatCurrencyEUR(YEAR_PROJECTION.earnedTotalEUR)}
            </span>{" "}
            ·{" "}
            <T tr="kalan projeksiyon" en="remaining projected" />{" "}
            <span className="font-mono text-fg-secondary">
              {formatCurrencyEUR(YEAR_PROJECTION.remainingTotalEUR)}
            </span>
          </span>
        </div>
      </div>
    </Card>
  );
}
