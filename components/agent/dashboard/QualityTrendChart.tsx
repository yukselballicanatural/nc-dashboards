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
import { QUALITY_TREND } from "@/lib/mock/mock-data";
import { DURATION } from "@/lib/motion";
import { formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AXIS_TICK, InlineLegend, TooltipFrame } from "@/components/ui/ChartBits";

/**
 * Kalite puanı trendi — v2 4.5: son 30 gün, agent (violet, kalın) vs
 * takım ortalaması (kesikli nötr).
 */

function ChartTooltip({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <TooltipFrame
      title={String(label)}
      rows={payload.map((entry) => ({
        label: entry.dataKey === "agent" ? "Sen" : "Takım Ort.",
        value: formatNumber(Number(entry.value ?? 0), 1),
        color: entry.dataKey === "agent" ? "var(--violet)" : "var(--neutral)",
      }))}
    />
  );
}

export function QualityTrendChart() {

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint="Kalite ekibinin çağrı değerlendirme puanların (0-100) — kesikli çizgi takım ortalaması."
        aside={
          <InlineLegend
            items={[
              { label: "Sen", color: "var(--violet)" },
              { label: "Takım Ort.", color: "var(--neutral)", dashed: true },
            ]}
          />
        }
      >
        Kalite Puanı Trendi (30 Gün)
      </SectionTitle>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={QUALITY_TREND}
            margin={{ top: 6, right: 8, bottom: 0, left: -26 }}
          >
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={AXIS_TICK} interval={4} />
            <YAxis domain={[60, 100]} axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <Tooltip content={ChartTooltip} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="team"
              stroke="var(--neutral)"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={false}
              animationDuration={DURATION.chart * 1000}
            />
            <Line
              type="monotone"
              dataKey="agent"
              stroke="var(--violet)"
              strokeWidth={2.5}
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
