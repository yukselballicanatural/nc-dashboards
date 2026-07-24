"use client";

import { motion } from "framer-motion";
import { TEAM_QUALITY_ROWS } from "@/lib/mock/team-monthly";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { DURATION, EASING, STAGGER } from "@/lib/motion";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * Agent bazlı kalite puanı (son 30 gün ortalaması) — en yüksekten en düşüğe.
 */
export function TeamQualityBarList() {
  const reduced = usePrefersReducedMotion();

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle hint="Kalite ekibinin çağrı değerlendirme puanlarının (0-100) son 30 gün ortalaması, agent bazlı.">
        Agent Bazlı Kalite Puanı
      </SectionTitle>
      <ul className="flex flex-col gap-2">
        {TEAM_QUALITY_ROWS.map((row, index) => (
          <li key={row.agentId} className="group flex items-center gap-3 rounded-[8px] px-1 py-0.5 transition-colors hover:bg-elevated">
            <span className="w-36 shrink-0 truncate font-body text-[11.5px] text-fg-secondary transition-colors group-hover:text-fg">
              {row.name}
            </span>
            <div className="relative h-5 flex-1">
              <motion.div
                className="flex h-full items-center rounded-[6px] bg-violet pl-2 transition-[filter] duration-150 group-hover:brightness-110"
                initial={{ width: reduced ? `${row.avgQuality}%` : "0%" }}
                animate={{ width: `${row.avgQuality}%` }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { duration: DURATION.chart, ease: EASING.out, delay: index * STAGGER.children }
                }
                style={{ minWidth: "2rem" }}
              >
                <span className="font-mono text-[10.5px] font-semibold text-white">
                  {row.avgQuality.toFixed(1)}
                </span>
              </motion.div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
