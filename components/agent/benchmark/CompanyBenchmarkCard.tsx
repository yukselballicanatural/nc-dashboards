"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import {
  AGENT_BENCHMARKS,
  BENCHMARK_METRICS,
  COMPANY_AGENT_COUNT,
  PERCENT_METRICS,
  metricLabel,
  slaTier,
  slaTierLabel,
  type BenchmarkMetric,
  type MetricBenchmark,
} from "@/lib/mock/company-benchmark";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { DURATION, EASING } from "@/lib/motion";
import { formatNumber } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";
import { BenchmarkDetailDrawer } from "./BenchmarkDetailDrawer";

/**
 * ŞİRKET VE TAKIM KIYASLAMASI — v2 4.7 genişletmesi (kullanıcı talebi).
 * Agent'ın Offer/Deal/Paid sayılarını hem kendi takımına hem şirket geneline
 * (bkz. company-benchmark.ts) göre gösterir. Karta tıklayınca dağılım
 * histogramları + analiz metniyle derinlemesine bir sayfa açılır.
 */

const METRIC_COLORS: Record<BenchmarkMetric, { bar: string; text: string }> = {
  offers: { bar: "bg-violet", text: "text-violet" },
  deals: { bar: "bg-brand", text: "text-brand" },
  paidDeals: { bar: "bg-brand-secondary", text: "text-brand-secondary" },
  slaCompliantPct: { bar: "bg-indigo", text: "text-indigo" },
};

/** Yüzde metriklerinde ("%" ekli) sayı gösterimi; diğerlerinde düz sayı. */
function formatMetricValue(metric: BenchmarkMetric, value: number, digits = 0): string {
  const formatted = formatNumber(value, digits);
  return PERCENT_METRICS.has(metric) ? `%${formatted}` : formatted;
}

/** SLA uyum oranı için CLAUDE.md 4 kademeli durum rengi — 🟢🟡🟠🔴. */
const SLA_TIER_CHIP: Record<ReturnType<typeof slaTier>, string> = {
  success: "bg-success/14 text-success",
  warning: "bg-warning/18 text-warning",
  risk: "bg-risk/16 text-risk",
  critical: "bg-critical/14 text-critical",
};

function ScaledBar({
  value,
  max,
  fillClass,
}: {
  value: number;
  max: number;
  fillClass: string;
}) {
  const reduced = usePrefersReducedMotion();
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-pill bg-elevated">
      <motion.div
        className={cn("h-full rounded-pill", fillClass)}
        initial={{ width: reduced ? `${pct}%` : "0%" }}
        animate={{ width: `${pct}%` }}
        transition={reduced ? { duration: 0 } : { duration: DURATION.chart, ease: EASING.out }}
      />
    </div>
  );
}

function MetricRow({ benchmark }: { benchmark: MetricBenchmark }) {
  const { t, lang } = useLang();
  const metric = benchmark.metric;
  const colors = METRIC_COLORS[metric];
  const scaleMax = Math.max(benchmark.distribution.max, benchmark.agentValue, 1);
  const aheadOfCompany = benchmark.vsCompanyPct >= 0;
  const isSla = metric === "slaCompliantPct";
  const tier = isSla ? slaTier(benchmark.agentValue) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-display text-[13px] font-semibold text-fg">
          {metricLabel(metric, lang)}
        </span>
        <div className="flex items-center gap-1.5">
          {/* SLA için 4 kademeli renk kodlu durum rozeti (CLAUDE.md 3.1) — diğer
              metriklerde sadece şirkete göre +/- rozeti gösterilir. */}
          {tier ? (
            <span className={cn("rounded-pill px-2 py-0.5 font-body text-[10px] font-semibold", SLA_TIER_CHIP[tier])}>
              {slaTierLabel(tier, lang)}
            </span>
          ) : (
            <span
              className={cn(
                "flex items-center gap-1 rounded-pill px-2 py-0.5 font-mono text-[10.5px] font-semibold",
                aheadOfCompany ? "bg-success/12 text-success" : "bg-critical/12 text-critical",
              )}
            >
              {aheadOfCompany ? <TrendingUp size={11} aria-hidden /> : <TrendingDown size={11} aria-hidden />}
              {aheadOfCompany ? "+" : ""}
              {formatNumber(benchmark.vsCompanyPct, 1)}%
            </span>
          )}
          <span className="rounded-pill bg-neutral/12 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-fg-secondary">
            #{formatNumber(benchmark.companyRank)}/{formatNumber(benchmark.companyTotal)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="w-16 shrink-0 font-body text-[10.5px] text-fg-secondary">{t("Sen", "You")}</span>
        <ScaledBar value={benchmark.agentValue} max={scaleMax} fillClass={colors.bar} />
        <span className="w-12 shrink-0 text-right font-mono text-[12px] font-bold text-fg">
          {formatMetricValue(metric, benchmark.agentValue, PERCENT_METRICS.has(metric) ? 1 : 0)}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="w-16 shrink-0 font-body text-[10.5px] text-fg-secondary">{t("Takım Ort.", "Team Avg.")}</span>
        <ScaledBar value={benchmark.teamAverage} max={scaleMax} fillClass="bg-neutral" />
        <span className="w-12 shrink-0 text-right font-mono text-[11px] text-fg-secondary">
          {formatMetricValue(metric, benchmark.teamAverage, 1)}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="w-16 shrink-0 font-body text-[10.5px] text-fg-secondary">{t("Şirket Ort.", "Company Avg.")}</span>
        <ScaledBar value={benchmark.companyAverage} max={scaleMax} fillClass="bg-neutral/60" />
        <span className="w-12 shrink-0 text-right font-mono text-[11px] text-fg-muted">
          {formatMetricValue(metric, benchmark.companyAverage, 1)}
        </span>
      </div>
      {isSla && (
        <p className="font-body text-[10.5px] leading-snug text-fg-muted">
          <T
            tr={`Şirket ortalamasına göre ${aheadOfCompany ? "+" : ""}${formatNumber(benchmark.vsCompanyPct, 1)}% — hedef %85 ve üzeri.`}
            en={`${aheadOfCompany ? "+" : ""}${formatNumber(benchmark.vsCompanyPct, 1)}% vs. company average — target is 85%+.`}
          />
        </p>
      )}
    </div>
  );
}

export function CompanyBenchmarkCard() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card
        hoverable
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="group flex cursor-pointer flex-col gap-5 outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-label={t(
          "Şirket ve takım kıyaslaması — detaylı analiz için tıkla",
          "Company and team benchmark — click for detailed analysis",
        )}
      >
        <SectionTitle
          hint={t(
            `Offer, Deal, Paid sayın ve 15 dk SLA uyum oranın; takım ortalaman ve ${formatNumber(COMPANY_AGENT_COUNT)} danışmanlık şirket ortalamasıyla kıyaslanıyor.`,
            `Your Offer, Deal, Paid counts and 15-min SLA compliance rate, compared against your team average and the company-wide average across ${formatNumber(COMPANY_AGENT_COUNT)} agents.`,
          )}
        >
          <T tr="Şirket ve Takım Kıyaslaması" en="Company and Team Benchmark" />
        </SectionTitle>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENCHMARK_METRICS.map((metric) => (
            <MetricRow key={metric} benchmark={AGENT_BENCHMARKS[metric]} />
          ))}
        </div>

        <span className="flex items-center justify-end gap-1 font-body text-[11.5px] font-semibold text-brand transition-colors group-hover:text-brand-secondary">
          <T tr="Tam analizi gör" en="See full analysis" />
          <ChevronRight size={14} aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5" />
        </span>
      </Card>

      <BenchmarkDetailDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
