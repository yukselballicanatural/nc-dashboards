/**
 * Takım Lideri veri tipleri — CLAUDE.md Bölüm 9'da kararlaştırılan 5 sekme
 * (Takım Özeti, Agent Karşılaştırması, Saatlik Aktivite, Funnel & Backlog,
 * Aksiyon Merkezi) için. Agent'a özel `agent-data.ts` tiplerini genişletir,
 * karıştırmaz — bkz. o dosyanın başındaki not.
 */

import type {
  ConversionRow,
  DailyTrendPoint,
  HourlyCallPoint,
  Kpi,
  StatusLevel,
} from "./agent-data";

export interface TeamAgentProfile {
  id: string;
  name: string;
  role: "Senior" | "Junior";
}

/**
 * Bir agent'ın seçili dönem için özet metrikleri + kompozit Genel Başarı
 * puanı. Ham metrikler (calls/answered/... ) `computePeriod` ile birebir
 * aynı tanımlardan gelir — Agent panelinde görülen sayılarla bu panelde
 * görülenler arasında tanım farkı olmaz.
 */
export interface AgentPeriodSummary {
  agentId: string;
  name: string;
  role: "Senior" | "Junior";
  leads: number;
  neverCalled: number;
  calls: number;
  answered: number;
  answerRatePct: number;
  slaCompliantPct: number;
  contacts: number;
  offers: number;
  deals: number;
  paymentsEUR: number;
  /** Deal (Won + In Progress) / Lead — compute.ts'teki "Deal" funnel tanımıyla aynı. */
  leadToDealPct: number;
  /** Dönemde ödemesi alınan tutar / aylık hedef (%, 100'de cap yok — ham). */
  targetPct: number;
  /** Kompozit Genel Başarı puanı (0-100) — bkz. computeCompositeScore. */
  score: number;
  scoreStatus: StatusLevel;
}

export interface HourlyHeatmapCell {
  hour: string;
  total: number;
  answered: number;
  ratePct: number | null;
}

export interface HourlyHeatmapRow {
  agentId: string;
  name: string;
  cells: HourlyHeatmapCell[];
}

export interface TeamFunnelAgentSlice {
  agentId: string;
  name: string;
  count: number;
}

export interface TeamFunnelStage {
  key: string;
  label: string;
  total: number;
  prevPct: number | null;
  byAgent: TeamFunnelAgentSlice[];
}

export interface BacklogRow {
  agentId: string;
  name: string;
  neverCalled: number;
  slaViolations: number;
  pendingOffers: number;
  overdueFollowUps: number;
}

export interface TeamActionItem {
  id: string;
  agentId: string;
  agentName: string;
  label: string;
  status: StatusLevel;
  href: string;
}

/** Kural-tabanlı tavsiye satırı — v2 fazında yapay zeka ile otomatikleşecek. */
export interface TeamInsight {
  id: string;
  tone: StatusLevel;
  icon: string;
  text: string;
}

/** Performans katmanı dağılımı — kaç agent hangi başarı bandında. */
export interface TierDistribution {
  key: StatusLevel;
  label: string;
  count: number;
  /** Bu banttaki agent isimleri (rozet/tooltip için). */
  names: string[];
}

/** Bir metrikte lider agent — "kim neyin en iyisi" kartları için. */
export interface DimensionLeader {
  key: string;
  label: string;
  icon: string;
  accent: "brand" | "brand-secondary" | "indigo" | "violet";
  agentName: string;
  /** Biçimlendirilmiş değer (örn. "%86", "1.284", "12.480 €"). */
  valueText: string;
}

/** SLA vs dönüşüm dağılım noktası — quadrant grafiği. */
export interface AgentScatterPoint {
  agentId: string;
  name: string;
  slaCompliantPct: number;
  leadToDealPct: number;
  calls: number;
  score: number;
}

/** Senior/Junior kırılımı — ortalama metrikler. */
export interface RoleBreakdownRow {
  role: "Senior" | "Junior";
  agentCount: number;
  avgScore: number;
  avgSlaPct: number;
  avgAnswerRatePct: number;
  totalDeals: number;
  totalPaymentsEUR: number;
}

/** Backlog kategori toplamları — özet kartları. */
export interface BacklogTotals {
  neverCalled: number;
  slaViolations: number;
  pendingOffers: number;
  overdueFollowUps: number;
}

/* ------------------------------------------------------------------ */
/* Zoho dashboard'larından türetilen ek analizler (sade karşılıklar)   */
/* ------------------------------------------------------------------ */

/** "Neden kaybediyoruz?" — sonuç/kayıp nedeni satırı (Zoho: Sales Opp. Result). */
export interface LossReasonRow {
  key: string;
  label: string;
  count: number;
  /** Toplam sonuçlanmış içindeki yüzde. */
  pct: number;
  tone: StatusLevel;
}

