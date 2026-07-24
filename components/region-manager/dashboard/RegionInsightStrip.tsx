"use client";

import { Trophy, AlertTriangle, Star, Timer, Filter, Lightbulb, Sparkles, type LucideIcon } from "lucide-react";
import type { StatusLevel } from "@/lib/types/agent-data";
import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { T } from "@/components/i18n/T";
import { cn } from "@/lib/utils/cn";

/** Bölge tavsiyeleri — kural-tabanlı (v2 fazında yapay zeka ile otomatikleşecek). */

const ICONS: Record<string, LucideIcon> = {
  trophy: Trophy,
  alert: AlertTriangle,
  star: Star,
  timer: Timer,
  filter: Filter,
};

const TONE: Record<StatusLevel, { bar: string; chip: string }> = {
  success: { bar: "bg-success", chip: "bg-success/12 text-success" },
  warning: { bar: "bg-warning", chip: "bg-warning/16 text-warning" },
  risk: { bar: "bg-risk", chip: "bg-risk/14 text-risk" },
  critical: { bar: "bg-critical", chip: "bg-critical/12 text-critical" },
  neutral: { bar: "bg-neutral", chip: "bg-neutral/16 text-fg-secondary" },
};

export function RegionInsightStrip() {
  const { data } = useRegionDateRange();
  if (data.insights.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <Sparkles size={13} className="text-violet" aria-hidden />
        <p className="font-body text-[11px] text-fg-muted">
          <T
            tr="Kural-tabanlı tavsiyeler — v2 fazında yapay zeka ile otomatikleşecek."
            en="Rule-based recommendations — will be automated with AI in the v2 phase."
          />
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        {data.insights.map((insight) => {
          const Icon = ICONS[insight.icon] ?? Lightbulb;
          const tone = TONE[insight.tone];
          return (
            <div
              key={insight.id}
              className="relative flex items-start gap-3 overflow-hidden rounded-card border border-border bg-surface p-4 shadow-soft"
            >
              <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", tone.bar)} />
              <span aria-hidden className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-control", tone.chip)}>
                <Icon size={15} strokeWidth={2} />
              </span>
              <p className="font-body text-[12.5px] leading-relaxed text-fg-secondary">{insight.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
