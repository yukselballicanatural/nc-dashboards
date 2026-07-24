"use client";

import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * Backlog — hangi agent'ta ne birikmiş (CLAUDE.md Bölüm 9, sekme 4/5).
 * Yalnızca en az bir birikimi olan agent'lar listelenir, en yüklü en üstte
 * (compute katmanında zaten bu sırayla geliyor).
 */
export function BacklogTable() {
  const { data } = useTeamDateRange();
  const rows = data.backlog;

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle hint="Her sütun bir birikim türü. Kırmızı rakamlar acil müdahale gerektirir.">
        Agent Bazlı Backlog
      </SectionTitle>

      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2.5 py-2 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Agent</th>
                <th className="px-2.5 py-2 text-right font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Henüz Aranmayan</th>
                <th className="px-2.5 py-2 text-right font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">SLA İhlali</th>
                <th className="px-2.5 py-2 text-right font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Bekleyen Offer</th>
                <th className="px-2.5 py-2 text-right font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Gecikmiş Takip</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.agentId} className="border-b border-border transition-colors last:border-0 hover:bg-elevated">
                  <td className="px-2.5 py-2.5 font-body text-[12.5px] font-medium text-fg">{row.name}</td>
                  <td className={cn("px-2.5 py-2.5 text-right font-mono text-[11.5px]", row.neverCalled >= 5 ? "font-semibold text-critical" : "text-fg-secondary")}>
                    {formatNumber(row.neverCalled)}
                  </td>
                  <td className={cn("px-2.5 py-2.5 text-right font-mono text-[11.5px]", row.slaViolations >= 5 ? "font-semibold text-risk" : "text-fg-secondary")}>
                    {formatNumber(row.slaViolations)}
                  </td>
                  <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">
                    {formatNumber(row.pendingOffers)}
                  </td>
                  <td className={cn("px-2.5 py-2.5 text-right font-mono text-[11.5px]", row.overdueFollowUps > 0 ? "font-semibold text-warning" : "text-fg-secondary")}>
                    {formatNumber(row.overdueFollowUps)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center font-body text-sm text-fg-muted">
          Harika — seçili dönemde takımda birikmiş iş yok.
        </p>
      )}
    </Card>
  );
}
