"use client";

import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * "Günlük yeni lead dağılımı" — Zoho: Today Lead (agent × gün pivotu). Sade
 * hali: son 10 günde hangi agent'a kaç yeni lead düşmüş — mini ısı haritası.
 * Yük dengesizliğini (birine çok, birine az lead) tek bakışta gösterir.
 */
export function DailyLeadMatrix() {
  const { data } = useTeamDateRange();
  const rows = data.dailyLeadMatrix;
  const max = Math.max(1, ...rows.flatMap((r) => r.cells.map((c) => c.count)));
  const days = rows[0]?.cells.map((c) => c.day) ?? [];

  const cellColor = (count: number) => {
    if (count === 0) return "bg-elevated text-fg-muted";
    const ratio = count / max;
    if (ratio > 0.75) return "bg-brand text-white";
    if (ratio > 0.5) return "bg-brand/70 text-white";
    if (ratio > 0.25) return "bg-brand/40 text-fg";
    return "bg-brand/18 text-fg";
  };

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle hint="Son 10 günde her agent'a düşen yeni lead sayısı. Koyu hücre çok lead, açık hücre az lead demek — dağıtım dengesini gösterir.">
        Günlük Yeni Lead Dağılımı
      </SectionTitle>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Agent</th>
              {days.map((d) => (
                <th key={d} className="px-1 py-1.5 text-center font-body text-[9.5px] font-medium text-fg-muted">{d}</th>
              ))}
              <th className="px-2 py-1.5 text-right font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Toplam</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.agentId}>
                <td className="whitespace-nowrap px-2 py-1 font-body text-[11.5px] text-fg-secondary">{r.name}</td>
                {r.cells.map((c) => (
                  <td key={c.day} className="px-1 py-1">
                    <div className={cn("flex h-7 items-center justify-center rounded-[6px] font-mono text-[10.5px] font-semibold", cellColor(c.count))}>
                      {c.count > 0 ? c.count : ""}
                    </div>
                  </td>
                ))}
                <td className="px-2 py-1 text-right font-mono text-[11.5px] font-semibold text-fg">{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
