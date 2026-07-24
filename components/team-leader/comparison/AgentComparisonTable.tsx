"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { formatCurrencyEUR, formatNumber, formatPercent } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * Tam detay tablosu — v2 Bölüm 9: "kim neden düşük" sorusuna cevap.
 * Her sütun tıklanarak sıralanabilir; zayıf metrikler (SLA<60, hiç aranmayan
 * lead varsa) kırmızı/turuncu vurgulanır.
 */

type SortKey =
  | "name" | "leads" | "neverCalled" | "calls" | "answerRatePct"
  | "slaCompliantPct" | "contacts" | "offers" | "deals" | "paymentsEUR" | "score";

interface Column {
  key: SortKey;
  label: string;
  labelEn: string;
  align?: "left" | "right";
}

const COLUMNS: Column[] = [
  { key: "name", label: "Agent", labelEn: "Agent", align: "left" },
  { key: "leads", label: "Lead", labelEn: "Lead" },
  { key: "neverCalled", label: "Aranmayan", labelEn: "Uncalled" },
  { key: "calls", label: "Arama", labelEn: "Calls" },
  { key: "answerRatePct", label: "Ulaşım", labelEn: "Reach" },
  { key: "slaCompliantPct", label: "SLA", labelEn: "SLA" },
  { key: "contacts", label: "Contact", labelEn: "Contact" },
  { key: "offers", label: "Offer", labelEn: "Offer" },
  { key: "deals", label: "Deal", labelEn: "Deal" },
  { key: "paymentsEUR", label: "Ödeme", labelEn: "Payment" },
  { key: "score", label: "Genel Başarı", labelEn: "Overall Score" },
];

export function AgentComparisonTable() {
  const { data } = useTeamDateRange();
  const { t } = useLang();
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    const sorted = [...data.agents].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name, "tr-TR");
      return a[sortKey] - b[sortKey];
    });
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [data.agents, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle hint={t("Sütun başlığına tıklayarak sırala. Kırmızı/turuncu vurgulu hücreler zayıf noktaları işaret eder.", "Click a column header to sort. Cells highlighted in red/orange point to weak spots.")}>
        <T tr="Detaylı Karşılaştırma" en="Detailed Comparison" />
      </SectionTitle>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {COLUMNS.map((col) => {
                const isActive = col.key === sortKey;
                const Icon = isActive ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      "whitespace-nowrap px-2.5 py-2 font-body text-[10px] font-semibold uppercase tracking-wide",
                      col.align === "left" ? "text-left" : "text-right",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        "flex items-center gap-1 transition-colors",
                        col.align === "left" ? "" : "ml-auto",
                        isActive ? "text-brand" : "text-fg-muted hover:text-fg-secondary",
                      )}
                    >
                      {t(col.label, col.labelEn)}
                      <Icon size={11} aria-hidden />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((agent) => (
              <tr
                key={agent.agentId}
                className="border-b border-border transition-colors last:border-0 hover:bg-elevated"
              >
                <td className="px-2.5 py-2.5">
                  <div className="flex flex-col">
                    <span className="whitespace-nowrap font-body text-[12.5px] font-medium text-fg">
                      {agent.name}
                    </span>
                    <span className="font-mono text-[10px] text-fg-muted">{agent.role}</span>
                  </div>
                </td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">
                  {formatNumber(agent.leads)}
                </td>
                <td
                  className={cn(
                    "px-2.5 py-2.5 text-right font-mono text-[11.5px]",
                    agent.neverCalled >= 5 ? "font-semibold text-critical" : "text-fg-secondary",
                  )}
                >
                  {formatNumber(agent.neverCalled)}
                </td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">
                  {formatNumber(agent.calls)}
                </td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">
                  {formatPercent(agent.answerRatePct, 0)}
                </td>
                <td
                  className={cn(
                    "px-2.5 py-2.5 text-right font-mono text-[11.5px]",
                    agent.slaCompliantPct < 60 ? "font-semibold text-critical" : "text-fg",
                  )}
                >
                  {formatPercent(agent.slaCompliantPct, 0)}
                </td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">
                  {formatNumber(agent.contacts)}
                </td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">
                  {formatNumber(agent.offers)}
                </td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">
                  {formatNumber(agent.deals)}
                </td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">
                  {formatCurrencyEUR(agent.paymentsEUR)}
                </td>
                <td className="px-2.5 py-2.5 text-right">
                  <span
                    className={cn(
                      "font-mono text-[12.5px] font-semibold",
                      agent.score >= 65 ? "text-success" : agent.score >= 45 ? "text-warning" : "text-critical",
                    )}
                  >
                    {agent.score.toFixed(1)}
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
