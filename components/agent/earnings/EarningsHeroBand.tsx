"use client";

import { useState } from "react";
import { ArrowUpRight, Banknote, CalendarDays, ChevronRight, Clock, Info, MapPin, TrendingUp, Trophy, Users } from "lucide-react";
import {
  CURRENT_QUARTER,
  MONTH_TO_DATE,
  QUARTER_PROGRESS,
  TODAY_EARNINGS,
  YEAR_PROJECTION,
} from "@/lib/mock/agent-earnings";
import { AGENT_PROFILE, mockDateLabel } from "@/lib/mock/mock-data";
import { useIdentity } from "@/lib/data/session-store";
import { formatCurrencyEUR, formatNumber, formatRatePct } from "@/lib/utils/format";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { cn } from "@/lib/utils/cn";
import { EarningsDetailDrawer } from "./EarningsDetailDrawer";

/**
 * PARA BANDI — Agent ekranının en üstündeki "imza an" (CLAUDE.md 3.4 sonu:
 * tek yerde cesur ol). Agent'ın en çok önemsediği şey burada, en büyük
 * puntoyla: şu ana kadar biriken prim.
 *
 * Neden ana rakam "bu ay biriken prim"?
 * Komisyon oranı AYLIK toplam satışın fonksiyonudur (basamaklı) — dolayısıyla
 * tek bir günün primi ancak "o gün primi ne kadar arttırdı" olarak anlamlıdır.
 * Bu yüzden büyük rakam birikmiş (anlık) primdir; günün katkısı yanında delta
 * çipi olarak durur.
 *
 * NOT (kimlik satırı): Bu bant tek başına sayfanın "hero"su — eskiden ayrı
 * bir karşılama bandı (HeroHeader) bunun altında tekrar duruyordu, iki büyük
 * renkli blok üst üste "iki hero" gibi görünüyordu. Kimlik artık burada, para
 * rakamının ÜZERİNDE ince bir satır — tek bant, tek görsel odak.
 */

function Chip({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5 rounded-pill bg-white/12 px-2.5 py-1 font-body text-[11px] font-medium text-white/85">
      <Icon size={11} aria-hidden />
      {children}
    </span>
  );
}

function DeltaChip() {
  const { t } = useLang();
  const positive = TODAY_EARNINGS.commissionEUR > 0;

  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-pill px-3 py-1.5 font-body text-[12px] font-semibold",
        positive ? "bg-white/20 text-white" : "bg-white/10 text-white/70",
      )}
    >
      {positive && <ArrowUpRight size={13} aria-hidden />}
      {positive
        ? t(
            `bugün +${formatCurrencyEUR(TODAY_EARNINGS.commissionEUR)}`,
            `today +${formatCurrencyEUR(TODAY_EARNINGS.commissionEUR)}`,
          )
        : t("bugün henüz tahsilat kapanmadı", "no payment closed yet today")}
    </span>
  );
}

/** Cam efektli yardımcı istatistik kutusu. */
function MoneyTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="hero-tile flex min-w-[150px] flex-1 flex-col gap-1 rounded-card px-4 py-3">
      <span className="flex items-center gap-1.5 font-body text-[11px] font-medium text-white/70">
        <Icon size={12} aria-hidden />
        {label}
      </span>
      <span className="font-mono text-[19px] font-semibold leading-none text-white">
        {value}
      </span>
      <span className="font-body text-[10.5px] leading-snug text-white/60">{sub}</span>
    </div>
  );
}

/**
 * Gradient zemin inline verilir — HeroHeader ile aynı gerekçe: CSS sınıfı
 * yüklenmese bile koyu zemin garanti, beyaz metin her iki temada AA.
 * Para bandı marka yeşilini öne alır (HeroHeader'dan görsel olarak ayrışsın).
 */
const MONEY_BG: React.CSSProperties = {
  backgroundColor: "#0b5f52",
  backgroundImage: [
    "radial-gradient(110% 150% at 92% -20%, rgba(245,166,35,0.45) 0%, transparent 58%)",
    "radial-gradient(95% 130% at 5% 120%, rgba(21,214,174,0.45) 0%, transparent 55%)",
    "linear-gradient(115deg, #0a7d63 0%, #0b5f52 48%, #123a52 100%)",
  ].join(", "),
};

