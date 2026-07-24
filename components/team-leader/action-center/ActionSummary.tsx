"use client";

import { AlertOctagon, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import type { StatusLevel } from "@/lib/types/agent-data";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { useLang } from "@/components/i18n/LanguageProvider";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

/**
 * Aksiyon özet sayaçları — kaç kritik / riskli / takip uyarısı var.
 * Aksiyon merkezinin en üstünde "önce neye bakmalıyım" hissi verir.
 */

const TONE_CHIP: Record<StatusLevel, string> = {
  success: "bg-success/12 text-success",
  warning: "bg-warning/16 text-warning",
  risk: "bg-risk/14 text-risk",
  critical: "bg-critical/12 text-critical",
  neutral: "bg-neutral/16 text-fg-secondary",
};

function CountCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof AlertOctagon;
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
          {Math.round(animated)}
        </span>
        <span className="mt-1 font-body text-[11.5px] text-fg-secondary">{label}</span>
      </div>
    </Card>
  );
}

export function ActionSummary() {
  const { data } = useTeamDateRange();
  const { t } = useLang();
  const count = (tone: StatusLevel) =>
    data.actionCenter.filter((a) => a.status === tone).length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <CountCard icon={AlertOctagon} label={t("Kritik", "Critical")} value={count("critical")} tone="critical" />
      <CountCard icon={AlertTriangle} label={t("Riskli", "At Risk")} value={count("risk")} tone="risk" />
      <CountCard icon={Clock} label={t("Takip Edilmeli", "Needs Follow-up")} value={count("warning")} tone="warning" />
      <CountCard icon={CheckCircle2} label={t("Toplam Uyarı", "Total Alerts")} value={data.actionCenter.length} tone="neutral" />
    </div>
  );
}
