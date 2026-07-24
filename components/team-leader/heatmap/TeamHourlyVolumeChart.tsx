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
import { DURATION } from "@/lib/motion";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AXIS_TICK, InlineLegend, TooltipFrame } from "@/components/ui/ChartBits";

/**
 * Takım geneli saatlik hacim — tüm agent'ların saat-of-day toplamı. Isı
 * haritası "kim ne zaman" derken bu grafik "takım toplamı hangi saatte
 * yoğun" sorusuna cevap verir; vardiya/kapasite planlaması için.
 */

function ChartTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <TooltipFrame
      title={`${label}:00`}
      rows={payload.map((entry) => ({
        label: entry.dataKey === "total" ? "Toplam" : "Cevaplanan",
        value: String(entry.value ?? 0),
        color: entry.dataKey === "total" ? "var(--indigo)" : "var(--brand)",
      }))}
    />
  );
}

export function TeamHourlyVolumeChart() {
  const { data } = useTeamDateRange();
  const isEmpty = data.hourlyAggregate.every((h) => h.total === 0);

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle
        hint="Takımın toplam arama hacminin mesai saatlerine (09-18) dağılımı — kapasite ve vardiya planlaması için."
        aside={
          <InlineLegend
            items={[
              { label: "Toplam", color: "var(--indigo)" },
              { label: "Cevaplanan", color: "var(--brand)" },
            ]}
          />
        }
      >
        Takım Saatlik Arama Hacmi
      </SectionTitle>

      {isEmpty ? (
        <p className="flex h-40 items-center justify-center font-body text-sm text-fg-muted">
          Bu aralıkta henüz arama verisi yok.
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
