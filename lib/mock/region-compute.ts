/**
 * Bölge Müdürü hesaplama katmanı — her danışman `summarizeAgent`
 * (Takım Lideri katmanıyla PAYLAŞILAN, o da agent panelindeki `computePeriod`'u
 * kullanan) üzerinden geçirilir; bu dosya sonuçları önce takım, sonra bölge
 * seviyesinde toplar. Böylece Agent → Takım Lideri → Bölge Müdürü panelleri
 * arasında aynı metrik için asla farklı sayı çıkmaz (tek hesaplama kaynağı).
 */

import type { Kpi, StatusLevel } from "@/lib/types/agent-data";
import type {
  RegionActionItem,
  RegionAgentSummary,
  RegionFunnelStage,
  RegionPeriodData,
  TeamBacklogRow,
  TeamSummary,
} from "@/lib/types/region-data";
import type { TeamInsight } from "@/lib/types/team-data";
import { summarizeAgent, scoreStatus, mergeConversion } from "./team-compute";
import { computePeriod } from "./compute";
import { MONTHLY_TARGET_EUR } from "./datasets";
import { REGION_TEAM_RECORDS } from "./region-data";
import type { RegionTeamRecord } from "./region-data";
import { formatNumber } from "@/lib/utils/format";
import { pick, type Lang } from "@/lib/i18n/core";

const STATUS_ORDER: Record<StatusLevel, number> = {
  critical: 0, risk: 1, warning: 2, neutral: 3, success: 4,
};

/**
 * Modül seviyesi önbellek — aynı (dönem, kayıt seti) için sonucu saklar.
 * Bölge Müdürü ve Admin panelleri arasında/tekrar girişte ~16 bin lead'in
 * yeniden hesaplanmasını önler (sayfa geçişleri belirgin hızlanır). Kayıt seti
 * referansla eşleştirilir (seed sabiti ya da yüklü veri seti kararlı referans).
 */
const REGION_CACHE: Array<{
  startMs: number;
  endMs: number;
  records: RegionTeamRecord[];
  lang: Lang;
  result: RegionPeriodData;
}> = [];
const REGION_CACHE_MAX = 8;

function kpiValue(kpis: Kpi[], id: string): number {
  return kpis.find((k) => k.id === id)?.value ?? 0;
}

