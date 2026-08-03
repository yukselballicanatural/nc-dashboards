/**
 * ŞİRKET KIYASLAMA MOTORU — agent'ın Offer/Deal/Paid sayılarını hem KENDİ
 * TAKIMINA hem ŞİRKET GENELİNE göre kıyaslar.
 *
 * Algoritma (kullanıcı talebi — birebir): şirket ortalaması = Toplam metrik ÷
 * Toplam agent sayısı. Bu dosyada "toplam agent" `REGION_TEAM_RECORDS`teki
 * ~130 danışmandır — uygulamanın modellediği TEK çapraz-takım roster (Bölge
 * Müdürü panelinin veri kaynağı, 10 takım). Gerçek şirket İstanbul+Fas
 * bölgelerinden oluşur (bkz. commission.ts) ama Fas için ayrı bir roster
 * üretilmemiştir; bu yüzden "şirket" burada mock'un kapsadığı tüm danışman
 * havuzu anlamına gelir. Fas roster'ı eklendiğinde bu dosyanın tek değişmesi
 * gereken yeri `COMPANY_AGENTS` kaynağıdır.
 *
 * Dönem: sabit "tüm veri" penceresi (agent panelindeki GOAL/TARGET_PACE ile
 * aynı mantık) — lead motoru zaten yalnızca 30 gün geriye ürettiği için bu,
 * pratikte agent'ın ürettiği TÜM lead geçmişidir; sayfadaki tarih filtresinden
 * bağımsızdır (kıyaslama tabanı sabit kalmalı, agent filtre değiştirdikçe
 * oynamamalı).
 */

import type { AgentPeriodSummary } from "@/lib/types/team-data";
import { pick, type Lang } from "@/lib/i18n/core";
import { DAY, MOCK_NOW } from "./lead-engine";
import { REGION_TEAM_RECORDS } from "./region-data";
import { summarizeAgent } from "./team-compute";
import { AGENT_PROFILE } from "./mock-data";
import { TEAM_NAME } from "./team-roster";

const COMPANY_START_MS = MOCK_NOW - 30 * DAY;
const COMPANY_END_MS = MOCK_NOW;

export interface CompanyAgentRow extends AgentPeriodSummary {
  teamId: string;
  teamName: string;
}

/** Şirket geneli — her danışman TEK KEZ, modül yüklenirken hesaplanır. */
export const COMPANY_AGENTS: CompanyAgentRow[] = REGION_TEAM_RECORDS.flatMap((team) =>
  team.agents.map((agent) => {
    const { summary } = summarizeAgent(agent, COMPANY_START_MS, COMPANY_END_MS);
    return { ...summary, teamId: team.teamId, teamName: team.teamName };
  }),
);

export const COMPANY_AGENT_COUNT = COMPANY_AGENTS.length;

/** Bu agent'ın kıyaslamada kullanılacak kimliği — Agent panelinin referans profili. */
export const BENCHMARK_AGENT_ID = AGENT_PROFILE.id;
export const BENCHMARK_TEAM_ID = "team-aamir-ali";
export const BENCHMARK_TEAM_NAME = TEAM_NAME;

function sumBy(fn: (a: CompanyAgentRow) => number): number {
  return COMPANY_AGENTS.reduce((s, a) => s + fn(a), 0);
}

export type BenchmarkMetric = "offers" | "deals" | "paidDeals";

export const BENCHMARK_METRICS: readonly BenchmarkMetric[] = ["offers", "deals", "paidDeals"];

export function metricLabel(metric: BenchmarkMetric, lang: Lang = "tr"): string {
  switch (metric) {
    case "offers":
      return pick(lang, "Offer", "Offers");
    case "deals":
      return pick(lang, "Deal", "Deals");
    case "paidDeals":
      return pick(lang, "Paid (Ödemesi Alınan)", "Paid (Payment Received)");
  }
}

/** Toplam ve şirket ortalaması — istenen algoritma: Toplam / Toplam agent sayısı. */
export const COMPANY_TOTALS: Record<BenchmarkMetric, number> = {
  offers: sumBy((a) => a.offers),
  deals: sumBy((a) => a.deals),
  paidDeals: sumBy((a) => a.paidDeals),
};

export const COMPANY_AVERAGE: Record<BenchmarkMetric, number> = {
  offers: COMPANY_TOTALS.offers / COMPANY_AGENT_COUNT,
  deals: COMPANY_TOTALS.deals / COMPANY_AGENT_COUNT,
  paidDeals: COMPANY_TOTALS.paidDeals / COMPANY_AGENT_COUNT,
};

