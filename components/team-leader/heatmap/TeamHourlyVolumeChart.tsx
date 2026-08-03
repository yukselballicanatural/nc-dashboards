"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { DURATION } from "@/lib/motion";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AXIS_TICK, InlineLegend, TooltipFrame } from "@/components/ui/ChartBits";

/**
 * Takım geneli saatlik hacim — tüm agent'ların saat-of-day toplamı. Isı
 * haritası "kim ne zaman" derken bu grafik "takım toplamı hangi saatte
 * yoğun" sorusuna cevap verir; vardiya/kapasite planlaması için.
 */

function makeChartTooltip(totalLabel: string, answeredLabel: string) {
  return function ChartTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
    if (!active || !payload?.length) return null;
    return (
      <TooltipFrame
        title={`${label}:00`}
        rows={payload.map((entry) => ({
          label: entry.dataKey === "total" ? totalLabel : answeredLabel,
          value: String(entry.value ?? 0),
          color: entry.dataKey === "total" ? "var(--indigo)" : "var(--brand)",
        }))}
      />
    );
  };
}

export function TeamHourlyVolumeChart() {
  const { data } = useTeamDateRange();
  const { t } = useLang();
  const totalLabel = t("Toplam", "Total");
  const answeredLabel = t("Cevaplanan", "Answered");
  const ChartTooltip = makeChartTooltip(totalLabel, answeredLabel);
  const isEmpty = data.hourlyAggregate.every((h) => h.total === 0);

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle
        hint={t("Takımın toplam arama hacminin mesai saatlerine (09-18) dağılımı — kapasite ve vardiya planlaması için.", "Distribution of the team's total call volume across working hours (09-18) — for capacity and shift planning.")}
        aside={
          <InlineLegend
            items={[
              { label: totalLabel, color: "var(--indigo)" },
              { label: answeredLabel, color: "var(--brand)" },
            ]}
          />
        }
      >
        <T tr="Takım Saatlik Arama Hacmi" en="Team Hourly Call Volume" />
      </SectionTitle>

      {isEmpty ? (
        <p className="flex h-40 items-center justify-center font-body text-sm text-fg-muted">
          <T tr="Bu aralıkta henüz arama verisi yok." en="No call data yet in this range." />
        </p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.hourlyAggregate} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barGap={2}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={AXIS_TICK} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={AXIS_TICK} />
              <Tooltip content={ChartTooltip} cursor={{ fill: "var(--elevated)" }} />
              <Bar dataKey="total" fill="var(--indigo)" radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false} animationDuration={DURATION.chart * 1000} animationEasing="ease-out" />
              <Bar dataKey="answered" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false} animationDuration={DURATION.chart * 1000} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
