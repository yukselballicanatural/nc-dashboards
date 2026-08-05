"use client";

import { useEffect, useState } from "react";
import { Headphones, PhoneCall, Trophy } from "lucide-react";
import {
  liveCallSnapshot,
  type LiveAgentRow,
  type LiveCallSnapshot,
} from "@/lib/mock/live-calls";
import { useTweenNumber } from "@/lib/hooks/useTweenNumber";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HoverTip } from "@/components/ui/HoverTip";
import { cn } from "@/lib/utils/cn";

/**
 * ANLIK AKTİF ÇAĞRI GÖSTERGESİ (v3 — kullanıcı talebi).
 *
 * İki soruya aynı anda cevap verir:
 *  1. "Takım şu an ne durumda?" — kaç kişi hatta, bugün toplam kaç çağrı.
 *  2. "Ben bu toplamın neresindeyim?" — payım (%) ve takım içi sıram, eşit
 *     dağılımda düşen paya (100/takım mevcudu) göre renk kodlu.
 *
 * Veri: `lib/mock/live-calls.ts` — taban gerçek lead motorundan gelir, canlı
 * katman deterministik olarak simüle edilir (bkz. o dosyanın başlığı).
 * Sayaç `useEffect` içinde saniyede bir ilerler; ilk render sunucuyla aynı
 * (elapsed = 0) olduğu için hydration uyuşmazlığı olmaz.
 */

/** Sayaç tik aralığı (ms). */
const TICK_MS = 1000;

