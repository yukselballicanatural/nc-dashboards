"use client";

import { AlertTriangle, ArrowDown, ArrowUp, Trophy } from "lucide-react";
import {
  AGENT_BENCHMARKS,
  BENCHMARK_AGENT_ID,
  BENCHMARK_METRICS,
  BENCHMARK_TEAM_NAME,
  COMPANY_AGENT_COUNT,
  COMPANY_AGENTS,
  metricLabel,
  type BenchmarkMetric,
  type MetricBenchmark,
} from "@/lib/mock/company-benchmark";
import { formatNumber } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SidePanel } from "@/components/ui/SidePanel";
import { cn } from "@/lib/utils/cn";

export interface BenchmarkDetailDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Tailwind JIT string-interpolasyonlu sınıf adlarını taramaz — bu yüzden her
 * metrik için TAM sınıf adları burada literal olarak tanımlanır (ör.
 * `bg-${accent}` derlenmezdi).
 */
const METRIC_STYLES: Record<BenchmarkMetric, { chip: string; bucket: string }> = {
  offers: { chip: "bg-violet/12 text-violet", bucket: "bg-violet" },
  deals: { chip: "bg-brand/12 text-brand", bucket: "bg-brand" },
  paidDeals: { chip: "bg-brand-secondary/12 text-brand-secondary", bucket: "bg-brand-secondary" },
};

/** Şirket geneli 122 danışman içinde ilgili metriğe göre sıralanmış takım listesi. */
function teamLeaderboard(metric: BenchmarkMetric) {
  return COMPANY_AGENTS.filter((a) => a.teamId === "team-aamir-ali").sort(
    (a, b) => b[metric] - a[metric],
  );
}

