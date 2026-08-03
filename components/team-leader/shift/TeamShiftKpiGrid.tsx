"use client";

import { useLang } from "@/components/i18n/LanguageProvider";
import { teamShiftKpis } from "@/lib/mock/team-monthly";
import { KpiGrid } from "@/components/agent/dashboard/KpiGrid";

/** "Bu Hafta" vardiya KPI ızgarası — dile göre etiketlenir. */
export function TeamShiftKpiGrid() {
  const { lang } = useLang();
  return <KpiGrid kpis={teamShiftKpis(lang)} />;
}
