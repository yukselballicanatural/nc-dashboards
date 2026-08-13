"use client";

import { useEffect, useState } from "react";
import { Headphones, PhoneCall, Trophy, Users } from "lucide-react";
import { liveCallSnapshot } from "@/lib/mock/live-calls";
import { useDateRange } from "@/components/agent/filters/DateRangeContext";
import { useTweenNumber } from "@/lib/hooks/useTweenNumber";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import type { Kpi } from "@/lib/types/agent-data";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HoverTip } from "@/components/ui/HoverTip";
import { cn } from "@/lib/utils/cn";

/**
 * ARAMA BİLGİSİ — Dashboard'ın dört ana alanından biri (kullanıcı talebi:
 * sade, minimum scroll, kritik değerler ilk ekranda).
 *
 * Neden yeni bir kart: eski Dashboard bu bilgiyi ÜÇ ayrı bileşene dağıtıyordu
 * (LiveCallStrip'in 12 satırlık takım listesi, 5 kartlık CallKpiGrid, iki
 * radial gauge) — toplam ~700px. Burada aynı veri tek kartta, dört rakam +
 * iki ince oran çubuğu olarak ~260px'e sığıyor. Radial gauge yerine yatay
 * çubuk seçildi: dikeyde çok daha az yer kaplıyor ve hedef çizgisi
 * (hedefin neresindeyim) çubukta daha okunur.
 *
 * Detay (saatlik dağılım, hız analizi, tam takım listesi) "Aramalar & Funnel"
 * sayfasında duruyor; buraya link koymuyoruz — kullanıcı gereksiz detay
 * ekranlarına yönlendirilmemeli.
 */

const TICK_MS = 1000;

/** callKpis içinden id ile değer okur — bulunamazsa 0 (sessizce kırılmasın). */
function kpiValue(kpis: Kpi[], id: string): number {
  const found = kpis.find((k) => k.id === id);
  if (!found) {
    console.error(`[CallSnapshotCard] "${id}" KPI'ı dönem verisinde bulunamadı.`);
    return 0;
  }
  return found.value;
}

function StatTile({
  icon,
  value,
  suffix,
  label,
  hint,
  tone,
  live = false,
}: {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  label: React.ReactNode;
  hint: string;
  tone: "brand" | "indigo" | "brand-secondary";
  /** true → değer canlı; tween ile yumuşak geçiş yapar. */
  live?: boolean;
}) {
  const TONE: Record<typeof tone, { chip: string; value: string }> = {
    brand: { chip: "bg-brand/12 text-brand", value: "text-brand" },
    indigo: { chip: "bg-indigo/12 text-indigo", value: "text-indigo" },
    "brand-secondary": {
      chip: "bg-brand-secondary/14 text-brand-secondary",
      value: "text-brand-secondary",
    },
  };
  const styles = TONE[tone];
  const tweened = useTweenNumber(value);
  const shown = live ? Math.round(tweened) : value;

  return (
    <div className="group relative flex items-center gap-2.5 rounded-card border border-border bg-elevated px-3.5 py-3 transition-colors hover:border-brand/30">
      <span
        aria-hidden
        className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-control", styles.chip)}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="flex items-baseline gap-0.5">
          <span className={cn("font-mono text-[22px] font-bold leading-none", styles.value)}>
            {formatNumber(shown)}
          </span>
          {suffix && (
            <span className="font-mono text-[12px] font-semibold text-fg-muted">{suffix}</span>
          )}
        </span>
        <span className="truncate font-body text-[11px] text-fg-secondary">{label}</span>
      </span>
      <HoverTip align="right">
        <p className="font-body text-[11px] leading-snug text-fg-secondary">{hint}</p>
      </HoverTip>
    </div>
  );
}

/**
 * Oran çubuğu — hedef, çubuğun üzerinde dikey bir çizgi olarak işaretlenir.
 * Renk CLAUDE.md 3.1 semantiğine göre: hedefte yeşil, yakınsa sarı, uzaksa
 * turuncu/kırmızı.
 */
