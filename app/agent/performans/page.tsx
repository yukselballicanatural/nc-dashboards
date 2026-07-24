import { Info } from "lucide-react";
import { QUALITY_KPIS, SHIFT_KPIS, TARGET_KPIS } from "@/lib/mock/mock-data";
import { T } from "@/components/i18n/T";
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

      {/* HEDEF VE PRİM — v2 4.7 */}
      <DashboardSection
        id="hedef"
        eyebrow={<T tr="Hedef ve Prim" en="Target and Bonus" />}
        title={<T tr="Aylık Hedefin" en="Your Monthly Target" />}
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
          {/* Prim notu — v2 4.7: komisyon kuralları bu ekrana sabit yazılmaz */}
          <div className="flex items-start gap-2.5 rounded-card border border-border bg-surface px-4 py-3">
            <Info size={15} aria-hidden className="mt-0.5 shrink-0 text-indigo" />
            <p className="font-body text-[12px] leading-relaxed text-fg-secondary">
              <span className="font-semibold text-fg">
                <T
                  tr="Prim hesaplaması bu fazda gösterilmiyor."
                  en="Bonus calculation is not shown in this phase."
                />
              </span>{" "}
              <T
                tr="Komisyon kuralları Admin tarafından yönetilen parametre tablolarından okunacak ve Target-Komisyon fazında bu ekrana eklenecek."
                en="Commission rules will be read from parameter tables managed by Admin and added to this screen in the Target-Commission phase."
              />
            </p>
          </div>
        </div>
      </DashboardSection>

      {/* KALİTE — v2 4.5 */}
      <DashboardSection
        id="kalite"
        eyebrow={<T tr="Kalite" en="Quality" />}
        title={<T tr="Çağrı Kaliten" en="Your Call Quality" />}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <KpiGrid kpis={QUALITY_KPIS} />
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
          <KpiGrid kpis={SHIFT_KPIS} />
          <ShiftTable />
        </div>
      </DashboardSection>
    </div>
  );
}
