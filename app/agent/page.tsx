import { EarningsHeroBand } from "@/components/agent/earnings/EarningsHeroBand";
import { SalesTargetBar } from "@/components/agent/dashboard/SalesTargetBar";
import { FullFunnelChart } from "@/components/agent/dashboard/FullFunnelChart";
import { CallSnapshotCard } from "@/components/agent/dashboard/CallSnapshotCard";
import { QuarterPerformanceCard } from "@/components/agent/dashboard/QuarterPerformanceCard";

/**
 * AGENT DASHBOARD — sade, hızlı okunabilir, minimum etkileşim (kullanıcı
 * talebi). Yalnızca DÖRT ana performans alanı gösterilir:
 *
 *   1. PRİM              → EarningsHeroBand (karşılama + hak edilen prim)
 *                          + SalesTargetBar (dinamik satış hedefi)
 *   2. FUNNEL            → FullFunnelChart (geçiş %'si + şirket kıyası)
 *   3. ARAMA BİLGİSİ     → CallSnapshotCard (canlı durum + oranlar)
 *   4. QUARTER PERFORMANSI → QuarterPerformanceCard (dilim + ilerleme)
 *
 * Agent giriş yaptığında satış durumunu, prim seviyesini, funnel'ı, arama
 * performansını ve çeyrek performansını birkaç saniyede görmelidir; bu yüzden
 * ek KPI ızgaraları, tablolar ve grafikler bu ekrandan KASITLI olarak
 * çıkarılmıştır. Hepsi kendi menü sayfalarında duruyor:
 *   · arama detayı, kırılım tabloları, callback listesi → /agent/aramalar
 *   · hedef, tempo, sıra, kıyaslama, prim tabloları, kalite → /agent/performans
 *   · turnike/mesai dökümü → /agent/pdks
 *   · aksiyon bekleyen kayıtlar → /agent/follow-up
 * Bu ekranda o sayfalara link YOKTUR — kullanıcı gereksiz detay ekranlarına
 * yönlendirilmemeli; menü zaten erişimi sağlıyor.
 */
export default function AgentDashboardPage() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* 1 — PRİM. Karşılama da bu bandın içinde: Dashboard "Merhaba, ..."
          ile başlamalı (kullanıcı kararı) ve hak edilen prim ilk görülen
          rakam olmalı. */}
      <EarningsHeroBand />

      {/* Dinamik satış hedefi — Prim alanının parçası (yeni bir ana başlık
          değil): hedef mevcut satışa göre otomatik seçilir, elle seçim yok.
          Kural: lib/mock/commission.ts → salesTargetProgress. */}
      <SalesTargetBar />

      {/* 2 — FUNNEL · 3 — ARAMA BİLGİSİ. Yan yana: ikisi de ilk ekranda
          görünsün, scroll gerekmesin. Dar ekranda alt alta düşer. */}
      <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <FullFunnelChart />
        </div>
        <div className="lg:col-span-5">
          <CallSnapshotCard />
        </div>
      </div>

      {/* 4 — QUARTER PERFORMANSI */}
      <QuarterPerformanceCard />
    </div>
  );
}
