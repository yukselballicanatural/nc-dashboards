"use client";

import { useState } from "react";
import { Banknote, ChevronRight, Info, TrendingUp, Trophy, Users } from "lucide-react";
import {
  ACHIEVER_COUNT,
  AGENT_COUNT,
  MONTH_TEAM_FORECAST_EUR,
  MONTH_TEAM_SALES_EUR,
  NEXT_ACHIEVER_TIER,
  TEAM_QUARTER,
  TL_COMMISSION,
  TL_FORECAST_MONTHLY_COMMISSION_EUR,
  TL_GAP_TO_QUOTA_EUR,
} from "@/lib/mock/team-earnings";
import { TL_ACHIEVER_THRESHOLD_EUR } from "@/lib/mock/commission";
import { formatCurrencyEUR, formatNumber, formatRatePct } from "@/lib/utils/format";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { TeamEarningsDetailDrawer } from "./TeamEarningsDetailDrawer";

/**
 * TL PARA BANDI — Takım Lideri ekranının en üstündeki prim özeti.
 * Ana rakam: bu ay + çeyreklik hak edilen toplam komisyon.
 */

function MoneyTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="hero-tile flex min-w-[150px] flex-1 flex-col gap-1 rounded-card px-4 py-3">
      <span className="flex items-center gap-1.5 font-body text-[11px] font-medium text-white/70">
        <Icon size={12} aria-hidden />
        {label}
      </span>
      <span className="font-mono text-[19px] font-semibold leading-none text-white">
        {value}
      </span>
      <span className="font-body text-[10.5px] leading-snug text-white/60">{sub}</span>
    </div>
  );
}

const MONEY_BG: React.CSSProperties = {
  backgroundColor: "#0b5f52",
  backgroundImage: [
    "radial-gradient(110% 150% at 92% -20%, rgba(245,166,35,0.45) 0%, transparent 58%)",
    "radial-gradient(95% 130% at 5% 120%, rgba(21,214,174,0.45) 0%, transparent 55%)",
    "linear-gradient(115deg, #0a7d63 0%, #0b5f52 48%, #123a52 100%)",
  ].join(", "),
};

