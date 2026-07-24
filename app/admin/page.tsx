import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { DashboardSection } from "@/components/agent/dashboard/DashboardSection";
import { FilterBar } from "@/components/region-manager/filters/FilterBar";
import { DataSourceStatus } from "@/components/admin/DataSourceStatus";
import { RegionKpiGrid, RegionConversionKpis } from "@/components/region-manager/dashboard/RegionKpiGrid";
import { TeamRankBarList } from "@/components/region-manager/dashboard/TeamRankBarList";
import { TeamRevenueShare } from "@/components/region-manager/dashboard/TeamRevenueShare";
import { RegionTalentDistribution } from "@/components/region-manager/dashboard/RegionTalentDistribution";
import { TeamEfficiencyTable } from "@/components/region-manager/dashboard/TeamEfficiencyTable";
import { RegionMonthlySection } from "@/components/region-manager/monthly/RegionMonthlySection";
import { BestWorstTeam } from "@/components/region-manager/teams/BestWorstTeam";
import { TeamMetricChart } from "@/components/region-manager/teams/TeamMetricChart";
import { TeamComparisonTable } from "@/components/region-manager/teams/TeamComparisonTable";
import { RegionBestWorstAgents } from "@/components/region-manager/agents/RegionBestWorstAgents";
import { RegionAgentTable } from "@/components/region-manager/agents/RegionAgentTable";
import { RegionFunnelChart } from "@/components/region-manager/funnel/RegionFunnelChart";
import { RegionConversionTables } from "@/components/region-manager/funnel/RegionConversionTables";
import { RegionActionSummary } from "@/components/region-manager/action/RegionActionSummary";
import { RegionActionCenter } from "@/components/region-manager/action/RegionActionCenter";
import { TeamBacklogTable } from "@/components/region-manager/action/TeamBacklogTable";

export const metadata: Metadata = {
  title: "Natural Clinic — Admin Genel Bakış",
};

/**
 * Admin Genel Bakış — Admin HER ŞEYİ görür: aktif veri kaynağı durumu +
 * tüm organizasyonun her seviyedeki analizi (bölge → takım takım → danışman
 * danışman → funnel/dönüşüm → aksiyon/risk → aylık). Veri, yüklü Excel varsa
 * ondan, yoksa seed'den gelir. Tarih filtresi tüm bölümleri etkiler.
 */
export default function AdminOverviewPage() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-fg"><T tr="Sistem Genel Bakış" en="System Overview" /></h1>
        <p className="font-body text-[13px] text-fg-secondary">
          <T
            tr="Tüm organizasyonun tam fotoğrafı — veri kaynağından tek tek takım ve danışman analizine kadar."
            en="A complete picture of the whole organization — from the data source down to team-by-team and agent-by-agent analysis."
          />
        </p>
      </div>

      <DataSourceStatus />

      <FilterBar />

      {/* 1 — Bölge geneli */}
      <DashboardSection
        id="rollup"
        eyebrow={<T tr="Organizasyon" en="Organization" />}
        title={<T tr="Bölge Geneli Performans" en="Organization-Wide Performance" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <RegionKpiGrid />
          <RegionConversionKpis />
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <TeamRevenueShare />
            </div>
            <div className="lg:col-span-5">
              <RegionTalentDistribution />
            </div>
          </div>
          <TeamRankBarList />
          <TeamEfficiencyTable />
        </div>
      </DashboardSection>

      {/* 2 — Takım takım analiz */}
      <DashboardSection
        id="teams"
        eyebrow={<T tr="Takımlar" en="Teams" />}
        title={<T tr="Takım Takım Analiz" en="Team-by-Team Analysis" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <BestWorstTeam />
          <TeamMetricChart />
          <TeamComparisonTable />
        </div>
      </DashboardSection>

      {/* 3 — Danışman danışman analiz */}
      <DashboardSection
        id="agents"
        eyebrow={<T tr="Danışmanlar" en="Agents" />}
        title={<T tr="Danışman Danışman Analiz" en="Agent-by-Agent Analysis" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <RegionBestWorstAgents />
          <RegionAgentTable />
        </div>
      </DashboardSection>

      {/* 4 — Funnel & dönüşüm */}
      <DashboardSection
        id="funnel"
        eyebrow={<T tr="Dönüşüm" en="Conversion" />}
        title={<T tr="Funnel & Dönüşüm Kırılımı" en="Funnel & Conversion Breakdown" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <RegionFunnelChart />
          <RegionConversionTables />
        </div>
      </DashboardSection>

      {/* 5 — Aksiyon & risk */}
      <DashboardSection
        id="action"
        eyebrow={<T tr="Operasyon" en="Operations" />}
        title={<T tr="Aksiyon & Risk Merkezi" en="Action & Risk Center" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <RegionActionSummary />
          <RegionActionCenter />
          <TeamBacklogTable />
        </div>
      </DashboardSection>

      {/* 6 — Aylık */}
      <DashboardSection
        id="bu-ay"
        eyebrow={<T tr="Bu Ay" en="This Month" />}
        title={<T tr="Satış ve Hedef Durumu" en="Sales and Target Status" />}
      >
        <RegionMonthlySection />
      </DashboardSection>
    </div>
  );
}
