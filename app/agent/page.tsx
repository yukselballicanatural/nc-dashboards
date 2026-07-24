import { QUALITY_KPIS, SHIFT_KPIS, TARGET_KPIS } from "@/lib/mock/mock-data";
import { T } from "@/components/i18n/T";
import { HeroHeader } from "@/components/agent/dashboard/HeroHeader";
import { InsightStrip } from "@/components/agent/dashboard/InsightStrip";
import { DashboardSection } from "@/components/agent/dashboard/DashboardSection";
import { KpiGrid } from "@/components/agent/dashboard/KpiGrid";
import { OverviewKpiGrid } from "@/components/agent/dashboard/OverviewKpiGrid";
import { CallKpiGrid } from "@/components/agent/dashboard/CallKpiGrid";
import { HourlyCallChart } from "@/components/agent/dashboard/HourlyCallChart";
import { ActionCenter } from "@/components/agent/dashboard/ActionCenter";
import { MiniFunnelStrip } from "@/components/agent/dashboard/MiniFunnelStrip";
import { DailyTrendChart } from "@/components/agent/dashboard/DailyTrendChart";
import { SlaConnectionGauges } from "@/components/agent/dashboard/SlaConnectionGauges";
import { SpeedToLeadChart } from "@/components/agent/dashboard/SpeedToLeadChart";
import { HourlyReachChart } from "@/components/agent/dashboard/HourlyReachChart";
import { FullFunnelChart } from "@/components/agent/dashboard/FullFunnelChart";
import { CallbackList } from "@/components/agent/dashboard/CallbackList";
import { ConversionTables } from "@/components/agent/dashboard/ConversionTables";
import { GoalGauge } from "@/components/agent/dashboard/GoalGauge";
import { TargetPaceChart } from "@/components/agent/dashboard/TargetPaceChart";
import { RankCard } from "@/components/agent/dashboard/RankCard";
import { QualityTrendChart } from "@/components/agent/dashboard/QualityTrendChart";
import { ShiftTable } from "@/components/agent/dashboard/ShiftTable";
import { TeamComparisonBars } from "@/components/agent/dashboard/TeamComparisonBars";

/**
 * Günlük Çalışma Ekranı — v2 4.1, kapsamlı tek-sayfa özet.
 * Agent kendisiyle ilgili tüm veriyi buradan görür; menü sayfaları aynı
 * verinin derinlemesine (tam tablolar/filtreler) hâlini sunar.
 */
export default function AgentDashboardPage() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <HeroHeader />

      <InsightStrip />

      {/* 1 — GENEL BAKIŞ */}
      <DashboardSection
        id="gunluk"
        eyebrow={<T tr="Genel Bakış" en="Overview" />}
        title={<T tr="Seçili Dönemin Özeti" en="Selected Period Summary" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <OverviewKpiGrid />
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <HourlyCallChart />
            </div>
            <div className="lg:col-span-4">
              <ActionCenter />
            </div>
          </div>
          <MiniFunnelStrip />
        </div>
      </DashboardSection>

      {/* 2 — ARAMA & ULAŞIM */}
      <DashboardSection
        id="aramalar"
        eyebrow={<T tr="Arama & Ulaşım" en="Calls & Reach" />}
        title={<T tr="Arama Performansın" en="Your Call Performance" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <CallKpiGrid />
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <DailyTrendChart />
            </div>
            <div className="lg:col-span-5">
              <SlaConnectionGauges />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <SpeedToLeadChart />
            </div>
            <div className="lg:col-span-5">
              <HourlyReachChart />
            </div>
          </div>
        </div>
      </DashboardSection>

      {/* 3 — FUNNEL & FIRSATLAR */}
      <DashboardSection
        id="funnel"
        eyebrow={<T tr="Funnel & Fırsatlar" en="Funnel & Opportunities" />}
        title={<T tr="Fırsatların Nerede?" en="Where Are Your Opportunities?" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <FullFunnelChart />
            </div>
            <div className="lg:col-span-5">
              <CallbackList />
            </div>
          </div>
          <ConversionTables />
        </div>
      </DashboardSection>

      {/* 4 — HEDEF & KAZANÇ */}
      <DashboardSection
        id="hedef"
        eyebrow={<T tr="Hedef & Kazanç" en="Target & Earnings" />}
        title={<T tr="Hedefin ve Kazancın" en="Your Target and Earnings" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <KpiGrid kpis={TARGET_KPIS} className="lg:grid-cols-5" />
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <GoalGauge />
            </div>
            <div className="lg:col-span-5">
              <TargetPaceChart />
            </div>
            <div className="lg:col-span-3">
              <RankCard />
            </div>
          </div>
          <TeamComparisonBars />
        </div>
      </DashboardSection>

      {/* 5 — KALİTE & VARDİYA */}
      <DashboardSection
        id="kalite"
        eyebrow={<T tr="Kalite & Vardiya" en="Quality & Shift" />}
        title={<T tr="Kalite ve Vardiya Uyumun" en="Your Quality and Shift Compliance" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <KpiGrid kpis={QUALITY_KPIS} />
          <QualityTrendChart />
          <KpiGrid kpis={SHIFT_KPIS} />
          <ShiftTable />
        </div>
      </DashboardSection>
    </div>
  );
}
