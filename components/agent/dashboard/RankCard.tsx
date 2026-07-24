"use client";

import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { AGENT_RANK } from "@/lib/mock/mock-data";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { DURATION, EASING } from "@/lib/motion";
import { formatNumber } from "@/lib/utils/format";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * Rank kartı — CLAUDE.md 4.6: büyük "#N / toplam" + Genel Başarı puanı +
 * takım adı. Agent yalnızca kendi sırasını görür (liste TL ekranında).
 */
export function RankCard() {
  const reduced = usePrefersReducedMotion();
  const animatedScore = useCountUp(AGENT_RANK.score);

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle>
        <T tr="Takımdaki Yerin" en="Your Team Standing" />
      </SectionTitle>

      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-pill bg-brand-secondary/14 text-brand-secondary">
          <Trophy size={19} aria-hidden />
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[42px] font-semibold leading-none text-fg">
            #{AGENT_RANK.position}
          </span>
          <span className="font-mono text-[15px] text-fg-muted">
            / {AGENT_RANK.totalAgents}
          </span>
        </div>

        <div className="flex w-full max-w-52 flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-body text-[11.5px] text-fg-secondary">
              <T tr="Genel Başarı" en="Overall Score" />
            </span>
            <span className="font-mono text-[13px] font-semibold text-fg">
              {formatNumber(animatedScore, 2)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-pill bg-elevated">
            <motion.div
              className="h-full rounded-pill bg-brand-secondary"
              initial={{ width: reduced ? `${AGENT_RANK.score}%` : "0%" }}
              animate={{ width: `${AGENT_RANK.score}%` }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { duration: DURATION.chart, ease: EASING.out }
              }
            />
          </div>
        </div>

        <span className="rounded-pill border border-border bg-elevated px-3 py-1 font-body text-[11.5px] text-fg-secondary">
          {AGENT_RANK.teamName}
        </span>
      </div>
    </Card>
  );
}
