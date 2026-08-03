/**
 * TAKIM LİDERİ PRİM / KOMİSYON TÜRETİMİ.
 *
 * Kural motoru `commission.ts`tedir (kaynak: Team_Leader_Commission_ System
 * Table.xlsx). Bu dosya kuralları takımın gerçek verisine uygular.
 *
 * VERİ KAYNAĞI NOTU: agent-earnings.ts ile aynı yaklaşım — içinde bulunulan ay
 * `TEAM_AGENTS` lead verisinden, çeyreğin diğer ayları seed'li sentetik
 * seriden gelir (lead motoru 30 günden geriye üretim yapmaz).
 */

import type { Kpi } from "@/lib/types/agent-data";
import { pick, type Lang } from "@/lib/i18n/core";
import { formatRatePct } from "@/lib/utils/format";
import { Rng } from "./seeded-random";
import {
  achieverBonusPct,
  teamLeaderCommission,
  TL_ACHIEVER_MULTIPLIERS,
  TL_ACHIEVER_THRESHOLD_EUR,
  TL_MIN_PER_AGENT_EUR,
  TL_QUARTERLY_BANDS,
  TL_QUOTA_EUR,
  type QuarterKey,
} from "./commission";
import {
  CURRENT_MONTH_INDEX,
  CURRENT_QUARTER,
  DAY_OF_MONTH,
  DAYS_IN_MONTH,
  MONTHS_ELAPSED_IN_QUARTER,
} from "./agent-earnings";
import { TEAM_AGENTS } from "./team-data";

/** Sentetik geçmiş ay serisi için sabit seed. */
const TEAM_EARNINGS_SEED = 20_260_717;

const MONTH_START = Date.parse(
  `2026-${String(CURRENT_MONTH_INDEX + 1).padStart(2, "0")}-01T00:00:00+03:00`,
);

export const AGENT_COUNT = TEAM_AGENTS.length;

/* ------------------------------------------------------------------ */
/* BU AY — takım satışı ve agent bazlı gerçekleşme                     */
/* ------------------------------------------------------------------ */

export interface TeamAgentSales {
  agentId: string;
  name: string;
  salesEUR: number;
  /** TL_ACHIEVER_THRESHOLD_EUR üstünde mi (çeyreklik çarpanı besler). */
  isAchiever: boolean;
  /** TL_MIN_PER_AGENT_EUR koşulunu sağlıyor mu. */
  meetsMinimum: boolean;
}

export const TEAM_AGENT_SALES: TeamAgentSales[] = TEAM_AGENTS.map((agent) => {
  const salesEUR = agent.leads
    .filter((l) => l.paymentAt !== null && l.paymentAt >= MONTH_START)
    .reduce((s, l) => s + (l.dealAmount ?? 0), 0);
  return {
    agentId: agent.id,
    name: agent.name,
    salesEUR,
    isAchiever: salesEUR >= TL_ACHIEVER_THRESHOLD_EUR,
    meetsMinimum: salesEUR >= TL_MIN_PER_AGENT_EUR,
  };
}).sort((a, b) => b.salesEUR - a.salesEUR);

export const MONTH_TEAM_SALES_EUR = TEAM_AGENT_SALES.reduce(
  (s, a) => s + a.salesEUR,
  0,
);

export const ACHIEVER_COUNT = TEAM_AGENT_SALES.filter((a) => a.isAchiever).length;

/** Mevcut tempoyla ay sonu takım satışı projeksiyonu (€). */
export const MONTH_TEAM_FORECAST_EUR = Math.round(
  (MONTH_TEAM_SALES_EUR / DAY_OF_MONTH) * DAYS_IN_MONTH,
);

/* ------------------------------------------------------------------ */
/* ÇEYREK — içinde bulunulan ay gerçek, diğerleri sentetik/projeksiyon */
/* ------------------------------------------------------------------ */

/**
 * Çeyreğin geçmiş ayları için sentetik takım satışı. Agent başına
 * €12.000-€19.000 bandında gerçekçi bir dağılım üretir (Excel tablosunun
 * "Monthly Sales Per Agent" aralığı).
 */
const priorQuarterMonthsSalesEUR: number = (() => {
  const priorMonthCount = MONTHS_ELAPSED_IN_QUARTER - 1;
  if (priorMonthCount <= 0) return 0;
  const rng = new Rng(TEAM_EARNINGS_SEED);
  let total = 0;
  for (let i = 0; i < priorMonthCount; i++) {
    const perAgent = rng.range(13_000, 17_500);
    total += Math.round((perAgent * AGENT_COUNT) / 50) * 50;
  }
  return total;
})();