/** Bekleme (yanıt) süresi bandı — Zoho: Waiting Time Distribution. */
export interface WaitingBucket {
  key: string;
  label: string;
  count: number;
  tone: StatusLevel;
}

export interface ResponseSpeedLeader {
  agentId: string;
  name: string;
  avgMin: number;
}

/** Yanıt hızı özeti — Zoho "Lead Yanıt & Agent Perf." sadeleştirilmiş hali. */
export interface ResponseSpeed {
  buckets: WaitingBucket[];
  medianMin: number;
  avgMin: number;
  slaCompliantPct: number;
  fastest: ResponseSpeedLeader[];
  slowest: ResponseSpeedLeader[];
}

/** Arama hedef gerçekleşme satırı — Zoho: Calls Dashboard (target vs actual). */
export interface CallRealizationRow {
  agentId: string;
  name: string;
  calls: number;
  callTarget: number;
  callPct: number;
  talkMin: number;
  durationTargetMin: number;
  durationPct: number;
  tone: StatusLevel;
}

/** Fırsat statü dağılımı satırı — Zoho: Agent Deal & Opportunity Overview. */
export interface OppStageRow {
  key: string;
  label: string;
  count: number;
  amountEUR: number;
  accent: "brand" | "brand-secondary" | "indigo" | "violet";
}

/** Sıralama & kazanç satırı — Zoho: Rank (kıdem + finansallar). */
export interface AgentEarningRow {
  agentId: string;
  name: string;
  role: "Senior" | "Junior";
  tenureLabel: string;
  score: number;
  scoreStatus: StatusLevel;
  deals: number;
  paidEUR: number;
  prepaymentEUR: number;
  offerAmountEUR: number;
  flightTickets: number;
}

/** Günlük yeni lead matrisi — Zoho: Today Lead (agent × gün). */
export interface DailyLeadRow {
  agentId: string;
  name: string;
  cells: { day: string; count: number }[];
  total: number;
}

/** Takım geri-arama listesi — Zoho: CloudTalk CallBack. */
export interface TeamCallbackRow {
  id: string;
  agentName: string;
  contactName: string;
  phone: string;
  dateISO: string;
  overdue: boolean;
}

/** Asistan maddesi — sade dille tek bir bulgu/öneri. */
export interface AssistantPoint {
  tone: StatusLevel;
  icon: string;
  title: string;
  text: string;
}

/**
 * Takım Asistanı brifingi — kural-tabanlı (V2'de gerçek AI). Veriyi takım
 * liderinin anlayacağı düz dile çevirir: tek cümlelik genel durum + öncelikli
 * maddeler.
 */
export interface AssistantBrief {
  /** Kısa genel durum başlığı (ör. "Takımın bu dönem iyi gidiyor"). */
  headline: string;
  tone: StatusLevel;
  /** 1-2 cümlelik özet. */
  summary: string;
  points: AssistantPoint[];
}

export interface TeamPeriodData {
  teamKpis: Kpi[];
  /** Lead→Contact, Contact→Offer, Offer→Deal takım dönüşüm oranları (KPI). */
  conversionRates: Kpi[];
  /** Takım cirosu / (aylık hedef × agent sayısı) — %, cap yok (ham). */
  targetPct: number;
  /** Takımın toplam aylık hedefi (€) — aylık hedef × agent sayısı. */
  targetEUR: number;
  /** Seçili aralıkta takımın topladığı ödeme tutarı (€). */
  actualEUR: number;
  /** Skora göre azalan sıralı — tüm takım. */
  agents: AgentPeriodSummary[];
  best5: AgentPeriodSummary[];
  worst5: AgentPeriodSummary[];
  heatmap: HourlyHeatmapRow[];
  /** Takım geneli saat-of-day toplamı (tüm agent'lar) — sütun grafik. */
  hourlyAggregate: HourlyCallPoint[];
  /** Takım geneli günlük arama trendi (tüm agent'lar toplamı). */
  dailyTrend: DailyTrendPoint[];
  funnel: TeamFunnelStage[];
  sourceConversion: ConversionRow[];
  countryConversion: ConversionRow[];
  languageConversion: ConversionRow[];
  tierDistribution: TierDistribution[];
  dimensionLeaders: DimensionLeader[];
  scatter: AgentScatterPoint[];
  roleBreakdown: RoleBreakdownRow[];
  backlog: BacklogRow[];
  backlogTotals: BacklogTotals;
  actionCenter: TeamActionItem[];
  insights: TeamInsight[];
  /* --- Zoho'dan türetilen ek analizler --- */
  lossReasons: LossReasonRow[];
  responseSpeed: ResponseSpeed;
  callRealization: CallRealizationRow[];
  oppStages: OppStageRow[];
  agentEarnings: AgentEarningRow[];
  dailyLeadMatrix: DailyLeadRow[];
  teamCallbacks: TeamCallbackRow[];
  assistant: AssistantBrief;
}
