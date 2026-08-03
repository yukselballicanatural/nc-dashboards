"use client";

import { Info, Medal } from "lucide-react";
import { TL_RANK_BONUSES, type RankBonusPeriod } from "@/lib/mock/commission";
import { formatCurrencyEUR } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * SIRALAMA BONUSLARI — Excel "SIRALAMA BONUSLARI" bloğu.
 *
 * Bu bonuslar kaynak tabloda "hesaplama sayfasında MANUEL girilebilir" olarak
 * işaretlidir; yani sıralamalar sistem tarafından otomatik atanmaz. Bu yüzden
 * burada yalnızca ÖDÜL TABLOSU gösterilir — kimin hangi sırada olduğu değil.
 * Sıralamalar netleştiğinde bu tablo gerçek sonuçlarla eşleştirilecek.
 */

const PODIUM_COLORS = ["text-brand-secondary", "text-fg-secondary", "text-risk"] as const;

function BonusGroup({ period }: { period: RankBonusPeriod }) {
  const { t, lang } = useLang();
  const rows = TL_RANK_BONUSES.filter((b) => b.period === period);

  return (
    <div className="flex flex-col gap-2">
      <span className="font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted">
        {period === "monthly" ? t("Aylık", "Monthly") : t("Çeyreklik", "Quarterly")}
      </span>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th
                scope="col"
                className="px-2.5 py-2 text-left font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted"
              >
                {t("Bonus", "Bonus")}
              </th>
              {["1.", "2.", "3."].map((place, i) => (
                <th
                  key={place}
                  scope="col"
                  className={cn(
                    "px-2.5 py-2 text-right font-body text-[10.5px] font-semibold uppercase tracking-wide",
                    PODIUM_COLORS[i],
                  )}
                >
                  {place}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((bonus) => (
              <tr
                key={bonus.key}
                className="border-b border-border transition-colors last:border-0 hover:bg-elevated"
              >
                <td className="px-2.5 py-2.5 text-left">
                  <span className="flex flex-col">
                    <span className="font-body text-[12px] text-fg">
                      {lang === "en" ? bonus.labelEN : bonus.labelTR}
                    </span>
                    <span className="font-body text-[10.5px] text-fg-muted">
                      {lang === "en" ? bonus.basisEN : bonus.basisTR}
                    </span>
                  </span>
                </td>
                {bonus.prizes.map((prize, i) => (
                  <td
                    key={i}
                    className={cn(
                      "px-2.5 py-2.5 text-right font-mono text-[11.5px]",
                      i === 0 ? "font-semibold text-fg" : "text-fg-secondary",
                    )}
                  >
                    {formatCurrencyEUR(prize)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RankBonusTable() {
  const { t } = useLang();

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle
        hint={t(
          "Satış, iskonto, deal-gerçekleşme ve teklif sıralamalarında ilk üçe girmenin ödülleri.",
          "Rewards for finishing in the top three in the sales, discount, deal-to-realization and offer rankings.",
        )}
        aside={<Medal size={16} aria-hidden className="shrink-0 text-brand-secondary" />}
      >
        <T tr="Sıralama Bonusları" en="Ranking Bonuses" />
      </SectionTitle>

      <BonusGroup period="monthly" />
      <BonusGroup period="quarterly" />

      <div className="flex items-start gap-2.5 rounded-card border border-border bg-elevated px-4 py-3">
        <Info size={15} aria-hidden className="mt-0.5 shrink-0 text-indigo" />
        <p className="font-body text-[12px] leading-relaxed text-fg-secondary">
          <T
            tr="Bu bonuslar sıralama sonuçlarına bağlı olduğu için sistem tarafından otomatik hesaplanmaz — kaynak prim tablosunda manuel giriş olarak tanımlıdır. Burada yalnızca ödül tutarları gösterilir."
            en="Because these bonuses depend on ranking results, they are not calculated automatically — the source commission table defines them as manual entries. Only the reward amounts are shown here."
          />
        </p>
      </div>
    </Card>
  );
}
