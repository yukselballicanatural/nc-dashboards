import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { RegionDashboardHeader } from "@/components/region-manager/RegionDashboardHeader";
import { RegionActionSummary } from "@/components/region-manager/action/RegionActionSummary";
import { RegionActionCenter } from "@/components/region-manager/action/RegionActionCenter";
import { TeamBacklogTable } from "@/components/region-manager/action/TeamBacklogTable";

export const metadata: Metadata = {
  title: "Natural Clinic — Aksiyon & Risk",
};

/**
 * Aksiyon & Risk — Bölge Müdürü paneli, sekme 5/5.
 * "Hangi takım liderine bugün ne söylemeliyim" sorusuna cevap.
 */
export default function RegionActionRiskPage() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <RegionDashboardHeader
        title={<T tr="Aksiyon & Risk" en="Action & Risk" />}
        subtitle={
          <T
            tr="Bölge genelinde risk sinyalleri ve hangi takımın hangi konuda desteğe ihtiyacı var."
            en="Risk signals across the region and which team needs support on which topic."
          />
        }
      />
      <RegionActionSummary />
      <RegionActionCenter />
      <TeamBacklogTable />
    </div>
  );
}
