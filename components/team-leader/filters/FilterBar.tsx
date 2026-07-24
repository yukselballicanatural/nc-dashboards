"use client";

import { CalendarClock } from "lucide-react";
import { useTeamDateRange } from "./TeamDateRangeContext";
import { DateRangeFilter } from "./DateRangeFilter";
import { T } from "@/components/i18n/T";

/**
 * Takım Lideri global filtre şeridi — agent panelindeki FilterBar ile aynı
 * desen, takım context'ine bağlı.
 */
export function FilterBar() {
  const { label } = useTeamDateRange();

  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 font-body text-[12.5px] text-fg-secondary">
        <CalendarClock size={15} aria-hidden className="text-brand" />
        <span className="font-medium text-fg"><T tr="Dönem:" en="Period:" /></span>
        <span className="font-mono text-fg-secondary">{label}</span>
      </div>
      <DateRangeFilter />
    </div>
  );
}
