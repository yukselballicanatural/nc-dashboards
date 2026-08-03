import type { ReactNode } from "react";
import { Sidebar } from "@/components/region-manager/layout/Sidebar";
import { RegionDateRangeProvider } from "@/components/region-manager/filters/RegionDateRangeContext";
import { FilterBar } from "@/components/region-manager/filters/FilterBar";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";

/**
 * Bölge Müdürü layout'u — agent/takım layout'uyla aynı iskelet: sabit sol
 * kenar çubuğu, altında global tarih filtresi (context 5 sekme arasında
 * kalıcı).
 */
export default function RegionManagerLayout({ children }: { children: ReactNode }) {
  return (
    <RegionDateRangeProvider>
      <div className="flex min-h-screen bg-bg">
        <Sidebar />
        <div className="ml-[var(--sidebar-w)] flex min-h-screen flex-1 flex-col transition-[margin] duration-200 ease-out">
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <div className="mb-5 sm:mb-6">
              <FilterBar />
            </div>
            {children}
          </main>
          <ScrollToTopButton />
        </div>
      </div>
    </RegionDateRangeProvider>
  );
}
