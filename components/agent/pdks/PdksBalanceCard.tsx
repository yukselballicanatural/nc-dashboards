"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { CalendarClock, TrendingDown, TrendingUp } from "lucide-react";
import {
  DAILY_TARGET_MINUTES,
  formatDuration,
  type PdksSummary,
} from "@/lib/mock/pdks";
import { DURATION } from "@/lib/motion";
import { formatNumber } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AXIS_TICK, TooltipFrame } from "@/components/ui/ChartBits";
import { cn } from "@/lib/utils/cn";

/**
 * AYLIK MESAİ BAKİYESİ — PDKS sayfasının manşeti.
 *
 * Manşet rakam İŞ GÜNÜ bakiyesidir; hafta sonu/tatil çalışması ayrı bir kalem
 * olarak gösterilir (bkz. lib/mock/pdks.ts başlığı — aksi halde hafta sonu
 * mesaisi iş günü eksiklerini gizlerdi).
 *
 * Grafik: yayan (kümülatif) bakiye. Sıfır çizgisinin altı kırmızı, üstü
 * yeşil — gradient offset min/max'e göre hesaplanır, böylece eğri sıfırı
 * kestiği yerde renk de değişir.
 */

interface ChartRow {
  dateLabel: string;
  cumulativeMinutes: number;
  balanceMinutes: number;
}

function BalanceTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  const { t, lang } = useLang();
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as ChartRow | undefined;
  if (!row) return null;

  const sign = (n: number) => (n < 0 ? "−" : "+") + formatDuration(n, lang);

  return (
    <TooltipFrame
      title={row.dateLabel}
      rows={[
        {
          label: t("O günün bakiyesi", "That day's balance"),
          value: row.balanceMinutes === 0 ? "—" : sign(row.balanceMinutes),
          color: row.balanceMinutes < 0 ? "var(--critical)" : "var(--brand)",
        },
        {
          label: t("Birikimli bakiye", "Running balance"),
          value: sign(row.cumulativeMinutes),
          color: row.cumulativeMinutes < 0 ? "var(--critical)" : "var(--brand)",
        },
      ]}
    />
  );
}

