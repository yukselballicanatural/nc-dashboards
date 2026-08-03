"use client";

import { Check, Info } from "lucide-react";
import {
  ACHIEVER_COUNT,
  AGENT_COUNT,
  MONTH_TEAM_SALES_EUR,
  NEXT_ACHIEVER_TIER,
  QUARTER_TEAM_SALES_EUR,
  TEAM_QUARTER,
  TEAM_TIER_STEPS,
  TL_COMMISSION,
} from "@/lib/mock/team-earnings";
import {
  TL_ACHIEVER_MULTIPLIERS,
  TL_ACHIEVER_THRESHOLD_EUR,
  TL_MIN_PER_AGENT_EUR,
  TL_MONTHLY_RATE_PCT,
  TL_QUOTA_EUR,
  type QuarterKey,
} from "@/lib/mock/commission";
import { formatCurrencyEUR, formatNumber, formatRatePct } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SidePanel } from "@/components/ui/SidePanel";
import { cn } from "@/lib/utils/cn";

/**
 * TL PRİM DETAY SAYFASI — para bandına tıklanınca sağdan açılan derinlemesine
 * görünüm. Sayfadaki inline tablolar (agent gerçekleşme, çeyreklik merdiven,
 * çarpan kademeleri, sıralama bonusları) "şu an ne durumdayım" sorusuna cevap
 * verir; bu panel kuralın TAM OLARAK nasıl işlediğini ve rakamların adım adım
 * nereden geldiğini gösterir — sayfadakini tekrar etmez.
 */
export interface TeamEarningsDetailDrawerProps {
  open: boolean;
  onClose: () => void;
}

const QUARTER_ORDER: QuarterKey[] = ["Q1", "Q2", "Q3", "Q4"];

