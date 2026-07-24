"use client";

import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { formatCurrencyEUR, formatNumber, formatPercent } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * Senior vs Junior kırılımı — kıdem gruplarının ortalama performansı.
 * TL "junior'lar nerede geride, hangi konuda eğitim gerekli" sorusuna
 * bakar; ekip planlaması/eğitim önceliği için.
 */
export function RoleBreakdown() {
  const { data } = useTeamDateRange();
  const { t } = useLang();

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle hint={t("Senior ve Junior gruplarının ortalama performansı — eğitim ve ekip planlaması önceliği için.", "Average performance of Senior and Junior groups — for training and team planning priorities.")}>
        <T tr="Kıdem Kırılımı (Senior / Junior)" en="Tenure Breakdown (Senior / Junior)" />
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {[
                { h: "Grup", hEn: "Group" },
                { h: "Agent", hEn: "Agent" },
                { h: "Ort. Skor", hEn: "Avg. Score" },
                { h: "Ort. SLA", hEn: "Avg. SLA" },
                { h: "Ort. Ulaşım", hEn: "Avg. Reach" },
                { h: "Toplam Deal", hEn: "Total Deals" },
                { h: "Toplam Ciro", hEn: "Total Revenue" },
              ].map((c) => (
                <th
                  key={c.h}
                  className="whitespace-nowrap px-2.5 py-2 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted first:text-left [&:not(:first-child)]:text-right"
                >
                  {t(c.h, c.hEn)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.roleBreakdown.map((row) => (
              <tr key={row.role} className="border-b border-border last:border-0 hover:bg-elevated">
                <td className="px-2.5 py-2.5 font-body text-[12.5px] font-medium text-fg">{row.role}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">{row.agentCount}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[12px] font-semibold text-brand">{row.avgScore.toFixed(1)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">{formatPercent(row.avgSlaPct, 0)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">{formatPercent(row.avgAnswerRatePct, 0)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">{formatNumber(row.totalDeals)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">{formatCurrencyEUR(row.totalPaymentsEUR)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
