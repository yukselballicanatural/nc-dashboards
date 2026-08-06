"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TEAM_SHIFT_ROWS } from "@/lib/mock/team-monthly";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * Agent bazlı vardiya özeti — son 7 gün. "Eksik Çalışma" sütunu, planlanan
 * 8 saatlik net çalışma (09:00-18:00, 1 saat öğle molası varsayımı) ile
 * gerçek çalışma arasındaki farkın haftalık toplamıdır — en yüklü en üstte.
 */
export function TeamShiftTable() {
  const { t } = useLang();
  const HEADERS: Array<[string, string]> = [
    ["Agent", "Agent"],
    ["Rol", "Role"],
    ["Geç Kalma (dk)", "Lateness (min)"],
    ["Eksik Çalışma (sa)", "Shortfall (hr)"],
    ["Uyum Oranı", "Compliance Rate"],
    ["Ort. Mola (dk)", "Avg. Break (min)"],
  ];

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle
        hint={t("Eksik Çalışma = planlanan 8 sa/gün net çalışma ile gerçekleşen arasındaki haftalık toplam fark. En çok eksiği olan en üstte.", "Shortfall = the weekly total difference between the planned 8 net hrs/day and actual hours worked. Largest shortfall first.")}
        aside={
          <Link
            href="/team-leader/pdks"
            className="group flex shrink-0 items-center gap-1 font-body text-[11px] font-semibold text-brand transition-colors hover:text-brand-secondary"
          >
            <T tr="Turnike dökümü ve eksik mesai" en="Turnstile log and missing hours" />
            <ArrowRight size={13} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        }
      >
        <T tr="Agent Bazlı Vardiya Özeti (7 Gün)" en="Shift Summary by Agent (7 Days)" />
      </SectionTitle>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {HEADERS.map(([tr, en]) => (
                <th
                  key={tr}
                  className="whitespace-nowrap px-2.5 py-2 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted"
                >
                  {t(tr, en)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TEAM_SHIFT_ROWS.map((row) => (
              <tr key={row.agentId} className="border-b border-border transition-colors last:border-0 hover:bg-elevated">
                <td className="px-2.5 py-2.5 font-body text-[12.5px] font-medium text-fg">{row.name}</td>
                <td className="px-2.5 py-2.5 font-mono text-[10.5px] text-fg-muted">{row.role}</td>
                <td className={cn("px-2.5 py-2.5 font-mono text-[11.5px]", row.lateMinutesTotal > 30 ? "font-semibold text-critical" : "text-fg-secondary")}>
                  {row.lateMinutesTotal > 0 ? `${row.lateMinutesTotal} ${t("dk", "min")}` : "—"}
                </td>
                <td className={cn("px-2.5 py-2.5 font-mono text-[11.5px]", row.deficitHours >= 3 ? "font-semibold text-risk" : "text-fg")}>
                  {formatNumber(row.deficitHours, 1)} {t("sa", "hr")}
                </td>
                <td className="px-2.5 py-2.5 font-mono text-[11.5px] text-fg">
                  %{Math.round(row.compliancePct)}
                </td>
                <td className="px-2.5 py-2.5 font-mono text-[11.5px] text-fg-secondary">
                  {row.avgBreakMinutes} {t("dk", "min")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
