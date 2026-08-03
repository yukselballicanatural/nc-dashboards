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
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
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

function makeChartTooltip(monthLabel: string, actualLabel: string, targetLabel: string) {
  return function ChartTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
    if (!active || !payload?.length) return null;
    return (
      <TooltipFrame
        title={`${label} ${monthLabel}`}
        rows={payload
          .filter((entry) => entry.value != null)
          .map((entry) => ({
            label: entry.dataKey === "actualEUR" ? actualLabel : targetLabel,
            value: formatCurrencyEUR(Number(entry.value)),
            color: entry.dataKey === "actualEUR" ? "var(--brand)" : "var(--neutral)",
          }))}
      />
    );
  };
}

export function TeamMonthlyPaceChart() {
  const { t } = useLang();
  const actualLabel = t("Gerçekleşen", "Actual");
  const targetLabel = t("Hedef tempo", "Target pace");
  const monthLabel = t("Temmuz", "July");
  const ChartTooltip = makeChartTooltip(monthLabel, actualLabel, targetLabel);

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={t("Yeşil barlar takımın ay içindeki birikimli cirosunu; kesikli çizgi takım hedefine eşit tempoda gidilseydi bugün olunması gereken yeri gösterir.", "The bars show the team's cumulative revenue this month; the dashed line shows where it should be today at an even pace toward the team target.")}
        aside={
          <InlineLegend
            items={[
              { label: actualLabel, color: "var(--brand)" },
              { label: targetLabel, color: "var(--neutral)", dashed: true },
            ]}
          />
        }
      >
        <T tr="Takım Aylık Satış / Hedef İlerleyişi" en="Team Monthly Sales / Target Pace" />
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
