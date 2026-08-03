/**
 * Mock veri cephesi — CLAUDE.md v2 Bölüm 5.
 * v2 ile birlikte statik sayılar kaldırıldı; tüm veri setleri seed'li lead
 * motorundan (lead-engine → datasets) TÜRETİLİR. Bileşenler yalnızca bu
 * modülden import eder; backend'e geçişte tek değişecek katman burasıdır.
 *
 * Referans profil (v2 5.5): Callum Ashford / Senior / Aamir Ali Team /
 * İstanbul — Connection ~%43, SLA ~%86,5, Genel Başarı 72,88, takımda 4.
 */

import type {
  ComparisonMetric,
  PersonProfile,
  RankInfo,
} from "@/lib/types/agent-data";
import type { Lang } from "@/lib/i18n/core";

/* Türetilmiş tüm veri setleri (seed'li motor).
 * NOT: Görünür metin taşıyanlar `lang` parametreli FONKSİYONdur (i18n) —
 * bkz. datasets.ts başındaki not. Salt sayısal/veri setleri sabit kalır. */
export {
  LEADS,
  dailyKpis,
  HOURLY_TODAY,
  miniFunnel,
  actionCenterItems,
  HERO_STATS,
  insightsList,
  callKpis30d,
  dailyTrend14d,
  HOURLY_REACH_TODAY,
  speedToLead,
  CALLBACKS,
  callGauges,
  fullFunnel,
  SOURCE_CONVERSION,
  COUNTRY_CONVERSION,
  LANGUAGE_CONVERSION,
  GOAL,
  targetKpis,
  TARGET_PACE,
  MONTHLY_TARGET_EUR,
  qualityTrend,
  qualityKpis,
  shiftWeek,
  shiftKpis,
  followUpRows,
  mockDateLabel,
} from "./datasets";

export { MOCK_NOW } from "./lead-engine";

/* ------------------------------------------------------------------ */
/* Profil + sıralama (v2 5.5 referans değerleri — sabit)                */
/* ------------------------------------------------------------------ */

export const AGENT_PROFILE: PersonProfile = {
  id: "agent-callum-ashford",
  name: "Callum Ashford",
  role: "Senior",
  team: "Aamir Ali Team",
  location: "İstanbul",
  startDateISO: "2025-11-10",
};

export const AGENT_RANK: RankInfo = {
  position: 4,
  totalAgents: 12,
  score: 72.88,
  teamName: "Aamir Ali Team",
};

/** "Sen vs Takım" — takım tarafı TL fazında gerçek veriye bağlanacak. */
export function teamComparison(lang: Lang = "tr"): ComparisonMetric[] {
  return [
    { key: "connection-rate", label: lang === "en" ? "Reach Rate" : "Ulaşım Oranı", minePct: 43.0, teamPct: 42.6 },
    { key: "sla-rate", label: lang === "en" ? "SLA Compliance Rate" : "SLA Uyumlu Rate", minePct: 86.5, teamPct: 76.6 },
  ];
}
