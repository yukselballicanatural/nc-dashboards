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

/* Türetilmiş tüm veri setleri (seed'li motor) */
export {
  LEADS,
  DAILY_KPIS,
  HOURLY_TODAY,
  MINI_FUNNEL,
  ACTION_CENTER,
  HERO_STATS,
  INSIGHTS,
  CALL_KPIS_30D,
  DAILY_TREND_14D,
  HOURLY_REACH_TODAY,
  SPEED_TO_LEAD,
  CALLBACKS,
  CALL_GAUGES,
  FULL_FUNNEL,
  SOURCE_CONVERSION,
  COUNTRY_CONVERSION,
  LANGUAGE_CONVERSION,
  GOAL,
  TARGET_KPIS,
  TARGET_PACE,
  MONTHLY_TARGET_EUR,
  QUALITY_TREND,
  QUALITY_KPIS,
  SHIFT_WEEK,
  SHIFT_KPIS,
  FOLLOW_UP_ROWS,
  MOCK_DATE_LABEL,
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
export const TEAM_COMPARISON: ComparisonMetric[] = [
  { key: "connection-rate", label: "Ulaşım Oranı", minePct: 43.0, teamPct: 42.6 },
  { key: "sla-rate", label: "SLA Uyumlu Rate", minePct: 86.5, teamPct: 76.6 },
];
