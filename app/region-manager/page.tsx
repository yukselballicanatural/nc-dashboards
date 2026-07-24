import type { Metadata } from "next";
import { DashboardSection } from "@/components/agent/dashboard/DashboardSection";
import { RegionHeroHeader } from "@/components/region-manager/dashboard/RegionHeroHeader";
import { RegionInsightStrip } from "@/components/region-manager/dashboard/RegionInsightStrip";
import { RegionKpiGrid, RegionConversionKpis } from "@/components/region-manager/dashboard/RegionKpiGrid";
import { RegionTargetGauge } from "@/components/region-manager/dashboard/RegionTargetGauge";
import { TeamRankBarList } from "@/components/region-manager/dashboard/TeamRankBarList";
import { RegionDailyTrendChart } from "@/components/region-manager/dashboard/RegionDailyTrendChart";
import { RegionActionPreview } from "@/components/region-manager/dashboard/RegionActionPreview";
import { TeamRevenueShare } from "@/components/region-manager/dashboard/TeamRevenueShare";
import { RegionTalentDistribution } from "@/components/region-manager/dashboard/RegionTalentDistribution";
import { TeamEfficiencyTable } from "@/components/region-manager/dashboard/TeamEfficiencyTable";
import { RegionMonthlySection } from "@/components/region-manager/monthly/RegionMonthlySection";

export const metadata: Metadata = {
  title: "Natural Clinic — Bölge Özeti",
};

/**
 * Bölge Özeti — Bölge Müdürü paneli, sekme 1/5.
 * Derinleştirilmiş: karşılama + tavsiyeler, bölge KPI'ları ve dönüşüm,
 * hedef + takım sıralaması, günlük trend + aksiyon, ciro payı + yetenek
 * dağılımı, kişi-başı takım verimliliği, ve bu ayın satış/hedef trajektörü.
 */
export default function RegionManagerOverviewPage() {
  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <RegionHeroHeader />
      <RegionInsightStrip />

      <DashboardSection id="ozet" eyebrow="Genel Bakış" title="Bölgenin Seçili Dönem Özeti">
        <div className="flex flex-col gap-4 sm:gap-5">
          <RegionKpiGrid />
          <RegionConversionKpis />
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <RegionTargetGauge />
            </div>
            <div className="lg:col-span-8">
              <TeamRankBarList />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <RegionDailyTrendChart />
            </div>
            <div className="lg:col-span-5">
              <RegionActionPreview />
            </div>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection id="katki" eyebrow="Takım Katkısı" title="Ciro Payı, Yetenek ve Verimlilik">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <TeamRevenueShare />
            </div>
            <div className="lg:col-span-5">
              <RegionTalentDistribution />
            </div>
          </div>
          <TeamEfficiencyTable />
        </div>
      </DashboardSection>

      <DashboardSection id="bu-ay" eyebrow="Bu Ay" title="Bölge Satış ve Hedef Durumu">
        <RegionMonthlySection />
      </DashboardSection>
    </div>
  );
}
