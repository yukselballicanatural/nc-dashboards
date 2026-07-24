"use client";

import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import type { StatusLevel } from "@/lib/types/agent-data";
import { formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * "Arama hedefi gerçekleşme" — Zoho: Calls Dashboard (Total Active Call Target
 * vs Total Active Call + Call Duration Target vs Total). Sade hali: her agent
 * için arama adedi ve konuşma süresi hedefine göre gerçekleşme yüzdesi, renkli.
 */

const PILL: Record<StatusLevel, string> = {
  success: "bg-success/12 text-success",
  warning: "bg-warning/16 text-warning",
  risk: "bg-risk/14 text-risk",
  critical: "bg-critical/12 text-critical",
  neutral: "bg-neutral/16 text-fg-secondary",
};

function toneOf(pct: number): StatusLevel {
  if (pct >= 95) return "success";
  if (pct >= 80) return "warning";
  if (pct >= 60) return "risk";
  return "critical";
}

export function CallRealizationTable() {
  const { data } = useTeamDateRange();
  const rows = data.callRealization;

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle hint="Her agent'ın arama adedi ve toplam konuşma süresi, kendi dönem hedefine göre gerçekleşme oranı. %100 hedefe ulaşıldı demektir. En düşük gerçekleşen en üstte.">
        Arama Hedefi Gerçekleşme
      </SectionTitle>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {["Agent", "Arama", "Hedef", "Gerçekleşme", "Konuşma (dk)", "Süre Gerç."].map((h, i) => (
                <th key={h} className={cn("px-2.5 py-2 font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted", i === 0 ? "text-left" : "text-right")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.agentId} className="border-b border-border transition-colors last:border-0 hover:bg-elevated">
                <td className="px-2.5 py-2.5 font-body text-[12.5px] font-medium text-fg">{r.name}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[12px] text-fg-secondary">{formatNumber(r.calls)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[12px] text-fg-muted">{formatNumber(r.callTarget)}</td>
                <td className="px-2.5 py-2.5 text-right">
                  <span className={cn("inline-block rounded-pill px-2 py-0.5 font-mono text-[11px] font-semibold", PILL[r.tone])}>
                    %{r.callPct}
                  </span>
                </td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[12px] text-fg-secondary">
                  {formatNumber(r.talkMin)} / {formatNumber(r.durationTargetMin)}
                </td>
                <td className="px-2.5 py-2.5 text-right">
                  <span className={cn("inline-block rounded-pill px-2 py-0.5 font-mono text-[11px] font-semibold", PILL[toneOf(r.durationPct)])}>
                    %{r.durationPct}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
