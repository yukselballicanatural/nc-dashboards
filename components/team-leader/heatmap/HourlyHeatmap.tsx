"use client";

import { useMemo } from "react";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HoverTip } from "@/components/ui/HoverTip";
import { formatPercent } from "@/lib/utils/format";

/**
 * Saatlik aktivite ısı haritası — CLAUDE.md Bölüm 9, sekme 3/5.
 * Satır: agent (Genel Başarı sırasına göre) · Sütun: mesai saati (09-18).
 * Renk = o saatteki cevaplanma oranı (kırmızıdan yeşile), opaklık = arama
 * hacmi. Amaç: "kim mesai saatlerinin bir kısmında hiç aramıyor" gibi
 * boşlukları görünür kılmak.
 */

function cellTone(ratePct: number | null): string {
  if (ratePct === null) return "success";
  if (ratePct >= 50) return "success";
  if (ratePct >= 35) return "warning";
  if (ratePct >= 20) return "risk";
  return "critical";
}

const TONE_BG: Record<string, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  risk: "var(--risk)",
  critical: "var(--critical)",
};

export function HourlyHeatmap() {
  const { data } = useTeamDateRange();

  const orderedRows = useMemo(() => {
    const byId = new Map(data.heatmap.map((row) => [row.agentId, row]));
    return data.agents
      .map((agent) => byId.get(agent.agentId))
      .filter((row): row is NonNullable<typeof row> => row !== undefined);
  }, [data.agents, data.heatmap]);

  const maxTotal = useMemo(
    () => Math.max(1, ...orderedRows.flatMap((row) => row.cells.map((c) => c.total))),
    [orderedRows],
  );

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle hint="Renk = o saatteki cevaplanma oranı, koyuluk = arama yoğunluğu. Soluk/boş hücreler o saatte hiç arama yapılmadığını gösterir.">
        Saatlik Aktivite — Agent × Saat
      </SectionTitle>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              <th className="w-36 shrink-0 px-2 py-1.5 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                Agent
              </th>
              {orderedRows[0]?.cells.map((cell) => (
                <th
                  key={cell.hour}
                  className="px-1 py-1.5 text-center font-mono text-[10px] font-semibold text-fg-muted"
                >
                  {cell.hour}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderedRows.map((row) => (
              <tr key={row.agentId}>
                <td className="whitespace-nowrap px-2 py-1 font-body text-[11.5px] font-medium text-fg">
                  {row.name}
                </td>
                {row.cells.map((cell) => {
                  const tone = cellTone(cell.ratePct);
                  const opacity =
                    cell.total === 0 ? 0 : Math.min(1, cell.total / maxTotal) * 0.8 + 0.2;
                  return (
                    <td key={cell.hour} className="p-0.5">
                      <div className="group relative">
                        <div
                          className="h-7 w-full rounded-[6px] transition-transform duration-150 group-hover:scale-105"
                          style={{
                            backgroundColor:
                              cell.total === 0 ? "var(--border)" : TONE_BG[tone],
                            opacity: cell.total === 0 ? 0.4 : opacity,
                          }}
                        />
                        <HoverTip align="center">
                          <p className="mb-0.5 font-display text-[12px] font-semibold text-fg">
                            {row.name} · {cell.hour}:00
                          </p>
                          {cell.total > 0 ? (
                            <p className="font-mono text-[11px] text-fg-secondary">
                              {cell.total} arama · {formatPercent(cell.ratePct ?? 0, 0)} cevaplanma
                            </p>
                          ) : (
                            <p className="font-mono text-[11px] text-fg-muted">
                              Bu saatte arama yok
                            </p>
                          )}
                        </HoverTip>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3">
        <span className="font-body text-[11px] text-fg-muted">Cevaplanma oranı:</span>
        {(["success", "warning", "risk", "critical"] as const).map((tone) => (
          <span key={tone} className="flex items-center gap-1.5 font-body text-[11px] text-fg-secondary">
            <span
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ backgroundColor: TONE_BG[tone] }}
            />
            {tone === "success" && "≥%50"}
            {tone === "warning" && "%35-49"}
            {tone === "risk" && "%20-34"}
            {tone === "critical" && "<%20"}
          </span>
        ))}
        <span className="flex items-center gap-1.5 font-body text-[11px] text-fg-secondary">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-border" />
          Arama yok
        </span>
      </div>
    </Card>
  );
}
