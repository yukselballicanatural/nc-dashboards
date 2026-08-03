"use client";

import { useDateRange } from "@/components/agent/filters/DateRangeContext";
import { useLang } from "@/components/i18n/LanguageProvider";
import { qualityKpis, shiftKpis } from "@/lib/mock/datasets";
import { KpiGrid } from "./KpiGrid";

/**
 * Üst özet KPI ızgarası — seçili tarih aralığına göre (context'ten) + kalite/
 * vardiya özet kartları (bunlar dönem filtresinden bağımsız, sabit ayrı bir
 * seed'den gelir — bkz. lib/mock/datasets.ts).
 */
export function OverviewKpiGrid() {
  const { data } = useDateRange();
  const { lang } = useLang();
  const kpis = [...data.overviewKpis, ...qualityKpis(lang).slice(0, 1), ...shiftKpis(lang).slice(0, 1)];
  return <KpiGrid kpis={kpis} className="lg:grid-cols-4" />;
}
