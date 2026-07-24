import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { RegionDashboardHeader } from "@/components/region-manager/RegionDashboardHeader";
import { RegionBestWorstAgents } from "@/components/region-manager/agents/RegionBestWorstAgents";
import { RegionAgentTable } from "@/components/region-manager/agents/RegionAgentTable";

export const metadata: Metadata = {
  title: "Natural Clinic — Agent Sıralaması",
};

/**
 * Agent Sıralaması — Bölge Müdürü paneli, sekme 3/5.
 * Bölgedeki tüm danışmanlar tek listede: Best/Worst + filtrelenebilir tablo.
 */
export default function RegionAgentsPage() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <RegionDashboardHeader
        title={<T tr="Agent Sıralaması" en="Agent Ranking" />}
        subtitle={
          <T
            tr="Bölgedeki tüm danışmanlar takım fark etmeksizin tek sıralamada — en iyiler ve destek gerekenler."
            en="All agents in the region in a single ranking regardless of team — the best and those needing support."
          />
        }
      />
      <RegionBestWorstAgents />
      <RegionAgentTable />
    </div>
  );
}
