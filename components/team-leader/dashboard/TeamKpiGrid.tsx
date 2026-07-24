"use client";

import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { KpiGrid } from "@/components/agent/dashboard/KpiGrid";

/** Takım özet KPI ızgarası — seçili tarih aralığına göre (context'ten). */
export function TeamKpiGrid() {
  const { data } = useTeamDateRange();
  return <KpiGrid kpis={data.teamKpis} className="lg:grid-cols-3" />;
}
