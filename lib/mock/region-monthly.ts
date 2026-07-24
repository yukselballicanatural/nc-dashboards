/**
 * Bölge geneli "bu ay" satış/hedef özeti — tarih filtresinden BAĞIMSIZ, sabit
 * dönemli. Fonksiyon halinde: aktif veri seti (yüklü Excel ya da seed) verilir.
 */

import type { Kpi, PacePoint } from "@/lib/types/agent-data";
import { DAY } from "./lead-engine";
import { MONTHLY_TARGET_EUR } from "./datasets";
import { REGION_TEAM_RECORDS, type RegionTeamRecord } from "./region-data";
import { pick, type Lang } from "@/lib/i18n/core";

const MONTH_START = Date.parse("2026-07-01T00:00:00+03:00");
const DAYS_IN_MONTH = 31;
const DAY_OF_MONTH = 14;

export interface RegionMonthly {
  kpis: Kpi[];
  pace: PacePoint[];
}

export function computeRegionMonthly(
  records: RegionTeamRecord[] = REGION_TEAM_RECORDS,
  lang: Lang = "tr",
): RegionMonthly {
  const totalAgents = records.reduce((s, t) => s + t.agents.length, 0);
  const allLeads = records.flatMap((t) => t.agents).flatMap((a) => a.leads);
  const monthPayments = allLeads.filter(
    (l) => l.paymentAt !== null && l.paymentAt >= MONTH_START,
  );
  const monthlySalesEUR = monthPayments.reduce((s, l) => s + (l.dealAmount ?? 0), 0);
  const wonDealsMonth = allLeads.filter(
    (l) => l.dealStatus === "Won" && l.dealAt !== null && l.dealAt >= MONTH_START,
  ).length;
  const regionTargetEUR = MONTHLY_TARGET_EUR * totalAgents;
  const forecastEUR = Math.round(
    monthlySalesEUR + (monthlySalesEUR / DAY_OF_MONTH) * (DAYS_IN_MONTH - DAY_OF_MONTH),
  );
  const monthlyPct = regionTargetEUR > 0 ? (monthlySalesEUR / regionTargetEUR) * 100 : 0;

  const kpis: Kpi[] = [
    { id: "region-m-target", label: pick(lang, "Bölge Aylık Hedefi", "Region Monthly Target"), format: "currency", value: regionTargetEUR, accent: "brand-secondary", icon: "target", hint: pick(lang, `${totalAgents} danışman × aylık hedef`, `${totalAgents} agents × monthly target`) },
    { id: "region-m-actual", label: pick(lang, "Bu Ay Gerçekleşen Satış", "Actual Sales This Month"), format: "currency", value: monthlySalesEUR, accent: "brand", icon: "banknote", hint: pick(lang, "ödemesi alınan deal'ler", "deals with payment received") },
    { id: "region-m-rate", label: pick(lang, "Hedef Gerçekleşme", "Target Achievement"), format: "percent", value: Math.round(monthlyPct * 10) / 10, accent: "brand", icon: "percent", hint: pick(lang, "gerçekleşen ÷ bölge hedefi", "actual ÷ region target") },
    { id: "region-m-won", label: pick(lang, "Bu Ay Won Deal", "Won Deals This Month"), format: "number", value: wonDealsMonth, accent: "violet", icon: "handshake", hint: pick(lang, "bölge genelinde kapanan satış", "deals closed across the region") },
    { id: "region-m-forecast", label: pick(lang, "Tahmini Ay Sonu", "Projected Month-End"), format: "currency", value: forecastEUR, accent: "brand-secondary", icon: "trending-up", hint: pick(lang, "mevcut tempoyla projeksiyon", "projection at the current pace") },
  ];

  const pace: PacePoint[] = [];
  let cumulative = 0;
  for (let day = 1; day <= DAYS_IN_MONTH; day++) {
    const dayStart = MONTH_START + (day - 1) * DAY;
    if (day <= DAY_OF_MONTH) {
      cumulative += monthPayments
        .filter((l) => (l.paymentAt ?? 0) >= dayStart && (l.paymentAt ?? 0) < dayStart + DAY)
        .reduce((s, l) => s + (l.dealAmount ?? 0), 0);
    }
    pace.push({
      day: String(day),
      actualEUR: day <= DAY_OF_MONTH ? cumulative : null,
      targetEUR: Math.round((regionTargetEUR / DAYS_IN_MONTH) * day),
    });
  }

  return { kpis, pace };
}
