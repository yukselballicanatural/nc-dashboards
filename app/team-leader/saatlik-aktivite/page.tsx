import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { TeamDashboardHeader } from "@/components/team-leader/TeamDashboardHeader";
import { TeamHourlyVolumeChart } from "@/components/team-leader/heatmap/TeamHourlyVolumeChart";
import { HourlyHeatmap } from "@/components/team-leader/heatmap/HourlyHeatmap";
import { ResponseSpeedCard } from "@/components/team-leader/heatmap/ResponseSpeedCard";
import { CallRealizationTable } from "@/components/team-leader/heatmap/CallRealizationTable";
import { DailyLeadMatrix } from "@/components/team-leader/heatmap/DailyLeadMatrix";

export const metadata: Metadata = {
  title: "Natural Clinic — Saatlik Aktivite",
};

/**
 * Saatlik Aktivite — CLAUDE.md Bölüm 9, sekme 3/5.
 * Isı haritası: hangi agent, mesai saatlerinin hangi diliminde arama yapmıyor.
 */
export default function TeamLeaderHourlyActivityPage() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <TeamDashboardHeader
        title={<T tr="Saatlik Aktivite" en="Hourly Activity" />}
        subtitle={<T tr="Mesai saatlerindeki boşlukları görün — kim, hangi saatte aramıyor." en="See the gaps during working hours — who isn't calling, and when." />}
      />
      <TeamHourlyVolumeChart />
      <HourlyHeatmap />
      <ResponseSpeedCard />
      <CallRealizationTable />
      <DailyLeadMatrix />
    </div>
  );
}
