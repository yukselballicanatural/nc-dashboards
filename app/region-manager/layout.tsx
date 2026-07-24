import type { ReactNode } from "react";
import { TopNav } from "@/components/region-manager/layout/TopNav";
import { RegionDateRangeProvider } from "@/components/region-manager/filters/RegionDateRangeContext";
import { FilterBar } from "@/components/region-manager/filters/FilterBar";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";

/**
 * Bölge Müdürü layout'u — agent/takım layout'uyla aynı iskelet: sabit üst nav,
 * altında global tarih filtresi (context 5 sekme arasında kalıcı).
 */
export default function RegionManagerLayout({ children }: { children: ReactNode }) {
  return (
    <RegionDateRangeProvider>
      <div className="flex min-h-screen flex-col bg-bg">
        <TopNav />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-5 sm:mb-6">
            <FilterBar />
          </div>
          {children}
        </main>
        <ScrollToTopButton />
      </div>
    </RegionDateRangeProvider>
  );
}