/** Dağılım özeti — detay sayfasındaki histogram/analiz için. */
export interface MetricDistribution {
  min: number;
  max: number;
  median: number;
  p75: number;
  p90: number;
  /** Değer → o değere sahip (veya daha az) agent sayısı kovaları — basit histogram. */
  buckets: Array<{ rangeLabel: string; count: number; containsAgent: boolean }>;
}

function percentileOf(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.ceil((p / 100) * sortedAsc.length) - 1);
  return sortedAsc[Math.max(0, idx)];
}

function buildDistribution(metric: BenchmarkMetric, agentValue: number): MetricDistribution {
  const values = COMPANY_AGENTS.map((a) => a[metric]).sort((a, b) => a - b);
  const min = values[0] ?? 0;
  const max = values[values.length - 1] ?? 0;
  const bucketCount = 6;
  const span = Math.max(1, max - min);
  const step = span / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const lo = min + i * step;
    const hi = i === bucketCount - 1 ? max : min + (i + 1) * step;
    const count = values.filter((v) => (i === bucketCount - 1 ? v >= lo && v <= hi : v >= lo && v < hi)).length;
    return {
      rangeLabel: `${Math.round(lo)}–${Math.round(hi)}`,
      count,
      containsAgent: agentValue >= lo && (i === bucketCount - 1 ? agentValue <= hi : agentValue < hi),
    };
  });
  return {
    min,
    max,
    median: percentileOf(values, 50),
    p75: percentileOf(values, 75),
    p90: percentileOf(values, 90),
    buckets,
  };
}

export interface MetricBenchmark {
  metric: BenchmarkMetric;
  agentValue: number;
  teamAverage: number;
  companyAverage: number;
  /** Agent değerinin takım ortalamasından farkı (%). Ortalama 0 ise 0. */
  vsTeamPct: number;
  /** Agent değerinin şirket ortalamasından farkı (%). Ortalama 0 ise 0. */
  vsCompanyPct: number;
  companyRank: number;
  companyTotal: number;
  /** 0-100 — kaç agent'ı geride bıraktığının yüzdesi (100 = en iyi). */
  companyPercentile: number;
  teamRank: number;
  teamTotal: number;
  distribution: MetricDistribution;
}

function computeBenchmark(metric: BenchmarkMetric): MetricBenchmark {
  const companyDesc = [...COMPANY_AGENTS].sort((a, b) => b[metric] - a[metric]);
  const companyIdx = companyDesc.findIndex((a) => a.agentId === BENCHMARK_AGENT_ID);
  const agentValue = companyIdx >= 0 ? companyDesc[companyIdx][metric] : 0;
  const companyTotal = companyDesc.length;
  const companyRank = companyIdx >= 0 ? companyIdx + 1 : companyTotal;
  const companyPercentile =
    companyTotal > 1
      ? Math.round(((companyTotal - companyRank) / (companyTotal - 1)) * 1000) / 10
      : 100;

  const teamAgents = COMPANY_AGENTS.filter((a) => a.teamId === BENCHMARK_TEAM_ID).sort(
    (a, b) => b[metric] - a[metric],
  );
  const teamIdx = teamAgents.findIndex((a) => a.agentId === BENCHMARK_AGENT_ID);
  const teamTotal = teamAgents.length;
  const teamRank = teamIdx >= 0 ? teamIdx + 1 : teamTotal;
  const teamAverage = teamAgents.reduce((s, a) => s + a[metric], 0) / Math.max(1, teamTotal);
  const companyAverage = COMPANY_AVERAGE[metric];

  return {
    metric,
    agentValue,
    teamAverage,
    companyAverage,
    vsTeamPct: teamAverage > 0 ? Math.round(((agentValue - teamAverage) / teamAverage) * 1000) / 10 : 0,
    vsCompanyPct:
      companyAverage > 0 ? Math.round(((agentValue - companyAverage) / companyAverage) * 1000) / 10 : 0,
    companyRank,
    companyTotal,
    companyPercentile,
    teamRank,
    teamTotal,
    distribution: buildDistribution(metric, agentValue),
  };
}

/** Agent panelinin referans profili için hazır kıyaslama sonuçları. */
export const AGENT_BENCHMARKS: Record<BenchmarkMetric, MetricBenchmark> = {
  offers: computeBenchmark("offers"),
  deals: computeBenchmark("deals"),
  paidDeals: computeBenchmark("paidDeals"),
};
