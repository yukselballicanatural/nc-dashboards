"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { StatusLevel } from "@/lib/types/agent-data";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusDot } from "@/components/ui/StatusDot";

/**
 * Aksiyon Merkezi — CLAUDE.md Bölüm 9, sekme 5/5.
 * Tüm takımın aksiyon gerektiren durumları, önem sırasına göre gruplu
 * (compute katmanında zaten kritik→başarılı sıralı geliyor).
 */

const GROUP_LABEL: Record<StatusLevel, string> = {
  critical: "Kritik",
  risk: "Riskli",
  warning: "Takip Edilmeli",
  neutral: "Bilgi",
  success: "Olumlu",
};

const GROUP_LABEL_EN: Record<StatusLevel, string> = {
  critical: "Critical",
  risk: "At Risk",
  warning: "Needs Follow-up",
  neutral: "Info",
  success: "Positive",
};

export function TeamActionCenter() {
  const { data } = useTeamDateRange();
  const { t } = useLang();
  const groups: Partial<Record<StatusLevel, typeof data.actionCenter>> = {};
  for (const item of data.actionCenter) {
    (groups[item.status] ??= []).push(item);
  }
  const order: StatusLevel[] = ["critical", "risk", "warning", "neutral", "success"];

  return (
    <Card className="flex flex-col gap-5">
      <SectionTitle hint={t("Takımdaki tüm agent'lar için üretilen uyarılar — en kritik en üstte. Her satır ilgili detaya götürür.", "Alerts generated for every agent in the team — most critical on top. Each row leads to the related detail.")}>
        <T tr="Aksiyon Merkezi" en="Action Center" />
      </SectionTitle>

      {data.actionCenter.length > 0 ? (
        <div className="flex flex-col gap-5">
          {order
            .filter((status) => groups[status]?.length)
            .map((status) => (
              <div key={status} className="flex flex-col gap-1.5">
                <h3 className="font-body text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                  {t(GROUP_LABEL[status], GROUP_LABEL_EN[status])} · {groups[status]!.length}
                </h3>
                <ul className="flex flex-col gap-1">
                  {groups[status]!.map((action) => (
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
              </div>
            ))}
        </div>
      ) : (
        <p className="flex flex-1 items-center justify-center py-10 font-body text-sm text-fg-muted">
          <T tr="Harika — takımda bekleyen hiçbir aksiyon yok." en="Great — no pending actions in the team." />
        </p>
      )}
    </Card>
  );
}
