import { T } from "@/components/i18n/T";
import { DashboardHeader } from "@/components/agent/dashboard/DashboardHeader";
import { TeamComparisonBars } from "@/components/agent/dashboard/TeamComparisonBars";
import { CompanyBenchmarkCard } from "@/components/agent/benchmark/CompanyBenchmarkCard";

/**
 * Karşılaştırma — takım ve şirket geneline göre kıyaslama tek bir sayfada.
 * Daha önce Dashboard'ın "Hedef & Kazanç" bölümüne gömülüydü; Funnel üste
 * taşınınca daha da aşağıda kalıp fark edilmiyordu (kullanıcı talebi) —
 * kendi menü sekmesine çıkarıldı.
 */
export default function KarsilastirmaPage() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <DashboardHeader
        title={<T tr="Karşılaştırma" en="Benchmark" />}
        subtitle={
          <T
            tr="Ulaşım ve SLA oranın takım ortalamana göre; Offer/Deal/Paid ve SLA uyumun şirket geneline göre — nerede öndesin, nerede geride kaldın."
            en="Your reach and SLA rate vs. your team average; your Offer/Deal/Paid counts and SLA compliance vs. the company average — where you're ahead, where you're behind."
          />
        }
      />
      <TeamComparisonBars />
      <CompanyBenchmarkCard />
    </div>
  );
}
