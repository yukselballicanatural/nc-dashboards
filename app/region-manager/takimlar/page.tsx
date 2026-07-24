import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { RegionDashboardHeader } from "@/components/region-manager/RegionDashboardHeader";
import { BestWorstTeam } from "@/components/region-manager/teams/BestWorstTeam";
import { TeamMetricChart } from "@/components/region-manager/teams/TeamMetricChart";
import { TeamComparisonTable } from "@/components/region-manager/teams/TeamComparisonTable";

export const metadata: Metadata = {
  title: "Natural Clinic — Takım Karşılaştırması",
};

/**
 * Takım Karşılaştırması — Bölge Müdürü paneli, sekme 2/5.
 * Takım takım kıyaslama: en iyi/destek gereken takım, metrik grafiği,
 * sıralanabilir detay tablosu.
 */
export default function RegionTeamsPage() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <RegionDashboardHeader
        title={<T tr="Takım Karşılaştırması" en="Team Comparison" />}
        subtitle={
          <T
            tr="Hangi takım önde, hangisi geride ve neden — takım liderleriyle konuşacağın konular burada."
            en="Which team is ahead, which is behind and why — the topics to discuss with team leaders are here."
          />
        }
      />
      <BestWorstTeam />
      <TeamMetricChart />
      <TeamComparisonTable />
    </div>
  );
}
