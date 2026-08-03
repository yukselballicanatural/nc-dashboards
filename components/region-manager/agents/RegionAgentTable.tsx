"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { formatCurrencyEUR, formatNumber, formatPercent } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";

type SortKey =
  | "name" | "leads" | "calls" | "answerRatePct" | "slaCompliantPct"
  | "deals" | "paymentsEUR" | "score";

const COLUMNS: Array<{ key: SortKey; labelTr: string; labelEn: string; leftAlign?: boolean }> = [
  { key: "name", labelTr: "Danışman", labelEn: "Agent", leftAlign: true },
  { key: "leads", labelTr: "Lead", labelEn: "Lead" },
  { key: "calls", labelTr: "Arama", labelEn: "Calls" },
  { key: "answerRatePct", labelTr: "Ulaşım", labelEn: "Answer" },
  { key: "slaCompliantPct", labelTr: "SLA", labelEn: "SLA" },
  { key: "deals", labelTr: "Deal", labelEn: "Deal" },
  { key: "paymentsEUR", labelTr: "Ciro", labelEn: "Revenue" },
  { key: "score", labelTr: "Genel Başarı", labelEn: "Overall Score" },
];

/**
 * Bölge geneli danışman tablosu — tüm takımlardan, takım kolonlu.
 * Takıma göre filtre + isim arama + sütun sıralaması.
 */
export function RegionAgentTable() {
  const { data } = useRegionDateRange();
  const { t: tr } = useLang();
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const teamOptions = useMemo(
    () => [{ id: "all", name: tr("Tüm Takımlar", "All Teams") }, ...data.teams.map((t) => ({ id: t.teamId, name: t.teamName }))],
    [data.teams, tr],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    const filtered = data.agents.filter((a) => {
      if (teamFilter !== "all" && a.teamId !== teamFilter) return false;
      if (q && !a.name.toLocaleLowerCase("tr-TR").includes(q)) return false;
      return true;
    });
    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name, "tr-TR");
      return a[sortKey] - b[sortKey];
    });
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [data.agents, teamFilter, query, sortKey, sortDir]);

  const toggle = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <SectionTitle
          hint={tr(
            "Bölgedeki tüm danışmanlar tek listede. Takıma göre filtrele, isim ara, sütuna göre sırala.",
            "All agents in the region in one list. Filter by team, search by name, sort by column.",
          )}
        >
          <T tr="Bölge Danışman Sıralaması" en="Region Agent Ranking" />
        </SectionTitle>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-1">
            {teamOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTeamFilter(opt.id)}
                aria-pressed={teamFilter === opt.id}
                className={cn(
                  "rounded-pill px-2.5 py-1 font-body text-[11px] font-medium transition-colors",
                  teamFilter === opt.id ? "bg-brand/12 text-brand" : "text-fg-secondary hover:bg-elevated hover:text-fg",
                )}
              >
                {opt.id === "all" ? opt.name : opt.name.replace(" Team", "")}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={13} aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr("Danışman ara...", "Search agents...")}
              aria-label={tr("Danışman ara", "Search agents")}
              className="h-8 w-full rounded-control border border-border bg-bg pl-8 pr-3 font-body text-[12px] text-fg placeholder:text-fg-muted sm:w-44"
            />
          </div>
        </div>
      </div>

      <p className="font-mono text-[11px] text-fg-muted">{tr(`${formatNumber(rows.length)} danışman gösteriliyor`, `showing ${formatNumber(rows.length)} agents`)}</p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2.5 py-2 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">#</th>
              {COLUMNS.map((col) => {
                const active = col.key === sortKey;
                const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th key={col.key} className={cn("whitespace-nowrap px-2.5 py-2 font-body text-[10px] font-semibold uppercase tracking-wide", col.leftAlign ? "text-left" : "text-right")}>
                    <button type="button" onClick={() => toggle(col.key)} className={cn("flex items-center gap-1 transition-colors", col.leftAlign ? "" : "ml-auto", active ? "text-brand" : "text-fg-muted hover:text-fg-secondary")}>
                      {tr(col.labelTr, col.labelEn)}
                      <Icon size={11} aria-hidden />
                    </button>
                  </th>
                );
              })}
              <th className="px-2.5 py-2 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{tr("Takım", "Team")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => (
              <tr key={a.agentId} className="border-b border-border transition-colors last:border-0 hover:bg-elevated">
                <td className="px-2.5 py-2.5 font-mono text-[11px] text-fg-muted">{i + 1}</td>
                <td className="px-2.5 py-2.5">
                  <div className="flex flex-col">
                    <span className="whitespace-nowrap font-body text-[12.5px] font-medium text-fg">{a.name}</span>
                    <span className="font-body text-[10px] text-fg-muted">{a.role}</span>
                  </div>
                </td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">{formatNumber(a.leads)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">{formatNumber(a.calls)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">{formatPercent(a.answerRatePct, 0)}</td>
                <td className={cn("px-2.5 py-2.5 text-right font-mono text-[11.5px]", a.slaCompliantPct < 60 ? "font-semibold text-critical" : "text-fg")}>{formatPercent(a.slaCompliantPct, 0)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">{formatNumber(a.deals)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">{formatCurrencyEUR(a.paymentsEUR)}</td>
                <td className="px-2.5 py-2.5 text-right">
                  <span className={cn("font-mono text-[12.5px] font-semibold", a.score >= 65 ? "text-success" : a.score >= 45 ? "text-warning" : "text-critical")}>
                    {a.score.toFixed(1)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-2.5 py-2.5 font-body text-[11px] text-fg-secondary">{a.teamName.replace(" Team", "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-10 text-center font-body text-sm text-fg-muted"><T tr="Seçili filtrede danışman yok." en="No agents match the selected filter." /></p>
        )}
      </div>
    </Card>
  );
}