/** Çeyrek başından bugüne takım toplamı (€). */
export const QUARTER_TEAM_SALES_EUR =
  priorQuarterMonthsSalesEUR + MONTH_TEAM_SALES_EUR;

export const TEAM_QUARTER: QuarterKey = CURRENT_QUARTER;

/* ------------------------------------------------------------------ */
/* KOMİSYON SONUCU                                                     */
/* ------------------------------------------------------------------ */

export const TL_COMMISSION = teamLeaderCommission({
  quarter: TEAM_QUARTER,
  monthlyTeamSalesEUR: MONTH_TEAM_SALES_EUR,
  agentCount: AGENT_COUNT,
  quarterTeamSalesEUR: QUARTER_TEAM_SALES_EUR,
  monthsElapsed: MONTHS_ELAPSED_IN_QUARTER,
  achieverCount: ACHIEVER_COUNT,
});

/** Ay sonu projeksiyonuyla aylık komisyon (€) — "tempoyu korursan". */
export const TL_FORECAST_MONTHLY_COMMISSION_EUR = (() => {
  const overQuota = Math.max(0, MONTH_TEAM_FORECAST_EUR - TL_QUOTA_EUR[TEAM_QUARTER]);
  return TL_COMMISSION.conditionMet ? Math.round(overQuota * 2) / 100 : 0;
})();

/** Kotaya kalan tutar (€) — kota aşılmışsa 0. */
export const TL_GAP_TO_QUOTA_EUR = Math.max(
  0,
  TL_QUOTA_EUR[TEAM_QUARTER] - MONTH_TEAM_SALES_EUR,
);

/** Sıradaki çeyrek dilimine geçmek için agent başına gereken ek satış (€). */
export const TL_GAP_TO_NEXT_PER_AGENT_EUR =
  TL_COMMISSION.nextBand === null
    ? 0
    : Math.round(TL_COMMISSION.gapToNextEUR / Math.max(1, AGENT_COUNT));

/**
 * ACHIEVER ÇARPANI MERDİVENİ — TL için en gerçek kaldıraç.
 *
 * Takım hacmi çeyreklik oran tablosunun üst bandını çoktan yakalamış olsa bile
 * (bkz. TEAM_TIER_STEPS), çarpan tarafında hâlâ kazanılacak yer olabilir:
 * eşiği geçen agent sayısı 7+/10+/12+ olduğunda çarpan %10/%15/%20 olur.
 * Bu yüzden "kaç agent daha eşiği geçmeli" sorusu TL'nin aksiyon başlığıdır.
 */
export interface AchieverTier {
  minAgents: number;
  bonusPct: number;
  /** Bu kademeye ulaşmak için eşiği geçmesi gereken ek agent sayısı. */
  agentsNeeded: number;
  /** Bu kademeye çıkılırsa çeyreklik toplam (€). */
  quarterlyTotalEUR: number;
}

export const NEXT_ACHIEVER_TIER: AchieverTier | null = (() => {
  // Kademeler artan sırada gezilir; ilk yakalanmayan kademe hedeftir.
  const ascending = [...TL_ACHIEVER_MULTIPLIERS].sort((a, b) => a.minAgents - b.minAgents);
  const target = ascending.find((tier) => ACHIEVER_COUNT < tier.minAgents);
  if (!target) return null;
  const bonusEUR =
    Math.round(TL_COMMISSION.quarterlyCommissionEUR * target.bonusPct) / 100;
  return {
    minAgents: target.minAgents,
    bonusPct: target.bonusPct,
    agentsNeeded: target.minAgents - ACHIEVER_COUNT,
    quarterlyTotalEUR:
      Math.round((TL_COMMISSION.quarterlyCommissionEUR + bonusEUR) * 100) / 100,
  };
})();

/**
 * Eşiğin hemen altındaki agent'lar — "kimi itersen çarpan yükselir" listesi.
 * Eşiğe en yakın olandan başlar; yalnızca eşiği geçmemiş olanlar.
 */
export const AGENTS_BELOW_THRESHOLD: TeamAgentSales[] = TEAM_AGENT_SALES.filter(
  (a) => !a.isAchiever,
).sort((a, b) => b.salesEUR - a.salesEUR);

/** Eşiğe ulaşmak için gereken tutar (€) — agent bazlı. */
export function gapToThresholdEUR(salesEUR: number): number {
  return Math.max(0, TL_ACHIEVER_THRESHOLD_EUR - salesEUR);
}

