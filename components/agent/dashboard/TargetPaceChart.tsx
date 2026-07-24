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
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { TARGET_PACE } from "@/lib/mock/mock-data";
import { DURATION } from "@/lib/motion";
import { formatCurrencyEUR } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AXIS_TICK, InlineLegend, TooltipFrame } from "@/components/ui/ChartBits";

/**
 * Aylık satış/hedef ilerleyişi — v2 4.7: composed chart.
 * Bar: ay başından o güne birikimli gerçekleşen satış (jade).
 * Çizgi: doğrusal hedef temposu (kesikli nötr) — "bugün nerede olmalıydım".
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
      title={`${label} ${t("Temmuz", "July")}`}
      rows={payload
        .filter((entry) => entry.value != null)
        .map((entry) => ({
          label:
            entry.dataKey === "actualEUR"
              ? t("Gerçekleşen", "Actual")
              : t("Hedef tempo", "Target pace"),
          value: formatCurrencyEUR(Number(entry.value)),
          color: entry.dataKey === "actualEUR" ? "var(--brand)" : "var(--neutral)",
        }))}
    />
  );
}

export function TargetPaceChart() {
  const { t } = useLang();

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={t(
          "Yeşil barlar ay içindeki birikimli satışın; kesikli çizgi hedefe eşit tempoda gitseydin bugün olman gereken yer.",
          "Green bars are your cumulative sales for the month; the dashed line is where you should be today at an even pace toward target.",
        )}
        aside={
          <InlineLegend
            items={[
              { label: t("Gerçekleşen", "Actual"), color: "var(--brand)" },
              { label: t("Hedef tempo", "Target pace"), color: "var(--neutral)", dashed: true },
            ]}
          />
        }
      >
        {t("Aylık Satış / Hedef İlerleyişi", "Monthly Sales / Target Progress")}
      </SectionTitle>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={TARGET_PACE}
            margin={{ top: 6, right: 8, bottom: 0, left: -8 }}
          >
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
