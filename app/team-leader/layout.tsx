import type { ReactNode } from "react";
import { TopNav } from "@/components/team-leader/layout/TopNav";
import { TeamDateRangeProvider } from "@/components/team-leader/filters/TeamDateRangeContext";
import { FilterBar } from "@/components/team-leader/filters/FilterBar";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";

/**
 * Takım Lideri layout'u — agent layout'uyla aynı iskelet: sabit üst nav,
 * hemen altında global tarih filtresi (context tüm 5 sekme arasında kalıcı).
 */
export default function TeamLeaderLayout({ children }: { children: ReactNode }) {
  return (
    <TeamDateRangeProvider>
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
    </TeamDateRangeProvider>
  );
}
