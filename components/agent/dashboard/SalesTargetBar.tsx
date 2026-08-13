"use client";

import { Flag, Target, TrendingUp } from "lucide-react";
import {
  salesTargetProgress,
  TARGET_STEP_EUR,
  type SalesTargetProgress,
} from "@/lib/mock/commission";
import { AGENT_REGION, MONTH_TO_DATE } from "@/lib/mock/agent-earnings";
import { formatCurrencyEUR, formatPercent, formatRatePct } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HoverTip } from "@/components/ui/HoverTip";
import { cn } from "@/lib/utils/cn";

/**
 * DİNAMİK SATIŞ HEDEF BARI (kullanıcı talebi).
 *
 * Hedef MANUEL SEÇİLMEZ; agent'ın aylık satışına göre otomatik hesaplanır ve
 * satış bir üst seviyeyi geçtiği anda bar kendiliğinden yeni hedefe döner.
 * Kural ve merdiven `salesTargetProgress` içinde (lib/mock/commission.ts):
 * 12.500 → 15.000 → sonra 5.000'lik adımlar. Sayılar orada komisyon
 * bantlarından türetilir, burada sabit yazılmaz.
 *
 * Ölçüt AYLIK satıştır (ödemesi alınan deal toplamı) — 12.500 ve 15.000
 * eşikleri aylık komisyon bantlarının eşikleridir, bu yüzden hedef de aynı
 * dönemle ölçülmelidir.
 */

/** Merdivende gösterilecek seviye sayısı (mevcut hedef ortada kalacak şekilde). */
const LADDER_VISIBLE = 4;

