"use client";

import { motion } from "framer-motion";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import type { StatusLevel } from "@/lib/types/agent-data";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { DURATION, EASING, STAGGER } from "@/lib/motion";
import { formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * "Neden kaybediyoruz?" — Zoho'nun 14 kriptik kodlu "Sales Opportunity Result"
 * pivotunun sade karşılığı. Sonuçlanmış fırsatların hangi nedenle kapandığı,
 * en çoktan en aza sıralı bar-liste + tek cümlelik çıkarım.
 */

const BAR: Record<StatusLevel, string> = {
  success: "bg-success",
  warning: "bg-warning",
  risk: "bg-risk",
  critical: "bg-critical",
  neutral: "bg-neutral",
};

export function LossReasonBreakdown() {
  const { data } = useTeamDateRange();
  const reduced = usePrefersReducedMotion();
  const rows = data.lossReasons;
  const max = Math.max(1, ...rows.map((r) => r.count));
  const topLoss = rows.find((r) => r.key !== "Interested");

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle hint="Sonuçlanan fırsatların hangi nedenle kapandığı. 'İlgileniyor' hâlâ açık fırsattır; diğerleri kayıp nedenleridir. En çok görülen neden en üstte.">
        Neden Kaybediyoruz?
      </SectionTitle>

      {rows.length === 0 ? (
        <p className="py-6 text-center font-body text-[13px] text-fg-muted">
          Bu dönemde sonuçlanmış fırsat yok.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-2.5">
            {rows.map((r, index) => (
              <li key={r.key} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate font-body text-[12px] text-fg-secondary" title={r.label}>
                  {r.label}
                </span>
                <div className="relative h-6 flex-1 overflow-hidden rounded-[6px] bg-elevated">
                  <motion.div
                    className={cn("flex h-full items-center rounded-[6px] pl-2", BAR[r.tone])}
                    initial={{ width: reduced ? `${(r.count / max) * 100}%` : "0%" }}
                    animate={{ width: `${(r.count / max) * 100}%` }}
                    transition={reduced ? { duration: 0 } : { duration: DURATION.chart, ease: EASING.out, delay: index * STAGGER.children }}
                    style={{ minWidth: "3.2rem" }}
                  >
                    <span className="font-mono text-[10.5px] font-semibold text-white">
                      {formatNumber(r.count)}
                    </span>
                  </motion.div>
                </div>
                <span className="w-12 shrink-0 text-right font-mono text-[11px] text-fg-muted">%{r.pct}</span>
              </li>
            ))}
          </ul>

          {topLoss && (
            <p className="rounded-control border border-border bg-bg px-3.5 py-2.5 font-body text-[12px] leading-relaxed text-fg-secondary">
              💡 En çok kayıp <span className="font-semibold text-fg">{topLoss.label}</span> nedeniyle
              (%{topLoss.pct}). Bu gruptaki lead&apos;lerin görüşme senaryosunu gözden geçirmek dönüşümü
              en hızlı artıracak alan.
            </p>
          )}
        </>
      )}
    </Card>
  );
}
