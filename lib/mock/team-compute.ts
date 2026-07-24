/**
 * Takım Lideri hesaplama katmanı — her agent'ın kendi lead dizisi
 * `computePeriod` (agent panelindeki AYNI fonksiyon) üzerinden geçirilir;
 * bu dosya yalnızca sonuçları birleştirir/sıralar/skorlar. Böylece "agent
 * panelinde görülen sayı" ile "TL panelinde görülen sayı" arasında asla
 * tanım farkı (mantık hatası) oluşmaz — tek hesaplama kaynağı vardır.
 */

import type {
  ConversionRow,
  DailyTrendPoint,
  HourlyCallPoint,
  Kpi,
  Lead,
  ResultReason,
  StatusLevel,
} from "@/lib/types/agent-data";
import type {
  AgentEarningRow,
  AgentPeriodSummary,
  AgentScatterPoint,
  AssistantBrief,
  AssistantPoint,
  BacklogRow,
  CallRealizationRow,
  DailyLeadRow,
  DimensionLeader,
  HourlyHeatmapRow,
  LossReasonRow,
  OppStageRow,
  ResponseSpeed,
  RoleBreakdownRow,
  TeamActionItem,
  TeamCallbackRow,
  TeamFunnelStage,
  TeamInsight,
  TeamPeriodData,
  TierDistribution,
  WaitingBucket,
} from "@/lib/types/team-data";
import { pick, type Lang } from "@/lib/i18n/core";
import { formatCurrencyEUR, formatNumber, formatPercent } from "@/lib/utils/format";
import { computePeriod } from "./compute";
import { MONTHLY_TARGET_EUR } from "./datasets";
import { MOCK_NOW, MINUTE, DAY } from "./lead-engine";
import { TEAM_AGENTS, type TeamAgentRecord } from "./team-data";

/* ---------------- Zoho-türevi analizler için yardımcılar ---------------- */

