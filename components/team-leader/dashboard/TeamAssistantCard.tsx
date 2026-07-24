"use client";

import {
  Sparkles,
  Trophy,
  AlertTriangle,
  Filter,
  Timer,
  PhoneMissed,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import type { StatusLevel } from "@/lib/types/agent-data";
import { T } from "@/components/i18n/T";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { cn } from "@/lib/utils/cn";

/**
 * Takım Asistanı — panonun en üstünde, veriyi takım liderinin anlayacağı düz
 * dile çeviren kart. Şu an kural-tabanlı (compute katmanında üretilir); V2'de
 * gerçek AI ile değişecek. Amaç: karmaşık Zoho rakamları yerine "bu dönem neye
 * dikkat etmeliyim?" sorusuna 3 saniyede cevap.
 */

const ICONS: Record<string, LucideIcon> = {
  trophy: Trophy,
  alert: AlertTriangle,
  filter: Filter,
  timer: Timer,
  "phone-missed": PhoneMissed,
};

const TONE: Record<StatusLevel, { chip: string; dot: string }> = {
  success: { chip: "bg-success/12 text-success", dot: "bg-success" },
  warning: { chip: "bg-warning/16 text-warning", dot: "bg-warning" },
  risk: { chip: "bg-risk/14 text-risk", dot: "bg-risk" },
  critical: { chip: "bg-critical/12 text-critical", dot: "bg-critical" },
  neutral: { chip: "bg-neutral/16 text-fg-secondary", dot: "bg-neutral" },
};

export function TeamAssistantCard() {
  const { data } = useTeamDateRange();
  const a = data.assistant;
  const tone = TONE[a.tone];

  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface shadow-soft">
      {/* Başlık şeridi — marka gradienti */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-3.5"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(14,169,139,0.16) 0%, rgba(124,92,252,0.14) 100%)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-control bg-brand/15 text-brand">
            <Sparkles size={18} />
          </span>
          <div className="flex flex-col">
            <span className="font-display text-[14.5px] font-semibold text-fg">
              <T tr="Takım Asistanı" en="Team Assistant" />
            </span>
            <span className="font-body text-[10.5px] text-fg-muted">
              <T
                tr="Verini sade dille özetler · V2'de yapay zeka ile gelişecek"
                en="Summarizes your data in plain language · will evolve with AI in V2"
              />
            </span>
          </div>
        </div>
        <span className={cn("hidden items-center gap-1.5 rounded-pill px-2.5 py-1 font-body text-[11px] font-semibold sm:flex", tone.chip)}>
          <span className={cn("h-2 w-2 rounded-pill", tone.dot)} />
          {a.headline}
        </span>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <p className="font-body text-[13px] leading-relaxed text-fg-secondary">
          <span className="font-semibold text-fg sm:hidden">{a.headline}. </span>
          {a.summary}
        </p>

        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {a.points.map((p, i) => {
            const Icon = ICONS[p.icon] ?? Lightbulb;
            const t = TONE[p.tone];
            return (
              <li
                key={i}
                className="flex items-start gap-3 rounded-control border border-border bg-bg p-3.5"
              >
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-control", t.chip)}>
                  <Icon size={15} strokeWidth={2} />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-display text-[12.5px] font-semibold text-fg">{p.title}</span>
                  <span className="font-body text-[12px] leading-relaxed text-fg-secondary">{p.text}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
