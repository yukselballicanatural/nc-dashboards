"use client";

import { useDateRange } from "@/components/agent/filters/DateRangeContext";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { RadialGauge } from "@/components/ui/RadialGauge";

/**
 * SLA Uyumlu Rate + Cevaplanma Oranı — seçili döneme göre (context).
 * İki radial gauge yan yana; renk hedefe yakınlığa göre (RadialGauge içinde).
 */
export function SlaConnectionGauges() {
  const { data } = useDateRange();
  const { t } = useLang();
  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={t(
          "Yeşil hedefin üstünde, sarı/turuncu/kırmızı hedefe uzaklığı gösterir.",
          "Green is above target; yellow/orange/red show distance from target.",
        )}
      >
        <T tr="Oran Göstergeleri" en="Rate Indicators" />
      </SectionTitle>
      <div className="flex flex-1 flex-wrap items-center justify-around gap-4">
        {data.gauges.map((gauge) => (
          <RadialGauge
            key={gauge.key}
            label={gauge.label}
            valuePct={gauge.valuePct}
            targetPct={gauge.targetPct}
            size={190}
          />
        ))}
      </div>
    </Card>
  );
}
