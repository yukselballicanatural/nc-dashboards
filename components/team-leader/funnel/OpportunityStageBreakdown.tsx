"use client";

import { motion } from "framer-motion";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { DURATION, EASING, STAGGER } from "@/lib/motion";
import { formatNumber, formatCurrencyEUR } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * "Fırsatlar hangi statüde?" — Zoho: Agent Deal & Opportunity Overview'un sade
 * karşılığı. Açık ve kapanan fırsatların statü dağılımı (adet + varsa tutar).
 */

const BAR: Record<string, string> = {
  brand: "bg-brand",
  "brand-secondary": "bg-brand-secondary",
  indigo: "bg-indigo",
  violet: "bg-violet",
};

export function OpportunityStageBreakdown() {
  const { data } = useTeamDateRange();
  const reduced = usePrefersReducedMotion();
  const rows = data.oppStages;
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle hint="Takımın elindeki fırsatların hangi aşamada olduğu — görüşmeden kazanılan satışa. Deal aşamalarında toplam tutar da gösterilir.">
        Fırsatlar Hangi Statüde?
      </SectionTitle>

      {rows.length === 0 ? (
        <p className="py-6 text-center font-body text-[13px] text-fg-muted">
          Bu dönemde fırsat kaydı yok.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((r, index) => (
            <li key={r.key} className="flex items-center gap-3">
              <span className="w-36 shrink-0 truncate font-body text-[12px] text-fg-secondary" title={r.label}>
                {r.label}
              </span>
              <div className="relative h-6 flex-1 overflow-hidden rounded-[6px] bg-elevated">
                <motion.div
                  className={cn("flex h-full items-center rounded-[6px] pl-2", BAR[r.accent])}
                  initial={{ width: reduced ? `${(r.count / max) * 100}%` : "0%" }}
                  animate={{ width: `${(r.count / max) * 100}%` }}
                  transition={reduced ? { duration: 0 } : { duration: DURATION.chart, ease: EASING.out, delay: index * STAGGER.children }}
                  style={{ minWidth: "2.6rem" }}
                >
                  <span className="font-mono text-[10.5px] font-semibold text-white">{formatNumber(r.count)}</span>
                </motion.div>
              </div>
              <span className="w-24 shrink-0 text-right font-mono text-[11px] text-fg-muted">
                {r.amountEUR > 0 ? formatCurrencyEUR(r.amountEUR) : "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
