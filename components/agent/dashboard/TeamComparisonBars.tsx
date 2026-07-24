"use client";

import { motion } from "framer-motion";
import { TEAM_COMPARISON } from "@/lib/mock/mock-data";
import type { ComparisonMetric } from "@/lib/types/agent-data";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { DURATION, EASING } from "@/lib/motion";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HoverTip } from "@/components/ui/HoverTip";
import { cn } from "@/lib/utils/cn";

/**
 * "Takım ortalamana göre durumun" — CLAUDE.md 4.3 alt bölüm.
 * Her metrik için "Sen" (marka rengi) vs "Takım Ort." (nötr) yatay çubuk;
 * fark puanı renkli rozet (pozitif yeşil, negatif kırmızı).
 * Çubuklar alttan-yukarı değil soldan sağa dolarak çizilir (3.4 madde 4).
 */

function Bar({
  label,
  pct,
  fillClass,
  tipLabel,
}: {
  label: string;
  pct: number;
  fillClass: string;
  tipLabel: string;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <div className="group flex items-center gap-3">
      <span className="w-20 shrink-0 font-body text-[11px] text-fg-secondary transition-colors group-hover:text-fg">
        {label}
      </span>
      <div className="relative h-2.5 flex-1 rounded-pill bg-elevated">
        <div className="h-full overflow-hidden rounded-pill">
          <motion.div
            className={cn(
              "h-full rounded-pill transition-[filter] duration-150 group-hover:brightness-110",
              fillClass,
            )}
            initial={{ width: reduced ? `${pct}%` : "0%" }}
            animate={{ width: `${pct}%` }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: DURATION.chart, ease: EASING.out }
            }
          />
        </div>
        <HoverTip align="right">
          <p className="font-mono text-[11.5px] text-fg">
            <span className="text-fg-secondary">{tipLabel}:</span> {formatPercent(pct)}
          </p>
        </HoverTip>
      </div>
      <span className="w-14 shrink-0 text-right font-mono text-[12px] font-medium text-fg">
        {formatPercent(pct)}
      </span>
    </div>
  );
}

function MetricRow({ metric }: { metric: ComparisonMetric }) {
  const delta = metric.minePct - metric.teamPct;
  const positive = delta >= 0;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="font-display text-[13px] font-semibold text-fg">
          {metric.label}
        </span>
        <span
          className={cn(
            "rounded-pill px-2 py-0.5 font-mono text-[11px] font-medium",
            positive ? "bg-success/12 text-success" : "bg-critical/12 text-critical",
          )}
        >
          {positive ? "+" : "−"}
          {formatNumber(Math.abs(delta), 1)} puan
        </span>
      </div>
      <Bar label="Sen" pct={metric.minePct} fillClass="bg-brand" tipLabel="Sen" />
      <Bar
        label="Takım Ort."
        pct={metric.teamPct}
        fillClass="bg-neutral"
        tipLabel="Takım Ortalaması"
      />
    </div>
  );
}

export function TeamComparisonBars() {
  return (
    <Card className="flex flex-col gap-5">
      <SectionTitle>Takım Ortalamana Göre Durumun</SectionTitle>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
        {TEAM_COMPARISON.map((metric) => (
          <MetricRow key={metric.key} metric={metric} />
        ))}
      </div>
    </Card>
  );
}
