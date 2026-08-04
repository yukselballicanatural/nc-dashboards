"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
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
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { formatNumber } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SidePanel } from "@/components/ui/SidePanel";
import { AXIS_TICK, TooltipFrame } from "@/components/ui/ChartBits";
import { cn } from "@/lib/utils/cn";

export interface BenchmarkDetailDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Tailwind JIT string-interpolasyonlu sınıf adlarını taramaz — bu yüzden her
 * metrik için TAM sınıf adları burada literal olarak tanımlanır.
 */
const METRIC_STYLES: Record<BenchmarkMetric, { chip: string; color: string }> = {
  offers: { chip: "bg-violet/12 text-violet", color: "var(--violet)" },
  deals: { chip: "bg-brand/12 text-brand", color: "var(--brand)" },
  paidDeals: { chip: "bg-brand-secondary/12 text-brand-secondary", color: "var(--brand-secondary)" },
};

/** Şirket geneli havuz içinde ilgili metriğe göre sıralanmış TAKIM listesi. */
function teamLeaderboard(metric: BenchmarkMetric) {
  return COMPANY_AGENTS.filter((a) => a.teamId === "team-aamir-ali").sort(
    (a, b) => b[metric] - a[metric],
  );
}

/** "Sen / Takım Ort. / Şirket Ort." — 3 barlı kıyaslama grafiği. */
function ComparisonChart({ b, color }: { b: MetricBenchmark; color: string }) {
  const { t } = useLang();
  const reduced = usePrefersReducedMotion();
  const data = [
    { label: t("Sen", "You"), value: b.agentValue, deltaPct: null as number | null, fill: color },
    { label: t("Takım Ort.", "Team Avg."), value: b.teamAverage, deltaPct: b.vsTeamPct, fill: "var(--neutral)" },
    { label: t("Şirket Ort.", "Company Avg."), value: b.companyAverage, deltaPct: b.vsCompanyPct, fill: "var(--fg-muted)" },
  ];

  return (
    <div className="h-[104px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 2, right: 34, bottom: 2, left: 4 }} barSize={16}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            axisLine={false}
            tickLine={false}
            width={78}
            tick={AXIS_TICK}
          />
          <Tooltip
            cursor={{ fill: "var(--elevated)" }}
            content={({ active, payload }: TooltipContentProps<ValueType, NameType>) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as (typeof data)[number];
              return (
                <TooltipFrame
                  title={row.label}
                  rows={[
                    {
                      label: t("Değer", "Value"),
                      value: formatNumber(row.value, 1),
                      color: row.fill,
                    },
                    ...(row.deltaPct !== null
                      ? [{ label: t("Sana göre fark", "Diff vs. you"), value: `${b.agentValue - row.value >= 0 ? "+" : ""}${formatNumber(b.agentValue - row.value, 1)}` }]
                      : []),
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="value"
            radius={[0, 6, 6, 0]}
            isAnimationActive={!reduced}
            animationDuration={700}
            animationEasing="ease-out"
            label={{
              position: "right",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              fill: "var(--fg-secondary)",
              formatter: (label: unknown) => {
                const value = Number(label);
                return formatNumber(value, Number.isInteger(value) ? 0 : 1);
              },
            }}
          >
            {data.map((row) => (
              <Cell key={row.label} fill={row.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Şirket geneli dağılım histogramı — agent'ın düştüğü kova vurgulanır. */
function DistributionChart({ b, color }: { b: MetricBenchmark; color: string }) {
  const { t } = useLang();
  const reduced = usePrefersReducedMotion();
  const data = b.distribution.buckets.map((bucket) => ({ ...bucket }));

  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -30 }} barCategoryGap={4}>
          <XAxis dataKey="rangeLabel" axisLine={false} tickLine={false} tick={{ ...AXIS_TICK, fontSize: 9 }} interval={0} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={AXIS_TICK} width={26} />
          <Tooltip
            cursor={{ fill: "var(--elevated)" }}
            content={({ active, payload }: TooltipContentProps<ValueType, NameType>) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as (typeof data)[number];
              return (
                <TooltipFrame
                  title={row.rangeLabel}
                  rows={[{ label: t("Danışman", "Agents"), value: formatNumber(row.count) }]}
                />
              );
            }}
          />
          <Bar
            dataKey="count"
            radius={[3, 3, 0, 0]}
            maxBarSize={26}
            isAnimationActive={!reduced}
            animationDuration={700}
            animationEasing="ease-out"
          >
            {data.map((bucket) => (
              <Cell key={bucket.rangeLabel} fill={bucket.containsAgent ? color : "var(--neutral)"} opacity={bucket.containsAgent ? 1 : 0.3} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Takım içi sıralama — yatay barlar, "sen" vurgulanır. */
function TeamRankChart({ metric, color }: { metric: BenchmarkMetric; color: string }) {
  const { t, lang } = useLang();
  const reduced = usePrefersReducedMotion();
  const rows = teamLeaderboard(metric);
  const data = rows.map((row, i) => ({
    label: `${i + 1}. ${row.name}`,
    value: row[metric],
    isMe: row.agentId === BENCHMARK_AGENT_ID,
  }));

  return (
    <div style={{ height: Math.max(120, data.length * 24) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 2, right: 30, bottom: 2, left: 4 }} barCategoryGap={4}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            axisLine={false}
            tickLine={false}
            width={132}
            tick={{ ...AXIS_TICK, fontSize: 10.5 }}
          />
          <Tooltip
            cursor={{ fill: "var(--elevated)" }}
            content={({ active, payload }: TooltipContentProps<ValueType, NameType>) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as (typeof data)[number];
              return (
                <TooltipFrame
                  title={row.isMe ? t("Sen", "You") : row.label.replace(/^\d+\.\s/, "")}
                  rows={[{ label: metricLabel(metric, lang), value: formatNumber(row.value) }]}
                />
              );
            }}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            maxBarSize={14}
            isAnimationActive={!reduced}
            animationDuration={700}
            animationEasing="ease-out"
          >
            {data.map((row) => (
              <Cell key={row.label} fill={row.isMe ? color : "var(--neutral)"} opacity={row.isMe ? 1 : 0.35} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MetricDeepCard({ metric }: { metric: BenchmarkMetric }) {
  const { t, lang } = useLang();
  const b: MetricBenchmark = AGENT_BENCHMARKS[metric];
  const styles = METRIC_STYLES[metric];
  const aheadOfCompany = b.vsCompanyPct >= 0;

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

      {/* Sen / Takım / Şirket — canlı kıyaslama grafiği */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted">
            <T tr="Sen / Takım / Şirket" en="You / Team / Company" />
          </span>
          <span
            className={cn(
              "flex items-center gap-1 rounded-pill px-2 py-0.5 font-mono text-[10.5px] font-semibold",
              aheadOfCompany ? "bg-success/12 text-success" : "bg-critical/12 text-critical",
            )}
          >
            {aheadOfCompany ? <ArrowUp size={10} aria-hidden /> : <ArrowDown size={10} aria-hidden />}
            {aheadOfCompany ? "+" : ""}
            {formatNumber(b.vsCompanyPct, 1)}%{" "}
            <T tr="şirkete göre" en="vs. company" />
          </span>
        </div>
        <ComparisonChart b={b} color={styles.color} />
      </div>

      {/* Dağılım histogramı */}
      <div className="flex flex-col gap-1.5">
        <span className="font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted">
          <T
            tr={`${formatNumber(COMPANY_AGENT_COUNT)} danışman arasında dağılım`}
            en={`Distribution across ${formatNumber(COMPANY_AGENT_COUNT)} agents`}
          />
        </span>
        <DistributionChart b={b} color={styles.color} />
        <p className="font-body text-[10.5px] text-fg-muted">
          <T tr="Medyan" en="Median" />{" "}
          <span className="font-mono text-fg-secondary">{formatNumber(b.distribution.median)}</span>
          {" · "}
          <T tr="üst %10 eşiği" en="top 10% threshold" />{" "}
          <span className="font-mono text-fg-secondary">{formatNumber(b.distribution.p90)}</span>
        </p>
      </div>

      {/* Takım içi sıralama — canlı grafik */}
      <div className="flex flex-col gap-1.5">
        <span className="font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted">
          <T tr={`${BENCHMARK_TEAM_NAME} sıralaması`} en={`${BENCHMARK_TEAM_NAME} ranking`} />
        </span>
        <TeamRankChart metric={metric} color={styles.color} />
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
    </SidePanel>
  );
}
