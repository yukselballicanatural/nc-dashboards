"use client";

import { useMemo, useState } from "react";
import { PhoneOutgoing, Search } from "lucide-react";
import { useDateRange } from "@/components/agent/filters/DateRangeContext";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import type { LeadPriority } from "@/lib/types/agent-data";
import { formatNumber, formatShortDate } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * Follow-up listesi — v2 4.4: tam kolonlu tablo.
 * Öncelik filtre butonları + arama (isim/ID/telefon); öncelik sırasına göre
 * sıralı gelir (veri katmanında). Dar ekranda tablo kendi içinde kayar.
 */

const PRIORITY_META: Record<LeadPriority, { labelTr: string; labelEn: string; badge: string }> = {
  "cok-kritik": { labelTr: "Çok Kritik", labelEn: "Very Critical", badge: "bg-critical/12 text-critical" },
  kritik: { labelTr: "Kritik", labelEn: "Critical", badge: "bg-risk/14 text-risk" },
  yuksek: { labelTr: "Yüksek", labelEn: "High", badge: "bg-warning/16 text-warning" },
  orta: { labelTr: "Orta", labelEn: "Medium", badge: "bg-indigo/12 text-indigo" },
  normal: { labelTr: "Normal", labelEn: "Normal", badge: "bg-neutral/16 text-fg-secondary" },
};

const FILTER_OPTIONS: Array<{ key: LeadPriority | "all"; labelTr: string; labelEn: string }> = [
  { key: "all", labelTr: "Tümü", labelEn: "All" },
  { key: "cok-kritik", labelTr: "Çok Kritik", labelEn: "Very Critical" },
  { key: "kritik", labelTr: "Kritik", labelEn: "Critical" },
  { key: "yuksek", labelTr: "Yüksek", labelEn: "High" },
  { key: "orta", labelTr: "Orta", labelEn: "Medium" },
  { key: "normal", labelTr: "Normal", labelEn: "Normal" },
];

const HEADERS: Array<[string, string]> = [
  ["Öncelik", "Priority"],
  ["Lead", "Lead"],
  ["Ülke/Dil", "Country/Language"],
  ["Kaynak", "Source"],
  ["Oluşturulma", "Created"],
  ["Son Arama", "Last Call"],
  ["Deneme", "Attempts"],
  ["Sonuç", "Result"],
  ["Status", "Status"],
  ["Due", "Due"],
  ["Callback", "Callback"],
  ["Offer", "Offer"],
  ["Deal", "Deal"],
  ["Yapılacak İşlem", "Next Action"],
];

export function FollowUpTable() {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<LeadPriority | "all">("all");
  const { data } = useDateRange();
  const { t } = useLang();

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    return data.followUp.filter((row) => {
      if (priority !== "all" && row.priority !== priority) return false;
      if (!q) return true;
      return [row.name, row.id, row.phone]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(q);
    });
  }, [query, priority, data.followUp]);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <SectionTitle hint={t("Aksiyon bekleyen tüm lead'lerin — en acil en üstte. 'Yapılacak İşlem' sana bir sonraki adımı söyler.", "All leads awaiting action — most urgent first. 'Next Action' tells you the next step.")}>
          <T tr="Follow-up Listesi" en="Follow-up List" />
        </SectionTitle>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-1">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setPriority(option.key)}
                aria-pressed={priority === option.key}
                className={cn(
                  "rounded-pill px-2.5 py-1 font-body text-[11px] font-medium transition-colors",
                  priority === option.key
                    ? "bg-brand/12 text-brand"
                    : "text-fg-secondary hover:bg-elevated hover:text-fg",
                )}
              >
                {t(option.labelTr, option.labelEn)}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search
              size={13}
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-muted"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("İsim, ID veya telefon...", "Name, ID or phone...")}
              aria-label={t("Lead ara", "Search leads")}
              className="h-8 w-full rounded-control border border-border bg-bg pl-8 pr-3 font-body text-[12px] text-fg placeholder:text-fg-muted sm:w-52"
            />
          </div>
        </div>
      </div>

      <p className="font-mono text-[11px] text-fg-muted">
        {t(`${formatNumber(rows.length)} kayıt gösteriliyor`, `showing ${formatNumber(rows.length)} records`)}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {HEADERS.map(([tr, en]) => (
                <th
                  key={tr}
                  scope="col"
                  className="whitespace-nowrap px-2.5 py-2 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted"
                >
                  {t(tr, en)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const meta = PRIORITY_META[row.priority];
              return (
                <tr
                  key={row.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-elevated"
                >
                  <td className="px-2.5 py-2.5">
                    <span className={cn("inline-block whitespace-nowrap rounded-pill px-2 py-0.5 font-body text-[10px] font-semibold", meta.badge)}>
                      {t(meta.labelTr, meta.labelEn)}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <div className="flex flex-col">
                      <span className="whitespace-nowrap font-body text-[12px] font-medium text-fg">{row.name}</span>
                      <span className="font-mono text-[10px] text-fg-muted">{row.id} · {row.phone}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 font-body text-[11.5px] text-fg-secondary">
                    {row.country} · {row.language}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 font-body text-[11.5px] text-fg-secondary">{row.source}</td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 font-mono text-[11px] text-fg-secondary">{formatShortDate(row.createdAtISO)}</td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 font-mono text-[11px] text-fg-secondary">
                    {row.lastCallISO ? formatShortDate(row.lastCallISO) : "—"}
                  </td>
                  <td className="px-2.5 py-2.5 text-center font-mono text-[11.5px] text-fg">{row.attempts}</td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 font-body text-[11.5px] text-fg-secondary">{row.resultCode}</td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 font-body text-[11.5px] text-fg-secondary">{row.status}</td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 font-mono text-[11px] text-fg-secondary">
                    {row.dueISO ? formatShortDate(row.dueISO) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 font-mono text-[11px] text-fg-secondary">
                    {row.callbackISO ? formatShortDate(row.callbackISO) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 font-body text-[11.5px] text-fg-secondary">{row.offer}</td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 font-body text-[11.5px] text-fg-secondary">{row.deal}</td>
                  <td className="px-2.5 py-2.5">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 whitespace-nowrap rounded-control border border-brand/30 bg-brand/8 px-2.5 py-1.5 font-body text-[11px] font-medium text-brand transition-colors hover:bg-brand/16"
                    >
                      <PhoneOutgoing size={11} aria-hidden />
                      {row.nextAction}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="py-10 text-center font-body text-sm text-fg-muted">
            <T tr="Seçili filtrelerde kayıt yok — filtreyi genişletmeyi dene." en="No records match the selected filters — try widening the filter." />
          </p>
        )}
      </div>
    </Card>
  );
}
