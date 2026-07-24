"use client";

import { TEAM_SHIFT_ROWS } from "@/lib/mock/team-monthly";
import { formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * Agent bazlı vardiya özeti — son 7 gün. "Eksik Çalışma" sütunu, planlanan
 * 8 saatlik net çalışma (09:00-18:00, 1 saat öğle molası varsayımı) ile
 * gerçek çalışma arasındaki farkın haftalık toplamıdır — en yüklü en üstte.
 */
export function TeamShiftTable() {
  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle hint="Eksik Çalışma = planlanan 8 sa/gün net çalışma ile gerçekleşen arasındaki haftalık toplam fark. En çok eksiği olan en üstte.">
        Agent Bazlı Vardiya Özeti (7 Gün)
      </SectionTitle>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {["Agent", "Rol", "Geç Kalma (dk)", "Eksik Çalışma (sa)", "Uyum Oranı", "Ort. Mola (dk)"].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-2.5 py-2 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TEAM_SHIFT_ROWS.map((row) => (
              <tr key={row.agentId} className="border-b border-border transition-colors last:border-0 hover:bg-elevated">
                <td className="px-2.5 py-2.5 font-body text-[12.5px] font-medium text-fg">{row.name}</td>
                <td className="px-2.5 py-2.5 font-mono text-[10.5px] text-fg-muted">{row.role}</td>
                <td className={cn("px-2.5 py-2.5 font-mono text-[11.5px]", row.lateMinutesTotal > 30 ? "font-semibold text-critical" : "text-fg-secondary")}>
                  {row.lateMinutesTotal > 0 ? `${row.lateMinutesTotal} dk` : "—"}
                </td>
                <td className={cn("px-2.5 py-2.5 font-mono text-[11.5px]", row.deficitHours >= 3 ? "font-semibold text-risk" : "text-fg")}>
                  {formatNumber(row.deficitHours, 1)} sa
                </td>
                <td className="px-2.5 py-2.5 font-mono text-[11.5px] text-fg">
                  %{Math.round(row.compliancePct)}
                </td>
                <td className="px-2.5 py-2.5 font-mono text-[11.5px] text-fg-secondary">
                  {row.avgBreakMinutes} dk
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
