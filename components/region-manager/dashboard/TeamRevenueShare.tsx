"use client";

import { motion } from "framer-motion";
import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { DURATION, EASING, STAGGER } from "@/lib/motion";
import { formatCurrencyEUR, formatPercent } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HoverTip } from "@/components/ui/HoverTip";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";

const FILLS = ["bg-brand", "bg-indigo", "bg-violet", "bg-brand-secondary"];

/**
 * Takım ciro payı — her takımın bölge cirosuna katkısı (%). Bölge Müdürü
 * "ciro hangi takımlara bağımlı, risk yoğunlaşması var mı" sorusuna bakar.
 */
export function TeamRevenueShare() {
  const reduced = usePrefersReducedMotion();
  const { data } = useRegionDateRange();
  const { t: tr } = useLang();
  const total = data.teams.reduce((s, t) => s + t.paymentsEUR, 0);
  const rows = [...data.teams].sort((a, b) => b.paymentsEUR - a.paymentsEUR);
  const max = Math.max(...rows.map((t) => t.paymentsEUR), 1);

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={tr(
          "Her takımın bölge cirosundaki payı — birkaç takıma aşırı bağımlılık bir risk sinyalidir.",
          "Each team's share of regional revenue — over-reliance on a few teams is a risk signal.",
        )}
      >
        <T tr="Takım Ciro Payı" en="Team Revenue Share" />
      </SectionTitle>
      <ul className="flex flex-1 flex-col justify-center gap-2.5">
        {rows.map((team, index) => {
          const sharePct = total > 0 ? (team.paymentsEUR / total) * 100 : 0;
          const widthPct = (team.paymentsEUR / max) * 100;
          return (
            <li key={team.teamId} className="group flex items-center gap-3">
              <span className="w-40 shrink-0 truncate font-body text-[11.5px] text-fg-secondary transition-colors group-hover:text-fg">
                {team.teamName.replace(" Team", "")}
              </span>
              <div className="relative h-5 flex-1">
                <motion.div
                  className={`flex h-full items-center rounded-[6px] ${FILLS[index % FILLS.length]} pl-2 transition-[filter] duration-150 group-hover:brightness-110`}
                  initial={{ width: reduced ? `${widthPct}%` : "0%" }}
                  animate={{ width: `${Math.max(widthPct, 6)}%` }}
                  transition={reduced ? { duration: 0 } : { duration: DURATION.chart, ease: EASING.out, delay: index * STAGGER.children }}
                >
                  <span className="font-mono text-[10.5px] font-semibold text-white">{formatPercent(sharePct, 0)}</span>
                </motion.div>
                <HoverTip align="right">
                  <p className="mb-0.5 font-display text-[12px] font-semibold text-fg">{team.teamName}</p>
                  <p className="font-mono text-[11px] text-fg-muted">{`${formatCurrencyEUR(team.paymentsEUR)} · ${tr(`bölgenin %${Math.round(sharePct)}'i`, `${Math.round(sharePct)}% of region`)}`}</p>
                </HoverTip>
              </div>
              <span className="w-20 shrink-0 text-right font-mono text-[11px] text-fg-secondary">
                {formatCurrencyEUR(team.paymentsEUR)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
