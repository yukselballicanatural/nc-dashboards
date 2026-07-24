import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { TeamDashboardHeader } from "@/components/team-leader/TeamDashboardHeader";
import { ConversionRateKpis } from "@/components/team-leader/funnel/ConversionRateKpis";
import { TeamFunnelChart } from "@/components/team-leader/funnel/TeamFunnelChart";
import { OpportunityStageBreakdown } from "@/components/team-leader/funnel/OpportunityStageBreakdown";
import { LossReasonBreakdown } from "@/components/team-leader/funnel/LossReasonBreakdown";
import { BacklogSummary } from "@/components/team-leader/funnel/BacklogSummary";
import { BacklogTable } from "@/components/team-leader/funnel/BacklogTable";

export const metadata: Metadata = {
  title: "Natural Clinic — Funnel & Backlog",
};

/**
 * Funnel & Backlog — CLAUDE.md Bölüm 9, sekme 4/5.
 * Takımın lead'den ödemeye yolculuğu + hangi agent'ta ne birikmiş.
 */
export default function TeamLeaderFunnelBacklogPage() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <TeamDashboardHeader
        title={<T tr="Funnel & Backlog" en="Funnel & Backlog" />}
        subtitle={<T tr="Takımın fırsatları nerede tıkanıyor ve hangi agent'ta iş birikmiş." en="Where the team's opportunities stall and which agent has a backlog." />}
      />
      <ConversionRateKpis />
      <TeamFunnelChart />
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <OpportunityStageBreakdown />
        <LossReasonBreakdown />
      </div>
      <BacklogSummary />
      <BacklogTable />
    </div>
  );
}
