"use client";

import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { formatCurrencyEUR } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { RadialGauge } from "@/components/ui/RadialGauge";

/**
 * Takım hedef gerçekleşme — 12 agent'ın aylık hedeflerinin toplamına göre
 * (agent panelindeki GoalGauge'un takım seviyesindeki karşılığı).
 */
export function TeamTargetGauge() {
  const { data } = useTeamDateRange();
  const { t } = useLang();

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle hint={t("Takımın toplam ödemesi, tüm agent'ların aylık hedefleri toplamına göre nerede.", "Where the team's total payment stands against the sum of all agents' monthly targets.")}>
        <T tr="Takım Hedef Gerçekleşme" en="Team Target Achievement" />
      </SectionTitle>
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <RadialGauge
          label=""
          valuePct={data.targetPct}
          targetPct={100}
          size={210}
          stroke="var(--brand)"
          showTarget={false}
        />
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-[14px] font-semibold text-fg">
            {formatCurrencyEUR(data.actualEUR)}
            <span className="text-fg-muted"> / {formatCurrencyEUR(data.targetEUR)}</span>
          </span>
          <span className="font-body text-[11.5px] text-fg-secondary">
            <T tr="Seçili dönemde takımın topladığı toplam ödeme" en="Total payment the team collected in the selected period" />
          </span>
        </div>
      </div>
    </Card>
  );
}
