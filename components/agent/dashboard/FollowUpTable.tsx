"use client";

import { useMemo, useState } from "react";
import { PhoneOutgoing, Search } from "lucide-react";
import { useDateRange } from "@/components/agent/filters/DateRangeContext";
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

const PRIORITY_META: Record<LeadPriority, { label: string; badge: string }> = {
  "cok-kritik": { label: "Çok Kritik", badge: "bg-critical/12 text-critical" },
  kritik: { label: "Kritik", badge: "bg-risk/14 text-risk" },
  yuksek: { label: "Yüksek", badge: "bg-warning/16 text-warning" },
  orta: { label: "Orta", badge: "bg-indigo/12 text-indigo" },
  normal: { label: "Normal", badge: "bg-neutral/16 text-fg-secondary" },
};

const FILTER_OPTIONS: Array<{ key: LeadPriority | "all"; label: string }> = [
  { key: "all", label: "Tümü" },
  { key: "cok-kritik", label: "Çok Kritik" },
  { key: "kritik", label: "Kritik" },
  { key: "yuksek", label: "Yüksek" },
  { key: "orta", label: "Orta" },
  { key: "normal", label: "Normal" },
];

const HEADERS = [
  "Öncelik", "Lead", "Ülke/Dil", "Kaynak", "Oluşturulma", "Son Arama",
  "Deneme", "Sonuç", "Status", "Due", "Callback", "Offer", "Deal", "Yapılacak İşlem",
];

export function FollowUpTable() {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<LeadPriority | "all">("all");
  const { data } = useDateRange();

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
        <SectionTitle hint="Aksiyon bekleyen tüm lead'lerin — en acil en üstte. 'Yapılacak İşlem' sana bir sonraki adımı söyler.">
          Follow-up Listesi
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
                {option.label}
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
              placeholder="İsim, ID veya telefon..."
              aria-label="Lead ara"
              className="h-8 w-full rounded-control border border-border bg-bg pl-8 pr-3 font-body text-[12px] text-fg placeholder:text-fg-muted sm:w-52"
            />
          </div>
        </div>
      </div>

      <p className="font-mono text-[11px] text-fg-muted">
        {formatNumber(rows.length)} kayıt gösteriliyor
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {HEADERS.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="whitespace-nowrap px-2.5 py-2 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted"
                >
                  {header}
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
                      {meta.label}
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
            Seçili filtrelerde kayıt yok — filtreyi genişletmeyi dene.
          </p>
        )}
      </div>
    </Card>
  );
}
