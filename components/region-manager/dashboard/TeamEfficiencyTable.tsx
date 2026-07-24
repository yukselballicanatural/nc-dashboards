"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { formatCurrencyEUR, formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";

/**
 * Takım verimliliği — kişi başına normalize metrikler. Büyük takım her zaman
 * daha iyi değildir; kişi başına ciro/deal/arama gerçek verimliliği gösterir.
 * (RM için kritik: headcount yanılsamasını ortadan kaldırır.)
 */

type Row = {
  teamId: string;
  teamName: string;
  agentCount: number;
  ciroPerAgent: number;
  dealsPerAgent: number;
  callsPerAgent: number;
};

type SortKey = "agentCount" | "ciroPerAgent" | "dealsPerAgent" | "callsPerAgent";

const COLUMNS: Array<{ key: SortKey; labelTr: string; labelEn: string }> = [
  { key: "agentCount", labelTr: "Danışman", labelEn: "Agents" },
  { key: "callsPerAgent", labelTr: "Arama / Kişi", labelEn: "Calls / Agent" },
  { key: "dealsPerAgent", labelTr: "Deal / Kişi", labelEn: "Deals / Agent" },
  { key: "ciroPerAgent", labelTr: "Ciro / Kişi", labelEn: "Revenue / Agent" },
];

export function TeamEfficiencyTable() {
  const { data } = useRegionDateRange();
  const { t } = useLang();
  const [sortKey, setSortKey] = useState<SortKey>("ciroPerAgent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo<Row[]>(() => {
    const mapped = data.teams.map((t) => {
      const n = Math.max(t.agentCount, 1);
      return {
        teamId: t.teamId,
        teamName: t.teamName,
        agentCount: t.agentCount,
        ciroPerAgent: Math.round(t.paymentsEUR / n),
        dealsPerAgent: Math.round((t.deals / n) * 10) / 10,
        callsPerAgent: Math.round((t.calls / n) * 10) / 10,
      };
    });
    const sorted = mapped.sort((a, b) => a[sortKey] - b[sortKey]);
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [data.teams, sortKey, sortDir]);

  const bestCiro = Math.max(...rows.map((r) => r.ciroPerAgent), 0);

  const toggle = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle
        hint={t(
          "Kişi başına normalize edilmiş metrikler — büyük takım her zaman daha iyi değildir. Ciro/kişi gerçek verimliliği gösterir; en yüksek yeşil rozetli.",
          "Per-agent normalized metrics — a bigger team isn't always better. Revenue/agent reveals true efficiency; the highest gets a green badge.",
        )}
      >
        <T tr="Takım Verimliliği (Kişi Başına)" en="Team Efficiency (Per Agent)" />
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2.5 py-2 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted"><T tr="Takım" en="Team" /></th>
              {COLUMNS.map((col) => {
                const active = col.key === sortKey;
                const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th key={col.key} className="whitespace-nowrap px-2.5 py-2 text-right font-body text-[10px] font-semibold uppercase tracking-wide">
                    <button type="button" onClick={() => toggle(col.key)} className={cn("ml-auto flex items-center gap-1 transition-colors", active ? "text-brand" : "text-fg-muted hover:text-fg-secondary")}>
                      {t(col.labelTr, col.labelEn)}
                      <Icon size={11} aria-hidden />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.teamId} className="border-b border-border transition-colors last:border-0 hover:bg-elevated">
                <td className="px-2.5 py-2.5 font-body text-[12.5px] font-medium text-fg">{r.teamName.replace(" Team", "")}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">{r.agentCount}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">{formatNumber(r.callsPerAgent, 1)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">{formatNumber(r.dealsPerAgent, 1)}</td>
                <td className="px-2.5 py-2.5 text-right">
                  <span className={cn("font-mono text-[12px] font-semibold", r.ciroPerAgent === bestCiro && bestCiro > 0 ? "rounded-pill bg-success/12 px-1.5 py-0.5 text-success" : "text-fg")}>
                    {formatCurrencyEUR(r.ciroPerAgent)}
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
