"use client";

import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import type { StatusLevel } from "@/lib/types/agent-data";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { formatNumber, formatCurrencyEUR } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * "Sıralama & Kazanç" — Zoho: Rank dashboard'unun sade karşılığı. Genel Başarı
 * puanına göre sıralı; her agent'ın kıdemi, seviyesi, kapatılan deal, alınan
 * ödeme, ön ödeme, teklif tutarı ve uçak bileti sayısı tek tabloda.
 */

const SCORE_PILL: Record<StatusLevel, string> = {
  success: "bg-success/12 text-success",
  warning: "bg-warning/16 text-warning",
  risk: "bg-risk/14 text-risk",
  critical: "bg-critical/12 text-critical",
  neutral: "bg-neutral/16 text-fg-secondary",
};

export function AgentEarningsTable() {
  const { data } = useTeamDateRange();
  const { t } = useLang();
  const rows = data.agentEarnings;

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle hint={t("Genel Başarı puanına göre sıralama + parasal katkı. Kıdem ve seviye, kimin ne kadar sürede bu noktaya geldiğini gösterir; ön ödeme ve uçak bileti satışın gerçekten ilerlediğinin işaretidir.", "Ranking by Overall Score + monetary contribution. Tenure and level show who reached this point in how much time; prepayment and flight tickets are signs the sale is actually progressing.")}>
        <T tr="Sıralama & Kazanç" en="Ranking & Earnings" />
      </SectionTitle>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {[
                { h: "#", hEn: "#", a: "left" },
                { h: "Agent", hEn: "Agent", a: "left" },
                { h: "Kıdem", hEn: "Tenure", a: "left" },
                { h: "Puan", hEn: "Score", a: "right" },
                { h: "Deal", hEn: "Deal", a: "right" },
                { h: "Ödeme", hEn: "Payment", a: "right" },
                { h: "Ön Ödeme", hEn: "Prepayment", a: "right" },
                { h: "Teklif Tutarı", hEn: "Offer Amount", a: "right" },
                { h: "Uçak Bileti", hEn: "Flight Tickets", a: "right" },
              ].map((c) => (
                <th key={c.h} className={cn("px-2.5 py-2 font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted", c.a === "left" ? "text-left" : "text-right")}>
                  {t(c.h, c.hEn)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.agentId} className="border-b border-border transition-colors last:border-0 hover:bg-elevated">
                <td className="px-2.5 py-2.5 font-mono text-[12px] text-fg-muted">{i + 1}</td>
                <td className="px-2.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-[12.5px] font-medium text-fg">{r.name}</span>
                    <span className="rounded-pill bg-elevated px-1.5 py-0.5 font-body text-[9.5px] font-medium text-fg-muted">{r.role}</span>
                  </div>
                </td>
                <td className="px-2.5 py-2.5 font-body text-[11.5px] text-fg-secondary">{r.tenureLabel}</td>
                <td className="px-2.5 py-2.5 text-right">
                  <span className={cn("inline-block rounded-pill px-2 py-0.5 font-mono text-[11px] font-semibold", SCORE_PILL[r.scoreStatus])}>
                    {r.score.toFixed(0)}
                  </span>
                </td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[12px] text-fg-secondary">{formatNumber(r.deals)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[12px] font-medium text-fg">{formatCurrencyEUR(r.paidEUR)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[12px] text-fg-secondary">{formatCurrencyEUR(r.prepaymentEUR)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[12px] text-fg-secondary">{formatCurrencyEUR(r.offerAmountEUR)}</td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[12px] text-fg-secondary">{formatNumber(r.flightTickets)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
