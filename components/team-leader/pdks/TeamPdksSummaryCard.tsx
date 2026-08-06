"use client";

import { CalendarClock, TrendingDown, TrendingUp } from "lucide-react";
import { DAILY_TARGET_MINUTES, formatDuration } from "@/lib/mock/pdks";
import type { TeamPdksOverview } from "@/lib/mock/team-pdks";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * TAKIMIN MESAİ BAKİYESİ — Takım PDKS sayfasının manşeti.
 *
 * Agent panelindeki PdksBalanceCard ile aynı kural ve aynı görsel dil, ama
 * manşet takımın TOPLAM iş günü bakiyesidir. Hafta sonu/tatil çalışması yine
 * ayrı kalemdir (bkz. lib/mock/pdks.ts başlığı).
 */

function MiniStat({
  label,
  value,
  tone = "default",
}: {
  label: React.ReactNode;
  value: string;
  tone?: "default" | "critical" | "success";
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-control border border-border bg-elevated px-3 py-2">
      <span className="font-body text-[10.5px] leading-snug text-fg-muted">{label}</span>
      <span
        className={cn(
          "font-mono text-[13.5px] font-semibold",
          tone === "critical" ? "text-critical" : tone === "success" ? "text-success" : "text-fg",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function TeamPdksSummaryCard({ overview }: { overview: TeamPdksOverview }) {
  const { t, lang } = useLang();
  const {
    teamName,
    teamSize,
    totalWorkdayBalanceMinutes,
    totalDeficitMinutes,
    agentsInDeficit,
    compliancePct,
    totalExtraShiftMinutes,
    totalAbsentDays,
    avgInsideMinutes,
    totalDeficitDays,
    totalWorkdayCount,
    worstAgents,
    bestAgents,
  } = overview;

  const isDeficit = totalWorkdayBalanceMinutes < 0;
  const signed = (n: number) => (n < 0 ? "−" : "+") + formatDuration(n, lang);
  const best = bestAgents[0];
  const worst = worstAgents[0];

  return (
    <Card className="flex flex-col gap-5">
      <SectionTitle
        hint={t(
          `Her danışmanın her iş günü turnike içinde ${formatDuration(DAILY_TARGET_MINUTES, "tr")} kalması bekleniyor. Manşet, ${teamName} takımının tüm danışmanlarının iş günü bakiyelerinin toplamıdır.`,
          `Every agent is expected to stay inside the turnstile for ${formatDuration(DAILY_TARGET_MINUTES, "en")} on each workday. The headline is the sum of all ${teamName} agents' workday balances.`,
        )}
        aside={
          <span className="shrink-0 rounded-pill bg-neutral/12 px-2.5 py-1 font-mono text-[11px] font-semibold text-fg-secondary">
            {formatNumber(teamSize)} {t("danışman", "agents")}
          </span>
        }
      >
        <T tr="Takımın Mesai Bakiyesi (30 Gün)" en="Team's Work-Hours Balance (30 Days)" />
      </SectionTitle>

      <div
        className={cn(
          "flex flex-wrap items-center gap-4 rounded-card border px-5 py-4",
          isDeficit ? "border-critical/35 bg-critical/8" : "border-success/35 bg-success/8",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-control",
            isDeficit ? "bg-critical/14 text-critical" : "bg-success/14 text-success",
          )}
        >
          {isDeficit ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span
            className={cn(
              "font-mono text-[30px] font-bold leading-none",
              isDeficit ? "text-critical" : "text-success",
            )}
          >
            {signed(totalWorkdayBalanceMinutes)}
          </span>
          <span className="font-body text-[12px] text-fg-secondary">
            {isDeficit ? (
              <T
                tr={`Takım toplamda ${formatDuration(Math.abs(totalWorkdayBalanceMinutes), "tr")} hedefin altında.`}
                en={`The team is ${formatDuration(Math.abs(totalWorkdayBalanceMinutes), "en")} below target in total.`}
              />
            ) : (
              <T
                tr={`Takım toplamda hedefin ${formatDuration(totalWorkdayBalanceMinutes, "tr")} üzerinde.`}
                en={`The team is ${formatDuration(totalWorkdayBalanceMinutes, "en")} above target in total.`}
              />
            )}
          </span>
        </span>
        {agentsInDeficit > 0 && (
          <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-pill bg-critical/12 px-2.5 py-1">
            <CalendarClock size={12} aria-hidden className="text-critical" />
            <span className="font-mono text-[11px] font-semibold text-critical">
              {formatNumber(agentsInDeficit)}/{formatNumber(teamSize)}{" "}
              {t("danışman eksikte", "agents short")}
            </span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        <MiniStat
          label={<T tr="Hedefin altında gün" en="Days below target" />}
          value={`${formatNumber(totalDeficitDays)}/${formatNumber(totalWorkdayCount)}`}
          tone={totalDeficitDays > 0 ? "critical" : "success"}
        />
        <MiniStat
          label={<T tr="Toplam eksik mesai" en="Total shortfall" />}
          value={totalDeficitMinutes < 0 ? `−${formatDuration(totalDeficitMinutes, lang)}` : "—"}
          tone={totalDeficitMinutes < 0 ? "critical" : "success"}
        />
        <MiniStat
          label={<T tr="Hedef tutma oranı" en="Compliance rate" />}
          value={formatPercent(compliancePct)}
          tone={compliancePct >= 85 ? "success" : "critical"}
        />
        <MiniStat
          label={<T tr="Günlük ort. turnike içi" en="Avg. daily inside" />}
          value={formatDuration(avgInsideMinutes, lang)}
          tone={avgInsideMinutes < DAILY_TARGET_MINUTES ? "critical" : "success"}
        />
        <MiniStat
          label={<T tr="Hafta sonu / tatil" en="Weekend / holiday" />}
          value={totalExtraShiftMinutes > 0 ? `+${formatDuration(totalExtraShiftMinutes, lang)}` : "—"}
          tone={totalExtraShiftMinutes > 0 ? "success" : "default"}
        />
      </div>

      {/* En iyi / en kötü uçlar — TL'nin ilk bakışta göreceği iki isim */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {worst && (
          <div className="flex items-center gap-3 rounded-control border border-critical/30 bg-critical/6 px-3.5 py-2.5">
            <TrendingDown size={15} aria-hidden className="shrink-0 text-critical" />
            <span className="flex min-w-0 flex-col">
              <span className="font-body text-[10.5px] uppercase tracking-wide text-fg-muted">
                <T tr="En çok eksiği olan" en="Largest shortfall" />
              </span>
              <span className="truncate font-body text-[12.5px] font-semibold text-fg">
                {worst.name}{" "}
                <span className="font-mono text-critical">
                  {signed(worst.summary.workdayBalanceMinutes)}
                </span>
              </span>
            </span>
          </div>
        )}
        {best && (
          <div className="flex items-center gap-3 rounded-control border border-success/30 bg-success/6 px-3.5 py-2.5">
            <TrendingUp size={15} aria-hidden className="shrink-0 text-success" />
            <span className="flex min-w-0 flex-col">
              <span className="font-body text-[10.5px] uppercase tracking-wide text-fg-muted">
                <T tr="Hedefi en iyi tutan" en="Best on target" />
              </span>
              <span className="truncate font-body text-[12.5px] font-semibold text-fg">
                {best.name}{" "}
                <span className="font-mono text-success">
                  {signed(best.summary.workdayBalanceMinutes)}
                </span>
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Manşet ile günlük uyumun çelişkili GÖRÜNDÜĞÜ durumu açıkla: aylık
          toplam artıda olsa bile günlük disiplin bozuk olabilir. */}
      {!isDeficit && compliancePct < 90 && (
        <p className="font-body text-[11px] leading-snug text-fg-secondary">
          <T
            tr={`Aylık toplam artıda ama günlük tablo farklı: ${formatNumber(totalWorkdayCount)} iş gününün ${formatNumber(totalDeficitDays)}'inde hedefin altında kalınmış. Eksik günler, fazla kalınan günlerle telafi ediliyor — yani sorun toplam sürede değil, gün içi disiplinde.`}
            en={`The monthly total is positive but the daily picture differs: the target was missed on ${formatNumber(totalDeficitDays)} of ${formatNumber(totalWorkdayCount)} workdays. Shortfalls are offset by longer days — so the issue is daily discipline, not total hours.`}
          />
        </p>
      )}

      {totalAbsentDays > 0 && (
        <p className="font-body text-[11px] text-fg-secondary">
          <T
            tr={`Bu dönemde takımda toplam ${formatNumber(totalAbsentDays)} mazeretsiz devamsız gün var — devamsız günler hedefi olan gün sayılır ve bakiyeye tam eksik olarak yazılır.`}
            en={`The team had ${formatNumber(totalAbsentDays)} unexcused absent day(s) this period — absent days still carry a target and are booked as a full shortfall.`}
          />
        </p>
      )}
    </Card>
  );
}