export function computeRegionPeriod(
  startMs: number,
  endMs: number,
  records: RegionTeamRecord[] = REGION_TEAM_RECORDS,
  lang: Lang = "tr",
): RegionPeriodData {
  const cached = REGION_CACHE.find(
    (c) => c.startMs === startMs && c.endMs === endMs && c.records === records && c.lang === lang,
  );
  if (cached) return cached.result;

  const totalAgents = records.reduce((s, t) => s + t.agents.length, 0);
  // Her takım için: agent özetleri + takımın birleşik lead havuzu (funnel için).
  const teamBlocks = records.map((team) => {
    const agentRows = team.agents.map((a) => summarizeAgent(a, startMs, endMs, lang));
    const allLeads = team.agents.flatMap((a) => a.leads);
    const teamPeriod = computePeriod(allLeads, startMs, endMs, lang);
    return { team, agentRows, teamPeriod };
  });

  /* ------------------------------ Takım özetleri ----------------------------- */
  const teams: TeamSummary[] = teamBlocks
    .map(({ team, agentRows, teamPeriod }) => {
      const sums = agentRows.map((r) => r.summary);
      const n = sums.length || 1;
      const sum = (fn: (s: (typeof sums)[number]) => number) =>
        sums.reduce((acc, s) => acc + fn(s), 0);
      const avgScore = Math.round((sum((s) => s.score) / n) * 100) / 100;
      const dealStage = teamPeriod.fullFunnel.find((s) => s.key === "deal");
      const slaGauge = teamPeriod.gauges.find((g) => g.key === "sla");
      const calls = kpiValue(teamPeriod.overviewKpis, "calls");
      const answered = kpiValue(teamPeriod.overviewKpis, "answered");
      return {
        teamId: team.teamId,
        teamName: team.teamName,
        teamLeaderName: team.teamLeaderName,
        agentCount: sums.length,
        leads: kpiValue(teamPeriod.overviewKpis, "leads"),
        calls,
        answered,
        answerRatePct: teamPeriod.answerRatePct,
        slaCompliantPct: slaGauge?.valuePct ?? 0,
        contacts: kpiValue(teamPeriod.overviewKpis, "contacts"),
        offers: kpiValue(teamPeriod.overviewKpis, "offers"),
        deals: kpiValue(teamPeriod.overviewKpis, "deals"),
        paymentsEUR: teamPeriod.paymentsEUR,
        leadToDealPct: dealStage?.leadPct ?? 0,
        targetPct: teamPeriod.targetPct,
        avgScore,
        scoreStatus: scoreStatus(avgScore),
        neverCalled: teamPeriod.backlog.neverCalled,
        slaViolations: teamPeriod.backlog.slaViolations,
        pendingOffers: teamPeriod.backlog.pendingOffers,
        overdueFollowUps: teamPeriod.backlog.overdueFollowUps,
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore);

  const bestTeam = teams[0] ?? null;
  const worstTeam = teams.length > 0 ? teams[teams.length - 1] : null;

  /* --------------------------- Bölge geneli agent'lar ------------------------- */
  const agents: RegionAgentSummary[] = teamBlocks
    .flatMap(({ team, agentRows }) =>
      agentRows.map((r) => ({
        ...r.summary,
        teamId: team.teamId,
        teamName: team.teamName,
      })),
    )
    .sort((a, b) => b.score - a.score);
  const best5Agents = agents.slice(0, 5);
  const worst5Agents = [...agents].sort((a, b) => a.score - b.score).slice(0, 5);

  /* ------------------------------- Bölge KPI'ları ---------------------------- */
  const totalLeads = teams.reduce((s, t) => s + t.leads, 0);
  const totalCalls = teams.reduce((s, t) => s + t.calls, 0);
  const totalAnswered = teams.reduce((s, t) => s + t.answered, 0);
  const totalContacts = teams.reduce((s, t) => s + t.contacts, 0);
  const totalOffers = teams.reduce((s, t) => s + t.offers, 0);
  const totalDeals = teams.reduce((s, t) => s + t.deals, 0);
  const totalPaymentsEUR = teams.reduce((s, t) => s + t.paymentsEUR, 0);
  const totalCalledLeads = teams.reduce((s, t) => s + (t.leads - t.neverCalled), 0);
  const weightedSla =
    totalCalledLeads > 0
      ? teams.reduce((s, t) => s + (t.slaCompliantPct / 100) * (t.leads - t.neverCalled), 0) /
        totalCalledLeads
      : 0;

  const regionKpis: Kpi[] = [
    { id: "region-teams", label: pick(lang, "Takım Sayısı", "Team Count"), format: "number", value: teams.length, accent: "brand", icon: "users", hint: pick(lang, `${totalAgents} danışman`, `${totalAgents} agents`) },
    { id: "region-leads", label: pick(lang, "Bölge Toplam Lead", "Region Total Leads"), format: "number", value: totalLeads, accent: "brand", icon: "user-plus", hint: pick(lang, "seçili dönemde atanan", "assigned in the selected period") },
    { id: "region-calls", label: pick(lang, "Bölge Toplam Arama", "Region Total Calls"), format: "number", value: totalCalls, accent: "indigo", icon: "phone-call", hint: pick(lang, "tüm takımlar", "all teams") },
    { id: "region-answer", label: pick(lang, "Bölge Cevaplanma", "Region Answer Rate"), format: "ratio", value: totalAnswered, denominator: totalCalls, accent: "indigo", icon: "phone-incoming", hint: pick(lang, "cevaplanan ÷ toplam", "answered ÷ total") },
    { id: "region-sla", label: pick(lang, "Bölge SLA Uyumu", "Region SLA Compliance"), format: "percent", value: Math.round(weightedSla * 1000) / 10, accent: "brand", icon: "timer", hint: pick(lang, "aranmış lead'e göre ağırlıklı", "weighted by called leads") },
    { id: "region-contacts", label: pick(lang, "Bölge Contact", "Region Contacts"), format: "number", value: totalContacts, accent: "violet", icon: "user-check", hint: pick(lang, "görüşmeye dönüşen", "turned into conversations") },
    { id: "region-deals", label: pick(lang, "Bölge Deal", "Region Deals"), format: "number", value: totalDeals, accent: "brand", icon: "handshake", hint: pick(lang, "kapanan satış", "deals closed") },
    { id: "region-ciro", label: pick(lang, "Bölge Cirosu", "Region Revenue"), format: "currency", value: totalPaymentsEUR, accent: "brand", icon: "banknote", hint: pick(lang, "ödemesi alınan toplam", "total amount with payment received") },
  ];

  /* ----------------------------- Dönüşüm oranları ---------------------------- */
  const contactTotal = totalContacts;
  const offerTotal = totalOffers;
  const rate = (num: number, den: number) =>
    den > 0 ? Math.round((num / den) * 1000) / 10 : 0;
  const conversionRates: Kpi[] = [
    { id: "lead-contact", label: "Lead → Contact", format: "percent", value: rate(contactTotal, totalLeads), accent: "brand", icon: "user-check", hint: `${formatNumber(contactTotal)} / ${formatNumber(totalLeads)}` },
    { id: "contact-offer", label: "Contact → Offer", format: "percent", value: rate(offerTotal, contactTotal), accent: "violet", icon: "file-text", hint: `${formatNumber(offerTotal)} / ${formatNumber(contactTotal)}` },
    { id: "offer-deal", label: "Offer → Deal", format: "percent", value: rate(totalDeals, offerTotal), accent: "indigo", icon: "handshake", hint: `${formatNumber(totalDeals)} / ${formatNumber(offerTotal)}` },
  ];

  /* -------------------------------- Günlük trend ----------------------------- */
  const dayMap = new Map<string, { total: number; answered: number }>();
  const dayOrder: string[] = [];
  for (const { teamPeriod } of teamBlocks) {
    for (const pt of teamPeriod.dailyTrend) {
      if (!dayMap.has(pt.day)) {
        dayMap.set(pt.day, { total: 0, answered: 0 });
        dayOrder.push(pt.day);
      }
      const e = dayMap.get(pt.day)!;
      e.total += pt.total;
      e.answered += pt.answered;
    }
  }
  const dailyTrend = dayOrder.map((day) => ({
    day,
    total: dayMap.get(day)!.total,
    answered: dayMap.get(day)!.answered,
  }));

  /* ------------------------- Bölge funnel (takım kırılımı) -------------------- */
  const funnelTemplate = teamBlocks[0]?.teamPeriod.fullFunnel ?? [];
  const funnel: RegionFunnelStage[] = funnelTemplate.map((stage, idx) => {
    const byTeam = teamBlocks.map(({ team, teamPeriod }) => ({
      teamId: team.teamId,
      teamName: team.teamName,
      count: teamPeriod.fullFunnel[idx]?.count ?? 0,
    }));
    const total = byTeam.reduce((s, t) => s + t.count, 0);
    const prevTotal =
      idx === 0
        ? null
        : teamBlocks.reduce((s, { teamPeriod }) => s + (teamPeriod.fullFunnel[idx - 1]?.count ?? 0), 0);
    return {
      key: stage.key,
      label: stage.label,
      total,
      prevPct: prevTotal !== null && prevTotal > 0 ? (total / prevTotal) * 100 : null,
      byTeam,
    };
  });

  /* ----------------------------- Dönüşüm kırılımı ---------------------------- */
  const sourceConversion = mergeConversion(teamBlocks.map((b) => b.teamPeriod.sourceConversion));
  const countryConversion = mergeConversion(teamBlocks.map((b) => b.teamPeriod.countryConversion));
  const languageConversion = mergeConversion(teamBlocks.map((b) => b.teamPeriod.languageConversion));

  /* ------------------------------ Backlog (takım) ---------------------------- */
  const backlogByTeam: TeamBacklogRow[] = teams
    .map((t) => ({
      teamId: t.teamId,
      teamName: t.teamName,
      neverCalled: t.neverCalled,
      slaViolations: t.slaViolations,
      pendingOffers: t.pendingOffers,
      overdueFollowUps: t.overdueFollowUps,
    }))
    .sort(
      (a, b) =>
        b.neverCalled + b.slaViolations + b.pendingOffers + b.overdueFollowUps -
        (a.neverCalled + a.slaViolations + a.pendingOffers + a.overdueFollowUps),
    );

  /* ----------------------------- Aksiyon & risk ------------------------------ */
  const actionCenter: RegionActionItem[] = [];
  for (const t of teams) {
    if (t.scoreStatus === "critical") {
      actionCenter.push({
        id: `${t.teamId}-score`,
        teamId: t.teamId,
        teamName: t.teamName,
        label: pick(lang, `${t.teamName} kritik performansta — takım skoru ${t.avgScore.toFixed(1)} (lider: ${t.teamLeaderName})`, `${t.teamName} is critically underperforming — team score ${t.avgScore.toFixed(1)} (leader: ${t.teamLeaderName})`),
        status: "critical",
      });
    }
    if (t.slaCompliantPct < 65 && t.calls > 0) {
      actionCenter.push({
        id: `${t.teamId}-sla`,
        teamId: t.teamId,
        teamName: t.teamName,
        label: pick(lang, `${t.teamName} SLA uyumu %${Math.round(t.slaCompliantPct)} — bölge hedefinin altında`, `${t.teamName} SLA compliance ${Math.round(t.slaCompliantPct)}% — below the region target`),
        status: "risk",
      });
    }
    if (t.neverCalled >= 15) {
      actionCenter.push({
        id: `${t.teamId}-uncalled`,
        teamId: t.teamId,
        teamName: t.teamName,
        label: pick(lang, `${t.teamName}'de ${t.neverCalled} lead henüz aranmadı`, `${t.teamName} has ${t.neverCalled} leads not yet called`),
        status: "warning",
      });
    }
    if (t.overdueFollowUps >= 10) {
      actionCenter.push({
        id: `${t.teamId}-overdue`,
        teamId: t.teamId,
        teamName: t.teamName,
        label: pick(lang, `${t.teamName}'de ${t.overdueFollowUps} lead takip tarihi geçmiş`, `${t.teamName} has ${t.overdueFollowUps} leads past their follow-up date`),
        status: "warning",
      });
    }
  }
  actionCenter.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  /* -------------------------------- Tavsiyeler ------------------------------- */
  const insights: TeamInsight[] = [];
  const regionAvgScore = teams.reduce((s, t) => s + t.avgScore, 0) / (teams.length || 1);
  if (bestTeam) {
    insights.push({
      id: "best-team",
      tone: "success",
      icon: "trophy",
      text: pick(lang, `${bestTeam.teamName} bölgenin lideri — takım skoru ${bestTeam.avgScore.toFixed(1)}, bölge ortalamasının ${Math.round((bestTeam.avgScore - regionAvgScore) * 10) / 10} puan üstünde. En iyi uygulamaları diğer takımlarla paylaş.`, `${bestTeam.teamName} leads the region — team score ${bestTeam.avgScore.toFixed(1)}, ${Math.round((bestTeam.avgScore - regionAvgScore) * 10) / 10} points above the region average. Share their best practices with the other teams.`),
    });
  }
  if (worstTeam && worstTeam.teamId !== bestTeam?.teamId) {
    insights.push({
      id: "worst-team",
      tone: worstTeam.scoreStatus === "critical" ? "critical" : "risk",
      icon: "alert",
      text: pick(lang, `${worstTeam.teamName} en çok desteğe ihtiyaç duyan takım (skor ${worstTeam.avgScore.toFixed(1)}). Lider ${worstTeam.teamLeaderName} ile SLA (%${Math.round(worstTeam.slaCompliantPct)}) ve dönüşüm önceliklerini konuş.`, `${worstTeam.teamName} needs the most support (score ${worstTeam.avgScore.toFixed(1)}). Discuss SLA (${Math.round(worstTeam.slaCompliantPct)}%) and conversion priorities with leader ${worstTeam.teamLeaderName}.`),
    });
  }
  const topAgent = agents[0];
  if (topAgent) {
    insights.push({
      id: "top-agent",
      tone: "success",
      icon: "star",
      text: pick(lang, `Bölgenin en başarılı danışmanı ${topAgent.name} (${topAgent.teamName}) — Genel Başarı ${topAgent.score.toFixed(1)}.`, `The region's top agent is ${topAgent.name} (${topAgent.teamName}) — Overall Score ${topAgent.score.toFixed(1)}.`),
    });
  }
  const slaBenchmark = 85;
  const slaDiff = Math.round((weightedSla * 100 - slaBenchmark) * 10) / 10;
  insights.push({
    id: "region-sla",
    tone: slaDiff >= 0 ? "success" : "risk",
    icon: "timer",
    text:
      slaDiff >= 0
        ? pick(lang, `Bölge SLA uyumu hedefin (%${slaBenchmark}) ${slaDiff} puan üstünde — genel operasyonel disiplin iyi.`, `Region SLA compliance is ${slaDiff} points above target (${slaBenchmark}%) — overall operational discipline is good.`)
        : pick(lang, `Bölge SLA uyumu hedefin (%${slaBenchmark}) ${Math.abs(slaDiff)} puan altında — ilk arama hızı takım liderleriyle ele alınmalı.`, `Region SLA compliance is ${Math.abs(slaDiff)} points below target (${slaBenchmark}%) — first-call speed should be addressed with the team leaders.`),
  });

  const targetEUR = MONTHLY_TARGET_EUR * totalAgents;
  const targetPct = (totalPaymentsEUR / targetEUR) * 100;

  const result: RegionPeriodData = {
    regionKpis,
    conversionRates,
    targetPct: Math.round(targetPct * 10) / 10,
    targetEUR,
    actualEUR: totalPaymentsEUR,
    teams,
    bestTeam,
    worstTeam,
    agents,
    best5Agents,
    worst5Agents,
    dailyTrend,
    funnel,
    sourceConversion,
    countryConversion,
    languageConversion,
    actionCenter,
    backlogByTeam,
    insights,
  };

  REGION_CACHE.push({ startMs, endMs, records, lang, result });
  if (REGION_CACHE.length > REGION_CACHE_MAX) REGION_CACHE.shift();
  return result;
}