/** Mevcut hedefin çevresindeki seviyeleri üretir — "hedefler 5.000 artıyor" görünür olsun. */
function ladderAround(progress: SalesTargetProgress, region: typeof AGENT_REGION): number[] {
  const levels: number[] = [];
  // Seviye 1 ve 2'yi sabit eşiklerden, sonrasını adımlarla üret.
  const first = salesTargetProgress(0, region).targetEUR;
  const second = salesTargetProgress(first, region).targetEUR;
  const all = [first, second];
  while (all.length < progress.level + LADDER_VISIBLE) {
    all.push(all[all.length - 1] + TARGET_STEP_EUR);
  }
  // Mevcut hedefi merkeze alan bir pencere seç.
  const currentIndex = all.indexOf(progress.targetEUR);
  const start = Math.max(0, currentIndex - 1);
  for (let i = start; i < start + LADDER_VISIBLE && i < all.length; i++) {
    levels.push(all[i]);
  }
  return levels;
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: React.ReactNode;
  value: string;
  tone?: "default" | "brand" | "secondary" | "success";
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-body text-[10.5px] uppercase tracking-wide text-fg-muted">{label}</span>
      <span
        className={cn(
          "font-mono text-[16px] font-bold leading-none",
          tone === "brand"
            ? "text-brand"
            : tone === "secondary"
              ? "text-brand-secondary"
              : tone === "success"
                ? "text-success"
                : "text-fg",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function SalesTargetBar() {
  const { t } = useLang();
  const progress = salesTargetProgress(MONTH_TO_DATE.salesEUR, AGENT_REGION);
  const { currentEUR, targetEUR, remainingEUR, progressPct, previousTargetEUR, unlocksRatePct } =
    progress;

  const reached = remainingEUR === 0;
  const fillPct = Math.min(100, progressPct);
  // Bir alt eşiğin bardaki yeri — "bu seviyeye nereden geldim" işareti.
  const prevMarkerPct = targetEUR > 0 ? (previousTargetEUR / targetEUR) * 100 : 0;
  const ladder = ladderAround(progress, AGENT_REGION);

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle
        hint={t(
          `Hedef otomatik belirlenir, elle seçilmez: ${formatCurrencyEUR(12_500)} geçilince hedef ${formatCurrencyEUR(15_000)}, ${formatCurrencyEUR(15_000)} geçilince ${formatCurrencyEUR(20_000)} olur ve sonrasında ${formatCurrencyEUR(TARGET_STEP_EUR)}'lik adımlarla artar. Yüzde = mevcut satış ÷ hedef.`,
          `The target is set automatically, never chosen by hand: passing ${formatCurrencyEUR(12_500)} makes the target ${formatCurrencyEUR(15_000)}, passing ${formatCurrencyEUR(15_000)} makes it ${formatCurrencyEUR(20_000)}, and it then grows in ${formatCurrencyEUR(TARGET_STEP_EUR)} steps. The percentage is current sales ÷ target.`,
        )}
        aside={
          <span
            className={cn(
              "shrink-0 rounded-pill px-2.5 py-1 font-mono text-[11px] font-semibold",
              reached ? "bg-success/14 text-success" : "bg-brand-secondary/14 text-brand-secondary",
            )}
          >
            {t(`Seviye ${progress.level}`, `Level ${progress.level}`)}
          </span>
        }
      >
        <T tr="Satış Hedefin" en="Your Sales Target" />
      </SectionTitle>

      {/* Ana satır: mevcut / hedef + yüzde */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <span className="flex items-baseline gap-1.5">
          <span className="font-mono text-[28px] font-bold leading-none text-fg">
            {formatCurrencyEUR(currentEUR)}
          </span>
          <span className="font-mono text-[18px] font-semibold leading-none text-fg-muted">
            / {formatCurrencyEUR(targetEUR)}
          </span>
        </span>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-mono text-[13px] font-bold",
            reached ? "bg-success/14 text-success" : "bg-brand/12 text-brand",
          )}
        >
          {reached ? <Flag size={13} aria-hidden /> : <TrendingUp size={13} aria-hidden />}
          {formatPercent(progressPct)}
        </span>
      </div>

      {/* Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="relative h-4 overflow-hidden rounded-pill bg-elevated">
          <div
            className={cn(
              "h-full rounded-pill transition-[width] duration-700 ease-out",
              reached ? "bg-success" : "bg-brand",
            )}
            style={{ width: `${fillPct}%` }}
          />
          {/* Bir alt eşik işareti — z-10: dolgu geçince çizgi kaybolmasın. */}
          {previousTargetEUR > 0 && (
            <span
              aria-hidden
              className="absolute inset-y-0 z-10 w-px bg-fg/45"
              style={{ left: `${prevMarkerPct}%` }}
            />
          )}
        </div>
        <div className="flex items-center justify-between font-mono text-[10px] text-fg-muted">
          <span>{previousTargetEUR > 0 ? formatCurrencyEUR(previousTargetEUR) : formatCurrencyEUR(0)}</span>
          <span>{formatCurrencyEUR(targetEUR)}</span>
        </div>
      </div>

      {/* Rakamlar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          label={<T tr="Mevcut satış" en="Current sales" />}
          value={formatCurrencyEUR(currentEUR)}
        />
        <Metric
          label={<T tr="Bir sonraki hedef" en="Next target" />}
          value={formatCurrencyEUR(targetEUR)}
          tone="secondary"
        />
        <Metric
          label={<T tr="Hedefe kalan" en="Remaining" />}
          value={reached ? t("tamamlandı", "reached") : formatCurrencyEUR(remainingEUR)}
          tone={reached ? "success" : "default"}
        />
        <Metric
          label={<T tr="Gerçekleşme" en="Progress" />}
          value={formatPercent(progressPct)}
          tone="brand"
        />
      </div>

      {/* Merdiven — hedeflerin nasıl ilerlediği görünür olsun */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-body text-[10px] uppercase tracking-wide text-fg-muted">
          <T tr="Hedef merdiveni" en="Target ladder" />
        </span>
        {ladder.map((level) => {
          const isCurrent = level === targetEUR;
          const isPassed = currentEUR >= level;
          return (
            <span
              key={level}
              className={cn(
                "rounded-pill border px-2 py-0.5 font-mono text-[10.5px] font-semibold",
                isCurrent
                  ? "border-brand/45 bg-brand/12 text-brand"
                  : isPassed
                    ? "border-success/35 bg-success/10 text-success"
                    : "border-border bg-transparent text-fg-muted",
              )}
            >
              {formatCurrencyEUR(level)}
            </span>
          );
        })}
        <span className="font-body text-[10px] text-fg-muted">
          <T
            tr={`· sonrası ${formatCurrencyEUR(TARGET_STEP_EUR)}'lik adımlarla`}
            en={`· then in ${formatCurrencyEUR(TARGET_STEP_EUR)} steps`}
          />
        </span>
      </div>

      {/* Açıklama satırı */}
      <p className="flex items-start gap-2 font-body text-[11.5px] leading-snug text-fg-secondary">
        <Target size={13} aria-hidden className="mt-0.5 shrink-0 text-brand-secondary" />
        {reached ? (
          <T
            tr={`Hedefi tamamladın — satış ${formatCurrencyEUR(targetEUR)} seviyesine ulaştı, bar bir üst hedefe geçiyor.`}
            en={`Target reached — sales hit ${formatCurrencyEUR(targetEUR)}, so the bar moves to the next level.`}
          />
        ) : unlocksRatePct !== null ? (
          <T
            tr={`${formatCurrencyEUR(remainingEUR)} daha satarsan hedefi tamamlarsın ve aylık komisyon oranın ${formatRatePct(unlocksRatePct)} olur. Hedef otomatik güncellenir; elle seçim yoktur.`}
            en={`Selling ${formatCurrencyEUR(remainingEUR)} more completes this target and moves your monthly commission rate to ${formatRatePct(unlocksRatePct)}. The target updates automatically — there is no manual selection.`}
          />
        ) : (
          <T
            tr={`${formatCurrencyEUR(remainingEUR)} daha satarsan bir sonraki hedefe geçersin. En yüksek komisyon bandındasın, bu yüzden bu hedefler oranı değiştirmez — satış hacmini büyütmek için.`}
            en={`Selling ${formatCurrencyEUR(remainingEUR)} more moves you to the next target. You are already in the top commission band, so these targets do not change your rate — they track sales volume.`}
          />
        )}
      </p>

      {/* Ay içinde tempo bilgisi — hedefin ay sonunda tutup tutmayacağı */}
      {MONTH_TO_DATE.forecastSalesEUR > 0 && (
        <p className="font-body text-[11px] text-fg-muted">
          <T
            tr={`Mevcut tempoyla ay sonu tahmini ${formatCurrencyEUR(MONTH_TO_DATE.forecastSalesEUR)} — ${
              MONTH_TO_DATE.forecastSalesEUR >= targetEUR
                ? "bu hedefi tutuyor."
                : "bu hedefin altında kalıyor."
            }`}
            en={`At your current pace the month-end projection is ${formatCurrencyEUR(MONTH_TO_DATE.forecastSalesEUR)} — ${
              MONTH_TO_DATE.forecastSalesEUR >= targetEUR
                ? "which meets this target."
                : "which falls short of this target."
            }`}
          />
        </p>
      )}

      {/* Ayın henüz veri üretmediği durum için yönlendirici boş durum metni
          (CLAUDE.md 7) — bar sessizce sıfırda durmasın. */}
      {currentEUR === 0 && (
        <p className="font-body text-[11px] text-fg-muted">
          <T
            tr={`Bu ay henüz ödemesi alınan satışın yok; ilk hedefin ${formatCurrencyEUR(targetEUR)}. İlk tahsilat düştüğü anda bar dolmaya başlar.`}
            en={`You have no collected sales yet this month; your first target is ${formatCurrencyEUR(targetEUR)}. The bar starts filling as soon as the first payment lands.`}
          />
        </p>
      )}
    </Card>
  );
}
