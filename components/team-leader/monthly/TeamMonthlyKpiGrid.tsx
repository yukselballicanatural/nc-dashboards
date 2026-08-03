"use client";

import { useLang } from "@/components/i18n/LanguageProvider";
import { teamMonthlyKpis } from "@/lib/mock/team-monthly";
import { KpiGrid } from "@/components/agent/dashboard/KpiGrid";

/** "Bu Ay" KPI ızgarası — dile göre etiketlenir (bkz. team-monthly.ts). */
export function TeamMonthlyKpiGrid() {
  const { lang } = useLang();
  return <KpiGrid kpis={teamMonthlyKpis(lang)} className="lg:grid-cols-5" />;
}
