"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { formatCurrencyEUR, formatNumber, formatPercent } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";

type SortKey =
  | "teamName" | "agentCount" | "leads" | "calls" | "answerRatePct"
  | "slaCompliantPct" | "leadToDealPct" | "deals" | "paymentsEUR" | "avgScore";

const COLUMNS: Array<{ key: SortKey; labelTr: string; labelEn: string; leftAlign?: boolean }> = [
  { key: "teamName", labelTr: "Takım", labelEn: "Team", leftAlign: true },
  { key: "agentCount", labelTr: "Danışman", labelEn: "Agents" },
  { key: "leads", labelTr: "Lead", labelEn: "Lead" },
  { key: "calls", labelTr: "Arama", labelEn: "Calls" },
  { key: "answerRatePct", labelTr: "Ulaşım", labelEn: "Answer" },
  { key: "slaCompliantPct", labelTr: "SLA", labelEn: "SLA" },
  { key: "leadToDealPct", labelTr: "Dönüşüm", labelEn: "Conversion" },
  { key: "deals", labelTr: "Deal", labelEn: "Deal" },
  { key: "paymentsEUR", labelTr: "Ciro", labelEn: "Revenue" },
  { key: "avgScore", labelTr: "Takım Skoru", labelEn: "Team Score" },
];

/** Takım detay tablosu — lider + tüm metrikler, sıralanabilir. */
export function TeamComparisonTable() {
  const { data } = useRegionDateRange();
  const { t } = useLang();
  const [sortKey, setSortKey] = useState<SortKey>("avgScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    const sorted = [...data.teams].sort((a, b) => {
      if (sortKey === "teamName") return a.teamName.localeCompare(b.teamName, "tr-TR");
      return a[sortKey] - b[sortKey];
    });
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [data.teams, sortKey, sortDir]);

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
          "Sütun başlığına tıklayarak sırala. Takım skoru = üye danışmanların Genel Başarı ortalaması.",
          "Click a column header to sort. Team score = the average Overall Score of member agents.",
        )}
      >
        <T tr="Takım Detay Karşılaştırması" en="Team Detail Comparison" />
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {COLUMNS.map((col) => {
                const active = col.key === sortKey;
                const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th key={col.key} className={cn("whitespace-nowrap px-2.5 py-2 font-body text-[10px] font-semibold uppercase tracking-wide", col.leftAlign ? "text-left" : "text-right")}>
                    <button type="button" onClick={() => toggle(col.key)} className={cn("flex items-center gap-1 transition-colors", col.leftAlign ? "" : "ml-auto", active ? "text-brand" : "text-fg-muted hover:text-fg-secondary")}>
                      {t(col.labelTr, col.labelEn)}
                      <Icon size={11} aria-hidden />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.teamId} className="border-b border-border transition-colors last:border-0 hover:bg-elevated">
                <td className="px-2.5 py-2.5">
                  <div className="flex flex-col">
                    <span className="whitespace-nowrap font-body text-[12.5px] font-medium text-fg">{t.teamName}</span>
                    <span className="font-body text-[10px] text-fg-muted">{t.teamLeaderName}</span>
                  </div>
                </td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">{t.agentCount}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">{formatNumber(t.leads)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">{formatNumber(t.calls)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">{formatPercent(t.answerRatePct, 0)}</td>
                <td className={cn("px-2.5 py-2.5 text-right font-mono text-[11.5px]", t.slaCompliantPct < 65 ? "font-semibold text-critical" : "text-fg")}>{formatPercent(t.slaCompliantPct, 0)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">{formatPercent(t.leadToDealPct, 0)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">{formatNumber(t.deals)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">{formatCurrencyEUR(t.paymentsEUR)}</td>
                <td className="px-2.5 py-2.5 text-right">
                  <span className={cn("font-mono text-[12.5px] font-semibold", t.avgScore >= 65 ? "text-success" : t.avgScore >= 45 ? "text-warning" : "text-critical")}>
                    {t.avgScore.toFixed(1)}
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
