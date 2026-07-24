import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { TeamDashboardHeader } from "@/components/team-leader/TeamDashboardHeader";
import { ActionSummary } from "@/components/team-leader/action-center/ActionSummary";
import { TeamActionCenter } from "@/components/team-leader/action-center/TeamActionCenter";
import { TeamCallbackList } from "@/components/team-leader/action-center/TeamCallbackList";

export const metadata: Metadata = {
  title: "Natural Clinic — Aksiyon Merkezi",
};

/**
 * Aksiyon Merkezi — CLAUDE.md Bölüm 9, sekme 5/5.
 * "Bugün kiminle konuşmam lazım" sorusuna direkt cevap.
 */
export default function TeamLeaderActionCenterPage() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <TeamDashboardHeader
        title={<T tr="Aksiyon Merkezi" en="Action Center" />}
        subtitle={<T tr="Takımda bugün kiminle konuşman gerektiğini gösterir." en="Shows who you need to talk to in the team today." />}
      />
      <ActionSummary />
      <TeamActionCenter />
      <TeamCallbackList />
    </div>
  );
}
