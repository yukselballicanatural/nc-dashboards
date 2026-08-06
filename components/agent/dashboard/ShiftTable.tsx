"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { shiftWeek } from "@/lib/mock/mock-data";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * Vardiya tablosu — v2 4.6: son 7 gün.
 * Geç kalma >5 dk olan satırlar kırmızı/kalın vurgulanır.
 * Turnike bazlı 30 günlük döküm ve eksik mesai bakiyesi için "Mesai & PDKS"
 * sayfasına link verir (bkz. app/agent/pdks/page.tsx).
 */
export function ShiftTable() {
  const { t, lang } = useLang();
  const HEADERS: Array<[string, string]> = [
    ["Tarih", "Date"],
    ["Plan Giriş", "Planned In"],
    ["Giriş", "In"],
    ["Plan Çıkış", "Planned Out"],
    ["Çıkış", "Out"],
    ["Geç Kalma", "Lateness"],
    ["Mola", "Break"],
    ["Çalışma", "Worked"],
  ];

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle
        hint={t("Planlanan vardiyan 09:00-18:00. 5 dakikadan fazla geç başlayan günler kırmızı işaretlenir.", "Your planned shift is 09:00-18:00. Days starting more than 5 minutes late are marked red.")}
        aside={
          <Link
            href="/agent/pdks"
            className="group flex shrink-0 items-center gap-1 font-body text-[11px] font-semibold text-brand transition-colors hover:text-brand-secondary"
          >
            <T tr="Turnike dökümü ve eksik mesai" en="Turnstile log and missing hours" />
            <ArrowRight size={13} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        }
      >
        <T tr="Son 7 Gün Vardiya" en="Last 7 Days' Shifts" />
      </SectionTitle>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {HEADERS.map(([tr, en]) => (
                <th
                  key={tr}
                  scope="col"
                  className="px-2.5 py-2 text-left font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted"
                >
                  {t(tr, en)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shiftWeek(lang).map((day) => {
              const isLate = day.lateMinutes > 5;
              return (
                <tr
                  key={day.date}
                  className="border-b border-border transition-colors last:border-0 hover:bg-elevated"
                >
                  <td className="px-2.5 py-2.5 font-mono text-[11.5px] text-fg">{day.date}</td>
                  <td className="px-2.5 py-2.5 font-mono text-[11.5px] text-fg-muted">{day.plannedIn}</td>
                  <td
                    className={cn(
                      "px-2.5 py-2.5 font-mono text-[11.5px]",
                      isLate ? "font-bold text-critical" : "text-fg",
                    )}
                  >
                    {day.actualIn}
                  </td>
                  <td className="px-2.5 py-2.5 font-mono text-[11.5px] text-fg-muted">{day.plannedOut}</td>
                  <td className="px-2.5 py-2.5 font-mono text-[11.5px] text-fg">{day.actualOut}</td>
                  <td
                    className={cn(
                      "px-2.5 py-2.5 font-mono text-[11.5px]",
                      isLate ? "font-bold text-critical" : "text-fg-secondary",
                    )}
                  >
                    {day.lateMinutes > 0 ? `${day.lateMinutes} ${t("dk", "min")}` : "—"}
                  </td>
                  <td className="px-2.5 py-2.5 font-mono text-[11.5px] text-fg-secondary">
                    {day.breakMinutes} {t("dk", "min")}
                  </td>
                  <td className="px-2.5 py-2.5 font-mono text-[11.5px] text-fg">
                    {formatNumber(day.workedHours, 1)} {t("sa", "hr")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
