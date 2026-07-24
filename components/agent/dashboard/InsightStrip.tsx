import { Clock, Filter, Timer, Lightbulb, type LucideIcon } from "lucide-react";
import { INSIGHTS } from "@/lib/mock/mock-data";
import type { StatusLevel } from "@/lib/types/agent-data";
import { cn } from "@/lib/utils/cn";

/**
 * İçgörü şeridi — veriden türetilen açıklayıcı notlar.
 * Agent'ın rakamların anlamını kavraması için (v2 ilkesi): her kart bir
 * lucide ikon + duruma göre renkli sol şerit + kısa Türkçe öneri.
 */

const ICONS: Record<string, LucideIcon> = {
  clock: Clock,
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

export function InsightStrip() {
  if (INSIGHTS.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
      {INSIGHTS.map((insight) => {
        const Icon = ICONS[insight.icon] ?? Lightbulb;
        const tone = TONE[insight.tone];
        return (
          <div
            key={insight.id}
            className="relative flex items-start gap-3 overflow-hidden rounded-card border border-border bg-surface p-4 shadow-soft"
          >
            <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", tone.bar)} />
            <span
              aria-hidden
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-control",
                tone.chip,
              )}
            >
              <Icon size={15} strokeWidth={2} />
            </span>
            <p className="font-body text-[12.5px] leading-relaxed text-fg-secondary">
              {insight.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}
