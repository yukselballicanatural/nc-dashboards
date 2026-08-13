import type { ReactNode } from "react";
import { Sidebar } from "@/components/agent/layout/Sidebar";
import { DateRangeProvider } from "@/components/agent/filters/DateRangeContext";
import { FilterBar } from "@/components/agent/filters/FilterBar";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";
import { MobileTopBar } from "@/components/layout/MobileTopBar";

/**
 * Agent görünümü layout'u.
 * Sol kenar çubuğu sabit (CRM tarzı, açılır/kapanır); genişliği
 * `--sidebar-w` CSS değişkeniyle Sidebar.tsx yönetir, ana içerik bu
 * değişkene göre kayar. Hemen altında global tarih filtresi şeridi.
 */
export default function AgentLayout({ children }: { children: ReactNode }) {
  return (
    <DateRangeProvider>
      <div className="flex min-h-screen bg-bg">
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-out lg:ml-[var(--sidebar-w)]">
          <MobileTopBar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <div className="mb-5 sm:mb-6">
              <FilterBar />
            </div>
            {children}
          </main>
          <ScrollToTopButton />
        </div>
      </div>
    </DateRangeProvider>
  );
}
