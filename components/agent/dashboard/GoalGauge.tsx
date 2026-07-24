"use client";

import { GOAL } from "@/lib/mock/mock-data";
import { formatCurrencyEUR } from "@/lib/utils/format";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { RadialGauge } from "@/components/ui/RadialGauge";

/**
 * Aylık hedef gerçekleşme — v2 4.7, sayfanın "imza anı".
 * Büyük radial gauge (marka renginde) + altında gerçekleşen/hedef ve
 * tahmini ay sonu satırları (mono, € formatı). Değerler seed'li motordan.
 */
export function GoalGauge() {
  const { actualEUR, targetEUR, forecastEUR, pct } = GOAL;
  const { t } = useLang();

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={t(
          "Ay hedefinin ne kadarını tamamladın — tahmin, mevcut temponla ay sonu projeksiyonu.",
          "How much of your monthly target you've completed — forecast is the end-of-month projection at your current pace.",
        )}
      >
        <T tr="Aylık Hedef Gerçekleşme" en="Monthly Target Progress" />
      </SectionTitle>
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <RadialGauge
          label=""
          valuePct={pct}
          targetPct={100}
          size={230}
          stroke="var(--brand)"
          showTarget={false}
        />
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-[14px] font-semibold text-fg">
            {formatCurrencyEUR(actualEUR)}
            <span className="text-fg-muted"> / {formatCurrencyEUR(targetEUR)}</span>
          </span>
          <span className="font-body text-[11.5px] text-fg-secondary">
            <T tr="Tahmini ay sonu:" en="Estimated month-end:" />{" "}
            <span className="font-mono font-medium text-brand-secondary">
              {formatCurrencyEUR(forecastEUR)}
            </span>
          </span>
        </div>
      </div>
    </Card>
  );
}
