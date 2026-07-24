"use client";

import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { KpiGrid } from "@/components/agent/dashboard/KpiGrid";

/** Lead→Contact / Contact→Offer / Offer→Deal takım dönüşüm oranları. */
export function ConversionRateKpis() {
  const { data } = useTeamDateRange();
  return <KpiGrid kpis={data.conversionRates} className="lg:grid-cols-3" />;
}
