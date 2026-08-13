"use client";

import { Target, TrendingUp } from "lucide-react";
import {
  CURRENT_QUARTER,
  MONTHS_ELAPSED_IN_QUARTER,
  QUARTER_PROGRESS,
  QUARTER_TO_DATE_EUR,
} from "@/lib/mock/agent-earnings";
import { formatCurrencyEUR, formatRatePct } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HoverTip } from "@/components/ui/HoverTip";
import { QuarterSlider } from "./QuarterSlider";
import { cn } from "@/lib/utils/cn";

/**
 * QUARTER PERFORMANSI — Dashboard'ın dört ana alanından biri (kullanıcı
 * talebi: sade, minimum scroll).
 *
 * Eski Dashboard bu bilgiyi 207 satırlık QuarterTierLadder ile veriyordu —
 * tüm dilimler tek tek listelendiği için ~500px yer kaplıyordu. Burada aynı
 * kural dört rakam + tek ilerleme çubuğu ile veriliyor; çeyreğin aylık
 * kırılımı ise dergi/slayt deneyimindeki QuarterSlider'da. Merdivenin tamamı
 * "Performansım" sayfasında duruyor.
 *
 * KURAL (commission.ts): ekstra komisyon ORANI çeyreğin AYLIK ORTALAMA
 * satışına göre seçilir, TUTAR ise çeyrek TOPLAMI üzerinden hesaplanır. Bu
 * yüzden ilerleme çubuğu "aylık ortalama" cinsindendir — çeyrek toplamı değil.
 */

/** Üstteki üç büyük rakamdan biri. */
function BigStat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: React.ReactNode;
  value: string;
  hint: string;
  tone?: "default" | "violet" | "brand";
}) {
  return (
    <div className="group relative flex flex-col gap-1 rounded-card border border-border bg-elevated px-4 py-3">
      <span className="font-body text-[10.5px] uppercase tracking-wide text-fg-muted">{label}</span>
      <span
        className={cn(
          "font-mono text-[20px] font-bold leading-none",
          tone === "violet" ? "text-violet" : tone === "brand" ? "text-brand" : "text-fg",
        )}
      >
        {value}
      </span>
      <HoverTip align="right">
        <p className="font-body text-[11px] leading-snug text-fg-secondary">{hint}</p>
      </HoverTip>
    </div>
  );
}

