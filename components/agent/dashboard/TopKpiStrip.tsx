"use client";

import { Banknote, CalendarDays, Clock, MapPin, Target, Trophy, Users } from "lucide-react";
import {
  AGENT_REGION,
  MONTH_TO_DATE,
  QUARTER_PROGRESS,
  CURRENT_QUARTER,
} from "@/lib/mock/agent-earnings";
import { AGENT_PROFILE, mockDateLabel } from "@/lib/mock/mock-data";
import { salesTargetProgress } from "@/lib/mock/commission";
import { useIdentity } from "@/lib/data/session-store";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { formatCurrencyEUR, formatNumber, formatPercent, formatRatePct } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { HoverTip } from "@/components/ui/HoverTip";
import { cn } from "@/lib/utils/cn";

/**
 * DASHBOARD ÜST ALANI — Current Sales · Current Target · Prim Status
 * (kullanıcı talebi: istenen ekran hiyerarşisinin en üst bandı).
 *
 * Neden yeni bir bileşen: eski üst alan 345px'lik gradient prim bandı +
 * 250px'lik hedef barından oluşuyordu (~600px) ve ilk ekranda yalnızca prim
 * görünüyordu. Bu şerit aynı üç bilgiyi ~190px'e sığdırır, böylece Quarter
 * slider da ilk ekrana girer. Gradient bandın tamamı "Performansım"
 * sayfasında duruyor (detay drawer'ı ile birlikte).
 *
 * DÖNEM NOTU: Bu üç değer AYLIK/ÇEYREKLİK sabit dönemlerdir ve üstteki tarih
 * filtresinden ETKİLENMEZ — funnel ve arama kartları etkilenir. Belirsizlik
 * olmasın diye her kartın üstünde dönemi yazılı ("bu ay", "Q4").
 *
 * GÖRSEL HİYERARŞİ: tek vurgu rengi kart başına (satış nötr, hedef marka
 * yeşili, prim menekşe), ana rakam 26px mono, ikincil bilgi 11px gövde.
 */

/** Kart üstü dönem etiketi — filtreden bağımsız olduğunu belirtir. */
function PeriodTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-pill bg-neutral/12 px-2 py-0.5 font-body text-[9.5px] font-semibold uppercase tracking-wide text-fg-muted">
      {children}
    </span>
  );
}

function KpiShell({
  icon: Icon,
  title,
  periodTag,
  tone,
  children,
  hint,
}: {
  icon: typeof Banknote;
  title: React.ReactNode;
  periodTag: React.ReactNode;
  tone: "neutral" | "brand" | "violet";
  children: React.ReactNode;
  hint: string;
}) {
  const TONE = {
    neutral: "bg-indigo/12 text-indigo",
    brand: "bg-brand/12 text-brand",
    violet: "bg-violet/12 text-violet",
  } as const;

  return (
    <Card className="group relative flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-control", TONE[tone])}
          >
            <Icon size={14} />
          </span>
          <span className="truncate font-display text-[12.5px] font-semibold uppercase tracking-wide text-fg-secondary">
            {title}
          </span>
        </span>
        <PeriodTag>{periodTag}</PeriodTag>
      </div>
      {children}
      <HoverTip align="right">
        <p className="font-body text-[11px] leading-snug text-fg-secondary">{hint}</p>
      </HoverTip>
    </Card>
  );
}

/** İnce karşılama satırı — "Merhaba" kararı korunur, yer kaplamaz. */
function GreetingLine() {
  const { lang } = useLang();
  const identity = useIdentity(AGENT_PROFILE);
  const firstName = identity.name.split(" ")[0];

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="font-display text-[18px] font-bold leading-none text-fg">
          <T tr={`Merhaba, ${firstName}`} en={`Hello, ${firstName}`} />
        </h1>
        <span className="flex items-center gap-1.5 font-body text-[11.5px] text-fg-muted">
          <CalendarDays size={12} aria-hidden />
          {mockDateLabel(lang)}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-pill bg-brand/12 px-2.5 py-1 font-body text-[10.5px] font-semibold text-brand">
          {identity.role}
        </span>
        <span className="flex items-center gap-1.5 rounded-pill bg-elevated px-2.5 py-1 font-body text-[10.5px] font-medium text-fg-secondary">
          <Users size={11} aria-hidden />
          {identity.team}
        </span>
        <span className="flex items-center gap-1.5 rounded-pill bg-elevated px-2.5 py-1 font-body text-[10.5px] font-medium text-fg-secondary">
          <MapPin size={11} aria-hidden />
          {identity.location}
        </span>
        <span className="hidden items-center gap-1.5 rounded-pill bg-elevated px-2.5 py-1 font-body text-[10.5px] font-medium text-fg-secondary sm:flex">
          <Clock size={11} aria-hidden />
          <T tr="09:00–18:00 vardiya" en="09:00–18:00 shift" />
        </span>
      </div>
    </div>
  );
}

