import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { TeamDashboardHeader } from "@/components/team-leader/TeamDashboardHeader";
import { BestWorstAgents } from "@/components/team-leader/comparison/BestWorstAgents";
import { DimensionLeaders } from "@/components/team-leader/comparison/DimensionLeaders";
import { PerformanceScatter } from "@/components/team-leader/comparison/PerformanceScatter";
import { RoleBreakdown } from "@/components/team-leader/comparison/RoleBreakdown";
import { AgentComparisonTable } from "@/components/team-leader/comparison/AgentComparisonTable";
import { AgentEarningsTable } from "@/components/team-leader/comparison/AgentEarningsTable";

export const metadata: Metadata = {
  title: "Natural Clinic — Agent Karşılaştırması",
};

/**
 * Agent Karşılaştırması — CLAUDE.md Bölüm 9, sekme 2/5.
 * Best5/Worst5 + tam detay tablosu (sıralanabilir).
 */
export default function TeamLeaderComparisonPage() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <TeamDashboardHeader
        title={<T tr="Agent Karşılaştırması" en="Agent Comparison" />}
        subtitle={<T tr="Kim öne çıkıyor, kim koçluğa ihtiyaç duyuyor — Genel Başarı puanına göre." en="Who stands out, who needs coaching — by Overall Score." />}
      />
      <BestWorstAgents />
      <DimensionLeaders />
      <PerformanceScatter />
      <RoleBreakdown />
      <AgentComparisonTable />
      <AgentEarningsTable />
    </div>
  );
}
