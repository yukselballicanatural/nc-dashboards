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
import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { DURATION } from "@/lib/motion";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AXIS_TICK, InlineLegend, TooltipFrame } from "@/components/ui/ChartBits";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";

/**
 * Takım metrik karşılaştırması — SLA / Ulaşım / Dönüşüm oranları takım takım.
 * Bölge Müdürü hangi takımın hangi boyutta zayıf olduğunu tek grafikte görür.
 */

function ChartTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  const { t } = useLang();
  const LABELS: Record<string, string> = {
    slaCompliantPct: t("SLA Uyumu", "SLA compliance"),
    answerRatePct: t("Ulaşım Oranı", "Answer Rate"),
    leadToDealPct: t("Dönüşüm", "Conversion"),
  };
  if (!active || !payload?.length) return null;
  return (
    <TooltipFrame
      title={String(label)}
      rows={payload.map((entry) => ({
        label: LABELS[String(entry.dataKey)] ?? String(entry.dataKey),
        value: `%${Math.round(Number(entry.value ?? 0))}`,
        color: String(entry.color),
      }))}
    />
  );
}

export function TeamMetricChart() {
  const { data } = useRegionDateRange();
  const { t } = useLang();
  const chartData = data.teams.map((t) => ({
    name: t.teamName.replace(" Team", ""),
    slaCompliantPct: Math.round(t.slaCompliantPct * 10) / 10,
    answerRatePct: Math.round(t.answerRatePct * 10) / 10,
    leadToDealPct: Math.round(t.leadToDealPct * 10) / 10,
  }));

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle
        hint={t(
          "Her takımın üç kilit oranı yan yana — bir takım hangi boyutta geride, tek bakışta gör.",
          "Each team's three key rates side by side — see at a glance which dimension a team is behind on.",
        )}
        aside={
          <InlineLegend
            items={[
              { label: "SLA", color: "var(--brand)" },
              { label: t("Ulaşım", "Answer"), color: "var(--indigo)" },
              { label: t("Dönüşüm", "Conversion"), color: "var(--violet)" },
            ]}
          />
        }
      >
        <T tr="Takım Metrik Karşılaştırması" en="Team Metric Comparison" />
      </SectionTitle>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 6, right: 4, bottom: 0, left: -20 }} barGap={2} barCategoryGap="22%">
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <YAxis unit="%" axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <Tooltip content={ChartTooltip} cursor={{ fill: "var(--elevated)" }} />
            <Bar dataKey="slaCompliantPct" fill="var(--brand)" radius={[3, 3, 0, 0]} maxBarSize={22} isAnimationActive={false} animationDuration={DURATION.chart * 1000} />
            <Bar dataKey="answerRatePct" fill="var(--indigo)" radius={[3, 3, 0, 0]} maxBarSize={22} isAnimationActive={false} animationDuration={DURATION.chart * 1000} />
            <Bar dataKey="leadToDealPct" fill="var(--violet)" radius={[3, 3, 0, 0]} maxBarSize={22} isAnimationActive={false} animationDuration={DURATION.chart * 1000} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