export function TopKpiStrip() {
  const { t } = useLang();
  const sales = MONTH_TO_DATE.salesEUR;
  const target = salesTargetProgress(sales, AGENT_REGION);
  const q = QUARTER_PROGRESS;

  const animatedSales = useCountUp(sales);
  const animatedCommission = useCountUp(MONTH_TO_DATE.commissionEUR);

  const reached = target.remainingEUR === 0;
  /** Bu ay + çeyreklik hak edilen toplam prim — "prim status" tek rakamı. */
  const totalCommissionEUR = MONTH_TO_DATE.commissionEUR + q.extraEUR;

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <GreetingLine />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {/* 1 — CURRENT SALES */}
        <KpiShell
          icon={Banknote}
          title={<T tr="Current Sales" en="Current Sales" />}
          periodTag={<T tr="bu ay" en="this month" />}
          tone="neutral"
          hint={t(
            "Bu ay ödemesi alınan (tahsil edilen) satış toplamın. Üstteki tarih filtresinden etkilenmez — aylık prim dönemidir.",
            "Your collected sales for this month. Not affected by the date filter above — this is the monthly commission period.",
          )}
        >
          <span className="font-mono text-[26px] font-bold leading-none text-fg">
            {formatCurrencyEUR(Math.round(animatedSales))}
          </span>
          <span className="font-body text-[11.5px] text-fg-secondary">
            <T
              tr={`${formatNumber(MONTH_TO_DATE.deals)} deal · tahsilatı alınan`}
              en={`${formatNumber(MONTH_TO_DATE.deals)} deal(s) · payment received`}
            />
          </span>
        </KpiShell>

        {/* 2 — CURRENT TARGET */}
        <KpiShell
          icon={Target}
          title={<T tr="Current Target" en="Current Target" />}
          periodTag={<T tr="otomatik" en="automatic" />}
          tone="brand"
          hint={t(
            "Hedef mevcut satışına göre otomatik belirlenir, elle seçilmez: 12.500 € geçilince 15.000 €, 15.000 € geçilince 20.000 € ve sonrasında 5.000 €'lik adımlar.",
            "The target is set automatically from your current sales, never chosen by hand: passing 12,500 € makes it 15,000 €, passing 15,000 € makes it 20,000 €, then 5,000 € steps.",
          )}
        >
          <span className="flex items-baseline gap-1.5">
            <span className="font-mono text-[26px] font-bold leading-none text-brand">
              {formatCurrencyEUR(target.targetEUR)}
            </span>
            <span
              className={cn(
                "font-mono text-[12px] font-semibold",
                reached ? "text-success" : "text-brand-secondary",
              )}
            >
              {reached
                ? t("tamamlandı", "reached")
                : `${t("kalan", "left")} ${formatCurrencyEUR(target.remainingEUR)}`}
            </span>
          </span>

          <div className="flex flex-col gap-1">
            <div className="relative h-2 overflow-hidden rounded-pill bg-elevated">
              <div
                className={cn(
                  "h-full rounded-pill transition-[width] duration-700 ease-out",
                  reached ? "bg-success" : "bg-brand",
                )}
                style={{ width: `${Math.min(100, target.progressPct)}%` }}
              />
              {target.previousTargetEUR > 0 && (
                <span
                  aria-hidden
                  className="absolute inset-y-0 z-10 w-px bg-fg/45"
                  style={{ left: `${(target.previousTargetEUR / target.targetEUR) * 100}%` }}
                />
              )}
            </div>
            <span className="font-body text-[11px] text-fg-secondary">
              <T
                tr={`${formatCurrencyEUR(sales)} / ${formatCurrencyEUR(target.targetEUR)} · ${formatPercent(target.progressPct)}`}
                en={`${formatCurrencyEUR(sales)} / ${formatCurrencyEUR(target.targetEUR)} · ${formatPercent(target.progressPct)}`}
              />
            </span>
          </div>
        </KpiShell>

        {/* 3 — PRİM STATUS */}
        <KpiShell
          icon={Trophy}
          title={<T tr="Prim Status" en="Commission Status" />}
          periodTag={<T tr={`bu ay + ${CURRENT_QUARTER}`} en={`this month + ${CURRENT_QUARTER}`} />}
          tone="violet"
          hint={t(
            "Bu ay biriken aylık prim + içinde bulunulan çeyrekte hak edilen ekstra prim. Aylık oran satışa, çeyreklik oran çeyreğin aylık ortalamasına göre belirlenir.",
            "Your accrued monthly commission plus the extra commission earned in the current quarter. The monthly rate follows your sales; the quarterly rate follows the quarter's monthly average.",
          )}
        >
          <span className="font-mono text-[26px] font-bold leading-none text-violet">
            {formatCurrencyEUR(Math.round(animatedCommission) + q.extraEUR)}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="font-body text-[11.5px] text-fg-secondary">
              <T
                tr={`Aylık ${formatCurrencyEUR(MONTH_TO_DATE.commissionEUR)} (oran ${formatRatePct(MONTH_TO_DATE.ratePct)})`}
                en={`Monthly ${formatCurrencyEUR(MONTH_TO_DATE.commissionEUR)} (rate ${formatRatePct(MONTH_TO_DATE.ratePct)})`}
              />
            </span>
            <span className="font-body text-[11.5px] text-fg-secondary">
              <T
                tr={`${CURRENT_QUARTER} ekstra ${formatCurrencyEUR(q.extraEUR)} (dilim ${formatRatePct(q.currentRatePct)})`}
                en={`${CURRENT_QUARTER} extra ${formatCurrencyEUR(q.extraEUR)} (tier ${formatRatePct(q.currentRatePct)})`}
              />
            </span>
          </div>
          {/* Toplam rakam yukarıda; burada sıfır durumunda yönlendirici not */}
          {totalCommissionEUR === 0 && (
            <span className="font-body text-[10.5px] text-fg-muted">
              <T
                tr={`İlk primin ${formatCurrencyEUR(target.targetEUR)} eşiğini geçince başlar.`}
                en={`Your first commission starts once you pass the ${formatCurrencyEUR(target.targetEUR)} threshold.`}
              />
            </span>
          )}
        </KpiShell>
      </div>
    </div>
  );
}
