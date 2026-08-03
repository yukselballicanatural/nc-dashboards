/**
 * Takım geneli "bu ay" ve "bu hafta" özetleri — tarih filtresinden BAĞIMSIZ
 * sabit dönemli veriler (agent panelindeki GOAL/TARGET_PACE/SHIFT_KPIS/
 * QUALITY_KPIS ile aynı doğa: aylık hedef ve haftalık vardiya, seçili tarih
 * aralığına göre değişmez — bkz. compute.ts başındaki not).
 *
 * Bu ay = satış/hedef gerçekleşmesi (12 agent'ın toplam cirosu).
 * Bu hafta = vardiya uyumu ve eksik çalışma saati.
 * Kalite = son 30 gün, agent bazlı ortalama puan.
 */

import type { Kpi, PacePoint } from "@/lib/types/agent-data";
import { pick, type Lang } from "@/lib/i18n/core";
import { DAY } from "./lead-engine";
import { MONTHLY_TARGET_EUR } from "./datasets";
import { TEAM_AGENTS } from "./team-data";
import { TEAM_SHIFT_QUALITY } from "./team-shift-quality";

const MONTH_START = Date.parse("2026-07-01T00:00:00+03:00");
const DAYS_IN_MONTH = 31;
const DAY_OF_MONTH = 14;
/** 09:00-18:00 vardiyada 1 saatlik öğle molası varsayımıyla net çalışma hedefi. */
const PLANNED_NET_HOURS = 8;

/* ------------------------------------------------------------------ */
/* BU AY — takım satış/hedef gerçekleşmesi                             */
/* ------------------------------------------------------------------ */

const allMonthLeads = TEAM_AGENTS.flatMap((a) => a.leads);
const monthPayments = allMonthLeads.filter(
  (l) => l.paymentAt !== null && l.paymentAt >= MONTH_START,
);
const totalMonthlySalesEUR = monthPayments.reduce((s, l) => s + (l.dealAmount ?? 0), 0);
const totalWonDealsMonth = allMonthLeads.filter(
  (l) => l.dealStatus === "Won" && l.dealAt !== null && l.dealAt >= MONTH_START,
).length;
const teamTargetEUR = MONTHLY_TARGET_EUR * TEAM_AGENTS.length;
const teamForecastEUR = Math.round(
  totalMonthlySalesEUR + (totalMonthlySalesEUR / DAY_OF_MONTH) * (DAYS_IN_MONTH - DAY_OF_MONTH),
);
const teamMonthlyPct = (totalMonthlySalesEUR / teamTargetEUR) * 100;

export function teamMonthlyKpis(lang: Lang = "tr"): Kpi[] {
  return [
    { id: "team-target", label: pick(lang, "Takım Aylık Hedefi", "Team Monthly Target"), format: "currency", value: teamTargetEUR, accent: "brand-secondary", icon: "target", hint: pick(lang, `${TEAM_AGENTS.length} agent × aylık hedef`, `${TEAM_AGENTS.length} agents × monthly target`) },
    { id: "team-actual", label: pick(lang, "Bu Ay Gerçekleşen Satış", "This Month's Actual Sales"), format: "currency", value: totalMonthlySalesEUR, accent: "brand", icon: "banknote", hint: pick(lang, "ödemesi alınan deal'ler", "deals with payment received") },
    { id: "team-rate", label: pick(lang, "Hedef Gerçekleşme", "Target Achievement"), format: "percent", value: Math.round(teamMonthlyPct * 10) / 10, accent: "brand", icon: "percent", hint: pick(lang, "gerçekleşen ÷ takım hedefi", "actual ÷ team target") },
    { id: "team-won", label: pick(lang, "Bu Ay Won Deal", "This Month's Won Deals"), format: "number", value: totalWonDealsMonth, accent: "violet", icon: "handshake", hint: pick(lang, "takım genelinde kapanan satış", "deals closed across the team") },
    { id: "team-forecast", label: pick(lang, "Tahmini Ay Sonu", "Projected Month-End"), format: "currency", value: teamForecastEUR, accent: "brand-secondary", icon: "trending-up", hint: pick(lang, "mevcut tempoyla projeksiyon", "projection at current pace") },
  ];
}

export const TEAM_MONTHLY_PACE: PacePoint[] = (() => {
  const points: PacePoint[] = [];
  let cumulative = 0;
  for (let day = 1; day <= DAYS_IN_MONTH; day++) {
    const dayStart = MONTH_START + (day - 1) * DAY;
    if (day <= DAY_OF_MONTH) {
      cumulative += monthPayments
        .filter((l) => (l.paymentAt ?? 0) >= dayStart && (l.paymentAt ?? 0) < dayStart + DAY)
        .reduce((s, l) => s + (l.dealAmount ?? 0), 0);
    }
    points.push({
      day: String(day),
      actualEUR: day <= DAY_OF_MONTH ? cumulative : null,
      targetEUR: Math.round((teamTargetEUR / DAYS_IN_MONTH) * day),
    });
  }
  return points;
})();

/* ------------------------------------------------------------------ */
/* BU HAFTA — vardiya uyumu ve eksik çalışma saati                      */
/* ------------------------------------------------------------------ */

