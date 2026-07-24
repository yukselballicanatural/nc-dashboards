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

const BAR: Record<StatusLevel, string> = {
  success: "bg-success",
  warning: "bg-warning",
  risk: "bg-risk",
  critical: "bg-critical",
  neutral: "bg-neutral",
};

/**
 * Performans dağılımı — Genel Başarı puanına göre kaç agent hangi bantta.
 * Takımın "sağlık dağılımını" tek bakışta gösterir; çubuğa gelince o
 * banttaki agent'lar listelenir.
 */
export function TierDistributionChart() {
  const reduced = usePrefersReducedMotion();
  const { data } = useTeamDateRange();
  const { t } = useLang();
  const total = data.agents.length || 1;

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle hint={t("Takımdaki agent'ların Genel Başarı puanına göre dağılımı — ideali kütlenin yeşile/sarıya toplanması.", "Distribution of the team's agents by Overall Score — ideally the mass gathers in green/yellow.")}>
        <T tr="Performans Dağılımı" en="Performance Distribution" />
      </SectionTitle>
      <ul className="flex flex-1 flex-col justify-center gap-3">
        {data.tierDistribution.map((tier, index) => {
          const widthPct = (tier.count / total) * 100;
          return (
            <li key={tier.key} className="group flex items-center gap-3">
              <StatusDot status={tier.key} />
              <span className="w-28 shrink-0 font-body text-[11.5px] text-fg-secondary">
                {tier.label}
              </span>
              <div className="relative h-5 flex-1">
                <motion.div
                  className={`flex h-full items-center rounded-[6px] ${BAR[tier.key]} pl-2 transition-[filter] duration-150 group-hover:brightness-110`}
                  initial={{ width: reduced ? `${widthPct}%` : "0%" }}
                  animate={{ width: `${Math.max(widthPct, tier.count > 0 ? 8 : 0)}%` }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: DURATION.chart, ease: EASING.out, delay: index * STAGGER.children }
                  }
                >
                  {tier.count > 0 && (
                    <span className="font-mono text-[10.5px] font-semibold text-white">
                      {tier.count}
                    </span>
                  )}
                </motion.div>
                {tier.names.length > 0 && (
                  <HoverTip align="center">
                    <p className="max-w-[200px] whitespace-normal font-body text-[11px] text-fg-secondary">
                      {tier.names.join(", ")}
                    </p>
                  </HoverTip>
                )}
              </div>
              <span className="w-8 shrink-0 text-right font-mono text-[11px] text-fg-muted">
                {tier.count}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
