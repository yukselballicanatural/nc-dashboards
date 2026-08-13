import { TopKpiStrip } from "@/components/agent/dashboard/TopKpiStrip";
import { QuarterPerformanceCard } from "@/components/agent/dashboard/QuarterPerformanceCard";
import { FullFunnelChart } from "@/components/agent/dashboard/FullFunnelChart";
import { CallSnapshotCard } from "@/components/agent/dashboard/CallSnapshotCard";

/**
 * AGENT DASHBOARD — anlık performans farkındalığı için üç bantlı hiyerarşi
 * (kullanıcı talebi). Öncelik detaylı raporlama DEĞİL; agent birkaç saniyede
 * nerede olduğunu görmeli.
 *
 *   ÜST   → Current Sales · Current Target · Prim Status   (TopKpiStrip)
 *   ORTA  → Quarter Performance Slider                     (QuarterPerformanceCard)
 *   ALT   → Funnel · Call Performance                      (yan yana)
 *
 * DÖNEM DAVRANIŞI (bilinçli): üstteki tarih filtresi yalnızca ALT bandı
 * (funnel + arama) etkiler. Üst şerit aylık/çeyreklik prim dönemlerini,
 * Quarter slider ise aktif çeyreği gösterir; ikisi de filtreye bağlı DEĞİLDİR
 * — modül seviyesindeki sabit dönem verisinden okurlar (agent-earnings.ts).
 * Filtre değiştiğinde slider değerleri değişmez.
 *
 * Bu ekranda detay sayfalarına link YOKTUR (minimum click); tam tablolar,
 * kırılımlar ve grafikler menü sayfalarında:
 *   · /agent/aramalar (arama detayı, kırılımlar, callback)
 *   · /agent/performans (hedef, tempo, sıra, kıyaslama, prim tabloları, kalite)
 *   · /agent/pdks (turnike/mesai) · /agent/follow-up (aksiyon bekleyenler)
 */
export default function AgentDashboardPage() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* ÜST — kritik KPI'lar ilk ekranda */}
      <TopKpiStrip />

      {/* ORTA — çeyreğin aylık kırılımı, dergi/slayt deneyimi */}
      <QuarterPerformanceCard />

      {/* ALT — funnel ve arama performansı yan yana; dar ekranda alt alta */}
      <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <FullFunnelChart />
        </div>
        <div className="lg:col-span-5">
          <CallSnapshotCard />
        </div>
      </div>
    </div>
  );
}
