"use client";

import { Trophy, AlertTriangle } from "lucide-react";
import type { TeamSummary } from "@/lib/types/region-data";
import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { formatCurrencyEUR, formatPercent } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";

function TeamCard({ team, tone }: { team: TeamSummary; tone: "best" | "worst" }) {
  const { t } = useLang();
  return (
    <div className="flex flex-col gap-3 rounded-control border border-border bg-bg p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-display text-[14px] font-semibold text-fg">{team.teamName}</span>
          <span className="font-body text-[11px] text-fg-muted">{t("Lider", "Leader")}: {team.teamLeaderName} · {team.agentCount} {t("danışman", "agents")}</span>
        </div>
        <span className={cn("font-mono text-[20px] font-bold", tone === "best" ? "text-success" : "text-critical")}>
          {team.avgScore.toFixed(1)}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
        <div className="flex flex-col">
          <span className="font-mono text-[13px] font-semibold text-fg">{formatPercent(team.slaCompliantPct, 0)}</span>
          <span className="font-body text-[10px] text-fg-muted">SLA</span>
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-[13px] font-semibold text-fg">{team.deals}</span>
          <span className="font-body text-[10px] text-fg-muted">Deal</span>
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-[13px] font-semibold text-fg">{formatCurrencyEUR(team.paymentsEUR)}</span>
          <span className="font-body text-[10px] text-fg-muted"><T tr="Ciro" en="Revenue" /></span>
        </div>
      </div>
    </div>
  );
}

/** En iyi / en çok destek gereken takım kartları. */
export function BestWorstTeam() {
  const { data } = useRegionDateRange();
  const { t } = useLang();
  if (!data.bestTeam || !data.worstTeam) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
      <Card className="flex flex-col gap-3">
        <SectionTitle
          hint={t(
            "Bölgenin en yüksek takım skoruna sahip takımı — örnek uygulama kaynağı.",
            "The team with the highest team score in the region — a source of best practices.",
          )}
          aside={<Trophy size={16} className="text-success" aria-hidden />}
        >
          <T tr="En İyi Takım" en="Best Team" />
        </SectionTitle>
        <TeamCard team={data.bestTeam} tone="best" />
      </Card>
      <Card className="flex flex-col gap-3">
        <SectionTitle
          hint={t(
            "En çok desteğe ihtiyaç duyan takım — lideriyle öncelik konuşulmalı.",
            "The team needing the most support — priorities should be discussed with its leader.",
          )}
          aside={<AlertTriangle size={16} className="text-critical" aria-hidden />}
        >
          <T tr="Destek Gereken Takım" en="Team Needing Support" />
        </SectionTitle>
        <TeamCard team={data.worstTeam} tone="worst" />
      </Card>
    </div>
  );
}
