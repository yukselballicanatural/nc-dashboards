"use client";

import { AlertTriangle, Check } from "lucide-react";
import {
  ACHIEVER_COUNT,
  AGENT_COUNT,
  AGENTS_BELOW_THRESHOLD,
  gapToThresholdEUR,
  NEXT_ACHIEVER_TIER,
  TEAM_AGENT_SALES,
  TEAM_TIER_STEPS,
  TL_COMMISSION,
} from "@/lib/mock/team-earnings";
import {
  TL_ACHIEVER_MULTIPLIERS,
  TL_ACHIEVER_THRESHOLD_EUR,
  TL_MIN_PER_AGENT_EUR,
} from "@/lib/mock/commission";
import { formatCurrencyEUR, formatNumber, formatRatePct } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * TL PRİM DETAYI — üç blok:
 *  1) Agent bazlı gerçekleşme (eşiği geçen / minimumun altında kalan)
 *  2) Çeyreklik oran merdiveni (agent başına aylık ortalamaya göre)
 *  3) Çarpan kademeleri (eşiği geçen agent sayısına göre)
 */
export function TeamCommissionTable() {
  const { t } = useLang();

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* 1 — Agent bazlı gerçekleşme */}
      <Card className="flex flex-col gap-4">
        <SectionTitle
          hint={t(
            `Prim koşulu agent başına en az ${formatCurrencyEUR(TL_MIN_PER_AGENT_EUR)} gerçekleşmedir. Çeyreklik çarpan ise ${formatCurrencyEUR(TL_ACHIEVER_THRESHOLD_EUR)} eşiğini geçen agent SAYISINA bağlıdır — bu yüzden eşiğin hemen altındaki agent'lar en değerli kaldıraçtır.`,
            `The commission condition is a minimum of ${formatCurrencyEUR(TL_MIN_PER_AGENT_EUR)} realized per agent. The quarterly multiplier depends on the NUMBER of agents clearing the ${formatCurrencyEUR(TL_ACHIEVER_THRESHOLD_EUR)} threshold — so agents just below it are your most valuable lever.`,
          )}
          aside={
            <span className="shrink-0 rounded-pill bg-brand/12 px-2.5 py-1 font-mono text-[11px] font-semibold text-brand">
              {formatNumber(ACHIEVER_COUNT)}/{formatNumber(AGENT_COUNT)}
            </span>
          }
        >
          <T tr="Agent Bazlı Gerçekleşme" en="Realization by Agent" />
        </SectionTitle>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                {([
                  ["Agent", "Agent"],
                  ["Bu Ay Satış", "Sales This Month"],
                  ["Eşiğe Kalan", "Gap to Threshold"],
                  ["Durum", "Status"],
                ] as Array<[string, string]>).map(([tr, en], i) => (
                  <th
                    key={tr}
                    scope="col"
                    className={cn(
                      "px-2.5 py-2 font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted",
                      i === 0 ? "text-left" : "text-right",
                    )}
                  >
                    {t(tr, en)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TEAM_AGENT_SALES.map((agent) => {
                const gap = gapToThresholdEUR(agent.salesEUR);
                return (
                  <tr
                    key={agent.agentId}
                    className="border-b border-border transition-colors last:border-0 hover:bg-elevated"
                  >
                    <td className="px-2.5 py-2.5 text-left font-body text-[12px] text-fg">
                      {agent.name}
                    </td>
                    <td className="px-2.5 py-2.5 text-right font-mono text-[11.5px] text-fg">
                      {formatCurrencyEUR(agent.salesEUR)}
                    </td>
                    <td
                      className={cn(
                        "px-2.5 py-2.5 text-right font-mono text-[11.5px]",
                        gap > 0 ? "font-semibold text-brand-secondary" : "text-fg-muted",
                      )}
                    >
                      {gap > 0 ? formatCurrencyEUR(gap) : "—"}
                    </td>
                    <td className="px-2.5 py-2.5 text-right">
                      {agent.isAchiever ? (
                        <span className="inline-flex items-center gap-1 rounded-pill bg-success/15 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-success">
                          <Check size={10} aria-hidden />
                          {t("eşiği geçti", "cleared")}
                        </span>
                      ) : agent.meetsMinimum ? (
                        <span className="rounded-pill bg-warning/15 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-warning">
                          {t("minimum tamam", "minimum met")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-pill bg-critical/15 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-critical">
                          <AlertTriangle size={10} aria-hidden />
                          {t("minimumun altında", "below minimum")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {AGENTS_BELOW_THRESHOLD.length > 0 && NEXT_ACHIEVER_TIER && (
          <div className="flex items-start gap-2.5 rounded-card border border-brand-secondary/35 bg-brand-secondary/10 px-4 py-3">
            <AlertTriangle size={15} aria-hidden className="mt-0.5 shrink-0 text-brand-secondary" />
            <p className="font-body text-[12.5px] leading-relaxed text-fg">
              <T
                tr={`Çarpanı ${formatRatePct(NEXT_ACHIEVER_TIER.bonusPct)}'e çıkarmak için ${formatNumber(NEXT_ACHIEVER_TIER.agentsNeeded)} agent daha ${formatCurrencyEUR(TL_ACHIEVER_THRESHOLD_EUR)} eşiğini geçmeli. En yakın aday: ${AGENTS_BELOW_THRESHOLD[0].name} — ${formatCurrencyEUR(gapToThresholdEUR(AGENTS_BELOW_THRESHOLD[0].salesEUR))} eksiği var.`}
                en={`To raise your multiplier to ${NEXT_ACHIEVER_TIER.bonusPct}%, ${formatNumber(NEXT_ACHIEVER_TIER.agentsNeeded)} more agents must clear the ${formatCurrencyEUR(TL_ACHIEVER_THRESHOLD_EUR)} threshold. Closest candidate: ${AGENTS_BELOW_THRESHOLD[0].name} — ${formatCurrencyEUR(gapToThresholdEUR(AGENTS_BELOW_THRESHOLD[0].salesEUR))} short.`}
              />
            </p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        {/* 2 — Çeyreklik oran merdiveni */}
        <Card className="flex flex-col gap-4">
          <SectionTitle
            hint={t(
              "Çeyreklik komisyon oranı, agent başına aylık ORTALAMA satışa göre seçilir ve çeyrek TOPLAMINA uygulanır.",
              "The quarterly commission rate is set by AVERAGE monthly sales per agent and applied to the quarter's TOTAL.",
            )}
          >
            <T tr="Çeyreklik Oran Merdiveni" en="Quarterly Rate Ladder" />
          </SectionTitle>

          <ol className="flex flex-col gap-1">
            {TEAM_TIER_STEPS.map((step) => (
              <li
                key={step.monthlyAvgEUR}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-control border px-3 py-1.5",
                  step.isCurrent
                    ? "border-brand/45 bg-brand/10"
                    : step.isNext
                      ? "border-brand-secondary/45 bg-brand-secondary/8"
                      : step.reached
                        ? "border-border bg-elevated"
                        : "border-border bg-transparent",
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-pill",
                      step.reached ? "bg-success/20 text-success" : "bg-neutral/15 text-fg-muted",
                    )}
                  >
                    {step.reached ? <Check size={10} /> : null}
                  </span>
                  <span className="font-mono text-[12px] font-semibold text-fg">
                    {formatRatePct(step.ratePct)}
                  </span>
                  <span className="font-body text-[10.5px] text-fg-muted">
                    <T tr="agent başına" en="per agent" />{" "}
                    {formatCurrencyEUR(step.monthlyAvgEUR)}+
                  </span>
                </span>
                {step.isCurrent ? (
                  <span className="shrink-0 rounded-pill bg-brand/15 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-brand">
                    {t("buradasın", "you are here")}
                  </span>
                ) : step.reached ? (
                  <span className="shrink-0 font-body text-[10.5px] text-success">
                    {t("geçildi", "reached")}
                  </span>
                ) : (
                  <span className="shrink-0 font-mono text-[11px] font-semibold text-brand-secondary">
                    +{formatCurrencyEUR(step.gapEUR)}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </Card>

        {/* 3 — Çarpan kademeleri */}
        <Card className="flex flex-col gap-4">
          <SectionTitle
            hint={t(
              `${formatCurrencyEUR(TL_ACHIEVER_THRESHOLD_EUR)} satışı geçen agent sayısı arttıkça çeyreklik komisyonun üzerine eklenen çarpan yükselir.`,
              `The more agents clear ${formatCurrencyEUR(TL_ACHIEVER_THRESHOLD_EUR)} in sales, the higher the multiplier added on top of your quarterly commission.`,
            )}
            aside={
              <span className="shrink-0 rounded-pill bg-violet/12 px-2.5 py-1 font-mono text-[11px] font-semibold text-violet">
                {formatRatePct(TL_COMMISSION.achieverBonusPct)}
              </span>
            }
          >
            <T tr="Çarpan Kademeleri" en="Multiplier Tiers" />
          </SectionTitle>

          <ol className="flex flex-col gap-1">
            {[...TL_ACHIEVER_MULTIPLIERS]
              .sort((a, b) => a.minAgents - b.minAgents)
              .map((tier) => {
                const reached = ACHIEVER_COUNT >= tier.minAgents;
                const isNext = NEXT_ACHIEVER_TIER?.minAgents === tier.minAgents;
                return (
                  <li
                    key={tier.minAgents}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-control border px-3 py-1.5",
                      reached
                        ? "border-brand/45 bg-brand/10"
                        : isNext
                          ? "border-brand-secondary/45 bg-brand-secondary/8"
                          : "border-border bg-transparent",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[12px] font-semibold text-fg">
                        {formatNumber(tier.minAgents)}+
                      </span>
                      <span className="font-body text-[10.5px] text-fg-muted">
                        <T tr="agent eşiği geçerse" en="agents clearing" />
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2.5">
                      <span
                        className={cn(
                          "font-mono text-[12px] font-semibold",
                          reached ? "text-brand" : "text-fg-secondary",
                        )}
                      >
                        {formatRatePct(tier.bonusPct)}
                      </span>
                      {reached ? (
                        <span className="font-body text-[10.5px] text-success">
                          {t("aktif", "active")}
                        </span>
                      ) : (
                        <span className="font-body text-[10px] text-fg-muted">
                          {t(
                            `${formatNumber(tier.minAgents - ACHIEVER_COUNT)} agent daha`,
                            `${formatNumber(tier.minAgents - ACHIEVER_COUNT)} more`,
                          )}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
          </ol>
        </Card>
      </div>
    </div>
  );
}
