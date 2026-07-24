"use client";

import {
  PhoneCall,
  PhoneIncoming,
  Timer,
  TrendingUp,
  Banknote,
  Crown,
  type LucideIcon,
} from "lucide-react";
import type { AccentColor } from "@/lib/types/agent-data";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * Metrik liderleri — her önemli boyutta takımın #1'i. TL "kimden örnek
 * uygulama alabilirim / kimi eşleştirebilirim" sorusuna hızlı cevap bulur.
 */

const ICONS: Record<string, LucideIcon> = {
  "phone-call": PhoneCall,
  "phone-incoming": PhoneIncoming,
  timer: Timer,
  "trending-up": TrendingUp,
  banknote: Banknote,
};

const ACCENT_CHIP: Record<AccentColor, string> = {
  brand: "bg-brand/12 text-brand",
  "brand-secondary": "bg-brand-secondary/14 text-brand-secondary",
  indigo: "bg-indigo/12 text-indigo",
  violet: "bg-violet/12 text-violet",
};

export function DimensionLeaders() {
  const { data } = useTeamDateRange();
  const { t } = useLang();

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle hint={t("Her boyutta takımın en iyisi — örnek uygulamayı kimden alacağını, kimi eşleştireceğini gösterir.", "The team's best in each dimension — shows whom to learn best practices from and whom to pair up.")}>
        <T tr="Metrik Liderleri" en="Metric Leaders" />
      </SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {data.dimensionLeaders.map((leader) => {
          const Icon = ICONS[leader.icon] ?? Crown;
          return (
            <div
              key={leader.key}
              className="flex flex-col gap-2 rounded-control border border-border bg-bg p-3"
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-control",
                  ACCENT_CHIP[leader.accent],
                )}
              >
                <Icon size={15} strokeWidth={2} />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-body text-[10.5px] font-medium uppercase tracking-wide text-fg-muted">
                  {leader.label}
                </span>
                <span className="truncate font-body text-[12.5px] font-semibold text-fg">
                  {leader.agentName}
                </span>
                <span className="font-mono text-[13px] font-semibold text-brand">
                  {leader.valueText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
