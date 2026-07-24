"use client";

import { Trophy, AlertTriangle } from "lucide-react";
import type { RegionAgentSummary } from "@/lib/types/region-data";
import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";

function AgentRow({ agent, rank, tone }: { agent: RegionAgentSummary; rank: number; tone: "best" | "worst" }) {
  return (
    <div className="flex items-center gap-3 rounded-control border border-border bg-bg px-3 py-2.5">
      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-pill font-mono text-[11px] font-bold", tone === "best" ? "bg-success/14 text-success" : "bg-critical/14 text-critical")}>
        {rank}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-body text-[12.5px] font-medium text-fg">{agent.name}</span>
        <span className="truncate font-body text-[10.5px] text-fg-muted">{agent.teamName}</span>
      </div>
      <span className={cn("shrink-0 font-mono text-[13px] font-semibold", tone === "best" ? "text-success" : "text-critical")}>
        {agent.score.toFixed(1)}
      </span>
    </div>
  );
}

/** Bölge geneli en iyi / en zayıf 5 danışman (tüm takımlar birlikte). */
export function RegionBestWorstAgents() {
  const { data } = useRegionDateRange();
  const { t } = useLang();

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
      <Card className="flex flex-col gap-3">
        <SectionTitle
          hint={t(
            "Bölgedeki tüm takımlar arasında en yüksek Genel Başarı puanlı 5 danışman.",
            "The 5 agents with the highest Overall Score across all teams in the region.",
          )}
          aside={<Trophy size={16} className="text-success" aria-hidden />}
        >
          <T tr="Bölge Best 5" en="Region Best 5" />
        </SectionTitle>
        <div className="flex flex-col gap-2">
          {data.best5Agents.map((a, i) => (
            <AgentRow key={a.agentId} agent={a} rank={i + 1} tone="best" />
          ))}
        </div>
      </Card>
      <Card className="flex flex-col gap-3">
        <SectionTitle
          hint={t(
            "Bölge genelinde en düşük puanlı 5 danışman — takım liderleriyle koçluk önceliği.",
            "The 5 lowest-scoring agents across the region — a coaching priority with team leaders.",
          )}
          aside={<AlertTriangle size={16} className="text-critical" aria-hidden />}
        >
          <T tr="Bölge Worst 5" en="Region Worst 5" />
        </SectionTitle>
        <div className="flex flex-col gap-2">
          {data.worst5Agents.map((a, i) => (
            <AgentRow key={a.agentId} agent={a} rank={i + 1} tone="worst" />
          ))}
        </div>
      </Card>
    </div>
  );
}
