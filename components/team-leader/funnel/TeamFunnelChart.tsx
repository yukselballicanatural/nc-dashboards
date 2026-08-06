"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { DURATION, EASING, STAGGER } from "@/lib/motion";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import {
  COMPANY_FUNNEL_TRANSITIONS,
  FUNNEL_STAGE_TRANSITION,
  type FunnelTransitionKey,
} from "@/lib/mock/company-benchmark";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HoverTip } from "@/components/ui/HoverTip";
import { cn } from "@/lib/utils/cn";

/**
 * Takım geneli funnel — agent panelindeki FullFunnelChart'ın takım toplamı
 * versiyonu. Hover'da o aşamaya en çok katkı veren 3 agent gösterilir —
 * "bu sayı nereden geliyor" sorusuna cevap. Sağ kolonda takımın geçiş oranının
 * şirket ortalamasına göre renk kodlu farkı (bkz. company-benchmark.ts).
 */
export function TeamFunnelChart() {
  const reduced = usePrefersReducedMotion();
  const { data } = useTeamDateRange();
  const { t } = useLang();
  const stages = data.funnel;
  const max = Math.max(...stages.map((s) => s.total), 1);
  const totalOf = (key: string) => stages.find((s) => s.key === key)?.total ?? 0;

  /**
   * Şirket ortalaması SABİT aşama çiftleri üzerinden tanımlı, ama stage.prevPct
   * listedeki bir önceki SATIRA göre hesaplanır (örn. Deal için Willing to
   * Close). Farklı taban → yanlış kıyas; bu yüzden takımın oranını şirketle
   * aynı taban üzerinden yeniden hesaplıyoruz (agent panelindeki
   * FullFunnelChart ile birebir aynı mantık).
   */
  const teamTransitionPct: Record<FunnelTransitionKey, number> = {
    leadToContact: totalOf("lead") > 0 ? (totalOf("contact") / totalOf("lead")) * 100 : 0,
    contactToOffer: totalOf("contact") > 0 ? (totalOf("offer-created") / totalOf("contact")) * 100 : 0,
    offerToDeal: totalOf("offer-created") > 0 ? (totalOf("deal") / totalOf("offer-created")) * 100 : 0,
    dealToPaid: totalOf("deal") > 0 ? (totalOf("paid") / totalOf("deal")) * 100 : 0,
  };

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle hint={t("Lead'den ödemeye takımın tüm yolculuğu. Üstüne gelince en çok katkı veren agent'ları görürsün. Sağ kolon: o aşamanın geçiş oranının şirket ortalamasına göre farkı.", "The team's whole journey from lead to payment. Hover to see which agents contribute most. Right column: that stage's conversion rate versus the company average.")}>
        <T tr="Takım Funnel'ı (Seçili Dönem)" en="Team Funnel (Selected Period)" />
      </SectionTitle>

      <div className="flex items-center gap-3 font-body text-[10px] uppercase tracking-wide text-fg-muted">
        <span className="w-32 shrink-0"><T tr="Aşama" en="Stage" /></span>
        <span className="flex-1" />
        <span className="w-14 shrink-0 text-right"><T tr="Önceki %" en="Prev %" /></span>
        <span className="w-24 shrink-0 text-right"><T tr="Şirkete Göre" en="vs. Company" /></span>
      </div>

      <ul className="flex flex-1 flex-col justify-center gap-2">
        {stages.map((stage, index) => {
          const widthPct = (stage.total / max) * 100;
          const transitionKey = FUNNEL_STAGE_TRANSITION[stage.key];
          const companyPct = transitionKey ? COMPANY_FUNNEL_TRANSITIONS[transitionKey] : null;
          const teamPct = transitionKey ? teamTransitionPct[transitionKey] : null;
          const vsCompanyPts =
            companyPct !== null && teamPct !== null
              ? Math.round((teamPct - companyPct) * 10) / 10
              : null;
          const aheadOfCompany = vsCompanyPts !== null && vsCompanyPts >= 0;
          const topAgents = [...stage.byAgent]
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .filter((a) => a.count > 0);
          return (
            <li
              key={stage.key}
              className="group flex items-center gap-3 rounded-[8px] px-1 py-0.5 transition-colors hover:bg-elevated"
            >
              <span className="w-32 shrink-0 truncate font-body text-[11.5px] text-fg-secondary transition-colors group-hover:text-fg">
                {stage.label}
              </span>
              <div className="relative h-6 flex-1">
                <motion.div
                  className="flex h-full items-center rounded-[7px] bg-violet pl-2 transition-[filter,transform] duration-150 group-hover:brightness-110 group-hover:saturate-150"
                  initial={{ width: reduced ? `${widthPct}%` : "0%" }}
                  animate={{ width: `${widthPct}%` }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: DURATION.chart, ease: EASING.out, delay: index * STAGGER.children }
                  }
                  style={{ minWidth: "2.1rem" }}
                >
                  <span className="font-mono text-[11px] font-semibold text-white">
                    {formatNumber(stage.total)}
                  </span>
                </motion.div>

                <HoverTip align="right">
                  <p className="mb-0.5 font-display text-[12px] font-semibold text-fg">
                    {stage.label}
                  </p>
                  <p className="mb-1 font-mono text-[11px] text-fg-muted">
                    {stage.prevPct !== null
                      ? t(`Önceki aşamadan %${Math.round(stage.prevPct)} geçiş`, `${Math.round(stage.prevPct)}% pass-through from previous stage`)
                      : t("Funnel'ın başı", "Start of the funnel")}
                  </p>
                  {companyPct !== null && (
                    <p className="mb-1 font-mono text-[11px] text-fg-muted">
                      {t(
                        `Şirket ortalaması: %${Math.round(companyPct)}`,
                        `Company average: ${Math.round(companyPct)}%`,
                      )}
                    </p>
                  )}
                  {topAgents.length > 0 && (
                    <div className="flex flex-col gap-0.5 border-t border-border pt-1">
                      {topAgents.map((a) => (
                        <p key={a.agentId} className="font-mono text-[10.5px] text-fg-secondary">
                          {a.name}: <span className="text-violet">{a.count}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </HoverTip>
              </div>
              <span className="w-14 shrink-0 text-right font-mono text-[11px] text-fg">
                {stage.prevPct !== null ? formatPercent(stage.prevPct, 0) : "—"}
              </span>
              <span className="flex w-24 shrink-0 items-center justify-end">
                {vsCompanyPts !== null ? (
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-pill px-2 py-0.5 font-mono text-[10.5px] font-semibold",
                      aheadOfCompany ? "bg-success/12 text-success" : "bg-critical/12 text-critical",
                    )}
                  >
                    {aheadOfCompany ? <TrendingUp size={10} aria-hidden /> : <TrendingDown size={10} aria-hidden />}
                    {aheadOfCompany ? "+" : ""}
                    {formatNumber(vsCompanyPts, 1)}
                    {t(" puan", " pts")}
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-fg-muted">—</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
