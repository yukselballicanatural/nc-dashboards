"use client";

import { ArrowUp } from "lucide-react";
import {
  CURRENT_MONTH_INDEX,
  DAILY_COMMISSION_ROWS,
  DAY_OF_MONTH,
  DAYS_IN_MONTH,
  MONTH_TO_DATE,
} from "@/lib/mock/agent-earnings";
import { formatCurrencyEUR, formatNumber, formatRatePct, monthsFor } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * GÜNLÜK ANLIK PRİM TABLOSU — v2 4.7.
 *
 * Her satır: o günün tahsilatı + ay başından o güne birikimli satış + o
 * birikimin karşılık geldiği oran + biriken prim. Oran basamaklı olduğu için
 * bandın aşıldığı gün primde sıçrama olur; o satır `crossedBand` ile
 * vurgulanır (agent "hangi gün oranım yükseldi" sorusunu buradan görür).
 *
 * Satışı olmayan günler gizlenir — 31 satırlık boş tablo yerine yalnızca
 * hareketin olduğu günler + bugün gösterilir (v2: "tablo yığını değil").
 */
export function DailyCommissionTable() {
  const { t, lang } = useLang();
  const monthLabel = monthsFor(lang)[CURRENT_MONTH_INDEX] ?? "";

  const rows = DAILY_COMMISSION_ROWS.filter((r) => r.salesEUR > 0 || r.isToday);

  const HEADERS: Array<[string, string]> = [
    ["Gün", "Day"],
    ["Günün Tahsilatı", "Collected That Day"],
    ["Deal", "Deals"],
    ["Birikimli Satış", "Cumulative Sales"],
    ["Oran", "Rate"],
    ["Biriken Prim", "Accrued Commission"],
    ["Prim Artışı", "Commission Gain"],
  ];

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle
        hint={t(
          `Prim oranı ayın toplam satışına göre basamaklı belirlenir; bu yüzden prim her gün birikimli satış üzerinden yeniden hesaplanır. Yukarı oklu satırlar bir üst prim bandına geçtiğin günlerdir.`,
          `The commission rate is tiered by your total monthly sales, so commission is recalculated from cumulative sales each day. Rows with an up arrow are the days you moved into a higher tier.`,
        )}
        aside={
          <span className="shrink-0 font-mono text-[11px] text-fg-muted">
            {monthLabel} · {formatNumber(DAY_OF_MONTH)}/{formatNumber(DAYS_IN_MONTH)}
          </span>
        }
      >
        <T tr="Günlük Prim Hesabı" en="Daily Commission Breakdown" />
      </SectionTitle>

      {rows.length === 0 ? (
        <p className="py-6 text-center font-body text-[12.5px] text-fg-secondary">
          <T
            tr="Bu ay henüz tahsilatı kapanan bir satış yok — ilk tahsilatla birlikte prim hesabın burada belirecek."
            en="No sales have been collected yet this month — your commission breakdown will appear here with the first payment."
          />
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                {HEADERS.map(([tr, en], i) => (
                  <th
                    key={tr}
                    scope="col"
                    className={cn(
                      "px-2.5 py-2 font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted",
                      i === 0 ? "text-left" : "text-right",
                    )}
                  >
                    {t(tr, en)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.day}
                  className={cn(
                    "border-b border-border transition-colors last:border-0 hover:bg-elevated",
                    row.isToday && "bg-elevated/60",
                  )}
                >
                  <td className="px-2.5 py-2.5 text-left font-mono text-[11.5px] text-fg">
                    {formatNumber(row.day)} {monthLabel}
                    {row.isToday && (
                      <span className="ml-1.5 rounded-pill bg-brand/15 px-1.5 py-0.5 font-body text-[9.5px] font-semibold uppercase text-brand">
                        {t("bugün", "today")}
                      </span>
                    )}
                  </td>
                  <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">
                    {row.salesEUR > 0 ? formatCurrencyEUR(row.salesEUR) : "—"}
                  </td>
                  <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">
                    {row.deals > 0 ? formatNumber(row.deals) : "—"}
                  </td>
                  <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">
                    {formatCurrencyEUR(row.cumulativeSalesEUR)}
                  </td>
                  <td
                    className={cn(
                      "px-2.5 py-2.5 text-right font-mono text-[11.5px]",
                      row.ratePct === 0 ? "text-fg-muted" : "font-semibold text-brand",
                    )}
                  >
                    {formatRatePct(row.ratePct)}
                  </td>
                  <td className="px-2.5 py-2.5 text-right font-mono text-[12px] font-semibold text-fg">
                    {formatCurrencyEUR(row.accruedCommissionEUR)}
                  </td>
                  <td
                    className={cn(
                      "px-2.5 py-2.5 text-right font-mono text-[11.5px]",
                      row.crossedBand
                        ? "font-bold text-success"
                        : row.commissionDeltaEUR > 0
                          ? "text-fg-secondary"
                          : "text-fg-muted",
                    )}
                  >
                    <span className="inline-flex items-center justify-end gap-1">
                      {row.crossedBand && <ArrowUp size={12} aria-hidden />}
                      {row.commissionDeltaEUR > 0
                        ? `+${formatCurrencyEUR(row.commissionDeltaEUR)}`
                        : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td className="px-2.5 py-2.5 text-left font-body text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                  {t("Ay toplamı", "Month total")}
                </td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] font-semibold text-fg">
                  {formatCurrencyEUR(MONTH_TO_DATE.salesEUR)}
                </td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] font-semibold text-fg-secondary">
                  {formatNumber(MONTH_TO_DATE.deals)}
                </td>
                <td className="px-2.5 py-2.5" />
                <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] font-semibold text-brand">
                  {formatRatePct(MONTH_TO_DATE.ratePct)}
                </td>
                <td className="px-2.5 py-2.5 text-right font-mono text-[13px] font-bold text-brand">
                  {formatCurrencyEUR(MONTH_TO_DATE.commissionEUR)}
                </td>
                <td className="px-2.5 py-2.5" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}
