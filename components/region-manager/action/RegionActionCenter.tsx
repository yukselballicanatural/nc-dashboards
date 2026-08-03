"use client";

import type { StatusLevel } from "@/lib/types/agent-data";
import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusDot } from "@/components/ui/StatusDot";

const GROUP_LABEL: Record<StatusLevel, { tr: string; en: string }> = {
  critical: { tr: "Kritik", en: "Critical" },
  risk: { tr: "Riskli", en: "At Risk" },
  warning: { tr: "Takip Edilmeli", en: "Needs Follow-up" },
  neutral: { tr: "Bilgi", en: "Info" },
  success: { tr: "Olumlu", en: "Positive" },
};

/** Bölge geneli aksiyon merkezi — önem sırasına göre gruplu. */
export function RegionActionCenter() {
  const { data } = useRegionDateRange();
  const { t } = useLang();
  const groups: Partial<Record<StatusLevel, typeof data.actionCenter>> = {};
  for (const item of data.actionCenter) {
    (groups[item.status] ??= []).push(item);
  }
  const order: StatusLevel[] = ["critical", "risk", "warning", "neutral", "success"];

  return (
    <Card className="flex flex-col gap-5">
      <SectionTitle hint={t("Takım liderleriyle konuşman gereken konular — en kritik en üstte.", "Topics you need to discuss with team leaders — most critical first.")}>
        <T tr="Aksiyon & Risk Merkezi" en="Action & Risk Center" />
      </SectionTitle>

      {data.actionCenter.length > 0 ? (
        <div className="flex flex-col gap-5">
          {order
            .filter((status) => groups[status]?.length)
            .map((status) => (
              <div key={status} className="flex flex-col gap-1.5">
                <h3 className="font-body text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                  {t(GROUP_LABEL[status].tr, GROUP_LABEL[status].en)} · {groups[status]!.length}
                </h3>
                <ul className="flex flex-col gap-1">
                  {groups[status]!.map((action) => (
                    <li key={action.id} className="flex items-center gap-3 rounded-control px-2.5 py-2.5 transition-colors hover:bg-elevated">
                      <StatusDot status={action.status} />
                      <span className="flex-1 font-body text-[13px] font-medium text-fg">{action.label}</span>
                      <span className="shrink-0 rounded-pill bg-elevated px-2 py-0.5 font-body text-[10.5px] font-medium text-fg-secondary">
                        {action.teamName.replace(" Team", "")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      ) : (
        <p className="flex flex-1 items-center justify-center py-10 font-body text-sm text-fg-muted">
          <T tr="Harika — bölgede bekleyen hiçbir aksiyon yok." en="Great — there are no pending actions in the region." />
        </p>
      )}
    </Card>
  );
}