/** Küçük destekleyici istatistik satırı. */
function MiniStat({
  label,
  value,
  tone = "default",
}: {
  label: React.ReactNode;
  value: string;
  tone?: "default" | "critical" | "success";
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-control border border-border bg-elevated px-3 py-2">
      <span className="font-body text-[10.5px] leading-snug text-fg-muted">{label}</span>
      <span
        className={cn(
          "font-mono text-[13.5px] font-semibold",
          tone === "critical" ? "text-critical" : tone === "success" ? "text-success" : "text-fg",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function PdksBalanceCard({ summary }: { summary: PdksSummary }) {
  const { t, lang } = useLang();
  const {
    workdayBalanceMinutes,
    extraShiftMinutes,
    totalInsideWorkdayMinutes,
    totalTargetMinutes,
    deficitDayCount,
    workdayCount,
    avgInsideMinutes,
    cumulative,
  } = summary;

  const isDeficit = workdayBalanceMinutes < 0;
  const signed = (n: number) => (n < 0 ? "−" : "+") + formatDuration(n, lang);

  const data: ChartRow[] = cumulative.map((c) => ({
    dateLabel: c.dateLabel,
    cumulativeMinutes: c.cumulativeMinutes,
    balanceMinutes: c.balanceMinutes,
  }));

  // Gradient kırılma noktası — eğrinin sıfırı kestiği yer.
  const values = data.map((d) => d.cumulativeMinutes);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const gradientOffset = max <= 0 ? 0 : min >= 0 ? 1 : max / (max - min);

  return (
    <Card className="flex flex-col gap-5">
      <SectionTitle
        hint={t(
          `Her iş günü turnike içinde ${formatDuration(DAILY_TARGET_MINUTES, "tr")} kalman bekleniyor. Bakiye, iş günlerinde turnike içinde geçirdiğin sürenin bu hedeften farkıdır; hafta sonu ve resmi tatil çalışması ayrı kalem olarak gösterilir.`,
          `You are expected to stay inside the turnstile for ${formatDuration(DAILY_TARGET_MINUTES, "en")} on every workday. The balance is the difference between your time inside on workdays and that target; weekend and public-holiday work is shown as a separate item.`,
        )}
        aside={
          <span className="shrink-0 rounded-pill bg-neutral/12 px-2.5 py-1 font-mono text-[11px] font-semibold text-fg-secondary">
            {formatNumber(workdayCount)} {t("iş günü", "workdays")}
          </span>
        }
      >
        <T tr="Aylık Mesai Bakiyen" en="Your Monthly Work-Hours Balance" />
      </SectionTitle>

      {/* Manşet rakam */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-4 rounded-card border px-5 py-4",
          isDeficit ? "border-critical/35 bg-critical/8" : "border-success/35 bg-success/8",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-control",
            isDeficit ? "bg-critical/14 text-critical" : "bg-success/14 text-success",
          )}
        >
          {isDeficit ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span
            className={cn(
              "font-mono text-[30px] font-bold leading-none",
              isDeficit ? "text-critical" : "text-success",
            )}
          >
            {signed(workdayBalanceMinutes)}
          </span>
          <span className="font-body text-[12px] text-fg-secondary">
            {isDeficit ? (
              <T
                tr={`Bu dönemde toplam ${formatDuration(Math.abs(workdayBalanceMinutes), "tr")} eksik mesain var.`}
                en={`You are ${formatDuration(Math.abs(workdayBalanceMinutes), "en")} short of your target this period.`}
              />
            ) : (
              <T
                tr={`Hedefin ${formatDuration(workdayBalanceMinutes, "tr")} üzerindesin.`}
                en={`You are ${formatDuration(workdayBalanceMinutes, "en")} above your target.`}
              />
            )}
          </span>
        </span>
        {deficitDayCount > 0 && (
          <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-pill bg-critical/12 px-2.5 py-1">
            <CalendarClock size={12} aria-hidden className="text-critical" />
            <span className="font-mono text-[11px] font-semibold text-critical">
              {formatNumber(deficitDayCount)} {t("gün eksik", "days short")}
            </span>
          </span>
        )}
      </div>

      {/* Destekleyici rakamlar */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <MiniStat
          label={<T tr="Beklenen toplam" en="Total expected" />}
          value={formatDuration(totalTargetMinutes, lang)}
        />
        <MiniStat
          label={<T tr="Turnike içi toplam" en="Total inside" />}
          value={formatDuration(totalInsideWorkdayMinutes, lang)}
        />
        <MiniStat
          label={<T tr="Günlük ortalama" en="Daily average" />}
          value={formatDuration(avgInsideMinutes, lang)}
          tone={avgInsideMinutes < DAILY_TARGET_MINUTES ? "critical" : "success"}
        />
        <MiniStat
          label={<T tr="Hafta sonu / tatil" en="Weekend / holiday" />}
          value={extraShiftMinutes > 0 ? `+${formatDuration(extraShiftMinutes, lang)}` : "—"}
          tone={extraShiftMinutes > 0 ? "success" : "default"}
        />
      </div>

      {/* Yayan bakiye grafiği */}
      <div className="flex flex-col gap-2">
        <span className="font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted">
          <T tr="Bakiyenin ay içindeki seyri" en="How your balance moved through the period" />
        </span>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="pdks-balance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={gradientOffset} stopColor="var(--brand)" stopOpacity={0.35} />
                  <stop offset={gradientOffset} stopColor="var(--critical)" stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="dateLabel"
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tickFormatter={(v: number) => `${Math.round(v / 60)}`}
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                width={34}
              />
              <ReferenceLine y={0} stroke="var(--fg-muted)" strokeWidth={1} />
              <Tooltip content={BalanceTooltip} cursor={{ stroke: "var(--border)" }} />
              <Area
                type="monotone"
                dataKey="cumulativeMinutes"
                stroke={workdayBalanceMinutes < 0 ? "var(--critical)" : "var(--brand)"}
                strokeWidth={2}
                fill="url(#pdks-balance)"
                animationDuration={DURATION.chart * 1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="font-body text-[10.5px] text-fg-muted">
          <T
            tr="Dikey eksen saat cinsindendir. Sıfır çizgisinin altı eksik, üstü fazla mesai."
            en="The vertical axis is in hours. Below the zero line is a deficit, above it a surplus."
          />
        </p>
      </div>
    </Card>
  );
}
