"use client";

import { PhoneMissed, Timer, FileText, CalendarClock, type LucideIcon } from "lucide-react";
import type { StatusLevel } from "@/lib/types/agent-data";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { useLang } from "@/components/i18n/LanguageProvider";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

/**
 * Backlog toplam özet kartları — takım genelinde her birikim türünün toplamı.
 * Aşağıdaki agent bazlı tablonun üstünde "toplam tablo" niteliğinde.
 */

const TONE_CHIP: Record<StatusLevel, string> = {
  success: "bg-success/12 text-success",
  warning: "bg-warning/16 text-warning",
  risk: "bg-risk/14 text-risk",
  critical: "bg-critical/12 text-critical",
  neutral: "bg-neutral/16 text-fg-secondary",
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: StatusLevel;
}) {
  const animated = useCountUp(value);
  return (
    <Card className="flex items-center gap-3.5">
      <span
        aria-hidden
        className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-control", TONE_CHIP[tone])}
      >
        <Icon size={19} strokeWidth={2} />
      </span>
      <div className="flex flex-col">
        <span className="font-mono text-[24px] font-semibold leading-none text-fg">
          {formatNumber(Math.round(animated))}
        </span>
        <span className="mt-1 font-body text-[11.5px] text-fg-secondary">{label}</span>
      </div>
    </Card>
  );
}

export function BacklogSummary() {
  const { data } = useTeamDateRange();
  const { t } = useLang();
  const b = data.backlogTotals;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <SummaryCard icon={PhoneMissed} label={t("Henüz Aranmayan Lead", "Uncalled Leads")} value={b.neverCalled} tone={b.neverCalled > 0 ? "critical" : "success"} />
      <SummaryCard icon={Timer} label={t("15 dk SLA İhlali", "15-min SLA Breach")} value={b.slaViolations} tone={b.slaViolations > 0 ? "risk" : "success"} />
      <SummaryCard icon={FileText} label={t("Bekleyen Offer", "Pending Offers")} value={b.pendingOffers} tone={b.pendingOffers > 0 ? "warning" : "success"} />
      <SummaryCard icon={CalendarClock} label={t("Gecikmiş Takip", "Overdue Follow-up")} value={b.overdueFollowUps} tone={b.overdueFollowUps > 0 ? "warning" : "success"} />
    </div>
  );
}
