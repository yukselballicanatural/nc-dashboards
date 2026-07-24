import { T } from "@/components/i18n/T";
import { DashboardHeader } from "@/components/agent/dashboard/DashboardHeader";
import { CallKpiGrid } from "@/components/agent/dashboard/CallKpiGrid";
import { DailyTrendChart } from "@/components/agent/dashboard/DailyTrendChart";
import { HourlyReachChart } from "@/components/agent/dashboard/HourlyReachChart";
import { SpeedToLeadChart } from "@/components/agent/dashboard/SpeedToLeadChart";
import { SlaConnectionGauges } from "@/components/agent/dashboard/SlaConnectionGauges";
import { FullFunnelChart } from "@/components/agent/dashboard/FullFunnelChart";
import { CallbackList } from "@/components/agent/dashboard/CallbackList";
import { ConversionTables } from "@/components/agent/dashboard/ConversionTables";

/**
 * Aramalar & Funnel — v2 4.2 + 4.3 tek sayfada.
 * Arama/ulaşım detayları (30 gün) + lead'den ödemeye tam funnel + kırılımlar.
 */
export default function AramalarPage() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <DashboardHeader
        title={<T tr="Aramalar & Funnel" en="Calls & Funnel" />}
        subtitle={
          <T
            tr="Seçili dönemin arama performansı ve fırsatlarının lead'den ödemeye yolculuğu."
            en="The selected period's call performance and your opportunities' journey from lead to payment."
          />
        }
      />

      <CallKpiGrid />

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <DailyTrendChart />
        </div>
        <div className="lg:col-span-5">
          <HourlyReachChart />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SpeedToLeadChart />
        </div>
        <div className="lg:col-span-5">
          <SlaConnectionGauges />
        </div>
      </div>

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
  );
}
