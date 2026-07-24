"use client";

import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/** Takım bazlı backlog — hangi takımda ne birikmiş (en yüklü en üstte). */
export function TeamBacklogTable() {
  const { data } = useRegionDateRange();

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle hint="Her takımın birikmiş işi. Kırmızı rakamlar takım liderinin acil müdahalesini gerektirir.">
        Takım Bazlı Backlog
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2.5 py-2 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Takım</th>
              <th className="px-2.5 py-2 text-right font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Henüz Aranmayan</th>
              <th className="px-2.5 py-2 text-right font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">SLA İhlali</th>
              <th className="px-2.5 py-2 text-right font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Bekleyen Offer</th>
              <th className="px-2.5 py-2 text-right font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Gecikmiş Takip</th>
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
