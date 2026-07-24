"use client";

import { motion } from "framer-motion";
import type { StatusLevel } from "@/lib/types/agent-data";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { DURATION, EASING, STAGGER } from "@/lib/motion";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusDot } from "@/components/ui/StatusDot";
import { HoverTip } from "@/components/ui/HoverTip";

const STATUS_BAR: Record<StatusLevel, string> = {
  success: "bg-success",
  warning: "bg-warning",
  risk: "bg-risk",
  critical: "bg-critical",
  neutral: "bg-neutral",
};

/**
 * Takımın nabzı — tüm agent'lar Genel Başarı puanına göre sıralı yatay
 * çubuklar. Agent Karşılaştırması sekmesine (Best5/Worst5 + detay tablo)
 * bir önizleme niteliğinde.
 */
export function TeamScoreBarList() {
  const reduced = usePrefersReducedMotion();
  const { data } = useTeamDateRange();
  const { t } = useLang();
  const agents = data.agents;

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle hint={t("Tüm takımın Genel Başarı puanına göre sıralaması — SLA, ulaşım, dönüşüm ve hedef gerçekleşmenin bileşik ölçüsü.", "The whole team ranked by Overall Score — a composite of SLA, reach, conversion and target achievement.")}>
        <T tr="Takımın Nabzı" en="Team Pulse" />
      </SectionTitle>
      <ul className="flex flex-col gap-2">
        {agents.map((agent, index) => (
          <li
            key={agent.agentId}
            className="group flex items-center gap-3 rounded-[8px] px-1 py-0.5 transition-colors hover:bg-elevated"
          >
            <StatusDot status={agent.scoreStatus} />
            <span className="w-36 shrink-0 truncate font-body text-[11.5px] text-fg-secondary transition-colors group-hover:text-fg">
              {agent.name}
            </span>
            <div className="relative h-5 flex-1">
              <motion.div
                className={`flex h-full items-center rounded-[6px] ${STATUS_BAR[agent.scoreStatus]} pl-2 transition-[filter] duration-150 group-hover:brightness-110`}
                initial={{ width: reduced ? `${agent.score}%` : "0%" }}
                animate={{ width: `${agent.score}%` }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : {
                        duration: DURATION.chart,
                        ease: EASING.out,
                        delay: index * STAGGER.children,
                      }
                }
                style={{ minWidth: "2rem" }}
              >
                <span className="font-mono text-[10.5px] font-semibold text-white">
                  {agent.score.toFixed(1)}
                </span>
              </motion.div>
              <HoverTip align="right">
                <p className="mb-0.5 font-display text-[12px] font-semibold text-fg">
                  {agent.name}
                </p>
                <p className="font-mono text-[11px] text-fg-muted">
                  SLA %{Math.round(agent.slaCompliantPct)} · {t("Ulaşım", "Reach")} %{Math.round(agent.answerRatePct)} ·{" "}
                  {agent.deals} deal
                </p>
              </HoverTip>
            </div>
            <span className="w-8 shrink-0 text-right font-mono text-[11px] text-fg-muted">
              #{index + 1}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
