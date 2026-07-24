"use client";

import { CalendarDays, MapPin, Users } from "lucide-react";
import { REGION_MANAGER_PROFILE } from "@/lib/mock/region-manager-profile";
import { MOCK_DATE_LABEL } from "@/lib/mock/mock-data";
import { useIdentity } from "@/lib/data/session-store";
import { useLang } from "@/components/i18n/LanguageProvider";
import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { formatNumber, formatPercent } from "@/lib/utils/format";

/** Bölge Özeti hero bandı — "Merhaba, Deniz" + öne çıkan bölge istatistikleri. */

function HeroTile({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const animated = useCountUp(value);
  return (
    <div className="hero-tile flex min-w-[104px] flex-col gap-1 rounded-card px-4 py-3">
      <span className="font-body text-[11px] font-medium text-white/70">{label}</span>
      <span className="font-mono text-[24px] font-semibold leading-none text-white">
        {suffix === "%" ? formatPercent(animated) : formatNumber(Math.round(animated))}
      </span>
    </div>
  );
}

function Chip({ icon: Icon, children }: { icon: typeof MapPin; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 rounded-pill bg-white/12 px-2.5 py-1 font-body text-[11.5px] font-medium text-white/90">
      <Icon size={12} aria-hidden />
      {children}
    </span>
  );
}

const HERO_BG: React.CSSProperties = {
  backgroundColor: "#14324f",
  backgroundImage: [
    "radial-gradient(120% 140% at 88% -10%, rgba(124,92,252,0.55) 0%, transparent 55%)",
    "radial-gradient(90% 120% at 8% 120%, rgba(21,214,174,0.40) 0%, transparent 50%)",
    "linear-gradient(120deg, #0c6f5e 0%, #14324f 52%, #2a2f7a 100%)",
  ].join(", "),
};

export function RegionHeroHeader() {
  const identity = useIdentity(REGION_MANAGER_PROFILE);
  const firstName = identity.name.split(" ")[0];
  const { t } = useLang();
  const { data } = useRegionDateRange();
  const regionAvgScore =
    data.teams.reduce((s, t) => s + t.avgScore, 0) / Math.max(data.teams.length, 1);
  const totalAgents = data.teams.reduce((s, t) => s + t.agentCount, 0);

  return (
    <section style={HERO_BG} className="relative overflow-hidden rounded-card px-6 py-6 shadow-elevated sm:px-8 sm:py-7">
      <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <h1 className="font-display text-[26px] font-bold leading-tight text-white">
              {t("Merhaba", "Hello")}, {firstName}
            </h1>
            <p className="flex items-center gap-1.5 font-body text-[12.5px] text-white/75">
              <CalendarDays size={13} aria-hidden />
              {MOCK_DATE_LABEL}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-pill bg-white/20 px-2.5 py-1 font-body text-[11px] font-semibold text-white">
              {identity.role}
            </span>
            <Chip icon={Users}>{identity.team}</Chip>
            <Chip icon={MapPin}>{identity.location}</Chip>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <HeroTile label={t("Takım Sayısı", "Team Count")} value={data.teams.length} />
          <HeroTile label={t("Danışman", "Agents")} value={totalAgents} />
          <HeroTile label={t("Bölge Ort. Skor", "Region Avg. Score")} value={regionAvgScore} />
          <HeroTile label={t("Hedef Gerçekleşme", "Target Achievement")} value={data.targetPct} suffix="%" />
        </div>
      </div>
    </section>
  );
}
