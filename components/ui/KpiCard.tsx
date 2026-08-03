"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRightLeft,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  Clock,
  Coffee,
  FileText,
  Handshake,
  Percent,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  Star,
  Target,
  Timer,
  TrendingUp,
  Undo2,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { AccentColor, Kpi, KpiDelta } from "@/lib/types/agent-data";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { useLang } from "@/components/i18n/LanguageProvider";
import {
  formatCurrencyEUR,
  formatNumber,
  formatPercent,
} from "@/lib/utils/format";
import { Card } from "./Card";
import { cn } from "@/lib/utils/cn";

/**
 * KPI kartı — modern düzen: sol üstte yumuşak zeminli ikon çipi, sağ üstte
 * "vs önceki dönem" delta rozeti (CLAUDE.md Bölüm 2), altta büyük mono değer
 * (3.2) + etiket. Count-up merkezi reduced-motion kontrolüne bağlı (3.4/3-7).
 */

const ICONS: Record<string, LucideIcon> = {
  "user-plus": UserPlus,
  "phone-call": PhoneCall,
  "phone-incoming": PhoneIncoming,
  "phone-missed": PhoneMissed,
  timer: Timer,
  "user-check": UserCheck,
  "file-text": FileText,
  handshake: Handshake,
  wallet: Wallet,
  "badge-check": BadgeCheck,
  undo: Undo2,
  "arrow-right-left": ArrowRightLeft,
  banknote: Banknote,
  star: Star,
  clock: Clock,
  percent: Percent,
  users: Users,
  activity: Activity,
  target: Target,
  "trending-up": TrendingUp,
  alert: AlertTriangle,
  coffee: Coffee,
  calendar: CalendarDays,
};

/** İkon çipi zeminleri — accent renginin yumuşak tonu (statik sınıflar). */
const ACCENT_CHIP: Record<AccentColor, string> = {
  brand: "bg-brand/12 text-brand",
  "brand-secondary": "bg-brand-secondary/14 text-brand-secondary",
  indigo: "bg-indigo/12 text-indigo",
  violet: "bg-violet/12 text-violet",
};

/** Üst accent şeridi renkleri. */
const ACCENT_BAR: Record<AccentColor, string> = {
  brand: "bg-brand",
  "brand-secondary": "bg-brand-secondary",
  indigo: "bg-indigo",
  violet: "bg-violet",
};

function formatValue(kpi: Kpi, animated: number): string {
  switch (kpi.format) {
    case "percent":
      return formatPercent(animated);
    case "currency":
      return formatCurrencyEUR(animated);
    case "ratio":
      // Pay count-up ile sayılır, payda sabit gösterilir.
      return `${formatNumber(Math.round(animated))}/${formatNumber(kpi.denominator ?? 0)}`;
    case "number":
    default:
      return formatNumber(Math.round(animated));
  }
}

function DeltaBadge({ delta }: { delta: KpiDelta }) {
  const { t } = useLang();
  const isGood = delta.positiveIsGood ? delta.value >= 0 : delta.value <= 0;
  const isUp = delta.value >= 0;
  const Arrow = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      title={t("Önceki döneme göre değişim", "Change vs. previous period")}
      className={cn(
        "flex items-center gap-0.5 rounded-pill px-1.5 py-0.5 font-mono text-[11px] font-medium",
        isGood ? "bg-success/12 text-success" : "bg-critical/12 text-critical",
      )}
    >
      <Arrow size={11} aria-hidden />
      {formatPercent(Math.abs(delta.value), 0)}
    </span>
  );
}

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const animated = useCountUp(kpi.value);
  const Icon = kpi.icon ? ICONS[kpi.icon] : undefined;
  const accent = kpi.accent ?? "brand";

  return (
    <Card
      hoverable
      className="relative flex min-h-[112px] flex-col gap-3 overflow-hidden p-4 sm:min-h-[128px] sm:gap-3.5 sm:p-5"
    >
      {/* Üst accent şeridi */}
      <span
        aria-hidden
        className={cn("absolute inset-x-0 top-0 h-1", ACCENT_BAR[accent])}
      />

      <div className="flex items-start justify-between gap-2 pt-1">
        {Icon ? (
          <span
            aria-hidden
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-control",
              ACCENT_CHIP[accent],
            )}
          >
            <Icon size={18} strokeWidth={2} />
          </span>
        ) : (
          <span />
        )}
        {kpi.delta && <DeltaBadge delta={kpi.delta} />}
      </div>

      <div className="mt-auto flex min-w-0 flex-col gap-1">
        <span className="truncate font-mono text-[22px] font-semibold leading-none tracking-tight text-fg sm:text-[26px] lg:text-[30px]">
          {formatValue(kpi, animated)}
        </span>
        <span className="font-body text-[12.5px] font-medium text-fg-secondary">
          {kpi.label}
        </span>
        {kpi.hint && (
          <span className="font-body text-[11px] leading-snug text-fg-muted">
            {kpi.hint}
          </span>
        )}
      </div>
    </Card>
  );
}