function LiveValue({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const animated = useTweenNumber(value);
  return <span className={className}>{formatNumber(Math.round(animated))}</span>;
}

/** Üstteki 3 büyük gösterge kutusundan biri. */
function StatTile({
  icon,
  value,
  suffix,
  label,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  label: React.ReactNode;
  hint: string;
  tone: "brand" | "indigo" | "brand-secondary";
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

  return (
    <div className="group relative flex items-center gap-3 rounded-card border border-border bg-elevated px-4 py-3 transition-colors hover:border-brand/30">
      <span
        aria-hidden
        className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-control", styles.chip)}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="flex items-baseline gap-0.5">
          <LiveValue
            value={value}
            className={cn("font-mono text-[24px] font-bold leading-none", styles.value)}
          />
          {suffix && (
            <span className="font-mono text-[13px] font-semibold text-fg-muted">{suffix}</span>
          )}
        </span>
        <span className="truncate font-body text-[11.5px] text-fg-secondary">{label}</span>
      </span>
      <HoverTip align="right">
        <p className="font-body text-[11px] leading-snug text-fg-secondary">{hint}</p>
      </HoverTip>
    </div>
  );
}

/** Takım şeridi — her üye için bir nokta; hatta olanlar parlar. */
function TeamDotStrip({ rows, t }: { rows: LiveAgentRow[]; t: (tr: string, en: string) => string }) {
  const reduced = usePrefersReducedMotion();
  return (
    <div className="flex flex-col gap-2">
      <span className="font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted">
        <T tr="Takım · şu an hatta olanlar" en="Team · on a call right now" />
      </span>
      <ul className="flex flex-wrap items-center gap-1.5">
        {rows.map((row) => (
          <li key={row.agentId} className="group relative">
            <span
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-pill border px-2 transition-colors",
                row.onCall
                  ? "border-brand/40 bg-brand/10"
                  : "border-border bg-transparent",
                row.isSelf && "ring-1 ring-brand/50",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-pill",
                  row.onCall ? "bg-brand" : "bg-neutral/50",
                  row.onCall && !reduced && "live-ring",
                )}
              />
              <span
                className={cn(
                  "font-body text-[10.5px] font-medium",
                  row.onCall ? "text-fg" : "text-fg-muted",
                )}
              >
                {row.isSelf ? t("Sen", "You") : row.name.split(" ")[0]}
              </span>
            </span>
            <HoverTip>
              <p className="mb-0.5 font-display text-[12px] font-semibold text-fg">{row.name}</p>
              <p className="font-mono text-[11px] text-fg-secondary">
                {formatNumber(row.callsToday)} {t("çağrı", "calls")} ·{" "}
                {formatPercent(row.sharePct)} · #{formatNumber(row.rank)}
              </p>
              <p className="font-body text-[10.5px] text-fg-muted">
                {row.onCall ? t("şu an hatta", "on a call now") : t("müsait", "available")}
              </p>
            </HoverTip>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Payın takım toplamı içindeki yeri + eşit pay kıyası. */
function ShareBar({ snap, t }: { snap: LiveCallSnapshot; t: (tr: string, en: string) => string }) {
  const { self, fairSharePct, teamSize } = snap;
  const deltaPts = Math.round((self.sharePct - fairSharePct) * 10) / 10;
  const ahead = deltaPts >= 0;
  // Barı okunur tutmak için ölçek: eşit payın ~2.5 katı tam genişlik sayılır.
  const scaleMax = Math.max(fairSharePct * 2.5, self.sharePct, 1);
  const fillPct = Math.min(100, (self.sharePct / scaleMax) * 100);
  const fairMarkerPct = Math.min(100, (fairSharePct / scaleMax) * 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted">
          <T tr="Takım toplamındaki payın" en="Your share of the team total" />
        </span>
        <span
          className={cn(
            "rounded-pill px-2 py-0.5 font-mono text-[10.5px] font-semibold",
            ahead ? "bg-success/12 text-success" : "bg-critical/12 text-critical",
          )}
        >
          {ahead ? "+" : ""}
          {formatNumber(deltaPts, 1)} {t("puan", "pts")}
        </span>
      </div>

      {/* Bar + eşit pay işareti */}
      <div className="relative h-7 overflow-hidden rounded-control bg-elevated">
        <div
          className={cn(
            "flex h-full items-center rounded-control pl-2.5 transition-[width] duration-500 ease-out",
            ahead ? "bg-brand" : "bg-brand-secondary",
          )}
          style={{ width: `${fillPct}%` }}
        >
          <span className="whitespace-nowrap font-mono text-[11.5px] font-bold text-white">
            {formatPercent(self.sharePct)}
          </span>
        </div>
        {/* Eşit dağılım çizgisi — 12 kişilik takımda kişi başı %8,3.
            z-10: dolgu barın üstünde kalsın, pay çizgiyi geçtiğinde
            çizgi dolgunun altında kaybolmasın. */}
        <span
          aria-hidden
          className="absolute inset-y-0 z-10 w-px bg-fg/55"
          style={{ left: `${fairMarkerPct}%` }}
        />
      </div>

      <p className="font-body text-[11px] leading-snug text-fg-secondary">
        <span className="font-mono font-semibold text-fg">
          {formatNumber(self.callsToday)}
        </span>{" "}
        <T tr="çağrı yaptın." en="calls made." />{" "}
        <T
          tr={`${teamSize} kişilik takımda eşit pay %${formatNumber(fairSharePct, 1)} (dikey çizgi) — ${
            ahead ? "onun üzerindesin" : "onun altındasın"
          }.`}
          en={`Equal share in a team of ${teamSize} is ${formatNumber(fairSharePct, 1)}% (vertical line) — you are ${
            ahead ? "above it" : "below it"
          }.`}
        />
      </p>
    </div>
  );
}

export function LiveCallStrip() {
  const { t } = useLang();
  const reduced = usePrefersReducedMotion();
  const [elapsedSec, setElapsedSec] = useState(0);

  // Canlı tik — yalnızca tarayıcıda. İlk render (0) sunucuyla aynı olduğu için
  // hydration uyuşmazlığı olmaz. Sekme arka plandayken tarayıcı zaten
  // interval'i kısar; ayrıca motor vardiya bitişinde sayacı sabitler.
  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsedSec((prev) => prev + TICK_MS / 1000);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const snap = liveCallSnapshot(elapsedSec);
  const { self, teamSize, teamTotalCalls, onCallCount } = snap;

  return (
    <Card className="flex flex-col gap-5">
      <SectionTitle
        hint={t(
          `Takımın bugün yaptığı toplam çağrı, şu an hatta olanlar ve senin bu toplamdaki payın — ${snap.teamName}, ${teamSize} danışman.`,
          `Your team's total calls today, who is on a call right now, and your share of that total — ${snap.teamName}, ${teamSize} agents.`,
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
        <T tr="Şu An Hatta" en="Live Call Activity" />
      </SectionTitle>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          icon={<Headphones size={16} />}
          value={onCallCount}
          suffix={`/${formatNumber(teamSize)}`}
          label={<T tr="şu an hatta" en="on a call now" />}
          hint={t(
            "Takımdan kaç kişi tam bu anda bir görüşmede.",
            "How many teammates are in a conversation at this very moment.",
          )}
          tone="brand"
        />
        <StatTile
          icon={<PhoneCall size={16} />}
          value={teamTotalCalls}
          label={<T tr="takımın bugünkü çağrısı" en="team calls today" />}
          hint={t(
            "Takımın bugün vardiya başından bu yana yaptığı toplam çağrı — canlı artar.",
            "Total calls the team has made since the shift started today — updates live.",
          )}
          tone="indigo"
        />
        <StatTile
          icon={<Trophy size={16} />}
          value={self.rank}
          suffix={`/${formatNumber(teamSize)}`}
          label={<T tr="takım içi sıran" en="your rank in team" />}
          hint={t(
            "Bugünkü çağrı sayısına göre takım içindeki sıran (1 = en çok arayan).",
            "Your rank within the team by today's call count (1 = most calls).",
          )}
          tone="brand-secondary"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <ShareBar snap={snap} t={t} />
        </div>
        <div className="lg:col-span-6">
          <TeamDotStrip rows={snap.rows} t={t} />
        </div>
      </div>
    </Card>
  );
}
