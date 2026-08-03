"use client";

import { useLang } from "@/components/i18n/LanguageProvider";
import { teamQualityKpis } from "@/lib/mock/team-monthly";
import { KpiGrid } from "@/components/agent/dashboard/KpiGrid";

/** Kalite KPI ızgarası — dile göre etiketlenir. */
export function TeamQualityKpiGrid() {
  const { lang } = useLang();
  return <KpiGrid kpis={teamQualityKpis(lang)} />;
}
