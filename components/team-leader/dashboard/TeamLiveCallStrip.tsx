"use client";

import { useEffect, useState } from "react";
import { Headphones, PhoneCall, PhoneOff } from "lucide-react";
import {
  liveCallSnapshot,
  type LiveAgentRow,
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
 * ANLIK AKTİF ÇAĞRI GÖSTERGESİ — TAKIM LİDERİ SÜRÜMÜ.
 *
 * Agent panelindeki LiveCallStrip ile AYNI motoru kullanır
 * (lib/mock/live-calls.ts) ama farklı soruya cevap verir: agent "ben bu
 * toplamın neresindeyim" diye sorar, TL "şu an kim çalışıyor, kim boş
 * oturuyor" diye sorar. Bu yüzden pay barı yerine tam takım listesi var ve
 * MÜSAİT olanlar üste alınır — TL'nin aksiyon alacağı satır o.
 *
 * Canlı katman deterministiktir; ilk render `elapsed = 0` ile yapıldığı için
 * hydration uyuşmazlığı olmaz (bkz. motor dosyasının başlığı).
 */

/** Sayaç tik aralığı (ms). */
const TICK_MS = 1000;

function LiveValue({ value, className }: { value: number; className?: string }) {
  const animated = useTweenNumber(value);
  return <span className={className}>{formatNumber(Math.round(animated))}</span>;
}

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
  tone: "brand" | "indigo" | "warning";
}) {
  const TONE: Record<typeof tone, { chip: string; value: string }> = {
    brand: { chip: "bg-brand/12 text-brand", value: "text-brand" },
    indigo: { chip: "bg-indigo/12 text-indigo", value: "text-indigo" },
    warning: { chip: "bg-warning/14 text-warning", value: "text-warning" },
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

/** Tek agent satırı — durum noktası, isim, bugünkü çağrı, pay, sıra. */
function AgentRow({
  row,
  maxCalls,
  t,
}: {
  row: LiveAgentRow;
  maxCalls: number;
  t: (tr: string, en: string) => string;
}) {
  const reduced = usePrefersReducedMotion();
  const barPct = maxCalls > 0 ? (row.callsToday / maxCalls) * 100 : 0;

  return (
    <li
      className={cn(
        "group relative flex items-center gap-2.5 rounded-control px-2 py-1.5 transition-colors hover:bg-elevated",
        !row.onCall && "bg-warning/[0.06]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-2 w-2 shrink-0 rounded-pill",
          row.onCall ? "bg-brand" : "bg-warning",
          row.onCall && !reduced && "live-ring",
        )}
      />
      <span className="w-28 shrink-0 truncate font-body text-[11.5px] text-fg">{row.name}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-pill bg-elevated">
        <span
          className="block h-full rounded-pill bg-indigo transition-[width] duration-500 ease-out"
          style={{ width: `${barPct}%` }}
        />
      </span>
      <span className="w-10 shrink-0 text-right font-mono text-[11.5px] font-semibold text-fg">
        {formatNumber(row.callsToday)}
      </span>
      <span className="w-12 shrink-0 text-right font-mono text-[10.5px] text-fg-muted">
        {formatPercent(row.sharePct)}
      </span>
      <span
        className={cn(
          "w-14 shrink-0 text-right font-body text-[10px] font-semibold uppercase tracking-wide",
          row.onCall ? "text-brand" : "text-warning",
        )}
      >
        {row.onCall ? t("hatta", "on call") : t("müsait", "idle")}
      </span>
      <HoverTip align="right">
        <p className="mb-0.5 font-display text-[12px] font-semibold text-fg">{row.name}</p>
        <p className="font-mono text-[11px] text-fg-secondary">
          {formatNumber(row.callsToday)} {t("çağrı", "calls")} · {formatPercent(row.sharePct)} · #
          {formatNumber(row.rank)}
        </p>
        <p className="font-body text-[10.5px] text-fg-muted">
          {row.onCall
            ? t("Şu an bir görüşmede.", "In a conversation right now.")
            : t("Şu an hatta değil — müsait.", "Not on a call right now — idle.")}
        </p>
      </HoverTip>
    </li>
  );
}

export function TeamLiveCallStrip() {
  const { t } = useLang();
  const reduced = usePrefersReducedMotion();
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsedSec((prev) => prev + TICK_MS / 1000);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const snap = liveCallSnapshot(elapsedSec);
  const { teamSize, teamTotalCalls, onCallCount, rows, teamName } = snap;
  const idleCount = teamSize - onCallCount;
  const maxCalls = Math.max(1, ...rows.map((r) => r.callsToday));

  /**
   * Sıralama: MÜSAİT olanlar üstte (TL'nin ilgilendiği satır), her grup içinde
   * çağrı sayısına göre azalan. `rows` motorda zaten çağrıya göre sıralı, bu
   * yüzden yalnızca duruma göre kararlı (stable) bir bölme yapıyoruz.
   */
  const ordered = [...rows].sort((a, b) => Number(a.onCall) - Number(b.onCall));

  return (
    <Card className="flex flex-col gap-5">
      <SectionTitle
        hint={t(
          `${teamName} takımının bu anki çağrı durumu — kim görüşmede, kim müsait ve bugünkü çağrı sayıları. Müsait olanlar listenin üstündedir.`,
          `Live call status for the ${teamName} team — who is in a conversation, who is idle, and today's call counts. Idle agents are listed first.`,
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
        <T tr="Takım Şu An Hatta" en="Team Live Call Activity" />
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
          icon={<PhoneOff size={16} />}
          value={idleCount}
          suffix={`/${formatNumber(teamSize)}`}
          label={<T tr="şu an müsait" en="idle right now" />}
          hint={t(
            "Şu an hatta olmayan danışman sayısı — aksiyon alman gereken grup.",
            "Agents not on a call right now — the group you may need to act on.",
          )}
          tone="warning"
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
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5 px-2 font-body text-[10px] uppercase tracking-wide text-fg-muted">
          <span className="w-2 shrink-0" />
          <span className="w-28 shrink-0"><T tr="Danışman" en="Agent" /></span>
          <span className="flex-1" />
          <span className="w-10 shrink-0 text-right"><T tr="Çağrı" en="Calls" /></span>
          <span className="w-12 shrink-0 text-right"><T tr="Pay" en="Share" /></span>
          <span className="w-14 shrink-0 text-right"><T tr="Durum" en="Status" /></span>
        </div>
        <ul className="flex flex-col gap-0.5">
          {ordered.map((row) => (
            <AgentRow key={row.agentId} row={row} maxCalls={maxCalls} t={t} />
          ))}
        </ul>
      </div>
    </Card>
  );
}
