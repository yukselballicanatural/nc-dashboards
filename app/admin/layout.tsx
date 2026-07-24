import type { ReactNode } from "react";
import { TopNav } from "@/components/admin/layout/TopNav";
import { RegionDateRangeProvider } from "@/components/region-manager/filters/RegionDateRangeContext";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";

/**
 * Admin layout'u — Admin her şeyi görebildiği için Genel Bakış, bölge (tüm org)
 * rollup'ını kullanır; bu yüzden RegionDateRangeProvider ile sarılır (aktif
 * veri kaynağı: yüklü Excel ya da seed).
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RegionDateRangeProvider>
      <div className="flex min-h-screen flex-col bg-bg">
        <TopNav />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
        <ScrollToTopButton />
      </div>
    </RegionDateRangeProvider>
  );
}
