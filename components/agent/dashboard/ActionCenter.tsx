"use client";

import { ChevronRight } from "lucide-react";
import { useDateRange } from "@/components/agent/filters/DateRangeContext";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusDot } from "@/components/ui/StatusDot";

/**
 * Aksiyon Merkezi — "ne yapmalıyım" listesi, seçili döneme göre (context).
 * Renkli durum noktası + metin + ok; her satır ilgili menü sayfasına gider
 * (href'ler compute.ts'te tanımlı). Boş durumda yönlendirici metin
 * (CLAUDE.md 7). Dashboard dört ana alana indirildiğinden bu kart artık
 * Follow-up sayfasının üstünde duruyor.
 */
export function ActionCenter() {
  const { data } = useDateRange();

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle>
        <T tr="Aksiyon Merkezi" en="Action Center" />
      </SectionTitle>

      {data.actionCenter.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {data.actionCenter.map((action) => (
            <li key={action.id}>
              <a
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
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex flex-1 items-center justify-center font-body text-sm text-fg-muted">
          <T tr="Harika — bekleyen aksiyon yok." en="Great — no pending actions." />
        </p>
      )}
    </Card>
  );
}
