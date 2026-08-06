"use client";

import { DoorOpen, LogIn, LogOut } from "lucide-react";
import {
  DAILY_TARGET_MINUTES,
  dayTypeLabel,
  formatDuration,
  gateLabel,
  type PdksDay,
} from "@/lib/mock/pdks";
import { formatNumber } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * BUGÜNÜN TURNİKE KAYDI — gün içindeki tüm giriş/çıkış hareketleri ve
 * hedefe göre durum.
 *
 * NOT: Mock "şimdi" öğlen 12:00 olsa da gün kaydı (mevcut vardiya verisiyle
 * tutarlı kalmak için) tam gün olarak gelir; bu yüzden kart "kalan süre"
 * değil, günün TAMAMLANMIŞ durumunu gösterir. Gerçek santral/PDKS
 * entegrasyonunda gün içi anlık durum da buradan gösterilebilir.
 */
export function PdksTodayCard({ day }: { day: PdksDay }) {
  const { t, lang } = useLang();
  const hasRecord = day.events.length > 0;
  const isDeficit = day.balanceMinutes < 0;
  const hasTarget = day.targetMinutes > 0;

  // Hedefe göre doluluk — hedefi aşan kısım %100'de kırpılır.
  const fillPct = hasTarget
    ? Math.min(100, (day.insideMinutes / day.targetMinutes) * 100)
    : 0;

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={t(
          "Bugün turnikeden yaptığın tüm giriş/çıkış hareketleri. Dışarıda geçen süre turnike-içi süreden düşülür.",
          "All of today's turnstile entries and exits. Time spent outside is deducted from your inside time.",
        )}
        aside={
          <span className="shrink-0 rounded-pill bg-neutral/12 px-2.5 py-1 font-body text-[10.5px] font-semibold text-fg-secondary">
            {day.dateLabel} · {day.weekdayLabel}
          </span>
        }
      >
        <T tr="Bugün" en="Today" />
      </SectionTitle>

      {!hasRecord ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <DoorOpen size={22} aria-hidden className="text-fg-muted" />
          <p className="font-body text-[12.5px] text-fg-secondary">
            {day.type === "workday" || day.type === "absent" ? (
              <T
                tr="Bugün için henüz turnike hareketi yok."
                en="No turnstile activity recorded for today yet."
              />
            ) : (
              <T
                tr={`Bugün ${dayTypeLabel(day.type, "tr").toLocaleLowerCase("tr")} — mesai beklenmiyor.`}
                en={`Today is a ${dayTypeLabel(day.type, "en").toLowerCase()} — no hours expected.`}
              />
            )}
          </p>
        </div>
      ) : (
        <>
          {/* Turnike içi süre / hedef */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <span className="flex items-baseline gap-1.5">
                <span
                  className={cn(
                    "font-mono text-[26px] font-bold leading-none",
                    hasTarget && isDeficit ? "text-critical" : "text-brand",
                  )}
                >
                  {formatDuration(day.insideMinutes, lang)}
                </span>
                <span className="font-body text-[11.5px] text-fg-muted">
                  / {formatDuration(day.targetMinutes || DAILY_TARGET_MINUTES, lang)}
                </span>
              </span>
              {hasTarget ? (
                <span
                  className={cn(
                    "rounded-pill px-2 py-0.5 font-mono text-[11px] font-semibold",
                    isDeficit ? "bg-critical/12 text-critical" : "bg-success/12 text-success",
                  )}
                >
                  {isDeficit ? "−" : "+"}
                  {formatDuration(day.balanceMinutes, lang)}
                </span>
              ) : (
                <span className="rounded-pill bg-brand-secondary/14 px-2 py-0.5 font-body text-[10.5px] font-semibold text-brand-secondary">
                  <T tr="fazla mesai" en="overtime" />
                </span>
              )}
            </div>

            {hasTarget && (
              <div className="h-2 w-full overflow-hidden rounded-pill bg-elevated">
                <div
                  className={cn("h-full rounded-pill", isDeficit ? "bg-critical" : "bg-brand")}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            )}
          </div>

          {/* Özet satırı */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-body text-[11px] text-fg-secondary">
            <span>
              <T tr="Geç giriş:" en="Late in:" />{" "}
              <span
                className={cn(
                  "font-mono font-semibold",
                  day.lateMinutes > 5 ? "text-critical" : "text-fg",
                )}
              >
                {day.lateMinutes > 0 ? `${formatNumber(day.lateMinutes)} ${t("dk", "min")}` : "—"}
              </span>
            </span>
            <span>
              <T tr="Dışarıda:" en="Outside:" />{" "}
              <span className="font-mono font-semibold text-fg">
                {formatDuration(day.outsideMinutes, lang)}
              </span>
            </span>
            <span>
              <T tr="Ara çıkış:" en="Mid-day exits:" />{" "}
              <span className="font-mono font-semibold text-fg">
                {formatNumber(day.exitCount)}
              </span>
            </span>
          </div>

          {/* Hareket zaman çizelgesi */}
          <ul className="flex flex-col gap-1.5">
            {day.events.map((event, index) => (
              <li
                key={`${event.time}-${event.direction}-${index}`}
                className="flex items-center gap-2.5 rounded-control border border-border bg-elevated px-3 py-2"
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-control",
                    event.direction === "in"
                      ? "bg-brand/12 text-brand"
                      : "bg-brand-secondary/14 text-brand-secondary",
                  )}
                >
                  {event.direction === "in" ? <LogIn size={12} /> : <LogOut size={12} />}
                </span>
                <span className="font-mono text-[12.5px] font-semibold text-fg">{event.time}</span>
                <span className="font-body text-[11.5px] text-fg-secondary">
                  {event.direction === "in" ? t("Giriş", "Entry") : t("Çıkış", "Exit")}
                </span>
                <span className="ml-auto truncate font-body text-[11px] text-fg-muted">
                  {gateLabel(event.gate, lang)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
