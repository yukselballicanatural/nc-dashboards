"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import type { PdksTeamComparison } from "@/lib/mock/pdks";
import { formatNumber } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * DAKİKLİK — TAKIM KIYASI.
 *
 * DİKKAT: Bu metrikte AZ OLAN İYİDİR (geç kalma dakikası). Bu yüzden renk
 * mantığı diğer kıyas kartlarının tersidir — takım ortalamasının ÜSTÜNDE
 * olmak kötüdür.
 *
 * Kıyas turnike süresi üzerinden değil geç giriş üzerinden yapılır; çünkü
 * takım vardiya verisi (TEAM_SHIFT_QUALITY) turnike hareketi içermiyor
 * (bkz. lib/mock/pdks.ts — pdksTeamComparison notu).
 */
export function PdksTeamCard({ comparison }: { comparison: PdksTeamComparison }) {
  const { t } = useLang();
  const { selfAvgLateMinutes, teamAvgLateMinutes, selfLateRank, teamSize, teamName } = comparison;

  const deltaMinutes = Math.round((selfAvgLateMinutes - teamAvgLateMinutes) * 10) / 10;
  // Az geç kalmak iyi → negatif fark İYİ.
  const better = deltaMinutes <= 0;

  const scaleMax = Math.max(selfAvgLateMinutes, teamAvgLateMinutes, 1) * 1.25;
  const selfPct = (selfAvgLateMinutes / scaleMax) * 100;
  const teamPct = (teamAvgLateMinutes / scaleMax) * 100;

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={t(
          `Günlük ortalama geç giriş dakikan, ${teamName} ortalamasıyla kıyaslanıyor. Bu metrikte AZ olan iyidir.`,
          `Your average daily late arrival in minutes, compared with the ${teamName} average. For this metric, lower is better.`,
        )}
        aside={
          <span className="shrink-0 rounded-pill bg-neutral/12 px-2.5 py-1 font-mono text-[11px] font-semibold text-fg-secondary">
            #{formatNumber(selfLateRank)}/{formatNumber(teamSize)}
          </span>
        }
      >
        <T tr="Dakikliğin — Takıma Göre" en="Your Punctuality vs. Team" />
      </SectionTitle>

      <div className="flex items-center justify-between gap-2">
        <span className="font-body text-[11.5px] text-fg-secondary">
          <T tr="Ortalama geç giriş" en="Average late arrival" />
        </span>
        <span
          className={cn(
            "flex items-center gap-1 rounded-pill px-2 py-0.5 font-mono text-[10.5px] font-semibold",
            better ? "bg-success/12 text-success" : "bg-critical/12 text-critical",
          )}
        >
          {better ? <TrendingDown size={11} aria-hidden /> : <TrendingUp size={11} aria-hidden />}
          {deltaMinutes > 0 ? "+" : ""}
          {formatNumber(deltaMinutes, 1)} {t("dk", "min")}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="w-20 shrink-0 font-body text-[10.5px] text-fg-secondary">
            {t("Sen", "You")}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-pill bg-elevated">
            <div
              className={cn("h-full rounded-pill", better ? "bg-brand" : "bg-critical")}
              style={{ width: `${selfPct}%` }}
            />
          </div>
          <span className="w-14 shrink-0 text-right font-mono text-[12px] font-bold text-fg">
            {formatNumber(selfAvgLateMinutes, 1)} {t("dk", "min")}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-20 shrink-0 font-body text-[10.5px] text-fg-secondary">
            {t("Takım Ort.", "Team Avg.")}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-pill bg-elevated">
            <div className="h-full rounded-pill bg-neutral" style={{ width: `${teamPct}%` }} />
          </div>
          <span className="w-14 shrink-0 text-right font-mono text-[11px] text-fg-secondary">
            {formatNumber(teamAvgLateMinutes, 1)} {t("dk", "min")}
          </span>
        </div>
      </div>

      <p className="mt-auto font-body text-[11px] leading-snug text-fg-secondary">
        {better ? (
          <T
            tr={`Takımın ${teamSize} danışmanı arasında geç kalma sıralamasında ${selfLateRank}. sıradasın — ortalamadan daha dakiksin.`}
            en={`You rank ${selfLateRank} of ${teamSize} on punctuality — better than the team average.`}
          />
        ) : (
          <T
            tr={`Takımın ${teamSize} danışmanı arasında geç kalma sıralamasında ${selfLateRank}. sıradasın. Ortalamadan ${formatNumber(Math.abs(deltaMinutes), 1)} dk daha fazla geç kalıyorsun.`}
            en={`You rank ${selfLateRank} of ${teamSize} on punctuality. You arrive ${formatNumber(Math.abs(deltaMinutes), 1)} min later than the team average.`}
          />
        )}
      </p>
    </Card>
  );
}