function MetricDeepCard({ metric }: { metric: BenchmarkMetric }) {
  const { t, lang } = useLang();
  const b: MetricBenchmark = AGENT_BENCHMARKS[metric];
  const styles = METRIC_STYLES[metric];
  const aheadOfCompany = b.vsCompanyPct >= 0;
  const aheadOfTeam = b.vsTeamPct >= 0;
  const maxBucketCount = Math.max(1, ...b.distribution.buckets.map((x) => x.count));

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle
        aside={
          <span className={cn("shrink-0 rounded-pill px-2.5 py-1 font-mono text-[11px] font-semibold", styles.chip)}>
            {formatNumber(b.agentValue)}
          </span>
        }
      >
        {metricLabel(metric, lang)}
      </SectionTitle>

      {/* Sıralama özeti */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5 rounded-control border border-border bg-surface px-3 py-2.5">
          <span className="font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
            <T tr="Şirket Sıralaman" en="Company Rank" />
          </span>
          <span className="font-mono text-[15px] font-bold text-fg">
            #{formatNumber(b.companyRank)} <span className="text-fg-muted">/ {formatNumber(b.companyTotal)}</span>
          </span>
          <span className="font-body text-[10.5px] text-fg-secondary">
            <T
              tr={`üst %${formatNumber(100 - b.companyPercentile, 0)}'lik dilim`}
              en={`top ${formatNumber(100 - b.companyPercentile, 0)}% bracket`}
            />
          </span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-control border border-border bg-surface px-3 py-2.5">
          <span className="font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
            <T tr="Takım Sıralaman" en="Team Rank" />
          </span>
          <span className="font-mono text-[15px] font-bold text-fg">
            #{formatNumber(b.teamRank)} <span className="text-fg-muted">/ {formatNumber(b.teamTotal)}</span>
          </span>
          <span className="font-body text-[10.5px] text-fg-secondary">{BENCHMARK_TEAM_NAME}</span>
        </div>
      </div>

      {/* Kıyaslama satırları */}
      <div className="flex flex-col gap-1.5">
        {[
          { label: t("Takım ortalamasına göre", "vs. team average"), pct: b.vsTeamPct, ahead: aheadOfTeam, avg: b.teamAverage },
          { label: t("Şirket ortalamasına göre", "vs. company average"), pct: b.vsCompanyPct, ahead: aheadOfCompany, avg: b.companyAverage },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-control border border-border bg-elevated px-3 py-2"
          >
            <span className="font-body text-[11.5px] text-fg-secondary">{row.label}</span>
            <span className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-fg-muted">
                ({t("ort.", "avg.")} {formatNumber(row.avg, 1)})
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-pill px-2 py-0.5 font-mono text-[11px] font-semibold",
                  row.ahead ? "bg-success/12 text-success" : "bg-critical/12 text-critical",
                )}
              >
                {row.ahead ? <ArrowUp size={11} aria-hidden /> : <ArrowDown size={11} aria-hidden />}
                {row.ahead ? "+" : ""}
                {formatNumber(row.pct, 1)}%
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Dağılım histogramı */}
      <div className="flex flex-col gap-1.5">
        <span className="font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted">
          <T
            tr={`${formatNumber(COMPANY_AGENT_COUNT)} danışman arasında dağılım`}
            en={`Distribution across ${formatNumber(COMPANY_AGENT_COUNT)} agents`}
          />
        </span>
        <div className="flex items-end gap-1.5">
          {b.distribution.buckets.map((bucket) => (
            <div key={bucket.rangeLabel} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-16 w-full items-end">
                <div
                  className={cn(
                    "w-full rounded-t-[3px] transition-[height]",
                    bucket.containsAgent ? styles.bucket : "bg-neutral/25",
                  )}
                  style={{ height: `${Math.max(6, (bucket.count / maxBucketCount) * 100)}%` }}
                  title={`${bucket.rangeLabel}: ${bucket.count} ${t("danışman", "agents")}`}
                />
              </div>
              <span className="font-mono text-[9px] text-fg-muted">{bucket.rangeLabel}</span>
            </div>
          ))}
        </div>
        <p className="font-body text-[10.5px] text-fg-muted">
          <T tr="Medyan" en="Median" />{" "}
          <span className="font-mono text-fg-secondary">{formatNumber(b.distribution.median)}</span>
          {" · "}
          <T tr="üst %25 eşiği" en="top 25% threshold" />{" "}
          <span className="font-mono text-fg-secondary">{formatNumber(b.distribution.p75)}</span>
          {" · "}
          <T tr="üst %10 eşiği" en="top 10% threshold" />{" "}
          <span className="font-mono text-fg-secondary">{formatNumber(b.distribution.p90)}</span>
        </p>
      </div>
    </Card>
  );
}

