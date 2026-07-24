"use client";

import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusDot } from "@/components/ui/StatusDot";

/**
 * Aksiyon Merkezi önizlemesi — Takım Özeti'nde en kritik ilk 4 satır +
 * tam listeye link. Boş durumda yönlendirici metin (CLAUDE.md 7).
 */
export function TeamActionPreview() {
  const { data } = useTeamDateRange();
  const top = data.actionCenter.slice(0, 4);

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        aside={
          <Link
            href="/team-leader/aksiyon-merkezi"
            className="flex items-center gap-1 font-body text-[11.5px] font-medium text-brand hover:text-brand/80"
          >
            <T tr="Tümünü gör" en="See all" />
            <ArrowRight size={12} aria-hidden />
          </Link>
        }
      >
        <T tr="Aksiyon Gerektiren Durumlar" en="Situations Needing Action" />
      </SectionTitle>

      {top.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {top.map((action) => (
            <li key={action.id}>
              <Link
                href={action.href}
                className="group flex items-center gap-3 rounded-control px-2.5 py-2.5 transition-colors hover:bg-elevated"
              >
                <StatusDot status={action.status} />
                <span className="flex-1 font-body text-[13px] font-medium text-fg">
                  {action.label}
                </span>
                <ChevronRight
                  size={15}
                  aria-hidden
                  className="text-fg-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-fg-secondary"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex flex-1 items-center justify-center font-body text-sm text-fg-muted">
          <T tr="Harika — takımda bekleyen kritik aksiyon yok." en="Great — no critical actions pending in the team." />
        </p>
      )}
    </Card>
  );
}
