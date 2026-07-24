import type { Metadata } from "next";
import { DashboardSection } from "@/components/agent/dashboard/DashboardSection";
import { KpiGrid } from "@/components/agent/dashboard/KpiGrid";
import { TeamHeroHeader } from "@/components/team-leader/dashboard/TeamHeroHeader";
import { TeamAssistantCard } from "@/components/team-leader/dashboard/TeamAssistantCard";
import { TeamKpiGrid } from "@/components/team-leader/dashboard/TeamKpiGrid";
import { TeamConversionKpis } from "@/components/team-leader/dashboard/TeamConversionKpis";
import { TeamTargetGauge } from "@/components/team-leader/dashboard/TeamTargetGauge";
import { TeamScoreBarList } from "@/components/team-leader/dashboard/TeamScoreBarList";
import { TierDistributionChart } from "@/components/team-leader/dashboard/TierDistribution";
import { TeamDailyTrendChart } from "@/components/team-leader/dashboard/TeamDailyTrendChart";
import { TeamConversionTables } from "@/components/team-leader/dashboard/TeamConversionTables";
import { TeamActionPreview } from "@/components/team-leader/dashboard/TeamActionPreview";
import { TeamMonthlyPaceChart } from "@/components/team-leader/monthly/TeamMonthlyPaceChart";
import { TeamShiftTable } from "@/components/team-leader/shift/TeamShiftTable";
import { TeamQualityBarList } from "@/components/team-leader/quality/TeamQualityBarList";
import { TEAM_MONTHLY_KPIS, TEAM_SHIFT_KPIS, TEAM_QUALITY_KPIS } from "@/lib/mock/team-monthly";

export const metadata: Metadata = {
  title: "Natural Clinic — Takım Özeti",
};

/**
 * Takım Özeti — CLAUDE.md Bölüm 9, sekme 1/5.
 * Gerçek bir dashboard: karşılama + kural-tabanlı tavsiyeler (v2'de yapay
 * zekaya bağlanacak), seçili dönem özeti, bu ayın satış/hedef durumu, bu
 * haftanın vardiya uyumu ve takımın kalite puanı — hepsi tek sayfada.
 */
export default function TeamLeaderOverviewPage() {
  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <TeamHeroHeader />
      <TeamAssistantCard />

      <DashboardSection id="ozet" eyebrow="Genel Bakış" title="Seçili Dönemin Özeti">
        <div className="flex flex-col gap-4 sm:gap-5">
          <TeamKpiGrid />
          <TeamConversionKpis />
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <TeamTargetGauge />
            </div>
            <div className="lg:col-span-8">
              <TeamScoreBarList />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <TeamDailyTrendChart />
            </div>
            <div className="lg:col-span-5">
              <TierDistributionChart />
            </div>
          </div>
          <TeamConversionTables />
          <TeamActionPreview />
        </div>
      </DashboardSection>

      <DashboardSection id="bu-ay" eyebrow="Bu Ay" title="Satış ve Hedef Durumu">
        <div className="flex flex-col gap-4 sm:gap-5">
          <KpiGrid kpis={TEAM_MONTHLY_KPIS} className="lg:grid-cols-5" />
          <TeamMonthlyPaceChart />
        </div>
      </DashboardSection>

      <DashboardSection id="bu-hafta" eyebrow="Bu Hafta" title="Vardiya ve Mesai Uyumu">
        <div className="flex flex-col gap-4 sm:gap-5">
          <KpiGrid kpis={TEAM_SHIFT_KPIS} />
          <TeamShiftTable />
        </div>
      </DashboardSection>

      <DashboardSection id="kalite" eyebrow="Kalite" title="Takımın Çağrı Kalitesi">
        <div className="flex flex-col gap-4 sm:gap-5">
          <KpiGrid kpis={TEAM_QUALITY_KPIS} />
          <TeamQualityBarList />
        </div>
      </DashboardSection>
    </div>
  );
}
