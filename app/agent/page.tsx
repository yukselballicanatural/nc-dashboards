"use client";

import { qualityKpis, shiftKpis, targetKpis } from "@/lib/mock/mock-data";
import { earningsKpis } from "@/lib/mock/agent-earnings";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { EarningsHeroBand } from "@/components/agent/earnings/EarningsHeroBand";
import { DailyCommissionTable } from "@/components/agent/earnings/DailyCommissionTable";
import { QuarterTierLadder } from "@/components/agent/earnings/QuarterTierLadder";
import { YearProjectionChart } from "@/components/agent/earnings/YearProjectionChart";
import { InsightStrip } from "@/components/agent/dashboard/InsightStrip";
import { DashboardSection } from "@/components/agent/dashboard/DashboardSection";
import { KpiGrid } from "@/components/agent/dashboard/KpiGrid";
import { OverviewKpiGrid } from "@/components/agent/dashboard/OverviewKpiGrid";
import { LiveCallStrip } from "@/components/agent/dashboard/LiveCallStrip";
import { ActionCenter } from "@/components/agent/dashboard/ActionCenter";
import { MiniFunnelStrip } from "@/components/agent/dashboard/MiniFunnelStrip";
import { FullFunnelChart } from "@/components/agent/dashboard/FullFunnelChart";
import { CallbackList } from "@/components/agent/dashboard/CallbackList";
import { GoalGauge } from "@/components/agent/dashboard/GoalGauge";
import { TargetPaceChart } from "@/components/agent/dashboard/TargetPaceChart";
import { RankCard } from "@/components/agent/dashboard/RankCard";
import { QualityTrendChart } from "@/components/agent/dashboard/QualityTrendChart";
import { ShiftTable } from "@/components/agent/dashboard/ShiftTable";
import { TeamComparisonBars } from "@/components/agent/dashboard/TeamComparisonBars";
import { CompanyBenchmarkCard } from "@/components/agent/benchmark/CompanyBenchmarkCard";

/**
 * Günlük Çalışma Ekranı — v2 4.1, kapsamlı tek-sayfa özet.
 * Agent kendisiyle ilgili tüm veriyi buradan görür; menü sayfaları aynı
 * verinin derinlemesine (tam tablolar/filtreler) hâlini sunar.
 */
export default function AgentDashboardPage() {
  const { lang } = useLang();
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* KARŞILAMA HER ZAMAN EN ÜSTTE — Dashboard "Merhaba, ..." ile
          başlamalı (kullanıcı kararı); prim bandı kimlik/karşılamayı da
          içeriyor (bkz. EarningsHeroBand notu). */}
      <EarningsHeroBand />

      {/* ANLIK ÇAĞRI — takımın canlı çağrı durumu + payın ve takım içi sıran. */}
      <LiveCallStrip />

      {/* FUNNEL — satış hunisi; her aşamanın yüzdesel dönüşümü + şirket
          ortalamasına göre renk kodlu kıyası (bkz. FullFunnelChart,
          company-benchmark.ts). Kırılım tabloları (ConversionTables) burada
          gösterilmez — "Aramalar & Funnel" sayfasında zaten var. */}
      <DashboardSection
        id="funnel"
        eyebrow={<T tr="Funnel & Fırsatlar" en="Funnel & Opportunities" />}
        title={<T tr="Fırsatların Nerede?" en="Where Are Your Opportunities?" />}
      >
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <FullFunnelChart />
          </div>
          <div className="lg:col-span-5">
            <CallbackList />
          </div>
        </div>
      </DashboardSection>

      <InsightStrip />

      {/* 1 — GENEL BAKIŞ */}
      <DashboardSection
        id="gunluk"
        eyebrow={<T tr="Genel Bakış" en="Overview" />}
        title={<T tr="Seçili Dönemin Özeti" en="Selected Period Summary" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <OverviewKpiGrid />
          {/* Saatlik arama grafiği kaldırıldı (kalabalığı azaltmak için) —
              yerine daha öncelikli prim (çeyrek dilim merdiveni) metriği geldi. */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <QuarterTierLadder />
            </div>
            <div className="lg:col-span-4">
              <ActionCenter />
            </div>
          </div>
          <MiniFunnelStrip />
        </div>
      </DashboardSection>

      {/* NOT: "Arama & Ulaşım" bölümü Dashboard'dan kaldırıldı (kullanıcı:
          kalabalık oldu). İçindeki beş bileşenin TAMAMI — CallKpiGrid,
          DailyTrendChart, SlaConnectionGauges, SpeedToLeadChart,
          HourlyReachChart — "Aramalar & Funnel" sayfasında birebir duruyor;
          Dashboard'daki anlık çağrı kartı (LiveCallStrip) bakışta yeterli. */}

      {/* 2 — HEDEF & KAZANÇ */}
      <DashboardSection
        id="hedef"
        eyebrow={<T tr="Hedef & Kazanç" en="Target & Earnings" />}
        title={<T tr="Hedefin ve Kazancın" en="Your Target and Earnings" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <KpiGrid kpis={targetKpis(lang)} className="lg:grid-cols-5" />
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
          <CompanyBenchmarkCard />
        </div>
      </DashboardSection>

      {/* 3 — PRİM & KOMİSYON */}
      <DashboardSection
        id="prim"
        eyebrow={<T tr="Prim & Komisyon" en="Commission & Bonus" />}
        title={<T tr="Priminin Detayı" en="Your Commission in Detail" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <KpiGrid kpis={earningsKpis(lang)} />
          {/* Alt alta (yan yana değil): günlük tablonun satır sayısı aya göre
              çok değişken (ayın başında 1 satır, sonunda 30 satır olabilir) —
              sabit yükseklikli merdivenin yanına konunca hep bir taraf boşluklu
              kalıyordu. Tam genişlik + alt alta bu asimetriyi kalıcı çözer. */}
          <DailyCommissionTable />
          <QuarterTierLadder />
          <YearProjectionChart />
        </div>
      </DashboardSection>

      {/* 4 — KALİTE & VARDİYA */}
      <DashboardSection
        id="kalite"
        eyebrow={<T tr="Kalite & Vardiya" en="Quality & Shift" />}
        title={<T tr="Kalite ve Vardiya Uyumun" en="Your Quality and Shift Compliance" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <KpiGrid kpis={qualityKpis(lang)} />
          <QualityTrendChart />
          <KpiGrid kpis={shiftKpis(lang)} />
          <ShiftTable />
        </div>
      </DashboardSection>
    </div>
  );
}