function RateBar({
  label,
  valuePct,
  targetPct,
  lang,
}: {
  label: string;
  valuePct: number;
  targetPct: number;
  lang: "tr" | "en";
}) {
  const ratio = targetPct > 0 ? valuePct / targetPct : 1;
  const tone =
    ratio >= 1 ? "bg-success" : ratio >= 0.85 ? "bg-warning" : ratio >= 0.6 ? "bg-risk" : "bg-critical";
  const textTone =
    ratio >= 1 ? "text-success" : ratio >= 0.85 ? "text-warning" : ratio >= 0.6 ? "text-risk" : "text-critical";

  // Ölçek: hedefin 1,25 katı tam genişlik — hedef çizgisi hep görünür kalır.
  const scaleMax = Math.max(targetPct * 1.25, valuePct, 1);
  const fillPct = Math.min(100, (valuePct / scaleMax) * 100);
  const markerPct = Math.min(100, (targetPct / scaleMax) * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate font-body text-[11px] text-fg-secondary">{label}</span>
        <span className={cn("shrink-0 font-mono text-[13px] font-bold", textTone)}>
          {formatPercent(valuePct)}
        </span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-pill bg-elevated">
        <div
          className={cn("h-full rounded-pill transition-[width] duration-500 ease-out", tone)}
          style={{ width: `${fillPct}%` }}
        />
        {/* Hedef çizgisi — z-10: dolgu geçtiğinde çizgi altında kaybolmasın. */}
        <span
          aria-hidden
          className="absolute inset-y-0 z-10 w-px bg-fg/55"
          style={{ left: `${markerPct}%` }}
        />
      </div>
      <span className="font-body text-[10px] text-fg-muted">
        {lang === "en"
          ? `target ${Math.round(targetPct)}% (line)`
          : `hedef %${Math.round(targetPct)} (çizgi)`}
      </span>
    </div>
  );
}

export function CallSnapshotCard() {
  const { t, lang } = useLang();
  const { data, label: rangeLabel } = useDateRange();
  const reduced = usePrefersReducedMotion();
  const [elapsedSec, setElapsedSec] = useState(0);

  // Canlı tik yalnızca tarayıcıda; ilk render (0) sunucuyla aynı → hydration
  // uyuşmazlığı olmaz (bkz. lib/mock/live-calls.ts başlığı).
  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsedSec((prev) => prev + TICK_MS / 1000);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const snap = liveCallSnapshot(elapsedSec);
  const totalCalls = kpiValue(data.callKpis, "total");
  const reachPct = kpiValue(data.callKpis, "person-reach");

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={t(
          `Seçili dönem (${rangeLabel}) arama performansın + takımın o anki canlı çağrı durumu. Çubuklardaki dikey çizgi hedefi gösterir.`,
          `Your call performance for the selected period (${rangeLabel}) plus your team's live call status. The vertical line on each bar marks the target.`,
        )}
        aside={
          <span className="flex shrink-0 items-center gap-1.5 rounded-pill bg-critical/10 px-2.5 py-1">
            <span
              aria-hidden
              className={cn("h-1.5 w-1.5 rounded-pill bg-critical", !reduced && "live-dot")}
            />
            <span className="font-body text-[10px] font-bold uppercase tracking-wider text-critical">
              <T tr="Canlı" en="Live" />
            </span>
          </span>
        }
      >
        <T tr="Arama Bilgisi" en="Call Activity" />
      </SectionTitle>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <StatTile
          icon={<Headphones size={15} />}
          value={snap.onCallCount}
          suffix={`/${formatNumber(snap.teamSize)}`}
          label={<T tr="takımda şu an hatta" en="on a call in your team" />}
          hint={t(
            "Takımdan kaç kişi tam bu anda bir görüşmede — sen dahil.",
            "How many teammates are in a conversation right now — you included.",
          )}
          tone="brand"
          live
        />
        <StatTile
          icon={<PhoneCall size={15} />}
          value={snap.self.callsToday}
          label={<T tr="bugünkü çağrın" en="your calls today" />}
          hint={t(
            "Bugün vardiya başından bu yana yaptığın çağrı sayısı — canlı artar.",
            "Calls you have made since the shift started today — updates live.",
          )}
          tone="indigo"
          live
        />
        <StatTile
          icon={<Users size={15} />}
          value={totalCalls}
          label={<T tr="dönemde toplam arama" en="calls in period" />}
          hint={t(
            `Seçili dönemde (${rangeLabel}) yaptığın tüm arama denemeleri.`,
            `All call attempts you made in the selected period (${rangeLabel}).`,
          )}
          tone="indigo"
        />
        <StatTile
          icon={<Trophy size={15} />}
          value={snap.self.rank}
          suffix={`/${formatNumber(snap.teamSize)}`}
          label={<T tr="takım içi sıran" en="your rank in team" />}
          hint={t(
            "Bugünkü çağrı sayısına göre takım içindeki sıran (1 = en çok arayan).",
            "Your rank within the team by today's call count (1 = most calls).",
          )}
          tone="brand-secondary"
        />
      </div>

      {/* Oranlar — SLA uyumu, cevaplanma ve kişi ulaşımı */}
      <div className="mt-auto flex flex-col gap-3">
        {data.gauges.map((gauge) => (
          <RateBar
            key={gauge.key}
            label={gauge.label}
            valuePct={gauge.valuePct}
            targetPct={gauge.targetPct}
            lang={lang}
          />
        ))}
        <RateBar
          label={t("Kişi Ulaşım Oranı", "Person Reach Rate")}
          valuePct={reachPct}
          targetPct={45}
          lang={lang}
        />
      </div>
    </Card>
  );
}