/** Agent id'sinden deterministik 0-1 kesir (mock hedef/finansal türetimleri). */
function hashFrac(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/** Sonuç/kayıp nedeni → sade etiket + ton. */
const REASON_META: Record<ResultReason, { tr: string; en: string; tone: StatusLevel }> = {
  Interested: { tr: "İlgileniyor (açık fırsat)", en: "Interested (open)", tone: "success" },
  "No Response": { tr: "Cevap alınamadı", en: "No response", tone: "warning" },
  "No Answer": { tr: "Telefona çıkmadı", en: "No answer", tone: "warning" },
  "Not Interested": { tr: "İlgilenmiyor", en: "Not interested", tone: "risk" },
  "Budget Issue": { tr: "Bütçesi yetersiz", en: "Budget issue", tone: "risk" },
  "Chose Another Provider": { tr: "Başka firmayı seçti", en: "Chose another provider", tone: "critical" },
  "Not Eligible": { tr: "Tedaviye uygun değil", en: "Not eligible", tone: "neutral" },
  "Language Barrier": { tr: "Dil engeli", en: "Language barrier", tone: "neutral" },
  "Wrong Contact Info": { tr: "Hatalı iletişim bilgisi", en: "Wrong contact info", tone: "neutral" },
  "Already Treated": { tr: "Zaten tedavi olmuş", en: "Already treated", tone: "neutral" },
};

function toneByRatio(pct: number): StatusLevel {
  if (pct >= 95) return "success";
  if (pct >= 80) return "warning";
  if (pct >= 60) return "risk";
  return "critical";
}

/** Aksiyon merkezi satırlarının önem sırası — en kritik en üstte. */
const STATUS_ORDER: Record<StatusLevel, number> = {
  critical: 0,
  risk: 1,
  warning: 2,
  neutral: 3,
  success: 4,
};

function kpiValue(kpis: Kpi[], id: string): number {
  return kpis.find((k) => k.id === id)?.value ?? 0;
}

/** Birden çok agent'ın ConversionRow listesini gruba göre birleştirir. */
export function mergeConversion(rowsList: ConversionRow[][]): ConversionRow[] {
  const groups = new Map<string, { leads: number; deals: number }>();
  for (const rows of rowsList) {
    for (const row of rows) {
      const entry = groups.get(row.group) ?? { leads: 0, deals: 0 };
      entry.leads += row.leads;
      entry.deals += row.deals;
      groups.set(row.group, entry);
    }
  }
  return [...groups.entries()]
    .map(([group, { leads, deals }]) => ({
      group,
      leads,
      deals,
      ratePct: leads > 0 ? Math.round((deals / leads) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 6);
}

const TIER_META: Array<{ key: StatusLevel; label: string; labelEn: string; min: number }> = [
  { key: "success", label: "Güçlü (≥85)", labelEn: "Strong (≥85)", min: 85 },
  { key: "warning", label: "İyi (65-84)", labelEn: "Good (65-84)", min: 65 },
  { key: "risk", label: "Gelişmeli (45-64)", labelEn: "Developing (45-64)", min: 45 },
  { key: "critical", label: "Kritik (<45)", labelEn: "Critical (<45)", min: 0 },
];

/**
 * Kompozit "Genel Başarı" puanının kıyas noktaları — her bileşen kendi
 * hedefine göre 0-100'e normalize edilir (RadialGauge'daki gaugeStatus ile
 * aynı "hedefe oran" mantığı), sonra eşit ağırlıkla (%25) ortalanır. Farklı
 * doğal ölçeklere sahip metrikleri (örn. dönüşüm oranı ~%10-20 iken SLA
 * ~%80-90) doğrudan ortalamak yanıltıcı olurdu; bu yüzden normalize edilir.
 */
const SCORE_BENCHMARKS = {
  sla: 85, // hedef SLA uyum oranı (%)
  connection: 50, // hedef kişi ulaşım oranı (%)
  dealConv: 18, // hedef lead→deal dönüşüm oranı (%)
  target: 100, // hedef gerçekleşme zaten yüzde
} as const;

function toComponentScore(actual: number, benchmark: number): number {
  if (benchmark <= 0) return 0;
  return Math.min(100, Math.max(0, (actual / benchmark) * 100));
}

export function computeCompositeScore(parts: {
  slaPct: number;
  connectionPct: number;
  leadToDealPct: number;
  targetPct: number;
}): number {
  const sla = toComponentScore(parts.slaPct, SCORE_BENCHMARKS.sla);
  const connection = toComponentScore(parts.connectionPct, SCORE_BENCHMARKS.connection);
  const dealConv = toComponentScore(parts.leadToDealPct, SCORE_BENCHMARKS.dealConv);
  const target = toComponentScore(parts.targetPct, SCORE_BENCHMARKS.target);
  return Math.round(((sla + connection + dealConv + target) / 4) * 100) / 100;
}

export function scoreStatus(score: number): StatusLevel {
  if (score >= 85) return "success";
  if (score >= 65) return "warning";
  if (score >= 45) return "risk";
  return "critical";
}

/**
 * Bir agent'ın dönem özetini (+ ham period verisini) üretir. Team ve Region
 * katmanları AYNI fonksiyonu kullanır → skor/metrik tanımı tek yerdedir.
 */
export function summarizeAgent(
  record: TeamAgentRecord,
  startMs: number,
  endMs: number,
  lang: Lang = "tr",
) {
  const period = computePeriod(record.leads, startMs, endMs, lang);
  const dealStage = period.fullFunnel.find((s) => s.key === "deal");
  const slaGauge = period.gauges.find((g) => g.key === "sla");
  const connectionPct = kpiValue(period.callKpis, "person-reach");
  const slaPct = slaGauge?.valuePct ?? 0;
  const leadToDealPct = dealStage?.leadPct ?? 0;

  const score = computeCompositeScore({
    slaPct,
    connectionPct,
    leadToDealPct,
    targetPct: period.targetPct,
  });

  const summary: AgentPeriodSummary = {
    agentId: record.id,
    name: record.name,
    role: record.role,
    leads: kpiValue(period.overviewKpis, "leads"),
    neverCalled: period.backlog.neverCalled,
    calls: kpiValue(period.overviewKpis, "calls"),
    answered: kpiValue(period.overviewKpis, "answered"),
    answerRatePct: period.answerRatePct,
    slaCompliantPct: slaPct,
    contacts: kpiValue(period.overviewKpis, "contacts"),
    offers: kpiValue(period.overviewKpis, "offers"),
    deals: kpiValue(period.overviewKpis, "deals"),
    paymentsEUR: period.paymentsEUR,
    leadToDealPct,
    targetPct: period.targetPct,
    score,
    scoreStatus: scoreStatus(score),
  };

  return { record, period, summary };
}

export function computeTeamPeriod(
  startMs: number,
  endMs: number,
  lang: Lang = "tr",
): TeamPeriodData {
  const rows = TEAM_AGENTS.map((record) => summarizeAgent(record, startMs, endMs, lang));

  const agents = [...rows]
    .sort((a, b) => b.summary.score - a.summary.score)
    .map((r) => r.summary);
  const best5 = agents.slice(0, 5);
  const worst5 = [...agents].sort((a, b) => a.score - b.score).slice(0, 5);

  /* ---------------------------- Takım KPI'ları ---------------------------- */
  const totalLeads = rows.reduce((s, r) => s + r.summary.leads, 0);
  const totalCalls = rows.reduce((s, r) => s + r.summary.calls, 0);
  const totalAnswered = rows.reduce((s, r) => s + r.summary.answered, 0);
  const totalContacts = rows.reduce((s, r) => s + r.summary.contacts, 0);
  const totalOffers = rows.reduce((s, r) => s + r.summary.offers, 0);
  const totalDeals = rows.reduce((s, r) => s + r.summary.deals, 0);
  const totalPaymentsEUR = rows.reduce((s, r) => s + r.summary.paymentsEUR, 0);
  const totalNeverCalled = rows.reduce((s, r) => s + r.summary.neverCalled, 0);
  // Takım SLA uyumu — çağrılmış lead sayısına göre ağırlıklı ortalama (basit ortalama değil).
  const totalCalledLeads = rows.reduce(
    (s, r) => s + (r.summary.leads - r.summary.neverCalled),
    0,
  );
  const weightedSla =
    totalCalledLeads > 0
      ? rows.reduce(
          (s, r) => s + (r.summary.slaCompliantPct / 100) * (r.summary.leads - r.summary.neverCalled),
          0,
        ) / totalCalledLeads
      : 0;

  const teamKpis: Kpi[] = [
    { id: "team-leads", label: pick(lang, "Takım Toplam Lead", "Team Total Leads"), format: "number", value: totalLeads, accent: "brand", icon: "user-plus", hint: pick(lang, "seçili dönemde takıma atanan", "assigned to the team in the selected period") },
    { id: "team-never-called", label: pick(lang, "Henüz Aranmayan", "Not Yet Called"), format: "number", value: totalNeverCalled, accent: "brand-secondary", status: totalNeverCalled > 0 ? "critical" : "success", icon: "phone-missed", hint: pick(lang, "takım genelinde", "across the team") },
    { id: "team-calls", label: pick(lang, "Takım Toplam Arama", "Team Total Calls"), format: "number", value: totalCalls, accent: "indigo", icon: "phone-call", hint: pick(lang, "tüm agent'ların çağrıları", "calls from all agents") },
    { id: "team-answer-rate", label: pick(lang, "Takım Cevaplanma Oranı", "Team Answer Rate"), format: "ratio", value: totalAnswered, denominator: totalCalls, accent: "indigo", icon: "phone-incoming", hint: pick(lang, "cevaplanan ÷ toplam arama", "answered ÷ total calls") },
    { id: "team-sla", label: pick(lang, "Takım SLA Uyumu", "Team SLA Compliance"), format: "percent", value: Math.round(weightedSla * 1000) / 10, accent: "brand", icon: "timer", hint: pick(lang, "aranmış lead sayısına göre ağırlıklı", "weighted by number of called leads") },
    { id: "team-contacts", label: pick(lang, "Takım Contact", "Team Contacts"), format: "number", value: totalContacts, accent: "violet", icon: "user-check", hint: pick(lang, "görüşmeye dönüşen", "turned into conversations") },
    { id: "team-offers", label: pick(lang, "Takım Offer", "Team Offers"), format: "number", value: totalOffers, accent: "violet", icon: "file-text", hint: pick(lang, "oluşturulan teklif", "offers created") },
    { id: "team-deals", label: pick(lang, "Takım Deal", "Team Deals"), format: "number", value: totalDeals, accent: "brand", icon: "handshake", hint: pick(lang, "kapanan satış", "deals closed") },
    { id: "team-payments", label: pick(lang, "Takım Ciro", "Team Revenue"), format: "currency", value: totalPaymentsEUR, accent: "brand", icon: "banknote", hint: pick(lang, "ödemesi alınan toplam tutar", "total amount with payment received") },
  ];

  /* ------------------------------- Isı haritası ------------------------------ */
  const heatmap: HourlyHeatmapRow[] = rows.map((r) => ({
    agentId: r.record.id,
    name: r.record.name,
    cells: r.period.hourlyCalls.map((c) => ({
      hour: c.hour,
      total: c.total,
      answered: c.answered,
      ratePct: c.total > 0 ? Math.round((c.answered / c.total) * 1000) / 10 : null,
    })),
  }));

  /* ------------------------------ Funnel & agent kırılımı ------------------------------ */
  const funnel: TeamFunnelStage[] = rows[0]?.period.fullFunnel.map((stage, stageIdx) => {
    const byAgent = rows.map((r) => ({
      agentId: r.record.id,
      name: r.record.name,
      count: r.period.fullFunnel[stageIdx].count,
    }));
    const total = byAgent.reduce((s, a) => s + a.count, 0);
    const prevTotal =
      stageIdx === 0
        ? null
        : rows.reduce((s, r) => s + r.period.fullFunnel[stageIdx - 1].count, 0);
    return {
      key: stage.key,
      label: stage.label,
      total,
      prevPct: prevTotal !== null && prevTotal > 0 ? (total / prevTotal) * 100 : null,
      byAgent,
    };
  }) ?? [];

  /* --------------------------------- Backlog --------------------------------- */
  const backlog: BacklogRow[] = rows
    .map((r) => ({
      agentId: r.record.id,
      name: r.record.name,
      neverCalled: r.period.backlog.neverCalled,
      slaViolations: r.period.backlog.slaViolations,
      pendingOffers: r.period.backlog.pendingOffers,
      overdueFollowUps: r.period.backlog.overdueFollowUps,
    }))
    .filter(
      (b) =>
        b.neverCalled > 0 || b.slaViolations > 0 || b.pendingOffers > 0 || b.overdueFollowUps > 0,
    )
    .sort(
      (a, b) =>
        b.neverCalled + b.slaViolations + b.pendingOffers + b.overdueFollowUps -
        (a.neverCalled + a.slaViolations + a.pendingOffers + a.overdueFollowUps),
    );

  /* ----------------------------- Aksiyon merkezi ----------------------------- */
  const actionCenter: TeamActionItem[] = [];
  for (const r of rows) {
    const { summary, period } = r;
    if (summary.calls === 0 && summary.leads > 0) {
      actionCenter.push({
        id: `${summary.agentId}-no-calls`,
        agentId: summary.agentId,
        agentName: summary.name,
        label: pick(lang, `${summary.name} bu dönemde hiç arama yapmadı`, `${summary.name} made no calls in this period`),
        status: "critical",
        href: `/team-leader/karsilastirma`,
      });
    }
    if (period.backlog.neverCalled >= 5) {
      actionCenter.push({
        id: `${summary.agentId}-never-called`,
        agentId: summary.agentId,
        agentName: summary.name,
        label: pick(lang, `${summary.name}'de ${period.backlog.neverCalled} lead henüz aranmadı`, `${summary.name} has ${period.backlog.neverCalled} leads not yet called`),
        status: "critical",
        href: `/team-leader/karsilastirma`,
      });
    }
    if (summary.slaCompliantPct < 60 && summary.calls > 0) {
      actionCenter.push({
        id: `${summary.agentId}-sla`,
        agentId: summary.agentId,
        agentName: summary.name,
        label: pick(lang, `${summary.name}'nin SLA uyumu %${Math.round(summary.slaCompliantPct)} — kritik seviyede düşük`, `${summary.name}'s SLA compliance ${Math.round(summary.slaCompliantPct)}% — critically low`),
        status: "risk",
        href: `/team-leader/karsilastirma`,
      });
    }
    if (period.backlog.overdueFollowUps > 0) {
      actionCenter.push({
        id: `${summary.agentId}-overdue`,
        agentId: summary.agentId,
        agentName: summary.name,
        label: pick(lang, `${summary.name}'de ${period.backlog.overdueFollowUps} lead takip tarihi geçmiş`, `${summary.name} has ${period.backlog.overdueFollowUps} leads past their follow-up date`),
        status: "warning",
        href: `/team-leader/karsilastirma`,
      });
    }
  }
  actionCenter.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  /* -------------------------------- Tavsiyeler -------------------------------- */
  const insights: TeamInsight[] = [];
  const teamAvgScore = agents.reduce((s, a) => s + a.score, 0) / agents.length;
  const top = agents[0];
  if (top) {
    insights.push({
      id: "top-performer",
      tone: "success",
      icon: "trophy",
      text: pick(lang, `${top.name} takımın en başarılısı — Genel Başarı puanı ${top.score.toFixed(1)}, takım ortalamasının ${Math.round((top.score - teamAvgScore) * 10) / 10} puan üstünde.`, `${top.name} is the team's top performer — Overall Score ${top.score.toFixed(1)}, ${Math.round((top.score - teamAvgScore) * 10) / 10} points above the team average.`),
    });
  }
  const bottom = agents[agents.length - 1];
  if (bottom && bottom.agentId !== top?.agentId) {
    insights.push({
      id: "coaching-priority",
      tone: bottom.scoreStatus === "critical" ? "critical" : "risk",
      icon: "alert",
      text: pick(lang, `${bottom.name} en çok koçluk ihtiyacı duyan agent — Genel Başarı puanı ${bottom.score.toFixed(1)}. SLA %${Math.round(bottom.slaCompliantPct)} ve ulaşım %${Math.round(bottom.answerRatePct)} birlikte ele alınmalı.`, `${bottom.name} needs coaching the most — Overall Score ${bottom.score.toFixed(1)}. SLA ${Math.round(bottom.slaCompliantPct)}% and reach ${Math.round(bottom.answerRatePct)}% should be addressed together.`),
    });
  }
  let worstStage: { label: string; pct: number } | null = null;
  for (const stage of funnel) {
    if (stage.prevPct === null) continue;
    if (worstStage === null || stage.prevPct < worstStage.pct) {
      worstStage = { label: stage.label, pct: stage.prevPct };
    }
  }
  if (worstStage) {
    insights.push({
      id: "funnel-drop",
      tone: "warning",
      icon: "filter",
      text: pick(lang, `Takım genelinde en büyük kayıp "${worstStage.label}" aşamasında (%${Math.round(worstStage.pct)} geçiş) — bu aşamadaki agent koçluğuna öncelik ver.`, `The biggest drop-off across the team is at the "${worstStage.label}" stage (${Math.round(worstStage.pct)}% pass-through) — prioritize agent coaching at this stage.`),
    });
  }
  const slaBenchmark = 85;
  const slaDiff = Math.round((weightedSla * 100 - slaBenchmark) * 10) / 10;
  insights.push({
    id: "sla-benchmark",
    tone: slaDiff >= 0 ? "success" : "risk",
    icon: "timer",
    text:
      slaDiff >= 0
        ? pick(lang, `Takımın SLA uyumu hedefin (%${slaBenchmark}) ${slaDiff} puan üstünde — genel disiplin iyi durumda.`, `The team's SLA compliance is ${slaDiff} points above target (${slaBenchmark}%) — overall discipline is in good shape.`)
        : pick(lang, `Takımın SLA uyumu hedefin (%${slaBenchmark}) ${Math.abs(slaDiff)} puan altında — ilk arama hızını takımca gözden geçirin.`, `The team's SLA compliance is ${Math.abs(slaDiff)} points below target (${slaBenchmark}%) — review first-call speed as a team.`),
  });

  /* ----------------------------- Dönüşüm oranları ---------------------------- */
  const stageTotal = (key: string) =>
    funnel.find((s) => s.key === key)?.total ?? 0;
  const leadTotal = stageTotal("lead");
  const contactTotal = stageTotal("contact");
  const offerTotal = stageTotal("offer-created");
  const dealTotal = stageTotal("deal");
  const rate = (num: number, den: number) =>
    den > 0 ? Math.round((num / den) * 1000) / 10 : 0;

  const conversionRates: Kpi[] = [
    { id: "lead-contact", label: "Lead → Contact", format: "percent", value: rate(contactTotal, leadTotal), accent: "brand", icon: "user-check", hint: pick(lang, `${formatNumber(contactTotal)} / ${formatNumber(leadTotal)} lead`, `${formatNumber(contactTotal)} / ${formatNumber(leadTotal)} leads`) },
    { id: "contact-offer", label: "Contact → Offer", format: "percent", value: rate(offerTotal, contactTotal), accent: "violet", icon: "file-text", hint: pick(lang, `${formatNumber(offerTotal)} / ${formatNumber(contactTotal)} contact`, `${formatNumber(offerTotal)} / ${formatNumber(contactTotal)} contacts`) },
    { id: "offer-deal", label: "Offer → Deal", format: "percent", value: rate(dealTotal, offerTotal), accent: "indigo", icon: "handshake", hint: pick(lang, `${formatNumber(dealTotal)} / ${formatNumber(offerTotal)} offer`, `${formatNumber(dealTotal)} / ${formatNumber(offerTotal)} offers`) },
  ];

  /* --------------------------- Günlük/saatlik toplam --------------------------- */
  const dayMap = new Map<string, { total: number; answered: number }>();
  const dayOrder: string[] = [];
  for (const r of rows) {
    for (const pt of r.period.dailyTrend) {
      if (!dayMap.has(pt.day)) {
        dayMap.set(pt.day, { total: 0, answered: 0 });
        dayOrder.push(pt.day);
      }
      const e = dayMap.get(pt.day)!;
      e.total += pt.total;
      e.answered += pt.answered;
    }
  }
  const dailyTrend: DailyTrendPoint[] = dayOrder.map((day) => ({
    day,
    total: dayMap.get(day)!.total,
    answered: dayMap.get(day)!.answered,
  }));

  const hourlyAggregate: HourlyCallPoint[] = (rows[0]?.period.hourlyCalls ?? []).map(
    (h, i) => ({
      hour: h.hour,
      total: rows.reduce((s, r) => s + (r.period.hourlyCalls[i]?.total ?? 0), 0),
      answered: rows.reduce((s, r) => s + (r.period.hourlyCalls[i]?.answered ?? 0), 0),
    }),
  );

  /* ----------------------------- Dönüşüm kırılımı ---------------------------- */
  const sourceConversion = mergeConversion(rows.map((r) => r.period.sourceConversion));
  const countryConversion = mergeConversion(rows.map((r) => r.period.countryConversion));
  const languageConversion = mergeConversion(rows.map((r) => r.period.languageConversion));

  /* --------------------------- Performans dağılımı --------------------------- */
  const tierDistribution: TierDistribution[] = TIER_META.map((tier, idx) => {
    const upper = idx === 0 ? Infinity : TIER_META[idx - 1].min;
    const inTier = agents.filter((a) => a.score >= tier.min && a.score < upper);
    return {
      key: tier.key,
      label: pick(lang, tier.label, tier.labelEn),
      count: inTier.length,
      names: inTier.map((a) => a.name),
    };
  });

  /* ------------------------------ Metrik liderleri ---------------------------- */
  const leaderBy = (fn: (a: AgentPeriodSummary) => number) =>
    [...agents].sort((a, b) => fn(b) - fn(a))[0];
  const callLeader = leaderBy((a) => a.calls);
  const slaLeader = leaderBy((a) => a.slaCompliantPct);
  const convLeader = leaderBy((a) => a.leadToDealPct);
  const ciroLeader = leaderBy((a) => a.paymentsEUR);
  const reachLeader = leaderBy((a) => a.answerRatePct);
  const dimensionLeaders: DimensionLeader[] = [
    { key: "calls", label: pick(lang, "En Çok Arama", "Most Calls"), icon: "phone-call", accent: "indigo", agentName: callLeader?.name ?? "—", valueText: formatNumber(callLeader?.calls ?? 0) },
    { key: "sla", label: pick(lang, "En İyi SLA Uyumu", "Best SLA Compliance"), icon: "timer", accent: "brand", agentName: slaLeader?.name ?? "—", valueText: formatPercent(slaLeader?.slaCompliantPct ?? 0, 0) },
    { key: "reach", label: pick(lang, "En İyi Ulaşım", "Best Reach"), icon: "phone-incoming", accent: "indigo", agentName: reachLeader?.name ?? "—", valueText: formatPercent(reachLeader?.answerRatePct ?? 0, 0) },
    { key: "conv", label: pick(lang, "En İyi Dönüşüm", "Best Conversion"), icon: "trending-up", accent: "violet", agentName: convLeader?.name ?? "—", valueText: formatPercent(convLeader?.leadToDealPct ?? 0, 0) },
    { key: "ciro", label: pick(lang, "En Yüksek Ciro", "Highest Revenue"), icon: "banknote", accent: "brand", agentName: ciroLeader?.name ?? "—", valueText: formatCurrencyEUR(ciroLeader?.paymentsEUR ?? 0) },
  ];

  /* --------------------------------- Scatter --------------------------------- */
  const scatter: AgentScatterPoint[] = agents.map((a) => ({
    agentId: a.agentId,
    name: a.name,
    slaCompliantPct: Math.round(a.slaCompliantPct * 10) / 10,
    leadToDealPct: Math.round(a.leadToDealPct * 10) / 10,
    calls: a.calls,
    score: a.score,
  }));

  /* ----------------------------- Rol kırılımı -------------------------------- */
  const roleBreakdown: RoleBreakdownRow[] = (["Senior", "Junior"] as const)
    .map((role) => {
      const group = agents.filter((a) => a.role === role);
      if (group.length === 0) return null;
      const avg = (fn: (a: AgentPeriodSummary) => number) =>
        Math.round((group.reduce((s, a) => s + fn(a), 0) / group.length) * 10) / 10;
      return {
        role,
        agentCount: group.length,
        avgScore: avg((a) => a.score),
        avgSlaPct: avg((a) => a.slaCompliantPct),
        avgAnswerRatePct: avg((a) => a.answerRatePct),
        totalDeals: group.reduce((s, a) => s + a.deals, 0),
        totalPaymentsEUR: group.reduce((s, a) => s + a.paymentsEUR, 0),
      };
    })
    .filter((r): r is RoleBreakdownRow => r !== null);

  /* --------------------------- Backlog toplamları ---------------------------- */
  const backlogTotals = {
    neverCalled: rows.reduce((s, r) => s + r.period.backlog.neverCalled, 0),
    slaViolations: rows.reduce((s, r) => s + r.period.backlog.slaViolations, 0),
    pendingOffers: rows.reduce((s, r) => s + r.period.backlog.pendingOffers, 0),
    overdueFollowUps: rows.reduce((s, r) => s + r.period.backlog.overdueFollowUps, 0),
  };

  /* ===================== Zoho'dan türetilen ek analizler ===================== */
  const inPeriod = (l: Lead) => l.createdAt >= startMs && l.createdAt <= endMs;
  const rowLeads = rows.map((r) => ({ row: r, leads: r.record.leads.filter(inPeriod) }));

  /* --- Neden kaybediyoruz? (sonuç/kayıp nedenleri) --- */
  const reasonCounts = new Map<ResultReason, number>();
  for (const { leads } of rowLeads) {
    for (const l of leads) {
      if (l.resultReason) reasonCounts.set(l.resultReason, (reasonCounts.get(l.resultReason) ?? 0) + 1);
    }
  }
  const reasonTotal = [...reasonCounts.values()].reduce((s, n) => s + n, 0);
  const lossReasons: LossReasonRow[] = [...reasonCounts.entries()]
    .map(([key, count]) => ({
      key,
      label: pick(lang, REASON_META[key].tr, REASON_META[key].en),
      count,
      pct: reasonTotal > 0 ? Math.round((count / reasonTotal) * 1000) / 10 : 0,
      tone: REASON_META[key].tone,
    }))
    .sort((a, b) => b.count - a.count);

  /* --- Yanıt hızı (bekleme süresi dağılımı + en hızlı/yavaş) --- */
  const allWaits: number[] = [];
  const agentAvgWait: { agentId: string; name: string; avgMin: number }[] = [];
  let slaOk = 0;
  for (const { row, leads } of rowLeads) {
    const waits: number[] = [];
    for (const l of leads) {
      const first = l.calls[0];
      if (!first) continue;
      const w = Math.max(0, Math.round((first.time - l.createdAt) / MINUTE));
      waits.push(w);
      allWaits.push(w);
      if (w <= 15) slaOk++;
    }
    if (waits.length > 0) {
      agentAvgWait.push({
        agentId: row.record.id,
        name: row.record.name,
        avgMin: Math.round(waits.reduce((s, n) => s + n, 0) / waits.length),
      });
    }
  }
  const sortedWaits = [...allWaits].sort((a, b) => a - b);
  const bucketDefs: { key: string; tr: string; en: string; max: number; tone: StatusLevel }[] = [
    { key: "0-5", tr: "0-5 dk", en: "0-5 min", max: 5, tone: "success" },
    { key: "6-15", tr: "6-15 dk", en: "6-15 min", max: 15, tone: "success" },
    { key: "16-60", tr: "16-60 dk", en: "16-60 min", max: 60, tone: "warning" },
    { key: "1-24s", tr: "1-24 saat", en: "1-24 h", max: 1440, tone: "risk" },
    { key: ">24s", tr: "24 saatten fazla", en: "Over 24 h", max: Infinity, tone: "critical" },
  ];
  const waitingBuckets: WaitingBucket[] = bucketDefs.map((b, i) => {
    const lower = i === 0 ? -1 : bucketDefs[i - 1].max;
    return {
      key: b.key,
      label: pick(lang, b.tr, b.en),
      count: allWaits.filter((w) => w > lower && w <= b.max).length,
      tone: b.tone,
    };
  });
  const responseSpeed: ResponseSpeed = {
    buckets: waitingBuckets,
    medianMin: sortedWaits.length ? sortedWaits[Math.floor(sortedWaits.length / 2)] : 0,
    avgMin: allWaits.length ? Math.round(allWaits.reduce((s, n) => s + n, 0) / allWaits.length) : 0,
    slaCompliantPct: allWaits.length ? Math.round((slaOk / allWaits.length) * 1000) / 10 : 0,
    fastest: [...agentAvgWait].sort((a, b) => a.avgMin - b.avgMin).slice(0, 5),
    slowest: [...agentAvgWait].sort((a, b) => b.avgMin - a.avgMin).slice(0, 5),
  };

  /* --- Arama hedef gerçekleşme (adet + süre) --- */
  const callRealization: CallRealizationRow[] = rowLeads
    .map(({ row, leads }) => {
      const calls = row.summary.calls;
      const talkSec = leads.reduce((s, l) => s + l.calls.reduce((cs, c) => cs + c.talkSec, 0), 0);
      const talkMin = Math.round(talkSec / 60);
      const effCall = 0.72 + hashFrac(row.record.id + "c") * 0.4; // 0.72..1.12
      const effDur = 0.7 + hashFrac(row.record.id + "d") * 0.45; // 0.70..1.15
      const callTarget = Math.max(1, Math.round(calls / effCall));
      const durationTargetMin = Math.max(1, Math.round(talkMin / effDur));
      const callPct = Math.round((calls / callTarget) * 1000) / 10;
      const durationPct = Math.round((talkMin / durationTargetMin) * 1000) / 10;
      return {
        agentId: row.record.id, name: row.record.name,
        calls, callTarget, callPct,
        talkMin, durationTargetMin, durationPct,
        tone: toneByRatio(callPct),
      };
    })
    .sort((a, b) => a.callPct - b.callPct);

  /* --- Fırsat statü dağılımı --- */
  const stageAcc = { contact: 0, offerCreated: 0, offerShared: 0, offerAccepted: 0, willing: 0, inProgress: 0, won: 0 };
  let wonAmount = 0;
  let progressAmount = 0;
  for (const { leads } of rowLeads) {
    for (const l of leads) {
      if (l.isConverted) stageAcc.contact++;
      if (l.offerStatus === "Offer Created") stageAcc.offerCreated++;
      if (l.offerStatus === "Offer Shared") stageAcc.offerShared++;
      if (l.offerStatus === "Offer Accepted") stageAcc.offerAccepted++;
      if (l.offerStatus === "Willing to Close") stageAcc.willing++;
      if (l.dealStatus === "In Progress") { stageAcc.inProgress++; progressAmount += l.dealAmount ?? 0; }
      if (l.dealStatus === "Won") { stageAcc.won++; wonAmount += l.dealAmount ?? 0; }
    }
  }
  const oppStages: OppStageRow[] = ([
    { key: "contact", label: pick(lang, "Görüşmeye Dönüştü", "Became Contact"), count: stageAcc.contact, amountEUR: 0, accent: "indigo" as const },
    { key: "offer-created", label: pick(lang, "Teklif Oluşturuldu", "Offer Created"), count: stageAcc.offerCreated, amountEUR: 0, accent: "violet" as const },
    { key: "offer-shared", label: pick(lang, "Teklif Paylaşıldı", "Offer Shared"), count: stageAcc.offerShared, amountEUR: 0, accent: "violet" as const },
    { key: "offer-accepted", label: pick(lang, "Teklif Kabul Edildi", "Offer Accepted"), count: stageAcc.offerAccepted, amountEUR: 0, accent: "brand-secondary" as const },
    { key: "willing", label: pick(lang, "Kapanışa Yakın", "Willing to Close"), count: stageAcc.willing, amountEUR: 0, accent: "brand-secondary" as const },
    { key: "in-progress", label: pick(lang, "Deal Sürüyor", "Deal In Progress"), count: stageAcc.inProgress, amountEUR: Math.round(progressAmount), accent: "brand" as const },
    { key: "won", label: pick(lang, "Kazanıldı", "Won"), count: stageAcc.won, amountEUR: Math.round(wonAmount), accent: "brand" as const },
  ]).filter((s) => s.count > 0);

  /* --- Sıralama & kazanç (Rank: kıdem + finansallar) --- */
  const tenureLabel = (months: number) =>
    months < 3 ? pick(lang, "0-3 ay", "0-3 mo")
      : months < 6 ? pick(lang, "3-6 ay", "3-6 mo")
        : months < 12 ? pick(lang, "6-12 ay", "6-12 mo")
          : pick(lang, "1 yıl +", "1 yr +");
  const agentEarnings: AgentEarningRow[] = agents.map((a) => {
    const months = 1 + Math.round(hashFrac(a.agentId) * 40);
    const prepayRatio = 0.2 + hashFrac(a.agentId + "p") * 0.2;
    const offerPrice = 3000 + Math.round(hashFrac(a.agentId + "o") * 3000);
    const ticketRatio = 0.6 + hashFrac(a.agentId + "t") * 0.5;
    return {
      agentId: a.agentId, name: a.name, role: a.role,
      tenureLabel: tenureLabel(months),
      score: a.score, scoreStatus: a.scoreStatus,
      deals: a.deals,
      paidEUR: Math.round(a.paymentsEUR),
      prepaymentEUR: Math.round(a.paymentsEUR * prepayRatio),
      offerAmountEUR: a.offers * offerPrice,
      flightTickets: Math.round(a.deals * ticketRatio),
    };
  });

  /* --- Günlük yeni lead matrisi (son 10 gün) — Zoho: Today Lead --- */
  const MONTHS_S = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const dayLabel = (ts: number) => {
    const iso = new Date(ts + 3 * 3600_000).toISOString();
    return `${Number(iso.slice(8, 10))} ${MONTHS_S[Number(iso.slice(5, 7)) - 1]}`;
  };
  const endDay = Math.min(endMs, MOCK_NOW);
  const dayLabels: string[] = [];
  for (let i = 9; i >= 0; i--) dayLabels.push(dayLabel(endDay - i * DAY));
  const dailyLeadMatrix: DailyLeadRow[] = rowLeads.map(({ row, leads }) => {
    const perDay = new Map<string, number>();
    for (const l of leads) {
      const dl = dayLabel(l.createdAt);
      perDay.set(dl, (perDay.get(dl) ?? 0) + 1);
    }
    const cells = dayLabels.map((day) => ({ day, count: perDay.get(day) ?? 0 }));
    return {
      agentId: row.record.id,
      name: row.record.name,
      cells,
      total: cells.reduce((s, c) => s + c.count, 0),
    };
  });

  /* --- Takım geri-arama listesi — Zoho: CloudTalk CallBack --- */
  const teamCallbacks: TeamCallbackRow[] = [];
  for (const { row, leads } of rowLeads) {
    for (const l of leads) {
      if (l.callbackDate !== null) {
        teamCallbacks.push({
          id: l.id,
          agentName: row.record.name,
          contactName: l.name,
          phone: l.phone,
          dateISO: new Date(l.callbackDate).toISOString(),
          overdue: l.callbackDate < MOCK_NOW,
        });
      }
    }
  }
  teamCallbacks.sort((a, b) => a.dateISO.localeCompare(b.dateISO));

  /* --- Takım Asistanı (kural-tabanlı brifing) --- */
  const teamSlaPct = Math.round(weightedSla * 1000) / 10;
  const assistPoints: AssistantPoint[] = [];
  // Kayıp nedeni
  const topLoss = lossReasons.find((r) => r.key !== "Interested");
  if (topLoss) {
    assistPoints.push({
      tone: topLoss.tone === "success" ? "warning" : topLoss.tone,
      icon: "filter",
      title: pick(lang, "En büyük kayıp nedeni", "Top loss reason"),
      text: pick(lang,
        `Sonuçlanan fırsatların %${topLoss.pct}'i "${topLoss.label}" ile kaybediliyor. Bu gruptaki lead'lerin senaryosunu takımla gözden geçir.`,
        `${topLoss.pct}% of resolved opportunities are lost to "${topLoss.label}". Review the script for these leads with the team.`),
    });
  }
  // SLA
  assistPoints.push({
    tone: teamSlaPct >= 85 ? "success" : teamSlaPct >= 70 ? "warning" : "risk",
    icon: "timer",
    title: pick(lang, "İlk arama hızı (SLA)", "First-call speed (SLA)"),
    text: teamSlaPct >= 85
      ? pick(lang, `Takım SLA uyumu %${teamSlaPct} — hedefin (%85) üstünde, disiplin iyi.`, `Team SLA compliance is ${teamSlaPct}% — above the 85% target, discipline is good.`)
      : pick(lang, `Takım SLA uyumu %${teamSlaPct} — hedefin (%85) altında. Yeni lead'lere 15 dk içinde dönülmesini hatırlat.`, `Team SLA compliance is ${teamSlaPct}% — below the 85% target. Remind the team to call new leads within 15 minutes.`),
  });
  // Aranmayan backlog
  if (totalNeverCalled > 0) {
    assistPoints.push({
      tone: totalNeverCalled >= 15 ? "critical" : "warning",
      icon: "phone-missed",
      title: pick(lang, "Aranmayı bekleyen lead'ler", "Leads waiting for a call"),
      text: pick(lang, `Takımda ${totalNeverCalled} lead henüz hiç aranmadı — bunlar en hızlı kazanılabilecek fırsatlar.`, `${totalNeverCalled} leads in the team have never been called — these are the quickest wins available.`),
    });
  }
  // Koçluk
  if (bottom && bottom.agentId !== top?.agentId) {
    assistPoints.push({
      tone: bottom.scoreStatus === "critical" ? "critical" : "risk",
      icon: "alert",
      title: pick(lang, "Öncelikli koçluk", "Priority coaching"),
      text: pick(lang, `${bottom.name} en çok desteğe ihtiyaç duyan isim (puan ${bottom.score.toFixed(0)}). SLA %${Math.round(bottom.slaCompliantPct)} ve ulaşım %${Math.round(bottom.answerRatePct)} birlikte konuşulmalı.`, `${bottom.name} needs the most support (score ${bottom.score.toFixed(0)}). Address SLA ${Math.round(bottom.slaCompliantPct)}% and reach ${Math.round(bottom.answerRatePct)}% together.`),
    });
  }
  // En iyi
  if (top) {
    assistPoints.push({
      tone: "success",
      icon: "trophy",
      title: pick(lang, "Bu dönemin yıldızı", "Star of the period"),
      text: pick(lang, `${top.name} önde (puan ${top.score.toFixed(0)}). Yaklaşımını takımla paylaşmak diğerlerini de yukarı çeker.`, `${top.name} is leading (score ${top.score.toFixed(0)}). Sharing their approach with the team lifts everyone.`),
    });
  }
  const teamAvg = agents.reduce((s, a) => s + a.score, 0) / (agents.length || 1);
  const assistant: AssistantBrief = {
    headline: teamAvg >= 75
      ? pick(lang, "Takım güçlü bir dönem geçiriyor", "The team is having a strong period")
      : teamAvg >= 55
        ? pick(lang, "Takım dengeli ama iyileştirme alanı var", "The team is steady but has room to improve")
        : pick(lang, "Takımın acil desteğe ihtiyacı var", "The team needs urgent support"),
    tone: teamAvg >= 75 ? "success" : teamAvg >= 55 ? "warning" : "risk",
    summary: pick(lang,
      `Takım ortalama Genel Başarı puanı ${teamAvg.toFixed(0)}/100. Aşağıda bu dönem en çok dikkat etmen gereken ${Math.min(assistPoints.length, 4)} başlık var.`,
      `Team average Overall Score is ${teamAvg.toFixed(0)}/100. Below are the ${Math.min(assistPoints.length, 4)} things to focus on most this period.`),
    points: assistPoints.slice(0, 4),
  };

  const targetPct =
    (totalPaymentsEUR / (MONTHLY_TARGET_EUR * TEAM_AGENTS.length)) * 100;

  return {
    teamKpis,
    conversionRates,
    targetPct: Math.round(targetPct * 10) / 10,
    targetEUR: MONTHLY_TARGET_EUR * TEAM_AGENTS.length,
    actualEUR: totalPaymentsEUR,
    agents,
    best5,
    worst5,
    heatmap,
    hourlyAggregate,
    dailyTrend,
    funnel,
    sourceConversion,
    countryConversion,
    languageConversion,
    tierDistribution,
    dimensionLeaders,
    scatter,
    roleBreakdown,
    backlog,
    backlogTotals,
    actionCenter,
    insights,
    lossReasons,
    responseSpeed,
    callRealization,
    oppStages,
    agentEarnings,
    dailyLeadMatrix,
    teamCallbacks,
    assistant,
  };
}