export function EarningsHeroBand() {
  const { t, lang } = useLang();
  const identity = useIdentity(AGENT_PROFILE);
  const firstName = identity.name.split(" ")[0];
  const animated = useCountUp(MONTH_TO_DATE.commissionEUR);
  const q = QUARTER_PROGRESS;
  const [detailOpen, setDetailOpen] = useState(false);

  // Dilim merdiveninde ilerleme: mevcut dilimden sonraki dilime ne kadar kaldı.
  const currentThreshold = q.currentBand?.monthlyAvgEUR ?? 0;
  const nextThreshold = q.nextBand?.monthlyAvgEUR ?? q.monthlyAvgEUR;
  const span = Math.max(1, nextThreshold - currentThreshold);
  const tierProgressPct = q.nextBand
    ? Math.min(100, Math.max(0, ((q.monthlyAvgEUR - currentThreshold) / span) * 100))
    : 100;

  return (
    <>
    <section
      style={MONEY_BG}
      role="button"
      tabIndex={0}
      onClick={() => setDetailOpen(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setDetailOpen(true);
        }
      }}
      aria-label={t(
        "Prim ve kazanç özeti — detaylı görünümü açmak için tıkla",
        "Commission and earnings summary — click to open the detailed view",
      )}
      className="group relative cursor-pointer overflow-hidden rounded-card px-6 py-6 shadow-elevated outline-none transition-shadow duration-150 hover:shadow-[0_22px_52px_rgba(11,95,82,0.32)] focus-visible:ring-2 focus-visible:ring-white/60 sm:px-8 sm:py-7"
    >
      {/* Kimlik satırı — ince, para rakamının üstünde tek bir çizgi */}
      <div className="relative mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/12 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-[16px] font-bold leading-none text-white">
            <T tr={`Merhaba, ${firstName}`} en={`Hello, ${firstName}`} />
          </h1>
          <span className="flex items-center gap-1.5 font-body text-[11.5px] text-white/60">
            <CalendarDays size={12} aria-hidden />
            {mockDateLabel(lang)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-pill bg-white/20 px-2.5 py-1 font-body text-[10.5px] font-semibold text-white">
            {identity.role}
          </span>
          <Chip icon={Users}>{identity.team}</Chip>
          <Chip icon={MapPin}>{identity.location}</Chip>
          <Chip icon={Clock}>
            <T tr="09:00–18:00 vardiya" en="09:00–18:00 shift" />
          </Chip>
        </div>
      </div>

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Sol: ana rakam */}
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2 font-body text-[11.5px] font-semibold uppercase tracking-wide text-white/70">
            <Banknote size={14} aria-hidden />
            <T tr="Bu Ay Biriken Primin" en="Your Commission Accrued This Month" />
            <span
              className="flex cursor-help items-center text-white/55"
              title={t(
                "Aylık komisyon oranı, ayın toplam satışına göre basamaklı belirlenir. Bu rakam ay başından bugüne tahsil edilen satışın karşılığıdır.",
                "The monthly commission rate is tiered by your total sales for the month. This figure reflects sales collected from the start of the month to today.",
              )}
            >
              <Info size={13} aria-hidden />
            </span>
          </span>

          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <span className="font-mono text-[46px] font-bold leading-none text-white sm:text-[56px]">
              {formatCurrencyEUR(animated)}
            </span>
            <DeltaChip />
          </div>

          <p className="font-body text-[12.5px] text-white/75">
            <T tr="Aylık oran" en="Monthly rate" />{" "}
            <span className="font-mono font-semibold text-white">
              {formatRatePct(MONTH_TO_DATE.ratePct)}
            </span>{" "}
            ·{" "}
            <span className="font-mono font-semibold text-white">
              {formatCurrencyEUR(MONTH_TO_DATE.salesEUR)}
            </span>{" "}
            <T tr="tahsil edilen satış" en="collected sales" /> ·{" "}
            <span className="font-mono font-semibold text-white">
              {formatNumber(MONTH_TO_DATE.deals)}
            </span>{" "}
            <T tr="deal" en="deals" />
          </p>

          {/* Çeyrek dilimi motivasyon şeridi */}
          <div className="mt-1 flex max-w-[440px] flex-col gap-1.5">
            <div className="flex items-center justify-between font-body text-[11px] text-white/70">
              <span>
                {CURRENT_QUARTER} ·{" "}
                <T tr="çeyrek dilimin" en="your quarterly tier" />{" "}
                <span className="font-mono font-semibold text-white">
                  {formatRatePct(q.currentRatePct)}
                </span>
              </span>
              {q.nextBand && (
                <span className="font-mono">
                  {formatRatePct(q.nextBand.ratePct)}
                </span>
              )}
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-pill bg-white/15"
              role="progressbar"
              aria-valuenow={Math.round(tierProgressPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t("Sonraki prim dilimine ilerleme", "Progress to next commission tier")}
            >
              <div
                className="h-full rounded-pill bg-brand-secondary transition-[width] duration-500 ease-out"
                style={{ width: `${tierProgressPct}%` }}
              />
            </div>
            <p className="font-body text-[11.5px] leading-snug text-white/80">
              {q.nextBand ? (
                <T
                  tr={`${formatRatePct(q.currentRatePct)} dilimindesin — ${formatRatePct(q.nextBand.ratePct)} dilimine geçmek için ${formatCurrencyEUR(q.gapToNextEUR)} (≈${q.gapToNextDeals} deal) daha gerekiyor.`}
                  en={`You're in the ${q.currentRatePct}% tier — ${formatCurrencyEUR(q.gapToNextEUR)} (≈${q.gapToNextDeals} deals) more to reach the ${q.nextBand.ratePct}% tier.`}
                />
              ) : (
                <T
                  tr="En üst çeyrek prim dilimindesin — tebrikler."
                  en="You're in the top quarterly commission tier — congratulations."
                />
              )}
            </p>
          </div>
        </div>

        {/* Sağ: yardımcı para kutuları */}
        <div className="flex flex-wrap gap-3 lg:max-w-[340px]">
          <MoneyTile
            icon={TrendingUp}
            label={t("Tahmini Ay Sonu", "Projected Month-End")}
            value={formatCurrencyEUR(MONTH_TO_DATE.forecastCommissionEUR)}
            sub={t(
              `${formatCurrencyEUR(MONTH_TO_DATE.forecastSalesEUR)} satış temposuyla`,
              `at a ${formatCurrencyEUR(MONTH_TO_DATE.forecastSalesEUR)} sales pace`,
            )}
          />
          <MoneyTile
            icon={Trophy}
            label={t(`${CURRENT_QUARTER} Ekstra Prim`, `${CURRENT_QUARTER} Extra Commission`)}
            value={formatCurrencyEUR(QUARTER_PROGRESS.extraEUR)}
            sub={t(
              `çeyrek toplamı × ${formatRatePct(QUARTER_PROGRESS.currentRatePct)}`,
              `quarter total × ${QUARTER_PROGRESS.currentRatePct}%`,
            )}
          />
          <MoneyTile
            icon={Info}
            label={t(`${YEAR_PROJECTION.year} Yıl Sonu Tahmini`, `${YEAR_PROJECTION.year} Year-End Estimate`)}
            value={formatCurrencyEUR(YEAR_PROJECTION.totalEUR)}
            sub={t(
              `${formatCurrencyEUR(YEAR_PROJECTION.earnedTotalEUR)} kesinleşti · ${formatCurrencyEUR(YEAR_PROJECTION.remainingTotalEUR)} projeksiyon`,
              `${formatCurrencyEUR(YEAR_PROJECTION.earnedTotalEUR)} settled · ${formatCurrencyEUR(YEAR_PROJECTION.remainingTotalEUR)} projected`,
            )}
          />
        </div>
      </div>

      {/* Notion-tarzı "sayfa aç" ipucu — kartın her yeri tıklanabilir, bu sadece görünürlük için */}
      <span className="relative mt-5 flex items-center justify-end gap-1 font-body text-[11.5px] font-semibold text-white/70 transition-colors group-hover:text-white">
        <T tr="Tüm prim detayların" en="Your full commission detail" />
        <ChevronRight size={14} aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5" />
      </span>
    </section>

    <EarningsDetailDrawer open={detailOpen} onClose={() => setDetailOpen(false)} />
    </>
  );
}
