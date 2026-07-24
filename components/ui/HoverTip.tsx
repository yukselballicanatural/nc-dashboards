import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Hover balonu — özel (recharts olmayan) bar/liste öğeleri için.
 * Ebeveyn öğeye `group relative` verilir; bu balon mouse ile üstüne gelince
 * yumuşakça belirir (fade + hafif yükselme). pointer-events-none olduğu için
 * etkileşimi engellemez. prefers-reduced-motion'da geçiş süresi CSS ile sıfırlanır.
 */
export function HoverTip({
  children,
  className,
  align = "center",
}: {
  children: ReactNode;
  className?: string;
  /** Yatay hizalama — center (varsayılan) veya right. */
  align?: "center" | "right";
}) {
  return (
    <div
      role="tooltip"
      className={cn(
        "pointer-events-none absolute bottom-full z-20 mb-1.5 opacity-0 translate-y-1 transition-all duration-150 ease-out group-hover:opacity-100 group-hover:translate-y-0",
        align === "center" ? "left-1/2 -translate-x-1/2 group-hover:-translate-x-1/2" : "right-0",
        className,
      )}
    >
      <div className="whitespace-nowrap rounded-control border border-border bg-elevated px-3 py-2 shadow-card">
        {children}
      </div>
    </div>
  );
}
