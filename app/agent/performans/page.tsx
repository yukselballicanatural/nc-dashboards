"use client";

import { Info } from "lucide-react";
import { qualityKpis, shiftKpis, targetKpis } from "@/lib/mock/mock-data";
import { AGENT_REGION, earningsKpis } from "@/lib/mock/agent-earnings";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { EarningsHeroBand } from "@/components/agent/earnings/EarningsHeroBand";
import { DailyCommissionTable } from "@/components/agent/earnings/DailyCommissionTable";
import { QuarterTierLadder } from "@/components/agent/earnings/QuarterTierLadder";
import { YearProjectionChart } from "@/components/agent/earnings/YearProjectionChart";
import { CompanyBenchmarkCard } from "@/components/agent/benchmark/CompanyBenchmarkCard";
import { DashboardHeader } from "@/components/agent/dashboard/DashboardHeader";
import { DashboardSection } from "@/components/agent/dashboard/DashboardSection";
import { KpiGrid } from "@/components/agent/dashboard/KpiGrid";
import { GoalGauge } from "@/components/agent/dashboard/GoalGauge";
import { TargetPaceChart } from "@/components/agent/dashboard/TargetPaceChart";
import { RankCard } from "@/components/agent/dashboard/RankCard";
import { QualityTrendChart } from "@/components/agent/dashboard/QualityTrendChart";
import { ShiftTable } from "@/components/agent/dashboard/ShiftTable";

/**
 * Performansım — v2 4.5 (Kalite) + 4.6 (Vardiya) + 4.7 (Hedef ve Prim)
 * tek sayfada üç bölüm. Kalite ve Vardiya bilinçli olarak sade (v2 Bölüm 2).
 */
export default function PerformansPage() {
  const { lang } = useLang();
  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <DashboardHeader
        title={<T tr="Performansım" en="My Performance" />}
        subtitle={
          <T
            tr="Hedefin, kalite puanın ve vardiya uyumun — motivasyon tablosu burada."
            en="Your target, quality score and shift compliance — your motivation board is here."
          />
        }
      />

      {/* PARA EN BAŞTA — prim bandı burada da ilk sırada (v2 4.7).
          Karşılama satırı ("Merhaba, ...") gösterilmez — o zaten Dashboard'da
          var, burada DashboardHeader başlığı yeterli. */}
      <EarningsHeroBand showIdentity={false} />

      {/* HEDEF VE PRİM — v2 4.7 */}
      <DashboardSection
        id="hedef"
        eyebrow={<T tr="Hedef ve Prim" en="Target and Bonus" />}
        title={<T tr="Aylık Hedefin" en="Your Monthly Target" />}
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
          <CompanyBenchmarkCard />
          {/* Prim kuralları notu — kaynak Admin parametre tabloları olacak */}
          <div className="flex items-start gap-2.5 rounded-card border border-border bg-surface px-4 py-3">
            <Info size={15} aria-hidden className="mt-0.5 shrink-0 text-indigo" />
            <p className="font-body text-[12px] leading-relaxed text-fg-secondary">
              <span className="font-semibold text-fg">
                <T
                  tr={`Prim oranların ${AGENT_REGION === "Morocco" ? "Fas" : "İstanbul"} komisyon tablosundan hesaplanıyor.`}
                  en={`Your commission rates are calculated from the ${AGENT_REGION === "Morocco" ? "Morocco" : "Istanbul"} commission table.`}
                />
              </span>{" "}
              <T
                tr="Aylık oran ayın toplam satışına, çeyreklik ekstra oran ise çeyreğin aylık ortalamasına göre belirlenir. Bu tablolar ileride Admin parametre ekranından yönetilecek."
                en="The monthly rate is set by your total sales for the month, and the quarterly extra rate by the quarter's monthly average. These tables will be managed from the Admin parameter screen."
              />
            </p>
          </div>
        </div>
      </DashboardSection>

      {/* PRİM VE KOMİSYON — v2 4.7 genişletmesi */}
      <DashboardSection
        id="prim"
        eyebrow={<T tr="Prim & Komisyon" en="Commission & Bonus" />}
        title={<T tr="Priminin Detayı" en="Your Commission in Detail" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <KpiGrid kpis={earningsKpis(lang)} />
          {/* Alt alta (yan yana değil): günlük tablonun satır sayısı aya göre
              çok değişken — sabit yükseklikli merdivenin yanına konunca hep
              bir taraf boşluklu kalıyordu. Tam genişlik bu asimetriyi çözer. */}
          <DailyCommissionTable />
          <QuarterTierLadder />
          <YearProjectionChart />
        </div>
      </DashboardSection>

      {/* KALİTE — v2 4.5 */}
      <DashboardSection
        id="kalite"
        eyebrow={<T tr="Kalite" en="Quality" />}
        title={<T tr="Çağrı Kaliten" en="Your Call Quality" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <KpiGrid kpis={qualityKpis(lang)} />
          <QualityTrendChart />
        </div>
      </DashboardSection>

      {/* VARDİYA — v2 4.6 */}
      <DashboardSection
        id="vardiya"
        eyebrow={<T tr="Vardiya" en="Shift" />}
        title={<T tr="Vardiya Uyumun" en="Your Shift Compliance" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <KpiGrid kpis={shiftKpis(lang)} />
          <ShiftTable />
        </div>
      </DashboardSection>
    </div>
  );
}