function TeamLeaderboardCard({ metric }: { metric: BenchmarkMetric }) {
  const { t } = useLang();
  const rows = teamLeaderboard(metric);

  return (
    <Card className="flex flex-col gap-3">
      <SectionTitle>
        <T
          tr={`${BENCHMARK_TEAM_NAME} — ${metricLabel(metric, "tr")} Sıralaması`}
          en={`${BENCHMARK_TEAM_NAME} — ${metricLabel(metric, "en")} Ranking`}
        />
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse">
          <tbody>
            {rows.map((row, i) => {
              const isMe = row.agentId === BENCHMARK_AGENT_ID;
              return (
                <tr
                  key={row.agentId}
                  className={cn(
                    "border-b border-border last:border-0",
                    isMe && "bg-brand/8",
                  )}
                >
                  <td className="w-8 px-2 py-1.5 text-left font-mono text-[11px] text-fg-muted">
                    {i + 1 <= 3 ? <Trophy size={12} className="text-brand-secondary" aria-hidden /> : `#${i + 1}`}
                  </td>
                  <td className="px-2 py-1.5 text-left font-body text-[12px] text-fg">
                    {row.name}
                    {isMe && (
                      <span className="ml-1.5 rounded-pill bg-brand/15 px-1.5 py-0.5 font-body text-[9px] font-semibold uppercase text-brand">
                        {t("sen", "you")}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono text-[12px] font-semibold text-fg">
                    {formatNumber(row[metric])}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function BenchmarkDetailDrawer({ open, onClose }: BenchmarkDetailDrawerProps) {
  const { t } = useLang();

  const strongest = [...BENCHMARK_METRICS].sort(
    (a, b) => AGENT_BENCHMARKS[b].vsCompanyPct - AGENT_BENCHMARKS[a].vsCompanyPct,
  );
  const best = strongest[0];
  const worst = strongest[strongest.length - 1];
  const aboveCount = BENCHMARK_METRICS.filter((m) => AGENT_BENCHMARKS[m].vsCompanyPct >= 0).length;

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={<T tr="Şirket ve Takım Analizin" en="Your Company and Team Analysis" />}
      subtitle={t(
        `${BENCHMARK_TEAM_NAME} · ${formatNumber(COMPANY_AGENT_COUNT)} danışmanlık şirket havuzu`,
        `${BENCHMARK_TEAM_NAME} · company-wide pool of ${formatNumber(COMPANY_AGENT_COUNT)} agents`,
      )}
    >
      {/* Özet şerit */}
      <div className="grid grid-cols-3 gap-3">
        {BENCHMARK_METRICS.map((metric) => {
          const b = AGENT_BENCHMARKS[metric];
          const ahead = b.vsCompanyPct >= 0;
          return (
            <div
              key={metric}
              className="flex flex-col gap-0.5 rounded-control border border-border bg-surface px-3 py-2.5"
            >
              <span className="font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                {metricLabel(metric, "tr")}
              </span>
              <span className="font-mono text-[16px] font-bold text-fg">{formatNumber(b.agentValue)}</span>
              <span className={cn("font-mono text-[10.5px] font-semibold", ahead ? "text-success" : "text-critical")}>
                {ahead ? "+" : ""}
                {formatNumber(b.vsCompanyPct, 1)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Genel analiz */}
      <div
        className={cn(
          "flex items-start gap-2.5 rounded-card border px-4 py-3",
          aboveCount >= 2 ? "border-success/35 bg-success/8" : "border-brand-secondary/35 bg-brand-secondary/10",
        )}
      >
        {aboveCount >= 2 ? (
          <Trophy size={16} aria-hidden className="mt-0.5 shrink-0 text-success" />
        ) : (
          <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0 text-brand-secondary" />
        )}
        <p className="font-body text-[12.5px] leading-relaxed text-fg">
          <T
            tr={`3 metrikten ${aboveCount}'inde şirket ortalamasının üzerindesin. En güçlü olduğun metrik ${metricLabel(best, "tr")} (${AGENT_BENCHMARKS[best].vsCompanyPct >= 0 ? "+" : ""}${AGENT_BENCHMARKS[best].vsCompanyPct.toFixed(1)}%) — en çok gelişim alanın ${metricLabel(worst, "tr")} (${AGENT_BENCHMARKS[worst].vsCompanyPct.toFixed(1)}%). ${metricLabel(worst, "tr")}'de şirket ortalamasını yakalamak için aylık ortalama ${formatNumber(Math.max(0, Math.ceil(AGENT_BENCHMARKS[worst].companyAverage - AGENT_BENCHMARKS[worst].agentValue)))} birim daha gerekiyor.`}
            en={`You're above the company average in ${aboveCount} of 3 metrics. Your strongest metric is ${metricLabel(best, "en")} (${AGENT_BENCHMARKS[best].vsCompanyPct >= 0 ? "+" : ""}${AGENT_BENCHMARKS[best].vsCompanyPct.toFixed(1)}%) — your biggest growth area is ${metricLabel(worst, "en")} (${AGENT_BENCHMARKS[worst].vsCompanyPct.toFixed(1)}%). Closing the gap to the company average there needs about ${formatNumber(Math.max(0, Math.ceil(AGENT_BENCHMARKS[worst].companyAverage - AGENT_BENCHMARKS[worst].agentValue)))} more.`}
          />
        </p>
      </div>

      {BENCHMARK_METRICS.map((metric) => (
        <MetricDeepCard key={metric} metric={metric} />
      ))}

      {BENCHMARK_METRICS.map((metric) => (
        <TeamLeaderboardCard key={`lb-${metric}`} metric={metric} />
      ))}
    </SidePanel>
  );
}
