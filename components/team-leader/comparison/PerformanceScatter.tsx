"use client";

import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  type TooltipContentProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { DURATION } from "@/lib/motion";
import { formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AXIS_TICK } from "@/components/ui/ChartBits";

/**
 * SLA × Dönüşüm dağılımı — her nokta bir agent. X: SLA uyumu, Y: lead→deal
 * dönüşümü. Referans çizgileri (SLA %85, dönüşüm %18) dört bölge oluşturur:
 * sağ-üst = yıldızlar, sol-alt = öncelikli koçluk. TL kümeleri tek bakışta
 * görür — "hızlı ama satamıyor" vs "yavaş ama satıyor" ayrımı buradan çıkar.
 */

const SLA_BENCHMARK = 85;
const CONV_BENCHMARK = 18;

function ChartTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  const { t } = useLang();
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload as {
    name: string;
    slaCompliantPct: number;
    leadToDealPct: number;
    calls: number;
    score: number;
  };
  if (!p) return null;
  return (
    <div className="rounded-control border border-border bg-elevated px-3 py-2 shadow-card">
      <p className="mb-1 font-display text-[12px] font-semibold text-fg">{p.name}</p>
      <p className="font-mono text-[11px] text-fg-secondary">SLA: %{Math.round(p.slaCompliantPct)}</p>
      <p className="font-mono text-[11px] text-fg-secondary">{t("Dönüşüm", "Conversion")}: %{Math.round(p.leadToDealPct)}</p>
      <p className="font-mono text-[11px] text-fg-muted">
        {formatNumber(p.calls)} {t("arama · Skor", "calls · Score")} {p.score.toFixed(1)}
      </p>
    </div>
  );
}

export function PerformanceScatter() {
  const { data } = useTeamDateRange();
  const { t } = useLang();

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle hint={t("Her nokta bir agent. Sağ-üst bölge (hızlı + dönüştüren) yıldızlar; sol-alt bölge öncelikli koçluk. Kesikli çizgiler hedef eşikleri.", "Each point is an agent. The top-right region (fast + converting) are the stars; the bottom-left region is the coaching priority. Dashed lines are the target thresholds.")}>
        <T tr="SLA × Dönüşüm Dağılımı" en="SLA × Conversion Distribution" />
      </SectionTitle>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 16, bottom: 4, left: -18 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" />
            <XAxis
              type="number"
              dataKey="slaCompliantPct"
              name="SLA"
              unit="%"
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
            />
            <YAxis
              type="number"
              dataKey="leadToDealPct"
              name="Dönüşüm"
              unit="%"
              domain={[0, "dataMax + 5"]}
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
            />
            <ZAxis type="number" dataKey="calls" range={[60, 400]} name="Arama" />
            <ReferenceLine x={SLA_BENCHMARK} stroke="var(--brand)" strokeDasharray="5 4" strokeOpacity={0.6} />
            <ReferenceLine y={CONV_BENCHMARK} stroke="var(--violet)" strokeDasharray="5 4" strokeOpacity={0.6} />
            <Tooltip content={ChartTooltip} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter
              data={data.scatter}
              fill="var(--indigo)"
              fillOpacity={0.7}
              isAnimationActive={false}
              animationDuration={DURATION.chart * 1000}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3">
        <span className="flex items-center gap-1.5 font-body text-[11px] text-fg-secondary">
          <span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: "var(--brand)" }} />
          {t("SLA hedefi", "SLA target")} %{SLA_BENCHMARK}
        </span>
        <span className="flex items-center gap-1.5 font-body text-[11px] text-fg-secondary">
          <span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: "var(--violet)" }} />
          {t("Dönüşüm hedefi", "Conversion target")} %{CONV_BENCHMARK}
        </span>
        <span className="font-body text-[11px] text-fg-muted"><T tr="Nokta büyüklüğü = arama hacmi" en="Point size = call volume" /></span>
      </div>
    </Card>
  );
}
