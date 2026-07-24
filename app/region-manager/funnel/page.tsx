import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { RegionDashboardHeader } from "@/components/region-manager/RegionDashboardHeader";
import { RegionConversionKpis } from "@/components/region-manager/dashboard/RegionKpiGrid";
import { RegionFunnelChart } from "@/components/region-manager/funnel/RegionFunnelChart";
import { RegionConversionTables } from "@/components/region-manager/funnel/RegionConversionTables";

export const metadata: Metadata = {
  title: "Natural Clinic — Funnel & Dönüşüm",
};

/**
 * Funnel & Dönüşüm — Bölge Müdürü paneli, sekme 4/5.
 * Bölge funnel'ı (takım kırılımlı) + dönüşüm oranları + kaynak/ülke/dil.
 */
export default function RegionFunnelPage() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <RegionDashboardHeader
        title={<T tr="Funnel & Dönüşüm" en="Funnel & Conversion" />}
        subtitle={
          <T
            tr="Bölgenin fırsatları nerede tıkanıyor, hangi kaynak/ülke/dil daha çok satışa dönüyor."
            en="Where the region's opportunities get stuck, and which source/country/language converts more into sales."
          />
        }
      />
      <RegionConversionKpis />
      <RegionFunnelChart />
      <RegionConversionTables />
    </div>
  );
}