export function TeamLeaderEarningsBand() {
  const { t } = useLang();
  const c = TL_COMMISSION;
  const total = c.monthlyCommissionEUR + c.quarterlyTotalEUR;
  const animated = useCountUp(total);
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
    <section
      style={MONEY_BG}
      role="button"
      tabIndex={0}
      onClick={() => setDetailOpen(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setDetailOpen(true);
        }
      }}
      aria-label={t(
        "Takım lideri prim özeti — detaylı görünümü açmak için tıkla",
        "Team leader commission summary — click to open the detailed view",
      )}
      className="group relative cursor-pointer overflow-hidden rounded-card px-6 py-6 shadow-elevated outline-none transition-shadow duration-150 hover:shadow-[0_22px_52px_rgba(11,95,82,0.32)] focus-visible:ring-2 focus-visible:ring-white/60 sm:px-8 sm:py-7"
    >
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2 font-body text-[11.5px] font-semibold uppercase tracking-wide text-white/70">
            <Banknote size={14} aria-hidden />
            <T tr="Hak Edilen Toplam Primin" en="Your Total Earned Commission" />
            <span
              className="flex cursor-help items-center text-white/55"
              title={t(
                "Aylık komisyon: (takım satışı − kota) × %2. Çeyreklik komisyon: agent başına aylık ortalamaya göre seçilen oran × çeyrek toplamı, üstüne eşiği geçen agent sayısına bağlı çarpan.",
                "Monthly commission: (team sales − quota) × 2%. Quarterly commission: rate set by per-agent monthly average × quarter total, plus a multiplier based on how many agents cleared the threshold.",
              )}
            >
              <Info size={13} aria-hidden />
            </span>
          </span>

          <span className="font-mono text-[46px] font-bold leading-none text-white sm:text-[56px]">
            {formatCurrencyEUR(animated)}
          </span>

          <p className="font-body text-[12.5px] text-white/75">
            <T tr="Aylık" en="Monthly" />{" "}
            <span className="font-mono font-semibold text-white">
              {formatCurrencyEUR(c.monthlyCommissionEUR)}
            </span>{" "}
            +{" "}
            <T tr="çeyreklik" en="quarterly" />{" "}
            <span className="font-mono font-semibold text-white">
              {formatCurrencyEUR(c.quarterlyTotalEUR)}
            </span>{" "}
            · {TEAM_QUARTER} ·{" "}
            <T tr="dilim" en="tier" />{" "}
            <span className="font-mono font-semibold text-white">
              {formatRatePct(c.quarterlyRatePct)}
            </span>
          </p>

          {/* Aksiyon mesajı — TL için gerçek kaldıraç çarpan kademesidir */}
          <p className="mt-1 max-w-[460px] font-body text-[11.5px] leading-relaxed text-white/80">
            {!c.conditionMet ? (
              <T
                tr={`Prim koşulu henüz sağlanmıyor: agent başına aylık ortalama en az ${formatCurrencyEUR(12000)} olmalı (şu an ${formatCurrencyEUR(Math.round(c.perAgentMonthlyAvgEUR))}).`}
                en={`The commission condition isn't met yet: the per-agent monthly average must be at least ${formatCurrencyEUR(12000)} (currently ${formatCurrencyEUR(Math.round(c.perAgentMonthlyAvgEUR))}).`}
              />
            ) : NEXT_ACHIEVER_TIER ? (
              <T
                tr={`${formatNumber(ACHIEVER_COUNT)}/${formatNumber(AGENT_COUNT)} agent ${formatCurrencyEUR(TL_ACHIEVER_THRESHOLD_EUR)} eşiğini geçti — çarpanın ${formatRatePct(c.achieverBonusPct)}. ${formatNumber(NEXT_ACHIEVER_TIER.agentsNeeded)} agent daha geçerse çarpan ${formatRatePct(NEXT_ACHIEVER_TIER.bonusPct)} olur ve çeyreklik primin ${formatCurrencyEUR(NEXT_ACHIEVER_TIER.quarterlyTotalEUR)}'ya çıkar.`}
                en={`${formatNumber(ACHIEVER_COUNT)}/${formatNumber(AGENT_COUNT)} agents cleared the ${formatCurrencyEUR(TL_ACHIEVER_THRESHOLD_EUR)} threshold — your multiplier is ${c.achieverBonusPct}%. If ${formatNumber(NEXT_ACHIEVER_TIER.agentsNeeded)} more clear it, the multiplier becomes ${NEXT_ACHIEVER_TIER.bonusPct}% and your quarterly commission rises to ${formatCurrencyEUR(NEXT_ACHIEVER_TIER.quarterlyTotalEUR)}.`}
              />
            ) : (
              <T
                tr={`Tüm kademeler yakalandı — çarpanın en üst seviyede (${formatRatePct(c.achieverBonusPct)}).`}
                en={`All multiplier tiers reached — your multiplier is at the maximum (${c.achieverBonusPct}%).`}
              />
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 lg:max-w-[340px]">
          <MoneyTile
            icon={Trophy}
            label={t("Kota Üstü Satış", "Sales Over Quota")}
            value={formatCurrencyEUR(c.overQuotaEUR)}
            sub={
              TL_GAP_TO_QUOTA_EUR > 0
                ? t(
                    `kotaya ${formatCurrencyEUR(TL_GAP_TO_QUOTA_EUR)} kaldı`,
                    `${formatCurrencyEUR(TL_GAP_TO_QUOTA_EUR)} to quota`,
                  )
                : t(
                    `kota ${formatCurrencyEUR(c.quotaEUR)} aşıldı`,
                    `quota of ${formatCurrencyEUR(c.quotaEUR)} exceeded`,
                  )
            }
          />
          <MoneyTile
            icon={Users}
            label={t("Agent Başına Ortalama", "Average Per Agent")}
            value={formatCurrencyEUR(Math.round(c.perAgentMonthlyAvgEUR))}
            sub={t(
              `${formatNumber(AGENT_COUNT)} agent · çeyrek ortalaması`,
              `${formatNumber(AGENT_COUNT)} agents · quarterly average`,
            )}
          />
          <MoneyTile
            icon={TrendingUp}
            label={t("Tahmini Ay Sonu Prim", "Projected Month-End Commission")}
            value={formatCurrencyEUR(TL_FORECAST_MONTHLY_COMMISSION_EUR)}
            sub={t(
              `${formatCurrencyEUR(MONTH_TEAM_FORECAST_EUR)} takım satışı temposuyla`,
              `at a ${formatCurrencyEUR(MONTH_TEAM_FORECAST_EUR)} team sales pace`,
            )}
          />
          <MoneyTile
            icon={Banknote}
            label={t("Bu Ay Takım Satışı", "Team Sales This Month")}
            value={formatCurrencyEUR(MONTH_TEAM_SALES_EUR)}
            sub={t("tahsilatı alınan deal'ler", "deals with payment received")}
          />
        </div>
      </div>

      <span className="relative mt-5 flex items-center justify-end gap-1 font-body text-[11.5px] font-semibold text-white/70 transition-colors group-hover:text-white">
        <T tr="Tüm prim detayların" en="Your full commission detail" />
        <ChevronRight size={14} aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5" />
      </span>
    </section>

    <TeamEarningsDetailDrawer open={detailOpen} onClose={() => setDetailOpen(false)} />
    </>
  );
}
