"use client";

import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { KpiGrid } from "@/components/agent/dashboard/KpiGrid";

/** Bölge özet KPI ızgarası. */
export function RegionKpiGrid() {
  const { data } = useRegionDateRange();
  return <KpiGrid kpis={data.regionKpis} className="lg:grid-cols-4" />;
}

/** Bölge dönüşüm oranı KPI'ları (3 kart). */
export function RegionConversionKpis() {
  const { data } = useRegionDateRange();
  return <KpiGrid kpis={data.conversionRates} className="lg:grid-cols-3" />;
}
