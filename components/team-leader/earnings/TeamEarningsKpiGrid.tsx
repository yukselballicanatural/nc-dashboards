"use client";

import { useLang } from "@/components/i18n/LanguageProvider";
import { teamLeaderEarningsKpis } from "@/lib/mock/team-earnings";
import { KpiGrid } from "@/components/agent/dashboard/KpiGrid";

/** "Prim & Komisyon" KPI ızgarası — dile göre etiketlenir (bkz. team-earnings.ts). */
export function TeamEarningsKpiGrid() {
  const { lang } = useLang();
  return <KpiGrid kpis={teamLeaderEarningsKpis(lang)} />;
}
