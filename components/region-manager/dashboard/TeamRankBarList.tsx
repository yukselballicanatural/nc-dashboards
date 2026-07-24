"use client";

import { motion } from "framer-motion";
import type { StatusLevel } from "@/lib/types/agent-data";
import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { DURATION, EASING, STAGGER } from "@/lib/motion";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusDot } from "@/components/ui/StatusDot";
import { HoverTip } from "@/components/ui/HoverTip";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";

const BAR: Record<StatusLevel, string> = {
  success: "bg-success",
  warning: "bg-warning",
  risk: "bg-risk",
  critical: "bg-critical",
  neutral: "bg-neutral",
};

/**
 * Takım sıralaması — bölgedeki takımlar ortalama skora göre. Bölge Müdürünün
 * ilk baktığı şey: hangi takım önde, hangisi geride.
 */
export function TeamRankBarList() {
  const reduced = usePrefersReducedMotion();
  const { data } = useRegionDateRange();
  const { t } = useLang();

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={t(
          "Takımların Genel Başarı puanına göre sıralaması (üye danışman skorlarının ortalaması). Üstüne gelince takım detayı.",
          "Teams ranked by Overall Score (the average of member agents' scores). Hover for team details.",
        )}
      >
        <T tr="Takım Sıralaması" en="Team Ranking" />
      </SectionTitle>
      <ul className="flex flex-1 flex-col justify-center gap-3">
        {data.teams.map((team, index) => (
          <li key={team.teamId} className="group flex items-center gap-3 rounded-[8px] px-1 py-0.5 transition-colors hover:bg-elevated">
            <StatusDot status={team.scoreStatus} />
            <div className="w-44 shrink-0">
              <p className="truncate font-body text-[12px] font-medium text-fg">{team.teamName}</p>
              <p className="truncate font-body text-[10px] text-fg-muted">{team.teamLeaderName} · {team.agentCount} {t("danışman", "agents")}</p>
            </div>
            <div className="relative h-6 flex-1">
              <motion.div
                className={`flex h-full items-center rounded-[6px] ${BAR[team.scoreStatus]} pl-2 transition-[filter] duration-150 group-hover:brightness-110`}
                initial={{ width: reduced ? `${team.avgScore}%` : "0%" }}
                animate={{ width: `${team.avgScore}%` }}
                transition={reduced ? { duration: 0 } : { duration: DURATION.chart, ease: EASING.out, delay: index * STAGGER.children }}
                style={{ minWidth: "2.5rem" }}
              >
                <span className="font-mono text-[11px] font-semibold text-white">{team.avgScore.toFixed(1)}</span>
              </motion.div>
              <HoverTip align="right">
                <p className="mb-0.5 font-display text-[12px] font-semibold text-fg">{team.teamName}</p>
                <p className="font-mono text-[11px] text-fg-muted">
                  SLA %{Math.round(team.slaCompliantPct)} · {team.deals} deal · {team.leadToDealPct.toFixed(0)}% {t("dönüşüm", "conversion")}
                </p>
              </HoverTip>
            </div>
            <span className="w-8 shrink-0 text-right font-mono text-[11px] text-fg-muted">#{index + 1}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
