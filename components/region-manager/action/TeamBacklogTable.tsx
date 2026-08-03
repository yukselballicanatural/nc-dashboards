"use client";

import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/** Takım bazlı backlog — hangi takımda ne birikmiş (en yüklü en üstte). */
export function TeamBacklogTable() {
  const { data } = useRegionDateRange();
  const { t } = useLang();

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle hint={t("Her takımın birikmiş işi. Kırmızı rakamlar takım liderinin acil müdahalesini gerektirir.", "Each team's backlog. Red numbers require urgent attention from the team leader.")}>
        <T tr="Takım Bazlı Backlog" en="Backlog by Team" />
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2.5 py-2 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{t("Takım", "Team")}</th>
              <th className="px-2.5 py-2 text-right font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{t("Henüz Aranmayan", "Not Yet Called")}</th>
              <th className="px-2.5 py-2 text-right font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{t("SLA İhlali", "SLA Breach")}</th>
              <th className="px-2.5 py-2 text-right font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{t("Bekleyen Offer", "Pending Offers")}</th>
              <th className="px-2.5 py-2 text-right font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{t("Gecikmiş Takip", "Overdue Follow-ups")}</th>
            </tr>
          </thead>
          <tbody>
            {data.backlogByTeam.map((row) => (
              <tr key={row.teamId} className="border-b border-border transition-colors last:border-0 hover:bg-elevated">
                <td className="px-2.5 py-2.5 font-body text-[12.5px] font-medium text-fg">{row.teamName}</td>
                <td className={cn("px-2.5 py-2.5 text-right font-mono text-[11.5px]", row.neverCalled >= 15 ? "font-semibold text-critical" : "text-fg-secondary")}>{formatNumber(row.neverCalled)}</td>
                <td className={cn("px-2.5 py-2.5 text-right font-mono text-[11.5px]", row.slaViolations >= 15 ? "font-semibold text-risk" : "text-fg-secondary")}>{formatNumber(row.slaViolations)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">{formatNumber(row.pendingOffers)}</td>
                <td className={cn("px-2.5 py-2.5 text-right font-mono text-[11.5px]", row.overdueFollowUps >= 10 ? "font-semibold text-warning" : "text-fg-secondary")}>{formatNumber(row.overdueFollowUps)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
