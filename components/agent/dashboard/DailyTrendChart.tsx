"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
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
import { useDateRange } from "@/components/agent/filters/DateRangeContext";
import { useLang } from "@/components/i18n/LanguageProvider";
import { DURATION } from "@/lib/motion";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AXIS_TICK, InlineLegend, TooltipFrame } from "@/components/ui/ChartBits";

/**
 * Günlük arama trendi — v2 4.2: son 14 gün, toplam vs cevaplanan (çizgi).
 */

function ChartTooltip({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType>) {
  const { t } = useLang();
  if (!active || !payload?.length) return null;
  return (
    <TooltipFrame
      title={String(label)}
      rows={payload.map((entry) => ({
        label: entry.dataKey === "total" ? t("Toplam", "Total") : t("Cevaplanan", "Answered"),
        value: String(entry.value ?? 0),
        color: entry.dataKey === "total" ? "var(--indigo)" : "var(--brand)",
      }))}
    />
  );
}

export function DailyTrendChart() {
  const { data } = useDateRange();
  const { t } = useLang();

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={t(
          "Seçili dönemde günlük arama hacmin ve kaçının cevaplandığı — tempo düşüşlerini burada yakala.",
          "Your daily call volume and how many were answered in the selected period — catch pace drops here.",
        )}
        aside={
          <InlineLegend
            items={[
              { label: t("Toplam", "Total"), color: "var(--indigo)" },
              { label: t("Cevaplanan", "Answered"), color: "var(--brand)" },
            ]}
          />
        }
      >
        {t("Günlük Arama Trendi", "Daily Call Trend")}
      </SectionTitle>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data.dailyTrend}
            margin={{ top: 6, right: 8, bottom: 0, left: -26 }}
          >
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={AXIS_TICK} interval={1} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <Tooltip content={ChartTooltip} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="total"
              stroke="var(--indigo)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
              isAnimationActive={false}
              animationDuration={DURATION.chart * 1000}
            />
            <Line
              type="monotone"
              dataKey="answered"
              stroke="var(--brand)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
              isAnimationActive={false}
              animationDuration={DURATION.chart * 1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
