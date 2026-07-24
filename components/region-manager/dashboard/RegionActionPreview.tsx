"use client";

import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusDot } from "@/components/ui/StatusDot";
import { T } from "@/components/i18n/T";

/** En kritik ilk 4 bölge aksiyonu + tam listeye link. */
export function RegionActionPreview() {
  const { data } = useRegionDateRange();
  const top = data.actionCenter.slice(0, 4);

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        aside={
          <Link href="/region-manager/aksiyon-risk" className="flex items-center gap-1 font-body text-[11.5px] font-medium text-brand hover:text-brand/80">
            <T tr="Tümünü gör" en="See all" />
            <ArrowRight size={12} aria-hidden />
          </Link>
        }
      >
        <T tr="Bölge Aksiyon & Risk" en="Region Action & Risk" />
      </SectionTitle>

      {top.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {top.map((action) => (
            <li key={action.id}>
              <Link href="/region-manager/aksiyon-risk" className="group flex items-center gap-3 rounded-control px-2.5 py-2.5 transition-colors hover:bg-elevated">
                <StatusDot status={action.status} />
                <span className="flex-1 font-body text-[13px] font-medium text-fg">{action.label}</span>
                <ChevronRight size={15} aria-hidden className="text-fg-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-fg-secondary" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex flex-1 items-center justify-center font-body text-sm text-fg-muted">
          <T tr="Harika — bölgede bekleyen kritik aksiyon yok." en="Great — no critical actions pending in the region." />
        </p>
      )}
    </Card>
  );
}
