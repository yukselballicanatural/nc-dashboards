"use client";

import { motion } from "framer-motion";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { DURATION, EASING, STAGGER } from "@/lib/motion";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HoverTip } from "@/components/ui/HoverTip";

/**
 * Takım geneli funnel — agent panelindeki FullFunnelChart'ın takım toplamı
 * versiyonu. Hover'da o aşamaya en çok katkı veren 3 agent gösterilir —
 * "bu sayı nereden geliyor" sorusuna cevap.
 */
export function TeamFunnelChart() {
  const reduced = usePrefersReducedMotion();
  const { data } = useTeamDateRange();
  const { t } = useLang();
  const stages = data.funnel;
  const max = Math.max(...stages.map((s) => s.total), 1);

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle hint={t("Lead'den ödemeye takımın tüm yolculuğu. Üstüne gelince en çok katkı veren agent'ları görürsün.", "The team's whole journey from lead to payment. Hover to see which agents contribute most.")}>
        <T tr="Takım Funnel'ı (Seçili Dönem)" en="Team Funnel (Selected Period)" />
      </SectionTitle>

      <div className="flex items-center gap-3 font-body text-[10px] uppercase tracking-wide text-fg-muted">
        <span className="w-32 shrink-0"><T tr="Aşama" en="Stage" /></span>
        <span className="flex-1" />
        <span className="w-14 shrink-0 text-right"><T tr="Önceki %" en="Prev %" /></span>
      </div>

      <ul className="flex flex-1 flex-col justify-center gap-2">
        {stages.map((stage, index) => {
          const widthPct = (stage.total / max) * 100;
          const topAgents = [...stage.byAgent]
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .filter((a) => a.count > 0);
          return (
            <li
              key={stage.key}
              className="group flex items-center gap-3 rounded-[8px] px-1 py-0.5 transition-colors hover:bg-elevated"
            >
              <span className="w-32 shrink-0 truncate font-body text-[11.5px] text-fg-secondary transition-colors group-hover:text-fg">
                {stage.label}
              </span>
              <div className="relative h-6 flex-1">
                <motion.div
                  className="flex h-full items-center rounded-[7px] bg-violet pl-2 transition-[filter,transform] duration-150 group-hover:brightness-110 group-hover:saturate-150"
                  initial={{ width: reduced ? `${widthPct}%` : "0%" }}
                  animate={{ width: `${widthPct}%` }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: DURATION.chart, ease: EASING.out, delay: index * STAGGER.children }
                  }
                  style={{ minWidth: "2.1rem" }}
                >
                  <span className="font-mono text-[11px] font-semibold text-white">
                    {formatNumber(stage.total)}
                  </span>
                </motion.div>

                <HoverTip align="right">
                  <p className="mb-0.5 font-display text-[12px] font-semibold text-fg">
                    {stage.label}
                  </p>
                  <p className="mb-1 font-mono text-[11px] text-fg-muted">
                    {stage.prevPct !== null
                      ? t(`Önceki aşamadan %${Math.round(stage.prevPct)} geçiş`, `${Math.round(stage.prevPct)}% pass-through from previous stage`)
                      : t("Funnel'ın başı", "Start of the funnel")}
                  </p>
                  {topAgents.length > 0 && (
                    <div className="flex flex-col gap-0.5 border-t border-border pt-1">
                      {topAgents.map((a) => (
                        <p key={a.agentId} className="font-mono text-[10.5px] text-fg-secondary">
                          {a.name}: <span className="text-violet">{a.count}</span>
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
