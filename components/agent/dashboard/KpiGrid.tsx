"use client";

import type { Kpi } from "@/lib/types/agent-data";
import { KpiCard } from "@/components/ui/KpiCard";
import { StaggerGroup, StaggerItem } from "@/components/ui/Stagger";
import { cn } from "@/lib/utils/cn";

/**
 * Generic KPI ızgarası — her sayfa kendi KPI setini geçirir.
 * Mobilde 2 sütun (CLAUDE.md 7); staggered giriş (3.4).
 */
export function KpiGrid({
  kpis,
  className,
}: {
  kpis: Kpi[];
  /** Grid sütun sınıfları — varsayılan: 2/3/4 sütun. */
  className?: string;
}) {
  return (
    <StaggerGroup
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4",
        className,
      )}
    >
      {kpis.map((kpi) => (
        <StaggerItem key={kpi.id}>
          <KpiCard kpi={kpi} />
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
