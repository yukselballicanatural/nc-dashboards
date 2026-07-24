/**
 * Bölge Müdürü veri tipleri. Takım Lideri tiplerini (team-data.ts) ve temel
 * agent tiplerini genişletir; hiyerarşi: Bölge → Takımlar → danışmanlar.
 */

import type {
  ConversionRow,
  DailyTrendPoint,
  Kpi,
  StatusLevel,
} from "./agent-data";
import type { AgentPeriodSummary, TeamInsight } from "./team-data";

/** Bir takımın bölge içindeki dönem özeti. */
export interface TeamSummary {
  teamId: string;
  teamName: string;
  teamLeaderName: string;
  agentCount: number;
  leads: number;
  calls: number;
  answered: number;
  answerRatePct: number;
  slaCompliantPct: number;
  contacts: number;
  offers: number;
  deals: number;
  paymentsEUR: number;
  leadToDealPct: number;
  targetPct: number;
  /** Takım skoru = üye agent skorlarının ortalaması (TL paneliyle tutarlı). */
  avgScore: number;
  scoreStatus: StatusLevel;
  neverCalled: number;
  slaViolations: number;
  pendingOffers: number;
  overdueFollowUps: number;
}

/** Bölge genelinde bir danışman — takım bilgisiyle zenginleştirilmiş özet. */
export interface RegionAgentSummary extends AgentPeriodSummary {
  teamId: string;
  teamName: string;
}

/** Bölge funnel aşaması — takım kırılımıyla. */
export interface RegionFunnelStage {
  key: string;
  label: string;
  total: number;
  prevPct: number | null;
  byTeam: Array<{ teamId: string; teamName: string; count: number }>;
}

/** Bölge geneli aksiyon/risk satırı. */
export interface RegionActionItem {
  id: string;
  teamId: string;
  teamName: string;
  label: string;
  status: StatusLevel;
}

/** Takım bazlı backlog özeti. */
export interface TeamBacklogRow {
  teamId: string;
  teamName: string;
  neverCalled: number;
  slaViolations: number;
  pendingOffers: number;
  overdueFollowUps: number;
}

export interface RegionPeriodData {
  regionKpis: Kpi[];
  conversionRates: Kpi[];
  targetPct: number;
  targetEUR: number;
  actualEUR: number;
  /** Skora göre azalan sıralı — tüm takımlar. */
  teams: TeamSummary[];
  bestTeam: TeamSummary | null;
  worstTeam: TeamSummary | null;
  /** Bölge genelindeki tüm danışmanlar, skora göre sıralı. */
  agents: RegionAgentSummary[];
  best5Agents: RegionAgentSummary[];
  worst5Agents: RegionAgentSummary[];
  dailyTrend: DailyTrendPoint[];
  funnel: RegionFunnelStage[];
  sourceConversion: ConversionRow[];
  countryConversion: ConversionRow[];
  languageConversion: ConversionRow[];
  actionCenter: RegionActionItem[];
  backlogByTeam: TeamBacklogRow[];
  insights: TeamInsight[];
}
