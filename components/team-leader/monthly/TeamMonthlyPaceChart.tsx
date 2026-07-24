"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { TEAM_MONTHLY_PACE } from "@/lib/mock/team-monthly";
import { DURATION } from "@/lib/motion";
import { formatCurrencyEUR } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AXIS_TICK, InlineLegend, TooltipFrame } from "@/components/ui/ChartBits";

/**
 * Takım aylık satış/hedef ilerleyişi — agent panelindeki TargetPaceChart'ın
 * takım toplamı versiyonu (12 agent'ın birikimli cirosu vs doğrusal takım
 * hedef temposu). Tarih filtresinden bağımsız — her zaman "bu ay".
 */

function ChartTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <TooltipFrame
      title={`${label} Temmuz`}
      rows={payload
        .filter((entry) => entry.value != null)
        .map((entry) => ({
          label: entry.dataKey === "actualEUR" ? "Gerçekleşen" : "Hedef tempo",
          value: formatCurrencyEUR(Number(entry.value)),
          color: entry.dataKey === "actualEUR" ? "var(--brand)" : "var(--neutral)",
        }))}
    />
  );
}

export function TeamMonthlyPaceChart() {

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint="Yeşil barlar takımın ay içindeki birikimli cirosunu; kesikli çizgi takım hedefine eşit tempoda gidilseydi bugün olunması gereken yeri gösterir."
        aside={
          <InlineLegend
            items={[
              { label: "Gerçekleşen", color: "var(--brand)" },
              { label: "Hedef tempo", color: "var(--neutral)", dashed: true },
            ]}
          />
        }
      >
        Takım Aylık Satış / Hedef İlerleyişi
      </SectionTitle>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={TEAM_MONTHLY_PACE} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={AXIS_TICK} interval={2} />
            <YAxis
              tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
            />
            <Tooltip content={ChartTooltip} cursor={{ fill: "var(--elevated)" }} />
            <Bar
              dataKey="actualEUR"
              fill="var(--brand)"
              radius={[3, 3, 0, 0]}
              maxBarSize={14}
              isAnimationActive={false}
              animationDuration={DURATION.chart * 1000}
            />
            <Line
              type="linear"
              dataKey="targetEUR"
              stroke="var(--neutral)"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={false}
              animationDuration={DURATION.chart * 1000}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
