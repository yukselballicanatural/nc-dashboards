"use client";

import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { KpiGrid } from "@/components/agent/dashboard/KpiGrid";

/** 3 dönüşüm oranı KPI kartı — Lead→Contact, Contact→Offer, Offer→Deal. */
export function TeamConversionKpis() {
  const { data } = useTeamDateRange();
  return <KpiGrid kpis={data.conversionRates} className="lg:grid-cols-3" />;
}
