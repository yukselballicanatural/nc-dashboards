"use client";

import { useDateRange } from "@/components/agent/filters/DateRangeContext";
import { KpiGrid } from "./KpiGrid";

/**
 * Arama KPI ızgarası — seçili tarih aralığına göre (context'ten) hesaplanır.
 */
export function CallKpiGrid() {
  const { data } = useDateRange();
  return <KpiGrid kpis={data.callKpis} className="lg:grid-cols-5" />;
}
