"use client";

import { Phone, Clock, AlertCircle } from "lucide-react";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * "Geri aranacaklar" — Zoho: CloudTalk CallBack listesinin sade karşılığı.
 * Takımdaki tüm planlı geri aramalar tek listede; tarihi geçmişler kırmızı
 * işaretli. Kart-liste (tablo değil) — taranabilir olsun diye.
 */

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

function fmt(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const mon = MONTHS[d.getMonth()];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${mon} · ${hh}:${mm}`;
}

export function TeamCallbackList() {
  const { data } = useTeamDateRange();
  const { t } = useLang();
  const rows = data.teamCallbacks;
  const overdueCount = rows.filter((r) => r.overdue).length;

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle
        hint={t("Takımdaki danışmanların planladığı geri aramalar. Tarihi geçmiş olanlar kırmızı — bunların takibi kaçan fırsatları önler.", "Callbacks scheduled by the team's agents. Overdue ones are red — following up on these prevents missed opportunities.")}
      >
        <T tr="Geri Aranacaklar" en="Callbacks" />
      </SectionTitle>

      <p className="font-mono text-[11px] text-fg-muted">
        {formatNumber(rows.length)} {t("planlı geri arama", "scheduled callbacks")}
        {overdueCount > 0 && <span className="text-critical"> · {t(`${overdueCount} tanesi gecikmiş`, `${overdueCount} overdue`)}</span>}
      </p>

      {rows.length === 0 ? (
        <p className="py-6 text-center font-body text-[13px] text-fg-muted"><T tr="Planlı geri arama yok." en="No scheduled callbacks." /></p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.slice(0, 40).map((r) => (
            <li
              key={r.id}
              className={cn(
                "flex items-center gap-3 rounded-control border px-3.5 py-2.5",
                r.overdue ? "border-critical/30 bg-critical/5" : "border-border bg-bg",
              )}
            >
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-control", r.overdue ? "bg-critical/12 text-critical" : "bg-brand/12 text-brand")}>
                {r.overdue ? <AlertCircle size={15} /> : <Phone size={15} />}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-body text-[12.5px] font-medium text-fg">{r.contactName}</span>
                <span className="font-mono text-[11px] text-fg-muted">{r.phone}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className={cn("flex items-center gap-1 font-body text-[11.5px] font-medium", r.overdue ? "text-critical" : "text-fg-secondary")}>
                  <Clock size={11} aria-hidden />
                  {fmt(r.dateISO)}
                </span>
                <span className="font-body text-[10.5px] text-fg-muted">{r.agentName}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