export function QuarterPerformanceCard() {
  const { t } = useLang();
  const q = QUARTER_PROGRESS;

  /**
   * İlerleme çubuğu: mevcut dilim eşiğinden sonraki dilim eşiğine kadar aylık
   * ortalamanın ne kadarını kat ettiğimiz. Hiç dilim yakalanmadıysa taban 0.
   */
  const fromEUR = q.currentBand?.monthlyAvgEUR ?? 0;
  const toEUR = q.nextBand?.monthlyAvgEUR ?? q.monthlyAvgEUR;
  const span = Math.max(1, toEUR - fromEUR);
  const progressPct = q.nextBand
    ? Math.max(0, Math.min(100, ((q.monthlyAvgEUR - fromEUR) / span) * 100))
    : 100;

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle
        hint={t(
          "Çeyreklik ekstra prim oranı, çeyreğin AYLIK ORTALAMA satışına göre seçilir; tutar ise çeyreğin TOPLAM satışı üzerinden hesaplanır. Bu yüzden ilerleme çubuğu aylık ortalama cinsindendir.",
          "The quarterly extra commission rate is set by your quarterly MONTHLY AVERAGE sales, while the amount is calculated on the quarter's TOTAL sales. That is why the progress bar is measured in monthly average.",
        )}
        aside={
          <span className="shrink-0 rounded-pill bg-violet/12 px-2.5 py-1 font-mono text-[11px] font-semibold text-violet">
            {CURRENT_QUARTER}
          </span>
        }
      >
        <T tr="Quarter Performansın" en="Your Quarter Performance" />
      </SectionTitle>

      {/* Aylık ortalama BİLİNÇLİ olarak burada yok: aynı rakam hemen altındaki
          slider başlığında "Çeyrek Ortalaması" olarak gösteriliyor, iki kez
          yazmak ekranı kalabalıklaştırıyordu. Dilim ilerleme çubuğu da o
          ortalama üzerinden ölçülür (bkz. SectionTitle hint). */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <BigStat
          label={<T tr="Çeyrek satışın" en="Quarter sales" />}
          value={formatCurrencyEUR(QUARTER_TO_DATE_EUR)}
          hint={t(
            `Çeyrek başından bugüne tahsilatı alınan satış toplamın (${MONTHS_ELAPSED_IN_QUARTER} ay).`,
            `Your collected sales since the start of the quarter (${MONTHS_ELAPSED_IN_QUARTER} month(s)).`,
          )}
        />
        <BigStat
          label={<T tr="Mevcut dilimin" en="Current tier" />}
          value={formatRatePct(q.currentRatePct)}
          hint={t(
            "Aylık ortalamanın karşılık geldiği ekstra komisyon oranı.",
            "The extra commission rate your monthly average currently qualifies for.",
          )}
          tone="violet"
        />
        <BigStat
          label={<T tr="Çeyreklik ekstra prim" en="Quarterly extra" />}
          value={formatCurrencyEUR(q.extraEUR)}
          hint={t(
            "Mevcut dilim oranının çeyrek TOPLAM satışına uygulanmasıyla bulunan ekstra komisyon.",
            "The extra commission from applying your current tier rate to the quarter's TOTAL sales.",
          )}
          tone="violet"
        />
      </div>

      {/* Sonraki dilime ilerleme */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
            {q.nextBand ? (
              <T
                tr={`${formatRatePct(q.nextBand.ratePct)} dilimine ilerleme`}
                en={`Progress to the ${q.nextBand.ratePct}% tier`}
              />
            ) : (
              <T tr="En üst dilimdesin" en="You are in the top tier" />
            )}
          </span>
          {q.nextBand && (
            <span className="font-mono text-[11px] font-semibold text-brand-secondary">
              {formatCurrencyEUR(q.gapToNextEUR)} · ~{q.gapToNextDeals} deal
            </span>
          )}
        </div>
        <div className="relative h-3 overflow-hidden rounded-pill bg-elevated">
          <div
            className={cn(
              "h-full rounded-pill transition-[width] duration-700 ease-out",
              q.nextBand ? "bg-brand-secondary" : "bg-success",
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="flex items-start gap-2 font-body text-[11.5px] leading-snug text-fg-secondary">
          {q.nextBand ? (
            <>
              <Target size={13} aria-hidden className="mt-0.5 shrink-0 text-brand-secondary" />
              <T
                tr={`Çeyrek sonuna kadar ${formatCurrencyEUR(q.gapToNextEUR)} daha satarsan çeyreklik ekstra primin ${formatCurrencyEUR(q.extraEUR)} yerine ${formatCurrencyEUR(q.nextExtraEUR)} olur.`}
                en={`Selling ${formatCurrencyEUR(q.gapToNextEUR)} more by quarter-end raises your quarterly extra commission from ${formatCurrencyEUR(q.extraEUR)} to ${formatCurrencyEUR(q.nextExtraEUR)}.`}
              />
            </>
          ) : (
            <>
              <TrendingUp size={13} aria-hidden className="mt-0.5 shrink-0 text-success" />
              <T
                tr={`En yüksek dilimdesin — çeyreklik ekstra primin ${formatCurrencyEUR(q.extraEUR)}.`}
                en={`You are in the highest tier — your quarterly extra commission is ${formatCurrencyEUR(q.extraEUR)}.`}
              />
            </>
          )}
        </p>
      </div>

      {/* Çeyreğin ayları — dergi/slayt deneyimi (kullanıcı talebi):
          klasik bar grafiği yerine sağa/sola kaydırılan ay kartları, her
          kartta o ayın kendi hedef barı. Bkz. QuarterSlider. */}
      <QuarterSlider />
    </Card>
  );
}
