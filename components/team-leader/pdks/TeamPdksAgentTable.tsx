"use client";

import { useMemo, useState } from "react";
import { ChevronDown, LogIn, LogOut } from "lucide-react";
import {
  DAILY_TARGET_MINUTES,
  dayTypeLabel,
  formatDuration,
  gateLabel,
} from "@/lib/mock/pdks";
import type { TeamPdksOverview, TeamPdksRow } from "@/lib/mock/team-pdks";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * AGENT BAZINDA MESAİ DÖKÜMÜ — Takım PDKS sayfasının ana tablosu.
 *
 * Satır tıklanınca o danışmanın EN ÇOK EKSİK KALDIĞI günler turnike
 * hareketleriyle açılır — TL "neden eksik" sorusuna tek tıkla cevap bulur
 * (geç giriş mi, uzun dışarı çıkış mı, erken çıkış mı).
 *
 * Sıralama motorda yapılır (en çok eksiği olan üstte, bkz. team-pdks.ts);
 * filtre yalnızca görünürlüğü daraltır.
 */

type FilterKey = "all" | "deficit" | "absent";

export function TeamPdksAgentTable({ overview }: { overview: TeamPdksOverview }) {
  const { t, lang } = useLang();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [openAgent, setOpenAgent] = useState<string | null>(null);

  const FILTERS: Array<{ key: FilterKey; label: string; count: number }> = [
    { key: "all", label: t("Tümü", "All"), count: overview.rows.length },
    {
      key: "deficit",
      label: t("Eksikte olanlar", "In deficit"),
      count: overview.agentsInDeficit,
    },
    {
      key: "absent",
      label: t("Devamsızlığı olanlar", "With absences"),
      count: overview.rows.filter((r) => r.summary.absentDayCount > 0).length,
    },
  ];

  const rows = useMemo(() => {
    if (filter === "deficit") {
      return overview.rows.filter((r) => r.summary.workdayBalanceMinutes < 0);
    }
    if (filter === "absent") {
      return overview.rows.filter((r) => r.summary.absentDayCount > 0);
    }
    return overview.rows;
  }, [overview.rows, filter]);

  const HEADERS: Array<[string, string]> = [
    ["Danışman", "Agent"],
    ["Rol", "Role"],
    ["Turnike İçi", "Inside"],
    ["Hedef", "Target"],
    ["Bakiye", "Balance"],
    ["Eksik Gün", "Short Days"],
    ["Uyum", "Compliance"],
    ["Geç Giriş", "Lateness"],
    ["Devamsız", "Absent"],
  ];

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle
        hint={t(
          `Her danışmanın 30 günlük turnike-içi süresi ve günlük ${formatDuration(DAILY_TARGET_MINUTES, "tr")} hedefine göre bakiyesi. Bir satıra tıklayınca o kişinin en çok eksik kaldığı günler turnike hareketleriyle açılır.`,
          `Each agent's inside-turnstile time over 30 days and their balance against the ${formatDuration(DAILY_TARGET_MINUTES, "en")} daily target. Click a row to expand that agent's worst days with their turnstile activity.`,
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
        <T tr="Danışman Bazında Mesai" en="Attendance by Agent" />
      </SectionTitle>

      {rows.length === 0 ? (
        <p className="py-8 text-center font-body text-[12.5px] text-fg-secondary">
          <T
            tr="Bu filtreye uyan danışman yok."
            en="No agents match this filter."
          />
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
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
              {rows.map((row) => (
                <AgentPdksRow
                  key={row.agentId}
                  row={row}
                  expanded={openAgent === row.agentId}
                  onToggle={() =>
                    setOpenAgent(openAgent === row.agentId ? null : row.agentId)
                  }
                  lang={lang}
                  t={t}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function AgentPdksRow({
  row,
  expanded,
  onToggle,
  lang,
  t,
}: {
  row: TeamPdksRow;
  expanded: boolean;
  onToggle: () => void;
  lang: "tr" | "en";
  t: (tr: string, en: string) => string;
}) {
  const s = row.summary;
  const isDeficit = s.workdayBalanceMinutes < 0;
  const signed = (n: number) => (n < 0 ? "−" : "+") + formatDuration(n, lang);

  return (
    <>
      <tr
        className={cn(
          "cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-elevated",
          row.isSelf && "bg-brand/[0.04]",
          expanded && "bg-elevated",
        )}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <td className="px-2.5 py-2.5 text-left font-body text-[12px] text-fg">
          {row.name}
          {row.isSelf && (
            <span className="ml-1.5 rounded-pill bg-brand/15 px-1.5 py-0.5 font-body text-[9.5px] font-semibold uppercase text-brand">
              {t("panel sahibi", "panel owner")}
            </span>
          )}
        </td>
        <td className="px-2.5 py-2.5 text-left">
          <span className="rounded-pill bg-neutral/12 px-2 py-0.5 font-body text-[10px] font-semibold text-fg-secondary">
            {row.role}
          </span>
        </td>
        <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">
          {formatDuration(s.totalInsideWorkdayMinutes, lang)}
        </td>
        <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-muted">
          {formatDuration(s.totalTargetMinutes, lang)}
        </td>
        <td
          className={cn(
            "px-2.5 py-2.5 text-right font-mono text-[12px] font-bold",
            isDeficit ? "text-critical" : "text-success",
          )}
        >
          {signed(s.workdayBalanceMinutes)}
        </td>
        <td
          className={cn(
            "px-2.5 py-2.5 text-right font-mono text-[11.5px]",
            s.deficitDayCount > 0 ? "text-critical" : "text-fg-secondary",
          )}
        >
          {formatNumber(s.deficitDayCount)}/{formatNumber(s.workdayCount)}
        </td>
        <td
          className={cn(
            "px-2.5 py-2.5 text-right font-mono text-[11.5px] font-semibold",
            s.compliancePct >= 85 ? "text-success" : s.compliancePct >= 70 ? "text-warning" : "text-critical",
          )}
        >
          {formatPercent(s.compliancePct)}
        </td>
        <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg-secondary">
          {s.totalLateMinutes > 0 ? `${formatNumber(s.totalLateMinutes)} ${t("dk", "min")}` : "—"}
        </td>
        <td
          className={cn(
            "px-2.5 py-2.5 text-right font-mono text-[11.5px]",
            s.absentDayCount > 0 ? "font-bold text-critical" : "text-fg-muted",
          )}
        >
          {s.absentDayCount > 0 ? formatNumber(s.absentDayCount) : "—"}
        </td>
        <td className="px-1 py-2.5 text-center">
          <ChevronDown
            size={13}
            aria-hidden
            className={cn(
              "inline text-fg-muted transition-transform duration-150",
              expanded && "rotate-180",
            )}
          />
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-border bg-elevated/50">
          <td colSpan={10} className="px-2.5 pb-3 pt-1">
            <span className="mb-2 block font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
              <T tr="En çok eksik kalınan günler" en="Days with the largest shortfall" />
            </span>
            {s.worstDays.length === 0 ? (
              <p className="font-body text-[11.5px] text-fg-secondary">
                <T
                  tr="Bu danışman 30 gün boyunca hiçbir iş gününde hedefin altında kalmamış."
                  en="This agent did not fall below target on any workday in the last 30 days."
                />
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {s.worstDays.map((day) => (
                  <li
                    key={day.ts}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-control border border-border bg-surface px-3 py-2"
                  >
                    <span className="font-mono text-[11.5px] font-semibold text-fg">
                      {day.dateLabel}{" "}
                      <span className="text-fg-muted">{day.weekdayLabel}</span>
                    </span>
                    <span className="rounded-pill bg-neutral/12 px-2 py-0.5 font-body text-[10px] font-semibold text-fg-secondary">
                      {dayTypeLabel(day.type, lang)}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-critical">
                      −{formatDuration(day.balanceMinutes, lang)}
                    </span>
                    <span className="font-body text-[10.5px] text-fg-secondary">
                      <T tr="turnike içi" en="inside" />{" "}
                      <span className="font-mono text-fg">
                        {formatDuration(day.insideMinutes, lang)}
                      </span>
                      {day.outsideMinutes > 0 && (
                        <>
                          {" · "}
                          <T tr="dışarıda" en="outside" />{" "}
                          <span className="font-mono text-warning">
                            {formatDuration(day.outsideMinutes, lang)}
                          </span>
                        </>
                      )}
                      {day.lateMinutes > 0 && (
                        <>
                          {" · "}
                          <T tr="geç giriş" en="late" />{" "}
                          <span className="font-mono text-critical">
                            {formatNumber(day.lateMinutes)} {t("dk", "min")}
                          </span>
                        </>
                      )}
                    </span>
                    {day.events.length > 0 && (
                      <span className="flex flex-wrap items-center gap-1.5">
                        {day.events.map((event, index) => (
                          <span
                            key={`${event.time}-${event.direction}-${index}`}
                            className="flex items-center gap-1 rounded-pill border border-border px-2 py-0.5"
                          >
                            {event.direction === "in" ? (
                              <LogIn size={10} aria-hidden className="text-brand" />
                            ) : (
                              <LogOut size={10} aria-hidden className="text-brand-secondary" />
                            )}
                            <span className="font-mono text-[10.5px] font-semibold text-fg">
                              {event.time}
                            </span>
                            <span className="font-body text-[10px] text-fg-muted">
                              {gateLabel(event.gate, lang)}
                            </span>
                          </span>
                        ))}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
