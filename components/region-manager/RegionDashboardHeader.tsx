import type { ReactNode } from "react";

/** Sayfa başlığı — Bölge Müdürü sayfaları için (dönem bilgisi FilterBar'da). */
export function RegionDashboardHeader({
  title,
  subtitle,
}: {
  title: ReactNode;
  subtitle: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-display text-2xl font-bold tracking-tight text-fg">{title}</h1>
      <p className="font-body text-[13px] text-fg-secondary">{subtitle}</p>
    </div>
  );
}
