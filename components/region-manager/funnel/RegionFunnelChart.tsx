"use client";

import { motion } from "framer-motion";
import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { DURATION, EASING, STAGGER } from "@/lib/motion";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HoverTip } from "@/components/ui/HoverTip";

/**
 * Bölge funnel'ı — lead'den ödemeye tüm bölge. Hover'da o aşamaya en çok
 * katkı veren takımlar; "bu sayı hangi takımdan geliyor" sorusuna cevap.
 */
export function RegionFunnelChart() {
  const reduced = usePrefersReducedMotion();
  const { data } = useRegionDateRange();
  const stages = data.funnel;
  const max = Math.max(...stages.map((s) => s.total), 1);

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle hint="Bölgenin lead'den ödemeye tüm yolculuğu. Üstüne gelince o aşamaya en çok katkı veren takımları görürsün.">
        {`Bölge Funnel'ı (Seçili Dönem)`}
      </SectionTitle>

      <div className="flex items-center gap-3 font-body text-[10px] uppercase tracking-wide text-fg-muted">
        <span className="w-32 shrink-0">Aşama</span>
        <span className="flex-1" />
        <span className="w-14 shrink-0 text-right">Önceki %</span>
      </div>

      <ul className="flex flex-1 flex-col justify-center gap-2">
        {stages.map((stage, index) => {
          const widthPct = (stage.total / max) * 100;
          const topTeams = [...stage.byTeam].sort((a, b) => b.count - a.count).slice(0, 3).filter((t) => t.count > 0);
          return (
            <li key={stage.key} className="group flex items-center gap-3 rounded-[8px] px-1 py-0.5 transition-colors hover:bg-elevated">
              <span className="w-32 shrink-0 truncate font-body text-[11.5px] text-fg-secondary transition-colors group-hover:text-fg">
                {stage.label}
              </span>
              <div className="relative h-6 flex-1">
                <motion.div
                  className="flex h-full items-center rounded-[7px] bg-violet pl-2 transition-[filter,transform] duration-150 group-hover:brightness-110 group-hover:saturate-150"
                  initial={{ width: reduced ? `${widthPct}%` : "0%" }}
                  animate={{ width: `${widthPct}%` }}
                  transition={reduced ? { duration: 0 } : { duration: DURATION.chart, ease: EASING.out, delay: index * STAGGER.children }}
                  style={{ minWidth: "2.1rem" }}
                >
                  <span className="font-mono text-[11px] font-semibold text-white">{formatNumber(stage.total)}</span>
                </motion.div>
                <HoverTip align="right">
                  <p className="mb-0.5 font-display text-[12px] font-semibold text-fg">{stage.label}</p>
                  <p className="mb-1 font-mono text-[11px] text-fg-muted">
                    {stage.prevPct !== null ? `Önceki aşamadan %${Math.round(stage.prevPct)} geçiş` : "Funnel'ın başı"}
                  </p>
                  {topTeams.length > 0 && (
                    <div className="flex flex-col gap-0.5 border-t border-border pt-1">
                      {topTeams.map((t) => (
                        <p key={t.teamId} className="font-mono text-[10.5px] text-fg-secondary">
                          {t.teamName.replace(" Team", "")}: <span className="text-violet">{t.count}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </HoverTip>
              </div>
              <span className="w-14 shrink-0 text-right font-mono text-[11px] text-fg">
                {stage.prevPct !== null ? formatPercent(stage.prevPct, 0) : "—"}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
