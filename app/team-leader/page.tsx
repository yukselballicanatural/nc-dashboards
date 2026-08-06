import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { DashboardSection } from "@/components/agent/dashboard/DashboardSection";
import { TeamHeroHeader } from "@/components/team-leader/dashboard/TeamHeroHeader";
import { TeamAssistantCard } from "@/components/team-leader/dashboard/TeamAssistantCard";
import { TeamLiveCallStrip } from "@/components/team-leader/dashboard/TeamLiveCallStrip";
import { TeamFunnelChart } from "@/components/team-leader/funnel/TeamFunnelChart";
import { TeamKpiGrid } from "@/components/team-leader/dashboard/TeamKpiGrid";
import { TeamConversionKpis } from "@/components/team-leader/dashboard/TeamConversionKpis";
import { TeamTargetGauge } from "@/components/team-leader/dashboard/TeamTargetGauge";
import { TeamScoreBarList } from "@/components/team-leader/dashboard/TeamScoreBarList";
import { TierDistributionChart } from "@/components/team-leader/dashboard/TierDistribution";
import { TeamDailyTrendChart } from "@/components/team-leader/dashboard/TeamDailyTrendChart";
import { TeamConversionTables } from "@/components/team-leader/dashboard/TeamConversionTables";
import { TeamActionPreview } from "@/components/team-leader/dashboard/TeamActionPreview";
import { TeamMonthlyPaceChart } from "@/components/team-leader/monthly/TeamMonthlyPaceChart";
import { TeamMonthlyKpiGrid } from "@/components/team-leader/monthly/TeamMonthlyKpiGrid";
import { TeamShiftTable } from "@/components/team-leader/shift/TeamShiftTable";
import { TeamShiftKpiGrid } from "@/components/team-leader/shift/TeamShiftKpiGrid";
import { TeamQualityBarList } from "@/components/team-leader/quality/TeamQualityBarList";
import { TeamQualityKpiGrid } from "@/components/team-leader/quality/TeamQualityKpiGrid";
import { TeamLeaderEarningsBand } from "@/components/team-leader/earnings/TeamLeaderEarningsBand";
import { TeamCommissionTable } from "@/components/team-leader/earnings/TeamCommissionTable";
import { RankBonusTable } from "@/components/team-leader/earnings/RankBonusTable";
import { TeamEarningsKpiGrid } from "@/components/team-leader/earnings/TeamEarningsKpiGrid";

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
      {/* KARŞILAMA EN BAŞTA — Agent panelinde alınan karar (dashboard
          "Merhaba, ..." ile başlamalı) TL'de de geçerli; prim bandı hemen
          altında gelir. */}
      <TeamHeroHeader />
      <TeamLeaderEarningsBand />

      {/* Anlık çağrı durumu — "şu an kim çalışıyor, kim boş" en üstte. */}
      <TeamLiveCallStrip />

      {/* Funnel ekranın üstünde (Agent paneliyle aynı karar): her aşamanın
          geçiş oranı ve şirket ortalamasına göre renk kodlu farkı. Aynı
          bileşen Funnel & Backlog sayfasında da kullanılır — tek kaynak. */}
      <DashboardSection id="funnel" eyebrow={<T tr="Funnel" en="Funnel" />} title={<T tr="Takımın Dönüşüm Hunisi" en="The Team's Conversion Funnel" />}>
        <TeamFunnelChart />
      </DashboardSection>

      <TeamAssistantCard />

      <DashboardSection id="ozet" eyebrow={<T tr="Genel Bakış" en="Overview" />} title={<T tr="Seçili Dönemin Özeti" en="Selected Period Summary" />}>
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

      <DashboardSection id="bu-ay" eyebrow={<T tr="Bu Ay" en="This Month" />} title={<T tr="Satış ve Hedef Durumu" en="Sales and Target Status" />}>
        <div className="flex flex-col gap-4 sm:gap-5">
          <TeamMonthlyKpiGrid />
          <TeamMonthlyPaceChart />
        </div>
      </DashboardSection>

      <DashboardSection id="prim" eyebrow={<T tr="Prim & Komisyon" en="Commission & Bonus" />} title={<T tr="Priminin Detayı" en="Your Commission in Detail" />}>
        <div className="flex flex-col gap-4 sm:gap-5">
          <TeamEarningsKpiGrid />
          <TeamCommissionTable />
          <RankBonusTable />
        </div>
      </DashboardSection>

      <DashboardSection id="bu-hafta" eyebrow={<T tr="Bu Hafta" en="This Week" />} title={<T tr="Vardiya ve Mesai Uyumu" en="Shift and Attendance Compliance" />}>
        <div className="flex flex-col gap-4 sm:gap-5">
          <TeamShiftKpiGrid />
          <TeamShiftTable />
        </div>
      </DashboardSection>

      <DashboardSection id="kalite" eyebrow={<T tr="Kalite" en="Quality" />} title={<T tr="Takımın Çağrı Kalitesi" en="Team's Call Quality" />}>
        <div className="flex flex-col gap-4 sm:gap-5">
          <TeamQualityKpiGrid />
          <TeamQualityBarList />
        </div>
      </DashboardSection>
    </div>
  );
}
