"use client";

import { Info } from "lucide-react";
import { DAILY_TARGET_MINUTES, formatDuration } from "@/lib/mock/pdks";
import { teamPdksOverview } from "@/lib/mock/team-pdks";
import { formatNumber } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { TeamDashboardHeader } from "@/components/team-leader/TeamDashboardHeader";
import { TeamPdksSummaryCard } from "@/components/team-leader/pdks/TeamPdksSummaryCard";
import { TeamPdksAgentTable } from "@/components/team-leader/pdks/TeamPdksAgentTable";

/**
 * Takım Mesai & PDKS — agent panelindeki PDKS sayfasının takım geneli hali.
 * Aynı iş kuralı (turnike içinde 7 sa 30 dk), aynı motor (lib/mock/pdks.ts),
 * farklı soru: "hangi danışmanın eksiği var ve neden".
 */
export default function TeamLeaderPdksPage() {
  const { lang } = useLang();
  const overview = teamPdksOverview(lang);

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <TeamDashboardHeader
        title={<T tr="Mesai & PDKS" en="Attendance & Hours" />}
        subtitle={
          <T
            tr={`Takımının turnike kayıtları — her danışmanın her iş günü turnike içinde ${formatDuration(DAILY_TARGET_MINUTES, "tr")} kalması bekleniyor.`}
            en={`Your team's turnstile records — every agent is expected to stay inside for ${formatDuration(DAILY_TARGET_MINUTES, "en")} on each workday.`}
          />
        }
      />

      <TeamPdksSummaryCard overview={overview} />
      <TeamPdksAgentTable overview={overview} />

      {/* Kural notu — hesabın nasıl yapıldığı şeffaf olsun */}
      <div className="flex items-start gap-2.5 rounded-card border border-border bg-surface px-4 py-3">
        <Info size={15} aria-hidden className="mt-0.5 shrink-0 text-indigo" />
        <p className="font-body text-[12px] leading-relaxed text-fg-secondary">
          <span className="font-semibold text-fg">
            <T
              tr={`Mesai, turnike İÇİNDE geçirilen net süreye göre hesaplanır (hedef: günlük ${formatDuration(DAILY_TARGET_MINUTES, "tr")}).`}
              en={`Hours are calculated from net time spent INSIDE the turnstile (target: ${formatDuration(DAILY_TARGET_MINUTES, "en")} per day).`}
            />
          </span>{" "}
          <T
            tr="İlk giriş ile son çıkış arasında turnikeden çıkıp dışarıda geçirilen süreler düşülür; masada/kantinde geçen mola turnike içinde olduğu için sayılır. Hafta sonu, resmi tatil ve izin günlerinde hedef yoktur — o günlerdeki çalışma fazla mesai olarak ayrı gösterilir. Devamsız günler hedefi olan gün sayılır."
            en="Any time spent outside the turnstile between the first entry and last exit is deducted; breaks taken at the desk or in the canteen count because the agent remains inside. Weekends, public holidays and leave days carry no target — work on those days is shown separately as overtime. Absent days still carry a target."
          />{" "}
          <span className="text-fg-muted">
            <T
              tr={`Kapılar: Satış Giriş 1, Satış Giriş 2, İdari Giriş. Pencere: son 30 gün, ${formatNumber(overview.teamSize)} danışman.`}
              en={`Gates: Sales Gate 1, Sales Gate 2, Admin Gate. Window: last 30 days, ${formatNumber(overview.teamSize)} agents.`}
            />
          </span>
        </p>
      </div>
    </div>
  );
}
