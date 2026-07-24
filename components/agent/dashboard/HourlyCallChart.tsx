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
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { useDateRange } from "@/components/agent/filters/DateRangeContext";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { DURATION } from "@/lib/motion";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AXIS_TICK, InlineLegend, TooltipFrame } from "@/components/ui/ChartBits";

/**
 * Saatlik arama grafiği — seçili döneme göre (context), toplam vs cevaplanan,
 * gruplu sütun. İndigo (arama verisi) + jade (cevaplanan) — CVD ayrımı
 * doğrulandı (ΔE 75+). "Bugün" dışındaki aralıklarda saat-of-day toplamı.
 */

const RANGE_LABEL: Record<string, { tr: string; en: string }> = {
  today: { tr: "Bugün", en: "Today" },
  "7d": { tr: "Son 7 Gün", en: "Last 7 Days" },
  "30d": { tr: "Son 30 Gün", en: "Last 30 Days" },
  "90d": { tr: "Son 90 Gün", en: "Last 90 Days" },
  custom: { tr: "Seçili Aralık", en: "Selected Range" },
};

function ChartTooltip({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType>) {
  const { t } = useLang();
  if (!active || !payload?.length) return null;
  return (
    <TooltipFrame
      title={`${label}:00`}
      rows={payload.map((entry) => ({
        label: entry.dataKey === "total" ? t("Toplam", "Total") : t("Cevaplanan", "Answered"),
        value: String(entry.value ?? 0),
        color: entry.dataKey === "total" ? "var(--indigo)" : "var(--brand)",
      }))}
    />
  );
}

export function HourlyCallChart() {
  const { data, rangeKey } = useDateRange();
  const { t } = useLang();
  const hourlyCalls = data.hourlyCalls;
  const isEmpty = hourlyCalls.every((h) => h.total === 0);
  const range = RANGE_LABEL[rangeKey] ?? RANGE_LABEL.custom;
  const rangeLabel = t(range.tr, range.en);

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={t(
          `${rangeLabel} içinde hangi saatte kaç arama yapıldı, kaçı açıldı — mesai saatleri 09-18.`,
          `How many calls were made and answered per hour within ${rangeLabel} — working hours 09-18.`,
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
        {t("Saatlik Arama Yoğunluğu", "Hourly Call Volume")} ({rangeLabel})
      </SectionTitle>

      {isEmpty ? (
        <p className="flex flex-1 items-center justify-center font-body text-sm text-fg-muted">
          <T tr="Bu aralıkta henüz arama verisi yok." en="No call data for this range yet." />
        </p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={hourlyCalls}
              margin={{ top: 4, right: 4, bottom: 0, left: -26 }}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={AXIS_TICK} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={AXIS_TICK} />
              <Tooltip content={ChartTooltip} cursor={{ fill: "var(--elevated)" }} />
              <Bar
                dataKey="total"
                fill="var(--indigo)"
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
                isAnimationActive={false}
                animationDuration={DURATION.chart * 1000}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="answered"
                fill="var(--brand)"
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
                isAnimationActive={false}
                animationDuration={DURATION.chart * 1000}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
