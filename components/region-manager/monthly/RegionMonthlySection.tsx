"use client";

import { useMemo } from "react";
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
import { computeRegionMonthly } from "@/lib/mock/region-monthly";
import { useActiveRegionRecords } from "@/lib/data/data-source";
import { useLang } from "@/components/i18n/LanguageProvider";
import { DURATION } from "@/lib/motion";
import { formatCurrencyEUR } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { KpiGrid } from "@/components/agent/dashboard/KpiGrid";
import { AXIS_TICK, InlineLegend, TooltipFrame } from "@/components/ui/ChartBits";
import { T } from "@/components/i18n/T";

function ChartTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  const { t } = useLang();
  if (!active || !payload?.length) return null;
  return (
    <TooltipFrame
      title={`${label} ${t("Temmuz", "July")}`}
      rows={payload
        .filter((entry) => entry.value != null)
        .map((entry) => ({
          label: entry.dataKey === "actualEUR" ? t("Gerçekleşen", "Actual") : t("Hedef tempo", "Target pace"),
          value: formatCurrencyEUR(Number(entry.value)),
          color: entry.dataKey === "actualEUR" ? "var(--brand)" : "var(--neutral)",
        }))}
    />
  );
}

/** Bölge "Bu Ay" bölümü — aktif veri setinden (yüklü Excel ya da seed). */
export function RegionMonthlySection() {
  const records = useActiveRegionRecords();
  const { t, lang } = useLang();
  const { kpis, pace } = useMemo(() => computeRegionMonthly(records, lang), [records, lang]);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <KpiGrid kpis={kpis} className="lg:grid-cols-5" />
      <Card className="flex h-full flex-col gap-4">
        <SectionTitle
          hint={t(
            "Yeşil barlar bölgenin ay içindeki birikimli cirosu; kesikli çizgi hedefe eşit tempoda gidilseydi bugün olunması gereken yer.",
            "Green bars show the region's cumulative revenue during the month; the dashed line is where it should be today if progressing at an even pace toward target.",
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
          <T tr="Bölge Aylık Satış / Hedef İlerleyişi" en="Region Monthly Sales / Target Progress" />
        </SectionTitle>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={pace} margin={{ top: 6, right: 8, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={AXIS_TICK} interval={2} />
              <YAxis tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} axisLine={false} tickLine={false} tick={AXIS_TICK} width={44} />
              <Tooltip content={ChartTooltip} cursor={{ fill: "var(--elevated)" }} />
              <Bar dataKey="actualEUR" fill="var(--brand)" radius={[3, 3, 0, 0]} maxBarSize={16} isAnimationActive={false} animationDuration={DURATION.chart * 1000} />
              <Line type="linear" dataKey="targetEUR" stroke="var(--neutral)" strokeWidth={1.5} strokeDasharray="6 4" dot={false} isAnimationActive={false} animationDuration={DURATION.chart * 1000} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