/** Merdiven adımı — TL çeyreklik oran tablosu. */
export interface TeamTierStep {
  monthlyAvgEUR: number;
  ratePct: number;
  reached: boolean;
  isCurrent: boolean;
  isNext: boolean;
  /** Bu dilime ulaşmak için gereken ek TAKIM satışı (€). */
  gapEUR: number;
}

export const TEAM_TIER_STEPS: TeamTierStep[] = (() => {
  const months = Math.max(1, Math.min(3, MONTHS_ELAPSED_IN_QUARTER));
  const avg = TL_COMMISSION.perAgentMonthlyAvgEUR;
  const currentRate = TL_COMMISSION.quarterlyRatePct;
  const nextThreshold = TL_COMMISSION.nextBand?.monthlyAvgEUR ?? null;

  return TL_QUARTERLY_BANDS.map((band) => {
    const reached = avg >= band.monthlyAvgEUR;
    return {
      monthlyAvgEUR: band.monthlyAvgEUR,
      ratePct: band.ratePct,
      reached,
      // Koşul sağlanmadıysa "mevcut dilim" vurgusu yapılmaz.
      isCurrent:
        TL_COMMISSION.conditionMet && reached && band.ratePct === currentRate,
      isNext: nextThreshold !== null && band.monthlyAvgEUR === nextThreshold,
      gapEUR: reached
        ? 0
        : Math.max(
            0,
            Math.round(band.monthlyAvgEUR * months * AGENT_COUNT - QUARTER_TEAM_SALES_EUR),
          ),
    };
  });
})();

/* ------------------------------------------------------------------ */
/* KPI kartları                                                        */
/* ------------------------------------------------------------------ */

export function teamLeaderEarningsKpis(lang: Lang = "tr"): Kpi[] {
  const c = TL_COMMISSION;
  return [
    {
      id: "tl-monthly-commission",
      label: pick(lang, "Bu Ay Aylık Komisyon", "Monthly Commission This Month"),
      format: "currency",
      value: c.monthlyCommissionEUR,
      accent: "brand",
      icon: "banknote",
      hint: pick(
        lang,
        `kota üstü ${Math.round(c.overQuotaEUR).toLocaleString("tr-TR")} € × %2`,
        `${Math.round(c.overQuotaEUR).toLocaleString("en-US")} € over quota × 2%`,
      ),
    },
    {
      id: "tl-quarterly-commission",
      label: pick(lang, "Çeyreklik Komisyon", "Quarterly Commission"),
      format: "currency",
      value: c.quarterlyTotalEUR,
      accent: "violet",
      icon: "trending-up",
      hint: pick(
        lang,
        `${formatRatePct(c.quarterlyRatePct)} dilim${c.achieverBonusPct > 0 ? ` + ${formatRatePct(c.achieverBonusPct)} çarpan` : ""}`,
        `${c.quarterlyRatePct}% tier${c.achieverBonusPct > 0 ? ` + ${c.achieverBonusPct}% multiplier` : ""}`,
      ),
    },
    {
      id: "tl-per-agent-avg",
      label: pick(lang, "Agent Başına Ortalama", "Average Per Agent"),
      format: "currency",
      value: Math.round(c.perAgentMonthlyAvgEUR),
      accent: "indigo",
      status: c.conditionMet ? "success" : "risk",
      icon: "users",
      hint: pick(
        lang,
        `koşul: min. ${TL_MIN_PER_AGENT_EUR.toLocaleString("tr-TR")} €`,
        `condition: min. ${TL_MIN_PER_AGENT_EUR.toLocaleString("en-US")} €`,
      ),
    },
    {
      id: "tl-achievers",
      label: pick(lang, "Eşiği Geçen Agent", "Agents Over Threshold"),
      format: "ratio",
      value: ACHIEVER_COUNT,
      denominator: AGENT_COUNT,
      accent: "brand-secondary",
      icon: "badge-check",
      hint: pick(
        lang,
        `${TL_ACHIEVER_THRESHOLD_EUR.toLocaleString("tr-TR")} € üstü · ${formatRatePct(achieverBonusPct(ACHIEVER_COUNT))} çarpan`,
        `over ${TL_ACHIEVER_THRESHOLD_EUR.toLocaleString("en-US")} € · ${achieverBonusPct(ACHIEVER_COUNT)}% multiplier`,
      ),
    },
  ];
}