export function TeamEarningsDetailDrawer({ open, onClose }: TeamEarningsDetailDrawerProps) {
  const { t } = useLang();
  const c = TL_COMMISSION;

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={<T tr="Prim Detayın" en="Your Commission in Detail" />}
      subtitle={t(
        `${TEAM_QUARTER} · ${formatNumber(AGENT_COUNT)} agent · kota ${formatCurrencyEUR(c.quotaEUR)}`,
        `${TEAM_QUARTER} · ${formatNumber(AGENT_COUNT)} agents · quota ${formatCurrencyEUR(c.quotaEUR)}`,
      )}
    >
      {/* Özet şerit */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t("Aylık Komisyon", "Monthly Commission"), value: formatCurrencyEUR(c.monthlyCommissionEUR) },
          { label: t("Çeyreklik Komisyon", "Quarterly Commission"), value: formatCurrencyEUR(c.quarterlyTotalEUR) },
          { label: t("Agent Başına Ort.", "Avg. Per Agent"), value: formatCurrencyEUR(Math.round(c.perAgentMonthlyAvgEUR)) },
          { label: t("Eşiği Geçen Agent", "Agents Over Threshold"), value: `${formatNumber(ACHIEVER_COUNT)}/${formatNumber(AGENT_COUNT)}` },
        ].map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5 rounded-control border border-border bg-surface px-3 py-2.5">
            <span className="font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
              {item.label}
            </span>
            <span className="font-mono text-[15px] font-bold text-fg">{item.value}</span>
          </div>
        ))}
      </div>

      {/* 1 — Kota referansı (4 çeyrek) */}
      <Card className="flex flex-col gap-3">
        <SectionTitle
          hint={t(
            "Takım kotası çeyreğe göre değişir — Q1/Q2/Q3'te 150.000 €, Q4'te 145.000 €. Kota TAKIM TOPLAMI üzerindendir, kota üstü satışın tamamına %2 aylık komisyon uygulanır.",
            "Team quota varies by quarter — 150,000 € for Q1/Q2/Q3, 145,000 € for Q4. The quota applies to the TEAM TOTAL; the entire amount over quota earns 2% monthly commission.",
          )}
        >
          <T tr="Çeyreklik Kota Referansı" en="Quarterly Quota Reference" />
        </SectionTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUARTER_ORDER.map((quarter) => (
            <div
              key={quarter}
              className={cn(
                "flex flex-col gap-0.5 rounded-control border px-3 py-2",
                quarter === TEAM_QUARTER ? "border-brand/40 bg-brand/8" : "border-border bg-surface",
              )}
            >
              <span className="flex items-center justify-between font-body text-[10.5px] font-semibold text-fg-muted">
                {quarter}
                {quarter === TEAM_QUARTER && (
                  <span className="rounded-pill bg-brand/15 px-1.5 py-0.5 font-body text-[9px] font-semibold uppercase text-brand">
                    {t("aktif", "active")}
                  </span>
                )}
              </span>
              <span className="font-mono text-[13px] font-semibold text-fg">
                {formatCurrencyEUR(TL_QUOTA_EUR[quarter])}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* 2 — Aylık komisyon hesap adımları */}
      <Card className="flex flex-col gap-3">
        <SectionTitle>
          <T tr="Aylık Komisyon Nasıl Hesaplanıyor?" en="How Is the Monthly Commission Calculated?" />
        </SectionTitle>
        <ol className="flex flex-col gap-2">
          {[
            {
              step: t("Bu ay takım satışı", "Team sales this month"),
              value: formatCurrencyEUR(MONTH_TEAM_SALES_EUR),
            },
            {
              step: t(`${TEAM_QUARTER} kotası (çıkarılır)`, `${TEAM_QUARTER} quota (subtracted)`),
              value: `− ${formatCurrencyEUR(c.quotaEUR)}`,
            },
            {
              step: t("Kota üstü satış", "Sales over quota"),
              value: formatCurrencyEUR(c.overQuotaEUR),
              emphasis: true,
            },
            {
              step: t(`× aylık oran (%${TL_MONTHLY_RATE_PCT})`, `× monthly rate (${TL_MONTHLY_RATE_PCT}%)`),
              value: `= ${formatCurrencyEUR(c.monthlyCommissionEUR)}`,
              emphasis: true,
            },
          ].map((row, i) => (
            <li
              key={row.step}
              className={cn(
                "flex items-center justify-between gap-3 rounded-control border px-3 py-2",
                row.emphasis ? "border-brand/35 bg-brand/8" : "border-border bg-surface",
              )}
            >
              <span className="flex items-center gap-2 font-body text-[11.5px] text-fg">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-pill bg-neutral/15 font-mono text-[10px] font-bold text-fg-muted">
                  {i + 1}
                </span>
                {row.step}
              </span>
              <span className="shrink-0 font-mono text-[12.5px] font-semibold text-fg">{row.value}</span>
            </li>
          ))}
        </ol>
        {!c.conditionMet && (
          <div className="flex items-start gap-2.5 rounded-control border border-critical/35 bg-critical/8 px-3 py-2.5">
            <Info size={14} aria-hidden className="mt-0.5 shrink-0 text-critical" />
            <p className="font-body text-[11px] leading-relaxed text-fg-secondary">
              <T
                tr={`Bu hesap yalnızca ön koşul sağlanırsa geçerlidir: agent başına aylık ortalama en az ${formatCurrencyEUR(TL_MIN_PER_AGENT_EUR)}. Şu an sağlanmıyor, komisyon 0 € gösteriliyor.`}
                en={`This calculation only applies if the condition is met: at least ${formatCurrencyEUR(TL_MIN_PER_AGENT_EUR)} average per agent per month. It currently isn't, so commission shows as 0 €.`}
              />
            </p>
          </div>
        )}
      </Card>

      {/* 3 — Çeyreklik oran merdiveni (agent başına ortalama) */}
      <Card className="flex flex-col gap-3">
        <SectionTitle
          hint={t(
            "Oran, agent başına aylık ORTALAMA satışa göre seçilir; tutar ise çeyrek TOPLAMINA uygulanır.",
            "The rate is set by AVERAGE monthly sales per agent; the amount is then applied to the quarter's TOTAL.",
          )}
        >
          <T tr="Çeyreklik Oran Merdiveni — Tam Görünüm" en="Quarterly Rate Ladder — Full View" />
        </SectionTitle>
        <div className="flex flex-col gap-1.5">
          <p className="font-body text-[11.5px] text-fg-secondary">
            <T tr="Çeyrek toplamı" en="Quarter total" />:{" "}
            <span className="font-mono font-semibold text-fg">{formatCurrencyEUR(QUARTER_TEAM_SALES_EUR)}</span>
            {" · "}
            <T tr="agent başına ortalama" en="average per agent" />:{" "}
            <span className="font-mono font-semibold text-fg">
              {formatCurrencyEUR(Math.round(c.perAgentMonthlyAvgEUR))}
            </span>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse">
              <tbody>
                {TEAM_TIER_STEPS.map((step) => (
                  <tr key={step.monthlyAvgEUR} className={cn("border-b border-border last:border-0", step.isCurrent && "bg-brand/8")}>
                    <td className="px-2.5 py-1.5 text-left">
                      <span className="inline-flex items-center gap-1.5">
                        {step.reached && <Check size={11} className="text-success" aria-hidden />}
                        <span className="font-mono text-[11.5px] text-fg-secondary">
                          {formatCurrencyEUR(step.monthlyAvgEUR)}+
                        </span>
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-mono text-[12px] font-semibold text-fg">
                      {formatRatePct(step.ratePct)}
                    </td>
                    <td className="px-2.5 py-1.5 text-right">
                      {step.isCurrent && (
                        <span className="rounded-pill bg-brand/15 px-2 py-0.5 font-body text-[9.5px] font-semibold uppercase text-brand">
                          {t("buradasın", "here")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* 4 — Çarpan kademesi hesap adımları */}
      <Card className="flex flex-col gap-3">
        <SectionTitle>
          <T tr="Çarpan Nasıl Ekleniyor?" en="How Is the Multiplier Added?" />
        </SectionTitle>
        <ol className="flex flex-col gap-2">
          {[
            {
              step: t(`${formatCurrencyEUR(TL_ACHIEVER_THRESHOLD_EUR)} eşiğini geçen agent`, `Agents clearing ${formatCurrencyEUR(TL_ACHIEVER_THRESHOLD_EUR)}`),
              value: `${formatNumber(ACHIEVER_COUNT)}/${formatNumber(AGENT_COUNT)}`,
            },
            {
              step: t("Karşılık gelen çarpan", "Corresponding multiplier"),
              value: formatRatePct(c.achieverBonusPct),
              emphasis: true,
            },
            {
              step: t("Çeyreklik komisyon (çarpansız)", "Quarterly commission (before multiplier)"),
              value: formatCurrencyEUR(c.quarterlyCommissionEUR),
            },
            {
              step: t("+ çarpan bonusu", "+ multiplier bonus"),
              value: `+ ${formatCurrencyEUR(c.achieverBonusEUR)}`,
              emphasis: true,
            },
            {
              step: t("Toplam çeyreklik komisyon", "Total quarterly commission"),
              value: formatCurrencyEUR(c.quarterlyTotalEUR),
              emphasis: true,
            },
          ].map((row, i) => (
            <li
              key={row.step}
              className={cn(
                "flex items-center justify-between gap-3 rounded-control border px-3 py-2",
                row.emphasis ? "border-violet/35 bg-violet/8" : "border-border bg-surface",
              )}
            >
              <span className="flex items-center gap-2 font-body text-[11.5px] text-fg">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-pill bg-neutral/15 font-mono text-[10px] font-bold text-fg-muted">
                  {i + 1}
                </span>
                {row.step}
              </span>
              <span className="shrink-0 font-mono text-[12.5px] font-semibold text-fg">{row.value}</span>
            </li>
          ))}
        </ol>
        <div className="grid grid-cols-3 gap-2">
          {[...TL_ACHIEVER_MULTIPLIERS]
            .sort((a, b) => a.minAgents - b.minAgents)
            .map((tier) => (
              <div
                key={tier.minAgents}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-control border px-2 py-2",
                  ACHIEVER_COUNT >= tier.minAgents ? "border-brand/40 bg-brand/8" : "border-border bg-surface",
                )}
              >
                <span className="font-mono text-[12px] font-bold text-fg">{formatNumber(tier.minAgents)}+</span>
                <span className="font-mono text-[11px] text-fg-secondary">{formatRatePct(tier.bonusPct)}</span>
              </div>
            ))}
        </div>
        {NEXT_ACHIEVER_TIER && (
          <div className="flex items-start gap-2.5 rounded-control border border-brand-secondary/35 bg-brand-secondary/10 px-3 py-2.5">
            <Info size={14} aria-hidden className="mt-0.5 shrink-0 text-brand-secondary" />
            <p className="font-body text-[11px] leading-relaxed text-fg-secondary">
              <T
                tr={`${formatNumber(NEXT_ACHIEVER_TIER.agentsNeeded)} agent daha eşiği geçerse çarpanın ${formatRatePct(NEXT_ACHIEVER_TIER.bonusPct)} olur.`}
                en={`If ${formatNumber(NEXT_ACHIEVER_TIER.agentsNeeded)} more agents clear the threshold, your multiplier becomes ${formatRatePct(NEXT_ACHIEVER_TIER.bonusPct)}.`}
              />
            </p>
          </div>
        )}
      </Card>
    </SidePanel>
  );
}
