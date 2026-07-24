"use client";

import { Trophy, AlertTriangle } from "lucide-react";
import type { AgentPeriodSummary } from "@/lib/types/team-data";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { useLang } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * Best 5 / Worst 5 — Genel Başarı puanına göre (CLAUDE.md Bölüm 9 kararı).
 * Her kart, zayıf/güçlü metrikleri tek bakışta gösterir ki TL "neden"
 * sorusuna hemen cevap bulsun.
 */

function AgentMiniCard({
  agent,
  rank,
  tone,
}: {
  agent: AgentPeriodSummary;
  rank: number;
  tone: "best" | "worst";
}) {
  const { t } = useLang();
  return (
    <div className="flex items-center gap-3 rounded-control border border-border bg-bg px-3 py-2.5">
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-pill font-mono text-[11px] font-bold",
          tone === "best" ? "bg-success/14 text-success" : "bg-critical/14 text-critical",
        )}
      >
        {rank}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-body text-[12.5px] font-medium text-fg">
          {agent.name}
        </span>
        <span className="font-mono text-[10.5px] text-fg-muted">
          SLA %{Math.round(agent.slaCompliantPct)} · {t("Ulaşım", "Reach")} %{Math.round(agent.answerRatePct)} ·{" "}
          {agent.deals} deal
        </span>
      </div>
      <span
        className={cn(
          "shrink-0 font-mono text-[13px] font-semibold",
          tone === "best" ? "text-success" : "text-critical",
        )}
      >
        {agent.score.toFixed(1)}
      </span>
    </div>
  );
}

export function BestWorstAgents() {
  const { data } = useTeamDateRange();
  const { t } = useLang();

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
      <Card className="flex flex-col gap-3">
        <SectionTitle
          hint={t("Genel Başarı puanına göre takımın en iyi 5'i.", "The team's top 5 by Overall Score.")}
          aside={<Trophy size={16} className="text-success" aria-hidden />}
        >
          Best 5
        </SectionTitle>
        <div className="flex flex-col gap-2">
          {data.best5.map((agent, i) => (
            <AgentMiniCard key={agent.agentId} agent={agent} rank={i + 1} tone="best" />
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <SectionTitle
          hint={t("Genel Başarı puanı en düşük 5 agent — koçluk önceliğin burada.", "The 5 agents with the lowest Overall Score — your coaching priority is here.")}
          aside={<AlertTriangle size={16} className="text-critical" aria-hidden />}
        >
          Worst 5
        </SectionTitle>
        <div className="flex flex-col gap-2">
          {data.worst5.map((agent, i) => (
            <AgentMiniCard key={agent.agentId} agent={agent} rank={i + 1} tone="worst" />
          ))}
        </div>
      </Card>
    </div>
  );
}
