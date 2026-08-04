"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useDateRange } from "@/components/agent/filters/DateRangeContext";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
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
 * Tam funnel — v2 4.3: Lead → ... → Ödeme Alınan Deal (10 aşama).
 * Her aşamada adet + önceki aşamaya göre % + lead'e göre % + (varsa) şirket
 * ortalamasına göre renk kodlu kıyas rozeti (bkz. company-benchmark.ts —
 * FUNNEL_STAGE_TRANSITION: contact/offer-created/deal/paid aşamaları).
 * Tek hue (violet — funnel verisi, 3.1); adetler doğrudan etiketli.
 */
export function FullFunnelChart() {
  const reduced = usePrefersReducedMotion();
  const { data } = useDateRange();
  const { t } = useLang();
  const FULL_FUNNEL = data.fullFunnel;
  const max = Math.max(...FULL_FUNNEL.map((s) => s.count), 1);
  const countOf = (key: string) => FULL_FUNNEL.find((s) => s.key === key)?.count ?? 0;

  /**
   * Şirket ortalaması (COMPANY_FUNNEL_TRANSITIONS) leadToContact/contactToOffer/
   * offerToDeal/dealToPaid gibi SABİT aşama çiftleri üzerinden tanımlı — ama
   * stage.prevPct her satırda listedeki BİR ÖNCEKİ satıra göre hesaplanır
   * (örn. "Deal" için "Willing to Close"a göre). Bu ikisi farklı taban
   * kullandığından doğrudan kıyaslamak yanlış rakam üretir; kıyas için
   * agent'ın kendi oranını şirketle aynı taban üzerinden yeniden hesaplıyoruz.
   */
  const agentTransitionPct: Record<FunnelTransitionKey, number> = {
    leadToContact: countOf("lead") > 0 ? (countOf("contact") / countOf("lead")) * 100 : 0,
    contactToOffer: countOf("contact") > 0 ? (countOf("offer-created") / countOf("contact")) * 100 : 0,
    offerToDeal: countOf("offer-created") > 0 ? (countOf("deal") / countOf("offer-created")) * 100 : 0,
    dealToPaid: countOf("deal") > 0 ? (countOf("paid") / countOf("deal")) * 100 : 0,
  };

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={t(
          "Lead'den ödemeye tüm yolculuk. Orta sütun: bir önceki aşamadan geçiş oranı · sağ sütun: tüm lead'lere göre oran · rozet: şirket ortalamasına göre geçiş oranı kıyası.",
          "The whole journey from lead to payment. Middle column: conversion from the previous stage · right column: rate against all leads · badge: this stage's conversion rate vs. the company average.",
        )}
      >
        <T tr="Genel Funnel (Tüm Zamanlar)" en="Overall Funnel (All Time)" />
      </SectionTitle>

      {/* Kolon başlıkları */}
      <div className="flex items-center gap-3 font-body text-[10px] uppercase tracking-wide text-fg-muted">
        <span className="w-32 shrink-0"><T tr="Aşama" en="Stage" /></span>
        <span className="flex-1" />
        <span className="w-14 shrink-0 text-right"><T tr="Önceki %" en="Prev %" /></span>
        <span className="w-14 shrink-0 text-right"><T tr="Lead %" en="Lead %" /></span>
        <span className="w-24 shrink-0 text-right"><T tr="Şirkete Göre" en="vs. Company" /></span>
      </div>

      <ul className="flex flex-1 flex-col justify-center gap-2">
        {FULL_FUNNEL.map((stage, index) => {
          const widthPct = (stage.count / max) * 100;
          const transitionKey = FUNNEL_STAGE_TRANSITION[stage.key];
          const companyPct = transitionKey ? COMPANY_FUNNEL_TRANSITIONS[transitionKey] : null;
          const agentPct = transitionKey ? agentTransitionPct[transitionKey] : null;
          const vsCompanyPts =
            companyPct !== null && agentPct !== null
              ? Math.round((agentPct - companyPct) * 10) / 10
              : null;
          const aheadOfCompany = vsCompanyPts !== null && vsCompanyPts >= 0;
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
                      : {
                          duration: DURATION.chart,
                          ease: EASING.out,
                          delay: index * STAGGER.children,
                        }
                  }
                  style={{ minWidth: "2.1rem" }}
                >
                  <span className="font-mono text-[11px] font-semibold text-white">
                    {formatNumber(stage.count)}
                  </span>
                </motion.div>

                {/* Hover detay balonu */}
                <HoverTip align="right">
                  <p className="mb-0.5 font-display text-[12px] font-semibold text-fg">
                    {stage.label}
                  </p>
                  <p className="font-mono text-[11.5px] text-fg-secondary">
                    <span className="text-violet">{formatNumber(stage.count)}</span>{" "}
                    <T tr="kayıt" en="records" />
                  </p>
                  <p className="font-mono text-[11px] text-fg-muted">
                    {stage.prevPct !== null
                      ? t(
                          `Önceki aşamadan %${Math.round(stage.prevPct)} · `,
                          `${Math.round(stage.prevPct)}% from previous stage · `,
                        )
                      : ""}
                    {t(
                      `Tüm lead'lerin %${Math.round(stage.leadPct)}'i`,
                      `${Math.round(stage.leadPct)}% of all leads`,
                    )}
                  </p>
                  {companyPct !== null && (
                    <p className="mt-0.5 font-mono text-[11px] text-fg-muted">
                      {t(
                        `Şirket ortalaması: %${Math.round(companyPct)}`,
                        `Company average: ${Math.round(companyPct)}%`,
                      )}
                    </p>
                  )}
                </HoverTip>
              </div>
              <span className="w-14 shrink-0 text-right font-mono text-[11px] text-fg">
                {stage.prevPct !== null ? formatPercent(stage.prevPct, 0) : "—"}
              </span>
              <span className="w-14 shrink-0 text-right font-mono text-[11px] text-fg-muted">
                {formatPercent(stage.leadPct, 0)}
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
