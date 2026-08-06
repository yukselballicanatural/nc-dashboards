"use client";

import { useMemo, useState } from "react";
import { ChevronDown, LogIn, LogOut } from "lucide-react";
import {
  dayTypeLabel,
  formatDuration,
  gateLabel,
  type PdksDay,
  type PdksDayType,
  type PdksSummary,
} from "@/lib/mock/pdks";
import { formatNumber } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * GÜNLÜK PDKS DÖKÜMÜ — 30 gün, satır tıklanınca o günün turnike hareketleri
 * açılır (agent kendi kaydını doğrulayabilsin / itiraz edebilsin).
 *
 * Filtre: tümü / yalnızca eksik kalınan günler / yalnızca mesai dışı günler.
 */

const DAY_TYPE_CHIP: Record<PdksDayType, string> = {
  workday: "bg-neutral/12 text-fg-secondary",
  weekend: "bg-indigo/10 text-indigo",
  holiday: "bg-violet/12 text-violet",
  leave: "bg-brand/12 text-brand",
  absent: "bg-critical/14 text-critical",
};

type FilterKey = "all" | "deficit" | "off";

export function PdksDayTable({ summary }: { summary: PdksSummary }) {
  const { t, lang } = useLang();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [openDay, setOpenDay] = useState<number | null>(null);

  const FILTERS: Array<{ key: FilterKey; label: string; count: number }> = [
    { key: "all", label: t("Tümü", "All"), count: summary.days.length },
    {
      key: "deficit",
      label: t("Eksik kalınan", "Short days"),
      count: summary.deficitDayCount,
    },
    {
      key: "off",
      label: t("Mesai dışı", "Non-working"),
      count: summary.days.filter((d) => d.targetMinutes === 0).length,
    },
  ];

  const rows = useMemo(() => {
    const ordered = [...summary.days].reverse(); // en yeni en üstte
    if (filter === "deficit") {
      return ordered.filter((d) => d.targetMinutes > 0 && d.balanceMinutes < 0);
    }
    if (filter === "off") return ordered.filter((d) => d.targetMinutes === 0);
    return ordered;
  }, [summary.days, filter]);

  const HEADERS: Array<[string, string]> = [
    ["Tarih", "Date"],
    ["Durum", "Type"],
    ["İlk Giriş", "First In"],
    ["Son Çıkış", "Last Out"],
    ["Dışarıda", "Outside"],
    ["Turnike İçi", "Inside"],
    ["Hedef", "Target"],
    ["Bakiye", "Balance"],
  ];

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle
        hint={t(
          "Bir güne tıklayınca o günün turnike giriş/çıkış hareketleri açılır. Turnike içi süre, ilk giriş ile son çıkış arasından dışarıda geçen süreler düşülerek bulunur.",
          "Click a day to expand its turnstile entries and exits. Inside time is the span between first entry and last exit, minus any time spent outside.",
        )}
        aside={
          <div className="flex shrink-0 flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={cn(
                  "rounded-pill px-2.5 py-1 font-body text-[10.5px] font-semibold transition-colors",
                  filter === f.key
                    ? "bg-brand/14 text-brand"
                    : "bg-elevated text-fg-secondary hover:text-fg",
                )}
              >
                {f.label} ({formatNumber(f.count)})
              </button>
            ))}
          </div>
        }
      >
        <T tr="Günlük Mesai Dökümü" en="Daily Attendance Breakdown" />
      </SectionTitle>

      {rows.length === 0 ? (
        <p className="py-8 text-center font-body text-[12.5px] text-fg-secondary">
          <T
            tr="Bu filtreye uyan gün yok — hedefin altında kaldığın bir gün olmamış."
            en="No days match this filter — you have not fallen short on any day."
          />
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                {HEADERS.map(([tr, en], i) => (
                  <th
                    key={tr}
                    scope="col"
                    className={cn(
                      "px-2.5 py-2 font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted",
                      i <= 1 ? "text-left" : "text-right",
                    )}
                  >
                    {t(tr, en)}
                  </th>
                ))}
                <th scope="col" className="w-8 px-1 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((day) => {
                const expanded = openDay === day.ts;
                const hasTarget = day.targetMinutes > 0;
                const isDeficit = hasTarget && day.balanceMinutes < 0;
                const canExpand = day.events.length > 0;

                return (
                  <PdksRow
                    key={day.ts}
                    day={day}
                    expanded={expanded}
                    canExpand={canExpand}
                    isDeficit={isDeficit}
                    hasTarget={hasTarget}
                    onToggle={() => setOpenDay(expanded ? null : day.ts)}
                    lang={lang}
                    t={t}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function PdksRow({
  day,
  expanded,
  canExpand,
  isDeficit,
  hasTarget,
  onToggle,
  lang,
  t,
}: {
  day: PdksDay;
  expanded: boolean;
  canExpand: boolean;
  isDeficit: boolean;
  hasTarget: boolean;
  onToggle: () => void;
  lang: "tr" | "en";
  t: (tr: string, en: string) => string;
}) {
  return (
    <>
      <tr
        className={cn(
          "border-b border-border transition-colors last:border-0",
          canExpand && "cursor-pointer hover:bg-elevated",
          day.isToday && "bg-elevated/60",
          expanded && "bg-elevated",
        )}
        onClick={canExpand ? onToggle : undefined}
        aria-expanded={canExpand ? expanded : undefined}
      >
        <td className="px-2.5 py-2.5 text-left font-mono text-[11.5px] text-fg">
          {day.dateLabel}
          <span className="ml-1 text-fg-muted">{day.weekdayLabel}</span>
          {day.isToday && (
            <span className="ml-1.5 rounded-pill bg-brand/15 px-1.5 py-0.5 font-body text-[9.5px] font-semibold uppercase text-brand">
              {t("bugün", "today")}
            </span>
          )}
        </td>
        <td className="px-2.5 py-2.5 text-left">
          <span
            className={cn(
              "rounded-pill px-2 py-0.5 font-body text-[10px] font-semibold",
              DAY_TYPE_CHIP[day.type],
            )}
          >
            {dayTypeLabel(day.type, lang)}
          </span>
        </td>
        <td
          className={cn(
            "px-2.5 py-2.5 text-right font-mono text-[11.5px]",
            day.lateMinutes > 5 ? "font-bold text-critical" : "text-fg",
          )}
        >
          {day.firstIn ?? "—"}
          {day.lateMinutes > 0 && (
            <span className="ml-1 font-body text-[9.5px] text-critical">
              +{formatNumber(day.lateMinutes)}
            </span>
          )}
        </td>
        <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">
          {day.lastOut ?? "—"}
        </td>
        <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">
          {day.outsideMinutes > 0 ? formatDuration(day.outsideMinutes, lang) : "—"}
        </td>
        <td
          className={cn(
            "px-2.5 py-2.5 text-right font-mono text-[12px] font-semibold",
            day.events.length === 0 ? "text-fg-muted" : "text-fg",
          )}
        >
          {day.events.length > 0 ? formatDuration(day.insideMinutes, lang) : "—"}
        </td>
        <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-muted">
          {hasTarget ? formatDuration(day.targetMinutes, lang) : "—"}
        </td>
        <td
          className={cn(
            "px-2.5 py-2.5 text-right font-mono text-[12px] font-semibold",
            !hasTarget
              ? day.insideMinutes > 0
                ? "text-brand-secondary"
                : "text-fg-muted"
              : isDeficit
                ? "text-critical"
                : "text-success",
          )}
        >
          {!hasTarget
            ? day.insideMinutes > 0
              ? `+${formatDuration(day.insideMinutes, lang)}`
              : "—"
            : `${isDeficit ? "−" : "+"}${formatDuration(day.balanceMinutes, lang)}`}
        </td>
        <td className="px-1 py-2.5 text-center">
          {canExpand && (
            <ChevronDown
              size={13}
              aria-hidden
              className={cn(
                "inline text-fg-muted transition-transform duration-150",
                expanded && "rotate-180",
              )}
            />
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-border bg-elevated/50">
          <td colSpan={9} className="px-2.5 pb-3 pt-1">
            <span className="mb-2 block font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
              <T tr="Turnike hareketleri" en="Turnstile activity" />
            </span>
            <ul className="flex flex-wrap gap-1.5">
              {day.events.map((event, index) => (
                <li
                  key={`${event.time}-${event.direction}-${index}`}
                  className="flex items-center gap-1.5 rounded-pill border border-border bg-surface px-2.5 py-1"
                >
                  {event.direction === "in" ? (
                    <LogIn size={11} aria-hidden className="text-brand" />
                  ) : (
                    <LogOut size={11} aria-hidden className="text-brand-secondary" />
                  )}
                  <span className="font-mono text-[11px] font-semibold text-fg">{event.time}</span>
                  <span className="font-body text-[10.5px] text-fg-muted">
                    {gateLabel(event.gate, lang)}
                  </span>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  );
}
