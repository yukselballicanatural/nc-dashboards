"use client";

import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { useLang } from "@/components/i18n/LanguageProvider";
import { formatCurrencyEUR } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { RadialGauge } from "@/components/ui/RadialGauge";
import { T } from "@/components/i18n/T";

/** Bölge hedef gerçekleşme — tüm takımların aylık hedef toplamına göre. */
export function RegionTargetGauge() {
  const { data } = useRegionDateRange();
  const { t } = useLang();

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={t(
          "Bölgenin toplam ödemesi, tüm danışmanların aylık hedefleri toplamına göre nerede.",
          "The region's total payments relative to the sum of all agents' monthly targets.",
        )}
      >
        <T tr="Bölge Hedef Gerçekleşme" en="Region Target Achievement" />
      </SectionTitle>
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <RadialGauge label="" valuePct={data.targetPct} targetPct={100} size={210} stroke="var(--brand)" showTarget={false} />
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-[14px] font-semibold text-fg">
            {formatCurrencyEUR(data.actualEUR)}
            <span className="text-fg-muted"> / {formatCurrencyEUR(data.targetEUR)}</span>
          </span>
          <span className="font-body text-[11.5px] text-fg-secondary">
            <T tr="Seçili dönemde bölgenin topladığı toplam ödeme" en="Total payments collected by the region in the selected period" />
          </span>
        </div>
      </div>
    </Card>
  );
}
