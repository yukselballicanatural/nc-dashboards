import type { ReactNode } from "react";
import { TopNav } from "@/components/agent/layout/TopNav";
import { DateRangeProvider } from "@/components/agent/filters/DateRangeContext";
import { FilterBar } from "@/components/agent/filters/FilterBar";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";

/**
 * Agent görünümü layout'u.
 * Üst navigasyon sabit; hemen altında global tarih filtresi şeridi (tüm
 * sayfalar için tek yerden, seçim sayfalar arası kalıcı); sonra içerik.
 */
export default function AgentLayout({ children }: { children: ReactNode }) {
  return (
    <DateRangeProvider>
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
    </DateRangeProvider>
  );
}