export interface TeamShiftRow {
  agentId: string;
  name: string;
  role: "Senior" | "Junior";
  lateMinutesTotal: number;
  deficitHours: number;
  compliancePct: number;
  avgBreakMinutes: number;
}

export const TEAM_SHIFT_ROWS: TeamShiftRow[] = TEAM_SHIFT_QUALITY.map((agent) => {
  const week = agent.shiftWeek;
  const lateMinutesTotal = week.reduce((s, d) => s + d.lateMinutes, 0);
  const deficitHours = week.reduce((s, d) => s + Math.max(0, PLANNED_NET_HOURS - d.workedHours), 0);
  const compliancePct = (week.filter((d) => d.lateMinutes <= 5).length / week.length) * 100;
  const avgBreakMinutes = week.reduce((s, d) => s + d.breakMinutes, 0) / week.length;
  return {
    agentId: agent.agentId,
    name: agent.name,
    role: agent.role,
    lateMinutesTotal,
    deficitHours: Math.round(deficitHours * 10) / 10,
    compliancePct: Math.round(compliancePct * 10) / 10,
    avgBreakMinutes: Math.round(avgBreakMinutes),
  };
}).sort((a, b) => b.deficitHours - a.deficitHours);

const totalDeficitHours = TEAM_SHIFT_ROWS.reduce((s, r) => s + r.deficitHours, 0);
const totalLateMinutes = TEAM_SHIFT_ROWS.reduce((s, r) => s + r.lateMinutesTotal, 0);
const avgCompliancePct =
  TEAM_SHIFT_ROWS.reduce((s, r) => s + r.compliancePct, 0) / TEAM_SHIFT_ROWS.length;

export function teamShiftKpis(lang: Lang = "tr"): Kpi[] {
  return [
    { id: "team-deficit", label: pick(lang, "Bu Hafta Eksik Çalışma", "This Week's Shortfall"), format: "number", value: Math.round(totalDeficitHours * 10) / 10, accent: "brand-secondary", status: totalDeficitHours > 20 ? "risk" : "success", icon: "timer", hint: pick(lang, "saat, takım toplamı (planlanan 8 sa/gün net)", "hours, team total (planned 8 net hrs/day)") },
    { id: "team-compliance", label: pick(lang, "Ortalama Vardiya Uyumu", "Average Shift Compliance"), format: "percent", value: Math.round(avgCompliancePct * 10) / 10, accent: "indigo", icon: "clock", hint: pick(lang, "≤5 dk gecikme = uyumlu", "≤5 min late = compliant") },
    { id: "team-late", label: pick(lang, "Toplam Geç Kalma", "Total Lateness"), format: "number", value: totalLateMinutes, accent: "brand-secondary", status: totalLateMinutes > 200 ? "risk" : "success", icon: "alert", hint: pick(lang, "dakika, takım toplamı (7 gün)", "minutes, team total (7 days)") },
    { id: "team-agents", label: pick(lang, "Aktif Agent", "Active Agents"), format: "number", value: TEAM_AGENTS.length, accent: "brand", icon: "users", hint: pick(lang, "takımdaki toplam agent sayısı", "total agents on the team") },
  ];
}

/* ------------------------------------------------------------------ */
/* KALİTE — son 30 gün, agent bazlı ortalama                           */
/* ------------------------------------------------------------------ */

export interface TeamQualityRow {
  agentId: string;
  name: string;
  avgQuality: number;
  currentQuality: number;
}

export const TEAM_QUALITY_ROWS: TeamQualityRow[] = TEAM_SHIFT_QUALITY.map((agent) => {
  const avg =
    agent.qualityTrend.reduce((s, p) => s + p.score, 0) / agent.qualityTrend.length;
  return {
    agentId: agent.agentId,
    name: agent.name,
    avgQuality: Math.round(avg * 10) / 10,
    currentQuality: agent.qualityTrend[agent.qualityTrend.length - 1].score,
  };
}).sort((a, b) => b.avgQuality - a.avgQuality);

const teamAvgQuality =
  TEAM_QUALITY_ROWS.reduce((s, r) => s + r.avgQuality, 0) / TEAM_QUALITY_ROWS.length;

export function teamQualityKpis(lang: Lang = "tr"): Kpi[] {
  return [
    { id: "team-quality-avg", label: pick(lang, "Takım Ortalama Kalite", "Team Average Quality"), format: "number", value: Math.round(teamAvgQuality * 10) / 10, accent: "violet", icon: "star", hint: pick(lang, "son 30 gün, 12 agent ortalaması", "last 30 days, average of 12 agents") },
    { id: "team-quality-best", label: pick(lang, "En Yüksek Kalite", "Highest Quality"), format: "number", value: TEAM_QUALITY_ROWS[0]?.avgQuality ?? 0, accent: "violet", icon: "badge-check", hint: TEAM_QUALITY_ROWS[0]?.name ?? "—" },
    { id: "team-quality-worst", label: pick(lang, "En Düşük Kalite", "Lowest Quality"), format: "number", value: TEAM_QUALITY_ROWS[TEAM_QUALITY_ROWS.length - 1]?.avgQuality ?? 0, accent: "brand-secondary", status: "risk", icon: "alert", hint: TEAM_QUALITY_ROWS[TEAM_QUALITY_ROWS.length - 1]?.name ?? "—" },
  ];
}
