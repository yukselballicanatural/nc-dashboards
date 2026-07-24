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
import { HOURLY_REACH_TODAY } from "@/lib/mock/mock-data";
import { DURATION } from "@/lib/motion";
import { formatPercent } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AXIS_TICK, TooltipFrame } from "@/components/ui/ChartBits";

/**
 * Saatlik ulaşım oranı (bugün) — v2 4.2: % eksenli çizgi.
 * Hangi saatte telefonların daha çok açıldığını gösterir; çağrı olmayan
 * saatler boşluk olarak kalır (null → connectNulls kapalı).
 */

function ChartTooltip({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType>) {
  const { t } = useLang();
  if (!active || !payload?.length || payload[0].value == null) return null;
  return (
    <TooltipFrame
      title={`${label}:00`}
      rows={[
        {
          label: t("Ulaşım", "Reach"),
          value: formatPercent(Number(payload[0].value)),
          color: "var(--brand)",
        },
      ]}
    />
  );
}

export function HourlyReachChart() {
  const { t } = useLang();

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={t(
          "Bugün saat bazında cevaplanma yüzdesi — en verimli arama saatlerini keşfet.",
          "Today's answer percentage by hour — discover your most productive calling hours.",
        )}
      >
        {t("Saatlik Ulaşım Oranı (Bugün)", "Hourly Reach Rate (Today)")}
      </SectionTitle>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={HOURLY_REACH_TODAY}
            margin={{ top: 6, right: 8, bottom: 0, left: -18 }}
          >
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v: number) => `%${v}`}
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
            />
            <Tooltip content={ChartTooltip} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="ratePct"
              stroke="var(--brand)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "var(--brand)", strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={false}
              animationDuration={DURATION.chart * 1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
