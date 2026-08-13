import type { ReactNode } from "react";
import { Sidebar } from "@/components/admin/layout/Sidebar";
import { RegionDateRangeProvider } from "@/components/region-manager/filters/RegionDateRangeContext";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";
import { MobileTopBar } from "@/components/layout/MobileTopBar";

/**
 * Admin layout'u — Admin her şeyi görebildiği için Genel Bakış, bölge (tüm org)
 * rollup'ını kullanır; bu yüzden RegionDateRangeProvider ile sarılır (aktif
 * veri kaynağı: yüklü Excel ya da seed).
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RegionDateRangeProvider>
      <div className="flex min-h-screen bg-bg">
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-out lg:ml-[var(--sidebar-w)]">
          <MobileTopBar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>
          <ScrollToTopButton />
        </div>
      </div>
    </RegionDateRangeProvider>
  );
}
