"use client";

import { CalendarClock } from "lucide-react";
import { useDateRange } from "./DateRangeContext";
import { DateRangeFilter } from "./DateRangeFilter";
import { T } from "@/components/i18n/T";

/**
 * Global filtre şeridi — her sayfanın tepesinde (agent layout).
 * Sol: seçili dönemin insan-okur etiketi · Sağ: şık tarih filtresi.
 */
export function FilterBar() {
  const { label } = useDateRange();

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
