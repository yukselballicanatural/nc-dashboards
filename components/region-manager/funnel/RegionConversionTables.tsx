"use client";

import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import type { ConversionRow } from "@/lib/types/agent-data";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";

function MiniTable({ title, rows }: { title: string; rows: ConversionRow[] }) {
  const bestRate = Math.max(0, ...rows.map((r) => r.ratePct));
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-display text-[12.5px] font-semibold text-fg">{title}</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="py-1.5 pr-2 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Grup</th>
            <th className="px-2 py-1.5 text-right font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Lead</th>
            <th className="px-2 py-1.5 text-right font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Deal</th>
            <th className="py-1.5 pl-2 text-right font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Oran</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.group} className="border-b border-border last:border-0">
              <td className="py-2 pr-2 font-body text-[12px] text-fg">{row.group}</td>
              <td className="px-2 py-2 text-right font-mono text-[11.5px] text-fg-secondary">{formatNumber(row.leads)}</td>
              <td className="px-2 py-2 text-right font-mono text-[11.5px] text-fg-secondary">{formatNumber(row.deals)}</td>
              <td className="py-2 pl-2 text-right">
                <span className={row.ratePct === bestRate && row.ratePct > 0 ? "rounded-pill bg-success/12 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-success" : "font-mono text-[11.5px] text-fg"}>
                  {formatPercent(row.ratePct, 1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Bölge geneli kaynak / ülke / dil dönüşüm tabloları. */
export function RegionConversionTables() {
  const { data } = useRegionDateRange();
  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle hint="Bölge hangi kaynak, ülke ve dilde daha iyi satışa dönüyor? Yeşil rozet en verimli grup — pazarlama/bütçe kararları için.">
        Bölge Dönüşüm Kırılımları
      </SectionTitle>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MiniTable title="Lead Source" rows={data.sourceConversion} />
        <MiniTable title="Ülke" rows={data.countryConversion} />
        <MiniTable title="Dil" rows={data.languageConversion} />
      </div>
    </Card>
  );
}
